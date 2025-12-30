
import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Target, Brain, CheckCircle, Play, Pause, RotateCcw, FileText, Trophy, Lock, Coins, Check, Zap, Timer, ChevronRight, Sparkles, AlertCircle, Route, List } from 'lucide-react';
import { AppState, User, UserRole, LessonPlan, StudyPlan, UserProfileExtended, Student, SchoolClass, Exam, ExamResult, ExamRegistration, Item, DifficultyLevel } from '../../types';
import { uuidv4 } from '../../utils/helpers';
import { AnalyticsService } from '../../services/analyticsService';
import { generateStudyPlanSuggestions } from '../../services/geminiService';
import { useAppStore } from '../../store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { fetchStudents, fetchClasses, fetchExams, fetchResults, fetchStudyPlans, fetchUserProfiles, fetchRegistrations } from '../../services/supabaseClient';

interface PathNode {
    id: string;
    title: string;
    description: string;
    type: 'MODULE' | 'LESSON' | 'QUIZ' | 'GOAL';
    subject: string;
    status: 'LOCKED' | 'ACTIVE' | 'COMPLETED';
}

const MOCK_NODES: PathNode[] = [
    { id: 'n1', title: 'Introdução aos Estudos', description: 'Entendendo seu perfil de aprendizagem.', type: 'MODULE', subject: 'Geral', status: 'COMPLETED' },
    { id: 'n2', title: 'Fundamentos de Lógica', description: 'Raciocínio e dedução básica.', type: 'LESSON', subject: 'Matemática', status: 'ACTIVE' },
    { id: 'n3', title: 'Quiz de Verificação', description: 'Teste seus conhecimentos iniciais.', type: 'QUIZ', subject: 'Geral', status: 'LOCKED' },
    { id: 'n4', title: 'Expansão de Vocabulário', description: 'Leitura e interpretação.', type: 'LESSON', subject: 'Português', status: 'LOCKED' },
];

