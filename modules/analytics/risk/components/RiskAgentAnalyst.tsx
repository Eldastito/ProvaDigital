import React, { useState } from 'react';
import { Brain, Sparkles, TrendingUp, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { analyzeRiskData, RiskAnalysisResponse } from '../../../../services/geminiService';

interface RiskAgentAnalystProps {
    assessments: any[];
}

export const RiskAgentAnalyst: React.FC<RiskAgentAnalystProps> = ({ assessments }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<RiskAnalysisResponse | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeRiskData(assessments);
            setAnalysis(result);
        } catch (error) {
            console.error("Risk analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (assessments.length === 0) return null;

    return (
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            <div
                className="p-4 bg-slate-900 text-white flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary/20 rounded-lg">
                        <Brain size={20} className="text-brand-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold">Agent Analyst</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">AI Strategic Insights</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!analysis && !isAnalyzing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                            className="px-4 py-1.5 bg-brand-primary hover:bg-brand-dark text-white text-xs font-bold rounded-lg transition flex items-center gap-2 shadow-lg shadow-brand-primary/20"
                        >
                            <Sparkles size={14} />
                            Analisar Rede
                        </button>
                    )}
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 bg-slate-50/50">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                            <Sparkles className="animate-spin text-brand-primary" size={32} />
                            <p className="text-sm font-medium">Processando métricas e tendências...</p>
                        </div>
                    ) : analysis ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Summary */}
                            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
                                    <Lightbulb size={14} className="text-amber-500" />
                                    Resumo Executivo
                                </h4>
                                <p className="text-slate-700 leading-relaxed text-sm">{analysis.summary}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Insights */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-400 uppercase mb-1 px-1">Pontos Críticos Detectados</h4>
                                    {analysis.insights.map((insight, idx) => (
                                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex gap-4 transition hover:shadow-md">
                                            <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${insight.impact === 'HIGH' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                    insight.impact === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`} />
                                            <div>
                                                <div className="font-extrabold text-slate-800 text-sm mb-1">{insight.title}</div>
                                                <p className="text-xs text-slate-600 leading-relaxed">{insight.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Recommendations */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-400 uppercase mb-1 px-1">Plano de Ação Recomendado</h4>
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                                        {analysis.recommendations.map((rec, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className="mt-0.5 bg-emerald-200 text-emerald-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-xs text-emerald-900 font-medium leading-relaxed">{rec}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleAnalyze}
                                        className="w-full py-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline flex items-center justify-center gap-2"
                                    >
                                        <TrendingUp size={12} />
                                        Atualizar Análise Estratégica
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-center gap-4">
                            <Sparkles size={40} className="text-slate-200" />
                            <div className="max-w-xs">
                                <p className="font-bold text-slate-600">Visão Geral com Inteligência Artificial</p>
                                <p className="text-xs mt-1">Clique em "Analisar Rede" para transformar dados brutos em insights estratégicos para a gestão.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
