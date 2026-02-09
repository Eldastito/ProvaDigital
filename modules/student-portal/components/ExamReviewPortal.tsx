
import React, { useState } from 'react';
import { FileText, ChevronRight, Brain, User, AlertCircle, Sparkles, CheckCircle, Search, ArrowLeft, Star } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { ExamResult, Exam, Item, QuestionType } from '../../../types';

export const ExamReviewPortal = () => {
    const { results, exams, items } = useAppStore();
    const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedResult = results.find(r => r.id === selectedResultId);
    const currentExam = selectedResult ? exams.find(e => e.id === selectedResult.examId) : null;

    const filteredResults = results.filter(r => {
        const exam = exams.find(e => e.id === r.examId);
        return exam?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exam?.subject.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (selectedResult && currentExam) {
        return (
            <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in">
                <button
                    onClick={() => setSelectedResultId(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-6 transition"
                >
                    <ArrowLeft size={20} /> Voltar para o Histórico
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="border-b pb-6 mb-8 flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900">{currentExam.title}</h1>
                                    <p className="text-slate-500 font-medium">{currentExam.subject} • Realizada em {new Date(selectedResult.gradedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-slate-400 uppercase mb-1">Nota Final</div>
                                    <div className={`text-4xl font-black ${selectedResult.totalScore >= 7 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {selectedResult.totalScore.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {currentExam.items.map((conf, idx) => {
                                    const item = items.find(i => i.id === conf.itemId);
                                    const answer = selectedResult.answers.find(a => a.itemId === conf.itemId);
                                    if (!item) return null;

                                    return (
                                        <div key={item.id} className="relative">
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500 border border-slate-200">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="text-lg font-bold text-slate-800 leading-tight pr-12">
                                                            {item.statement}
                                                        </div>
                                                        <div className="bg-slate-50 border px-3 py-1 rounded-lg text-xs font-black text-slate-500 whitespace-nowrap">
                                                            {answer?.scoreObtained || 0} / {conf.customScore || item.score} pts
                                                        </div>
                                                    </div>

                                                    {item.type !== QuestionType.ESSAY ? (
                                                        <div className="grid grid-cols-1 gap-2 mb-6">
                                                            {item.alternatives.map((alt, i) => {
                                                                const isSelected = answer?.selectedAlternativeId === alt.id;
                                                                const isCorrect = alt.isCorrect;

                                                                let statusClass = "border-slate-200 bg-white text-slate-600";
                                                                if (isSelected && isCorrect) statusClass = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500";
                                                                else if (isSelected && !isCorrect) statusClass = "border-rose-500 bg-rose-50 text-rose-800 opacity-80";
                                                                else if (!isSelected && isCorrect) statusClass = "border-emerald-200 bg-emerald-50/50 text-emerald-700 border-dashed";

                                                                return (
                                                                    <div key={alt.id} className={`p-4 rounded-xl border-2 transition ${statusClass} flex justify-between items-center`}>
                                                                        <span className="text-sm font-medium">{String.fromCharCode(65 + i)}) {alt.text}</span>
                                                                        {isCorrect && <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />}
                                                                        {isSelected && !isCorrect && <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="mb-6 space-y-4">
                                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 italic text-slate-700 text-sm leading-relaxed">
                                                                "{answer?.essayText || "Nenhuma resposta fornecida."}"
                                                            </div>

                                                            {/* FEEDBACK HÍBRIDO (IA + PROFESSOR) */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-2xl">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Brain size={16} className="text-indigo-600" />
                                                                        <span className="text-xs font-black text-indigo-800 uppercase tracking-wider">Avaliação Primária (IA)</span>
                                                                    </div>
                                                                    <p className="text-sm text-indigo-900 leading-relaxed">
                                                                        {answer?.aiFeedback || "Aguardando processamento do Corujão..."}
                                                                    </p>
                                                                </div>

                                                                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <User size={16} className="text-amber-600" />
                                                                        <span className="text-xs font-black text-amber-800 uppercase tracking-wider">Feedback do Professor</span>
                                                                    </div>
                                                                    <p className="text-sm text-amber-900 leading-relaxed font-medium">
                                                                        {answer?.professorFeedback || "O professor ainda não revisou esta redação."}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* EXPLICAÇÃO DO CONTEÚDO */}
                                                    {item.correctAnswerJustification && (
                                                        <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100 flex gap-4">
                                                            <div className="p-2 bg-sky-200/50 rounded-lg h-fit">
                                                                <Sparkles size={20} className="text-sky-700" />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-black text-sky-800 uppercase mb-1">Dica de Estudo</div>
                                                                <p className="text-sm text-sky-900 leading-relaxed">{item.correctAnswerJustification}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-brand-dark text-white p-6 rounded-2xl shadow-xl sticky top-6">
                            <h3 className="font-black text-sm uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
                                <Star size={16} /> Resumo de Desempenho
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/10 rounded-xl border border-white/5">
                                    <div className="text-xs text-white/40 font-bold uppercase mb-1">Acertos</div>
                                    <div className="text-2xl font-black">{selectedResult.answers.filter(a => a.isCorrect).length} / {currentExam.items.length}</div>
                                </div>
                                <div className="p-4 bg-white/10 rounded-xl border border-white/5">
                                    <div className="text-xs text-white/40 font-bold uppercase mb-1">Tempo Total</div>
                                    <div className="text-2xl font-black">{Math.floor(currentExam.durationMinutes * 0.8)} min</div>
                                </div>
                            </div>

                            <button className="w-full mt-8 bg-brand-primary text-white py-4 rounded-xl font-bold hover:bg-white hover:text-brand-dark transition shadow-lg flex items-center justify-center gap-2">
                                <Brain size={20} /> Estudar com o Corujão 🦉
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-white min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-2">Portal de Revisão</h1>
                        <p className="text-slate-500 font-medium">Veja seus resultados, entenda seus erros e evolua constantemente.</p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar prova..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 ring-brand-primary transition"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredResults.map(result => {
                        const exam = exams.find(e => e.id === result.examId);
                        if (!exam) return null;

                        return (
                            <div
                                key={result.id}
                                onClick={() => setSelectedResultId(result.id)}
                                className="group bg-white border border-slate-200 p-6 rounded-2xl hover:border-brand-primary hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-brand-light transition text-slate-400 group-hover:text-brand-primary">
                                        <FileText size={24} />
                                    </div>
                                    <div className="text-2xl font-black text-slate-300 group-hover:text-brand-primary transition opacity-20 group-hover:opacity-100">
                                        {result.totalScore.toFixed(0)}
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-brand-dark transition">{exam.title}</h3>
                                <p className="text-xs text-slate-500 font-medium">{exam.subject} • Finalizada em {new Date(result.gradedAt).toLocaleDateString()}</p>

                                <div className="mt-6 flex items-center text-brand-primary font-black text-xs uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                    Ver Detalhes <ChevronRight size={14} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredResults.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
                        <FileText size={48} className="mx-auto mb-4 text-slate-200" />
                        <p className="text-slate-400 font-medium">Nenhuma prova encontrada para revisão.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
