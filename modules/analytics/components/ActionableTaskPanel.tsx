import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, AlertTriangle, Lightbulb, Zap, Info } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export const ActionableTaskPanel: React.FC = () => {
    const { tasks, completeTask, dismissTask } = useAppStore();
    const navigate = useNavigate();

    const pendingTasks = tasks.filter(t => t.status === 'PENDING');

    if (pendingTasks.length === 0) {
        return (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <CheckCircle2 size={24} />
                </div>
                <h3 className="font-bold text-slate-800">Tudo em dia!</h3>
                <p className="text-sm text-slate-500">A IA não detectou novas tarefas críticas no momento.</p>
            </div>
        );
    }

    const getIcon = (type: string, priority: string) => {
        if (priority === 'URGENT' || priority === 'HIGH') return <Zap className="text-orange-500" size={20} />;
        if (type === 'PEDAGOGICAL') return <Lightbulb className="text-blue-500" size={20} />;
        return <Info className="text-indigo-500" size={20} />;
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Zap size={18} className="text-brand-primary" /> Sugestões de Ação Imediata
            </h3>

            <div className="space-y-3">
                {pendingTasks.map(task => (
                    <div
                        key={task.id}
                        className={`bg-white border rounded-xl p-4 shadow-sm transition-all border-l-4 ${task.priority === 'URGENT' ? 'border-l-orange-500' :
                                task.priority === 'HIGH' ? 'border-l-amber-500' : 'border-l-indigo-400'
                            }`}
                    >
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex gap-3">
                                <div className="mt-1">
                                    {getIcon(task.type, task.priority)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        {task.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => dismissTask(task.id)}
                                    className="p-1 text-slate-300 hover:text-slate-500 transition"
                                    title="Ignorar"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            {task.actionRoute && (
                                <button
                                    onClick={() => {
                                        navigate(task.actionRoute!);
                                        if (task.status === 'PENDING') completeTask(task.id);
                                    }}
                                    className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700 transition"
                                >
                                    {task.actionLabel || 'Executar'} <ArrowRight size={14} />
                                </button>
                            )}
                            <button
                                onClick={() => completeTask(task.id)}
                                className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
                            >
                                Marcar como Lida
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
