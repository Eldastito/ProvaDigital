import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { supabase } from '../../../services/supabaseClient';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { SimulationRenderer } from './SimulationRenderer';
import { AccessibilityConfig, DEFAULT_ACCESSIBILITY_CONFIG } from './types';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, CloudUpload, FileText, EyeOff, Minimize, Video } from 'lucide-react';
import { Exam, Item, StudentAnswer } from '../../../types';
import { useProctoring } from '../../../hooks/useProctoring';
import { RichTextRenderer } from '../../../components/RichTextRenderer';
import { DrawingCanvas } from './DrawingCanvas';
import { offlineCacheService } from '../../../services/offlineCacheService';
import { registerCachedExam } from '../../../services/offlineDb';
import { ReportingService } from '../../../services/reportingService';
import { DownloadCloud, CloudCheck, Download, Trophy, Target } from 'lucide-react'; // Some extra icons

interface OnlineExamRunnerProps {
    examId: string;
    studentId: string;
    variantId?: string;
    onExit: () => void;
    onComplete: (answers: StudentAnswer[]) => void;
}

export const OnlineExamRunner = ({ examId, studentId, variantId, onExit, onComplete }: OnlineExamRunnerProps) => {
    const state = useAppStore();
    const [a11y, setA11y] = useState<AccessibilityConfig>(DEFAULT_ACCESSIBILITY_CONFIG);

    // --- EXAM DATA ---
    const exam = state.exams.find(e => e.id === examId);
    const isAdaptive = exam?.model === 'ADAPTADO';
    const [adaptivePath, setAdaptivePath] = useState<Item[]>([]);
    const [currentTheta, setCurrentTheta] = useState<number>(0);
    const [adaptiveFinished, setAdaptiveFinished] = useState(false);
    const [showAdaptiveIntro, setShowAdaptiveIntro] = useState(isAdaptive);
    const [lastQuestionLoadedAt, setLastQuestionLoadedAt] = useState(Date.now());
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const itemPool = useMemo(() => state.items, [state.items]);

    const activeExamItems = useMemo(() => {
        if (!exam) return [];
        if (isAdaptive) return adaptivePath;
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
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [strikedOptions, setStrikedOptions] = useState<Record<string, string[]>>({});
    const [isRestored, setIsRestored] = useState(false);
    const [scratchpadValue, setScratchpadValue] = useState(() => {
        return localStorage.getItem(`exam_scratchpad_${examId}`) || '';
    });

    // --- OFFLINE CACHE STATE ---
    const [isOfflineReady, setIsOfflineReady] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    // Completion State
    const [isCompleted, setIsCompleted] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<any>(null);
    const [finalGrading, setFinalGrading] = useState<any>(null);

    useEffect(() => {
        const checkOffline = async () => {
            const ready = await offlineCacheService.isAvailableOffline(examId);
            setIsOfflineReady(ready);
        };
        checkOffline();
    }, [examId]);

    const handleDownloadOffline = async () => {
        if (!exam || activeExamItems.length === 0) return;
        setIsDownloading(true);
        try {
            const success = await offlineCacheService.downloadExamForOffline(exam, activeExamItems);
            if (success) {
                await registerCachedExam(exam.id, exam.title);
                setIsOfflineReady(true);
            } else {
                alert("Falha ao baixar prova. Verifique sua conexão.");
            }
        } catch (err) {
            console.error("Erro no download offline:", err);
        } finally {
            setIsDownloading(false);
        }
    };

    // --- ACCESSIBILITY LIBRAS LOGIC ---
    useEffect(() => {
        // Reset Libras URL when question changes to avoid showing old translation
        setA11y(prev => ({ ...prev, librasVideoUrl: null }));
    }, [currentQuestionIndex]);

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

    // Save Scratchpad
    useEffect(() => {
        localStorage.setItem(`exam_scratchpad_${examId}`, scratchpadValue);
    }, [scratchpadValue, examId]);

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
    // --- ADAPTIVE NAVIGATION LOGIC (SERVER-SIDE) ---
    const [isComputing, setIsComputing] = useState(false);

    const handleNextAdaptive = async () => {
        if (isComputing) return;

        // 0. RAPID GUESSING CHECK
        const timeSpentMs = Date.now() - lastQuestionLoadedAt;
        if (timeSpentMs < 5000) {
            const confirmRapid = window.confirm("⚠️ Resposta muito rápida!\n\nVocê respondeu em menos de 5 segundos. Em provas adaptativas, 'chutar' rápido pode prejudicar sua nota de proficiência mais do que demorar.\n\nTem certeza que deseja confirmar?");
            if (!confirmRapid) return;
        }

        const currentItem = activeExamItems[currentQuestionIndex];
        const selectedAltId = answers[currentItem.id];

        if (!selectedAltId) {
            alert("Por favor, selecione uma resposta para continuar.");
            return;
        }

        setIsComputing(true);

        try {
            // 1. Prepare Payload
            // We pass the full answers object, or just the incremental one if API supports it.
            // Our Edge Function expects 'attemptId' and 'userAnswers'

            console.log("📡 [CAT] Connecting to Secure Neural Engine...");

            const { data, error } = await supabase.functions.invoke('adaptive-next-item', {
                body: {
                    attemptId: attemptId,
                    userAnswers: answers
                }
            });

            if (error) throw error;

            console.log("🧠 [CAT] Server Response:", data);

            // 2. Update State from Server
            const { nextItemId, currentTheta: newTheta, finished } = data;

            setCurrentTheta(newTheta);

            // 3. Handle Finish
            if (finished || !nextItemId) {
                console.log("🏁 [CAT] Server indicates exam completion.");
                setAdaptiveFinished(true);
                handleFinalize(false);
                return;
            }

            // 4. Load Next Item
            // We have the ID, we need to find it in the pool (already fetched)
            // In a pure server-side app, we might fetch the content now.
            // Since we have 'itemPool' (full bank) locally for now:
            const nextQuestion = itemPool.find(i => i.id === nextItemId);

            if (!nextQuestion) {
                // Fallback: If item not in local pool (chunks invalid), force fetch
                console.warn("⚠️ Next item header found but content missing locally. Re-syncing...");
                await state.fetchExamItems(examId); // Basic retry
                const retry = state.items.find(i => i.id === nextItemId);
                if (!retry) throw new Error("Item content unavailable for ID: " + nextItemId);
                setAdaptivePath([...adaptivePath, retry]);
            } else {
                setAdaptivePath([...adaptivePath, nextQuestion]);
            }

            // Persist (Optimistic)
            // Note: Server has already calculated history, but we save local path for UI restoration
            if (attemptId) {
                await saveExamProgress(attemptId, answers, {
                    adaptivePath: [...adaptivePath, nextQuestion || {}], // Warning: nextQuestion might be undefined if logic fails above, checking in next line
                    currentTheta: newTheta
                });
            }

            setCurrentQuestionIndex(prev => prev + 1);

        } catch (error) {
            console.error("❌ [CAT] Error in Server-Side Calculation:", error);
            alert("Erro de conexão com o motor neural. Verifique sua internet e tente novamente.");
        } finally {
            setIsComputing(false);
        }
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
                navigator.onLine, // Usar status real de conexão
                activeExamItems // Passar pool local para evitar Supabase no loop
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
                    setGeneratedPlan(studyPlan);

                    // Notificar usuário (Gamificação)
                    const totalReward = studyPlan.tasks.reduce((acc, t) => acc + (t.rewardSafe || 0), 0);
                    // alert(`⚠️ Atenção: Detectamos algumas dificuldades.\n\n📚 Um Plano de Recuperação Personalizado foi gerado para você!\n\nComplete as tarefas para ganhar +${totalReward} OwlCoins! 🦉`);
                }

                setFinalGrading(gradingResult);
                setIsCompleted(true);
            } catch (recoveryError) {
                console.error("Erro no ciclo de recuperação:", recoveryError);
                setFinalGrading(gradingResult);
                setIsCompleted(true);
            }
            // ---------------------------------------------------

            // Retornar respostas corrigidas (Removido daqui para esperar o review do aluno)
            // onComplete(gradingResult.answers);
        } catch (error) {
            console.error('Erro na correção automática, ativando resiliência offline...', error);

            // FALLBACK RESILIENTE: 
            // - Objetivas: correção local
            // - Dissertativas: Marcar para revisão manual (preserva resposta)
            const finalAnswers: StudentAnswer[] = activeExamItems.map(item => {
                const selectedAltId = answers[item.id];
                const isEssay = item.type === 'ESSAY' || item.type === 'REDACTION';

                if (isEssay) {
                    return {
                        itemId: item.id,
                        selectedAlternativeId: null,
                        text: (answers as any)[`${item.id}_text`] || null,
                        isCorrect: false,
                        scoreObtained: 0,
                        gradingMethod: 'MANUAL_REQUIRED' as any,
                        essayFeedback: 'Erro técnico durante correção automática. Revisão humana necessária.'
                    };
                }

                const selectedAlt = item.alternatives.find(a => a.id === selectedAltId);
                const isCorrect = selectedAlt?.isCorrect || false;
                const score = isCorrect ? (item.score || 1) : 0;

                return {
                    itemId: item.id,
                    selectedAlternativeId: selectedAltId || null,
                    isCorrect,
                    scoreObtained: score,
                    gradingMethod: 'OFFLINE_OBJECTIVE' as any
                };
            });

            // SALVAR NA FILA OFFLINE SE SUBMISSÃO FALHAR TOTALMENTE
            try {
                const { enqueueOfflineResult } = await import('../../../services/offlineDb');
                await enqueueOfflineResult(examId, studentId, {
                    answers: finalAnswers,
                    submittedAt: new Date().toISOString(),
                    mode: 'offline_emergency'
                });
                console.log('📦 Resultado enfileirado no IndexedDB para sincronização posterior.');
            } catch (dbErr) {
                console.error('Falha crítica ao salvar backup offline:', dbErr);
            }

            if (attemptId) {
                submitExamAttempt(attemptId, isTimeout ? 'timed_out' : 'submitted').catch(() => {
                    console.warn('Submissão online falhou, mas backup offline foi salvo.');
                });
                localStorage.removeItem(`exam_attempt_${examId}_${studentId}`);
            }

            onComplete(finalAnswers);
        }
    };

    // --- FINAL LOGIC & HELPERS BEFORE RENDER ---
    const isLastQuestion = currentQuestionIndex === activeExamItems.length - 1;
    const currentItem = activeExamItems[currentQuestionIndex];

    const getThemeClasses = () => {
        if (a11y.theme === 'high-contrast') return 'theme-high-contrast dark font-bold';
        if (a11y.theme === 'dark') return 'bg-slate-900 text-white dark';
        if (a11y.theme === 'sepia') return 'theme-sepia';
        return 'bg-slate-50 text-slate-900';
    };

    const getFontClass = () => {
        if (a11y.fontType === 'dyslexic') return 'font-dyslexic';
        if (a11y.fontType === 'serif') return 'font-serif';
        return 'font-sans';
    };

    const containerStyle = {
        '--runner-font-scale': `${a11y.fontSize}%`,
        '--runner-letter-spacing': `${a11y.letterSpacing}px`,
        '--runner-line-height': a11y.lineHeight,
        lineHeight: a11y.lineHeight,
    } as React.CSSProperties;

    const handlePreventClipboard = (e: React.ClipboardEvent) => {
        e.preventDefault();
        alert('Ação bloqueada por segurança.');
    };

    // --- ACCESSIBILITY LOGIC (TTS) hook must be before any return ---
    useEffect(() => {
        if (!a11y.textToSpeech) {
            window.speechSynthesis.cancel();
            return;
        }

        const speak = (text: string) => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = a11y.readingSpeed || 1.0;
            window.speechSynthesis.speak(utterance);
        };

        if (currentItem) {
            const cleanText = (html: string) => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                return doc.body.textContent || "";
            };
            const textToRead = `Questão ${currentQuestionIndex + 1}. ${cleanText(currentItem.statement)}. Opções: ` +
                currentItem.alternatives.map((a, i) => `Opção ${String.fromCharCode(65 + i)}: ${cleanText(a.text)}`).join('. ');
            speak(textToRead);
        }
    }, [currentQuestionIndex, a11y.textToSpeech, a11y.readingSpeed, currentItem]);

    // --- GUARDS / RENDER MODALS ---
    // --- GUARDS / RENDER MODALS ---
    if (isCompleted && finalGrading) {
        return (
            <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm no-zoom ${getFontClass()}`}>
                <div className="max-w-4xl w-full bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="md:flex h-full">
                        {/* Left Side: Summary */}
                        <div className="md:w-1/3 bg-brand-dark p-8 text-white flex flex-col justify-center items-center text-center">
                            <div className="mb-6 p-4 bg-white/10 rounded-full animate-bounce">
                                <Trophy size={48} className="text-yellow-400" />
                            </div>
                            <h2 className="text-2xl font-black mb-2">Prova Finalizada!</h2>
                            <p className="text-slate-400 text-sm mb-8">Sua proficiência foi calculada com sucesso.</p>

                            <div className="space-y-4 w-full">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nota Final</div>
                                    <div className="text-4xl font-black text-white">{finalGrading.totalScore.toFixed(1)} <span className="text-lg text-slate-500">/ {finalGrading.maxScore}</span></div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aproveitamento</div>
                                    <div className="text-2xl font-black text-emerald-400">{((finalGrading.totalScore / finalGrading.maxScore) * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Remediation / Study Plan */}
                        <div className="md:w-2/3 p-8 bg-white dark:bg-slate-800">
                            {generatedPlan ? (
                                <div className="h-full flex flex-col">
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-white">
                                        <Target className="text-amber-500" /> Plano de Recuperação IA
                                    </h3>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl mb-6">
                                        <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                                            Identificamos algumas lacunas em seu roteiro de aprendizagem. Para ajudar você a alcançar seus objetivos, geramos um plano de reforço personalizado.
                                        </p>
                                    </div>

                                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] mb-6 pr-2 custom-scrollbar">
                                        {generatedPlan.tasks.map((task: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Tarefa {idx + 1}</div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{task.title}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-brand-primary">+{task.rewardSafe || 0} 🦉</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 mt-auto">
                                        <button
                                            onClick={() => ReportingService.exportStudyPlan(state.currentUser?.name || 'Estudante', generatedPlan)}
                                            className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-lg"
                                        >
                                            <Download size={20} /> Baixar PDF do Plano
                                        </button>
                                        <button
                                            onClick={() => onComplete(finalGrading.answers)}
                                            className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg"
                                        >
                                            Sair da Prova
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Desempenho Excelente!</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-8">Você demonstrou domínio dos conteúdos. Não foi necessário gerar um plano de reforço no momento.</p>
                                    <button
                                        onClick={() => onComplete(finalGrading.answers)}
                                        className="px-12 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-xl"
                                    >
                                        Concluir Avaliação
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!exam) return <div className="p-8 text-center no-zoom">Prova não encontrada.</div>;

    if (isAdaptive && showAdaptiveIntro && !isRestored) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95 text-white p-4 no-zoom">
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

                    {/* Offline Download Option */}
                    <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isOfflineReady ? (
                                <div className="p-2 bg-emerald-500/20 rounded-full">
                                    <CheckCircle size={20} className="text-emerald-400" />
                                </div>
                            ) : (
                                <div className="p-2 bg-blue-500/10 rounded-full">
                                    <DownloadCloud size={20} className="text-blue-400" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {isOfflineReady ? 'Disponível Offline' : 'Modo Offline'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {isOfflineReady
                                        ? 'Esta prova já está salva no seu dispositivo.'
                                        : 'Baixe agora para garantir que não haverá interrupções.'}
                                </p>
                            </div>
                        </div>

                        {!isOfflineReady && (
                            <button
                                onClick={handleDownloadOffline}
                                disabled={isDownloading || activeExamItems.length === 0}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isDownloading
                                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                                    : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30'
                                    }`}
                            >
                                {isDownloading ? 'Baixando...' : 'Baixar Agora'}
                            </button>
                        )}
                    </div>
                </div>
            </div >
        );
    }

    if (!securityCheckPassed && !isRestored) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95 text-white p-4 no-zoom">
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
                            onClick={handleSecurityCheck}
                            className="text-xs text-gray-500 hover:text-gray-300 underline mt-2"
                        >
                            Prefiro não compartilhar (Assumir riscos)
                        </button>

                        {/* Offline Download in Security Gate */}
                        <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isOfflineReady ? <CheckCircle size={18} className="text-emerald-400" /> : <DownloadCloud size={18} className="text-blue-400" />}
                                <span className="text-xs font-bold">{isOfflineReady ? 'Salvo Offline 🛡️' : 'Baixar para Offline'}</span>
                            </div>
                            {!isOfflineReady && (
                                <button
                                    onClick={handleDownloadOffline}
                                    disabled={isDownloading}
                                    className="text-[10px] px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-md border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all"
                                >
                                    {isDownloading ? 'Baixando...' : 'Obter Agora'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isAdaptive && activeExamItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 no-zoom">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Calibrando Motor Adaptativo...</h3>
                <p className="text-slate-500">Ajustando nível inicial.</p>
            </div>
        );
    }

    if (state.items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 no-zoom">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Carregando itens...</h3>
                <p className="text-slate-500">Sincronizando banco de dados seguro.</p>
            </div>
        );
    }

    if (!isAdaptive && activeExamItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 no-zoom">
                <h3 className="text-xl font-bold text-slate-800">Erro: Esta prova não possui questões cadastradas ou os itens não foram encontrados.</h3>
                <button onClick={onExit} className="mt-4 px-6 py-2 bg-brand-primary text-white rounded-lg">Voltar</button>
            </div>
        );
    }

    if (!currentItem) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 no-zoom">
                <h3 className="text-xl font-bold text-slate-800">Erro ao carregar questão {currentQuestionIndex + 1}.</h3>
                <button onClick={onExit} className="mt-4 px-6 py-2 bg-brand-primary text-white rounded-lg">Voltar</button>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${getThemeClasses()} ${getFontClass()} runner-container flex flex-col select-none relative`}
            style={containerStyle}
            onCopy={handlePreventClipboard}
            onPaste={handlePreventClipboard}
            onCut={handlePreventClipboard}
            onContextMenu={(e) => e.preventDefault()}
            onMouseMove={(e) => {
                if (!a11y.focusMode) return;
                const root = e.currentTarget;
                root.style.setProperty('--mouse-x', `${e.clientX}px`);
                root.style.setProperty('--mouse-y', `${e.clientY}px`);
            }}
        >

            {/* TOOLBAR (Floating) */}
            <div className="no-zoom">
                <AccessibilityToolbar config={a11y} onChange={setA11y} />
            </div>

            {/* ACCESSITY OVERLAYS */}
            {a11y.showLibrasWindow && a11y.librasVideoUrl && (
                <div className="fixed bottom-24 right-6 w-72 h-44 bg-slate-900 border-2 border-brand-primary rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col group no-zoom">
                    <div className="flex items-center justify-between px-3 py-1 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest">
                        <span>Tradução Libras</span>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="flex-1 bg-black">
                        {a11y.librasVideoUrl.includes('youtube.com') || a11y.librasVideoUrl.includes('youtu.be') ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${a11y.librasVideoUrl.includes('v=') ? a11y.librasVideoUrl.split('v=')[1].split('&')[0] : a11y.librasVideoUrl.split('/').pop()}?autoplay=1&mute=1&controls=0`}
                                frameBorder="0"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                            />
                        ) : (
                            <video
                                src={a11y.librasVideoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setA11y(prev => ({ ...prev, showLibrasWindow: false }))}
                            className="bg-black/50 hover:bg-black rounded-full p-1 text-white"
                        >
                            <Minimize size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className={`px-6 py-4 flex justify-between items-center border-b no-zoom ${a11y.theme === 'high-contrast' ? 'border-yellow-400' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold">{exam.title}</h1>
                        {!a11y.focusMode && (
                            <p className={`text-sm font-bold ${a11y.theme === 'high-contrast' ? 'text-yellow-400' : 'opacity-80'}`}>
                                Questão {currentQuestionIndex + 1}
                                {isAdaptive ? '' : ` de ${activeExamItems.length}`}
                                {isAdaptive && <span className={`ml-2 text-[10px] px-1 rounded border ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black border-black font-black' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>ADAPTATIVO</span>}
                            </p>
                        )}
                    </div>

                    {/* Offline Protection Indicator */}
                    {isOfflineReady && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${a11y.theme === 'high-contrast'
                            ? 'bg-yellow-400 text-black border border-black'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`} title="Prova salva localmente para segurança total">
                            <CloudCheck size={12} /> Proteção Offline
                        </div>
                    )}
                </div>

                {/* TIMER & CONTROLS */}
                <div className="flex items-center gap-4">
                    {!a11y.hideTimer && (
                        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${timeLeft < 300
                            ? 'timer-critical'
                            : (a11y.theme === 'high-contrast' ? 'border-2 border-yellow-400' : 'bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700')
                            }`}>
                            <Clock size={22} className={timeLeft < 300 ? 'text-red-600' : 'text-brand-primary'} />
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    )}
                    <button onClick={onExit} className={`px-4 py-2 uppercase text-sm font-black tracking-widest transition-all ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black rounded-lg ml-4' : 'opacity-80 hover:opacity-100'
                        }`}>
                        Sair
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT Area */}
            <main className={`flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center ${a11y.focusMode ? 'justify-center' : ''}`}>

                {/* QUESTION CONTAINER */}
                <div className={`w-full max-w-4xl relative transition-all ${a11y.focusMode ? '' : 'bg-white/5 p-6 rounded-3xl border border-current/10'}`}>

                    {/* DRAWING OVERLAY */}
                    <DrawingCanvas
                        isActive={a11y.penMode !== 'none'}
                        mode={a11y.penMode}
                        config={{
                            penColor: a11y.penColor,
                            markerColor: a11y.markerColor,
                            strokeSize: a11y.strokeSize,
                            eraserSize: a11y.eraserSize
                        }}
                        questionId={currentItem?.id || 'default'}
                    />

                    {/* SCRATCHPAD OVERLAY */}
                    {a11y.showScratchpad && (
                        <div className="absolute top-0 -right-80 w-72 h-[500px] bg-amber-50 shadow-2xl rounded-xl border-2 border-amber-200 p-4 z-30 animate-in slide-in-from-right hidden lg:block no-zoom scratchpad-container">
                            <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
                                <FileText size={16} /> Bloco de Rascunho
                            </h4>
                            <textarea
                                className="w-full h-[420px] bg-transparent border-none focus:ring-0 text-amber-900 placeholder:text-amber-300/50 resize-none font-serif text-sm"
                                placeholder="Use este espaço para contas ou anotações rápidas..."
                                value={scratchpadValue}
                                onChange={(e) => setScratchpadValue(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Item Statement */}
                    <div className="mb-8">
                        <RichTextRenderer
                            content={currentItem.statement}
                            className="text-2xl font-medium leading-relaxed rich-text-content"
                            onLibrasDetected={(url) => setA11y(prev => ({ ...prev, librasVideoUrl: url }))}
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
                            <div className={`mt-4 p-4 rounded-lg border ${a11y.theme === 'high-contrast'
                                ? 'bg-black border-yellow-400'
                                : 'bg-blue-50 dark:bg-slate-800 border-blue-100 dark:border-blue-900'
                                }`}>
                                <p className={`text-sm ${a11y.theme === 'high-contrast' ? 'text-yellow-400' : 'text-blue-800 dark:text-blue-300'}`}>
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
                                        ? "bg-yellow-400 text-black border-4 border-yellow-400 font-black shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                                        : "bg-black text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-900/40";
                                } else if (a11y.theme === 'dark') {
                                    btnClass = isSelected
                                        ? "bg-brand-primary text-white shadow-lg transform scale-[1.01]"
                                        : "bg-slate-800/80 border border-slate-700 hover:bg-slate-700";
                                } else {
                                    // Light and Sepia: Restore original subtle look
                                    btnClass = isSelected
                                        ? "bg-brand-primary text-white shadow-lg transform scale-[1.01]"
                                        : "bg-white/50 border border-current/10 hover:bg-black/5";
                                }

                                return (
                                    <div key={alt.id} className="relative group">
                                        <button
                                            onClick={() => handleAnswer(currentItem.id, alt.id)}
                                            className={`w-full text-left p-6 rounded-2xl transition-all duration-300 flex items-center gap-4 ${btnClass} ${strikedOptions[currentItem.id]?.includes(alt.id) ? 'strikethrough' : ''}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${isSelected
                                                ? (a11y.theme === 'high-contrast' ? 'bg-black text-yellow-400 border-black font-black' : 'bg-white text-brand-primary border-white font-bold')
                                                : (a11y.theme === 'high-contrast' ? 'border-yellow-400 text-yellow-400 font-black' : 'border-current/20 font-bold')
                                                }`}>
                                                {String.fromCharCode(65 + currentItem.alternatives.indexOf(alt))}
                                            </div>
                                            <RichTextRenderer content={alt.text} className="text-lg rich-text-content" />
                                        </button>

                                        {/* Strikethrough Toggle Button (Manual use by student) */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const currentStriked = strikedOptions[currentItem.id] || [];
                                                const newStriked = currentStriked.includes(alt.id)
                                                    ? currentStriked.filter(id => id !== alt.id)
                                                    : [...currentStriked, alt.id];
                                                setStrikedOptions({ ...strikedOptions, [currentItem.id]: newStriked });
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-opacity"
                                            title="Riscar alternativa"
                                        >
                                            <EyeOff size={18} className={strikedOptions[currentItem.id]?.includes(alt.id) ? 'text-brand-primary' : 'opacity-40'} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>

            </main>

            {/* FOOTER NAVIGATION */}
            <footer className={`p-6 border-t ${a11y.theme === 'high-contrast' ? 'border-yellow-400' : 'border-slate-200 dark:border-slate-700'} flex justify-between items-center gap-4`}>
                <div className={`hidden md:flex items-center gap-4 text-xs font-mono ${a11y.theme === 'high-contrast' ? 'text-yellow-400' : 'opacity-70 dark:text-slate-400'}`}>
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
                                disabled={isComputing}
                                className={`px-12 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${isComputing
                                    ? 'bg-slate-400 cursor-wait'
                                    : a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black hover:bg-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                    }`}
                            >
                                {isComputing ? 'Calculando...' : 'Próxima'} <ChevronRight />
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

            {/* READING RULER (Focus Mode) - Follows mouse position */}
            {a11y.focusMode && (
                <div
                    className="fixed inset-0 pointer-events-none z-40 hidden md:block"
                    style={{
                        background: `radial-gradient(circle 200px at var(--mouse-x, 50%) var(--mouse-y, 50%), transparent 0%, rgba(0,0,0,0.4) 80%)`
                    }}
                >
                    {/* Horizontal Guide Bar */}
                    <div
                        className="absolute left-0 right-0 h-12 border-y-2 border-brand-primary/40 bg-brand-primary/5"
                        style={{ top: 'calc(var(--mouse-y, 50%) - 24px)' }}
                    />
                </div>
            )}
        </div >
    );
};