export const LearningPathView = ({ state, user }: { state: AppState, user: User }) => {
    const { addStudyPlan } = useAppStore();
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allResults } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults, initialData: [] });
    const { data: allExams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams, initialData: [] });
    const { data: allRegistrations } = useQuery<ExamRegistration[]>({ queryKey: ['registrations'], queryFn: fetchRegistrations, initialData: [] });
    const { data: allUserProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });
    const { data: allStudyPlans } = useQuery<StudyPlan[]>({ queryKey: ['studyPlans'], queryFn: fetchStudyPlans, initialData: [] });

    const student = allStudents?.find(s => s.id === user.id) || allStudents?.[0];
    const analytics = useMemo(() => new AnalyticsService(), []);
    const stats = student ? analytics.getStudentStats(student.id, allStudents || [], allResults || [], allExams || [], allRegistrations || [], allUserProfiles || []) : null;

    const [activeTool, setActiveTool] = useState<'PATH' | 'POMODORO' | 'AI_PLAN'>('PATH');

    // --- POMODORO TIMER ---
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState<'STUDY' | 'BREAK'>('STUDY');

    useEffect(() => {
        let interval: any;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            const nextMode = mode === 'STUDY' ? 'BREAK' : 'STUDY';
            setMode(nextMode);
            setTimeLeft(nextMode === 'STUDY' ? 25 * 60 : 5 * 60);
            alert(nextMode === 'STUDY' ? "Hora de focar!" : "Hora do intervalo!");
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, mode]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- AI STUDY PLAN ---
    const [aiLoading, setAiLoading] = useState(false);
    const handleGeneratePlan = async () => {
        if (!student || !stats) return;
        setAiLoading(true);
        try {
            const planData = await generateStudyPlanSuggestions(student.name, stats.weakestSubject, stats.examAverage);
            const newPlan: StudyPlan = {
                id: uuidv4(),
                studentId: student.id,
                generatedBy: 'IA',
                title: planData.title || 'Plano de Reforço Personalizado',
                tasks: planData.tasks || [],
                createdAt: new Date().toISOString()
            };
            await addStudyPlan(newPlan);
            alert("Plano gerado com sucesso! Veja na aba de Estudos.");
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    };

    const myPlans = allStudyPlans?.filter(p => p.studentId === student?.id) || [];

    return (
        <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
            
            {/* Header com Abas */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Route className="text-indigo-600"/> Minha Trilha de Aprendizagem
                    </h1>
                    <p className="text-slate-500 font-medium">Sua jornada personalizada para o sucesso acadêmico.</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <button onClick={() => setActiveTool('PATH')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTool === 'PATH' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Mapa</button>
                    <button onClick={() => setActiveTool('POMODORO')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTool === 'POMODORO' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Pomodoro</button>
                    <button onClick={() => setActiveTool('AI_PLAN')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTool === 'AI_PLAN' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Reforço IA</button>
                </div>
            </div>

            {/* Visualização do Mapa de Trilha */}
            {activeTool === 'PATH' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-10 relative">
                    {/* Linha de conexão visual (apenas em desktop) */}
                    <div className="absolute top-[88px] left-20 right-20 h-1 bg-slate-100 hidden lg:block -z-10"></div>
                    
                    {MOCK_NODES.map((node, idx) => (
                        <div key={node.id} className="flex flex-col items-center text-center group">
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border-4 mb-4 transition-all ${
                                node.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-100 shadow-lg text-white' : 
                                node.status === 'ACTIVE' ? 'bg-indigo-600 border-indigo-100 shadow-xl text-white scale-110' : 
                                'bg-white border-slate-100 text-slate-300'
                            }`}>
                                {node.status === 'COMPLETED' ? <CheckCircle size={32}/> : node.status === 'ACTIVE' ? <Play size={32} fill="white"/> : <Lock size={32}/>}
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${node.status === 'ACTIVE' ? 'text-indigo-600' : 'text-slate-400'}`}>{node.subject}</div>
                            <h4 className="font-black text-slate-800 text-sm leading-tight">{node.title}</h4>
                            <p className="text-xs text-slate-400 mt-2 px-4 leading-relaxed">{node.description}</p>
                            {node.status === 'ACTIVE' && (
                                <button className="mt-4 px-4 py-1.5 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase shadow-lg shadow-indigo-200">Começar</button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Visualização Pomodoro */}
            {activeTool === 'POMODORO' && (
                <div className="max-w-md mx-auto py-10 animate-in zoom-in-95">
                    <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-2xl text-center relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${mode === 'STUDY' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-8">Timer de Produtividade</h3>
                        
                        <div className="relative inline-block mb-8">
                             <div className={`w-64 h-64 rounded-full border-[12px] flex items-center justify-center transition-all ${mode === 'STUDY' ? 'border-rose-100 text-rose-600' : 'border-emerald-100 text-emerald-600'}`}>
                                <div className="text-7xl font-black font-mono tracking-tighter">{formatTime(timeLeft)}</div>
                             </div>
                             {isRunning && (
                                 <div className="absolute inset-0 w-full h-full rounded-full border-[12px] border-indigo-500 border-t-transparent animate-spin opacity-40"></div>
                             )}
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setIsRunning(!isRunning)} className={`px-10 py-4 rounded-2xl font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 ${isRunning ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                                {isRunning ? <Pause size={24}/> : <Play size={24} fill="white"/>}
                                {isRunning ? 'Pausar' : 'Focar Agora'}
                            </button>
                            <button onClick={() => { setIsRunning(false); setTimeLeft(25*60); setMode('STUDY'); }} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition">
                                <RotateCcw size={24}/>
                            </button>
                        </div>
                        
                        <p className="mt-8 text-sm text-slate-400 font-medium">Estude por 25 minutos e descanse 5. <br/> Seu cérebro agradece!</p>
                    </div>
                </div>
            )}

            {/* Visualização de Reforço com IA */}
            {activeTool === 'AI_PLAN' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#0f1d2e] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                            <Sparkles size={120} className="absolute -right-8 -bottom-8 opacity-10"/>
                            <h3 className="text-2xl font-black mb-4 tracking-tight">Potencialize seu Estudo</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">A IA do ExamePad analisa seu desempenho em tempo real e cria planos de ação focados em suas dificuldades.</p>
                            <button 
                                onClick={handleGeneratePlan}
                                disabled={aiLoading}
                                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {aiLoading ? <RotateCcw size={20} className="animate-spin"/> : <Brain size={20}/>}
                                {aiLoading ? 'Processando Inteligência...' : 'Gerar Meu Plano Agora'}
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                            <List size={20} className="text-indigo-600"/> Meus Planos Gerados
                        </h3>
                        <div className="space-y-4">
                            {myPlans.map(plan => (
                                <div key={plan.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">PLANO PERSONALIZADO</div>
                                            <h4 className="font-black text-slate-800 text-xl">{plan.title}</h4>
                                        </div>
                                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Target size={24}/></div>
                                    </div>
                                    <div className="space-y-3 mb-6">
                                        {plan.tasks.map((task, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center"></div>
                                                <span className="text-sm font-medium text-slate-600">{task}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">Marcar Como Concluído <ChevronRight size={14}/></button>
                                </div>
                            ))}
                            {myPlans.length === 0 && (
                                <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                                    <AlertCircle size={48} className="mx-auto mb-4 text-slate-200"/>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs leading-relaxed">Você ainda não gerou nenhum plano de reforço.<br/>Clique no botão à esquerda para começar!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
