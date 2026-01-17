import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Users, Activity, ShieldAlert, Wifi, Battery,
    MessageCircle, AlertCircle, CheckCircle2, Clock, Smartphone
} from 'lucide-react';
import { useSafeAppStore, AppStore } from '../../store/useAppStore';
import { ExamStatus, RegistrationStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';

export const LiveExamMonitorView = () => {
    const state = useSafeAppStore();
    const { examId } = useParams();
    const navigate = useNavigate();
    const exam = state.exams.find(e => e.id === examId);

    const { examAttempts, examAttemptEvents, students, registrations, reopenExamAttempt, initializeExamEvents, leaveExamChannel, liveAlerts, realtimeChannel } = state;

    // --- REALTIME PRESENCE ---
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    useEffect(() => {
        if (examId) {
            initializeExamEvents(examId);

            return () => {
                leaveExamChannel(); // Cleanup on exit
            };
        }
    }, [examId]);

    // Sync Presence from Channel
    useEffect(() => {
        if (!realtimeChannel) return;

        const updatePresence = () => {
            const state = realtimeChannel.presenceState();
            // Flatten presence object
            const users = Object.values(state).flat().map((u: any) => u.studentId);
            setOnlineUsers(users);
        };

        // Initial check
        updatePresence();

        // Listen for sync
        realtimeChannel.on('presence', { event: 'sync' }, updatePresence);
        // No explicit off needed for sub-event if we destroy channel, but good practice if persistent

    }, [realtimeChannel]);


    // Process live data
    const studentsData = registrations
        .filter(r => r.examId === examId)
        .map(r => {
            const student = students.find(s => s.id === r.studentId);
            const attempt = examAttempts.find(a => a.studentId === r.studentId && a.examVersionId === examId);
            const persistentAlerts = attempt ? examAttemptEvents.filter(e => e.attemptId === attempt.id) : [];

            // Merge with Ephemeral Live Alerts
            const studentLiveAlerts = liveAlerts.filter((a: any) => a.studentId === r.studentId).map((a: any) => ({
                type: a.type,
                time: new Date(a.timestamp).toLocaleTimeString()
            }));

            // Combine alerts (dedup logic could be added)
            // For now, show live ones first
            const allAlerts = [...studentLiveAlerts, ...persistentAlerts.map(a => ({ type: a.eventType, time: new Date(a.createdAt).toLocaleTimeString() }))];

            const isOnline = onlineUsers.includes(r.studentId);

            return {
                id: r.studentId,
                attemptId: attempt?.id,
                name: student?.name || 'Aluno',
                // Priority: Finished -> Online -> Offline (but "Em Prova" if started)
                status: attempt?.status === 'submitted' ? RegistrationStatus.FINALIZADO :
                    isOnline ? RegistrationStatus.PRESENTE :
                        RegistrationStatus.AUSENTE,
                // Override status text for UI
                uiStatus: attempt?.status === 'submitted' ? 'Finalizado' :
                    isOnline ? 'Online' : 'Offline',

                progress: (attempt?.status === 'submitted' || r.status === RegistrationStatus.FINALIZADO) ? 100 : (attempt ? 40 : 0),
                battery: 95, // Mock for now
                connection: isOnline ? 'EXCELLENT' : 'OFFLINE',
                securityAlerts: allAlerts,
                violationCount: (attempt?.violationCount || 0) + studentLiveAlerts.length
            };
        });

    if (!exam) return <div>Prova não encontrada.</div>;

    const stats = {
        total: studentsData.length,
        online: studentsData.filter(s => s.uiStatus === 'Online').length,
        finished: studentsData.filter(s => s.uiStatus === 'Finalizado').length,
        alerts: studentsData.filter(s => s.securityAlerts.length > 0).length
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/teacher/provas')} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="text-brand-primary" size={20} />
                            Monitoramento: {exam.title}
                        </h1>
                        <p className="text-xs text-slate-500">{exam.subject} • {exam.durationMinutes} minutos</p>
                    </div>
                </div>

                <div className="flex gap-6">
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presentes</div>
                        <div className="font-bold text-slate-900">{stats.online} / {stats.total}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Finalizados</div>
                        <div className="font-bold text-emerald-600">{stats.finished}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alertas</div>
                        <div className="font-bold text-rose-600 flex items-center gap-1 justify-center">
                            {stats.alerts > 0 && <ShieldAlert size={14} />} {stats.alerts}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <MessageCircle size={18} /> Chat Global
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {studentsData.map(student => (
                        <div key={student.id} className={`bg-white p-4 rounded-xl border-2 transition-all ${student.securityAlerts.length > 0 ? 'border-rose-200 shadow-rose-100 shadow-md ring-2 ring-rose-50' : 'border-slate-100 hover:border-slate-300'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border-2 ${student.status === RegistrationStatus.PRESENTE ? 'border-emerald-400' : 'border-slate-200'}`}>
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm truncate max-w-[120px]">{student.name}</div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                                            {student.status === RegistrationStatus.FINALIZADO
                                                ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> Concluiu</span>
                                                : <span className="text-slate-400 flex items-center gap-1"><Clock size={10} /> Em Prova</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <Battery size={10} /> {Math.floor(student.battery)}%
                                        </div>
                                        <Wifi size={10} className={student.battery < 20 ? 'text-rose-500' : 'text-emerald-500'} />
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                    <span>Progresso</span>
                                    <span>{student.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${student.status === RegistrationStatus.FINALIZADO ? 'bg-emerald-500' : 'bg-brand-primary'}`}
                                        style={{ width: `${student.progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Security Events */}
                            {student.securityAlerts.length > 0 && (
                                <div className="p-2 bg-rose-50 rounded-lg border border-rose-100 mb-3 animate-pulse">
                                    <div className="flex items-center gap-2 text-rose-600 text-[10px] font-bold mb-1">
                                        <ShieldAlert size={12} /> ALERTA DE SEGURANÇA
                                    </div>
                                    {student.securityAlerts.slice(-1).map((alert: any, i: number) => (
                                        <div key={i} className="text-[9px] text-rose-500">
                                            Possível saída do aplicativo às {alert.time}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                {student.violationCount > 3 && (
                                    <button
                                        onClick={() => student.attemptId && reopenExamAttempt(student.attemptId)}
                                        className="flex-1 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle2 size={12} /> Reabrir
                                    </button>
                                )}
                                <button className="flex-1 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-1">
                                    <MessageCircle size={12} /> Chat
                                </button>
                                <button className="flex-1 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 transition flex items-center justify-center gap-1">
                                    <AlertCircle size={12} /> Encerrar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};
