
import React from 'react';
import { X, CheckCircle, XCircle, AlertCircle, FileText, PieChart } from 'lucide-react';
import { Exam, Item, QuestionType } from '../../types';
import { Badge } from '../../components/ui/Badge';

interface ExamDetailsModalProps {
    exam: Exam;
    items: Item[]; // Full items list to resolve details
    onClose: () => void;
}

export const ExamDetailsModal = ({ exam, items: allItems, onClose }: ExamDetailsModalProps) => {
    // Resolve full item details from IDs
    const examQuestions = exam.items.map(config => {
        const item = allItems.find(i => i.id === config.itemId);
        return item ? { ...item, config } : null;
    }).filter(i => i !== null) as (Item & { config: any })[];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge color={exam.status === 'ACTIVE' ? 'green' : 'gray'}>{exam.status}</Badge>
                            <span className="text-sm text-slate-500 font-mono">{exam.durationMinutes} min</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">{exam.title}</h2>
                        <p className="text-slate-500 text-sm mt-1">{exam.description || 'Sem descrição definida.'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">

                    {/* Stats Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                {examQuestions.length}
                            </div>
                            <div>
                                <p className="text-xs uppercase font-bold text-blue-400">Total de Questões</p>
                                <p className="text-sm font-medium text-blue-900">Configurada na Prova</p>
                            </div>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xs uppercase font-bold text-purple-400">Assunto Principal</p>
                                <p className="text-sm font-medium text-purple-900">{exam.subject}</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                <PieChart size={20} />
                            </div>
                            <div>
                                <p className="text-xs uppercase font-bold text-amber-400">Modelo</p>
                                <p className="text-sm font-medium text-amber-900">{exam.model}</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mt-4">
                        <FileText size={20} className="text-brand-primary" />
                        Gabarito & Justificativas
                    </h3>

                    <div className="space-y-4">
                        {examQuestions.map((q, idx) => (
                            <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded text-sm">Questão {idx + 1}</span>
                                    <div className="flex gap-2">
                                        <Badge color={q.difficulty === 'FACIL' ? 'green' : q.difficulty === 'MEDIO' ? 'yellow' : 'red'}>{q.difficulty}</Badge>
                                        <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border">Score: {q.config.customScore || q.score}</span>
                                    </div>
                                </div>

                                <p className="text-slate-800 font-medium text-lg leading-relaxed mb-6">{q.statement}</p>

                                {/* Alternatives / Answer Key */}
                                {q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE ? (
                                    <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                                        {q.alternatives.map((alt, i) => (
                                            <div
                                                key={alt.id}
                                                className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${alt.isCorrect
                                                    ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                                    : 'bg-white border-transparent text-slate-400 opacity-60' // Dim incorrect ones to focus on the breakdown
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${alt.isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-slate-200'}`}>
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                                <span className={`text-sm ${alt.isCorrect ? 'font-bold text-emerald-800' : ''}`}>{alt.text}</span>
                                                {alt.isCorrect && <CheckCircle size={16} className="text-emerald-500 ml-auto" />}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Resposta Esperada (Discursiva)</p>
                                        <p className="text-gray-600 italic text-sm">Esta questão requer avaliação manual ou por IA baseada nos critérios de correção.</p>
                                    </div>
                                )}

                                {/* Justification / Explanation */}
                                {q.correctAnswerJustification && (
                                    <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-blue-700 mb-2">
                                            <AlertCircle size={16} /> Explicação / Justificativa
                                        </h4>
                                        <p className="text-sm text-blue-900 leading-relaxed">
                                            {q.correctAnswerJustification}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};
