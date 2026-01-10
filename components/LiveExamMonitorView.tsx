import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Users, Activity, ShieldAlert, Wifi, Battery,
    MessageCircle, AlertCircle, CheckCircle2, Clock, Smartphone
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AppState, ExamStatus, RegistrationStatus } from '../types';
import { Badge } from './ui/Badge';

export const LiveExamMonitorView = ({ state }: { state: AppState }) => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const exam = state.exams.find(e => e.id === examId);

    // Simulação de telemetria em tempo real
    const [studentsData, setStudentsData] = useState<any[]>([]);

    useEffect(() => {
        if (!exam) return;

        // Mocking real-time updates for demonstration
        const registrations = state.registrations.filter(r => r.examId === examId);
        const initialData = registrations.map(r => {
            const student = state.students.find(s => s.id === r.studentId);
            return {
                id: r.studentId,
                name: student?.name || 'Aluno',
                status: r.status,
                progress: r.status === RegistrationStatus.FINALIZADO ? 100 : Math.floor(Math.random() * 40),
                battery: 60 + Math.floor(Math.random() * 40),
                connection: 'EXCELLENT',
                securityAlerts: [],
                lastUpdate: new Date().toISOString()
            };
        });
        setStudentsData(initialData);

        const interval = setInterval(() => {
            setStudentsData(prev => prev.map(s => {
                if (s.status === RegistrationStatus.FINALIZADO) return s;

                const newProgress = Math.min(100, s.progress + Math.floor(Math.random() * 5));
                const newStatus = newProgress === 100 ? RegistrationStatus.FINALIZADO : RegistrationStatus.PRESENTE;

                // Simulação aleatória de Alerta de Segurança
                const isViolation = Math.random() > 0.98;
                const newAlerts = isViolation
                    ? [...s.securityAlerts, { type: 'FOCUS_LOST', time: new Date().toLocaleTimeString() }]
                    : s.securityAlerts;

                return {
                    ...s,
                    progress: newProgress,
                    status: newStatus,
                    securityAlerts: newAlerts,
                    battery: Math.max(0, s.battery - 0.1),
                    lastUpdate: new Date().toISOString()
                };
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, [examId, exam, state.registrations, state.students]);

    if (!exam) return <div>Prova não encontrada.</div>;

    const stats = {
        total: studentsData.length,
        online: studentsData.filter(s => s.status === RegistrationStatus.PRESENTE).length,
        finished: studentsData.filter(s => s.status === RegistrationStatus.FINALIZADO).length,
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
