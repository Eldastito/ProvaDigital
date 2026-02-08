import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, ChevronRight, X, BrainCircuit } from 'lucide-react';
import { AIInsight } from '../../../utils/saasCalculators';

interface AIAdvisorDashboardProps {
    insights: AIInsight[];
}

export const AIAdvisorDashboard: React.FC<AIAdvisorDashboardProps> = ({ insights }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isThinking, setIsThinking] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setIsThinking(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleAction = (insight: AIInsight) => {
        if (insight.targetPath) {
            navigate(insight.targetPath);
        }
    };

    if (!isVisible || (insights.length === 0 && !isThinking)) return null;

    return (
        <div className="relative group overflow-hidden bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 transition-all duration-500 animate-in fade-in slide-in-from-top-4">
            {/* Background AI Pulse Effect */}
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit size={120} className="animate-pulse" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-primary/20 text-brand-primary rounded-xl border border-brand-primary/30 relative">
                        <Sparkles size={20} className={isThinking ? "animate-spin" : ""} />
                        <div className="absolute inset-0 bg-brand-primary/10 rounded-xl blur-lg animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase text-xs tracking-[0.2em]">Strategic AI Advisor</h3>
                        <p className="text-slate-400 text-[10px] font-medium">Análise de Heurísticas SaaS em Tempo Real</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {isThinking ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse border border-white/5" />
                    ))
                ) : (
                    insights.map((insight) => (
                        <div
                            key={insight.id}
                            className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-default flex flex-col justify-between ${insight.type === 'critical' ? 'bg-rose-500/10 border-rose-500/20 shadow-lg shadow-rose-500/5' :
                                insight.type === 'opportunity' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5' :
                                    'bg-brand-primary/10 border-brand-primary/20 shadow-lg shadow-brand-primary/5'
                                }`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {insight.type === 'critical' ? <AlertTriangle size={14} className="text-rose-400" /> :
                                        insight.type === 'opportunity' ? <TrendingUp size={14} className="text-emerald-400" /> :
                                            <Lightbulb size={14} className="text-brand-primary" />}
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${insight.type === 'critical' ? 'text-rose-400' :
                                        insight.type === 'opportunity' ? 'text-emerald-400' :
                                            'text-brand-primary'
                                        }`}>
                                        {insight.title}
                                    </span>
                                </div>
                                <p className="text-xs text-white/80 font-medium leading-relaxed">
                                    {insight.message}
                                </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                <div className="text-[9px] font-bold text-slate-500 uppercase">Impacto: {insight.impact}</div>
                                <button
                                    onClick={() => handleAction(insight)}
                                    className={`flex items-center gap-1.5 text-[10px] font-black group/btn cursor-pointer transition-colors ${insight.type === 'critical' ? 'text-rose-400 hover:text-rose-300' :
                                        insight.type === 'opportunity' ? 'text-emerald-400 hover:text-emerald-300' :
                                            'text-brand-primary hover:text-brand-light'
                                        }`}
                                >
                                    {insight.action} <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
