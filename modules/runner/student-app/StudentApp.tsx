
import React, { useState, useEffect, useRef } from 'react';
import { Lock, CheckCircle, Play, Wifi, PenTool, Eraser, ChevronRight, ChevronLeft, ShieldCheck, Cloud, Video, AlertTriangle, Music, Trophy, HelpCircle } from 'lucide-react';
import { AppState, QuestionType } from '../../../types';
import { supabase } from '../../../services/supabaseClient'; // Import Real Client
import { envConfig } from '../../../services/environmentConfig';
import { uuidv4 } from '../../../utils/helpers';
import { useProctoring } from '../../../hooks/useProctoring';
import { StudentResultsView } from './StudentResultsView';
import { useStudentSession } from '../hooks/useStudentSession';
import { useFullscreenSecurity } from '../hooks/useFullscreenSecurity';
import { clearDb } from '../../../services/offlineDb';
import { StoredSession } from '../../../types';

import { useSafeAppStore, useAppStore } from '../../../store/useAppStore';
import { RichTextRenderer } from '../../../components/RichTextRenderer';
import { AccessibilityToolbar } from '../features/AccessibilityToolbar';
import { AccessibilityConfig, DEFAULT_ACCESSIBILITY_CONFIG } from '../features/types';
import { OfflineSubmissionFlow } from '../offline/OfflineSubmissionFlow';
import { MOCK_TENANT_ID } from '../../../utils/mockData';

// === MESH NETWORK IMPORTS ===
import { getSessionService, StudentSession } from '../../../services/sessionIsolationService';
import { E2EEncryptionService } from '../../../services/security/e2eEncryptionService';
import { getMeshNetwork, MeshHybridEnvelope } from '../../../services/meshNetworkService';
import { getTelemetryService } from '../../../services/telemetryService';
import { StudentAnswer } from '../../../types';
import { getAlertingService, Alert } from '../../../services/alertingService';
import { useNetworkStore, useNetworkSync } from '../../../services/stores/useNetworkStore';
import { NetworkStatusInline } from './NetworkStatus';
import { CATEngine, ItemResponse } from '../../../services/grading/catEngine';

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

