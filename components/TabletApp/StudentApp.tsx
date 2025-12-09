
import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, Play, ArrowLeft, Wifi, Maximize, Save, LogOut, Database, Book, StickyNote, PanelRightClose, PanelRightOpen, FileText } from 'lucide-react';
import { AppState, QuestionType } from '../../types';
import { saveSession, getStoredSessionsCount } from '../../services/offlineDb';

interface StudentAppProps {
  state: AppState;
  onBack: () => void;
}

export const StudentApp = ({ state, onBack }: StudentAppProps) => {
  // Mocking reception from Launcher
  const [studentData, setStudentData] = useState<any>(null);
  const [step, setStep] = useState<'LOCKED_WAITING' | 'CONFIRM_IDENTITY' | 'EXAM'>('LOCKED_WAITING');
  const [storedSessions, setStoredSessions] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Scratchpad State
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchContent, setScratchContent] = useState('');
  const [officialContent, setOfficialContent] = useState(''); // Store essay text

  // Mock Items for Demo (In real app, decrypted from package)
  // Added showWordCount property to mock item
  const mockItems = [
      { id: 'q1', type: QuestionType.MULTIPLE_CHOICE, statement: 'Quem descobriu o Brasil?', alternatives: [{text: 'Pedro Álvares Cabral'}, {text: 'Cristóvão Colombo'}] },
      { id: 'q2', type: QuestionType.REDACTION, statement: 'Redação: O impacto da tecnologia na educação.', minLines: 10, maxLines: 20, showWordCount: true }
  ];

  useEffect(() => {
      getStoredSessionsCount().then(count => setStoredSessions(count));
      setTimeout(() => {
          setStudentData({
              id: 'st_1',
              name: 'João Pedro da Silva',
              reg: '2024001',
              examTitle: 'Avaliação de História',
              duration: 60,
              eventId: 'evt_001'
          });
          setStep('CONFIRM_IDENTITY');
      }, 3000);
  }, []);

  const confirmIdentity = () => {
      if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
      }
      setStep('EXAM');
  };

  const handleFinishExam = async () => {
      if (!confirm("Finalizar prova e realizar logoff?")) return;
      const sessionData = { answers: { q1: 'A', q2: officialContent }, timestamp: new Date().toISOString() };
      const encryptedBlob = btoa(JSON.stringify(sessionData));
      await saveSession({
          sessionId: `sess_${Date.now()}`,
          studentId: studentData.id,
          studentName: studentData.name,
          eventId: studentData.eventId,
          encryptedData: encryptedBlob,
          timestamp: new Date().toISOString(),
          synced: false
      });
      document.exitFullscreen().catch(() => {});
      setStudentData(null);
      setOfficialContent('');
      setScratchContent('');
      setStep('LOCKED_WAITING');
      const count = await getStoredSessionsCount();
      setStoredSessions(count);
      alert("Prova finalizada com segurança! Tablet pronto para o próximo aluno.");
  };

  // Calculate counts
  const getCounts = (text: string) => {
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      return { words, chars };
  };

  if (step === 'LOCKED_WAITING') {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white relative">
              <div className="absolute top-4 right-4 flex items-center gap-2 text-slate-600 text-xs font-mono">
                  <Database size={12}/> {storedSessions} sessões criptografadas
              </div>
              <div className="w-32 h-32 rounded-full border-4 border-slate-700 flex items-center justify-center mb-8 animate-pulse">
                  <Lock size={48} className="text-slate-500"/>
              </div>
              <h2 className="text-2xl font-bold">Tablet Bloqueado</h2>
              <p className="text-slate-400 mt-2">Aguardando ativação pelo Professor...</p>
          </div>
      );
  }

  if (step === 'CONFIRM_IDENTITY') {
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Lock size={40} className="text-slate-400"/>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Você é {studentData.name}?</h1>
              <p className="text-slate-500 text-lg mb-8">Matrícula: <span className="font-mono font-bold text-slate-700">{studentData.reg}</span></p>
              <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                  <button onClick={confirmIdentity} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl text-lg hover:bg-emerald-700 transition shadow-lg flex items-center justify-center gap-2">
                      <CheckCircle/> Sim, sou eu. Iniciar.
                  </button>
                  <button onClick={() => { setStudentData(null); setStep('LOCKED_WAITING'); }} className="w-full py-4 bg-white border-2 border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50">
                      Não, devolver tablet.
                  </button>
              </div>
          </div>
      );
  }

  if (step === 'EXAM') {
      const item = mockItems[currentQuestionIdx];
      const counts = getCounts(officialContent);

      return (
          <div className="min-h-screen bg-slate-100 flex flex-col overflow-hidden">
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md flex-shrink-0 z-20">
                  <div className="font-bold">{studentData.name}</div>
                  <div className="flex items-center gap-4">
                      <div className="text-sm text-slate-400">Questão {currentQuestionIdx + 1} de {mockItems.length}</div>
                      <div className="bg-slate-800 px-3 py-1 rounded font-mono">59:00</div>
                  </div>
              </div>
              
              <div className="flex-1 flex relative overflow-hidden">
                  {/* MAIN EXAM AREA */}
                  <div className="flex-1 flex flex-col p-6 overflow-y-auto w-full transition-all duration-300">
                      {/* Question Card */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0">
                          <h2 className="text-lg font-medium text-slate-800 mb-6">{item.statement}</h2>
                          
                          {(item.type === QuestionType.ESSAY || item.type === QuestionType.REDACTION) ? (
                              <div className="flex-1 flex flex-col min-h-0">
                                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase flex justify-between items-end">
                                      <span>Folha de Resposta</span>
                                      <div className="flex gap-4">
                                          {item.showWordCount && (
                                              <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                  {counts.words} palavras | {counts.chars} caracteres
                                              </span>
                                          )}
                                          <span>Min: {item.minLines || 0} | Max: {item.maxLines || 30} linhas</span>
                                      </div>
                                  </div>
                                  
                                  {/* NOTEBOOK VISUAL */}
                                  <div className="flex-1 bg-white border border-slate-300 shadow-inner flex relative overflow-hidden rounded-md">
                                      {/* Numbers + Red Margin */}
                                      <div className="w-10 bg-slate-50 flex-shrink-0 flex flex-col items-center pt-1 border-r-2 border-red-400/60 text-slate-400 font-mono text-sm select-none leading-[32px]">
                                          {Array.from({length: item.maxLines || 30}).map((_, i) => (
                                              <div key={i} style={{height: '32px'}}>{i+1}</div>
                                          ))}
                                      </div>
                                      
                                      {/* Lines + Textarea */}
                                      <div className="flex-1 relative overflow-y-auto custom-scrollbar h-full">
                                          <div 
                                              className="absolute inset-0 pointer-events-none"
                                              style={{
                                                  backgroundImage: 'linear-gradient(transparent 31px, #cbd5e1 32px)',
                                                  backgroundSize: '100% 32px',
                                                  marginTop: '0px'
                                              }}
                                          ></div>
                                          <textarea 
                                              className="w-full h-full bg-transparent outline-none resize-none p-0 pl-3 text-slate-800 text-lg leading-[32px] font-sans relative z-10"
                                              placeholder="Comece a escrever sua redação oficial aqui..."
                                              style={{ lineHeight: '32px' }}
                                              value={officialContent}
                                              onChange={(e) => setOfficialContent(e.target.value)}
                                              spellCheck={false}
                                          />
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="space-y-3">
                                  {item.alternatives?.map((alt: any, idx: number) => (
                                      <button key={idx} className="w-full text-left p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition font-medium text-slate-700">
                                          {alt.text}
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>

                      {/* Footer Nav */}
                      <div className="mt-6 flex justify-between items-center">
                          <button 
                            onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                            disabled={currentQuestionIdx === 0}
                            className="px-6 py-3 rounded-lg bg-white border border-slate-300 font-bold text-slate-600 disabled:opacity-50"
                          >
                              Anterior
                          </button>
                          
                          {/* SCRATCHPAD TOGGLE */}
                          {(item.type === QuestionType.ESSAY || item.type === QuestionType.REDACTION) && (
                              <button 
                                onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
                                className={`px-4 py-3 rounded-lg font-bold shadow-sm flex items-center gap-2 transition ${isScratchpadOpen ? 'bg-yellow-200 text-yellow-800 border border-yellow-300' : 'bg-white border border-slate-300 text-slate-600 hover:bg-yellow-50'}`}
                              >
                                  <StickyNote size={18}/> {isScratchpadOpen ? 'Fechar Rascunho' : 'Abrir Rascunho'}
                              </button>
                          )}
                          
                          {currentQuestionIdx < mockItems.length - 1 ? (
                              <button 
                                onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                                className="px-6 py-3 rounded-lg bg-brand-primary text-white font-bold shadow-md hover:bg-brand-dark"
                              >
                                  Próxima
                              </button>
                          ) : (
                              <button 
                                onClick={handleFinishExam}
                                className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-bold shadow-md hover:bg-emerald-700 flex items-center gap-2"
                              >
                                  <Save size={18}/> Entregar Prova
                              </button>
                          )}
                      </div>
                  </div>

                  {/* SIDE SCRATCHPAD PANEL */}
                  <div 
                    className={`bg-yellow-50 border-l-2 border-yellow-200 shadow-xl transition-all duration-300 ease-in-out flex flex-col z-10 ${isScratchpadOpen ? 'w-[400px] translate-x-0' : 'w-0 translate-x-full opacity-0'}`}
                  >
                      <div className="p-4 bg-yellow-100 border-b border-yellow-200 flex justify-between items-center text-yellow-800">
                          <h3 className="font-bold flex items-center gap-2"><StickyNote size={18}/> Bloco de Rascunho</h3>
                          <button onClick={() => setIsScratchpadOpen(false)}><PanelRightClose size={18}/></button>
                      </div>
                      <div className="p-2 bg-yellow-50 text-xs text-yellow-700 border-b border-yellow-200 text-center">
                          Este texto não será avaliado. Use para tópicos e ideias.
                      </div>
                      <textarea 
                          className="flex-1 w-full bg-transparent p-4 text-slate-800 outline-none resize-none font-handwriting text-lg leading-relaxed"
                          placeholder="Digite suas ideias, tópicos ou rascunho aqui..."
                          value={scratchContent}
                          onChange={(e) => setScratchContent(e.target.value)}
                          spellCheck={false}
                          style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }} // Mock handwriting font
                      />
                      <div className="p-2 bg-yellow-100 border-t border-yellow-200 text-xs text-right text-yellow-700">
                          {scratchContent.length} caracteres (livre)
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return null;
};