import React from 'react';
import { BookOpen, Play, Calendar, Star, CheckCircle } from 'lucide-react';

export const AdaptiveStudyPlanWidget: React.FC = () => {
    // Mock adaptive plan data
    const plan = {
        title: "Plano de Recuperação Acelera Matemática",
        description: "Com base no seu desempenho na última prova, preparamos uma trilha para elevar sua nota 7.5.",
        progress: 35,
        steps: [
            { id: 1, title: "Revisão: Logaritmos e Funções", duration: "45min", type: 'video', status: 'completed' },
            { id: 2, title: "Exercícios Práticos de Fixação", duration: "30min", type: 'quiz', status: 'pending' },
            { id: 3, title: "Simulado Preditivo (Fase 1)", duration: "20min", type: 'exam', status: 'pending' }
        ]
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <BookOpen size={18} /> Plano de Estudos Adaptativo (IA)
                    </h3>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">ALPHA</span>
                </div>
            </div>

            <div className="p-5 flex-1">
                <h4 className="font-bold text-slate-800 text-sm mb-1">{plan.title}</h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{plan.description}</p>

                <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase">
                        <span>Progresso da Trilha</span>
                        <span>{plan.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${plan.progress}%` }}></div>
                    </div>
                </div>

                <div className="space-y-3">
                    {plan.steps.map(step => (
                        <div key={step.id} className={`flex items-center justify-between p-3 rounded-lg border transition ${step.status === 'completed' ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-300'
                            }`}>
                            <div className="flex items-center gap-3">
                                {step.status === 'completed' ? (
                                    <CheckCircle size={18} className="text-emerald-500" />
                                ) : (
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Play size={14} fill="currentColor" />
                                    </div>
                                )}
                                <div>
                                    <div className={`text-xs font-bold ${step.status === 'completed' ? 'text-slate-500' : 'text-slate-800'}`}>
                                        {step.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">{step.duration}</div>
                                </div>
                            </div>
                            {step.status !== 'completed' && (
                                <button className="text-[10px] font-bold text-indigo-600 hover:underline">Começar</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-center">
                <button className="text-xs font-bold text-slate-600 flex items-center gap-2 hover:text-indigo-600 transition">
                    Ver Plano Completo <Calendar size={14} />
                </button>
            </div>
        </div>
    );
};
