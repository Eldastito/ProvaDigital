import React from 'react';
import { Clock, Eye } from 'lucide-react';
import { ExamResult, Exam } from '../../../../types';

interface GradesHistoryProps {
    results: ExamResult[];
    exams: Exam[];
    onSelectResult: (result: ExamResult) => void;
}

export const GradesHistory: React.FC<GradesHistoryProps> = ({ results, exams, onSelectResult }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18} /> Histórico de Provas</h3>
            <div className="space-y-3">
                {results.length === 0 && <p className="text-slate-400 text-sm">Nenhuma prova realizada ainda.</p>}
                {results.map(result => {
                    const exam = exams.find(e => e.id === result.examId);
                    return (
                        <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition">
                            <div>
                                <div className="font-bold text-slate-800">{exam?.title}</div>
                                <div className="text-xs text-slate-500">{exam?.subject} • {new Date(result.gradedAt).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => onSelectResult(result)}
                                    className="text-xs font-bold text-brand-primary bg-brand-light px-3 py-1.5 rounded-lg hover:bg-brand-secondary hover:text-white transition flex items-center gap-1"
                                >
                                    Ver Correção <Eye size={12} />
                                </button>
                                <div className={'font-bold text-lg ' + (result.totalScore >= 6 ? 'text-emerald-600' : 'text-rose-600') + ' '}>
                                    {result.totalScore.toFixed(1)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
