import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { schedulingService, ScheduledExam } from '../../services/schedulingService';
import { useSafeAppStore } from '../../store/useAppStore';

export const PendingExamsAlert: React.FC = () => {
    const [pendingExams, setPendingExams] = useState<ScheduledExam[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const store = useSafeAppStore();

    useEffect(() => {
        checkPendingExams();
    }, []);

    const checkPendingExams = async () => {
        setLoading(true);
        try {
            const allSchedules = await schedulingService.getSchedules({ status: 'SCHEDULED' });

            // Filtra agendamentos "Pendente" do usuário atual
            const pending = allSchedules.filter(
                s => s.examId === 'PENDING' && s.createdBy === (store.currentUser?.id || 'current-user')
            );

            setPendingExams(pending);

            if (pending.length > 0) {
                // Abre o modal automaticamente se houver pendências críticas
                const hasCriticalOrExpired = pending.some(s => getUrgencyLevel(s.scheduledFor) !== 'safe');
                if (hasCriticalOrExpired) {
                    setShowModal(true);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar provas pendentes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calcula quão urgente é a pendência baseado nos 7 dias de limite Logística ExamePad
    const getUrgencyLevel = (scheduledFor: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const scheduleDate = new Date(scheduledFor);
        scheduleDate.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(scheduleDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (scheduleDate < today || diffDays < 7) return 'expired'; // Bloqueio total
        if (diffDays <= 15) return 'critical'; // Aviso crítico
        return 'safe'; // Faltam mais de 15 dias, mas já existe a pendência
    };

    const handleCreateExam = () => {
        setShowModal(false);
        navigate('/exams/new');
    };

    const handleReschedule = (scheduleId: string) => {
        // Redireciona para o calendário, aqui assumimos que se clicar em reagendar de um expirado
        // O ideal real seria o app invalidar (cancelar) o agendamento atual antes
        // Aqui simulamos uma chamada assíncrona para demonstrar a intenção completa
        const cancelAndReschedule = async () => {
            try {
                await schedulingService.cancelSchedule(scheduleId);
                setShowModal(false);
                navigate('/academic/exams'); // Ou a rota correta do calendário/scheduler
            } catch (e) {
                console.error("Failed to cancel schedule", e);
            }
        };
        cancelAndReschedule();
    };

    if (loading || pendingExams.length === 0) return null;

    // Se temos apenas pendências seguras e o modal não está aberto, mostra um mini float de aviso
    if (!showModal) {
        return (
            <div
                className="fixed bottom-6 right-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r shadow-lg z-40 max-w-sm cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => setShowModal(true)}
            >
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-amber-800 font-medium">
                            Você tem {pendingExams.length} agendamento(s) sem prova definida.
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                            Clique para visualizar os prazos.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const hasExpired = pendingExams.some(s => getUrgencyLevel(s.scheduledFor) === 'expired');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`bg-white rounded-2xl max-w-2xl w-full p-0 overflow-hidden shadow-2xl ring-1 ${hasExpired ? 'ring-red-500/50' : 'ring-amber-500/50'}`}>

                {/* Header */}
                <div className={`p-6 text-white ${hasExpired ? 'bg-red-600' : 'bg-amber-500'}`}>
                    <div className="flex items-center gap-3">
                        {hasExpired ? (
                            <AlertCircle className="w-8 h-8 flex-shrink-0" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 flex-shrink-0" />
                        )}
                        <div>
                            <h2 className="text-xl font-bold">
                                {hasExpired ? 'Atenção: Prazo de Prova(s) Expirado!' : 'Ação Necessária: Provas Pendentes'}
                            </h2>
                            <p className="text-white/80 text-sm mt-1">
                                {hasExpired
                                    ? 'A ExamePad requer 7 dias de antecedência mínima para organizar a logística.'
                                    : 'A ExamePad precisa de tempo para a montagem dos tablets e logística.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lista de Pendências */}
                <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50">
                    <div className="space-y-4">
                        {pendingExams.map(exam => {
                            const urgency = getUrgencyLevel(exam.scheduledFor);

                            const getCardStyle = () => {
                                if (urgency === 'expired') return 'bg-red-50 border-red-200';
                                if (urgency === 'critical') return 'bg-orange-50 border-orange-200';
                                return 'bg-white border-slate-200';
                            };

                            return (
                                <div key={exam.id} className={`p-4 rounded-xl border ${getCardStyle()}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900">{exam.examTitle}</h3>
                                        <span className="text-sm font-semibold text-slate-600 bg-slate-200/50 px-2 py-1 rounded">
                                            {new Date(exam.scheduledFor).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Turmas vinculadas: {exam.classIds.length}
                                    </p>

                                    {urgency === 'expired' ? (
                                        <div className="mb-4">
                                            <p className="text-sm font-bold text-red-700 bg-red-100 p-3 rounded-lg flex gap-2 items-start">
                                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                O tempo para montagem da prova expirou. Devido à nossa margem segura de logística, este evento não poderá prosseguir na data agendada. Uma nova data da prova deve ser agendada.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mb-4">
                                            <p className={`text-sm font-medium ${urgency === 'critical' ? 'text-orange-700' : 'text-amber-700'}`}>
                                                Foque em criar esta avaliação e associá-la em breve.
                                                <br />Prazo limite de vinculação: <strong>{
                                                    new Date(new Date(exam.scheduledFor).setDate(new Date(exam.scheduledFor).getDate() - 7)).toLocaleDateString('pt-BR')
                                                }</strong>
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-black/5">
                                        {urgency === 'expired' ? (
                                            <button
                                                onClick={() => handleReschedule(exam.id)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                Cancelar e Reagendar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleCreateExam}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                Criar Prova Agora
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer do Modal */}
                <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                    {/* Só permite fechar se NÃO tiver provas expiradas OBRIGATÓRIAS */}
                    {!hasExpired ? (
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                        >
                            Lembrar-me mais tarde
                        </button>
                    ) : (
                        <div className="text-sm text-red-600 font-medium px-4 py-2">
                            Ação obrigatória necessária nos agendamentos expirados
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
