import React from 'react';
import { X, Sparkles, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { KPIDefinition } from '../../../utils/kpiKnowledgeBase';

interface AITutorDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    kpi: KPIDefinition | null;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({ isOpen, onClose, kpi }) => {
    if (!kpi) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-primary/20 rounded-lg">
                                <Sparkles size={20} className="text-brand-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-brand-secondary">AI Business Tutor</h3>
                                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Educador de Performance Digital</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        <div>
                            <div className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-2">{kpi.label}</div>
                            <h2 className="text-2xl font-black text-slate-800 leading-tight">O que isso significa?</h2>
                            <p className="mt-4 text-slate-600 leading-relaxed font-medium">
                                {kpi.description}
                            </p>
                        </div>

                        <div className="p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                            <div className="flex items-start gap-4">
                                <Lightbulb className="text-brand-primary shrink-0" size={24} />
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-brand-dark uppercase tracking-wider">Por que isso importa?</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                        {kpi.whyItMatters}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Target className="text-emerald-500" size={18} />
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Estratégias de Melhoria</h4>
                            </div>
                            <ul className="space-y-3">
                                {kpi.howToImprove.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        <span className="text-xs font-bold text-slate-700">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-4 bg-slate-100 rounded-xl flex items-center gap-3">
                            <TrendingUp className="text-slate-400" size={18} />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                Este insight foi gerado baseado em heurísticas de escala SaaS.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100">
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-brand-dark text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg"
                        >
                            Entendi, vamos aplicar!
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
