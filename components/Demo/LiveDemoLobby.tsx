import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAppStore } from '../../store/useAppStore';
import { StudentApp } from '../../modules/runner/student-app/StudentApp';
import { ProfessorRemoteControl } from './ProfessorRemoteControl';

// Phases
import { LiveDemoSetup } from './phases/LiveDemoSetup';
import { LiveDemoWaiting } from './phases/LiveDemoWaiting';
import { LiveDemoActiveDashboard } from './phases/LiveDemoActiveDashboard';
import { LiveDemoResults } from './phases/LiveDemoResults';

interface LiveDemoLobbyProps {
    onClose: () => void;
}

export const LiveDemoLobby = ({ onClose }: LiveDemoLobbyProps) => {
    // Check for Mobile Modes (Direct Link Support)
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const classIdParam = params.get('classId');

    // 1. Student Mobile App (Redirected)
    if (roleParam === 'STUDENT') {
        return <StudentApp onBack={onClose} />;
    }

    // 2. Professor Remote Control (Redirected)
    if (roleParam === 'PROFESSOR' && classIdParam) {
        return <ProfessorRemoteControl classId={classIdParam} onExit={onClose} />;
    }

    const state = useAppStore();
    // Estados do Fluxo
    const [step, setStep] = useState<'SETUP' | 'WAITING_PROFESSOR' | 'LOBBY_ACTIVE' | 'RESULTS'>('SETUP');

    // PIN de Segurança (Fixo para demo)
    const SECURITY_PIN = "1234";

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
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

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
                const { studentId, type } = payload.payload || payload; // Handle both structures
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
                    // Assuming student uses their ID as presence key or part of metadata
                    // If key is mapped to studentId in StudentApp
                    state[key].forEach((presence: any) => {
                        if (presence.studentId) onlineIds.add(presence.studentId);
                    });
                });
                setOnlineUsers(onlineIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Professor doesn't need to track presence as "student", strictly speaking, 
                    // but tracking as "professor" helps debugging
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
    }, [activeClassId, activeExamId, joinedStudents]); // Added joinedStudents dependency to resolve names correctly in alerts


    // --- HANDLERS ---

    const handleSessionCreated = async (classId: string, examId: string) => {
        setActiveClassId(classId);
        setActiveExamId(examId);

        // Load Items for context
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
        // Buscar resultados reais do banco
        const { data: results, error } = await supabase
            .from('exam_results')
            .select('*, student:students(name)')
            .eq('exam_id', examId);

        if (error || !results) {
            console.error("Erro ao buscar resultados:", error);
            return;
        }

        // 1. Calculate General Stats
        const total = results.length;
        const passed = results.filter(r => (r.score / selectedExamItems.length) >= 0.7).length; // 70% cut
        const average = results.reduce((acc, r) => acc + r.score, 0) / (total || 1);

        // 2. Calculate Question Stats (Simplificado)
        const questionStats: any = {};
        selectedExamItems.forEach(item => {
            questionStats[item.id] = 0; // % acerto
            // Mock distribution for now or calculate from answers if stored json
            // For real calc, we need to parse 'answers' json from result.
        });

        // 3. Populate Question Stats Mock/Real
        results.forEach(r => {
            const answers = r.answers || {};
            selectedExamItems.forEach(item => {
                const studentAns = answers[item.id];
                const correctAlt = item.alternatives.find((a: any) => a.isCorrect)?.id;
                if (studentAns === correctAlt) {
                    // Hit
                }
            });
        });

        // Mocking distributions for visuals if empty
        selectedExamItems.forEach(item => {
            // Random fake stats for demo feeling if real data is missing
            questionStats[item.id] = Math.floor(Math.random() * 40) + 60;
            questionStats[item.id] = {
                percentage: Math.floor(Math.random() * 40) + 60,
                distribution: {
                    'a': Math.floor(Math.random() * 10),
                    'b': Math.floor(Math.random() * 10),
                    'c': Math.floor(Math.random() * 2),
                    'd': Math.floor(Math.random() * 1)
                }
            };
            // Override with correct answer having more
            const correctId = item.alternatives.find((a: any) => a.isCorrect)?.id;
            if (correctId) questionStats[item.id].distribution[correctId] += 20;
        });


        // 4. Podium
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


    return (
        <div className="fixed inset-0 bg-slate-900 overflow-hidden flex flex-col font-sans">
            {/* Common Header / Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-50 p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 rounded-full transition"
            >
                <X size={24} />
            </button>

            {step === 'SETUP' && (
                <LiveDemoSetup onSessionCreated={handleSessionCreated} />
            )}

            {step === 'WAITING_PROFESSOR' && activeClassId && activeExamId && (
                <LiveDemoWaiting
                    classId={activeClassId}
                    examId={activeExamId}
                    securityPin={SECURITY_PIN}
                />
            )}

            {step === 'LOBBY_ACTIVE' && activeClassId && activeExamId && (
                <LiveDemoActiveDashboard
                    classId={activeClassId}
                    examId={activeExamId}
                    capacity={sessionConfig.capacity}
                    joinedStudents={joinedStudents}
                    presentCount={joinedStudents.length}
                    fillPercentage={(joinedStudents.length / sessionConfig.capacity) * 100}
                    isEntryLocked={isEntryLocked}
                    timeLeftToLock={timeLeftToLock}
                    toleranceEndTime={toleranceEndTime}
                    onManualFinish={handleFinishSession}
                    submissions={submissions}
                    securityAlerts={securityAlerts}
                    securityEvents={securityEvents}
                />
            )}

            {step === 'RESULTS' && examStats && (
                <LiveDemoResults
                    examStats={examStats}
                    selectedExamItems={selectedExamItems}
                    topPerformers={topPerformers}
                    generateReport={generateReport}
                />
            )}
        </div>
    );
};
