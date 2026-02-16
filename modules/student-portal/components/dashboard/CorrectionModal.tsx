import React from 'react';
import { FileText, X, Brain, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Exam, ExamResult, QuestionType, Item } from '../../../../types';
import { GradeResultEssayCard } from '../../../grading/components/GradeResultEssayCard';

interface CorrectionModalProps {
    selectedResult: ExamResult | null;
    onClose: () => void;
    exams: Exam[];
    items: Item[];
    isEnabled: (feature: string) => boolean;
    setOwlTutorContext: (context: any) => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
    selectedResult,
    onClose,
    exams,
    items,
    isEnabled,
    setOwlTutorContext
}) => {
    const navigate = useNavigate();

    if (!selectedResult) return null;
    const exam = exams.find(e => e.id === selectedResult.examId);
    if (!exam) return null;

    // Helper to find student name - In real app, this might come from context or prop
    // For now assuming we are viewing current user's result or child's result
    // We can omit student name or pass it as prop if essential.
    // Simplifying to just show "Correção"

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><FileText size={20} /> Correção: {exam.title}</h3>
                        <p className="text-xs text-slate-500">Nota Final: <strong className="text-brand-primary text-sm">{selectedResult.totalScore.toFixed(1)}</strong></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
                    <div className="bg-white shadow-sm p-8 max-w-2xl mx-auto min-h-full">
                        <div className="text-center border-b pb-6 mb-6">
                            <h1 className="text-2xl font-bold uppercase tracking-wide">{exam.title}</h1>
                            <div className="flex justify-center gap-4 text-sm text-slate-500 mt-2">
                                <span>Data: {new Date(selectedResult.gradedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="space-y-8">
                            {exam.items.map((conf, idx) => {
                                const item = items.find(i => i.id === conf.itemId);
                                const answer = selectedResult.answers.find(a => a.itemId === conf.itemId);
                                if (!item) return null;

                                return (
                                    <div key={item.id} className={"p-4 border rounded-lg " + (answer?.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30')}>
                                        <div className="flex gap-3 mb-2">
                                            <span className="font-bold text-slate-700">{idx + 1}.</span>
                                            <div className="flex-1 font-medium text-slate-800">{item.statement}</div>
                                            <div className="font-bold text-xs">
                                                {answer?.scoreObtained}/{conf.customScore || item.score} pts
                                            </div>
                                        </div>

                                        {item.type !== QuestionType.ESSAY ? (
                                            <div className="pl-7 space-y-1">
                                                {item.alternatives.map((alt, i) => {
                                                    const isSelected = answer?.selectedAlternativeId === alt.id;
                                                    const isKey = alt.isCorrect;

                                                    let rowClass = "text-sm p-1 rounded flex justify-between ";
                                                    if (isSelected && isKey) rowClass += "bg-emerald-100 text-emerald-800 font-bold";
                                                    else if (isSelected && !isKey) rowClass += "bg-rose-100 text-rose-800 font-bold line-through decoration-rose-500";
                                                    else if (!isSelected && isKey) rowClass += "bg-sky-50 text-sky-700 font-bold border border-sky-200";
                                                    else rowClass += "text-slate-500";

                                                    return (
                                                        <div key={i} className={rowClass}>
                                                            <span>{String.fromCharCode(97 + i)}) {alt.text}</span>
                                                            {isKey && <Check size={14} className="text-emerald-600" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="pl-7 mt-2">
                                                <div className="mt-4">
                                                    <GradeResultEssayCard
                                                        text={answer?.essayText || answer?.text || ''}
                                                        correction={answer?.essayCorrection}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* AI JUSTIFICATION */}
                                        {item.correctAnswerJustification && (
                                            <div className="mt-3 pl-7 bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Brain size={14} className="text-blue-600" />
                                                    <span className="text-xs font-bold text-blue-800 uppercase">Por que esta é a resposta correta?</span>
                                                </div>
                                                <p className="text-sm text-blue-900 leading-relaxed">
                                                    {item.correctAnswerJustification}
                                                </p>
                                            </div>
                                        )}

                                        {/* --- EXPLAIN ERROR BUTTON --- */}
                                        {!answer?.isCorrect && isEnabled('AI_TUTOR') && (
                                            <div className="mt-3 pl-7">
                                                <button
                                                    onClick={() => {
                                                        const contextData = 'Questão: "' + item.statement + '"\n' +
                                                            'Alternativas: ' + item.alternatives.map(a => a.text).join(' | ') + '\n' +
                                                            'Resposta do Aluno: ' + (item.alternatives.find(a => a.id === answer?.selectedAlternativeId)?.text || 'Sem resposta') + '\n' +
                                                            'Gabarito: ' + (item.alternatives.find(a => a.isCorrect)?.text || '') + '\n' +
                                                            'Justificativa: ' + (item.correctAnswerJustification || '');

                                                        setOwlTutorContext({
                                                            initialMessage: 'Olá Corujão! Errei a questão "' + item.statement.substring(0, 30) + '...".Pode me explicar por que a resposta correta é a certa ? ',
                                                            contextData: contextData,
                                                            examId: exam.id
                                                        });

                                                        onClose();
                                                        console.log("Navigating to Tutor...");
                                                        navigate('/aluno/tutor');
                                                    }}
                                                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition flex items-center gap-2"
                                                >
                                                    <Sparkles size={14} /> Me explique este erro, Corujão! 🦉
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
