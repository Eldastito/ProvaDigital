import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TrendingUp, TrendingDown, Calendar, BookOpen, AlertCircle, MessageCircle, Award } from 'lucide-react';

export const ParentDashboardView = () => {
    const { currentUser, selectedChildId, setSelectedChildId, students, results, exams } = useAppStore();

    // Buscar filhos do responsável
    const children = useMemo(() => {
        if (!currentUser?.childrenIds) return [];
        return students.filter(s => currentUser.childrenIds?.includes(s.id));
    }, [currentUser, students]);

    // Filho selecionado (primeiro por padrão)
    const selectedChild = useMemo(() => {
        return children.find(c => c.id === selectedChildId) || children[0];
    }, [children, selectedChildId]);

    // Calcular métricas do filho selecionado
    const metrics = useMemo(() => {
        if (!selectedChild) return null;

        const childResults = results.filter(r => r.studentId === selectedChild.id);

        // IDG (média ponderada)
        const avgScore = childResults.length > 0
            ? childResults.reduce((sum, r) => sum + r.totalScore, 0) / childResults.length
            : 0;

        // Última nota
        const lastResult = childResults.sort((a, b) =>
            new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
        )[0];

        const lastExam = lastResult ? exams.find(e => e.id === lastResult.examId) : null;

        // Frequência (mock - em produção viria do backend)
        const attendanceRate = 92; // TODO: calcular real

        // Próxima prova
        const upcomingExams = exams
            .filter(e => e.status === 'PUBLISHED' && e.classIds.includes(selectedChild.classId))
            .sort((a, b) => new Date(a.scheduledDate || '').getTime() - new Date(b.scheduledDate || '').getTime());

        return {
            idg: avgScore,
            idgTrend: 5, // TODO: calcular tendência real
            attendance: attendanceRate,
            attendanceTrend: -2,
            lastGrade: lastResult?.totalScore || 0,
            lastSubject: lastExam?.subject || 'N/A',
            nextExam: upcomingExams[0],
        };
    }, [selectedChild, results, exams]);

    if (!currentUser) return null;

    if (children.length === 0) {
        return (
            <div className="p-8 text-center">
                <AlertCircle size={48} className="mx-auto text-slate-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Nenhum filho vinculado</h2>
                <p className="text-slate-500 mt-2">Entre em contato com a escola para vincular seus filhos à sua conta.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">
                    Acompanhamento Escolar
                </h1>
                <p className="text-slate-600">Monitore o desempenho e atividades dos seus filhos</p>
            </div>

            {/* Seletor de filhos (se tiver mais de um) */}
            {children.length > 1 && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o filho:</label>
                    <select
                        value={selectedChildId || children[0].id}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    >
                        {children.map(child => (
                            <option key={child.id} value={child.id}>
                                {child.name} - {child.registrationNumber}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedChild && metrics && (
                <>
                    {/* Cards de Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                        {/* IDG */}
                        <MetricCard
                            title="IDG (Desempenho)"
                            value={metrics.idg.toFixed(1)}
                            trend={metrics.idgTrend}
                            icon={Award}
                            color="blue"
                        />

                        {/* Frequência */}
                        <MetricCard
                            title="Frequência"
                            value={`${metrics.attendance}%`}
                            trend={metrics.attendanceTrend}
                            icon={Calendar}
                            color="green"
                        />

                        {/* Última Nota */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-600">Última Nota</span>
                                <BookOpen size={20} className="text-purple-500" />
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{metrics.lastGrade.toFixed(1)}</div>
                            <div className="text-xs text-slate-500 mt-1">{metrics.lastSubject}</div>
                        </div>

                        {/* Próxima Prova */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-600">Próxima Prova</span>
                                <Calendar size={20} className="text-orange-500" />
                            </div>
                            {metrics.nextExam ? (
                                <>
                                    <div className="text-lg font-bold text-slate-800">
                                        {new Date(metrics.nextExam.scheduledDate || '').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{metrics.nextExam.subject}</div>
                                </>
                            ) : (
                                <div className="text-sm text-slate-500">Nenhuma prova agendada</div>
                            )}
                        </div>
                    </div>

                    {/* Alertas (se houver) */}
                    <AlertsSection childId={selectedChild.id} />

                    {/* Timeline de Atividades */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BookOpen size={24} />
                            Atividades Recentes
                        </h2>
                        <ActivityTimeline childId={selectedChild.id} />
                    </div>

                    {/* Ações Rápidas */}
                    <div className="mt-6 flex flex-wrap gap-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition">
                            <MessageCircle size={18} />
                            Conversar com Professor
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                            <BookOpen size={18} />
                            Ver Boletim Completo
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// Componente de Card de Métrica
const MetricCard = ({ title, value, trend, icon: Icon, color }: any) => {
    const isPositive = trend > 0;
    const colorClasses = {
        blue: 'text-blue-500',
        green: 'text-green-500',
        purple: 'text-purple-500',
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">{title}</span>
                <Icon size={20} className={colorClasses[color as keyof typeof colorClasses]} />
            </div>
            <div className="text-3xl font-bold text-slate-800">{value}</div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{Math.abs(trend)}% vs. mês anterior</span>
            </div>
        </div>
    );
};

// Componente de Alertas
const AlertsSection = ({ childId }: { childId: string }) => {
    // TODO: Implementar lógica real de alertas
    const alerts = [
        // Exemplo de alerta
        // { level: 'warning', message: 'Frequência abaixo de 85% este mês' }
    ];

    if (alerts.length === 0) return null;

    return (
        <div className="mb-6 space-y-3">
            {alerts.map((alert, idx) => (
                <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800">{alert.message}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Componente de Timeline
const ActivityTimeline = ({ childId }: { childId: string }) => {
    const { results, exams } = useAppStore();

    const activities = useMemo(() => {
        const childResults = results
            .filter(r => r.studentId === childId)
            .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime())
            .slice(0, 10);

        return childResults.map(result => {
            const exam = exams.find(e => e.id === result.examId);
            return {
                date: result.gradedAt,
                type: 'exam' as const,
                title: `Prova de ${exam?.subject || 'Disciplina'}`,
                description: `Nota: ${result.totalScore.toFixed(1)}`,
                score: result.totalScore,
            };
        });
    }, [childId, results, exams]);

    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <BookOpen size={48} className="mx-auto mb-2 opacity-30" />
                <p>Nenhuma atividade registrada ainda</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {activities.map((activity, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.score >= 7 ? 'bg-green-100 text-green-600' :
                                activity.score >= 5 ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-red-100 text-red-600'
                            }`}>
                            <BookOpen size={18} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-medium text-slate-800">{activity.title}</h3>
                                <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                            </div>
                            <span className="text-xs text-slate-500">
                                {new Date(activity.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
