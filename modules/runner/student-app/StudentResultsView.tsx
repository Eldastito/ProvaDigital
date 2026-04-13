import React, { useState } from 'react';
import { Trophy, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { RichTextRenderer } from '../../../components/RichTextRenderer';

interface StudentResultsViewProps {
    studentName: string;
    score: number;
    total: number;
    items: any[];
    answers: Record<string, any>;
    onExit: () => void;
}

export const StudentResultsView = ({ studentName, score, total, items, answers, onExit }: StudentResultsViewProps) => {
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const percentage = Math.round((score / total) * 100);

    // Identify if user passed (70% cut)
    const passed = percentage >= 70;

    return (
        <div className="fixed inset-0 bg-[var(--forge-bg-deep)] flex flex-col font-sans overflow-hidden animate-in fade-in duration-500 z-50">
            {/* HEADER */}
            <div className="bg-slate-800 p-6 pb-12 rounded-b-[2.5rem] shadow-2xl relative z-10 text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-xl border-4 ${passed ? 'bg-emerald-500 border-emerald-300' : 'bg-amber-500 border-amber-300'}`}>
                    <Trophy size={40} className="text-white drop-shadow-md" />
                </div>

                <h1 className="text-2xl font-black text-white mb-1">Prova Finalizada!</h1>
                <p className="text-slate-400 text-sm mb-6">Confira seu desempenho abaixo</p>

                <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acertos</div>
                        <div className="text-4xl font-black text-white">
                            {score}<span className="text-lg text-slate-500">/{total}</span>
                        </div>
                    </div>
                    <div className="w-px h-12 bg-slate-700"></div>
                    <div className="text-center">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nota</div>
                        <div className={`text-4xl font-black ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {percentage / 10}
                        </div>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE LIST */}
            <div className="flex-1 overflow-y-auto -mt-6 pt-10 px-4 space-y-4 pb-24 custom-scrollbar">
                {items.map((item, idx) => {
                    const studentAnswerId = answers[item.id];
                    const correctAlt = item.alternatives.find((a: any) => a.isCorrect);
                    const isCorrect = studentAnswerId === correctAlt?.id;
                    const isExpanded = expandedItem === item.id;

                    return (
                        <div
                            key={item.id}
                            onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                            className={`bg-slate-800/50 border rounded-2xl overflow-hidden active:scale-[0.98] transition-all duration-200 ${isCorrect
                                ? 'border-emerald-500/30'
                                : 'border-red-500/30'}`}
                        >
                            {/* Question Header Status */}
                            <div className={`p-4 flex items-start gap-4 ${isCorrect ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-red-500 text-white'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium text-sm line-clamp-2">
                                        <RichTextRenderer content={item.statement} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        {isCorrect ? (
                                            <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                <CheckCircle size={12} /> Correta
                                            </span>
                                        ) : (
                                            <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                                                <XCircle size={12} /> Incorreta
                                            </span>
                                        )}
                                        {!isExpanded && (
                                            <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                                                Ver Detalhes <ChevronDown size={12} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details (Gabarito) */}
                            {isExpanded && (
                                <div className="p-4 bg-slate-900/50 border-t border-slate-700/50 animate-in slide-in-from-top-2">
                                    <div className="space-y-3">
                                        {item.alternatives.map((alt: any) => {
                                            const isSelected = studentAnswerId === alt.id;
                                            const isTheCorrectOne = alt.isCorrect;

                                            let styleClass = "border-slate-700 bg-slate-800 text-slate-400 opacity-60";
                                            if (isTheCorrectOne) {
                                                styleClass = "border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold";
                                            } else if (isSelected && !isTheCorrectOne) {
                                                styleClass = "border-red-500 bg-red-500/20 text-red-400";
                                            }

                                            return (
                                                <div key={alt.id} className={`p-3 rounded-xl border text-sm flex gap-3 ${styleClass}`}>
                                                    <div className="flex-shrink-0 font-bold">{alt.id.toUpperCase()}.</div>
                                                    <div>{alt.text}</div>
                                                    {isTheCorrectOne && <CheckCircle size={16} className="ml-auto flex-shrink-0 text-emerald-500" />}
                                                    {isSelected && !isTheCorrectOne && <XCircle size={16} className="ml-auto flex-shrink-0 text-red-500" />}
                                                </div>
                                            );
                                        })}

                                        {item.feedback && (
                                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs flex gap-2">
                                                <AlertCircle size={16} className="flex-shrink-0" />
                                                <div>
                                                    <span className="font-bold block mb-1">Comentário do Professor:</span>
                                                    <RichTextRenderer content={item.feedback} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 text-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setExpandedItem(null); }}
                                            className="text-slate-500 text-xs flex items-center justify-center gap-1 hover:text-white transition"
                                        >
                                            <ChevronUp size={14} /> Recolher
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* FOOTER */}
            <div className="bg-slate-900 border-t border-slate-800 p-4 safe-area-pb z-20">
                <button
                    onClick={onExit}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                    Sair da Sessão
                </button>
            </div>
        </div>
    );
}