// --- SYNC MONITOR COMPONENT (EXTERNAL) ---
const SyncMonitor = ({ a11y, cameraActive }: { a11y: AccessibilityConfig, cameraActive: boolean }) => (
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

const StudentAppContent = ({ onBack }: StudentAppProps) => {
    const state = useSafeAppStore();
    const params = new URLSearchParams(window.location.search);
    // Pega parâmetros reais do QR Code gerado pelo Lobby
    const classIdParam = params.get('classId');
    const examIdParam = params.get('examId');
    const variantIdParam = params.get('variantId'); // Novo: suporte a variantes PCD/Neuro
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
    const [adaptiveItems, setAdaptiveItems] = useState<any[]>([]); // Pool completo para adaptativo
    const [loadingExam, setLoadingExam] = useState(false);
    const [currentTheta, setCurrentTheta] = useState(0); 
    
    // 🔐 Cache de Chave Criptográfica (T3)
    const encryptionKeyRef = useRef<CryptoKey | null>(null);
// Proficiência estimada

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

    // --- MESH NETWORK STATE ---
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
    const [meshInitialized, setMeshInitialized] = useState(false);
    const [examUnlockedByMesh, setExamUnlockedByMesh] = useState(false);

    // --- BEHAVIORAL PROCTORING (PHASE 4) ---
    const [isScreenLocked, setIsScreenLocked] = useState(false);
    const [lockReason, setLockReason] = useState<string>('');

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
        saveAnswer,
        logSecurityEvent,
        updateTelemetry,
        finishSession,
        logout
    } = useStudentSession({
        examId: examIdParam || '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90', // Real exam from database
        eventId: classIdParam || 'demo-event'
    });

    const { videoRef, cameraActive, violationCount, securityLog } = useProctoring({
        isActive: proctoringActive,
        studentId: currentSession?.studentId || studentData?.id || 'anon',
        onViolation: async (reason) => {
            console.log("Violação detectada:", reason);

            // 📢 CRITICAL FIX: Broadcast directly to Professor's Dashboard (Supabase)
            // This ensures the Live Demo Dashboard receives the alert immediately
            if (examIdParam && studentData?.id) {
                const channel = supabase.channel(`exam_monitor:${examIdParam}`);
                channel.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.send({
                            type: 'broadcast',
                            event: 'ALERT',
                            payload: {
                                studentId: studentData.id,
                                type: reason,
                                timestamp: new Date().toISOString()
                            }
                        });
                        // Don't remove immediately to allow send to complete reliable
                        setTimeout(() => supabase.removeChannel(channel), 1000);
                    }
                });
            }

            // Log via multi-login session
            if (isSessionActive) {
                await logSecurityEvent(reason, 'HIGH', {
                    timestamp: new Date().toISOString()
                });
            }

            // 🌐 Enviar via telemetria mesh
            if (meshInitialized && studentData?.id) {
                getTelemetryService().logViolation({
                    studentId: studentData.id,
                    eventType: reason as any,
                    severity: 'MEDIUM',
                    timestamp: Date.now()
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
            loadRealExam(examIdParam, variantIdParam);
        }
    }, [examIdParam, variantIdParam]);

    const [loadError, setLoadError] = useState<string | null>(null);

    const loadRealExam = async (examId: string, variantId?: string | null) => {
        setLoadingExam(true);
        setLoadError(null);
        try {
            await state.fetchExamItems(examId);

            // USE FRESH STATE after async call
            const freshState = useAppStore.getState();
            const exam = freshState.exams.find(e => e.id === examId);

            if (exam) {
                // 1. Carregar variante e overrides se variantId existir
                let overrides: any[] = [];
                if (variantId) {
                    console.log(`♿ Carregando variante de acessibilidade: ${variantId}`);

                    // Buscar config da variante
                    const { data: variantData } = await supabase
                        .from('exam_variants')
                        .select('*')
                        .eq('id', variantId)
                        .single();

                    if (variantData?.accessibility_config) {
                        setA11y((prev: any) => ({ ...prev, ...variantData.accessibility_config }));
                    }

                    // Buscar overrides de itens
                    const { data: overridesData } = await supabase
                        .from('exam_variant_overrides')
                        .select('*')
                        .eq('variant_id', variantId)
                        .eq('status', 'APPROVED');

                    overrides = overridesData || [];
                    console.log(`✅ ${overrides.length} overrides de conteúdo encontrados.`);
                }

                // 2. Processar itens com overrides
                const configSource = (exam.items && exam.items.length > 0) ? exam.items : (exam.items_config || []);

                if (!configSource || configSource.length === 0) {
                    setLoadError(`Prova encontrada, mas configuração de itens vazia. (ID: ${examId})`);
                    setExamItems([]);
                } else {
                    const items = configSource.map((config: any) => {
                        const baseItem = freshState.items.find(i => i.id === config.itemId);
                        if (!baseItem) return null;

                        // Aplicar override se existir para este item_version ou itemId
                        const override = overrides.find(o =>
                            o.item_version_id === baseItem.currentVersionId ||
                            o.item_id === baseItem.id
                        );

                        if (override) {
                            console.log(`🎨 Aplicando override no item ${baseItem.id}`);
                            return {
                                ...baseItem,
                                ...config,
                                ...override.override_payload,
                                isOverridden: true
                            };
                        }

                        return { ...baseItem, ...config };
                    }).filter(Boolean);

                    if (items.length === 0) {
                        setLoadError(`Prova carregada, mas questões não encontradas no cache. (Qtd: ${configSource.length})`);
                    }

                    if (exam.model === 'ADAPTATIVO') {
                        setAdaptiveItems(items); // Guarda o pool completo
                        // Seleciona o primeiro item (theta = 0)
                        const firstItem = CATEngine.selectNextItem(0, items, []);
                        setExamItems(firstItem ? [firstItem] : []);
                    } else {
                        setExamItems(items);
                    }
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

        // Carregamento automático da sessão via useStudentSession (Cold Boot Nível 1)
        // Não é mais necessário useEffect manual para getLastSession
        if (currentSession && !currentSession.synced) {
            console.log("Sessão encontrada:", currentSession);
            setFoundSession(currentSession);
            setShowResumeModal(true);
        } else {
            setStep('CONFIRM_IDENTITY');
        }
    }, [studentData, currentSession]);

    // 🔒 Fullscreen Security Hook
    const { enterKioskMode } = useFullscreenSecurity(step, cameraActive, isSessionActive);

    // 👁️ Comportamental: Monitoramento Anti-Cola (Phase 4)
    useEffect(() => {
        if (step !== 'EXAM') return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.warn('⚠️ FRAUDE DETECTADA: Aluno escondeu a aba ou minimizou o app.');
                triggerProctoringLock('TAB_SWITCH', 'O aplicativo foi minimizado ou a aba foi trocada.');
            }
        };

        const handleBlur = () => {
            console.warn('⚠️ FRAUDE DETECTADA: Aluno retirou o foco da janela da prova.');
            triggerProctoringLock('TAB_SWITCH', 'Você clicou fora da área da prova ou partiu a tela.');
        };

        const triggerProctoringLock = (type: string, reasonDetails: string) => {
            setIsScreenLocked(true);
            setLockReason(reasonDetails);

            // Logar localmente (via hook proctoring existente indireto ou Telemetria)
            if (meshInitialized && studentData?.id) {
                getTelemetryService().logViolation({
                    studentId: studentData.id,
                    eventType: type as any,
                    severity: 'HIGH',
                    timestamp: Date.now(),
                    metadata: { detail: reasonDetails }
                });
            }

            // Avisar ao professor ativamente:
            if (studentData?.id) {
                getMeshNetwork().broadcastMessage('ALERT', {
                    type: 'SECURITY_EVENT',
                    studentId: studentData.id,
                    studentName: studentData.name,
                    eventType: type,
                    severity: 'HIGH',
                    timestamp: Date.now()
                });
            }
        };

        // Escutar ativamente
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [step, meshInitialized, studentData]);

    // ✨ Auto-logout após completar prova (multi-login)
    useEffect(() => {
        if (step === 'COMPLETED' && isSessionActive) {
            const timer = setTimeout(() => {
                console.log('🚪 Auto-logout (concluído)...');
                logout();
            }, 30000); // 30s para ver resultado
            return () => clearTimeout(timer);
        }
    }, [step, isSessionActive]);

    // 🌐 Cleanup mesh network ao desmontar
    useEffect(() => {
        return () => {
            if (meshInitialized) {
                console.log('🔌 Desconectando mesh network...');
                getMeshNetwork().shutdown();
                getTelemetryService().stop();
                getAlertingService().stop();

                // Limpar interval de sync
                if ((window as any).__meshSyncInterval) {
                    clearInterval((window as any).__meshSyncInterval);
                }

                console.log('✅ Mesh network desconectada');
            }
        };
    }, [meshInitialized]);

    // --- PHASE 7: MESH MODE DETECTION ---
    const isMeshMode = React.useMemo(() =>
        examItems.some(i => i.origin === 'MESH_SYNC'),
        [examItems]);

    // Use shuffled items for the exam
    const actualItems = shuffledItems;

    // UI Blocking for Loading
    // Confere se temos itens da prova OU se estamos usando mock (shuffledItems)
    const hasItems = (examItems && examItems.length > 0) || (shuffledItems && shuffledItems.length > 0);
    const isItemsEmpty = !hasItems;

    if (loadingExam || (isItemsEmpty && !loadError)) {
        return (
            <div className="fixed inset-0 bg-[#0f1d2e] flex flex-col items-center justify-center text-white p-8 text-center z-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-brand-primary border-r-transparent mb-4"></div>
                <p>Carregando Questões...</p>
            </div>
        );
    }

    // --- SECURITY HANDLERS ---
    const handlePreventClipboard = (e: React.ClipboardEvent) => {
        e.preventDefault();
        alert('🚫 Ação Bloqueada: Copiar e Colar não é permitido no Modo Seguro.');
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    // --- ACTIONS ---

    // 🌐 Inicializar Mesh Network
    const initializeMeshNetwork = async (
        studentId: string,
        studentName: string,
        examId: string,
        eventId: string
    ) => {
        try {
            console.log('🌐 Inicializando mesh network...');

            // 1. Conectar à mesh
            await getMeshNetwork().initialize({
                signalingServerUrl: envConfig.getSignalingUrl(),
                roomId: eventId,
                nodeId: studentId,
                nodeType: 'STUDENT',
                nodeName: studentName
            });

            // 2. Iniciar telemetria
            await getTelemetryService().start({
                studentId,
                studentName,
                examId,
                eventId,
                totalQuestions: actualItems.length || 0
            });

            // 3. Iniciar sistema de alertas
            getAlertingService().initialize({
                userId: studentId,
                userName: studentName,
                userType: 'STUDENT'
            });

            // 4. Configurar store
            useNetworkStore.getState().setNodeConfig({
                nodeId: studentId,
                nodeName: studentName,
                nodeType: 'STUDENT',
                eventId
            });

            // 5. Configurar callback de alertas e comandos
            getAlertingService().setOnAlertReceived((alert) => {
                setCurrentAlert(alert);
                setShowAlertModal(true);
                console.log('📨 Alerta recebido:', alert.message);
            });

            const mesh = getMeshNetwork();
            mesh.setOnMessageReceived((msg) => {
                if (msg.type === 'ENABLE_EXAM') {
                    console.log('🚀 Prova habilitada via Mesh pelo Professor!');
                    setExamUnlockedByMesh(true);
                }
                
                if (msg.type === 'UNLOCK_SCREEN') {
                    if (msg.payload.targetStudentId === studentId) {
                        console.log('🔓 Tela desbloqueada remotamente pelo professor!');
                        setIsScreenLocked(false);
                    }
                }

                if (msg.type === 'HANDSHAKE_RESPONSE' && msg.payload.targetStudentId === studentId) {
                    console.log('🔑 Chave de prova recebida via Mesh Handshake');
                }
            });

            // 6. Sincronizar com store
            const { setupCallbacks, syncMesh } = useNetworkSync();
            setupCallbacks();

            // Sync inicial e periódico (incluindo bateria e questão atual)
            const sendMeshUpdate = () => {
                const answeredCount = Object.keys(answers).filter(k => !k.includes('_text')).length;

                // Simular nível de bateria se não houver API nativa
                const batteryLevel = (window as any).navigator.getBattery
                    ? 100 // Placeholder, idealmente seria async
                    : 85;

                syncMesh();
                mesh.sendTelemetry({
                    studentId,
                    studentName,
                    batteryLevel, // Corrigido p/ bater com Dashboard
                    currentQuestion: currentQuestionIdx + 1,
                    answeredCount,
                    totalQuestions: actualItems.length,
                    step,
                    timestamp: Date.now()
                });
            };

            sendMeshUpdate();
            const syncInterval = setInterval(sendMeshUpdate, 10000);

            // Salvar interval para cleanup
            (window as any).__meshSyncInterval = syncInterval;

            setMeshInitialized(true);
            console.log('✅ Mesh network inicializada com sucesso!');
        } catch (error) {
            console.warn('⚠️ Falha ao inicializar mesh (modo offline):', error);
            // Não bloquear execução, mesh é opcional
        }
    };

    const handleJoinClass = async () => {
        if (!inputName.trim()) return alert("Digite seu nome.");
        setJoining(true);

        try {
            if (sessionMode === 'LIVE_REAL' && classIdParam) {
                // 1. Salvar Aluno no Banco (Isso dispara o Realtime no Lobby do Professor)
                const studentId = uuidv4();
                const regNum = Math.floor(Math.random() * 9000) + 1000;

                const { error } = await supabase.from('users').insert({
                    id: studentId,
                    name: inputName,
                    role: 'ALUNO',
                    registration_number: regNum.toString(),
                    class_ids: [classIdParam],
                    school_id: 's1', // Fixo demo
                    tenant_id: MOCK_TENANT_ID, // Fixo demo
                    status: 'ACTIVE'
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

                // 📱 Trigger Fullscreen for Mobile (Must happen on user interaction)
                try {
                    if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                    } else if ((document.documentElement as any).webkitRequestFullscreen) {
                        await (document.documentElement as any).webkitRequestFullscreen(); // Safari
                    }
                } catch (err) {
                    console.warn("Fullscreen blocked or not supported:", err);
                }

                // ✨ Iniciar sessão multi-login
                await startSession(studentId, inputName.trim());

                // 🌐 Iniciar mesh network
                await initializeMeshNetwork(studentId, inputName.trim(), examIdParam || '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90', classIdParam);

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

                // 🌐 Iniciar mesh network (modo local)
                await initializeMeshNetwork(localStudentId, inputName.trim(), '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90', 'local');
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
                // Reconstruir answers do array de objetos (Sprint 2 schema)
                const reconstructedAnswers: Record<string, string | string[]> = {};
                foundSession.encryptedAnswers.forEach(a => {
                    const question = actualItems.find(q => q.id === (typeof a.questionId === 'string' ? a.questionId : `q${a.questionId}`));
                    if (question) {
                        reconstructedAnswers[question.id] = a.answer;
                    }
                });

                setAnswers(reconstructedAnswers as Record<string, string>);
                
                // Telemetria e Tempo
                if (foundSession.telemetry && foundSession.telemetry.batteryLevels) {
                    // Recuperar última questão se disponível
                    const lastIdx = foundSession.telemetry.timePerQuestion?.length ? foundSession.telemetry.timePerQuestion.length - 1 : 0;
                    setCurrentQuestionIdx(lastIdx);
                }

                setStep('EXAM');
                setTimerActive(true);
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

    const sendHybridAutosave = async (newAnswers: any) => {
        if (!meshInitialized || !studentData) return;

        try {
            const eventId = studentData.eventId;
            const studentId = studentData.id;
            const examId = studentData.examId;

            // 1. Derivar/Recuperar Chave (T3 Cache)
            if (!encryptionKeyRef.current && eventId && studentId) {
                encryptionKeyRef.current = await E2EEncryptionService.deriveStudentKey(eventId, studentId);
            }
            const key = encryptionKeyRef.current;
            if (!key) return;

            // 2. Telemetria Básica (Header Público)
            const count = Object.keys(newAnswers).filter(k => !k.includes('_text')).length;
            getTelemetryService().updateAnsweredCount(count);
            getTelemetryService().updateCurrentQuestion(currentQuestionIdx + 1);
            const telemetryData = getTelemetryService().getCurrentData();

            // 3. Cifrar Respostas (Payload Privado)
            // Para T3, ciframos o objeto answers direto.
           // Cifrar dados (answers é Record<string, string>)
       const encryptedPackage = await E2EEncryptionService.encryptData(newAnswers, key);

            // 4. Montar Envelope Híbrido
            const envelope: Omit<MeshHybridEnvelope, 'signature'> = {
                schemaVersion: '1.2',
                encryptionVersion: '1.0',
                payloadType: 'AUTOSAVE',
                eventId: eventId || 'unk',
                examId: examId || 'unk',
                studentId: studentId || 'unk',
                sessionId: currentSession?.sessionId,
                header: {
                    progress: Math.round((count / (examItems.length || 1)) * 100),
                    answeredCount: count,
                    currentQuestion: currentQuestionIdx + 1,
                    battery: telemetryData?.batteryLevel ?? 100,
                    isOnline: true,
                    timestamp: new Date().toISOString()
                },
                encryptedPayload: {
                    iv: encryptedPackage.iv,
                    data: encryptedPackage.data
                }
            };

            // 5. Assinar Envelope (Material Deterministico)
            const signature = await E2EEncryptionService.signPayload(JSON.stringify(envelope), eventId || 'secret');
            
            const finalEnvelope: MeshHybridEnvelope = {
                ...envelope,
                signature
            };

            // 6. Broadcast via Mesh
            getMeshNetwork().broadcastMessage('AUTOSAVE', finalEnvelope);
            console.log('🔒 [MESH] Hybrid AUTOSAVE disparado com sucesso.');

        } catch (error) {
            console.error('❌ [MESH] Erro ao gerar envelope híbrido:', error);
        }
    };

    const handleOptionSelect = async (qId: string, optId: string) => {
        const newAnswers = { ...answers, [qId]: optId };
        setAnswers(newAnswers);

        // ✨ Salvar via multi-login session
        if (isSessionActive && actualItems.length > 0) {
            const questionIndex = actualItems.findIndex(q => q.id === qId);
            if (questionIndex >= 0) {
                await saveAnswer(questionIndex + 1, optId);
            }
        }

        // 1. Salvar no IndexedDB (Dexie V2 via SessionIsolationService)
        await saveAnswer(currentQuestionIdx, optId as string);

        // 2. Broadcast via Mesh com Envelope Híbrido (Criptografado)
        await sendHybridAutosave(newAnswers);

        // Registro de telemetria
        await updateTelemetry({
            batteryLevel: (window as any).batteryLevel || 100,
            lastQuestion: currentQuestionIdx,
            answeredCount: Object.keys(newAnswers).length
        });


        // --- ADAPTIVE LOGIC (IRT) ---
        const exam = state.exams.find(e => e.id === examIdParam);
        if (exam?.model === 'ADAPTATIVO' && adaptiveItems.length > 0) {
            const item = adaptiveItems.find(i => i.id === qId);
            if (item && item.triParams) {
                const correctAlt = item.alternatives.find((a: any) => a.isCorrect);
                const itemResponse: ItemResponse = {
                    itemId: item.id,
                    isCorrect: optId === correctAlt?.id,
                    difficulty: item.triParams.difficulty,
                    discrimination: item.triParams.discrimination,
                    guessing: item.triParams.guessing
                };

                // Estimar novo Theta
                // Usamos todas as respostas dadas até agora para o motor IRT
                const currentResponses: ItemResponse[] = [];
                Object.entries(newAnswers).forEach(([id, val]) => {
                    const it = adaptiveItems.find(i => i.id === id);
                    if (it && it.triParams) {
                        const cAlt = it.alternatives.find((a: any) => a.isCorrect);
                        currentResponses.push({
                            itemId: it.id,
                            isCorrect: val === cAlt?.id,
                            difficulty: it.triParams.difficulty,
                            discrimination: it.triParams.discrimination,
                            guessing: it.triParams.guessing
                        });
                    }
                });

                const newTheta = CATEngine.estimateTheta(currentResponses, currentTheta);
                setCurrentTheta(newTheta);
                console.log(`[IRT] Novo Theta estimado: ${newTheta.toFixed(4)}`);

                // Verifica se deve selecionar o próximo item adaptivemente
                // Apenas se clicou na última questão carregada até agora
                if (currentQuestionIdx === examItems.length - 1) {
                    const nextItem = CATEngine.selectNextItem(
                        newTheta,
                        adaptiveItems,
                        examItems.map(i => i.id)
                    );

                    if (nextItem) {
                        setExamItems((prev: any[]) => [...prev, nextItem]);
                        // Opcional: Auto-avançar para a nova questão?
                        // setCurrentQuestionIdx(prev => prev + 1);
                    }
                }
            }
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
                console.log('🎓 Sessão multi-login finalizada:', completedSession.sessionId);
            }

            const rawAnswers = Object.keys(answers).map(qId => ({
                itemId: qId,
                selectedAlternativeId: answers[qId],
                text: answers[qId + '_text'] || null
            }));

            // 📡 FASE 2: COLETA AUTOMÁTICA MESH (LOCAL P2P)
            // Tenta enviar a prova primeiramente pela rede local hosteada pelo Professor
            if (studentData) {
                try {
                    console.log('📡 [MESH] Transmitindo respostas pela rede local...');
                    const mesh = getMeshNetwork();
                    mesh.broadcastMessage('ANSWER', {
                        eventId: studentData.eventId,
                        examId: studentData.examId,
                        studentId: studentData.id,
                        studentName: studentData.name,
                        answers: rawAnswers,
                        score: gradingResult.totalScore,
                        timestamp: new Date().toISOString()
                    });
                } catch(meshErr) {
                    console.warn('[MESH] Sem cobertura de malha local.', meshErr);
                }
            }

            // 🌩️ Tentativa ONLINE principal (Cloud Handoff)
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
                await new Promise(resolve => setTimeout(resolve, 1500));
                setStep('COMPLETED');
            } else {
                // Modo Expresso Offline: Força o fluxo de fallback sem internet
                throw new Error("Conexão direta indisponível. Acionando guarda offline.");
            }

        } catch (e) {
            console.warn("Falha no envio online ou modo offline detectado...", e);

            // MODO OFFLINE ou FALHA DE SYNC → Gerar QR Code
            if (studentData && sessionMode !== 'LIVE_REAL') {
                // Modo offline/demo: Exibir OfflineSubmissionFlow
                console.log('📱 Modo offline: exibindo QR Code para coleta manual');
                const submissionAnswers: StudentAnswer[] = Object.entries(answers).map(([qId, val]) => ({
                    itemId: qId,
                    selectedAlternativeId: typeof val === 'string' ? val : null,
                    text: typeof val === 'string' ? val : undefined,
                    isCorrect: false,
                    scoreObtained: 0
                }));
                setStep('OFFLINE_SUBMISSION');
            } else if (studentData) {
                // A persistência já foi garantida pelo SessionIsolationService (saveAnswer)
                // O fallback aqui é para exibir o QR Code de contingência
                console.warn("⚠️ Sem conexão com o servidor. Respostas seguras em cache local.");
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
        lineHeight: a11y.lineHeight || 1.5,
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
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (!examUnlockedByMesh && sessionMode === 'LIVE_REAL') return;
                            setStep('EXAM');

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
                                    console.warn("Background attempt start:", err);
                                });
                            }
                        }}
                        disabled={!examUnlockedByMesh && sessionMode === 'LIVE_REAL'}
                        className={`w-full py-4 font-bold rounded-xl text-lg transition shadow-lg flex items-center justify-center gap-3 ${(!examUnlockedByMesh && sessionMode === 'LIVE_REAL')
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-brand-primary text-white hover:bg-brand-dark'
                            }`}
                    >
                        {(!examUnlockedByMesh && sessionMode === 'LIVE_REAL') ? (
                            <>Aguardando Professor...</>
                        ) : (
                            <><Play size={20} fill="white" /> Iniciar Prova</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'COMPLETED') {
        const score = (studentData as any)?.lastScore;
        const total = (studentData as any)?.lastTotal;

        return (
            <StudentResultsView
                studentName={studentData?.name || 'Aluno'}
                score={score !== undefined ? score : 0}
                total={total || actualItems.length || 10}
                items={actualItems || []}
                answers={answers}
                onExit={() => window.location.href = '/'}
            />
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
                exam={{
                    id: examIdParam || 'demo',
                    title: studentData?.examTitle || 'Prova',
                    items: actualItems
                } as any}
                answers={Object.entries(answers).map(([itemId, value]) => ({
                    itemId,
                    selectedAlternativeId: typeof value === 'string' && !itemId.includes('_text') ? value : null,
                    text: (answers[`${itemId}_text`] as string) || undefined, // Fix null vs undefined
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

    // --- EXAM UI ---
    if (isScreenLocked) {
        return (
            <div className="fixed inset-0 bg-red-900 flex flex-col items-center justify-center text-white p-8 text-center z-50">
                <AlertTriangle size={64} className="text-red-500 mb-6 animate-pulse" />
                <h1 className="text-3xl font-bold mb-4 uppercase tracking-wider">Prova Bloqueada</h1>
                <p className="text-lg text-red-200 font-medium max-w-lg mb-8">
                    {lockReason}
                </p>
                <div className="bg-red-950 border border-red-800 p-6 rounded-2xl scale-95 md:scale-100">
                    <p className="text-sm text-red-300 font-bold uppercase mb-2">Ação Exigida:</p>
                    <p className="text-white">Levante a mão e solicite ao professor o <b>desbloqueio remoto</b> de sua máquina para poder continuar de onde parou.</p>
                </div>
            </div>
        );
    }

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
            {/* WARNING BANNER - Auto Fade */}
            <div className={`fixed top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-2 rounded-full shadow-lg z-40 font-bold text-sm flex items-center gap-2 transition-opacity duration-1000 ${violationCount > 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <AlertTriangle size={16} /> {violationCount} Infrações Detectadas
            </div>

            <div className={`h-14 flex justify-between items-center px-4 shadow-md flex-shrink-0 z-20 ${a11y.theme === 'high-contrast' ? 'bg-black text-yellow-400 border-b border-yellow-400' : 'bg-[#0f1d2e] text-white'}`}>
                <div className="text-sm font-bold truncate max-w-[150px] md:max-w-none">{studentData.name}</div>
                <div className="flex gap-2 items-center">
                    <div className={`px-2 py-1 rounded font-mono text-[10px] md:text-xs border flex items-center gap-1 ${a11y.theme === 'high-contrast' ? 'border-yellow-400 text-yellow-400' : 'bg-slate-800 border-slate-700 text-emerald-400'}`}>
                        <Wifi size={10} />
                        <span className="hidden sm:inline">
                            {isMeshMode ? 'Mesh (Offline)' : (sessionMode === 'LIVE_REAL' ? 'Online' : 'Local')}
                        </span>
                    </div>
                    {isKioskActive && <div className={`px-2 py-1 rounded font-mono text-[10px] md:text-xs border ${a11y.theme === 'high-contrast' ? 'border-white text-white' : 'bg-emerald-900 text-emerald-300 border-emerald-700'}`}>Kiosk</div>}
                    {meshInitialized && <NetworkStatusInline />}
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
                                                setAnswers((prev: Record<string, any>) => ({
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

                    <SyncMonitor a11y={a11y} cameraActive={cameraActive} />
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

            {/* 🌐 BOTÃO PEDIR AJUDA */}
            {meshInitialized && (
                <button
                    onClick={() => {
                        getAlertingService().sendAlert({
                            to: 'BROADCAST',
                            type: 'HELP_REQUEST',
                            message: `${studentData.name} precisa de ajuda na questão ${currentQuestionIdx + 1}`
                        });
                        alert('✅ Pedido de ajuda enviado ao professor!');
                    }}
                    className="fixed bottom-20 right-4 bg-yellow-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-30"
                    title="Pedir Ajuda"
                >
                    <HelpCircle size={24} />
                </button>
            )}

            {/* 🌐 MODAL DE ALERTAS */}
            {showAlertModal && currentAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="text-yellow-500" size={28} />
                            Alerta do Professor
                        </h3>
                        <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                            {currentAlert.message}
                        </p>
                        <button
                            onClick={() => {
                                getAlertingService().markAsRead(currentAlert.id);
                                setShowAlertModal(false);
                                setCurrentAlert(null);
                            }}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition"
                        >
                            OK, Entendi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
