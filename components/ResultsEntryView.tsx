
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Wand2, CheckSquare, Brain, Loader2 } from 'lucide-react';
import { AppState, Exam, ExamResult, StudentAnswer, QuestionType } from '../types';
import { uuidv4 } from '../utils/helpers';
import { gradeEssayAnswer } from '../services/geminiService';

interface ResultsEntryViewProps {
    state: AppState;
    examId: string;
    onBack: () => void;
    onSaveResults: (results: ExamResult[]) => void;
}

export const ResultsEntryView = ({ state, examId, onBack, onSaveResults }: ResultsEntryViewProps) => {
    const exam = state.exams.find(e => e.id === examId);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [localResults, setLocalResults] = useState<Record<string, Record<string, string>>>({}); 
    const [saving, setSaving] = useState(false);
    const [gradingLoading, setGradingLoading] = useState<string | null>(null); // ItemId being graded

    if (!exam) return <div>Prova não encontrada.</div>;

    const examItems = exam.items.map(config => {
        const originalItem = state.items.find(i => i.id === config.itemId);
        return originalItem ? { ...originalItem, ...config } : null;
    }).filter(Boolean) as any[];

    const allocatedClasses = state.classes.filter(c => exam.classIds.includes(c.id));
    const students = state.students.filter(s => s.classId === selectedClassId);
    
    const autoGradedCount = examItems.filter(i => i.type !== QuestionType.ESSAY).length;
    const manualGradedCount = examItems.length - autoGradedCount;

    useEffect(() => {
        if (allocatedClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(allocatedClasses[0].id);
        }
    }, [allocatedClasses]);

    useEffect(() => {
        const resultsMap: Record<string, Record<string, string>> = {};
        students.forEach(student => {
            const existingResult = state.results.find(r => r.examId === examId && r.studentId === student.id);
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
                                     resultsMap[student.id][ans.itemId] = item.alternatives[altIndex].text.charAt(0);
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
    }, [selectedClassId, state.results]);

    const handleInputChange = (studentId: string, item: any, value: string) => {
        // ... same validation logic ...
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
        // Mock: In real life, we would have the student's essay text. 
        // For this MVP entry view, we assume the professor is reading the paper and wants AI to suggest score.
        // Or, if we had online submission text, we would use that.
        // Let's Simulate a student answer for the demo based on the student's name (random quality).
        
        setGradingLoading(`${studentId}-${item.id}`);
        const mockStudentAnswer = studentId.includes('1') 
            ? "A resposta é correta porque o contexto histórico..." // Good answer
            : "Não sei, acho que foi por causa da guerra."; // Bad answer
            
        const result = await gradeEssayAnswer(
            item.statement, 
            item.correctAnswerJustification || "Resposta deve conter X e Y.",
            mockStudentAnswer,
            item.customScore || item.score
        );

        setLocalResults(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [item.id]: result.score.toFixed(1)
            }
        }));
        
        alert(`IA Sugere: ${result.score} pontos.\nFeedback: ${result.feedback}`);
        setGradingLoading(null);
    };

    const handleSave = () => {
        setSaving(true);
        const newResults: ExamResult[] = [];
        // ... same save logic as before ...
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
                } else {
                    if (entry) {
                        let index = -1;
                        if (item.type === QuestionType.TRUE_FALSE) {
                            index = entry === 'V' ? 0 : 1;
                        } else {
                            index = entry.charCodeAt(0) - 65;
                        }
                        if (index >= 0 && index < item.alternatives.length) {
                            const alt = item.alternatives[index];
                            selectedAlternativeId = alt.id;
                            isCorrect = alt.isCorrect;
                            if (isCorrect) scoreObtained = item.customScore || item.score;
                        }
                    }
                }
                totalScore += scoreObtained;
                answers.push({ itemId: item.id, selectedAlternativeId, isCorrect, scoreObtained });
            });
            const existingId = state.results.find(r => r.examId === examId && r.studentId === student.id)?.id;
            newResults.push({ id: existingId || uuidv4(), examId, studentId: student.id, answers, totalScore, gradedAt: new Date().toISOString() });
        });
        onSaveResults(newResults);
        setTimeout(() => setSaving(false), 500);
    };

    return (
        <div className="space-y-6 max-w-full mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={20} className="text-slate-600" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark">Lançamento de Resultados</h1>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            {exam.title} 
                            {autoGradedCount > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold flex items-center gap-1"><Wand2 size={10}/> {autoGradedCount} Questões Auto-corrigidas</span>}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                     <select className="border border-brand-primary rounded-lg px-3 py-2 text-sm font-medium text-white bg-brand-input" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                        {allocatedClasses.length === 0 && <option>Nenhuma turma alocada</option>}
                        {allocatedClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.series}</option>)}
                     </select>
                     <button onClick={handleSave} disabled={saving} className="btn-gradient px-6 py-2 rounded-lg flex items-center gap-2 font-bold disabled:opacity-70 shadow-md">
                        {saving ? 'Salvando...' : <><Save size={18} /> Salvar Notas</>}
                     </button>
                </div>
            </div>

            {/* Summary Banner */}
            <div className="flex gap-4">
                <div className="flex-1 bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 text-sm text-blue-800 items-center">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <div><strong>Preenchimento Rápido:</strong> Digite apenas as letras (A, B, C...) ou V/F. O sistema calcula.</div>
                </div>
                {manualGradedCount > 0 && (
                    <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg flex gap-3 text-sm text-purple-800 items-center whitespace-nowrap">
                        <Brain size={20} className="flex-shrink-0"/>
                        <strong>IA Disponível:</strong> Use o botão mágico para corrigir discursivas.
                    </div>
                )}
            </div>

            {students.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-4 w-64 sticky left-0 bg-slate-50 z-20 border-r border-slate-200">Aluno</th>
                                {examItems.map((item, idx) => (
                                    <th key={item.id} className="px-2 py-4 text-center w-24 min-w-[100px] border-r border-slate-100 group relative">
                                        <div className="flex flex-col items-center">
                                            <span>Q{idx + 1}</span>
                                            <div className="flex items-center gap-1">
                                                 <span className="text-[10px] text-slate-400 font-normal">{item.type === QuestionType.ESSAY ? 'Disc.' : 'Obj.'}</span>
                                            </div>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-4 text-center w-24 sticky right-0 bg-slate-50 border-l border-slate-200">Nota</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map(student => {
                                // ... calculate totals ...
                                const studentScore = localResults[student.id] ? Object.keys(localResults[student.id]).reduce((acc, itemId) => { const val = localResults[student.id][itemId]; const item = examItems.find(i => i.id === itemId); if (!item) return acc; if (item.type === QuestionType.ESSAY) { return acc + (parseFloat(val) || 0); } else { let idx = -1; if (item.type === QuestionType.TRUE_FALSE) idx = val === 'V' ? 0 : val === 'F' ? 1 : -1; else idx = val ? val.charCodeAt(0) - 65 : -1; if (idx >= 0 && item.alternatives[idx]?.isCorrect) { return acc + (item.customScore || item.score); } } return acc; }, 0) : 0;
                                const maxScore = examItems.reduce((acc, i) => acc + (i.customScore || i.score), 0);
                                const percentage = maxScore > 0 ? Math.round((studentScore / maxScore) * 100) : 0;

                                return (
                                    <tr key={student.id} className="hover:bg-slate-50 group">
                                        <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10">
                                            <div className="truncate w-56">{student.name}</div>
                                        </td>
                                        {examItems.map((item) => {
                                            const val = localResults[student.id]?.[item.id] || '';
                                            const isLoading = gradingLoading === `${student.id}-${item.id}`;

                                            if (item.type === QuestionType.ESSAY) {
                                                return (
                                                    <td key={item.id} className="px-2 py-3 text-center border-r border-slate-100 relative">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <input 
                                                                type="number"
                                                                className={`w-12 h-8 text-center border rounded text-sm font-bold ${val ? "bg-brand-input text-white border-brand-secondary" : "border-slate-300"}`}
                                                                value={val}
                                                                onChange={(e) => handleInputChange(student.id, item, e.target.value)}
                                                            />
                                                            <button 
                                                                onClick={() => handleMagicGrade(student.id, item)}
                                                                disabled={isLoading}
                                                                className="p-1 text-purple-500 hover:bg-purple-50 rounded" 
                                                                title="Corrigir com IA"
                                                            >
                                                                {isLoading ? <Loader2 size={14} className="animate-spin"/> : <Brain size={14}/>}
                                                            </button>
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            
                                            // ... MC/VF Logic ...
                                            let inputClass = "text-center border rounded w-8 h-8 uppercase ";
                                            // (omitted standard coloring logic for brevity)
                                            if (val === '') inputClass += "border-slate-300 bg-brand-input text-white";
                                            else inputClass += "border-brand-primary bg-brand-primary text-white font-bold"; 

                                            return (
                                                <td key={item.id} className="px-2 py-3 text-center border-r border-slate-100">
                                                    <input 
                                                        type="text" maxLength={1} className={inputClass}
                                                        value={val} onChange={(e) => handleInputChange(student.id, item, e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-center font-bold text-slate-800 sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200">
                                            <div className={`text-lg ${percentage >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>{studentScore.toFixed(1)}</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
