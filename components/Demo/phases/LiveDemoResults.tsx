import React, { useState } from 'react';
import { Trophy, Award, PieChart, FileText, Download } from 'lucide-react';
import { RichTextRenderer } from '../../RichTextRenderer';

interface LiveDemoResultsProps {
    examStats: any;
    selectedExamItems: any[];
    topPerformers: any[];
    generateReport: () => void;
}

export const LiveDemoResults = ({ examStats, selectedExamItems, topPerformers, generateReport }: LiveDemoResultsProps) => {
    const [resultView, setResultView] = useState<'OVERVIEW' | string>('OVERVIEW');

    const renderDistributionBar = (itemId: string) => {
        if (!examStats || !examStats.questions || !examStats.questions[itemId]) return null;
        const dist = examStats.questions[itemId].distribution; // { a: 10, b: 5 }

        const total = Object.values(dist).reduce((a: any, b: any) => a + b, 0) as number;
        if (total === 0) return <div className="text-slate-500">Sem dados</div>;

        return (
            <div className="mt-8 space-y-4 max-w-2xl mx-auto">
                {Object.entries(dist).map(([key, count]: [string, any]) => {
                    const percentage = Math.round((count / total) * 100);
                    const item = selectedExamItems.find(i => i.id === itemId);
                    // Find index for A/B/C Label
                    const altIndex = item?.alternatives.findIndex((a: any) => a.id === key);
                    const label = altIndex >= 0 ? String.fromCharCode(65 + altIndex) : '?';

                    const alt = item?.alternatives.find((a: any) => a.id === key);
                    const isCorrect = alt?.isCorrect;

                    return (
                        <div key={key} className="relative">
                            <div className="flex justify-between text-sm mb-1 px-2">
                                <span className={isCorrect ? "text-emerald-400 font-bold" : "text-slate-400"}>
                                    {label}. {alt?.text || 'Alternativa desconhecida'}
                                </span>
                                <span className="text-white font-mono">{percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-10 rounded-lg overflow-hidden relative border border-slate-700">
                                <div
                                    className={`h-full transition-all duration-1000 flex items-center px-4 ${isCorrect ? 'bg-emerald-600/50' : 'bg-slate-600/30'}`}
                                    style={{ width: `${percentage}%` }}
                                >
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex-1 bg-slate-900 p-8 flex flex-col items-center overflow-y-auto">
            <div className="max-w-6xl w-full animate-in zoom-in duration-500">
                {/* Navigation / Header */}
                <div className="flex justify-center mb-8 gap-4 flex-wrap">
                    <button
                        onClick={() => setResultView('OVERVIEW')}
                        className={`px-6 py-2 rounded-full font-bold transition ${resultView === 'OVERVIEW' ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Visão Geral
                    </button>
                    {selectedExamItems.map((item, idx) => (
                        <button
                            key={item.id}
                            onClick={() => setResultView(item.id)}
                            className={`px-6 py-2 rounded-full font-bold transition ${resultView === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            Q{idx + 1}
                        </button>
                    ))}

                    {/* REPORT BUTTON */}
                    <button
                        onClick={generateReport}
                        className="px-6 py-2 rounded-full font-bold transition bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center gap-2"
                    >
                        <FileText size={16} /> Baixar Relatório
                    </button>
                </div>

                {resultView === 'OVERVIEW' ? (
                    <>
                        <div className="text-center mb-12">
                            <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tight flex items-center justify-center gap-4">
                                <Trophy size={48} className="text-yellow-400" /> Resultado da Turma
                            </h1>
                            <p className="text-slate-400 text-xl">Correção automática e processamento de dados concluídos.</p>
                        </div>

                        {/* Top Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                                <div className="text-slate-400 text-sm font-bold uppercase mb-2">Total de Provas</div>
                                <div className="text-5xl font-black text-white">{examStats.total}</div>
                            </div>
                            {selectedExamItems.slice(0, 3).map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center cursor-pointer hover:border-brand-primary transition"
                                    onClick={() => setResultView(item.id)}
                                >
                                    <div className="text-slate-400 text-sm font-bold uppercase mb-2">Acerto Questão {idx + 1}</div>
                                    <div className={`text-5xl font-black ${examStats[item.id] > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{examStats[item.id]}%</div>
                                    <div className="text-[10px] text-slate-500 mt-2 truncate max-w-full">
                                        <RichTextRenderer content={item.statement} className="truncate" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Podium */}
                        <div className="flex flex-col items-center">
                            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2"><Award className="text-yellow-400" /> Destaques da Sessão</h2>
                            <div className="flex items-end gap-4 md:gap-8">
                                {/* 2nd Place */}
                                {topPerformers[1] && (
                                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
                                        <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-slate-400 flex items-center justify-center text-3xl font-bold text-slate-600 mb-4 shadow-lg">
                                            {topPerformers[1].name.charAt(0)}
                                        </div>
                                        <div className="h-40 w-32 bg-slate-700 rounded-t-lg border-t-4 border-slate-400 flex flex-col items-center justify-end p-4 shadow-xl">
                                            <span className="text-4xl font-black text-slate-400">2º</span>
                                        </div>
                                        <div className="mt-4 text-center">
                                            <div className="font-bold text-white text-lg">{topPerformers[1].name.split(' ')[0]}</div>
                                            <div className="text-emerald-400 font-bold">{topPerformers[1].score}/{selectedExamItems.length}</div>
                                        </div>
                                    </div>
                                )}

                                {/* 1st Place */}
                                {topPerformers[0] && (
                                    <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-8 duration-700">
                                        <div className="w-32 h-32 rounded-full bg-yellow-100 border-4 border-yellow-400 flex items-center justify-center text-4xl font-bold text-yellow-600 mb-4 shadow-xl relative">
                                            {topPerformers[0].name.charAt(0)}
                                            <Trophy className="absolute -top-6 text-yellow-400 drop-shadow-lg" size={48} fill="currentColor" />
                                        </div>
                                        <div className="h-56 w-40 bg-slate-700 rounded-t-lg border-t-4 border-yellow-400 flex flex-col items-center justify-end p-4 shadow-2xl">
                                            <span className="text-6xl font-black text-yellow-400">1º</span>
                                        </div>
                                        <div className="mt-4 text-center">
                                            <div className="font-bold text-white text-xl">{topPerformers[0].name.split(' ')[0]}</div>
                                            <div className="text-emerald-400 font-bold text-lg">{topPerformers[0].score}/{selectedExamItems.length}</div>
                                        </div>
                                    </div>
                                )}

                                {/* 3rd Place */}
                                {topPerformers[2] && (
                                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-500">
                                        <div className="w-24 h-24 rounded-full bg-orange-100 border-4 border-orange-400 flex items-center justify-center text-3xl font-bold text-orange-600 mb-4 shadow-lg">
                                            {topPerformers[2].name.charAt(0)}
                                        </div>
                                        <div className="h-32 w-32 bg-slate-700 rounded-t-lg border-t-4 border-orange-400 flex flex-col items-center justify-end p-4 shadow-xl">
                                            <span className="text-4xl font-black text-orange-400">3º</span>
                                        </div>
                                        <div className="mt-4 text-center">
                                            <div className="font-bold text-white text-lg">{topPerformers[2].name.split(' ')[0]}</div>
                                            <div className="text-emerald-400 font-bold">{topPerformers[2].score}/{selectedExamItems.length}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in">
                        <div className="text-center mb-12">
                            <div className="inline-block p-4 rounded-full bg-slate-800 mb-4">
                                <PieChart size={40} className="text-brand-secondary" />
                            </div>
                            <h2 className="text-4xl font-bold text-white">
                                Questão {selectedExamItems.findIndex(i => i.id === resultView) + 1}
                            </h2>
                            <div className="text-slate-400 mt-4 max-w-2xl mx-auto">
                                <RichTextRenderer content={selectedExamItems.find(i => i.id === resultView)?.statement || ''} />
                            </div>
                        </div>
                        {renderDistributionBar(resultView)}
                    </div>
                )}
            </div>
        </div>
    );
};
