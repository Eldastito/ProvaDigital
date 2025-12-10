
import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, Play, ArrowLeft, Wifi, Maximize, Save, LogOut, Database, Book, StickyNote, PanelRightClose, PanelRightOpen, FileText, ChevronRight, ChevronLeft, Send, Cloud } from 'lucide-react';
import { AppState, QuestionType } from '../../types';
import { saveSession, getStoredSessionsCount } from '../../services/offlineDb';

interface StudentAppProps {
  state: AppState;
  onBack: () => void;
}

export const StudentApp = ({ state, onBack }: StudentAppProps) => {
  // Extract Session ID from URL if present
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session') || 'DEMO-LOCAL';

  const [studentData, setStudentData] = useState<any>(null);
  const [step, setStep] = useState<'LOCKED_WAITING' | 'CONFIRM_IDENTITY' | 'EXAM' | 'SENDING' | 'COMPLETED'>('LOCKED_WAITING');
  const [storedSessions, setStoredSessions] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Scratchpad State
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchContent, setScratchContent] = useState('');
  const [officialContent, setOfficialContent] = useState(''); // Essay text
  const [answers, setAnswers] = useState<Record<string, string>>({}); // Store MC answers

  // MOCK ITEMS EXPANDED (4 Questions + 1 Essay)
  const mockItems = [
      { id: 'q1', type: QuestionType.MULTIPLE_CHOICE, statement: 'Qual é a capital do Brasil?', alternatives: [{id:'a', text:'Rio de Janeiro'}, {id:'b', text:'São Paulo'}, {id:'c', text:'Brasília'}, {id:'d', text:'Salvador'}] },
      { id: 'q2', type: QuestionType.MULTIPLE_CHOICE, statement: 'Quanto é 7 x 8?', alternatives: [{id:'a', text:'54'}, {id:'b', text:'56'}, {id:'c', text:'48'}, {id:'d', text:'64'}] },
      { id: 'q3', type: QuestionType.MULTIPLE_CHOICE, statement: 'Qual elemento químico é representado pela letra O?', alternatives: [{id:'a', text:'Ouro'}, {id:'b', text:'Osmium'}, {id:'c', text:'Oxigênio'}, {id:'d', text:'Prata'}] },
      { id: 'q4', type: QuestionType.MULTIPLE_CHOICE, statement: 'Quem pintou a Mona Lisa?', alternatives: [{id:'a', text:'Van Gogh'}, {id:'b', text:'Da Vinci'}, {id:'c', text:'Picasso'}, {id:'d', text:'Michelangelo'}] },
      { id: 'q5', type: QuestionType.REDACTION, statement: 'Redação: O impacto da inteligência artificial na educação do futuro.', minLines: 5, maxLines: 20, showWordCount: true }
  ];

  useEffect(() => {
      // Auto-unlock simulation
      getStoredSessionsCount().then(count => setStoredSessions(count));
      setTimeout(() => {
          setStudentData({
              id: 'st_demo',
              name: 'Aluno Visitante',
              reg: Math.floor(Math.random() * 9000) + 1000,
              examTitle: 'Avaliação de Demonstração',
              duration: 30,
              eventId: sessionId
          });
          setStep('CONFIRM_IDENTITY');
      }, 2500);
  }, []);

  const confirmIdentity = () => {
      // Try fullscreen for immersion, catch error if user doesn't interact
      try {
          if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(() => {});
          }
      } catch(e) {}
      setStep('EXAM');
  };

  const handleOptionSelect = (qId: string, optId: string) => {
      setAnswers(prev => ({...prev, [qId]: optId}));
  };

  const handleFinishExam = async () => {
      if (!confirm("Tem certeza que deseja entregar sua prova?")) return;
      
      setStep('SENDING');

      // Simulate Processing
      await new Promise(resolve => setTimeout(resolve, 1500)); // Encrypting...
      await new Promise(resolve => setTimeout(resolve, 1500)); // Uploading...
      
      const sessionData = { answers: { ...answers, q5: officialContent }, timestamp: new Date().toISOString() };
      
      // Save locally just in case
      await saveSession({
          sessionId: `sess_${Date.now()}`,
          studentId: studentData.id,
          studentName: studentData.name,
          eventId: studentData.eventId,
          encryptedData: btoa(JSON.stringify(sessionData)),
          timestamp: new Date().toISOString(),
          synced: true // Mark as synced for demo
      });

      setStep('COMPLETED');
  };

  const resetDemo = () => {
      window.location.reload();
  };

  // Calculate counts
  const getCounts = (text: string) => {
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      return { words, chars };
  };

  // --- VIEWS ---

  if (step === 'LOCKED_WAITING') {
      return (
          <div className="h-[100dvh] bg-[#0f1d2e] flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="absolute top-4 right-4 flex items-center gap-2 text-slate-500 text-xs font-mono">
                  <Wifi size={12} className="text-emerald-500 animate-pulse"/> Conectado: {sessionId}
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-slate-700 flex items-center justify-center mb-6 animate-pulse bg-slate-800">
                  <Lock size={32} className="text-slate-400"/>
              </div>
              <h2 className="text-xl font-bold">Aguardando Professor</h2>
              <p className="text-slate-400 mt-2 text-sm max-w-xs">O dispositivo está conectado à sala. A prova iniciará automaticamente.</p>
          </div>
      );
  }

  if (step === 'CONFIRM_IDENTITY') {
      return (
          <div className="h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <FileText size={32} className="text-brand-primary"/>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Prova Recebida!</h1>
              <p className="text-slate-500 text-sm mb-6">Sessão: <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded">{sessionId}</span></p>
              
              <div className="bg-slate-50 p-4 rounded-xl w-full max-w-sm mb-8 border border-slate-200">
                  <div className="text-sm text-slate-500 uppercase font-bold mb-1">Candidato</div>
                  <div className="text-lg font-bold text-slate-900">{studentData.name}</div>
                  <div className="text-sm text-slate-600">Matrícula: {studentData.reg}</div>
              </div>

              <button onClick={confirmIdentity} className="w-full max-w-sm py-4 bg-brand-primary text-white font-bold rounded-xl text-lg hover:bg-brand-dark transition shadow-lg flex items-center justify-center gap-2">
                  <Play size={20} fill="white"/> Iniciar Prova
              </button>
          </div>
      );
  }

  if (step === 'SENDING') {
      return (
          <div className="h-[100dvh] bg-[#0f1d2e] flex flex-col items-center justify-center text-white p-8 text-center">
              <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-slate-700 rounded-full"></div>
                  <div className="w-24 h-24 border-4 border-emerald-500 rounded-full border-t-transparent absolute top-0 left-0 animate-spin"></div>
                  <Cloud size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500"/>
              </div>
              <h2 className="text-xl font-bold mb-2">Enviando Respostas...</h2>
              <p className="text-slate-400 text-sm">Sincronizando com o servidor do Professor.</p>
              
              <div className="mt-8 space-y-2 text-xs text-left font-mono text-slate-500 w-full max-w-xs">
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-500"/> Criptografando dados (AES-256)</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-500"/> Compactando pacotes</div>
                  <div className="flex items-center gap-2 text-emerald-300 animate-pulse"><ArrowLeft size={10}/> Upload em progresso...</div>
              </div>
          </div>
      );
  }

  if (step === 'COMPLETED') {
      return (
          <div className="h-[100dvh] bg-emerald-600 flex flex-col items-center justify-center text-white p-8 text-center animate-in zoom-in">
              <div className="w-24 h-24 bg-white text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <CheckCircle size={48}/>
              </div>
              <h1 className="text-3xl font-black mb-2">Sucesso!</h1>
              <p className="text-emerald-100 text-lg mb-8">Sua prova foi entregue e a correção automática foi iniciada.</p>
              
              <div className="bg-white/10 p-4 rounded-xl w-full max-w-xs mb-8 backdrop-blur-sm">
                  <p className="text-sm font-bold text-emerald-100 uppercase mb-1">Hash de Integridade</p>
                  <p className="font-mono text-xs break-all text-white opacity-80">{btoa(studentData.id + Date.now()).substring(0, 20)}...</p>
              </div>

              <button onClick={resetDemo} className="text-white underline text-sm opacity-70 hover:opacity-100">
                  Reiniciar Demo
              </button>
          </div>
      );
  }

  // --- EXAM VIEW (RESPONSIVE) ---
  if (step === 'EXAM') {
      const item = mockItems[currentQuestionIdx];
      const counts = getCounts(officialContent);
      const isLast = currentQuestionIdx === mockItems.length - 1;

      return (
          <div className="h-[100dvh] flex flex-col bg-slate-50 overflow-hidden">
              {/* Header Mobile */}
              <div className="bg-[#0f1d2e] text-white p-3 flex justify-between items-center shadow-md flex-shrink-0 z-20">
                  <div className="text-sm font-bold truncate max-w-[120px]">{studentData.name}</div>
                  <div className="flex items-center gap-3">
                      <div className="text-xs text-slate-400">Q. {currentQuestionIdx + 1}/{mockItems.length}</div>
                      <div className="bg-slate-800 px-2 py-1 rounded font-mono text-xs border border-slate-700 text-emerald-400">28:45</div>
                  </div>
              </div>
              
              {/* Question Content */}
              <div className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-4">
                      <h2 className="text-lg font-semibold text-slate-800 mb-6 leading-snug">{item.statement}</h2>
                      
                      {/* Multiple Choice Render */}
                      {(item.type === QuestionType.MULTIPLE_CHOICE) && (
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
                                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-300 text-slate-400'}`}>
                                                  {alt.id.toUpperCase()}
                                              </div>
                                              <span className="font-medium">{alt.text}</span>
                                          </div>
                                      </button>
                                  );
                              })}
                          </div>
                      )}

                      {/* Essay Render */}
                      {(item.type === QuestionType.REDACTION) && (
                          <div className="flex flex-col h-[60vh]">
                              <div className="flex justify-between text-xs text-slate-500 mb-2 font-bold uppercase">
                                  <span>Folha de Redação</span>
                                  <span>{counts.words} palavras</span>
                              </div>
                              <textarea 
                                  className="flex-1 w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-base leading-relaxed outline-none focus:border-brand-primary focus:bg-white transition resize-none"
                                  placeholder="Digite sua redação aqui..."
                                  value={officialContent}
                                  onChange={(e) => setOfficialContent(e.target.value)}
                              />
                          </div>
                      )}
                  </div>
              </div>

              {/* Fixed Bottom Navigation */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-pb">
                  <button 
                    onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="p-3 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                      <ChevronLeft size={24}/>
                  </button>

                  {/* Dynamic Action Button */}
                  {isLast ? (
                      <button 
                        onClick={handleFinishExam}
                        className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition flex items-center gap-2"
                      >
                          Finalizar <CheckCircle size={18}/>
                      </button>
                  ) : (
                      <button 
                        onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                        className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-sky-200 active:scale-95 transition flex items-center gap-2"
                      >
                          Próxima <ChevronRight size={18}/>
                      </button>
                  )}
              </div>
          </div>
      );
  }

  return null;
};
