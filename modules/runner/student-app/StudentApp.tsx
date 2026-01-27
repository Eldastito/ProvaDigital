
import React, { useState, useEffect, useRef } from 'react';
import { Lock, CheckCircle, Play, Wifi, PenTool, Eraser, ChevronRight, ChevronLeft, ShieldCheck, Cloud, Video, AlertTriangle, Music, Trophy } from 'lucide-react';
import { AppState, QuestionType } from '../../../types';
import { supabase } from '../../../services/supabaseClient'; // Import Real Client
import { uuidv4 } from '../../../utils/helpers';
import { useProctoring } from '../../../hooks/useProctoring';
import { useStudentSession } from '../hooks/useStudentSession';
import { saveSession, getLastSession, clearDb } from '../../../services/offlineDb';
import { StoredSession } from '../../../types';

import { useSafeAppStore, useAppStore } from '../../../store/useAppStore';
import { RichTextRenderer } from '../../../components/RichTextRenderer';
import { AccessibilityToolbar } from '../features/AccessibilityToolbar';
import { AccessibilityConfig, DEFAULT_ACCESSIBILITY_CONFIG } from '../features/types';
import { OfflineSubmissionFlow } from '../offline/OfflineSubmissionFlow';

interface StudentAppProps {
    onBack: () => void;
}

// --- ERROR BOUNDARY ---
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    constructor(props: ErrorBoundaryProps) {
        super(props);
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("StudentApp Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-[#0f1d2e] flex flex-col items-center justify-center p-6 text-center text-white z-50">
                    <AlertTriangle size={48} className="text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Algo deu errado</h2>
                    <p className="text-slate-400 mb-6 max-w-sm text-sm p-2 bg-slate-900 rounded border border-slate-700 font-mono">
                        {this.state.error?.message || 'Erro desconhecido'}
                    </p>
                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-brand-primary rounded-xl font-bold">
                        Recarregar
                    </button>
                </div>
            );
        }
        // @ts-ignore
        return (this.props as any).children;
    }
}

export const StudentApp = (props: StudentAppProps) => {
    return (
        <ErrorBoundary>
            <StudentAppContent {...props} />
        </ErrorBoundary>
    );
};

