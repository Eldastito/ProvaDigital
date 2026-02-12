import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, X, AlertCircle, CheckCircle, TrendingUp, Search, Info } from 'lucide-react';
import { Item } from '../../../types';
import { analyzeExamBalance, ExamAnalysisResponse } from '../../../services/geminiService';
import { BNCCSearchModal } from './BNCCSearchModal';

interface AgentCoPilotOverlayProps {
    examTitle: string;
    items: Item[];
    onApplyAction?: (type: string, data?: any) => void;
}

export const AgentCoPilotOverlay: React.FC<AgentCoPilotOverlayProps> = ({
    examTitle,
    items,
    onApplyAction
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<ExamAnalysisResponse | null>(null);
    const [bnccModalOpen, setBnccModalOpen] = useState(false);

    // Analyze whenever items change and panel is open
    useEffect(() => {
        if (isOpen && items.length > 0) {
            handleAnalyze();
        }
    }, [isOpen, items.length]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeExamBalance(examTitle || 'Prova sem título', items);
            setAnalysis(result);
        } catch (error) {
            console.error("AI Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="text-emerald-500" size={18} />;
            case 'WARNING': return <AlertCircle className="text-amber-500" size={18} />;
            case 'DANGER': return <AlertCircle className="text-rose-500" size={18} />;
            default: return <Info className="text-blue-500" size={18} />;
        }
    };

    const getInsightBg = (type: string) => {
        switch (type) {
            case 'SUCCESS': return 'bg-emerald-50 border-emerald-100';
            case 'WARNING': return 'bg-amber-50 border-amber-100';
            case 'DANGER': return 'bg-rose-50 border-rose-100';
            default: return 'bg-blue-50 border-blue-100';
        }
    };

    return (
        <>
            {/* Pulsing FAB */}
            <div className="fixed bottom-8 right-8 z-40">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center relative group ${isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-gradient-to-tr from-brand-primary to-indigo-600 text-white hover:scale-110'
                        }`}
                >
                    {isOpen ? <X size={28} /> : <Brain size={28} className="animate-pulse" />}

                    {!isOpen && analysis && analysis.score < 70 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">!</span>
                    )}
                </button>
            </div>

            {/* Slide-over Panel */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 bg-slate-900 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-brand-primary/20 rounded-lg">
                            <Brain size={20} className="text-brand-primary" />
                        </div>
                        <h3 className="font-bold text-lg">Agent Co-Pilot</h3>
                    </div>
                    <p className="text-xs text-slate-400">Consultor Pedagógico de IA</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                            <Sparkles className="animate-spin text-brand-primary" size={32} />
                            <p className="text-xs font-medium">Analisando pedagogia da prova...</p>
                        </div>
                    ) : analysis ? (
                        <>
                            {/* Score Card */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Qualidade Pedagógica</div>
                                <div className="text-4xl font-black text-slate-800">{analysis.score}<span className="text-lg text-slate-400">/100</span></div>
                                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${analysis.score > 80 ? 'bg-emerald-500' : analysis.score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                        style={{ width: `${analysis.score}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Insights List */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Insights Precisos</h4>
                                {analysis.insights.map((insight, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border ${getInsightBg(insight.type)} transition-all hover:shadow-md animate-in slide-in-from-right duration-300`} style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-slate-800 mb-1">{insight.title}</div>
                                                <p className="text-[10px] text-slate-600 leading-relaxed mb-2">{insight.message}</p>

                                                {insight.actionType && (
                                                    <button
                                                        onClick={() => {
                                                            if (insight.actionType === 'BNCC') setBnccModalOpen(true);
                                                        }}
                                                        className="text-[10px] font-bold text-brand-primary flex items-center gap-1 hover:underline text-left"
                                                    >
                                                        {insight.actionLabel || 'Resolver Agora'}
                                                        <TrendingUp size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-300 text-center">
                            <Search size={48} className="mb-4 opacity-50" />
                            <p className="text-xs">Adicione questões para iniciar a análise.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || items.length === 0}
                        className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Sparkles size={14} className="text-brand-primary" />
                        Recalcular Insights
                    </button>
                </div>
            </div>

            {bnccModalOpen && (
                <BNCCSearchModal
                    isOpen={bnccModalOpen}
                    onClose={() => setBnccModalOpen(false)}
                    onSelect={(codes) => {
                        if (onApplyAction) onApplyAction('BNCC_LINK', codes);
                        setBnccModalOpen(false);
                    }}
                    currentSubject={items[0]?.subject}
                />
            )}
        </>
    );
};
