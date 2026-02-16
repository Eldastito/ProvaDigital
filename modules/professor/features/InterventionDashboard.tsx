import React, { useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { Activity, BookOpen, CheckCircle, Clock, AlertTriangle, ChevronRight, User, Calendar, MessageCircle, FileText } from 'lucide-react';
import { getActiveInterventions, Intervention } from '../../../services/alertService';

export const InterventionDashboard: React.FC = () => {
    const { currentUser, studyPlans, students, exams } = useAppStore();
    const [filterStatus, setFilterStatus] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('ALL');
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [loadingInterventions, setLoadingInterventions] = useState(true);

    React.useEffect(() => {
        const fetchInterventions = async () => {
            if (currentUser?.schoolId) {
                try {
                    const data = await getActiveInterventions(currentUser.schoolId);
                    setInterventions(data);
                } catch (error) {
                    console.error('Failed to fetch interventions', error);
                } finally {
                    setLoadingInterventions(false);
                }
            }
        };
        fetchInterventions();
    }, [currentUser?.schoolId]);

    const filteredPlans = studyPlans.filter(p => {
        if (filterStatus === 'ALL') return true;
        return p.status === filterStatus;
    });

    const filteredInterventions = interventions.filter(i => {
        if (filterStatus === 'ALL') return true;
        // Map intervention status 'IN_PROGRESS' | 'PENDING' to UI filters if needed
        if (filterStatus === 'COMPLETED') return i.status === 'COMPLETED' || i.status === 'CANCELLED';
        return i.status === 'PENDING' || i.status === 'IN_PROGRESS';
    });

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="text-rose-600" />
                        Painel de Intervenção Pedagógica
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Acompanhe os Planos de Recuperação gerados automaticamente pela IA.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterStatus('PENDING')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Pendentes
                    </button>
                    <button
                        onClick={() => setFilterStatus('COMPLETED')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Concluídos
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* KPI Cards */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Planos Ativos</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {studyPlans.filter(p => p.status !== 'COMPLETED').length}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Recuperações Concluídas</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {studyPlans.filter(p => p.status === 'COMPLETED').length}
                        </h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Alunos em Risco</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {/* Mock risk calculation based on active plans */}
                            {new Set(studyPlans.filter(p => p.status !== 'COMPLETED').map(p => p.studentId)).size}
                        </h3>
                    </div>
                </div>
            </div>

            {/* SEÇÃO: INTERVENÇÕES HUMANAS (Alertas de Risco) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-orange-500" />
                            Ações de Intervenção (Risco)
                        </h3>
                        <p className="text-sm text-slate-500">Ações manuais registradas via Análise de Risco</p>
                    </div>
                    <div className="text-sm font-bold text-slate-600">
                        {filteredInterventions.length} ações
                    </div>
                </div>

                {loadingInterventions ? (
                    <div className="p-8 text-center text-slate-400">Carregando intervenções...</div>
                ) : filteredInterventions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-50">
                        Nenhuma intervenção registrada para este filtro.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredInterventions.map(action => (
                            <div key={action.id} className="p-4 hover:bg-slate-50 flex items-center justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 p-2 rounded-lg ${action.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                                        action.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                        {action.target === 'PARENT' ? <User size={20} /> :
                                            action.target === 'TEACHER' ? <BookOpen size={20} /> :
                                                <FileText size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{action.action}</h4>
                                        <p className="text-sm text-slate-600 mb-1">{action.description}</p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User size={12} /> Aluno: {(action as any).studentName || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(action.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded font-bold ${action.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {action.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold hover:bg-white hover:shadow-sm">
                                        Gerenciar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* List of Plans */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Últimos Planos Gerados</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {filteredPlans.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum plano de estudos encontrado para este filtro.
                        </div>
                    ) : (
                        filteredPlans.map(plan => {
                            const student = students.find(s => s.id === plan.studentId) || { name: 'Aluno Desconhecido', id: plan.studentId } as any;
                            const mockStudentName = student.name || `Aluno ${plan.studentId.substring(0, 4).toUpperCase()}`;
                            const exam = exams.find(e => e.id === plan.relatedExamId);
                            const percentComplete = Math.round((plan.tasks.filter(t => t.completed).length / plan.tasks.length) * 100) || 0;

                            return (
                                <div key={plan.id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{mockStudentName}</h4>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    Referente a: {exam?.title || 'Avaliação Geral'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${plan.status === 'COMPLETED'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                            {plan.status === 'COMPLETED' ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>Progresso das Tarefas</span>
                                            <span>{percentComplete}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${percentComplete === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                                                    }`}
                                                style={{ width: `${percentComplete}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <h5 className="text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Tarefas Recomendadas</h5>
                                        <ul className="space-y-2">
                                            {plan.tasks.map(task => (
                                                <li key={task.id} className="flex items-center gap-2 text-sm text-slate-600">
                                                    {task.completed ? (
                                                        <CheckCircle size={16} className="text-emerald-500" />
                                                    ) : (
                                                        <Clock size={16} className="text-slate-400" />
                                                    )}
                                                    <span className={task.completed ? 'line-through opacity-70' : ''}>
                                                        {task.title || task.description}
                                                    </span>
                                                    {task.type === 'VIDEO' && <span className="text-xs bg-red-100 text-red-700 px-1.5 rounded">Vídeo</span>}
                                                    {task.type === 'EXERCISE' && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded">Exercício</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2">
                                        <button className="text-sm text-slate-500 hover:text-blue-600 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                                            Editar Plano
                                        </button>
                                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                                            Ver Detalhes <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div >
    );
};
