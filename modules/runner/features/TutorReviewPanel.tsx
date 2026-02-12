import React, { useState, useEffect } from 'react';
import { generatePostExamReview, PostExamReview } from '../../../services/geminiService';
import { StudentAnswer } from '../../../types';
import { Loader2, Brain, CheckCircle, XCircle, BookOpen } from 'lucide-react';

interface TutorReviewPanelProps {
    examTitle: string;
    studentAnswers: StudentAnswer[];
    items: any[];
}

export const TutorReviewPanel: React.FC<TutorReviewPanelProps> = ({ examTitle, studentAnswers, items }) => {
    const [reviewData, setReviewData] = useState<PostExamReview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateReview = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await generatePostExamReview(examTitle, studentAnswers);
            setReviewData(data);
        } catch (err) {
            console.error("Erro ao gerar revisão:", err);
            setError("Não foi possível conectar com o Tutor agora. Tente novamente mais tarde.");
        } finally {
            setLoading(false);
        }
    };

    if (!reviewData && !loading) {
        return (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Revisão com o Tutor IA</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    O Tutor pode analisar seus erros e explicar exatamente onde você precisa focar seus estudos.
                </p>
                <button
                    onClick={handleGenerateReview}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 mx-auto"
                >
                    <Brain size={20} />
                    Gerar Análise Pedagógica
                </button>
                {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 flex flex-col items-center justify-center">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Analisando seu desempenho...</h3>
                <p className="text-slate-500 text-sm">O Tutor está identificando padrões e preparando dicas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overall Feedback */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-6 rounded-xl border border-blue-100 dark:border-slate-700">
                <h3 className="flex items-center gap-2 text-xl font-bold text-blue-800 dark:text-blue-400 mb-3">
                    <Brain className="animate-pulse" />
                    Feedback Geral
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    "{reviewData?.overallFeedback}"
                </p>
            </div>

            {/* Recommendations */}
            {reviewData?.studyRecommendations && reviewData.studyRecommendations.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-800">
                    <h4 className="text-amber-800 dark:text-amber-400 font-bold mb-3 flex items-center gap-2">
                        <BookOpen size={18} />
                        Foco nos Estudos
                    </h4>
                    <ul className="space-y-2">
                        {reviewData.studyRecommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Mistake Analysis */}
            <div className="space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-white mb-2">Análise Detalhada dos Erros</h4>
                {reviewData?.mistakeAnalysis.map((analysis) => {
                    const questionItem = items.find(i => i.id === analysis.questionId);
                    if (!questionItem) return null;

                    return (
                        <div key={analysis.questionId} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    Questão sobre {analysis.topicToReview}
                                </div>
                                <XCircle size={20} className="text-red-500" />
                            </div>

                            <div className="text-slate-800 dark:text-slate-200 font-medium mb-3 text-sm line-clamp-2">
                                {questionItem.statement.replace(/<[^>]+>/g, '')}
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg text-sm text-red-800 dark:text-red-200">
                                <span className="font-bold block mb-1">💡 Por que errei?</span>
                                {analysis.analysis}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
