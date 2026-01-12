import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import {
    CheckCircle2, XCircle, Brain, Target, ArrowLeft,
    Award, BookOpen, AlertCircle, RefreshCw, BarChart
} from 'lucide-react';

export const ResultFeedbackView = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { results, exams, currentUser, items } = useAppStore();

    const result = results.find(r => r.examId === examId && r.studentId === currentUser?.id);
    const exam = exams.find(e => e.id === examId);

    if (!result || !exam) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
                <AlertCircle className="text-slate-300 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-slate-800">Resultado não encontrado</h2>
                <p className="text-slate-500 mb-6">Ainda estamos processando sua nota ou você não concluiu esta prova.</p>
                <button onClick={() => navigate('/online-exam')} className="btn-primary">
                    Voltar para Início
                </button>
            </div>
        );
    }

    const correctCount = result.answers.filter(a => a.scoreObtained > 0).length;
    const totalCount = result.answers.length;
    const percent = Math.round((correctCount / totalCount) * 100);

    return (
        <div className="min-h-screen bg-slate-50 pb-12 animate-in fade-in">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/online-exam')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                        >
                            <ArrowLeft size={24} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
                            <p className="text-sm text-slate-500">Relatório Pedagógico Individual</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sua Nota Final</div>
                            <div className="text-3xl font-black text-brand-primary">{result.totalScore.toFixed(1)}</div>
                        </div>
                        <div className={`p-4 rounded-2xl ${percent >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            <Award size={40} />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <Target className="text-blue-500" size={20} />
                            <span className="text-sm font-bold text-slate-700">Aproveitamento</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900">{percent}%</div>
                        <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${percent >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="text-emerald-500" size={20} />
                            <span className="text-sm font-bold text-slate-700">Acertos</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900">{correctCount} <span className="text-lg text-slate-300">/ {totalCount}</span></div>
                        <p className="text-xs text-slate-400 mt-2">Questões objetivas</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <RefreshCw className="text-indigo-500" size={20} />
                            <span className="text-sm font-bold text-slate-700">Violações</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900">{result.violationCount || 0}</div>
                        <p className="text-xs text-slate-400 mt-2 text-rose-500 font-bold">Monitoramento Antifraude</p>
                    </div>
                </div>

                {/* AI Pedagogical Feedback */}
                <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                    <Brain className="absolute -bottom-4 -right-4 opacity-10" size={200} />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 bg-indigo-500/30 w-fit px-3 py-1 rounded-full border border-indigo-400/30">
                            <Brain size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Feedback da IA Tutor</span>
                        </div>
                        <h2 className="text-xl font-bold mb-4">Análise de Carga Cognitiva e Gap de Aprendizagem</h2>
                        <div className="text-indigo-50 leading-relaxed bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                            {result.pedagogicalFeedback || "Análise em processamento... Em alguns instantes seu tutor IA terminará o relatório detalhado."}
                        </div>
                    </div>
                </div>

                {/* Suggestions / Subject Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <BarChart size={18} /> Detalhamento por Competência
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {Array.from(new Set(exam.items.map(config => {
                            const item = items.find(i => i.id === config.itemId);
                            return item?.subject;
                        }).filter(Boolean))).map(subject => {
                            const subjectAnswers = result.answers.filter(a => {
                                const item = items.find(i => i.id === a.itemId);
                                return item?.subject === subject;
                            });
                            const subjCorrect = subjectAnswers.filter(a => a.scoreObtained > 0).length;
                            const subjTotal = subjectAnswers.length;
                            const subjPercent = Math.round((subjCorrect / subjTotal) * 100);

                            return (
                                <div key={subject as string} className="px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${subjPercent >= 60 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <span className="text-sm font-bold text-slate-700">{subject as string}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-slate-400">{subjCorrect} / {subjTotal}</span>
                                        <span className={`text-sm font-black ${subjPercent >= 60 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {subjPercent}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Review Action */}
                <div className="flex justify-center">
                    <button
                        onClick={() => navigate('/online-exam')}
                        className="btn-primary px-12 py-4 rounded-2xl flex items-center gap-3"
                    >
                        <BookOpen size={20} /> Concluir e Sair
                    </button>
                </div>
            </main>
        </div>
    );
};
