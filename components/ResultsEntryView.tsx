
import React, { useState, useEffect } from 'react';
// @-fix: Added 'Users' to the lucide-react imports.
import { ArrowLeft, Save, CheckCircle, AlertCircle, Wand2, CheckSquare, Brain, Loader2, Users } from 'lucide-react';
import { AppState, Exam, ExamResult, StudentAnswer, QuestionType, Item, SchoolClass, Student } from '../types';
import { uuidv4 } from '../utils/helpers';
import { gradeEssayAnswer } from '../services/geminiService';
import { useAppStore } from '../store/useAppStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchExams, fetchItems, fetchResults, fetchClasses, fetchStudents, upsertResults } from '../services/supabaseClient';

interface ResultsEntryViewProps {
    state: AppState;
    examId: string;
    onBack: () => void;
    onSaveResults: (results: ExamResult[]) => void;
}

export const ResultsEntryView = ({ state, examId, onBack, onSaveResults }: ResultsEntryViewProps) => {
    const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams });
    const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({ queryKey: ['items'], queryFn: fetchItems });
    const { data: allResults, isLoading: resultsLoading } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults });
    const { data: classes } = useQuery<SchoolClass[]>({ queryKey: ['classes'], queryFn: fetchClasses });
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents });

    const exam = exams?.find(e => e.id === examId);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [localResults, setLocalResults] = useState<Record<string, Record<string, string>>>({}); 
    const [gradingLoading, setGradingLoading] = useState<string | null>(null);

    const examItems = React.useMemo(() => {
        if (!exam || !items) return [];
        return exam.items.map(config => {
            const originalItem = items.find(i => i.id === config.itemId);
            return originalItem ? { ...originalItem, ...config } : null;
        }).filter((i): i is any => i !== null);
    }, [exam, items]);

    const allocatedClasses = classes?.filter(c => exam?.classIds.includes(c.id)) || [];
    const students = allStudents?.filter(s => s.classId === selectedClassId) || [];
    
    const maxScore = React.useMemo(() => examItems.reduce((acc, i) => acc + (i.customScore || i.score || 0), 0), [examItems]);

    useEffect(() => {
        if (allocatedClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(allocatedClasses[0].id);
        }
    }, [allocatedClasses]);

    useEffect(() => {
        if (!students.length || !allResults) return;

        const resultsMap: Record<string, Record<string, string>> = {};
        students.forEach(student => {
            const existingResult = allResults.find(r => r.examId === examId && r.studentId === student.id);
            if (existingResult) {
                resultsMap[student.id] = {};
                existingResult.answers.forEach(ans => {
                    const item = examItems.find(i => i.id === ans.itemId);
                    if (item) {
                        if (item.type === QuestionType.ESSAY) {
                             resultsMap[student.id][ans.itemId] = ans.scoreObtained.toString();
                        } else {
                             const altIndex = item.alternatives.findIndex((a: any) => a.id === ans.selectedAlternativeId);
                             if (altIndex >= 0) {
                                 if (item.type === QuestionType.TRUE_FALSE) {
                                     resultsMap[student.id][ans.itemId] = item.alternatives[altIndex].text.charAt(0).toUpperCase();
                                 } else {
                                     resultsMap[student.id][ans.itemId] = String.fromCharCode(65 + altIndex);
                                 }
                             }
                        }
                    }
                });
            }
        });
        setLocalResults(prev => ({...prev, ...resultsMap}));
    }, [selectedClassId, allResults, students, examItems, examId]);

    const handleInputChange = (studentId: string, item: any, value: string) => {
        let cleanVal = value;
        if (item.type === QuestionType.MULTIPLE_CHOICE) {
            cleanVal = value.toUpperCase().slice(0, 1);
            if (!['A', 'B', 'C', 'D', 'E', ''].includes(cleanVal)) return;
        } else if (item.type === QuestionType.TRUE_FALSE) {
            cleanVal = value.toUpperCase().slice(0, 1);
            if (!['V', 'F', ''].includes(cleanVal)) return;
        }
        setLocalResults(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [item.id]: cleanVal } }));
    };

    const handleMagicGrade = async (studentId: string, item: any) => {
        setGradingLoading(`${studentId}-${item.id}`);
        const mockStudentAnswer = "Resposta simulada para correção automática via IA ExamePad.";
            
        const result = await gradeEssayAnswer(
            item.statement, 
            item.correctAnswerJustification || "Resposta esperada não definida.",
            mockStudentAnswer,
            item.customScore || item.score || 1
        );

        setLocalResults(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [item.id]: result.score.toFixed(1)
            }
        }));
        setGradingLoading(null);
    };

    const saveResultsMutation = useMutation({
        mutationFn: upsertResults,
        onSuccess: () => {
            alert('Notas salvas com sucesso!');
            onSaveResults([]); 
        },
        onError: (error) => {
            console.error("Erro ao salvar notas:", error);
            alert("Não foi possível salvar as notas.");
        }
    });

    const handleSave = () => {
        const newResults: ExamResult[] = [];
        students.forEach(student => {
            const studentAnswersMap = localResults[student.id] || {};
            let totalScore = 0;
            const answers: StudentAnswer[] = [];

            examItems.forEach(item => {
                const entry = studentAnswersMap[item.id];
                let selectedAlternativeId = null;
                let isCorrect = false;
                let scoreObtained = 0;

                if (item.type === QuestionType.ESSAY) {
                    scoreObtained = parseFloat(entry) || 0;
                    isCorrect = scoreObtained > 0; 
                } else if (entry) {
                    let index = -1;
                    if (item.type === QuestionType.TRUE_FALSE) {
                        index = entry === 'V' ? 0 : (entry === 'F' ? 1 : -1);
                    } else {
                        index = entry.charCodeAt(0) - 65;
                    }
                    if (index >= 0 && index < item.alternatives.length) {
                        const alt = item.alternatives[index];
                        selectedAlternativeId = alt.id;
                        isCorrect = alt.isCorrect;
                        if (isCorrect) scoreObtained = item.customScore || item.score || 1;
                    }
                }
                totalScore += scoreObtained;
                answers.push({ itemId: item.id, selectedAlternativeId, isCorrect, scoreObtained });
            });
            const existingId = allResults?.find(r => r.examId === examId && r.studentId === student.id)?.id;
            newResults.push({ id: existingId || uuidv4(), examId, studentId: student.id, answers, totalScore, gradedAt: new Date().toISOString() });
        });
        saveResultsMutation.mutate(newResults);
    };

    if (examsLoading || itemsLoading || resultsLoading) return <div className="p-8 text-center text-slate-500">Carregando resultados...</div>;
    if (!exam) return <div className="p-12 text-center text-rose-500 font-bold">Prova não encontrada.</div>;

    return (
        <div className="space-y-6 max-w-full mx-auto pb-12 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition bg-white/10 text-slate-700"><ArrowLeft size={20}/></button>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark">{exam.title}</h1>
                        <p className="text-slate-500 text-sm">Lançamento manual e assistido por IA</p>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                     <select className="border-2 border-brand-primary/20 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 bg-white outline-none focus:border-brand-primary" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                        {allocatedClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.series}</option>)}
                        {allocatedClasses.length === 0 && <option value="">Nenhuma turma alocada</option>}
                     </select>
                     <button onClick={handleSave} disabled={saveResultsMutation.isPending} className="btn-gradient px-6 py-2 rounded-xl flex items-center gap-2 font-bold disabled:opacity-50 shadow-lg">
                        {saveResultsMutation.isPending ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />} 
                        {saveResultsMutation.isPending ? 'Salvando...' : 'Salvar Notas'}
                     </button>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
                <div className="flex-1 min-w-[300px] bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 text-sm text-blue-800 items-center">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <div><strong>Preenchimento Rápido:</strong> Digite a letra da alternativa ou V/F. O sistema computa a nota automaticamente.</div>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex gap-3 text-sm text-purple-800 items-center whitespace-nowrap">
                    <Brain size={20} className="flex-shrink-0 text-purple-500"/>
                    <strong>IA Ativa:</strong> Clique no ícone do cérebro para avaliar discursivas.
                </div>
            </div>

            {students.length > 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-20">
                            <tr>
                                <th className="px-6 py-5 w-64 sticky left-0 bg-slate-50 z-30 border-r border-slate-200">Nome do Aluno</th>
                                {examItems.map((item, idx) => (
                                    <th key={item.id} className="px-2 py-5 text-center w-24 min-w-[100px] border-r border-slate-100">
                                        <div className="flex flex-col items-center">
                                            <span className="text-brand-primary">Q{idx + 1}</span>
                                            <span className="text-[10px] text-slate-400 font-black uppercase">{(item.customScore || item.score || 0).toFixed(1)} pts</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-5 text-center w-24 sticky right-0 bg-slate-50 border-l border-slate-200 z-30">Nota Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map(student => {
                                const studentResults = localResults[student.id] || {};
                                let studentScore = 0;
                                
                                examItems.forEach(item => {
                                    const val = studentResults[item.id];
                                    if (!val) return;
                                    if (item.type === QuestionType.ESSAY) {
                                        studentScore += parseFloat(val) || 0;
                                    } else {
                                        let idx = -1;
                                        if (item.type === QuestionType.TRUE_FALSE) idx = val === 'V' ? 0 : (val === 'F' ? 1 : -1);
                                        else idx = val.charCodeAt(0) - 65;
                                        if (idx >= 0 && item.alternatives[idx]?.isCorrect) {
                                            studentScore += (item.customScore || item.score || 0);
                                        }
                                    }
                                });

                                const percentage = maxScore > 0 ? (studentScore / maxScore) * 100 : 0;

                                return (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10">
                                            <div className="truncate w-56">{student.name}</div>
                                        </td>
                                        {examItems.map((item) => {
                                            const val = studentResults[item.id] || '';
                                            const isLoading = gradingLoading === `${student.id}-${item.id}`;

                                            return (
                                                <td key={item.id} className="px-2 py-4 text-center border-r border-slate-100">
                                                    {item.type === QuestionType.ESSAY ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <input 
                                                                type="number" step="0.1" min="0" max={item.customScore || item.score}
                                                                className={`w-14 h-9 text-center border-2 rounded-xl text-sm font-black transition-all ${val ? "bg-brand-dark text-white border-brand-primary" : "border-slate-200 bg-slate-50 text-slate-400"}`}
                                                                value={val}
                                                                onChange={(e) => handleInputChange(student.id, item, e.target.value)}
                                                            />
                                                            <button onClick={() => handleMagicGrade(student.id, item)} disabled={isLoading} className="p-1.5 text-purple-500 hover:bg-purple-100 rounded-lg transition-colors">
                                                                {isLoading ? <Loader2 size={16} className="animate-spin"/> : <Brain size={16}/>}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <input 
                                                            type="text" maxLength={1} 
                                                            className={`w-10 h-10 text-center border-2 rounded-xl text-sm font-black uppercase transition-all ${val ? "bg-brand-primary text-white border-brand-primary" : "border-slate-200 bg-slate-50 text-slate-400"}`}
                                                            value={val} onChange={(e) => handleInputChange(student.id, item, e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200 z-10">
                                            <div className={`text-xl font-black ${percentage >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {studentScore.toFixed(1)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-300">
                    <Users size={64} className="mx-auto mb-4 text-slate-200"/>
                    <p className="text-slate-400 font-bold">Nenhum aluno encontrado para esta turma.</p>
                </div>
            )}
        </div>
    );
};
