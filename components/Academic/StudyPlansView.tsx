
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, CheckSquare, Plus, BookOpen, Target, Brain, User as UserIcon, GraduationCap, ChevronRight, Sparkles, Trash2, Save, X, History, Clock, Play, Pause, RotateCcw, CheckCircle, XCircle, AlertCircle, Timer } from 'lucide-react';
import { AppState, User, UserRole, LessonPlan, StudyPlan, QuestionType } from '../../types';
import { uuidv4 } from '../../utils/helpers';
import { AnalyticsService } from '../../services/analyticsService';
import { generateStudyPlanSuggestions } from '../../services/geminiService';
import { useAppStore } from '../../store/useAppStore';

interface StudyPlansViewProps {
    state: AppState;
    user: User;
}

export const StudyPlansView = ({ state, user }: StudyPlansViewProps) => {
    // Decide which student we are acting on
    const isParent = user.role === UserRole.PAIS;
    const isStudent = user.role === UserRole.ALUNO;
    const isProfessor = user.role === UserRole.PROFESSOR;
    
    const { addStudyPlan, addLessonPlan, updateStudyPlan, selectedChildId } = useAppStore();

    // Se for aluno, é ele mesmo. Se for pai, é o filho selecionado.
    const targetStudentId = isStudent ? user.id : (isParent ? selectedChildId || user.childrenIds?.[0] || '' : '');
    const targetStudentName = state.students.find(s => s.id === targetStudentId)?.name || 'Aluno';

    const [activeTab, setActiveTab] = useState<'LESSON' | 'STUDY' | 'POMODORO' | 'SIMULATOR'>('STUDY');
    
    // Se for professor, mostra Lesson Plans por padrão
    useEffect(() => {
        if (isProfessor) setActiveTab('LESSON');
        else setActiveTab('STUDY');
    }, [isProfessor]);

    // Data
    const localLessonPlans = state.lessonPlans;
    const localStudyPlans = state.studyPlans;
    
    // Forms & Modals
    const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
    const [isStudyFormOpen, setIsStudyFormOpen] = useState(false);
    
    // Lesson Plan Form
    const [lpForm, setLpForm] = useState({ classId: '', topic: '', objectives: '', content: '' });
    
    // Study Plan Form
    const [spForm, setSpForm] = useState({ studentId: targetStudentId, title: '', newTask: '' });
    const [spTasks, setSpTasks] = useState<{id: string, description: string, completed: boolean}[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    // POMODORO STATE
    const [pomoTime, setPomoTime] = useState(25 * 60);
    const [pomoIsActive, setPomoIsActive] = useState(false);
    const [pomoMode, setPomoMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');

    // SIMULATOR STATE
    const [simStep, setSimStep] = useState<'CONFIG' | 'TAKING' | 'RESULT'>('CONFIG');
    const [simConfig, setSimConfig] = useState({ subject: '', count: 5, timeMinutes: 10 });
    const [simQuestions, setSimQuestions] = useState<any[]>([]);
    const [simCurrentQ, setSimCurrentQ] = useState(0);
    const [simAnswers, setSimAnswers] = useState<Record<string, string>>({}); // itemId -> optionId
    const [simTimeLeft, setSimTimeLeft] = useState(0);
    const [simFinished, setSimFinished] = useState(false);

    const analytics = new AnalyticsService(state);

    // --- EFFECT: POMODORO ---
    useEffect(() => {
        let interval: any = null;
        if (pomoIsActive && pomoTime > 0) {
            interval = setInterval(() => setPomoTime(t => t - 1), 1000);
        } else if (pomoTime === 0) {
            setPomoIsActive(false);
            if (pomoMode === 'FOCUS') {
                alert("Foco concluído! Hora de uma pausa.");
                setPomoMode('BREAK');
                setPomoTime(5 * 60);
            } else {
                alert("Pausa concluída! De volta aos estudos.");
                setPomoMode('FOCUS');
                setPomoTime(25 * 60);
            }
        }
        return () => clearInterval(interval);
    }, [pomoIsActive, pomoTime, pomoMode]);

    // --- EFFECT: SIMULATOR TIMER ---
    useEffect(() => {
        let interval: any = null;
        if (simStep === 'TAKING' && simTimeLeft > 0 && !simFinished) {
            interval = setInterval(() => setSimTimeLeft(t => t - 1), 1000);
        } else if (simStep === 'TAKING' && simTimeLeft === 0 && !simFinished) {
            finishSimulator();
        }
        return () => clearInterval(interval);
    }, [simStep, simTimeLeft, simFinished]);

    // --- ACTIONS ---

    const handleCreateLessonPlan = () => {
        if (!lpForm.classId || !lpForm.topic) return alert('Preencha os campos obrigatórios.');
        const newPlan: LessonPlan = {
            id: uuidv4(),
            professorId: user.id,
            classId: lpForm.classId,
            subject: 'Geral',
            topic: lpForm.topic,
            objectives: lpForm.objectives,
            content: lpForm.content,
            date: new Date().toISOString().split('T')[0]
        };
        addLessonPlan(newPlan);
        setIsLessonFormOpen(false);
        setLpForm({ classId: '', topic: '', objectives: '', content: '' });
    };

    const handleCreateStudyPlan = () => {
        const finalStudentId = isProfessor ? spForm.studentId : targetStudentId;
        if (!finalStudentId || !spForm.title || spTasks.length === 0) return alert('Dados incompletos.');
        const newPlan: StudyPlan = {
            id: uuidv4(),
            studentId: finalStudentId,
            generatedBy: isStudent || isParent ? 'IA' : user.id,
            title: spForm.title,
            tasks: spTasks,
            createdAt: new Date().toISOString()
        };
        addStudyPlan(newPlan);
        setIsStudyFormOpen(false);
        setSpForm({ studentId: isProfessor ? '' : targetStudentId, title: '', newTask: '' });
        setSpTasks([]);
    };

    const addTask = () => {
        if (!spForm.newTask) return;
        setSpTasks([...spTasks, { id: uuidv4(), description: spForm.newTask, completed: false }]);
        setSpForm({ ...spForm, newTask: '' });
    };

    const handleGenerateAI = async () => {
        const finalStudentId = isProfessor ? spForm.studentId : targetStudentId;
        if (!finalStudentId) return alert("Aluno não identificado.");
        setAiLoading(true);
        const stats = analytics.getStudentStats(finalStudentId);
        if (stats) {
            const suggestion = await generateStudyPlanSuggestions(targetStudentName, stats.weakestSubject || 'Geral', stats.averageGrade);
            setSpForm(prev => ({ ...prev, title: suggestion.title }));
            setSpTasks(suggestion.tasks.map(t => ({ id: uuidv4(), description: t, completed: false })));
        } else {
            setSpForm(prev => ({ ...prev, title: "Plano de Estudos IA" }));
            setSpTasks([{ id: uuidv4(), description: "Ler capítulo 1", completed: false }]);
        }
        setAiLoading(false);
    };

    const toggleTask = (planId: string, taskId: string) => {
        const plan = localStudyPlans.find(p => p.id === planId);
        if (!plan) return;
        const updatedPlan = {
            ...plan,
            tasks: plan.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
        updateStudyPlan(updatedPlan);
    };

    // --- SIMULATOR LOGIC ---
    const availableSubjects = useMemo(() => {
        return Array.from(new Set(state.items.map(i => i.subject)));
    }, [state.items]);

    const startSimulator = () => {
        if (!simConfig.subject) return alert("Selecione uma matéria.");
        
        // 1. Filter items
        const subjectItems = state.items.filter(i => 
            i.subject === simConfig.subject && 
            (i.type === QuestionType.MULTIPLE_CHOICE || i.type === QuestionType.TRUE_FALSE)
        );

        if (subjectItems.length === 0) return alert("Não há questões suficientes desta matéria no banco.");

        // 2. Randomize and Slice (Simulate shuffle)
        const shuffled = [...subjectItems].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, simConfig.count);

        if (selected.length === 0) return alert("Erro ao gerar questões.");

        setSimQuestions(selected);
        setSimCurrentQ(0);
        setSimAnswers({});
        setSimTimeLeft(simConfig.timeMinutes * 60);
        setSimFinished(false);
        setSimStep('TAKING');
    };

    const finishSimulator = () => {
        setSimFinished(true);
        setSimStep('RESULT');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const filteredStudyPlans = isProfessor 
        ? localStudyPlans 
        : localStudyPlans.filter(sp => sp.studentId === targetStudentId);

    // --- VIEWS ---

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                        {isProfessor ? <BookOpen className="text-brand-secondary"/> : <Target className="text-brand-secondary"/>}
                        {isProfessor ? 'Planejamento Acadêmico' : (isParent ? `Histórico de Roteiros: ${targetStudentName}` : 'Planos de Estudo & Ferramentas')}
                    </h1>
                    {isParent && <p className="text-sm text-slate-500">Acompanhe as tarefas geradas.</p>}
                </div>
                
                {/* Action Buttons */}
                {isProfessor ? (
                    activeTab === 'LESSON' ? (
                        <button onClick={() => setIsLessonFormOpen(true)} className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold">
                            <Plus size={18}/> Novo Plano de Aula
                        </button>
                    ) : (
                        <button onClick={() => setIsStudyFormOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg">
                            <Target size={18}/> Novo Roteiro p/ Aluno
                        </button>
                    )
                ) : (
                    // Student Action
                    !isParent && activeTab === 'STUDY' && (
                        <button onClick={() => setIsStudyFormOpen(true)} className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg">
                            <Sparkles size={18} className="text-yellow-300"/> Gerar Plano com IA
                        </button>
                    )
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-200">
                {isProfessor ? (
                    <>
                        <button onClick={() => setActiveTab('LESSON')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'LESSON' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                            <GraduationCap size={18}/> Planos de Aula (Turma)
                        </button>
                        <button onClick={() => setActiveTab('STUDY')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'STUDY' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}>
                            <Target size={18}/> Roteiros de Estudo (Individual)
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setActiveTab('STUDY')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'STUDY' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                            <Target size={18}/> Meus Planos
                        </button>
                        {!isParent && (
                            <>
                                <button onClick={() => setActiveTab('POMODORO')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'POMODORO' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500'}`}>
                                    <Clock size={18}/> Foco (Pomodoro)
                                </button>
                                <button onClick={() => setActiveTab('SIMULATOR')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'SIMULATOR' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>
                                    <CheckSquare size={18}/> Simulado
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* --- TOOL 1: POMODORO --- */}
            {activeTab === 'POMODORO' && !isParent && (
                <div className="flex flex-col items-center justify-center py-12 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-12 text-center w-full max-w-md relative overflow-hidden">
                        {/* Background Pulse */}
                        {pomoIsActive && (
                            <div className={`absolute inset-0 opacity-10 animate-pulse ${pomoMode === 'FOCUS' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        )}
                        
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{pomoMode === 'FOCUS' ? 'Hora de Focar!' : 'Pausa para Descanso'}</h2>
                        <p className="text-slate-500 mb-8">{pomoMode === 'FOCUS' ? 'Concentre-se em apenas uma tarefa.' : 'Relaxe, beba água e estique-se.'}</p>
                        
                        <div className={`text-7xl font-black font-mono mb-8 ${pomoMode === 'FOCUS' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatTime(pomoTime)}
                        </div>

                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={() => setPomoIsActive(!pomoIsActive)}
                                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105 ${pomoIsActive ? 'bg-amber-400 text-amber-900' : 'bg-brand-primary text-white'}`}
                            >
                                {pomoIsActive ? <Pause size={32}/> : <Play size={32} className="ml-1"/>}
                            </button>
                            <button 
                                onClick={() => { setPomoIsActive(false); setPomoTime(pomoMode==='FOCUS' ? 25*60 : 5*60); }}
                                className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
                            >
                                <RotateCcw size={24}/>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TOOL 2: SIMULATOR --- */}
            {activeTab === 'SIMULATOR' && !isParent && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                    {simStep === 'CONFIG' && (
                        <div className="p-8 max-w-lg mx-auto w-full text-center">
                            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckSquare size={40}/>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ambiente de Prova Digital</h2>
                            <p className="text-slate-500 mb-8">Treine com questões reais do banco. Escolha a matéria e o tempo.</p>
                            
                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Área de Conhecimento</label>
                                    <select className="w-full border rounded-lg p-3" value={simConfig.subject} onChange={e => setSimConfig({...simConfig, subject: e.target.value})}>
                                        <option value="">Selecione...</option>
                                        {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Qtd. Questões</label>
                                        <input type="number" className="w-full border rounded-lg p-3" value={simConfig.count} onChange={e => setSimConfig({...simConfig, count: parseInt(e.target.value)})}/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tempo (min)</label>
                                        <input type="number" className="w-full border rounded-lg p-3" value={simConfig.timeMinutes} onChange={e => setSimConfig({...simConfig, timeMinutes: parseInt(e.target.value)})}/>
                                    </div>
                                </div>
                                <button onClick={startSimulator} className="w-full btn-gradient py-4 rounded-xl font-bold text-lg shadow-lg mt-4">
                                    Iniciar Simulado
                                </button>
                            </div>
                        </div>
                    )}

                    {simStep === 'TAKING' && (
                        <div className="flex flex-col h-full">
                            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                                <div className="font-bold text-lg">Questão {simCurrentQ + 1} de {simQuestions.length}</div>
                                <div className={`flex items-center gap-2 font-mono text-xl ${simTimeLeft < 60 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                                    <Timer size={20}/> {formatTime(simTimeLeft)}
                                </div>
                            </div>
                            
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="max-w-3xl mx-auto">
                                    <div className="text-lg text-slate-800 font-medium mb-8 leading-relaxed">
                                        {simQuestions[simCurrentQ].statement}
                                    </div>
                                    <div className="space-y-3">
                                        {simQuestions[simCurrentQ].alternatives.map((alt: any, idx: number) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setSimAnswers({...simAnswers, [simQuestions[simCurrentQ].id]: alt.id})}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition ${simAnswers[simQuestions[simCurrentQ].id] === alt.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200 hover:border-slate-400'}`}
                                            >
                                                {alt.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t bg-slate-50 flex justify-between max-w-full">
                                <button 
                                    onClick={() => setSimCurrentQ(Math.max(0, simCurrentQ - 1))}
                                    disabled={simCurrentQ === 0}
                                    className="px-6 py-2 rounded-lg border bg-white disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                {simCurrentQ < simQuestions.length - 1 ? (
                                    <button 
                                        onClick={() => setSimCurrentQ(simCurrentQ + 1)}
                                        className="px-6 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                                    >
                                        Próxima
                                    </button>
                                ) : (
                                    <button 
                                        onClick={finishSimulator}
                                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                                    >
                                        Finalizar Simulado
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {simStep === 'RESULT' && (
                        <div className="p-8 flex flex-col h-full overflow-y-auto">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black text-slate-800 mb-2">Resultado do Simulado</h2>
                                <div className="inline-block bg-slate-100 rounded-full px-6 py-2 text-xl font-bold text-slate-600">
                                    Acertos: {simQuestions.filter(q => q.alternatives.find((a:any) => a.id === simAnswers[q.id])?.isCorrect).length} / {simQuestions.length}
                                </div>
                            </div>

                            <div className="space-y-6 max-w-3xl mx-auto w-full">
                                {simQuestions.map((q, idx) => {
                                    const userAnsId = simAnswers[q.id];
                                    const correctAns = q.alternatives.find((a:any) => a.isCorrect);
                                    const isCorrect = correctAns.id === userAnsId;

                                    return (
                                        <div key={q.id} className={`border-2 rounded-xl p-6 ${isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}>
                                            <div className="flex items-start gap-3 mb-4">
                                                <div className={`mt-1 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isCorrect ? <CheckCircle size={24}/> : <XCircle size={24}/>}
                                                </div>
                                                <div className="font-bold text-slate-800">{idx + 1}. {q.statement}</div>
                                            </div>

                                            <div className="pl-9 space-y-2 mb-4 text-sm">
                                                <div className="flex gap-2">
                                                    <span className="font-bold text-slate-500">Sua Resposta:</span>
                                                    <span className={isCorrect ? 'text-emerald-700' : 'text-rose-700 line-through'}>
                                                        {q.alternatives.find((a:any) => a.id === userAnsId)?.text || 'Não respondeu'}
                                                    </span>
                                                </div>
                                                {!isCorrect && (
                                                    <div className="flex gap-2">
                                                        <span className="font-bold text-slate-500">Gabarito:</span>
                                                        <span className="text-emerald-700 font-bold">{correctAns.text}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pl-9 bg-white/50 p-3 rounded-lg border border-slate-200/50">
                                                <div className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                    <AlertCircle size={12}/> Explicação Pedagógica
                                                </div>
                                                <p className="text-sm text-slate-700 italic">
                                                    {q.correctAnswerJustification || "Sem justificativa cadastrada para esta questão."}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button onClick={() => setSimStep('CONFIG')} className="mt-8 mx-auto px-8 py-3 bg-slate-800 text-white rounded-lg font-bold">
                                Novo Simulado
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* LESSON PLAN FORM (Professor Only) */}
            {isLessonFormOpen && activeTab === 'LESSON' && isProfessor && (
                <div className="bg-white p-6 rounded-xl border border-brand-primary/30 shadow-lg animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-slate-800 mb-4">Criar Plano de Aula</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Turma</label>
                            <select className="w-full border rounded-lg p-2 text-sm" value={lpForm.classId} onChange={e => setLpForm({...lpForm, classId: e.target.value})}>
                                <option value="">Selecione...</option>
                                {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Tópico</label>
                            <input className="w-full border rounded-lg p-2 text-sm" placeholder="Ex: Revolução Francesa" value={lpForm.topic} onChange={e => setLpForm({...lpForm, topic: e.target.value})}/>
                        </div>
                    </div>
                    <div className="mb-4">
                         <label className="text-xs font-bold text-slate-500 uppercase">Objetivos</label>
                         <input className="w-full border rounded-lg p-2 text-sm" placeholder="Objetivos..." value={lpForm.objectives} onChange={e => setLpForm({...lpForm, objectives: e.target.value})}/>
                    </div>
                    <div className="mb-6">
                         <label className="text-xs font-bold text-slate-500 uppercase">Conteúdo</label>
                         <textarea className="w-full border rounded-lg p-2 text-sm h-24" value={lpForm.content} onChange={e => setLpForm({...lpForm, content: e.target.value})}/>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsLessonFormOpen(false)} className="px-4 py-2 text-slate-500">Cancelar</button>
                        <button onClick={handleCreateLessonPlan} className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold">Salvar</button>
                    </div>
                </div>
            )}

            {/* STUDY PLAN FORM (Universal but adapted) */}
            {isStudyFormOpen && activeTab === 'STUDY' && !isParent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-brand-primary/20">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {aiLoading ? <Brain size={20} className="animate-pulse text-purple-600"/> : <Target size={20}/>}
                                {aiLoading ? 'IA está analisando notas...' : 'Criar Plano de Estudos'}
                            </h3>
                            <button onClick={() => setIsStudyFormOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                        </div>
                        
                        <div className="p-6">
                            {!aiLoading ? (
                                <div className="space-y-4">
                                    {/* Botão Mágico de IA */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 flex justify-between items-center">
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-900">Precisa de ajuda?</h4>
                                            <p className="text-xs text-indigo-700">A IA pode analisar {isProfessor ? 'o desempenho do aluno' : 'seu desempenho'} e sugerir tarefas.</p>
                                        </div>
                                        <button onClick={handleGenerateAI} className="bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 flex items-center gap-1">
                                            <Sparkles size={12}/> Gerar Automático
                                        </button>
                                    </div>

                                    {isProfessor && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Aluno Alvo</label>
                                            <select className="w-full border rounded-lg p-2 text-sm" value={spForm.studentId} onChange={e => setSpForm({...spForm, studentId: e.target.value})}>
                                                <option value="">Selecione...</option>
                                                {state.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Título do Plano</label>
                                        <input className="w-full border rounded-lg p-2 text-sm font-medium" placeholder="Ex: Reforço em Matemática" value={spForm.title} onChange={e => setSpForm({...spForm, title: e.target.value})}/>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Lista de Tarefas</label>
                                        <div className="space-y-2 mb-2 max-h-40 overflow-y-auto">
                                            {spTasks.map((task, i) => (
                                                <div key={task.id} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm border border-slate-100">
                                                    <span className="text-slate-700">{i+1}. {task.description}</span>
                                                    <button onClick={() => setSpTasks(spTasks.filter(t => t.id !== task.id))} className="text-slate-400 hover:text-rose-500"><Trash2 size={14}/></button>
                                                </div>
                                            ))}
                                            {spTasks.length === 0 && <p className="text-center text-slate-400 text-xs py-2">Nenhuma tarefa adicionada.</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                className="flex-1 border rounded-lg p-2 text-sm" 
                                                placeholder="Digite uma tarefa e dê Enter..." 
                                                value={spForm.newTask} 
                                                onChange={e => setSpForm({...spForm, newTask: e.target.value})} 
                                                onKeyPress={e => e.key === 'Enter' && addTask()}
                                            />
                                            <button onClick={addTask} className="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 rounded-lg font-bold text-slate-600"><Plus size={18}/></button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <Brain size={32}/>
                                    </div>
                                    <p className="text-slate-600 font-medium">Analisando desempenho escolar...</p>
                                    <p className="text-slate-400 text-xs mt-1">Identificando pontos de melhoria</p>
                                </div>
                            )}
                        </div>

                        {!aiLoading && (
                            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                                <button onClick={() => setIsStudyFormOpen(false)} className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700">Cancelar</button>
                                <button onClick={handleCreateStudyPlan} className="btn-gradient px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2">
                                    <Save size={16}/> Salvar Plano
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* LISTS */}
            {activeTab === 'LESSON' && isProfessor ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {localLessonPlans.map(plan => (
                        <div key={plan.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-brand-primary transition group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-sky-50 text-brand-primary px-2 py-1 rounded text-xs font-bold uppercase">{state.classes.find(c => c.id === plan.classId)?.name}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12}/> {new Date(plan.date).toLocaleDateString()}</div>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">{plan.topic}</h3>
                            <p className="text-sm text-slate-500 line-clamp-3">{plan.objectives}</p>
                        </div>
                    ))}
                    {localLessonPlans.length === 0 && <p className="col-span-3 text-center text-slate-400 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">Nenhum plano de aula cadastrado.</p>}
                </div>
            ) : activeTab === 'STUDY' ? (
                // STUDY PLANS LIST (Shared)
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {filteredStudyPlans.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredStudyPlans.map(plan => (
                                <div key={plan.id} className="p-6 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                {plan.title}
                                                {plan.generatedBy === 'IA' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1"><Sparkles size={10}/> IA</span>}
                                            </h3>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Criado em {new Date(plan.createdAt).toLocaleDateString()} • {plan.tasks.length} tarefas
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-emerald-600">
                                                {Math.round((plan.tasks.filter(t => t.completed).length / plan.tasks.length) * 100)}%
                                            </div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Concluído</div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                                        {plan.tasks.map(task => (
                                            <div 
                                                key={task.id} 
                                                onClick={() => toggleTask(plan.id, task.id)}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${task.completed ? 'bg-emerald-50/50 opacity-60' : 'bg-white border border-slate-200 hover:border-brand-primary'}`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                                                    {task.completed && <CheckSquare size={14}/>}
                                                </div>
                                                <span className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>{task.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center">
                            {isParent ? (
                                <>
                                    <History size={48} className="text-slate-200 mb-4"/>
                                    <p className="text-slate-500 font-medium">Nenhum histórico de roteiro encontrado.</p>
                                    <p className="text-sm text-slate-400 mt-1">Incentive seu filho a gerar um plano de estudos com a IA.</p>
                                </>
                            ) : (
                                <>
                                    <Target size={48} className="text-slate-200 mb-4"/>
                                    <p className="text-slate-500 font-medium">Nenhum plano de estudo ativo.</p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {isProfessor ? 'Crie um para orientar seus alunos.' : 'Clique em "Gerar Plano com IA" para começar.'}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};
