import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { Play, FileText, Clock, AlertTriangle, Accessibility, CloudDownload, CheckCircle } from 'lucide-react';
import { ExamStatus, ScheduledExam } from '../../../types';
import { schedulingService } from '../../../services/schedulingService';

export const ExamLauncher = () => {
    const { exams, currentUser, getRecommendedVariant } = useAppStore();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [schedules, setSchedules] = useState<ScheduledExam[]>([]);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
    const [loadedExams, setLoadedExams] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            const data = await schedulingService.getSchedules();
            setSchedules(data);
        } catch (error) {
            console.error("Error loading schedules:", error);
        }
    };

    // Mesclar exames com agendamentos, incluindo agendamentos sem prova vinculada
    const availableExams = [
        ...exams.filter(e => e.status === ExamStatus.ACTIVE || e.status === ExamStatus.PUBLISHED)
            .map(exam => {
                const schedule = schedules.find(s => s.examId === exam.id);
                return {
                    ...exam,
                    scheduledDate: schedule?.scheduledFor,
                    mode: schedule?.mode || 'ONLINE',
                    scheduleId: schedule?.id,
                    isProvisional: false
                };
            }),
        ...schedules.filter(s => !s.examId).map(s => ({
            id: s.id, // Usar ID do agendamento como ID da "prova" temporária
            title: s.examTitle || 'Sem título (Agendamento)',
            subject: 'Agendamento Direto',
            status: ExamStatus.ACTIVE,
            durationMinutes: s.duration || 60,
            scheduledDate: s.scheduledFor,
            mode: s.mode,
            scheduleId: s.id,
            isProvisional: true
        }))
    ].filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isJoinable = (exam: any) => {
        if (!exam.scheduledDate) return true;
        const start = new Date(exam.scheduledDate).getTime();
        const now = Date.now();
        const end = start + (exam.durationMinutes * 60 * 1000);
        // Permitir entrar até 15 min antes ou durante a prova
        return now >= (start - 15 * 60 * 1000) && now <= end;
    };

    const handleDownload = async (examId: string) => {
        setDownloadingId(examId);
        setDownloadProgress(prev => ({ ...prev, [examId]: 0 }));

        // Simulação de download de pacotes (Questões, Imagens, Alunos)
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 300));
            setDownloadProgress(prev => ({ ...prev, [examId]: i }));
        }

        setLoadedExams(prev => ({ ...prev, [examId]: true }));
        setDownloadingId(null);
        alert("Carga Concluída! Os dados da prova e alunos foram baixados para uso offline.");
    };

    const handleLaunch = async (exam: any) => {
        if (!isJoinable(exam)) {
            alert("Esta prova não está disponível no momento. Verifique o horário agendado.");
            return;
        }

        if (!currentUser) return;

        try {
            const variantId = await getRecommendedVariant(currentUser.id, exam.id);
            const url = variantId
                ? `/online-exam/run/${exam.id}?variantId=${variantId}`
                : `/online-exam/run/${exam.id}`;
            navigate(url);
        } catch (e) {
            console.error("Error finding recommended variant:", e);
            navigate(`/online-exam/run/${exam.id}`);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <Accessibility className="text-brand-primary" size={32} />
                    Aplicação de Prova (Modo Inclusivo)
                </h1>
                <p className="text-slate-500">
                    Selecione uma prova abaixo para iniciar o ambiente seguro com suporte a PCD e Neurodivergência.
                </p>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Buscar prova..."
                    className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map(exam => (
                    <div key={exam.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-brand-primary rounded-lg">
                                <FileText size={24} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${exam.status === ExamStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {exam.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{exam.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{exam.subject}</p>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                    <Clock size={14} /> {exam.durationMinutes} min
                                </div>
                                {exam.scheduledDate && (
                                    <div className="text-[10px] text-brand-primary font-bold">
                                        {new Date(exam.scheduledDate).toLocaleString('pt-BR')}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Botão de Download para Offline */}
                                {(exam.mode === 'OFFLINE' || exam.mode === 'HYBRID') && !exam.isProvisional && (
                                    <button
                                        onClick={() => handleDownload(exam.id)}
                                        disabled={downloadingId !== null || loadedExams[exam.id]}
                                        title={loadedExams[exam.id] ? "Carga já realizada" : "Baixar para Offline"}
                                        className={`p-2 rounded-lg transition border flex items-center gap-1 ${loadedExams[exam.id]
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                            : 'bg-white text-brand-primary border-brand-primary/20 hover:bg-brand-primary/5'
                                            }`}
                                    >
                                        {downloadingId === exam.id ? (
                                            <span className="text-[10px] font-bold">{downloadProgress[exam.id]}%</span>
                                        ) : loadedExams[exam.id] ? (
                                            <CheckCircle size={18} />
                                        ) : (
                                            <CloudDownload size={18} />
                                        )}
                                        <span className="text-xs font-bold hidden sm:inline">
                                            {loadedExams[exam.id] ? 'Carregada' : 'Baixar'}
                                        </span>
                                    </button>
                                )}

                                <button
                                    onClick={() => handleLaunch(exam)}
                                    disabled={!isJoinable(exam) || ((exam.mode === 'OFFLINE' || exam.mode === 'HYBRID') && !loadedExams[exam.id])}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-2 ${isJoinable(exam) && (!((exam.mode === 'OFFLINE' || exam.mode === 'HYBRID')) || loadedExams[exam.id])
                                        ? 'bg-brand-primary text-white hover:bg-brand-dark'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    <Play size={16} /> {isJoinable(exam) ? 'Iniciar' : 'Aguarde'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {availableExams.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <AlertTriangle className="mx-auto mb-2 opacity-50" size={32} />
                        <p>Nenhuma prova encontrada.</p>
                        <button onClick={() => navigate('/exams/new')} className="text-brand-primary font-bold hover:underline mt-2">
                            Criar nova prova
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
