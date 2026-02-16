import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Wand2, CheckSquare, Brain, Loader2, Shield, X } from 'lucide-react';
import { AppState, Exam, ExamResult, StudentAnswer, QuestionType } from '../../types';
import { uuidv4 } from '../../utils/helpers';
import { gradeEssayAnswer, batchGradeAnswers } from '../../services/geminiService';

import { useNavigate, useParams } from 'react-router-dom';
import { useSafeAppStore } from '../../store/useAppStore';

import { EssayGradingModal } from './EssayGradingModal';

export const ResultsEntryView = () => {
    const { id: examId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const state = useSafeAppStore();
    const { updateResults: onSaveResults } = state;

    const onBack = () => navigate(-1);
    const exam = state.exams.find(e => e.id === examId);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [localResults, setLocalResults] = useState<Record<string, Record<string, string>>>({});
    const [saving, setSaving] = useState(false);
    const [gradingLoading, setGradingLoading] = useState<string | null>(null); // ItemId being graded
    const [bulkGrading, setBulkGrading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, { score: number, feedback: string, fullCorrection?: any }>>({});

    // --- ESSAY MODAL STATE ---
    const [essayModalOpen, setEssayModalOpen] = useState(false);
    const [currentEssay, setCurrentEssay] = useState<{
        studentId: string;
        studentName: string;
        item: any;
        text: string;
    } | null>(null);

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
                            if (ans.essayText) {
                                resultsMap[student.id][`${ans.itemId}_text`] = ans.essayText;
                            }
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
        setLocalResults(prev => ({ ...prev, ...resultsMap }));
    }, [selectedClassId, state.results]);

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

    const handleOpenEssayModal = (studentId: string, studentName: string, item: any) => {
        const text = localResults[studentId]?.[`${item.id}_text`] || '';
        setCurrentEssay({
            studentId,
            studentName,
            item,
            text
        });
        setEssayModalOpen(true);
    };

    const handleSaveEssayCorrection = (score: number, feedback: string, fullCorrection: any) => {
        if (!currentEssay) return;

        // Update local results with Score
        handleInputChange(currentEssay.studentId, currentEssay.item, score.toString());

        // Save feedback and full correction
        setAiSuggestions(prev => ({
            ...prev,
            [`${currentEssay.studentId}-${currentEssay.item.id}`]: {
                score,
                feedback,
                fullCorrection
            }
        }));
    };

    const handleMagicGrade = async (studentId: string, item: any) => {
        setGradingLoading(`${studentId}-${item.id}`);

        const transcribedText = localResults[studentId]?.[`${item.id}_text`];
        const studentAnswerText = transcribedText && transcribedText.length > 5
            ? transcribedText
            : (studentId.includes('1')
                ? "A resposta é correta porque o contexto histórico..." // Good answer
                : "Não sei, acho que foi por causa da guerra."); // Bad answer

        const result = await gradeEssayAnswer(
            item.statement,
            item.correctAnswerJustification || "Resposta deve conter X e Y.",
            studentAnswerText,
            item.customScore || item.score
        );

        setAiSuggestions(prev => ({
            ...prev,
            [`${studentId}-${item.id}`]: {
                score: result.score,
                feedback: result.feedback
            }
        }));

        setGradingLoading(null);
    };

    // NOVO: Correção em Lote com IA (Otimizado)
    const handleBulkAIGrading = async () => {
        const essayItems = examItems.filter(item => item.type === QuestionType.ESSAY);
        if (essayItems.length === 0) {
            alert('Nenhuma questão discursiva.');
            return;
        }

        // 1. Identificar o que precisa ser corrigido
        const pendingContexts: any[] = [];

        students.forEach(student => {
            essayItems.forEach(item => {
                // Se já tem nota (>0), pula
                const existingScore = localResults[student.id]?.[item.id];
                if (existingScore && parseFloat(existingScore) > 0) return;

                // Texto da resposta (Transcreve ou usa Mock se vazio)
                const transcribedText = localResults[student.id]?.[`${item.id}_text`];
                const studentAnswerText = transcribedText && transcribedText.length > 5
                    ? transcribedText
                    : "Sem resposta.";

                pendingContexts.push({
                    id: `${student.id}:::${item.id}`, // ID Composto para mapear volta
                    question: item.statement,
                    expectedAnswer: item.correctAnswerJustification || "Resposta coerente.",
                    studentAnswer: studentAnswerText,
                    maxScore: item.customScore || item.score
                });
            });
        });

        if (pendingContexts.length === 0) {
            alert("Todas as questões já estão corrigidas!");
            return;
        }

        const confirmed = confirm(
            `Confirmar Correção em Lote (IA Fast)?\n\n` +
            `• ${pendingContexts.length} respostas pendentes\n` +
            `• Modo BATCH (Acelerado)\n\n` +
            `O sistema processará tudo em uma única chamada.`
        );

        if (!confirmed) return;

        setBulkGrading(true);
        setBulkProgress({ current: 0, total: pendingContexts.length });

        try {
            // 2. Chamada Única para a API
            const results = await batchGradeAnswers(pendingContexts);

            // 3. Aplicar resultados
            setAiSuggestions(prev => {
                const next = { ...prev };
                results.forEach(res => {
                    const [studentId, itemId] = res.id.split(':::');
                    next[`${studentId}-${itemId}`] = {
                        score: res.score, // batchGrade currently returns simple score/feedback. For full essay we need another batch method.
                        feedback: res.feedback
                    };
                });
                return next;
            });

            setBulkProgress({ current: pendingContexts.length, total: pendingContexts.length });
            alert(`✅ ${results.length} sugestões geradas! Revise e clique em 'Aceitar'.`);

        } catch (error) {
            console.error("Erro no Batch Grading:", error);
            alert("Houve um erro ao processar o lote. Tente novamente ou use a correção individual.");
        } finally {
            setBulkGrading(false);
        }
    };

    const handleSave = () => {
        setSaving(true);
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
                let essayText = undefined;

                if (item.type === QuestionType.ESSAY) {
                    scoreObtained = parseFloat(entry) || 0;
                    isCorrect = scoreObtained > 0;
                    essayText = studentAnswersMap[`${item.id}_text`];
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

                const answerPayload: StudentAnswer = {
                    itemId: item.id,
                    selectedAlternativeId,
                    isCorrect,
                    scoreObtained,
                    essayText
                };

                if (item.type === QuestionType.ESSAY) {
                    const suggestion = aiSuggestions[`${student.id}-${item.id}`];
                    if (suggestion && Math.abs(suggestion.score - scoreObtained) < 0.1) {
                        answerPayload.essayCorrection = suggestion.fullCorrection;
                        answerPayload.aiFeedback = suggestion.feedback;
                    }
                }

                answers.push(answerPayload);
            });
            const existingId = state.results.find(r => r.examId === examId && r.studentId === student.id)?.id;
            newResults.push({ id: existingId || uuidv4(), examId, studentId: student.id, answers, totalScore, gradedAt: new Date().toISOString() });
        });
        onSaveResults(newResults);

        setTimeout(() => setSaving(false), 500);
    };

    return (
        <div className="space-y-6 max-w-full mx-auto pb-20">
            <div className="flex items-center justify-between sticky top-0 bg-slate-50 z-20 py-4 shadow-sm px-4 -mx-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition"><ArrowLeft size={20} className="text-slate-600" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark">Lançamento de Resultados</h1>
                        <p className="text-slate-500 text-sm">{exam.title}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <select className="border border-brand-primary rounded-lg px-3 py-2 text-sm font-medium bg-white" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                        {allocatedClasses.length === 0 && <option>Nenhuma turma alocada</option>}
                        {allocatedClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.series}</option>)}
                    </select>

                    {manualGradedCount > 0 && (
                        <button
                            onClick={handleBulkAIGrading}
                            disabled={bulkGrading || saving}
                            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-purple-200 transition"
                        >
                            {bulkGrading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Corrigindo... {bulkProgress.current}/{bulkProgress.total}
                                </>
                            ) : (
                                <>
                                    <Brain size={18} />
                                    Correção em Lote (Rápida)
                                </>
                            )}
                        </button>
                    )}

                    <button onClick={handleSave} disabled={saving || bulkGrading} className="bg-brand-primary text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-brand-primary-dark shadow-lg transition">
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar</>}
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 text-sm text-blue-800 items-center">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <div><strong>Preenchimento Rápido:</strong> Digite apenas as letras (A, B, C...) ou V/F. O sistema calcula.</div>
                </div>
                {manualGradedCount > 0 && (
                    <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg flex gap-3 text-sm text-purple-800 items-center whitespace-nowrap">
                        <Brain size={20} className="flex-shrink-0" />
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
                                    <th key={item.id} className="px-2 py-4 text-center min-w-[250px] border-r border-slate-100 user-select-none">
                                        <div className="flex flex-col items-center">
                                            <span>Q{idx + 1}</span>
                                            <span className="text-[10px] text-slate-400 font-normal">{item.type === QuestionType.ESSAY ? 'Disc.' : 'Obj.'}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-4 text-center w-24 sticky right-0 bg-slate-50 border-l border-slate-200">Nota</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map(student => {
                                const studentScore = localResults[student.id] ? Object.keys(localResults[student.id]).reduce((acc, itemId) => { const val = localResults[student.id][itemId]; const item = examItems.find(i => i.id === itemId); if (!item || itemId.endsWith('_text')) return acc; if (item.type === QuestionType.ESSAY) { return acc + (parseFloat(val) || 0); } else { let idx = -1; if (item.type === QuestionType.TRUE_FALSE) idx = val === 'V' ? 0 : val === 'F' ? 1 : -1; else idx = val ? val.charCodeAt(0) - 65 : -1; if (idx >= 0 && item.alternatives[idx]?.isCorrect) { return acc + (item.customScore || item.score); } } return acc; }, 0) : 0;
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
                                                const answerText = localResults[student.id]?.[`${item.id}_text`] || '';
                                                const suggestion = aiSuggestions[`${student.id}-${item.id}`];

                                                return (
                                                    <td key={item.id} className="px-2 py-3 border-r border-slate-100 relative align-top">
                                                        <div className="flex flex-col gap-2 p-1">
                                                            <div className="relative">
                                                                <textarea
                                                                    className="w-full text-xs p-2 border border-slate-300 rounded focus:border-brand-primary placeholder:text-slate-300 resize-none h-20"
                                                                    placeholder="Transcreva a resposta do aluno aqui..."
                                                                    value={answerText}
                                                                    onChange={(e) => setLocalResults(prev => ({
                                                                        ...prev,
                                                                        [student.id]: {
                                                                            ...(prev[student.id] || {}),
                                                                            [`${item.id}_text`]: e.target.value
                                                                        }
                                                                    }))}
                                                                />
                                                                <button
                                                                    onClick={() => handleOpenEssayModal(student.id, student.name, item)}
                                                                    className="absolute bottom-2 right-2 p-1 bg-white border border-purple-200 text-purple-600 rounded-full hover:bg-purple-50 shadow-sm transition transform hover:scale-110"
                                                                    title="Abrir Corretor Avançado (Tela Cheia)"
                                                                >
                                                                    <Brain size={16} />
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center gap-2 mt-1">
                                                                <input
                                                                    type="number"
                                                                    className={`w-16 h-8 text-center border rounded font-bold ${val ? 'bg-brand-secondary text-slate-900 border-brand-secondary' : 'border-slate-300'}`}
                                                                    value={val}
                                                                    onChange={(e) => handleInputChange(student.id, item, e.target.value)}
                                                                />
                                                                <span className="text-xs text-slate-400">/ {item.customScore || item.score}</span>
                                                            </div>

                                                            {suggestion && (
                                                                <div className="mt-1 bg-purple-50 border border-purple-200 p-2 rounded text-xs animate-in fade-in slide-in-from-top-1">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="font-bold text-purple-700 flex items-center gap-1"><Brain size={10} /> IA: {suggestion.score}</span>
                                                                        <button onClick={() => handleInputChange(student.id, item, suggestion.score.toString())} className="text-[10px] bg-white border border-purple-200 hover:bg-purple-100 px-1 rounded">Aceitar</button>
                                                                    </div>
                                                                    <p className="text-purple-600 italic line-clamp-2" title={suggestion.feedback}>{suggestion.feedback}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            let inputClass = "text-center border rounded w-8 h-8 uppercase ";
                                            if (val === '') inputClass += "border-slate-300";
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

            {essayModalOpen && currentEssay && (
                <EssayGradingModal
                    isOpen={essayModalOpen}
                    onClose={() => setEssayModalOpen(false)}
                    studentName={currentEssay.studentName}
                    examTitle={exam.title}
                    questionStatement={currentEssay.item.statement}
                    motivationalText={currentEssay.item.correctAnswerJustification || "Texto de apoio não disponível."}
                    initialText={currentEssay.text}
                    onSave={handleSaveEssayCorrection}
                />
            )}
        </div>
    );
};
