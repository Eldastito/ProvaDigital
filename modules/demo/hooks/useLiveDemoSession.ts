import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useAppStore } from '../../../store/useAppStore';

export const useLiveDemoSession = (onClose: () => void) => {
    const state = useAppStore();

    // PIN de Segurança (Fixo para demo)
    const SECURITY_PIN = "1234";

    // Estados do Fluxo
    const [step, setStep] = useState<'SETUP' | 'WAITING_PROFESSOR' | 'LOBBY_ACTIVE' | 'RESULTS'>('SETUP');

    // Setup Config
    const [sessionConfig, setSessionConfig] = useState({
        className: 'Turma Demo - Evento Ao Vivo',
        capacity: 50,
        selectedExamId: ''
    });

    // Active Session Data
    const [activeClassId, setActiveClassId] = useState<string | null>(null);
    const [activeExamId, setActiveExamId] = useState<string | null>(null);
    const [joinedStudents, setJoinedStudents] = useState<any[]>([]);

    // Results Data
    const [examStats, setExamStats] = useState<any>(null);
    const [topPerformers, setTopPerformers] = useState<any[]>([]);
    const [selectedExamItems, setSelectedExamItems] = useState<any[]>([]);

    // Features Data
    const [toleranceEndTime, setToleranceEndTime] = useState<number | null>(null);
    const [isEntryLocked, setIsEntryLocked] = useState(false);
    const [timeLeftToLock, setTimeLeftToLock] = useState<string>('');
    const [submissions, setSubmissions] = useState<Set<string>>(new Set());
    const [securityAlerts, setSecurityAlerts] = useState<Map<string, string>>(new Map());
    const [securityEvents, setSecurityEvents] = useState<any[]>([]);

    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // --- 5 MIN TIMER Logic ---
    useEffect(() => {
        if (joinedStudents.length > 0 && !toleranceEndTime && !isEntryLocked && step === 'LOBBY_ACTIVE') {
            const fiveMins = Date.now() + 5 * 60 * 1000;
            setToleranceEndTime(fiveMins);
        }
    }, [joinedStudents, toleranceEndTime, isEntryLocked, step]);

    useEffect(() => {
        if (!toleranceEndTime || isEntryLocked) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = toleranceEndTime - now;
            if (diff <= 0) {
                setIsEntryLocked(true);
                setTimeLeftToLock('ENTRADA ENCERRADA');
                clearInterval(interval);
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeLeftToLock(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [toleranceEndTime, isEntryLocked]);

    // --- AUTO CLOSE Logic ---
    useEffect(() => {
        if (isEntryLocked && joinedStudents.length > 0) {
            const allSubmissionsReceived = joinedStudents.every(s => submissions.has(s.id));
            if (allSubmissionsReceived) {
                handleFinishSession();
            }
        }
    }, [isEntryLocked, joinedStudents, submissions]);

    // --- PERSISTENCE LOGIC ---
    useEffect(() => {
        // Load state on mount
        const savedState = localStorage.getItem('live_demo_session');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                // Check if session is recent (< 24h)
                const isRecent = (Date.now() - parsed.timestamp) < 24 * 60 * 60 * 1000;

                if (isRecent && parsed.step !== 'RESULTS') {
                    if (parsed.activeClassId) setActiveClassId(parsed.activeClassId);
                    if (parsed.activeExamId) setActiveExamId(parsed.activeExamId);
                    if (parsed.sessionConfig) setSessionConfig(parsed.sessionConfig);
                    if (parsed.step) setStep(parsed.step);
                } else {
                    localStorage.removeItem('live_demo_session');
                }
            } catch (e) {
                console.error("Erro ao restaurar sessão:", e);
            }
        }
    }, []);

    useEffect(() => {
        // Save state on change
        if (step !== 'SETUP' && step !== 'RESULTS') {
            const stateToSave = {
                activeClassId,
                activeExamId,
                sessionConfig,
                step,
                timestamp: Date.now()
            };
            localStorage.setItem('live_demo_session', JSON.stringify(stateToSave));
        } else if (step === 'RESULTS') {
            localStorage.removeItem('live_demo_session');
        }
    }, [step, activeClassId, activeExamId, sessionConfig]);

    // --- REALTIME & PRESENCE ---
    useEffect(() => {
        if (!activeClassId || !activeExamId) return;

        // Channel for Exam Events (Alerts & Presence)
        const monitorChannel = supabase.channel(`exam_monitor:${activeExamId}`, {
            config: {
                presence: { key: 'professor' },
                broadcast: { self: false }
            }
        });

        monitorChannel
            .on('broadcast', { event: 'ALERT' }, (payload) => {
                const { studentId, type } = payload.payload || payload;
                if (!studentId) return;

                setSecurityAlerts(prev => {
                    const newMap = new Map(prev);
                    const labelMap: any = {
                        'FOCUS_LOST': 'Minimizou/Saiu',
                        'ALT_TAB': 'Atalho Proibido',
                        'COPY_PASTE': 'Copiou/Colou',
                        'MOUSE_LEAVE': 'Mouse Fora',
                        'WINDOW_RESIZE': 'Redimensionou',
                        'SCREEN_SHARE_ENDED': 'Parou Tela',
                        'FULLSCREEN_EXIT': 'Saiu Tela Cheia'
                    };
                    const label = labelMap[type] || 'Atividade Suspeita';
                    newMap.set(studentId, label);

                    // Add to Feed
                    setSecurityEvents(prevEvents => [{
                        id: Date.now().toString(),
                        studentId,
                        studentName: joinedStudents.find(s => s.id === studentId)?.name || 'Aluno',
                        type: label,
                        time: new Date().toLocaleTimeString()
                    }, ...prevEvents].slice(0, 50));

                    return newMap;
                });
            })
            .on('presence', { event: 'sync' }, () => {
                const state = monitorChannel.presenceState();
                const onlineIds = new Set<string>();

                Object.keys(state).forEach(key => {
                    (state[key] as any[]).forEach((presence: any) => {
                        if (presence.studentId) onlineIds.add(presence.studentId);
                    });
                });
                setOnlineUsers(onlineIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await monitorChannel.track({ type: 'PROFESSOR', online_at: new Date().toISOString() });
                }
            });

        // Database Changes (Results & Students)
        const dbChannel = supabase.channel(`db_monitor:${activeExamId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exam_results', filter: `exam_id=eq.${activeExamId}` }, (payload) => {
                setSubmissions(prev => new Set(prev).add(payload.new.student_id));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students', filter: `class_id=eq.${activeClassId}` }, (payload) => {
                setJoinedStudents(prev => [payload.new, ...prev]);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'classes', filter: `id=eq.${activeClassId}` }, (payload) => {
                if (payload.new.status === 'FINISHED') {
                    calculateResults(activeClassId, activeExamId);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(monitorChannel);
            supabase.removeChannel(dbChannel);
        };
    }, [activeClassId, activeExamId, joinedStudents]);

    // --- HANDLERS ---
    const handleSessionCreated = async (classId: string, examId: string) => {
        setActiveClassId(classId);
        setActiveExamId(examId);

        const exam = state.exams.find(e => e.id === examId);
        if (exam) {
            const itemsSource = (exam as any).items || (exam as any).items_config || [];
            const items = itemsSource.map((config: any) => {
                const item = state.items.find(i => i.id === config.itemId);
                return item ? { ...item, ...config } : null;
            }).filter(Boolean);
            setSelectedExamItems(items);
        }

        setStep('WAITING_PROFESSOR');
    };

    const handleFinishSession = async () => {
        await new Promise(r => setTimeout(r, 2000));
        if (activeClassId) {
            await supabase.from('classes').update({ status: 'FINISHED' }).eq('id', activeClassId);
            calculateResults(activeClassId, activeExamId!);
        }
    };

    const calculateResults = async (classId: string, examId: string) => {
        const { data: results, error } = await supabase
            .from('exam_results')
            .select('*, student:students(name)')
            .eq('exam_id', examId);

        if (error || !results) {
            console.error("Erro ao buscar resultados:", error);
            return;
        }

        const total = results.length;
        const passed = results.filter(r => (r.score / selectedExamItems.length) >= 0.7).length;
        const average = results.reduce((acc, r) => acc + r.score, 0) / (total || 1);

        const questionStats: any = {};
        selectedExamItems.forEach(item => {
            questionStats[item.id] = {
                percentage: Math.floor(Math.random() * 40) + 60,
                distribution: {
                    'a': Math.floor(Math.random() * 10),
                    'b': Math.floor(Math.random() * 10),
                    'c': Math.floor(Math.random() * 2),
                    'd': Math.floor(Math.random() * 1)
                }
            };
            const correctId = item.alternatives.find((a: any) => a.isCorrect)?.id;
            if (correctId) questionStats[item.id].distribution[correctId] += 20;
        });

        const sorted = [...results].sort((a, b) => b.score - a.score);
        const podium = sorted.slice(0, 3).map(r => ({
            name: r.student?.name || 'Anonimo',
            score: r.score
        }));

        setExamStats({
            total,
            passed,
            average: average.toFixed(1),
            questions: questionStats
        });
        setTopPerformers(podium);
        setStep('RESULTS');
    };

    const generateReport = () => {
        const date = new Date().toLocaleDateString('pt-BR');
        const totalStudents = sessionConfig.capacity;
        const presentStudents = joinedStudents.length;
        const absentStudents = totalStudents - presentStudents;

        let incidentCount = 0;
        let incidentText = "";

        joinedStudents.forEach(s => {
            if (securityAlerts.has(s.id)) {
                incidentCount++;
                incidentText += `- ${s.name} (${s.ra || 'N/A'}): ${securityAlerts.get(s.id)}\n`;
            }
        });

        if (incidentCount === 0) incidentText = "Nenhum incidente de segurança registrado.";

        const podiumText = topPerformers.map((p, i) => `${i + 1}º Lugar: ${p.name} - Nota: ${p.score}/${selectedExamItems.length}`).join('\n');

        const content = `
# Relatório de Evento: ${sessionConfig.className}
**Data:** ${date}
**Prova:** ${selectedExamItems.length > 0 ? selectedExamItems[0].statement.substring(0, 20) + "..." : "Quiz Geral"}

---

## 1. Engajamento
- **Esperados:** ${totalStudents}
- **Presentes:** ${presentStudents}
- **Ausentes:** ${absentStudents}
- **Taxa de Comparecimento:** ${Math.round((presentStudents / totalStudents) * 100)}%

---

## 2. Podio
${podiumText}

---

## 3. Segurança e Auditoria
**Incidentes Registrados:** ${incidentCount}

${incidentText}

---

*Gerado automaticamente pelo ExamePad Live.*
        `;

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-evento-${activeClassId}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        step, setStep,
        SECURITY_PIN,
        sessionConfig, setSessionConfig,
        activeClassId, activeExamId,
        joinedStudents,
        submissions,
        securityAlerts,
        securityEvents,
        isEntryLocked,
        timeLeftToLock,
        toleranceEndTime,
        examStats,
        topPerformers,
        selectedExamItems,
        handleSessionCreated,
        handleFinishSession,
        generateReport
    };
};
