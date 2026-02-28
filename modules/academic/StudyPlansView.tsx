import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, CheckSquare, Plus, BookOpen, Target, Brain, User as UserIcon, GraduationCap, ChevronRight, Sparkles, Trash2, Save, X, History, Clock, Play, Pause, RotateCcw, CheckCircle, XCircle, AlertCircle, Timer, Trophy } from 'lucide-react';
import { AppState, User, UserRole, LessonPlan, StudyPlan, QuestionType, DifficultyLevel } from '../../types';
import { uuidv4 } from '../../utils/helpers';
import { AnalyticsService } from '../../services/analyticsService';
import { generateStudyPlanSuggestions, generateLessonPlanSuggestions, LessonPlanSuggestion } from '../../services/geminiService';
import { useAppStore } from '../../store/useAppStore';
import { RichTextRenderer } from '../../components/RichTextRenderer';
import { Interactive3DViewer } from '../../components/3d/Interactive3DViewer';
import { generateQuestionsFromText } from '../../services/geminiService';

interface StudyPlansViewProps {
    state: AppState;
    user: User;
}

export const StudyPlansView = () => {
    const state = useAppStore();
    const { currentUser: user } = state;
    // Decide which student we are acting on
    const isParent = user.role === UserRole.PAIS;
    const isStudent = user.role === UserRole.ALUNO;
    const isProfessor = user.role === UserRole.PROFESSOR;

    const { addStudyPlan, addLessonPlan, updateStudyPlan, selectedChildId, updateUserProfile } = useAppStore();

    // Se for aluno, é ele mesmo. Se for pai, é o filho selecionado.
    const targetStudentId = isStudent ? user.id : (isParent ? selectedChildId || user.childrenIds?.[0] || '' : '');
    const targetStudentName = state.students.find(s => s.id === targetStudentId)?.name || 'Aluno';

    const [activeTab, setActiveTab] = useState<'LESSON' | 'STUDY' | 'POMODORO' | 'SIMULATOR' | 'CURRICULUM'>('STUDY');

    // Se for professor, mostra Curriculum por padrão para planejar o ano
    useEffect(() => {
        if (isProfessor) setActiveTab('CURRICULUM');
        else setActiveTab('STUDY');

        // Force sync items from Supabase on mount
        if (state.items.length === 0) {
            state.loadItems();
        }
        if (!state.projectionMaterials || state.projectionMaterials.length === 0) {
            state.loadProjectionMaterials();
        }
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
    const [spTasks, setSpTasks] = useState<{ id: string, description: string, completed: boolean }[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiLessonSuggestion, setAiLessonSuggestion] = useState<LessonPlanSuggestion | null>(null);

    // POMODORO STATE
    const [pomoTime, setPomoTime] = useState(25 * 60);
    const [pomoIsActive, setPomoIsActive] = useState(false);
    const [pomoMode, setPomoMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');

    // SIMULATOR STATE
    const [simStep, setSimStep] = useState<'CONFIG' | 'TAKING' | 'RESULT'>('CONFIG');
    const [simConfig, setSimConfig] = useState({ subject: '', count: 5, timeMinutes: 10, model3dId: '' });
    const [simQuestions, setSimQuestions] = useState<any[]>([]);
    const [simCurrentQ, setSimCurrentQ] = useState(0);
    const [simAnswers, setSimAnswers] = useState<Record<string, string>>({}); // itemId -> optionId
    const [simTimeLeft, setSimTimeLeft] = useState(0);
    const [simFinished, setSimFinished] = useState(false);
    const [isGeneratingSimulator, setIsGeneratingSimulator] = useState(false);

    // Bimester selection
    const [selectedBimester, setSelectedBimester] = useState(1);
    const [isRecalculating, setIsRecalculating] = useState(false);

    const analytics = new AnalyticsService(state);

    // --- EFFECT: POMODORO ---
    // --- GAMIFICATION: POMODORO ---
    const handlePomodoroComplete = () => {
        setPomoIsActive(false);
        if (pomoMode === 'FOCUS') {
            // Reward Logic
            if (user.role === UserRole.ALUNO && updateUserProfile) {
                const profiles = state.userProfiles || [];
                const userProfile = profiles.find(p => p.userId === user.id);
                if (userProfile) {
                    updateUserProfile({
                        ...userProfile,
                        owlCoins: (userProfile.owlCoins || 0) + 10,
                        xp: (userProfile.xp || 0) + 50
                    });
                    alert("🎉 Foco concluído! +10 Moedas ganhas! Hora de uma pausa.");
                } else {
                    alert("Foco concluído! Hora de uma pausa.");
                }
            } else {
                alert("Foco concluído! Hora de uma pausa.");
            }

            setPomoMode('BREAK');
            setPomoTime(5 * 60);
        } else {
            alert("Pausa concluída! De volta aos estudos.");
            setPomoMode('FOCUS');
            setPomoTime(25 * 60);
        }
    };

    // --- AUDIO SYSTEM (WEB AUDIO API) ---
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [whiteNoiseNode, setWhiteNoiseNode] = useState<AudioBufferSourceNode | null>(null);
    const [gainNode, setGainNode] = useState<GainNode | null>(null);
    const [activeSound, setActiveSound] = useState<'OFF' | 'RAIN' | 'CAFE' | 'WHITE_NOISE'>('OFF');

    useEffect(() => {
        // Init Audio Context on first user interaction (browser policy)
        return () => {
            if (audioContext) audioContext.close();
        };
    }, []);

    const toggleWhiteNoise = (enable: boolean) => {
        if (enable) {
            const ctx = audioContext || new AudioContext();
            if (!audioContext) setAudioContext(ctx);

            const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const gain = ctx.createGain();
            gain.gain.value = 0.05; // Low volume

            noise.connect(gain);
            gain.connect(ctx.destination);
            noise.start();

            setWhiteNoiseNode(noise);
            setGainNode(gain);
        } else {
            if (whiteNoiseNode) {
                whiteNoiseNode.stop();
                setWhiteNoiseNode(null);
            }
            if (gainNode) {
                gainNode.disconnect();
                setGainNode(null);
            }
        }
    };

    const handleSoundChange = (sound: 'OFF' | 'RAIN' | 'CAFE' | 'WHITE_NOISE') => {
        // Stop previous
        if (activeSound === 'WHITE_NOISE') toggleWhiteNoise(false);

        setActiveSound(sound);

        // Start new
        if (sound === 'WHITE_NOISE') {
            toggleWhiteNoise(true);
        }
    };

    // --- EFFECT: POMODORO ---
    useEffect(() => {
        let interval: any = null;
        if (pomoIsActive && pomoTime > 0) {
            interval = setInterval(() => setPomoTime(t => t - 1), 1000);
        } else if (pomoTime === 0 && pomoIsActive) {
            handlePomodoroComplete();
            // Stop audio on complete
            if (activeSound !== 'OFF') handleSoundChange('OFF');
        }
        return () => clearInterval(interval);
    }, [pomoIsActive, pomoTime, pomoMode, activeSound]); // Added activeSound dependency

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

    const handleRecalculateIA = async () => {
        setIsRecalculating(true);
        // Simulate IA processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsRecalculating(false);
        alert("Planejamento otimizado com sucesso com base no desempenho da turma!");
    };

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

    const handleGenerateLessonAI = async () => {
        if (!lpForm.classId || !lpForm.topic) return alert('Selecione uma turma e defina um tópico para a IA começar.');

        setAiLoading(true);
        try {
            const cls = state.classes.find(c => c.id === lpForm.classId);
            const grade = cls ? cls.series : 'Ensino Fundamental';
            const subject = 'Geral'; // No store, geralmente vem do contexto do professor

            const suggestion = await generateLessonPlanSuggestions(subject, grade, lpForm.topic);
            setAiLessonSuggestion(suggestion);

            // Mantendo compatibilidade com o formato de texto anterior para o campo 'content'
            let formattedContent = `Resumo: ${suggestion.overview}\n\n`;
            formattedContent += suggestion.weeks.map(w => `S${w.week}: ${w.theme}`).join(' | ');

            setLpForm(prev => ({
                ...prev,
                objectives: suggestion.bnccCodes.join(', '),
                content: formattedContent
            }));
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar plano. Verifique a conexão.");
        } finally {
            setAiLoading(false);
        }
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
            status: 'PENDING',
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
            const suggestion = await generateStudyPlanSuggestions(targetStudentName, stats.weakestSubject || 'Geral', stats.idgScore);
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
        // Normalize subjects: Remove accents and lowercase to avoid duplicates like "Matemática" vs "matematica"
        const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const subjectsSet = new Set<string>();
        const subjectMap = new Map<string, string>(); // Normalized -> Original (to keep pretty display)

        state.items.forEach(i => {
            if (!i.subject) return;
            const norm = normalize(i.subject);
            if (!subjectsSet.has(norm)) {
                subjectsSet.add(norm);
                // Keep the "best" version (usually capitalized)
                const currentBest = subjectMap.get(norm);
                if (!currentBest || i.subject.charAt(0) === i.subject.charAt(0).toUpperCase()) {
                    subjectMap.set(norm, i.subject);
                }
            }
        });

        return Array.from(subjectMap.values()).sort();
    }, [state.items]);

    const startSimulator = () => {
        if (!simConfig.subject) return alert("Selecione uma matéria.");

        const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const targetNormalized = normalize(simConfig.subject);

        // 1. Filter items using normalized comparison
        const subjectItems = state.items.filter(i =>
            i.subject &&
            normalize(i.subject) === targetNormalized &&
            (i.type === QuestionType.MULTIPLE_CHOICE || i.type === QuestionType.TRUE_FALSE)
        );

        if (subjectItems.length < simConfig.count) {
            const proceed = window.confirm(`O banco possui apenas ${subjectItems.length} questões desta matéria. Deseja gerar questões inéditas com IA para completar seu simulado?`);
            if (proceed) {
                handleGenerateSimulatorItems();
                return;
            } else if (subjectItems.length === 0) {
                return;
            }
        }

        // 2. Randomize and Slice (Simulate shuffle)
        const shuffled = [...subjectItems].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, simConfig.count);

        setSimQuestions(selected);
        setSimCurrentQ(0);
        setSimAnswers({});
        setSimTimeLeft(simConfig.timeMinutes * 60);
        setSimFinished(false);
        setSimStep('TAKING');
    };

    const handleGenerateSimulatorItems = async () => {
        setIsGeneratingSimulator(true);
        try {
            const qtyNeeded = simConfig.count;
            const selectedModel = state.projectionMaterials?.find(m => m.id === simConfig.model3dId);

            let model3dContextStr = undefined;
            if (selectedModel) {
                model3dContextStr = `Título: ${selectedModel.title} | Link original: ${selectedModel.url} | Descrição: ${selectedModel.description || 'Modelo 3D interativo'}`;
            }

            const newQuestions = await generateQuestionsFromText(
                `Simulado de ${simConfig.subject} para o ${user.role === UserRole.ALUNO ? '9º ano' : 'Ensino Fundamental'}`,
                qtyNeeded,
                QuestionType.MULTIPLE_CHOICE,
                DifficultyLevel.MEDIUM,
                simConfig.subject,
                undefined, // tenantId is optional
                model3dContextStr
            );

            // Map GeneratedQuestion to Item type
            const items: any[] = newQuestions.map(q => ({
                id: `ai-${uuidv4()}`,
                statement: q.statement,
                alternatives: q.alternatives.map(a => ({ id: uuidv4(), text: a.text, isCorrect: a.isCorrect })),
                subject: simConfig.subject,
                difficulty: q.difficulty as any,
                type: QuestionType.MULTIPLE_CHOICE,
                ...(selectedModel ? {
                    simulationConfig: {
                        url: selectedModel.url,
                        title: selectedModel.title
                    }
                } : {})
            }));

            setSimQuestions(items);
            setSimCurrentQ(0);
            setSimAnswers({});
            setSimTimeLeft(simConfig.timeMinutes * 60);
            setSimFinished(false);
            setSimStep('TAKING');
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar questões com IA.");
        } finally {
            setIsGeneratingSimulator(false);
        }
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

    // Get current student profile for gamification display
    const currentStudentProfile = state.userProfiles?.find(p => p.userId === (isStudent ? user.id : targetStudentId));

    // Safety check for Simulator Question
    const currentQuestion = simQuestions[simCurrentQ];
    const currentAlternatives = currentQuestion?.alternatives || [];

    // --- VIEWS ---

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                        {isProfessor ? <BookOpen className="text-brand-secondary" /> : <Target className="text-brand-secondary" />}
                        {isProfessor ? 'Planejamento Acadêmico' : (isParent ? `Histórico de Roteiros: ${targetStudentName} ` : 'Planos de Estudo & Ferramentas')}
                    </h1>
                    {isParent && <p className="text-sm text-slate-500">Acompanhe as tarefas geradas.</p>}
                </div>

                {/* Action Buttons */}
                {isProfessor ? (
                    activeTab === 'LESSON' ? (
                        <button onClick={() => setIsLessonFormOpen(true)} className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold">
                            <Plus size={18} /> Novo Plano de Aula
                        </button>
                    ) : (
                        <button onClick={() => setIsStudyFormOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg">
                            <Target size={18} /> Novo Roteiro p/ Aluno
                        </button>
                    )
                ) : (
                    // Student Action
                    !isParent && activeTab === 'STUDY' && (
                        <button onClick={() => setIsStudyFormOpen(true)} className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg">
                            <Sparkles size={18} className="text-yellow-300" /> Gerar Plano com IA
                        </button>
                    )
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-200">
                {isProfessor ? (
                    <>
                        <button onClick={() => setActiveTab('CURRICULUM')} className={`pb-3 text-sm font-black border-b-2 transition flex items-center gap-2 ${activeTab === 'CURRICULUM' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                            <Calendar size={18} /> Cronograma Anual
                        </button>
                        <button onClick={() => setActiveTab('LESSON')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'LESSON' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>
                            <GraduationCap size={18} /> Planos de Aula
                        </button>
                        <button onClick={() => setActiveTab('STUDY')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'STUDY' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}>
                            <Target size={18} /> Roteiros p/ Alunos
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setActiveTab('STUDY')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'STUDY' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                            <Target size={18} /> Meus Planos
                        </button>
                        {!isParent && (
                            <>
                                <button onClick={() => setActiveTab('POMODORO')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'POMODORO' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500'}`}>
                                    <Clock size={18} /> Foco (Pomodoro)
                                </button>
                                <button onClick={() => setActiveTab('SIMULATOR')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'SIMULATOR' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>
                                    <CheckSquare size={18} /> Simulado
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* --- TOOL 0: CURRICULUM / MACRO PLANNING --- */}
            {activeTab === 'CURRICULUM' && isProfessor && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Bimester Navigator */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(b => (
                            <div
                                key={b}
                                onClick={() => setSelectedBimester(b)}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedBimester === b ? 'bg-brand-primary/5 border-brand-primary shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{b}º Bimestre</span>
                                    {b === 1 && <span className="px-2 py-0.5 bg-brand-primary text-white text-[8px] font-black rounded-full uppercase">Atual</span>}
                                </div>
                                <h3 className="font-bold text-slate-800">Unidade {b}</h3>
                                <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: b === 1 ? '65%' : b < 1 ? '100%' : '0%' }}></div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 font-medium">{b === 1 ? '65% do conteúdo ministrado' : 'Aguardando início'}</p>
                            </div>
                        ))}
                    </div>

                    {/* Timeline & Topics */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cronograma de Conteúdo</h2>
                                <p className="text-xs text-slate-500">Distribuição de tópicos BNCC por semana (Bimestre {selectedBimester})</p>
                            </div>
                            <button
                                onClick={handleRecalculateIA}
                                disabled={isRecalculating}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition"
                            >
                                <Sparkles size={14} className={`${isRecalculating ? 'animate-spin' : 'text-yellow-400'}`} />
                                {isRecalculating ? 'RECALCULANDO...' : 'RECALCULAR COM IA'}
                            </button>
                        </div>

                        <div className="p-0">
                            {[
                                { week: 1, topic: 'Introdução aos Conjuntos Numéricos', status: 'DONE', bncc: 'EF09MA01' },
                                { week: 2, topic: 'Operações com Números Reais', status: 'DONE', bncc: 'EF09MA02' },
                                { week: 3, topic: 'Potenciação e Radiciação', status: 'IN_PROGRESS', bncc: 'EF09MA03' },
                                { week: 4, topic: 'Expressões Algébricas', status: 'TODO', bncc: 'EF09MA04' },
                            ].map((item, idx) => (
                                <div key={idx} className="group flex items-center gap-6 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <div className="w-16 flex flex-col items-center shrink-0">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Semana</span>
                                        <span className="text-xl font-black text-slate-800">{item.week}</span>
                                    </div>
                                    <div className="h-10 w-px bg-slate-200"></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${item.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                                                item.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {item.status === 'DONE' ? 'Concluído' : item.status === 'IN_PROGRESS' ? 'Em aula' : 'Pendente'}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{item.bncc}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 group-hover:text-brand-primary transition-colors">{item.topic}</h4>
                                    </div>
                                    <div className="flex items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setActiveTab('LESSON')}
                                            className="p-2 hover:bg-brand-primary/10 text-brand-primary rounded-lg transition"
                                            title="Ver Plano de Aula"
                                        >
                                            <BookOpen size={18} />
                                        </button>
                                        <button
                                            onClick={() => alert(`Criando prova para o tema: ${item.topic}`)}
                                            className="p-2 hover:bg-brand-primary/10 text-brand-primary rounded-lg transition"
                                            title="Criar Prova sobre o tema"
                                        >
                                            <Target size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress Chart Placeholder */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
                            <div className="relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Meta de Desempenho</h3>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-4xl font-black">74.2</span>
                                    <span className="text-slate-400 mb-1 font-bold">IDG Médio Esperado</span>
                                </div>
                                <p className="text-xs text-slate-400">Baseado na velocidade de absorção da turma atual.</p>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-20">
                                <Trophy size={100} />
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-slate-200">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Ajuste de Rota com IA</h3>
                            <div className="flex items-start gap-3 p-3 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                                <Sparkles size={24} className="text-brand-primary shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs font-bold text-slate-800 uppercase">Sugestão de Aceleração</p>
                                    <p className="text-[11px] text-slate-600 mt-1">
                                        A turma demonstrou 85% de proficiência em "Conjuntos Numéricos". Recomendo unir os tópicos das semanas 4 e 5 para antecipar a unidade de Equações.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TOOL 1: POMODORO & GAMIFICATION --- */}
            {activeTab === 'POMODORO' && !isParent && (
                <div className="flex flex-col items-center justify-center py-8 animate-in fade-in">

                    {/* Gamification Status Bar */}
                    {isStudent && currentStudentProfile && (
                        <div className="flex gap-6 mb-8 bg-white px-8 py-3 rounded-full shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="bg-yellow-100 p-1.5 rounded-full"><Trophy size={16} className="text-yellow-600" /></div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Moedas</div>
                                    <div className="font-black text-slate-700 leading-none">{currentStudentProfile.owlCoins || 0}</div>
                                </div>
                            </div>
                            <div className="w-px bg-slate-200"></div>
                            <div className="flex items-center gap-2">
                                <div className="bg-purple-100 p-1.5 rounded-full"><Sparkles size={16} className="text-purple-600" /></div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">XP Total</div>
                                    <div className="font-black text-slate-700 leading-none">{currentStudentProfile.xp || 0} xp</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 text-center w-full max-w-md relative overflow-hidden transform transition-all hover:scale-[1.01]">
                        {/* Background Pulse & Effects */}
                        {pomoIsActive && (
                            <>
                                <div className={`absolute inset-0 opacity-10 animate-pulse ${pomoMode === 'FOCUS' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100"><div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${(pomoTime / (25 * 60)) * 100}%` }}></div></div>
                            </>
                        )}

                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">{pomoMode === 'FOCUS' ? 'Hora de Focar 🚀' : 'Pausa Merecida ☕'}</h2>
                            <p className="text-slate-500 mb-8 font-medium">{pomoMode === 'FOCUS' ? 'Bloqueie distrações e ganhe +50 XP!' : 'Respire fundo e prepare-se para o próximo round.'}</p>

                            <div className={`text-8xl font-black font-mono mb-8 tracking-tighter tabular-nums ${pomoMode === 'FOCUS' ? 'text-rose-500 drop-shadow-sm' : 'text-emerald-500'}`}>
                                {formatTime(pomoTime)}
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setPomoIsActive(!pomoIsActive)}
                                    className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${pomoIsActive ? 'bg-amber-400 text-amber-900 border-b-4 border-amber-600' : 'bg-brand-primary text-white border-b-4 border-blue-700 hover:brightness-110'}`}
                                >
                                    {pomoIsActive ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                                </button>
                                <button
                                    onClick={() => { setPomoIsActive(false); setPomoTime(pomoMode === 'FOCUS' ? 25 * 60 : 5 * 60); }}
                                    className="w-20 h-20 rounded-2xl bg-slate-100 text-slate-500 border-b-4 border-slate-300 flex items-center justify-center hover:bg-slate-200 transition-all active:top-1"
                                >
                                    <RotateCcw size={28} />
                                </button>
                            </div>

                            {!pomoIsActive && pomoMode === 'FOCUS' && (
                                <div className="mt-8 text-xs text-slate-400 font-medium bg-slate-50 py-2 px-4 rounded-full inline-block">
                                    💡 Dica: Sessões completas aumentam seu nível no ranking!
                                </div>
                            )}

                            {/* --- AMBIENT SOUNDSCAPES --- */}
                            {pomoMode === 'FOCUS' && (
                                <div className="mt-8 border-t border-slate-100 pt-6">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center justify-center gap-2">
                                        <Sparkles size={12} /> Paisagens Sonoras
                                    </h4>
                                    <div className="flex justify-center gap-3">
                                        {['OFF', 'WHITE_NOISE'].map((sound) => (
                                            <button
                                                key={sound}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${(activeSound === sound)
                                                    ? 'bg-slate-800 text-white shadow-md transform scale-105'
                                                    : 'bg-white border hover:bg-slate-50 text-slate-600'
                                                    }`}
                                                onClick={() => handleSoundChange(sound as any)}
                                            >
                                                {sound === 'OFF' ? <XCircle size={12} /> : <Play size={10} />}
                                                {sound === 'OFF' ? 'Sem Som' : 'Ruído Branco (Foco)'}
                                                {activeSound === sound && sound !== 'OFF' && <span className="animate-pulse">🔊</span>}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-300 mt-2">Áudio imersivo para ajudar na concentração.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- SIMULATOR --- */}
            {activeTab === 'SIMULATOR' && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 mt-6">
                    {simStep === 'CONFIG' && (
                        <div className="max-w-md mx-auto text-center space-y-6">
                            <h2 className="text-2xl font-bold text-slate-800">Configurar Simulado</h2>
                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Matéria</label>
                                    <select
                                        value={simConfig.subject}
                                        onChange={e => setSimConfig({ ...simConfig, subject: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-lg"
                                    >
                                        <option value="">Selecione...</option>
                                        {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Questões</label>
                                        <input
                                            type="number"
                                            value={simConfig.count}
                                            onChange={e => setSimConfig({ ...simConfig, count: Number(e.target.value) })}
                                            className="w-full p-3 border border-slate-300 rounded-lg"
                                            min={1} max={50}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Minutos</label>
                                        <input
                                            type="number"
                                            value={simConfig.timeMinutes}
                                            onChange={e => setSimConfig({ ...simConfig, timeMinutes: Number(e.target.value) })}
                                            className="w-full p-3 border border-slate-300 rounded-lg"
                                            min={1} max={180}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center justify-between">
                                        <span>Modelo 3D <span className="text-[10px] font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-2">Experimental (Apenas IA)</span></span>
                                    </label>
                                    <select
                                        value={simConfig.model3dId || ''}
                                        onChange={e => setSimConfig({ ...simConfig, model3dId: e.target.value })}
                                        className="w-full p-3 border border-slate-300 rounded-lg bg-indigo-50/20"
                                    >
                                        <option value="">Nenhum (Gerar questões teóricas tradicionais)</option>
                                        {state.projectionMaterials?.filter(m => m.type === '3D_MODEL').map(m => (
                                            <option key={m.id} value={m.id}>🎲 {m.title}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">Ao selecionar um modelo 3D, a opção "Gerar com IA" focará as questões na exploração deste ambiente virtual interativo.</p>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={startSimulator}
                                        disabled={isGeneratingSimulator}
                                        className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition disabled:opacity-50"
                                    >
                                        {isGeneratingSimulator ? 'Processando...' : 'Iniciar Simulado'}
                                    </button>
                                    <button
                                        onClick={handleGenerateSimulatorItems}
                                        disabled={isGeneratingSimulator || !simConfig.subject}
                                        className="px-4 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
                                        title="Gerar questões inéditas com IA"
                                    >
                                        <Sparkles size={18} className={isGeneratingSimulator ? 'animate-spin' : 'text-yellow-400'} />
                                        {isGeneratingSimulator ? 'Gerando...' : 'IA'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    {isGeneratingSimulator ? 'Aguarde, o Corujão está elaborando questões inéditas...' : 'Dica: Clique em IA para gerar questões se o banco estiver vazio.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {simStep === 'TAKING' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="flex justify-between items-center mb-6">
                                <div className="text-sm font-bold text-slate-500">
                                    Questão {simCurrentQ + 1} de {simQuestions.length}
                                </div>
                                <div className={`text-xl font-mono font-bold ${simTimeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                                    {formatTime(simTimeLeft)}
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 min-h-[120px]">
                                {currentQuestion ? (
                                    <div className="space-y-6">
                                        <RichTextRenderer
                                            content={currentQuestion.statement}
                                            className="text-lg font-medium text-slate-800"
                                        />

                                        {/* 3D Model Viewer (if multimedia includes 3D_MODEL) */}
                                        {currentQuestion.multimedia?.filter(m => m.type === '3D_MODEL').map((m, i) => (
                                            <div key={`3d-${i}`} className="my-4">
                                                <Interactive3DViewer preset={m.url} description={m.description} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="w-full text-center py-4 flex items-center justify-center"><span className="animate-spin text-2xl">⏳</span></div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {currentAlternatives.length > 0 ? (
                                    currentAlternatives.map((alt: any) => (
                                        <button
                                            key={alt.id}
                                            onClick={() => {
                                                if (!currentQuestion) return;
                                                setSimAnswers(prev => ({ ...prev, [currentQuestion.id]: alt.id }));
                                            }}
                                            className={`w-full p-4 rounded-lg border-2 text-left transition flex justify-between items-center ${currentQuestion && simAnswers[currentQuestion.id] === alt.id
                                                ? 'border-brand-primary bg-blue-50 text-brand-dark'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <RichTextRenderer content={alt.text} className="text-sm" />
                                            {currentQuestion && simAnswers[currentQuestion.id] === alt.id && <CheckCircle size={20} className="text-brand-primary shrink-0" />}
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center p-4 text-slate-400 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                        Nenhuma alternativa encontrada para esta questão.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between mt-8">
                                <button
                                    disabled={simCurrentQ === 0}
                                    onClick={() => setSimCurrentQ(c => c - 1)}
                                    className="px-6 py-2 text-slate-500 font-bold disabled:opacity-30"
                                >
                                    Anterior
                                </button>
                                {simCurrentQ < simQuestions.length - 1 ? (
                                    <button
                                        onClick={() => setSimCurrentQ(c => c + 1)}
                                        className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700"
                                    >
                                        Próxima
                                    </button>
                                ) : (
                                    <button
                                        onClick={finishSimulator}
                                        className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500"
                                    >
                                        Finalizar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {simStep === 'RESULT' && (
                        <div className="max-w-2xl mx-auto text-center">
                            <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Simulado Concluído!</h2>
                            <p className="text-slate-500 mb-8">Confira seu desempenho abaixo.</p>

                            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 mb-8">
                                <div className="text-5xl font-black text-brand-primary mb-2">
                                    {Object.entries(simAnswers).filter(([qId, aId]) => {
                                        const q = simQuestions.find(i => i.id === qId);
                                        return q?.alternatives.find((a: any) => a.id === aId)?.isCorrect;
                                    }).length} / {simQuestions.length}
                                </div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Acertos</div>
                            </div>

                            <button
                                onClick={() => setSimStep('CONFIG')}
                                className="px-8 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700"
                            >
                                Novo Simulado
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- MODALS --- */}
            {isStudyFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Target className="text-brand-primary" /> Novo Plano de Estudos
                            </h2>
                            <button onClick={() => setIsStudyFormOpen(false)} className="text-slate-400 hover:text-rose-500">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {!isProfessor && (
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={aiLoading}
                                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                                >
                                    {aiLoading ? <span className="animate-spin">⏳</span> : <Sparkles size={18} className="text-yellow-300" />}
                                    {aiLoading ? 'Gerando com IA...' : 'Gerar Roteiro Inteligente com IA'}
                                </button>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">ou manualmente</span></div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Título do Roteiro</label>
                                <input
                                    type="text"
                                    value={spForm.title}
                                    onChange={e => setSpForm({ ...spForm, title: e.target.value })}
                                    placeholder="Ex: Revisão de Matemática"
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tarefas</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={spForm.newTask}
                                        onChange={e => setSpForm({ ...spForm, newTask: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && addTask()}
                                        placeholder="Nova tarefa..."
                                        className="flex-1 p-2 border border-slate-300 rounded-lg"
                                    />
                                    <button onClick={addTask} className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200"><Plus size={20} /></button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto bg-slate-50 p-2 rounded-lg">
                                    {spTasks.map(t => (
                                        <div key={t.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                                            <span>{t.description}</span>
                                            <button onClick={() => setSpTasks(spTasks.filter(x => x.id !== t.id))} className="text-rose-500"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                    {spTasks.length === 0 && <p className="text-center text-xs text-slate-400 py-2">Nenhuma tarefa adicionada</p>}
                                </div>
                            </div>

                            <button
                                onClick={handleCreateStudyPlan}
                                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition mt-4"
                            >
                                Salvar Plano
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLessonFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <GraduationCap className="text-brand-primary" /> Novo Plano de Aula
                            </h2>
                            <button onClick={() => setIsLessonFormOpen(false)} className="text-slate-400 hover:text-rose-500">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Turma</label>
                                <select
                                    value={lpForm.classId}
                                    onChange={e => setLpForm({ ...lpForm, classId: e.target.value })}
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                >
                                    <option value="">Selecione a turma...</option>
                                    {state.classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} - {c.series}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tópico / Aula</label>
                                <input
                                    type="text"
                                    value={lpForm.topic}
                                    onChange={e => setLpForm({ ...lpForm, topic: e.target.value })}
                                    placeholder="Ex: Introdução a Equações"
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                />
                            </div>

                            <button
                                onClick={handleGenerateLessonAI}
                                disabled={aiLoading}
                                className="w-full py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-purple-100 transition"
                            >
                                {aiLoading ? <span className="animate-spin">⏳</span> : <Sparkles size={14} />}
                                {aiLoading ? 'Processando com IA...' : 'Estruturar Aula e BNCC com IA 🦉'}
                            </button>
                            {aiLessonSuggestion ? (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Visão Pedagógica</h3>
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{aiLessonSuggestion.overview}</p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            {aiLessonSuggestion.bnccCodes.map(code => (
                                                <span key={code} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded uppercase">{code}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {aiLessonSuggestion.weeks.map(w => (
                                            <div key={w.week} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-brand-primary uppercase">Módulo {w.week}</span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-sm mb-1">{w.theme}</h4>
                                                <p className="text-[11px] text-slate-600 mb-2"><span className="font-bold">Objetivo:</span> {w.objective}</p>
                                                <div className="p-2 bg-emerald-50 rounded text-[11px] text-emerald-800 font-medium border border-emerald-100">
                                                    🚀 <span className="font-bold underline">Atividade Sugerida:</span> {w.activity}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-slate-200">
                                        <button
                                            className="w-full py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition"
                                            onClick={() => alert(`Simulando geração de itens para ${lpForm.topic}...`)}
                                        >
                                            <Target size={14} className="text-brand-secondary" /> Gerar Itens de Avaliação p/ este Tema
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Objetivos</label>
                                        <textarea
                                            value={lpForm.objectives}
                                            onChange={e => setLpForm({ ...lpForm, objectives: e.target.value })}
                                            rows={2}
                                            className="w-full p-3 border border-slate-300 rounded-lg"
                                            placeholder="O que os alunos devem aprender?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Desenvolvimento / Conteúdo</label>
                                        <textarea
                                            value={lpForm.content}
                                            onChange={e => setLpForm({ ...lpForm, content: e.target.value })}
                                            rows={4}
                                            className="w-full p-3 border border-slate-300 rounded-lg"
                                            placeholder="Detalhes da aula..."
                                        />
                                    </div>
                                </>
                            )}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleCreateLessonPlan}
                                    className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition"
                                >
                                    Salvar Plano de Aula
                                </button>
                                <button
                                    onClick={() => setIsLessonFormOpen(false)}
                                    className="px-6 py-3 border border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'STUDY' && (
                // STUDY PLANS LIST (Shared)
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                    {filteredStudyPlans.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredStudyPlans.map(plan => (
                                <div key={plan.id} className="p-6 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                {plan.title}
                                                {plan.generatedBy === 'IA' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1"><Sparkles size={10} /> IA</span>}
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
                                                    {task.completed && <CheckSquare size={14} />}
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
                                    <History size={48} className="text-slate-200 mb-4" />
                                    <p className="text-slate-500 font-medium">Nenhum histórico de roteiro encontrado.</p>
                                    <p className="text-sm text-slate-400 mt-1">Incentive seu filho a gerar um plano de estudos com a IA.</p>
                                </>
                            ) : (
                                <>
                                    <Target size={48} className="text-slate-200 mb-4" />
                                    <p className="text-slate-500 font-medium">Nenhum plano de estudo ativo.</p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {isProfessor ? 'Crie um para orientar seus alunos.' : 'Clique em "Gerar Plano com IA" para começar.'}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