const StudentAppContent = ({ onBack }: StudentAppProps) => {
    const state = useSafeAppStore();
    const params = new URLSearchParams(window.location.search);
    // Pega parâmetros reais do QR Code gerado pelo Lobby
    const classIdParam = params.get('classId');
    const examIdParam = params.get('examId');
    const sessionMode = classIdParam ? 'LIVE_REAL' : 'DEMO_LOCAL';

    const [studentData, setStudentData] = useState<any>(null);
    const [step, setStep] = useState<'LOGIN_FORM' | 'CONFIRM_IDENTITY' | 'EXAM_COVER' | 'EXAM' | 'SENDING' | 'OFFLINE_SUBMISSION' | 'COMPLETED'>('LOGIN_FORM');
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

    // Login State
    const [inputName, setInputName] = useState('');
    const [joining, setJoining] = useState(false);

    // Exam State
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [examItems, setExamItems] = useState<any[]>([]);
    const [loadingExam, setLoadingExam] = useState(false);

    // Timer logic
    const [currentTime, setCurrentTime] = useState(25 * 60); // 25 min default
    const [timerActive, setTimerActive] = useState(false);

    // Auto-Resume State
    const [foundSession, setFoundSession] = useState<StoredSession | null>(null);
    const [showResumeModal, setShowResumeModal] = useState(false);

    // Kiosk Mode Check (Simulated)
    const isKioskActive = true;

    // --- ACCESSIBILITY STATE ---
    const [a11y, setA11y] = useState<AccessibilityConfig>(DEFAULT_ACCESSIBILITY_CONFIG);

    // --- PROCTORING HOOK ---
    const [proctoringActive, setProctoringActive] = useState(false);

    // Delay proctoring start to prevent false positives during transition
    useEffect(() => {
        if (step === 'EXAM') {
            const t = setTimeout(() => setProctoringActive(true), 3000);
            return () => clearTimeout(t);
        } else {
            setProctoringActive(false);
        }
    }, [step]);

    // --- MULTI-LOGIN SESSION HOOK ---
    const {
        currentSession,
        isSessionActive,
        startSession,
        saveAnswer: saveAnswerToSession,
        logSecurityEvent,
        finishSession,
        logout
    } = useStudentSession({
        examId: examIdParam || 'demo-exam',
        eventId: classIdParam || 'demo-event'
    });

    const { videoRef, cameraActive, violationCount, securityLog } = useProctoring({
        isActive: proctoringActive,
        studentId: currentSession?.studentId || studentData?.id || 'anon',
        onViolation: async (reason) => {
            console.log("Violação detectada:", reason);

            // Log via multi-login session
            if (isSessionActive) {
                await logSecurityEvent(reason, 'HIGH', {
                    timestamp: new Date().toISOString()
                });
            }

            // Legacy log (manter por compatibilidade)
            const store = useAppStore.getState();
            if (studentData?.attemptId) {
                store.logSecurityEvent({
                    attemptId: studentData.attemptId,
                    eventType: reason,
                    severity: 'HIGH',
                    eventData: { timestamp: new Date().toISOString() }
                });
            }
        }
    });

    // --- DATA LOADING ---
    useEffect(() => {
        if (examIdParam) {
            loadRealExam(examIdParam);
        }
    }, [examIdParam]);

    const [loadError, setLoadError] = useState<string | null>(null);

    const loadRealExam = async (examId: string) => {
        setLoadingExam(true);
        setLoadError(null);
        try {
            await state.fetchExamItems(examId);

            // USE FRESH STATE after async call
            const freshState = useAppStore.getState();
            const exam = freshState.exams.find(e => e.id === examId);

            if (exam) {
                // Handle schema mismatch (items vs items_config) and missing items
                const configSource = (exam.items && exam.items.length > 0) ? exam.items : (exam.items_config || []);

                if (!configSource || configSource.length === 0) {
                    setLoadError(`Prova encontrada, mas configuração de itens vazia. (ID: ${examId})`);
                    setExamItems([]);
                } else {
                    const items = configSource.map((config: any) => {
                        const item = freshState.items.find(i => i.id === config.itemId);
                        return item ? { ...item, ...config } : null;
                    }).filter(Boolean);

                    if (items.length === 0) {
                        setLoadError(`Prova carregada, mas questões não encontradas no cache. (Qtd: ${configSource.length})`);
                    }
                    setExamItems(items);
                }
            } else {
                setLoadError("Prova não encontrada no estado global após fetch.");
            }
        } catch (e: any) {
            console.error("Error loading exam items:", e);
            setLoadError("Erro Fatal: " + (e.message || JSON.stringify(e)));
        } finally {
            setLoadingExam(false);
        }
    };

    // QUESTÕES DEMO ATUALIZADAS (Tech & Lógica)
    const mockItems = React.useMemo(() => [
        { id: 'q1', type: QuestionType.MULTIPLE_CHOICE, statement: 'Tech: Qual destas linguagens é usada para estilizar páginas web?', alternatives: [{ id: 'a', text: 'HTML', isCorrect: false }, { id: 'b', text: 'Python', isCorrect: false }, { id: 'c', text: 'CSS', isCorrect: true }, { id: 'd', text: 'Java', isCorrect: false }] },
        { id: 'q2', type: QuestionType.MULTIPLE_CHOICE, statement: 'Lógica: O pai de Maria tem 5 filhas: Lalá, Lelé, Lili, Loló e...?', alternatives: [{ id: 'a', text: 'Lulu', isCorrect: false }, { id: 'b', text: 'Maria', isCorrect: true }, { id: 'c', text: 'Joana', isCorrect: false }, { id: 'd', text: 'Laura', isCorrect: false }] },
        { id: 'q3', type: QuestionType.MULTIPLE_CHOICE, statement: 'Cultura: O que significa a sigla "IA"?', alternatives: [{ id: 'a', text: 'Internet Aberta', isCorrect: false }, { id: 'b', text: 'Inteligência Artificial', isCorrect: true }, { id: 'c', text: 'Interação Avançada', isCorrect: false }, { id: 'd', text: 'Inovação Atual', isCorrect: false }] },
    ], []);

    const [shuffledItems, setShuffledItems] = useState<any[]>([]);

    // Use separate effect to handle loading state properly
    useEffect(() => {
        if (loadingExam) return; // Don't shuffle while loading

        // Only fallback to mock if NO exam ID was provided and we are in demo mode
        const shouldLoadMock = !examIdParam && examItems.length === 0;

        if (examItems.length > 0) {
            const shuffled = [...examItems].sort(() => Math.random() - 0.5);
            setShuffledItems(shuffled);
        } else if (shouldLoadMock) {
            setShuffledItems(mockItems);
        }
    }, [examItems, mockItems, loadingExam, examIdParam]);

    // --- AUTO-RESUME LOGIC (Moved up to fix Hooks Rule) ---
    useEffect(() => {
        if (!studentData || !studentData.id || !studentData.eventId) return;
        // FIX: Don't run check if we are already in the exam or finishing it
        if (step === 'EXAM' || step === 'COMPLETED' || step === 'SENDING') return;

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

    // ✨ Auto-logout após completar prova (multi-login)
    useEffect(() => {
        if (step === 'COMPLETED' && isSessionActive) {
            const timer = setTimeout(() => {
                console.log('🚪 Fazendo logout automático...');
                logout(); // Limpa RAM, mantém IndexedDB

                // Reset para próximo aluno
                setInputName('');
                setCurrentQuestionIdx(0);
                setAnswers({});
                setStudentData(null);
                setStep('LOGIN_FORM');

                console.log('✅ Tablet pronto para próximo aluno');
            }, 5000); // 5 segundos para ver resultado

            return () => clearTimeout(timer);
        }
    }, [step, isSessionActive]);

    // UI Blocking for Loading
    const isItemsEmpty = !examItems || examItems.length === 0;
    if (loadingExam || (isItemsEmpty && !loadError)) {
        return (
            <div className="fixed inset-0 bg-[#0f1d2e] flex flex-col items-center justify-center text-white p-8 text-center z-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-brand-primary border-r-transparent mb-4"></div>
                <p>Carregando Questões...</p>
            </div>
        );
    }

    // Use shuffled items for the exam
    const actualItems = shuffledItems;

    // --- SECURITY HANDLERS ---
    const handlePreventClipboard = (e: React.ClipboardEvent) => {
        e.preventDefault();
        alert('🚫 Ação Bloqueada: Copiar e Colar não é permitido no Modo Seguro.');
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

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

                // ✨ Iniciar sessão multi-login
                await startSession(studentId, inputName.trim());

                // INITIALIZE REALTIME EVENTS FOR BROADCASTING ALERTS
                if (examIdParam) {
                    state.initializeExamEvents(examIdParam);
                }
            } else {
                // Modo Local (Fallback)
                const localStudentId = 'local_' + Date.now();

                setStudentData({
                    id: localStudentId,
                    name: inputName,
                    reg: '1234',
                    examTitle: 'Demo Local',
                    roleTitle: 'Visitante',
                    eventId: 'local'
                });

                // ✨ Iniciar sessão multi-login (modo local)
                await startSession(localStudentId, inputName.trim());
            }
            setStep('CONFIRM_IDENTITY');
        } catch (e: any) {
            console.error(e);
            alert("Erro ao entrar na sala: " + e.message);
        } finally {
            setJoining(false);
        }
    };



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

            // Re-connect to realtime if we have examId
            if (sessionMode === 'LIVE_REAL' && examIdParam) {
                state.initializeExamEvents(examIdParam);
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

    const handleOptionSelect = async (qId: string, optId: string) => {
        const newAnswers = { ...answers, [qId]: optId };
        setAnswers(newAnswers);

        // ✨ Salvar via multi-login session
        if (isSessionActive && actualItems.length > 0) {
            const questionIndex = actualItems.findIndex(q => q.id === qId);
            if (questionIndex >= 0) {
                await saveAnswerToSession(questionIndex + 1, optId);
            }
        }

        // --- OFFLINE PERSISTENCE (PHASE 2) - Legacy support ---
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

        try {
            // Importar serviço de correção automática
            const { AutoGradingService } = await import('../../../services/grading/autoGradingService');

            // Montar respostas no formato StudentAnswer
            const studentAnswers: any[] = actualItems.map(item => {
                const selectedAlternativeId = answers[item.id];
                const essayText = (item.type === 'ESSAY' || item.type === 'REDACTION')
                    ? answers[item.id + '_text']
                    : null;

                return {
                    itemId: item.id,
                    selectedAlternativeId: selectedAlternativeId || null,
                    text: essayText,
                    isCorrect: false, // Will be set by grading service
                    scoreObtained: 0
                };
            });

            // Montar exam object simplificado para correção
            const examForGrading = {
                items: actualItems.map(item => ({
                    itemId: item.id,
                    score: item.score || 1.0
                })),
                maxScore: actualItems.reduce((sum, item) => sum + (item.score || 1.0), 0)
            };

            // CORREÇÃO AUTOMÁTICA OFFLINE-FIRST
            console.log('🎓 Iniciando correção automática offline-first...');
            const gradingResult = await AutoGradingService.gradeFullExam(
                examForGrading as any,
                studentAnswers,
                'offline', // Modo offline
                false // Sem conexão internet garantida
            );

            console.log('✅ Correção concluída:', gradingResult);

            // Atualizar estado para exibir na tela final
            setStudentData((prev: any) => ({
                ...prev,
                lastScore: gradingResult.totalScore,
                lastTotal: gradingResult.maxScore
            }));

            const formattedAnswers = gradingResult.answers;

            // ✨ Finalizar sessão multi-login
            if (isSessionActive) {
                const completedSession = await finishSession();
                console.log('🎓 Sessão multi-login finalizada:', completedSession.id);
                console.log(`   Respostas: ${completedSession.encryptedAnswers.length}`);
                console.log(`   Eventos: ${completedSession.securityEvents.length}`);
            }

            // Tentativa ONLINE principal
            if (sessionMode === 'LIVE_REAL' && studentData) {
                const { error } = await supabase.from('exam_results').insert({
                    id: uuidv4(),
                    exam_id: studentData.examId,
                    student_id: studentData.id,
                    answers: formattedAnswers,
                    total_score: gradingResult.totalScore,
                    graded_at: gradingResult.gradedAt,
                    security_flags: securityLog.map(l => l.type)
                });

                if (error) throw error;
            }

            await new Promise(resolve => setTimeout(resolve, 1500)); // Delay visual
            setStep('COMPLETED');

        } catch (e) {
            console.warn("Falha no envio online ou modo offline detectado...", e);

            // MODO OFFLINE ou FALHA DE SYNC → Gerar QR Code
            if (studentData && sessionMode !== 'LIVE_REAL') {
                // Modo offline/demo: Exibir OfflineSubmissionFlow
                console.log('📱 Modo offline: exibindo QR Code para coleta manual');
                setStep('OFFLINE_SUBMISSION');
            } else if (studentData) {
                // Fallback: salvar localmente para sync posterior
                const rawAnswers = Object.keys(answers).map(qId => ({
                    itemId: qId,
                    selectedAlternativeId: answers[qId],
                    text: answers[qId + '_text'] || null
                }));

                await saveSession({
                    sessionId: uuidv4(),
                    studentId: studentData.id,
                    studentName: studentData.name,
                    eventId: studentData.eventId,
                    encryptedData: JSON.stringify(rawAnswers),
                    timestamp: new Date().toISOString(),
                    synced: false
                });

                alert("⚠️ Sem conexão com o servidor.\n\nSua prova foi salva com segurança no MEMÓRIA SEGURA deste tablet.\n\nAvise o professor para realizar a sincronização manual.");
                setStep('OFFLINE_SUBMISSION'); // Mostrar QR mesmo com fallback
            } else {
                alert("Erro crítico ao salvar prova.");
                setStep('EXAM');
            }
        }
    };

    const item = actualItems[currentQuestionIdx];
    const isLast = currentQuestionIdx === actualItems.length - 1;

    // --- SAFETY CHECK FOR EMPTY/FAILED EXAM ---
    if (!item && !loadingExam && step === 'EXAM') {
        return (
            <div className="fixed inset-0 bg-red-900 flex flex-col items-center justify-center text-white p-6 text-center z-50">
                <AlertTriangle size={48} className="text-amber-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Erro ao carregar questões</h2>
                <p className="text-slate-400 mb-6 font-mono text-sm bg-slate-900 p-2 rounded max-w-sm mx-auto">
                    {loadError || `Não foi possível obter as questões da prova (ID: ${examIdParam}).`}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            if (examIdParam) {
                                loadRealExam(examIdParam);
                            } else {
                                window.location.reload();
                            }
                        }}
                        className="px-6 py-3 bg-brand-primary rounded-xl font-bold"
                    >
                        Tentar Novamente
                    </button>
                    <button onClick={onBack} className="px-6 py-3 bg-slate-700 rounded-xl font-bold">Sair</button>
                </div>
            </div>
        );
    }

    // --- RENDERERS ---

    // Apply Accessibility Styles Helper
    const getThemeClasses = () => {
        if (a11y.theme === 'high-contrast') return 'bg-black text-yellow-400 font-bold';
        if (a11y.theme === 'dark') return 'bg-slate-900 text-white';
        if (a11y.theme === 'sepia') return 'bg-[#f4e4bc] text-[#4f3e1e]';
        return 'bg-slate-50 text-slate-900';
    };

    const containerStyle = {
        fontSize: `${a11y.fontSize}%`,
        lineHeight: a11y.lineSpacing,
        letterSpacing: `${a11y.letterSpacing}em`
    };

    // Global Login/Cover wrappers don't strictly need unique a11y yet, but consistent is better.
    // For now we apply mainly to EXAM step.

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
                        <li>Cópia e uso de atalhos bloqueados.</li>
                    </ul>
                </div>

                <div className="flex flex-col w-full max-w-sm gap-3">
                    <button onClick={(e) => {
                        e.preventDefault(); // Safety
                        // 1. UNBLOCK UI IMMEDIATELY
                        setStep('EXAM');

                        // 2. Perform DB logic in background (Fire & Forget)
                        const store = useAppStore.getState();
                        if (studentData && studentData.examId) {
                            store.startExamAttempt({
                                examId: studentData.examId,
                                examVersionId: 'v1',
                                studentId: studentData.id
                            }).then(aId => {
                                console.log("Attempt started successfully:", aId);
                                setStudentData(prev => ({ ...prev, attemptId: aId }));
                            }).catch(err => {
                                console.error("Background attempt start failed (non-fatal):", err);
                            });
                        }
                    }} className="w-full py-4 bg-brand-primary text-white font-bold rounded-xl text-lg hover:bg-brand-dark transition shadow-lg flex items-center justify-center gap-3">
                        <Play size={20} fill="white" /> Iniciar Prova
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'COMPLETED') {
        const score = (studentData as any)?.lastScore;
        const total = (studentData as any)?.lastTotal;
        const percentage = total ? Math.round((score / total) * 100) : 0;

        return (
            <div className="fixed inset-0 bg-[#0f1d2e] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in z-50 overflow-hidden font-sans">
                {/* Confetti Effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                        <div key={i} className="absolute w-3 h-3 rounded-full opacity-0 animate-[confetti_4s_ease-out_infinite]"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-20px`,
                                animationDelay: `${Math.random() * 2}s`,
                                backgroundColor: ['#FBBF24', '#34D399', '#60A5FA', '#F87171'][Math.floor(Math.random() * 4)]
                            }}>
                        </div>
                    ))}
                </div>
                <style>{`
                  @keyframes confetti {
                      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                  }
              `}</style>

                <div className="relative z-10 bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-sm w-full">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 animate-bounce">
                        <Trophy size={48} className="text-white" />
                    </div>

                    <h1 className="text-3xl font-black text-white mb-2">Prova Finalizada!</h1>
                    <p className="text-slate-400 mb-8">Parabéns, você completou o desafio.</p>

                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700 mb-8">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Sua Pontuação</div>
                        <div className="text-6xl font-black text-white flex items-center justify-center gap-1">
                            {(() => {
                                const hasKeys = (actualItems || []).some((i: any) => i.alternatives?.some((a: any) => a.isCorrect));
                                if (!hasKeys && score === 0) {
                                    return <span className="text-xl text-yellow-400 font-bold">Ver no Telão</span>;
                                }
                                return (
                                    <>
                                        {score !== undefined ? score : '?'}
                                        <span className="text-2xl text-slate-500 font-bold">/{total || '?'}</span>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">Aguaring Results...</div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-sm mb-4">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                            <CheckCircle size={16} /> Respostas Salvas
                        </div>
                        <p className="text-slate-400 text-xs">Seus dados foram sincronizados com o servidor do professor.</p>
                    </div>

                    <p className="text-slate-500 text-xs">
                        Aguarde o encerramento no telão para ver se você entrou no
                        <span className="text-yellow-500 font-bold ml-1">Podium</span>!
                    </p>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="mt-8 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition"
                    >
                        Sair / Encerrar
                    </button>
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

    // OFFLINE SUBMISSION - QR Code Criptografado
    if (step === 'OFFLINE_SUBMISSION' && studentData) {
        return (
            <OfflineSubmissionFlow
                exam={actualExam as any}
                answers={Object.entries(answers).map(([itemId, value]) => ({
                    itemId,
                    selectedAlternativeId: typeof value === 'string' && !itemId.includes('_text') ? value : null,
                    text: answers[`${itemId}_text`] || null,
                    isCorrect: false,
                    scoreObtained: 0
                }))}
                studentData={{
                    id: studentData.id,
                    name: studentData.name,
                    eventId: studentData.eventId || 'demo-event',
                    examId: studentData.examId
                }}
                onComplete={() => setStep('COMPLETED')}
            />
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
        <div className={`p-3 rounded-xl border flex items-center justify-between mt-4 ${a11y.theme === 'high-contrast' ? 'border-yellow-400' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className={`text-[10px] font-bold uppercase ${a11y.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-300'}`}>Monitoria</span>
            </div>
            <div className="flex items-center gap-2">
                <Cloud size={14} className={a11y.theme === 'high-contrast' ? 'text-white' : 'text-brand-primary'} />
                <span className={`text-[10px] font-bold uppercase ${a11y.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-300'}`}>Sincronizado</span>
                <CheckCircle size={14} className="text-emerald-500" />
            </div>
        </div>
    );

    // --- EXAM UI ---
    return (
        <div
            className={`fixed inset-0 flex flex-col overflow-hidden font-sans transition-colors duration-300 ${getThemeClasses()}`}
            style={containerStyle}
            onCopy={handlePreventClipboard}
            onPaste={handlePreventClipboard}
            onCut={handlePreventClipboard}
            onContextMenu={handleContextMenu}
        >
            <AccessibilityToolbar config={a11y} onChange={setA11y} />

            {/* CAMERA PREVIEW (PROCTORING UI) */}
            <div className={`fixed top-16 md:top-20 right-2 md:right-4 w-24 h-18 md:w-32 md:h-24 bg-black rounded-lg shadow-xl overflow-hidden z-30 border-2 group ${a11y.theme === 'high-contrast' ? 'border-yellow-400' : 'border-slate-800'}`}>
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

            <div className={`h-14 flex justify-between items-center px-4 shadow-md flex-shrink-0 z-20 ${a11y.theme === 'high-contrast' ? 'bg-black text-yellow-400 border-b border-yellow-400' : 'bg-[#0f1d2e] text-white'}`}>
                <div className="text-sm font-bold truncate max-w-[150px] md:max-w-none">{studentData.name}</div>
                <div className="flex gap-2">
                    <div className={`px-2 py-1 rounded font-mono text-[10px] md:text-xs border flex items-center gap-1 ${a11y.theme === 'high-contrast' ? 'border-yellow-400 text-yellow-400' : 'bg-slate-800 border-slate-700 text-emerald-400'}`}>
                        <Wifi size={10} /> <span className="hidden sm:inline">{sessionMode === 'LIVE_REAL' ? 'Online' : 'Local'}</span>
                    </div>
                    {isKioskActive && <div className={`px-2 py-1 rounded font-mono text-[10px] md:text-xs border ${a11y.theme === 'high-contrast' ? 'border-white text-white' : 'bg-emerald-900 text-emerald-300 border-emerald-700'}`}>Kiosk</div>}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth">
                <div className={`max-w-2xl mx-auto transition-all ${a11y.focusMode ? 'flex flex-col justify-center min-h-[60vh]' : ''}`}>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mb-6 overflow-hidden">
                        <div className="bg-brand-primary h-full transition-all duration-300" style={{ width: `${((currentQuestionIdx + 1) / actualItems.length) * 100}%` }}></div>
                    </div>

                    <div className={`p-6 rounded-2xl shadow-sm border mb-4 relative overflow-hidden transition-colors ${a11y.theme === 'high-contrast' ? 'bg-black border-yellow-400' : (a11y.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}`}>
                        <span className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black' : 'bg-slate-100 text-slate-500'}`}>Questão {currentQuestionIdx + 1}</span>

                        {/* MULTIMEDIA RENDERER */}
                        {(item as any).multimedia && (item as any).multimedia.length > 0 && (
                            <div className="mb-4 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                {(item as any).multimedia.map((media: any, idx: number) => {
                                    if (media.type === 'IMAGE') return <img key={idx} src={media.url} alt={media.description} className="w-full h-auto max-h-64 object-contain" />;
                                    // ... other media types similar logic or generic ...
                                    return null;
                                })}
                            </div>
                        )}

                        <div className="mb-6 mt-2">
                            <RichTextRenderer
                                content={item.statement}
                                className={`text-lg font-semibold leading-snug ${a11y.theme === 'high-contrast' ? 'text-yellow-400' : (a11y.theme === 'dark' ? 'text-white' : 'text-slate-800')}`}
                            />
                        </div>

                        <div className="space-y-3">
                            {item.alternatives?.map((alt: any, idx: number) => {
                                const isSelected = answers[item.id] === alt.id;
                                const letter = String.fromCharCode(65 + idx); // A, B, C...
                                const highContrastClass = isSelected ? 'bg-yellow-400 text-black border-4 border-yellow-400 font-bold' : 'bg-black text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-900';
                                const defaultClass = isSelected ? 'border-brand-primary bg-brand-light/30 text-brand-dark shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100';
                                const darkClass = isSelected ? 'border-brand-primary bg-brand-primary/20 text-white' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700';

                                let btnClass = defaultClass;
                                if (a11y.theme === 'high-contrast') btnClass = highContrastClass;
                                else if (a11y.theme === 'dark') btnClass = darkClass;
                                else if (a11y.theme === 'sepia') btnClass = isSelected ? 'bg-[#e0d0a0] border-[#8a6a4b] text-[#4f3e1e]' : 'bg-[#f4e4bc] border-[#d8c8a0] hover:bg-[#e0d0a0]';


                                return (
                                    <button
                                        key={alt.id}
                                        onClick={() => handleOptionSelect(item.id, alt.id)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all active:scale-[0.98] ${btnClass}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold mt-1 ${isSelected ? 'border-current bg-current text-white' : 'border-current opacity-50'}`}>
                                                {letter}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <RichTextRenderer
                                                    content={alt.text}
                                                    className="font-medium break-words leading-relaxed"
                                                />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* CAMPO DE TEXTO DISSERTATIVO (ESSAY / REDACTION) */}
                            {(item.type === 'ESSAY' || item.type === 'REDACTION') && (
                                <div className="mt-6 space-y-3">
                                    <div className={`p-4 rounded-xl border-2 ${a11y.theme === 'high-contrast' ? 'bg-black border-yellow-400' : 'bg-white border-slate-200'}`}>
                                        <label className={`block text-sm font-bold mb-2 ${a11y.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-700'}`}>
                                            {item.type === 'REDACTION' ? '✍️ Sua Redação' : '📝 Sua Resposta'}
                                        </label>

                                        <textarea
                                            value={answers[`${item.id}_text`] || ''}
                                            onChange={e => {
                                                setAnswers(prev => ({
                                                    ...prev,
                                                    [`${item.id}_text`]: e.target.value
                                                }));
                                            }}
                                            placeholder={item.type === 'REDACTION'
                                                ? 'Escreva sua redação aqui. Lembre-se de estruturar com introdução, desenvolvimento e conclusão...'
                                                : 'Digite sua resposta aqui. Seja claro e objetivo...'
                                            }
                                            className={`w-full p-4 rounded-lg border-2 resize-none font-mono ${a11y.theme === 'high-contrast'
                                                ? 'bg-black text-yellow-400 border-yellow-400 focus:border-yellow-300'
                                                : a11y.theme === 'dark'
                                                    ? 'bg-slate-800 text-white border-slate-600 focus:border-brand-primary'
                                                    : 'bg-white text-slate-800 border-slate-300 focus:border-brand-primary'
                                                } outline-none transition`}
                                            rows={item.type === 'REDACTION' ? 20 : 10}
                                            style={{
                                                minHeight: item.minLines ? `${item.minLines * 1.5}rem` : undefined
                                            }}
                                        />

                                        {/* CONTADOR DE LINHAS/PALAVRAS */}
                                        {item.showWordCount && (
                                            <div className={`mt-2 flex justify-between text-xs ${a11y.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-500'}`}>
                                                <span>
                                                    📏 {(answers[`${item.id}_text`] || '').split('\n').length} linhas
                                                </span>
                                                <span>
                                                    📝 {(answers[`${item.id}_text`] || '').split(/\s+/).filter(w => w.length > 0).length} palavras
                                                </span>
                                                <span>
                                                    🔤 {(answers[`${item.id}_text`] || '').length} caracteres
                                                </span>
                                            </div>
                                        )}

                                        {/* VALIDAÇÃO MIN/MAX LINHAS */}
                                        {item.minLines && (answers[`${item.id}_text`] || '').split('\n').length < item.minLines && (
                                            <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
                                                <AlertTriangle size={14} />
                                                Mínimo de {item.minLines} linhas necessárias
                                            </div>
                                        )}
                                        {item.maxLines && (answers[`${item.id}_text`] || '').split('\n').length > item.maxLines && (
                                            <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
                                                <AlertTriangle size={14} />
                                                Máximo de {item.maxLines} linhas excedido
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <SyncMonitor />
                </div>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 border-t p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 safe-area-pb ${a11y.theme === 'high-contrast' ? 'bg-black border-yellow-400' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'}`}>
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
                        className={`px-8 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition flex items-center gap-2 text-lg ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black' : 'bg-emerald-600 text-white shadow-emerald-200'}`}
                    >
                        Entregar <CheckCircle size={20} />
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                        className={`px-8 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition flex items-center gap-2 text-lg ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black' : 'bg-brand-primary text-white shadow-sky-200'}`}
                    >
                        Próxima <ChevronRight size={20} />
                    </button>
                )}
            </div>

            {/* FOCUS MODE OVERLAY */}
            {a11y.focusMode && (
                <div className="fixed inset-0 pointer-events-none z-10 hidden md:block">
                    <div className="absolute top-0 left-0 right-0 h-[20vh] bg-black/80 backdrop-blur-sm" />
                    <div className="absolute bottom-0 left-0 right-0 h-[20vh] bg-black/80 backdrop-blur-sm" />
                </div>
            )}
        </div>
    );
};
