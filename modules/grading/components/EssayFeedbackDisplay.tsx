import React from 'react';
import { Brain, CheckCircle, AlertTriangle } from 'lucide-react';

interface EssayFeedbackDisplayProps {
    correction: any;
    activeTab: 'COMPETENCIES' | 'GRAMMAR';
    onTabChange: (tab: 'COMPETENCIES' | 'GRAMMAR') => void;
    hoveredIssue: number | null;
    onHover: (index: number | null) => void;
    children?: React.ReactNode; // For Footer Actions
}

export const EssayFeedbackDisplay: React.FC<EssayFeedbackDisplayProps> = ({
    correction,
    activeTab,
    onTabChange,
    hoveredIssue,
    onHover,
    children
}) => {
    if (!correction) return null;

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Score Board */}
            <div className="p-6 bg-slate-900 text-white text-center shrink-0">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                    {correction.globalScore}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Nota estimada ENEM</div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => onTabChange('COMPETENCIES')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'COMPETENCIES' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Competências
                </button>
                <button
                    onClick={() => onTabChange('GRAMMAR')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'GRAMMAR' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Correções ({correction.issues?.length || 0})
                </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {activeTab === 'COMPETENCIES' && (
                    <div className="space-y-4">
                        {correction.competencies.map((comp: any) => (
                            <div key={comp.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50 hover:bg-white hover:shadow-md transition">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Competência {comp.id}</span>
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${comp.score >= 160 ? 'bg-green-100 text-green-700' : comp.score >= 120 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {comp.score}/{comp.maxScore}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm mb-1">{comp.name}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{comp.feedback}</p>
                            </div>
                        ))}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                            <h4 className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-2">
                                <Brain size={14} /> Parecer Geral
                            </h4>
                            <p className="text-xs text-blue-800 leading-relaxed italic">
                                "{correction.generalFeedback}"
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'GRAMMAR' && (
                    <div className="space-y-3">
                        {correction.issues?.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                                <p>Nenhum erro encontrado!</p>
                            </div>
                        ) : (
                            correction.issues?.map((issue: any, idx: number) => (
                                <div
                                    key={idx}
                                    className={`border-l-4 rounded-r-lg p-3 text-sm transition cursor-pointer ${hoveredIssue === idx ? 'bg-yellow-50 border-yellow-500 shadow-md transform -translate-x-1' : 'bg-white border-yellow-300 shadow-sm'}`}
                                    onMouseEnter={() => onHover(idx)}
                                    onMouseLeave={() => onHover(null)}
                                >
                                    <div className="flex items-start gap-2 mb-1">
                                        <div className="bg-yellow-100 text-yellow-700 p-1 rounded">
                                            <AlertTriangle size={12} />
                                        </div>
                                        <div>
                                            <p className="font-mono text-xs text-red-500 line-through decoration-red-300">{issue.excerpt}</p>
                                            <p className="font-bold text-green-700">{issue.suggestion}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 pl-7">{issue.explanation}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            {children && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2 shrink-0">
                    {children}
                </div>
            )}
        </div>
    );
};
