
import React, { useState, useEffect, useRef } from 'react';
import { Lock, CheckCircle, Play, Wifi, PenTool, Eraser, ChevronRight, ChevronLeft, ShieldCheck, Cloud } from 'lucide-react';
import { AppState, QuestionType } from '../../types';
import { supabase } from '../../services/supabaseClient'; // Import Real Client
import { uuidv4 } from '../../utils/helpers';

interface StudentAppProps {
  state: AppState;
  onBack: () => void;
}

export const StudentApp = ({ state, onBack }: StudentAppProps) => {
  const params = new URLSearchParams(window.location.search);
  // Pega parâmetros reais do QR Code gerado pelo Lobby
  const classIdParam = params.get('classId');
  const examIdParam = params.get('examId');
  const sessionMode = classIdParam ? 'LIVE_REAL' : 'DEMO_LOCAL';

  const [studentData, setStudentData] = useState<any>(null);
  const [step, setStep] = useState<'LOGIN_FORM' | 'CONFIRM_IDENTITY' | 'EXAM_COVER' | 'EXAM' | 'SENDING' | 'COMPLETED'>('LOGIN_FORM');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Login State
  const [inputName, setInputName] = useState('');
  const [joining, setJoining] = useState(false);

  // Scratchpad State
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [officialContent, setOfficialContent] = useState(''); // Essay

  // QUESTÕES DEMO ATUALIZADAS (Tech & Lógica)
  const mockItems = [
      { id: 'q1', type: QuestionType.MULTIPLE_CHOICE, statement: 'Tech: Qual destas linguagens é usada para estilizar páginas web?', alternatives: [{id:'a', text:'HTML'}, {id:'b', text:'Python'}, {id:'c', text:'CSS'}, {id:'d', text:'Java'}] },
      { id: 'q2', type: QuestionType.MULTIPLE_CHOICE, statement: 'Lógica: O pai de Maria tem 5 filhas: Lalá, Lelé, Lili, Loló e...?', alternatives: [{id:'a', text:'Lulu'}, {id:'b', text:'Maria'}, {id:'c', text:'Joana'}, {id:'d', text:'Laura'}] },
      { id: 'q3', type: QuestionType.MULTIPLE_CHOICE, statement: 'Cultura: O que significa a sigla "IA"?', alternatives: [{id:'a', text:'Internet Aberta'}, {id:'b', text:'Inteligência Artificial'}, {id:'c', text:'Interação Avançada'}, {id:'d', text:'Inovação Atual'}] },
  ];

  // --- ACTIONS ---

  const handleJoinClass = async () => {
      if (!inputName.trim()) return alert("Digite seu nome.");
      setJoining(true);

      try {
          if (sessionMode === 'LIVE_REAL' && classIdParam) {
              // 1. Salvar Aluno no Banco (Isso dispara o Realtime no Lobby do Professor)
              const studentId = uuidv4();
              const regNum = Math.floor(Math.random() * 9000) + 1000;
              
              const { error } = await supabase.from('students').insert({
                  id: studentId,
                  name: inputName,
                  registration_number: regNum.toString(),
                  class_id: classIdParam,
                  school_id: 's1', // Fixo demo
                  tenant_id: 't1' // Fixo demo
              });

              if (error) throw error;

              setStudentData({
                  id: studentId,
                  name: inputName,
                  reg: regNum,
                  examTitle: 'Prova Ao Vivo',
                  roleTitle: 'Participante',
                  eventId: classIdParam,
                  examId: examIdParam
              });
          } else {
              // Modo Local (Fallback)
              setStudentData({
                  id: 'local_' + Date.now(),
                  name: inputName,
                  reg: '1234',
                  examTitle: 'Demo Local',
                  roleTitle: 'Visitante',
                  eventId: 'local'
              });
          }
          setStep('CONFIRM_IDENTITY');
      } catch (e: any) {
          console.error(e);
          alert("Erro ao entrar na sala: " + e.message);
      } finally {
          setJoining(false);
      }
  };

  const handleOptionSelect = (qId: string, optId: string) => {
      setAnswers(prev => ({...prev, [qId]: optId}));
  };

  const handleFinishExam = async () => {
      if (!confirm("Tem certeza que deseja entregar sua prova?")) return;
      setStep('SENDING');
      
      try {
          if (sessionMode === 'LIVE_REAL' && studentData) {
              // Converter respostas para formato simples
              const formattedAnswers = Object.keys(answers).map(qId => ({
                  itemId: qId,
                  selectedAlternativeId: answers[qId]
              }));

              // Salvar no Banco
              const { error } = await supabase.from('exam_results').insert({
                  id: uuidv4(),
                  exam_id: studentData.examId,
                  student_id: studentData.id,
                  answers: formattedAnswers,
                  total_score: Math.floor(Math.random() * 10), // Mock score calc no cliente para demo
                  graded_at: new Date().toISOString(),
                  security_flags: []
              });

              if (error) console.error("Erro ao salvar resultado:", error); // Log only, don't block demo flow
          }
          
          await new Promise(resolve => setTimeout(resolve, 1500)); // Fake network delay visual
          setStep('COMPLETED');

      } catch (e) {
          console.error(e);
          alert("Erro no envio. Tentando novamente...");
          setStep('EXAM');
      }
  };

  const item = mockItems[currentQuestionIdx];
  const isLast = currentQuestionIdx === mockItems.length - 1;

  // --- RENDERERS ---

  if (step === 'LOGIN_FORM') {
      return (
          <div className="fixed inset-0 bg-[#0f1d2e] flex flex-col items-center justify-center p-6 text-center z-50">
              <div className="w-full max-w-md">
                  <div className="mb-8">
                      <Wifi size={48} className="text-emerald-400 mx-auto mb-4 animate-pulse"/>
                      <h1 className="text-2xl font-bold text-white">Conectar à Turma</h1>
                      <p className="text-slate-400 text-sm mt-2">
                          {sessionMode === 'LIVE_REAL' ? 'Sessão Ao Vivo Detectada' : 'Modo Demonstração Local'}
                      </p>
                  </div>

                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
                      <div>
                          <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-1">Seu Nome Completo</label>
                          <input 
                              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:border-brand-primary outline-none"
                              placeholder="Ex: João Silva"
                              value={inputName}
                              onChange={e => setInputName(e.target.value)}
                          />
                      </div>
                      <button 
                          onClick={handleJoinClass}
                          disabled={joining}
                          className="w-full py-4 bg-brand-primary text-white font-bold rounded-xl text-lg hover:bg-brand-dark transition shadow-lg disabled:opacity-50"
                      >
                          {joining ? 'Entrando...' : 'Entrar na Sala'}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (step === 'CONFIRM_IDENTITY') {
      return (
          <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-50">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg text-emerald-600">
                  <CheckCircle size={32}/>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Bem-vindo(a), {studentData.name.split(' ')[0]}!</h1>
              <p className="text-slate-500 text-sm mb-8">Sua presença foi confirmada no painel do professor.</p>
              
              <button onClick={() => setStep('EXAM')} className="w-full max-w-sm py-4 bg-brand-primary text-white font-bold rounded-xl text-lg hover:bg-brand-dark transition shadow-lg flex items-center justify-center gap-3">
                  <Play size={20} fill="white"/> Iniciar Prova
              </button>
          </div>
      );
  }

  if (step === 'COMPLETED') {
      return (
          <div className="fixed inset-0 bg-emerald-600 flex flex-col items-center justify-center text-white p-8 text-center animate-in zoom-in z-50 overflow-hidden">
              {/* CSS Confetti Effect */}
              {[...Array(20)].map((_, i) => (
                  <div key={i} className="absolute w-2 h-2 bg-white rounded-full opacity-0 animate-[confetti_3s_ease-out_infinite]" 
                       style={{
                           left: `${Math.random() * 100}%`,
                           top: `-10px`,
                           animationDelay: `${Math.random() * 2}s`,
                           backgroundColor: ['#FFD700', '#FF69B4', '#00FFFF', '#FFFFFF'][Math.floor(Math.random() * 4)]
                       }}>
                  </div>
              ))}
              <style>{`
                  @keyframes confetti {
                      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                  }
              `}</style>

              <div className="w-24 h-24 bg-white text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl z-10 animate-bounce">
                  <CheckCircle size={48} strokeWidth={3}/>
              </div>
              <h1 className="text-4xl font-black mb-2 tracking-tight z-10">Prova Enviada!</h1>
              <p className="text-emerald-100 text-lg mb-8 z-10">Suas respostas foram salvas com segurança.</p>
              <div className="bg-emerald-700/50 p-4 rounded-xl border border-emerald-500/50 text-sm z-10 backdrop-blur-sm">
                  <p>Você já pode fechar esta janela ou aguardar o resultado no telão.</p>
              </div>
          </div>
      );
  }

  if (step === 'SENDING') {
      return (
          <div className="fixed inset-0 bg-[#0f1d2e] flex flex-col items-center justify-center text-white p-8 text-center z-50">
              <div className="relative mb-12">
                  <div className="w-24 h-24 border-4 border-slate-700 rounded-full"></div>
                  <div className="w-24 h-24 border-4 border-emerald-500 rounded-full border-t-transparent absolute top-0 left-0 animate-spin"></div>
                  <Cloud size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500"/>
              </div>
              <div className="space-y-4 w-full max-w-xs text-left">
                  <div className="flex items-center gap-3 text-emerald-400 animate-in slide-in-from-left duration-500">
                      <CheckCircle size={16}/> <span>Sincronizando Respostas...</span>
                  </div>
              </div>
          </div>
      );
  }

  // --- EXAM UI ---
  return (
      <div className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden font-sans">
          <div className="bg-[#0f1d2e] text-white h-14 flex justify-between items-center px-4 shadow-md flex-shrink-0 z-20">
              <div className="text-sm font-bold truncate max-w-[120px]">{studentData.name}</div>
              <div className="bg-slate-800 px-2 py-1 rounded font-mono text-xs border border-slate-700 text-emerald-400">Ao Vivo</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth">
              <div className="max-w-2xl mx-auto">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mb-6 overflow-hidden">
                      <div className="bg-brand-primary h-full transition-all duration-300" style={{ width: `${((currentQuestionIdx + 1) / mockItems.length) * 100}%` }}></div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-4 relative overflow-hidden">
                      <span className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Questão {currentQuestionIdx + 1}</span>
                      <h2 className="text-lg font-semibold text-slate-800 mb-6 leading-snug mt-2">{item.statement}</h2>
                      
                      <div className="space-y-3">
                          {item.alternatives?.map((alt: any) => {
                              const isSelected = answers[item.id] === alt.id;
                              return (
                                  <button 
                                      key={alt.id} 
                                      onClick={() => handleOptionSelect(item.id, alt.id)}
                                      className={`w-full text-left p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${isSelected ? 'border-brand-primary bg-brand-light/30 text-brand-dark shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-300 text-slate-400'}`}>
                                              {alt.id.toUpperCase()}
                                          </div>
                                          <span className="font-medium">{alt.text}</span>
                                      </div>
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 safe-area-pb">
              <button 
                onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                disabled={currentQuestionIdx === 0}
                className="p-3 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                  <ChevronLeft size={28}/>
              </button>

              {isLast ? (
                  <button 
                    onClick={handleFinishExam}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition flex items-center gap-2 text-lg"
                  >
                      Entregar <CheckCircle size={20}/>
                  </button>
              ) : (
                  <button 
                    onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                    className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-sky-200 active:scale-95 transition flex items-center gap-2 text-lg"
                  >
                      Próxima <ChevronRight size={20}/>
                  </button>
              )}
          </div>
      </div>
  );
};
