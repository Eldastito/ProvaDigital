import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { SimulationRenderer } from './SimulationRenderer';
import { AccessibilityConfig, DEFAULT_ACCESSIBILITY_CONFIG } from './types';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, CloudUpload } from 'lucide-react';
import { Exam, Item, StudentAnswer } from '../../../types';
import { useProctoring } from '../../../hooks/useProctoring';
import { RichTextRenderer } from '../../../components/RichTextRenderer';

interface OnlineExamRunnerProps {
    examId: string;
    studentId: string;
    variantId?: string;
    onExit: () => void;
    onComplete: (answers: StudentAnswer[]) => void;
}

export const OnlineExamRunner = ({ examId, studentId, variantId, onExit, onComplete }: OnlineExamRunnerProps) => {
    const state = useAppStore();

    // --- ACCESSIBILITY STATE ---
    const [a11y, setA11y] = useState<AccessibilityConfig>(DEFAULT_ACCESSIBILITY_CONFIG);

    // --- EXAM DATA ---
    const exam = state.exams.find(e => e.id === examId);

    const isAdaptive = exam?.model === 'ADAPTADO';
    const [adaptivePath, setAdaptivePath] = useState<Item[]>([]);
    const [currentTheta, setCurrentTheta] = useState<number>(0);
    const [adaptiveFinished, setAdaptiveFinished] = useState(false);
    const [showAdaptiveIntro, setShowAdaptiveIntro] = useState(isAdaptive); // Show intro if adaptive
    const [lastQuestionLoadedAt, setLastQuestionLoadedAt] = useState(Date.now());

    // For adaptive, this is the POOL. For linear, this is the exam.
    const itemPool = useMemo(() => state.items, [state.items]);

    // The items to DISPLAY (Linear: all fixed items; Adaptive: items selected so far)
    const activeExamItems = useMemo(() => {
        if (!exam) return [];
        if (isAdaptive) return adaptivePath;

        // Classic Fixed Exam Logic
        return exam.items.map(config => {
            const item = state.items.find(i => i.id === config.itemId);
            return item ? { ...item, ...config } : null;
        }).filter(Boolean) as Item[];
    }, [exam, state.items, isAdaptive, adaptivePath]);

    // --- SESSION STATE ---
    const { startExamAttempt, logSecurityEvent, submitExamAttempt, initializeExamEvents, leaveExamChannel, saveExamProgress, examAttempts } = state;
    const [attemptId, setAttemptId] = useState<string | null>(() => {
        return localStorage.getItem(`exam_attempt_${examId}_${studentId}`);
    });

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // itemId -> selectedAlternativeId
    const [isRestored, setIsRestored] = useState(false);

    // --- ACCESSIBILITY VARIANT LOGIC ---
    const variant = state.examVariants.find(v => v.id === variantId);

    // Applying extra time if variant rules specify it (e.g., TDAH +25%)
    const extraTimeMinutes = useMemo(() => {
        if (!variant || !variant.variantRules) return 0;
        return variant.variantRules.extraTimePercent
            ? Math.floor((exam?.durationMinutes || 0) * (variant.variantRules.extraTimePercent / 100))
            : 0;
    }, [variant, exam]);

    const totalDurationSeconds = ((exam?.durationMinutes || 0) + extraTimeMinutes) * 60;
    const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);

    // Initial attempt start & Data Fetching
    useEffect(() => {
        if (!examId || !studentId || !exam) return;

        const initSession = async () => {
            // 1. Ensure items are loaded (The whole pool for adaptive)
            await state.fetchExamItems(examId);

            // 2. Check for existing active attempt (Server State -> LocalStorage)
            let activeId = attemptId;

            // If we don't have local ID, check store/DB for an open attempt for this user+exam
            if (!activeId) {
                const existing = examAttempts.find(a =>
                    a.studentId === studentId &&
                    a.examVersionId === exam.id &&
                    a.status === 'started'
                );
                if (existing) activeId = existing.id;
            }

            // 3. Start or Resume
            if (!activeId) {
                // New Attempt
                activeId = await startExamAttempt({
                    examId: exam.id,
                    examVersionId: exam.id,
                    studentId: studentId
                });
                setAttemptId(activeId);
                localStorage.setItem(`exam_attempt_${exam.id}_${studentId}`, activeId);

                // ADAPTIVE START: Pick first item if empty
                if (isAdaptive) {
                    const { CATEngine } = await import('../../../services/grading/catEngine');
                    // Pick best item for Theta=0 (Average student)
                    const firstItem = CATEngine.selectNextItem(0, itemPool, []);
                    if (firstItem) {
                        setAdaptivePath([firstItem]);
                        // Save initial path to metadata (TODO: Persist in DB)
                    }
                }

            } else {
                setAttemptId(activeId);
                // Resume logic: Load answers and sync timer
                const attempt = examAttempts.find(a => a.id === activeId);
                if (attempt) {
                    // Restore Answers
                    if (attempt.metadata?.savedAnswers) {
                        setAnswers(attempt.metadata.savedAnswers);
                    }

                    // Restore Adaptive State
                    if (isAdaptive && attempt.metadata?.adaptivePath) {
                        setAdaptivePath(attempt.metadata.adaptivePath);
                        setCurrentTheta(attempt.metadata.currentTheta || 0);
                    } else if (isAdaptive && adaptivePath.length === 0) {
                        // Fallback if metadata missing but resume needed (Should not happen in prod)
                        const { CATEngine } = await import('../../../services/grading/catEngine');
                        const firstItem = CATEngine.selectNextItem(0, itemPool, []);
                        if (firstItem) setAdaptivePath([firstItem]);
                    }

                    // Restore Timer
                    if (attempt.startedAt) {
                        const startTime = new Date(attempt.startedAt).getTime();
                        const now = Date.now();
                        const elapsedSeconds = Math.floor((now - startTime) / 1000);
                        const remaining = Math.max(0, totalDurationSeconds - elapsedSeconds);
                        setTimeLeft(remaining);
                    }
                }
            }

            setIsRestored(true);

            // 4. Join Realtime
            initializeExamEvents(examId);
        };

        if (!isRestored) {
            initSession();
        }

        return () => {
            leaveExamChannel();
        };
    }, [exam, studentId, examId, isRestored, isAdaptive, itemPool]);

    // Update timer on question change
    useEffect(() => {
        setLastQuestionLoadedAt(Date.now());
    }, [currentQuestionIndex]);

    // Timer Tick
    useEffect(() => {
        if (!isRestored || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleFinalize(true); // Auto-submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isRestored, timeLeft]);

    // --- SECURITY GATE STATE ---
    const [securityCheckPassed, setSecurityCheckPassed] = useState(false);
    const [auditWaived, setAuditWaived] = useState(false);

    // Replaces manual listeners. Handles Alt-Tab, Focus, Offline, etc.
    const { isKioskActive, startScreenShare } = useProctoring({
        isActive: !!attemptId,
        studentId: studentId,
        studentName: state.currentUser?.name,
        onViolation: (reason, type, evidence) => {
            if (attemptId) {
                logSecurityEvent({
                    attemptId,
                    eventType: type.toLowerCase() as any, // 'focus_lost', etc
                    severity: type === 'FOCUS_LOST' ? 'warning' : 'info',
                    eventData: {
                        reason,
                        evidence,
                        auditRightsWaived: auditWaived // Tag logic
                    }
                });
            }
            if (type === 'FOCUS_LOST') {
                alert("⚠️ ATENÇÃO: O foco na prova foi perdido. O professor foi notificado e uma captura de tela foi registrada.");
            }
        }
    });

    const handleSecurityCheck = async () => {
        const allowed = await startScreenShare();
        if (allowed) {
            setSecurityCheckPassed(true);
        } else {
            // Permission Denied Flow
            const confirmWaiver = window.confirm(
                "⚠️ COMPARTILHAMENTO NEGADO\n\n" +
                "Ao negar o compartilhamento de tela:\n" +
                "1. O professor será notificado imediatamente.\n" +
                "2. Você abre mão do direito de solicitar auditoria em caso de anulação por suspeita de fraude.\n" +
                "3. Um selo de 'Baixa Integridade' ficará visível no seu resultado.\n\n" +
                "Deseja continuar mesmo assim assumindo os riscos?"
            );

            if (confirmWaiver) {
                setAuditWaived(true);
                setSecurityCheckPassed(true);
                // Log Waiver
                if (attemptId) {
                    logSecurityEvent({
                        attemptId,
                        eventType: 'info',
                        severity: 'info',
                        eventData: {
                            reason: 'User explicitly waived audit rights by denying screen share',
                            action: 'AUDIT_WAIVER_ACCEPTED'
                        }
                    });
                }
            }
        }
    };

    const handleAnswer = async (itemId: string, alternativeId: string) => {
        const newAnswers = { ...answers, [itemId]: alternativeId };
        setAnswers(newAnswers);

        // Auto-save debounce could be added here, but for safety we save critical progress immediately
        if (attemptId) {
            await saveExamProgress(attemptId, newAnswers);
        }
    };

    // --- ADAPTIVE NAVIGATION LOGIC ---
    const handleNextAdaptive = async () => {
        // 0. RAPID GUESSING CHECK
        const timeSpentMs = Date.now() - lastQuestionLoadedAt;
        if (timeSpentMs < 5000) {
            const confirmRapid = window.confirm("⚠️ Resposta muito rápida!\n\nVocê respondeu em menos de 5 segundos. Em provas adaptativas, 'chutar' rápido pode prejudicar sua nota de proficiência mais do que demorar.\n\nTem certeza que deseja confirmar?");
            if (!confirmRapid) return;
        }
        // 1. Check if answer is correct (Local Grading for quick Phi update)
        // In a real secure scenario, this should be server-side, but for Client-Side Adaptive:
        const currentItem = activeExamItems[currentQuestionIndex];
        const selectedAltId = answers[currentItem.id];

        if (!selectedAltId) {
            alert("Por favor, selecione uma resposta para continuar.");
            return;
        }

        // Dynamically import Engine
        const { CATEngine } = await import('../../../services/grading/catEngine');

        // 2. Prepare History for Theta Estimation
        const history = activeExamItems.map(item => {
            const ansId = answers[item.id];
            if (!ansId) return null; // Should not happen for past items
            const isCorrect = item.alternatives.find(a => a.id === ansId)?.isCorrect || false;

            return {
                itemId: item.id,
                isCorrect,
                discrimination: item.triParams?.discrimination || 1,
                difficulty: item.triParams?.difficulty || 0,
                guessing: item.triParams?.guessing || 0.2
            };
        }).filter(Boolean) as any[]; // TODO: Import ItemResponse type

        // 3. Estimate New Theta
        const newTheta = CATEngine.estimateTheta(history, currentTheta);
        setCurrentTheta(newTheta);
        console.log(`🧠 [CAT] Novo Theta Estimado: ${newTheta.toFixed(3)}`);

        // 4. STOPPING RULES
        // Rule A: Max Items (e.g. 45 or exam config)
        const maxItems = exam?.targetQuestionCount || 30;
        if (activeExamItems.length >= maxItems) {
            // Adaptive Finished
            setAdaptiveFinished(true);
            handleFinalize(false);
            return;
        }

        // Rule B: Standard Error Low Enough (Precision Reached)
        const see = CATEngine.calculateStandardError(newTheta, history);
        if (see < 0.3 && activeExamItems.length > 10) { // Minimum 10 items
            console.log(`🎯 [CAT] Precisão alcançada (SEE: ${see.toFixed(2)}). Finalizando.`);
            setAdaptiveFinished(true);
            handleFinalize(false);
            return;
        }

        // 5. Select Next Item
        const usedIds = activeExamItems.map(i => i.id);
        const nextItem = CATEngine.selectNextItem(newTheta, itemPool, usedIds);

        if (!nextItem) {
            console.log("⚠️ [CAT] Banco de itens esgotado para este nível.");
            setAdaptiveFinished(true);
            handleFinalize(false);
            return;
        }

        // 6. Update Path & UI
        const newPath = [...adaptivePath, nextItem];
        setAdaptivePath(newPath);

        // Persist Adaptive State in Metadata
        if (attemptId) {
            await saveExamProgress(attemptId, answers, {
                adaptivePath: newPath,
                currentTheta: newTheta
            });
        }

        // Move to next
        setCurrentQuestionIndex(prev => prev + 1);
    };


    const handleFinalize = async (isTimeout = false) => {
        try {
            // Importar serviço de correção automática
            const { AutoGradingService } = await import('../../../services/grading/autoGradingService');

            // Preparar respostas no formato StudentAnswer
            const studentAnswers: StudentAnswer[] = activeExamItems.map(item => {
                const selectedAltId = answers[item.id];
                const essayText = (item.type === 'ESSAY' || item.type === 'REDACTION')
                    ? (answers as any)[`${item.id}_text`]
                    : null;

                return {
                    itemId: item.id,
                    selectedAlternativeId: selectedAltId || null,
                    text: essayText,
                    isCorrect: false, // Será definido pelo serviço
                    scoreObtained: 0
                };
            });

            // CORREÇÃO AUTOMÁTICA COM IA ONLINE HABILITADA
            console.log('🎓 Iniciando correção automática online (IA Gemini habilitada para dissertativas)...');
            const gradingResult = await AutoGradingService.gradeFullExam(
                exam!,
                studentAnswers,
                'online', // Modo online - permite IA Gemini para dissertativas
                true // Conexão disponível
            );

            console.log('✅ Correção concluída:', gradingResult);

            if (attemptId) {
                const status = isTimeout ? 'timed_out' : 'submitted';
                // Save final theta in metadata if adaptive
                const finalMeta = isAdaptive ? {
                    finalTheta: currentTheta,
                    adaptiveTraj: activeExamItems.map(i => i.id)
                } : undefined;

                submitExamAttempt(attemptId, status); // TODO: Pass finalMeta to submit if supported
                localStorage.removeItem(`exam_attempt_${examId}_${studentId}`); // Clear local session
            }

            // 3. Salvar Resultado (Mock ou Real)
            /* 
               Aqui normalmente chamaríamos uma action do store para salvar no DB.
               Para o demo, vamos apenas atualizar o estado local se necessário.
            */

            // --- AUTOMATED RECOVERY CYCLE (CLOSING THE LOOP) ---
            try {
                const { StudyPlanGenerator } = await import('../../../services/ai/studyPlanGenerator');

                // Construct a temporary ExamResult for the generator
                const tempResult: any = {
                    id: attemptId || 'temp_result',
                    examId: examId || '',
                    studentId: studentId || 'guest',
                    totalScore: gradingResult.totalScore,
                    answers: gradingResult.answers,
                    gradedAt: new Date().toISOString()
                };

                const studyPlan = StudyPlanGenerator.generate(tempResult, exam);

                if (studyPlan) {
                    // Salvar no Store (usando getState para acessar a action recém-criada)
                    // @ts-ignore - Action injetada dinamicamente
                    useAppStore.getState().addStudyPlan(studyPlan);

                    // Notificar usuário (Gamificação)
                    const totalReward = studyPlan.tasks.reduce((acc, t) => acc + (t.rewardSafe || 0), 0);
                    alert(`⚠️ Atenção: Detectamos algumas dificuldades.\n\n📚 Um Plano de Recuperação Personalizado foi gerado para você!\n\nComplete as tarefas para ganhar +${totalReward} OwlCoins! 🦉`);
                }
            } catch (recoveryError) {
                console.error("Erro no ciclo de recuperação:", recoveryError);
            }
            // ---------------------------------------------------

            // Retornar respostas corrigidas
            onComplete(gradingResult.answers);
        } catch (error) {
            console.error('Erro na correção automática, usando fallback...', error);

            // FALLBACK: Correção simples apenas para objetivas
            const finalAnswers: StudentAnswer[] = activeExamItems.map(item => {
                const selectedAltId = answers[item.id];
                const selectedAlt = item.alternatives.find(a => a.id === selectedAltId);
                const isCorrect = selectedAlt?.isCorrect || false;

                // Adaptive Score: Could use Theta, but for fallback use classic sum
                const score = isAdaptive ? (isCorrect ? 1 : 0) : ((item as any).score || 1);

                return {
                    itemId: item.id,
                    selectedAlternativeId: selectedAltId || null,
                    isCorrect,
                    scoreObtained: isCorrect ? score : 0,
                    gradingMethod: 'OFFLINE_OBJECTIVE' as any
                };
            });

            if (attemptId) {
                submitExamAttempt(attemptId, isTimeout ? 'timed_out' : 'submitted');
                localStorage.removeItem(`exam_attempt_${examId}_${studentId}`);
            }

            onComplete(finalAnswers);
        }
    };

    if (!exam) return <div className="p-8 text-center">Prova não encontrada.</div>;

    if (!exam) return <div className="p-8 text-center">Prova não encontrada.</div>;

    // --- ADAPTIVE INTRO MODAL ---
    if (isAdaptive && showAdaptiveIntro && !isRestored) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95 text-white p-4">
                <div className="max-w-2xl w-full bg-gray-800 rounded-2xl p-8 shadow-2xl border border-blue-500/30 ring-1 ring-blue-500/20">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-600 rounded-lg">
                            <CloudUpload size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Prova Adaptativa Inteligente</h2>
                            <p className="text-blue-300">Leia com atenção antes de começar</p>
                        </div>
                    </div>

                    <div className="space-y-6 text-gray-300 leading-relaxed mb-8">
                        <p>
                            Esta avaliação utiliza <strong>Inteligência Artificial (TRI)</strong> para medir sua proficiência real, não apenas o número de acertos.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">🚫 Não é possível voltar</h4>
                                <p className="text-sm">Sua resposta define a próxima pergunta. Uma vez confirmada, não há como alterar.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">⏱️ Tempo vs. Precisão</h4>
                                <p className="text-sm">Chutar rápido demais (menos de 5s) pode ser interpretado como falta de conhecimento. Pense antes de responder.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">📈 Dificuldade Dinâmica</h4>
                                <p className="text-sm">Se acertar, fica mais difícil. Se errar, fica mais fácil. Isso é normal e esperado.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">🎯 Foco na Qualidade</h4>
                                <p className="text-sm">A prova pode acabar antes se o sistema já tiver certeza da sua nota. Não se assuste.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAdaptiveIntro(false)}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-[1.01]"
                    >
                        Entendi, começar prova
                    </button>
                </div>
            </div>
        );
    }

    // --- SECURITY GATE UI ---
    if (!securityCheckPassed && !isRestored) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95 text-white p-4">
                <div className="max-w-md w-full bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 text-blue-400">🛡️ Verificação de Segurança</h2>
                    <p className="mb-6 text-gray-300 leading-relaxed">
                        Para garantir a integridade da prova e proteger seu resultado contra suspeitas de erro,
                        solicitamos a permissão de <strong>Compartilhamento de Tela</strong>.
                    </p>
                    <ul className="text-sm text-gray-400 mb-6 space-y-2 list-disc pl-5">
                        <li>Apenas monitores fiscais terão acesso.</li>
                        <li>Usado para validar falhas técnicas.</li>
                        <li>Garante seu direito de auditoria.</li>
                    </ul>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleSecurityCheck}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-all shadow-lg text-white"
                        >
                            📸 Permitir e Iniciar Prova
                        </button>
                        <button
                            onClick={handleSecurityCheck} // Will trigger deny flow if they cancel the browser prompt
                            className="text-xs text-gray-500 hover:text-gray-300 underline mt-2"
                        >
                            Prefiro não compartilhar (Assumir riscos)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Adaptive: Wait for first item selection
    if (isAdaptive && activeExamItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Calibrando Motor Adaptativo...</h3>
                <p className="text-slate-500">Ajustando nível inicial.</p>
            </div>
        );
    }

    const currentItem = activeExamItems[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === activeExamItems.length - 1;

    // --- LOADING / EMPTY STATE GUARDS ---
    if (state.items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Carregando itens...</h3>
                <p className="text-slate-500">Sincronizando banco de dados seguro.</p>
            </div>
        );
    }

    // Classic empty check
    if (!isAdaptive && activeExamItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Erro: Esta prova não possui questões cadastradas ou os itens não foram encontrados.</h3>
                <button onClick={onExit} className="mt-4 px-6 py-2 bg-brand-primary text-white rounded-lg">Voltar</button>
            </div>
        );
    }

    if (!currentItem) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Erro ao carregar questão {currentQuestionIndex + 1}.</h3>
                <button onClick={onExit} className="mt-4 px-6 py-2 bg-brand-primary text-white rounded-lg">Voltar</button>
            </div>
        );
    }
    // --- HELPERS ---
    const getThemeClasses = () => {
        if (a11y.theme === 'high-contrast') return 'bg-black text-yellow-400 font-bold';
        if (a11y.theme === 'dark') return 'bg-slate-900 text-white';
        return 'bg-slate-50 text-slate-900';
    };

    const containerStyle = {
        fontSize: `${a11y.fontSize}%`,
        lineHeight: a11y.lineHeight
    };

    const handlePreventClipboard = (e: React.ClipboardEvent) => {
        e.preventDefault();
        alert('Ação bloqueada por segurança.');
    };

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${getThemeClasses()} flex flex-col select-none`}
            style={containerStyle}
            onCopy={handlePreventClipboard}
            onPaste={handlePreventClipboard}
            onCut={handlePreventClipboard}
            onContextMenu={(e) => e.preventDefault()}
        >

            {/* TOOLBAR (Floating) */}
            <AccessibilityToolbar config={a11y} onChange={setA11y} />

            {/* HEADER */}
            <header className={`px-6 py-4 flex justify-between items-center border-b ${a11y.theme === 'high-contrast' ? 'border-yellow-400' : 'border-slate-200 dark:border-slate-700'}`}>
                <div>
                    <h1 className="text-xl font-bold">{exam.title}</h1>
                    {!a11y.focusMode && (
                        <p className="text-sm opacity-70">
                            Questão {currentQuestionIndex + 1}
                            {isAdaptive ? '' : ` de ${activeExamItems.length}`}
                            {isAdaptive && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1 rounded border border-blue-200">ADAPTATIVO</span>}
                        </p>
                    )}
                </div>

                {/* TIMER & CONTROLS */}
                <div className="flex items-center gap-4">
                    {!a11y.hideTimer && (
                        <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded ${a11y.theme === 'high-contrast' ? 'border border-yellow-400' : 'bg-slate-200 dark:bg-slate-800'}`}>
                            <Clock size={20} />
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    )}
                    <button onClick={onExit} className="px-4 py-2 opacity-50 hover:opacity-100 uppercase text-sm font-bold tracking-wider">
                        Sair
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT Area */}
            <main className={`flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center ${a11y.focusMode ? 'justify-center' : ''}`}>

                {/* QUESTION CONTAINER */}
                <div className={`w-full max-w-4xl transition-all ${a11y.focusMode ? '' : 'bg-white/5 p-6 rounded-3xl border border-current/10'}`}>

                    {/* Item Statement */}
                    <div className="mb-8">
                        <RichTextRenderer
                            content={currentItem.statement}
                            className="text-2xl font-medium leading-relaxed"
                        />
                    </div>

                    {/* Simulation Item Type */}
                    {currentItem.type === 'SIMULATION' ? ( // Using literal string as Type might not be fully updated in import
                        <div className="mb-6">
                            {/* Dynamically import or used directly if imported */}
                            <SimulationRenderer
                                item={currentItem}
                                onInteraction={(data) => {
                                    // Save simulation state/result as answer
                                    // For now, we stringify the payload. 
                                    // Ideally, we'd have a specific answer field for this.
                                    handleAnswer(currentItem.id, JSON.stringify(data));
                                }}
                            />
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-blue-900">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    <strong>Instrução:</strong> Realize a atividade acima. Sua interação será salva automaticamente.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Standard Alternatives */
                        <div className="space-y-4">
                            {currentItem.alternatives.map((alt) => {
                                const isSelected = answers[currentItem.id] === alt.id;
                                let btnClass = "";

                                if (a11y.theme === 'high-contrast') {
                                    btnClass = isSelected
                                        ? "bg-yellow-400 text-black border-4 border-yellow-400 font-bold"
                                        : "bg-black text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-900";
                                } else {
                                    btnClass = isSelected
                                        ? "bg-brand-primary text-white shadow-lg transform scale-[1.01]"
                                        : "bg-white/50 dark:bg-slate-800 border border-current/10 hover:bg-black/5 dark:hover:bg-white/5";
                                }

                                return (
                                    <button
                                        key={alt.id}
                                        onClick={() => handleAnswer(currentItem.id, alt.id)}
                                        className={`w-full p-6 rounded-xl text-left transition-all flex items-center gap-4 text-lg ${btnClass}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-current' : 'border-current/50'}`}>
                                            {isSelected && <div className="w-4 h-4 rounded-full bg-current" />}
                                        </div>
                                        <RichTextRenderer
                                            content={alt.text}
                                            className="font-medium"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                </div>

            </main>

            {/* FOOTER NAVIGATION */}
            <footer className={`p-6 border-t ${a11y.theme === 'high-contrast' ? 'border-yellow-400' : 'border-slate-200 dark:border-slate-700'} flex justify-between items-center gap-4`}>
                <div className="hidden md:flex items-center gap-4 text-xs font-mono opacity-60">
                    <div className="flex items-center gap-1"><CheckCircle size={12} /> Local salvo</div>
                    <div className="flex items-center gap-1" title="Sincronizado com a nuvem"><CloudUpload size={12} /> Cloud Sync</div>
                </div>
                <div className="flex gap-4">
                    {/* BACK BUTTON: Disabled in Adaptive Mode (Rule: No backtracking) */}
                    {!isAdaptive && (
                        <button
                            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="px-8 py-4 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 hover:bg-current/10 transition"
                        >
                            <ChevronLeft /> Anterior
                        </button>
                    )}

                    {isLastQuestion ? (
                        isAdaptive ? (
                            // ADAPTIVE NEXT (No "Finish" until engine decides)
                            <button
                                onClick={handleNextAdaptive}
                                className={`px-12 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black hover:bg-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                            >
                                Próxima <ChevronRight />
                            </button>
                        ) : (
                            // STANDARD FINISH
                            <button
                                onClick={() => handleFinalize(false)}
                                className={`px-12 py-4 rounded-xl font-bold flex items-center gap-2 shadow-xl ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black hover:bg-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                            >
                                <CheckCircle /> Finalizar Prova
                            </button>
                        )
                    ) : (
                        // STANDARD NEXT
                        <button
                            onClick={() => setCurrentQuestionIndex(Math.min(activeExamItems.length - 1, currentQuestionIndex + 1))}
                            className={`px-12 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black hover:bg-white' : 'bg-brand-primary text-white hover:bg-blue-600'}`}
                        >
                            Próxima <ChevronRight />
                        </button>
                    )}
                </div>
            </footer >

            {/* FOCUS MODE OVERLAY (Ruler) */}
            {
                a11y.focusMode && (
                    <div className="fixed inset-0 pointer-events-none z-10 hidden md:block">
                        <div className="absolute top-0 left-0 right-0 h-[40vh] bg-black/80 backdrop-blur-sm" />
                        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-black/80 backdrop-blur-sm" />
                    </div>
                )
            }
        </div >
    );
};
