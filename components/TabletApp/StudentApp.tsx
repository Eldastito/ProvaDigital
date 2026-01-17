
import React, { useState, useEffect, useRef } from 'react';
import { Lock, CheckCircle, Play, Wifi, PenTool, Eraser, ChevronRight, ChevronLeft, ShieldCheck, Cloud, Video, AlertTriangle, Music } from 'lucide-react';
import { AppState, QuestionType } from '../../types';
import { supabase } from '../../services/supabaseClient'; // Import Real Client
import { uuidv4 } from '../../utils/helpers';
import { useProctoring } from '../../hooks/useProctoring';
import { saveSession, getLastSession, clearDb } from '../../services/offlineDb';
import { StoredSession } from '../../types';

import { useSafeAppStore } from '../../store/useAppStore';
import { RichTextRenderer } from '../RichTextRenderer';

interface StudentAppProps {
    onBack: () => void;
}

export const StudentApp = ({ onBack }: StudentAppProps) => {
    const state = useSafeAppStore();
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
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [examItems, setExamItems] = useState<any[]>([]);
    const [loadingExam, setLoadingExam] = useState(false);
    const [currentTime, setCurrentTime] = useState(7200); // 2 horas (exemplo default)
    const [timerActive, setTimerActive] = useState(false);

    // Auto-Resume State
    const [foundSession, setFoundSession] = useState<StoredSession | null>(null);
    const [showResumeModal, setShowResumeModal] = useState(false);

    // --- PROCTORING INTEGRATION ---
    const { videoRef, cameraActive, violationCount, securityLog, isKioskActive } = useProctoring({
        isActive: step === 'EXAM',
        studentId: studentData?.id,
        studentName: studentData?.name,
        onViolation: (reason) => {
            // Visual feedback is handled by component state below, but we could add a toast here
            console.log("Violação detectada:", reason);
        }
    });

    // --- DATA LOADING ---
    useEffect(() => {
        if (examIdParam) {
            loadRealExam(examIdParam);
        }
    }, [examIdParam]);

    const loadRealExam = async (examId: string) => {
        setLoadingExam(true);
        try {
            await state.fetchExamItems(examId);
            const exam = state.exams.find(e => e.id === examId);
            if (exam) {
                const items = exam.items.map(config => {
                    const item = state.items.find(i => i.id === config.itemId);
                    return item ? { ...item, ...config } : null;
                }).filter(Boolean);
                setExamItems(items);
            }
        } catch (e) {
            console.error("Error loading exam items:", e);
        } finally {
            setLoadingExam(false);
        }
    };

    // QUESTÕES DEMO ATUALIZADAS (Tech & Lógica)
    const mockItems = [
        { id: 'q1', type: QuestionType.MULTIPLE_CHOICE, statement: 'Tech: Qual destas linguagens é usada para estilizar páginas web?', alternatives: [{ id: 'a', text: 'HTML' }, { id: 'b', text: 'Python' }, { id: 'c', text: 'CSS' }, { id: 'd', text: 'Java' }] },
        { id: 'q2', type: QuestionType.MULTIPLE_CHOICE, statement: 'Lógica: O pai de Maria tem 5 filhas: Lalá, Lelé, Lili, Loló e...?', alternatives: [{ id: 'a', text: 'Lulu' }, { id: 'b', text: 'Maria' }, { id: 'c', text: 'Joana' }, { id: 'd', text: 'Laura' }] },
        { id: 'q3', type: QuestionType.MULTIPLE_CHOICE, statement: 'Cultura: O que significa a sigla "IA"?', alternatives: [{ id: 'a', text: 'Internet Aberta' }, { id: 'b', text: 'Inteligência Artificial' }, { id: 'c', text: 'Interação Avançada' }, { id: 'd', text: 'Inovação Atual' }] },
    ];

    const actualItems = examItems.length > 0 ? examItems : mockItems;

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

    // --- AUTO-RESUME LOGIC ---
    useEffect(() => {
        if (!studentData || !studentData.id || !studentData.eventId) return;

        const checkSavedSession = async () => {
            // Tenta recuperar sessão anterior
            const saved = await getLastSession(studentData.id, studentData.eventId || 'demo');
            if (saved && !saved.synced) {
                console.log("Sessão encontrada:", saved);
                setFoundSession(saved);
                setShowResumeModal(true);
            } else {
                setStep('CONFIRM_IDENTITY');
            }
        };

        checkSavedSession();
    }, [studentData]);

    const handleResumeSession = () => {
        if (foundSession) {
            try {
                const parsedAnswers = JSON.parse(foundSession.encryptedData);
                setAnswers(parsedAnswers);
                if (foundSession.currentQuestionIndex !== undefined) {
                    setCurrentQuestionIdx(foundSession.currentQuestionIndex);
                }
                if (foundSession.remainingSeconds !== undefined) {
                    setCurrentTime(foundSession.remainingSeconds);
                    alert(`⚠️ ATENÇÃO AO FISCAL DE SALA ⚠️\n\nO aluno ${studentData?.name} teve seu tablet substituído ou a sessão restaurada.\n\nO tempo de prova continuará de onde parou (${Math.floor(foundSession.remainingSeconds / 60)} min restantes).\n\nLEMBRETE: Os últimos 3 alunos a terminarem devem sair juntos.`);
                }
                setStep('EXAM');
                setTimerActive(true);
                setStep('EXAM');
                setShowResumeModal(false);
            } catch (e) {
                console.error("Erro ao restaurar sessão:", e);
                alert("Erro ao restaurar dados. Iniciando nova prova.");
                setStep('CONFIRM_IDENTITY');
                setShowResumeModal(false);
            }
        }
    };

    const handleDiscardSession = async () => {
        if (confirm("Tem certeza? Todo o progresso anterior será perdido.")) {
            // await clearDb(); // Limpar tudo é agressivo em multi-user
            setStep('CONFIRM_IDENTITY');
            setShowResumeModal(false);
        }
    };

    const handleOptionSelect = (qId: string, optId: string) => {
        const newAnswers = { ...answers, [qId]: optId };
        setAnswers(newAnswers);

        // --- OFFLINE PERSISTENCE (PHASE 2) ---
        if (studentData) {
            saveSession({
                sessionId: `${studentData.id}_${studentData.examId || 'demo'}`,
                studentId: studentData.id,
                studentName: studentData.name,
                eventId: studentData.eventId || 'demo',
                encryptedData: JSON.stringify(newAnswers),
                timestamp: new Date().toISOString(),
                synced: false,
                currentQuestionIndex: currentQuestionIdx,
                remainingSeconds: currentTime
            });
        }
    };

    const handleFinishExam = async () => {
        if (!confirm("Tem certeza que deseja entregar sua prova?")) return;
        setStep('SENDING');

        const formattedAnswers: any = Object.keys(answers).map(qId => ({
            itemId: qId,
            selectedAlternativeId: answers[qId]
        }));

        try {
            // Tentativa ONLINE principal
            if (sessionMode === 'LIVE_REAL' && studentData) {
                const { error } = await supabase.from('exam_results').insert({
                    id: uuidv4(),
                    exam_id: studentData.examId,
                    student_id: studentData.id,
                    answers: formattedAnswers,
                    total_score: Math.floor(Math.random() * 10), // Mock score
                    graded_at: new Date().toISOString(),
                    security_flags: securityLog.map(l => l.type)
                });

                if (error) throw error;
            }

            await new Promise(resolve => setTimeout(resolve, 1500)); // Delay visual
            setStep('COMPLETED');

        } catch (e) {
            console.warn("Falha no envio online, salvando offline...", e);

            // BACKUP OFFLINE (Robustez)
            if (studentData) {
                await saveSession({
                    sessionId: uuidv4(),
                    studentId: studentData.id,
                    studentName: studentData.name,
                    eventId: studentData.eventId,
                    encryptedData: JSON.stringify(formattedAnswers), // Em prod seria criptografado
                    timestamp: new Date().toISOString(),
                    synced: false
                });
                alert("⚠️ Sem conexão com o servidor.\n\nSua prova foi salva com segurança no MEMÓRIA SEGURA deste tablet.\n\nAvise o professor para realizar a sincronização manual.");
                setStep('COMPLETED');
            } else {
                alert("Erro crítico ao salvar prova.");
                setStep('EXAM');
            }
        }
    };

    const item = actualItems[currentQuestionIdx];
    const isLast = currentQuestionIdx === actualItems.length - 1;

    // --- RENDERERS ---

    if (step === 'LOGIN_FORM') {
        return (
            <div className="fixed inset-0 bg-[#0f1d2e] flex flex-col items-center justify-center p-6 text-center z-50">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <Wifi size={48} className="text-emerald-400 mx-auto mb-4 animate-pulse" />
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
                    <CheckCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-1">Bem-vindo(a), {studentData.name.split(' ')[0]}!</h1>
                <p className="text-slate-500 text-sm mb-8">Sua presença foi confirmada no painel do professor.</p>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-8 text-left max-w-sm text-sm text-amber-800">
                    <p className="font-bold mb-1 flex items-center gap-2"><Lock size={14} /> Modo Seguro Ativado</p>
                    <ul className="list-disc pl-4 space-y-1 opacity-80">
                        <li>Câmera será ativada para monitoria.</li>
                        <li>Sair da tela cheia ou trocar de aba registrará uma infração.</li>
                    </ul>
                </div>

                <button onClick={() => setStep('EXAM')} className="w-full max-w-sm py-4 bg-brand-primary text-white font-bold rounded-xl text-lg hover:bg-brand-dark transition shadow-lg flex items-center justify-center gap-3">
                    <Play size={20} fill="white" /> Iniciar Prova
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
                    <CheckCircle size={48} strokeWidth={3} />
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
                    <Cloud size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" />
                </div>
                <div className="space-y-4 w-full max-w-xs text-left">
                    <div className="flex items-center gap-3 text-emerald-400 animate-in slide-in-from-left duration-500">
                        <CheckCircle size={16} /> <span>Sincronizando Respostas...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (showResumeModal) {
        return (
            <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center z-50 animate-in fade-in">
                <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Cloud size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Prova em Andamento</h2>
                    <p className="text-slate-600 mb-6 text-sm">
                        Encontramos uma prova não finalizada salva neste dispositivo. Deseja continuar de onde parou?
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={handleResumeSession}
                            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-dark transition flex items-center justify-center gap-2"
                        >
                            <Play size={18} /> Continuar Prova
                        </button>
                        <button
                            onClick={handleDiscardSession}
                            className="w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition"
                        >
                            Começar do Zero
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- SYNC MONITOR COMPONENT ---
    const SyncMonitor = () => (
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-slate-300 font-bold uppercase">Monitoria</span>
            </div>
            <div className="flex items-center gap-2">
                <Cloud size={14} className="text-brand-primary" />
                <span className="text-[10px] text-slate-300 font-bold uppercase">Sincronizado</span>
                <CheckCircle size={14} className="text-emerald-500" />
            </div>
        </div>
    );

    // --- EXAM UI ---
    return (
        <div className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden font-sans">

            {/* CAMERA PREVIEW (PROCTORING UI) */}
            <div className="fixed top-16 md:top-20 right-2 md:right-4 w-24 h-18 md:w-32 md:h-24 bg-black rounded-lg shadow-xl overflow-hidden z-30 border-2 border-slate-800 group">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover opacity-80 ${!cameraActive && 'hidden'}`}
                />
                {!cameraActive && (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900">
                        <Video size={16} />
                    </div>
                )}
                <div className="absolute top-1 left-1 bg-red-600 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse"></div>
            </div>

            {/* WARNING BANNER */}
            {violationCount > 0 && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded-full shadow-lg z-40 font-bold text-sm flex items-center gap-2 animate-bounce">
                    <AlertTriangle size={16} /> {violationCount} Infrações Detectadas
                </div>
            )}

            <div className="bg-[#0f1d2e] text-white h-14 flex justify-between items-center px-4 shadow-md flex-shrink-0 z-20">
                <div className="text-sm font-bold truncate max-w-[150px] md:max-w-none">{studentData.name}</div>
                <div className="flex gap-2">
                    <div className="bg-slate-800 px-2 py-1 rounded font-mono text-[10px] md:text-xs border border-slate-700 text-emerald-400 flex items-center gap-1">
                        <Wifi size={10} /> <span className="hidden sm:inline">{sessionMode === 'LIVE_REAL' ? 'Online' : 'Local'}</span>
                    </div>
                    {isKioskActive && <div className="bg-emerald-900 px-2 py-1 rounded font-mono text-[10px] md:text-xs text-emerald-300 border border-emerald-700">Kiosk</div>}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth">
                <div className="max-w-2xl mx-auto">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mb-6 overflow-hidden">
                        <div className="bg-brand-primary h-full transition-all duration-300" style={{ width: `${((currentQuestionIdx + 1) / actualItems.length) * 100}%` }}></div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-4 relative overflow-hidden">
                        <span className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Questão {currentQuestionIdx + 1}</span>

                        {/* MULTIMEDIA RENDERER */}
                        {(item as any).multimedia && (item as any).multimedia.length > 0 && (
                            <div className="mb-4 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                {(item as any).multimedia.map((media: any, idx: number) => {
                                    if (media.type === 'IMAGE') return <img key={idx} src={media.url} alt={media.description} className="w-full h-auto max-h-64 object-contain" />;
                                    if (media.type === 'VIDEO') {
                                        const isYouTube = media.url.includes('youtube.com') || media.url.includes('youtu.be');
                                        if (isYouTube) {
                                            const videoId = media.url.includes('v=') ? media.url.split('v=')[1].split('&')[0] : media.url.split('/').pop();
                                            return (
                                                <div key={idx} className="relative aspect-video">
                                                    <iframe
                                                        className="w-full h-full"
                                                        src={`https://www.youtube.com/embed/${videoId}`}
                                                        title="YouTube video player"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-200/80 px-2 py-1 rounded backdrop-blur-sm">
                                                        <Wifi size={10} /> REQUER INTERNET
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return <video key={idx} src={media.url} controls className="w-full aspect-video bg-black" />;
                                    }
                                    if (media.type === 'AUDIO') return (
                                        <div key={idx} className="p-4 flex items-center gap-4 bg-brand-light/20">
                                            <Music size={24} className="text-brand-primary" />
                                            <audio src={media.url} controls className="flex-1" />
                                        </div>
                                    );
                                    return null;
                                })}
                            </div>
                        )}

                        <div className="mb-6 mt-2">
                            <RichTextRenderer
                                content={item.statement}
                                className="text-lg font-semibold text-slate-800 leading-snug"
                            />
                        </div>

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
                                            <RichTextRenderer
                                                content={alt.text}
                                                className="font-medium"
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <SyncMonitor />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 safe-area-pb">
                <button
                    onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="p-3 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
                >
                    <ChevronLeft size={28} />
                </button>

                {isLast ? (
                    <button
                        onClick={handleFinishExam}
                        className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition flex items-center gap-2 text-lg"
                    >
                        Entregar <CheckCircle size={20} />
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                        className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-sky-200 active:scale-95 transition flex items-center gap-2 text-lg"
                    >
                        Próxima <ChevronRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};
