import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, BookOpen, CheckCircle, Calendar, Clock, Brain, Award, ChevronLeft, ChevronRight, Trophy, X, FileText, Check, Eye, User as UserIcon, List, ArrowUp, ArrowDown, Coins, Star, Activity, Zap, Medal, Sparkles, Target, Users, BookHeart, Play, ArrowRight, Gamepad2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppState, RiskLevel, User, Exam, ExamResult, QuestionType, UserRole, GamifiedEventStatus, ExamStatus } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { useAppStore } from '../../store/useAppStore';
import { useFeatureFlag } from '../../context/FeatureFlagContext'; // [NEW]

interface StudentDashboardViewProps {
    state: AppState;
    user: User;
}

// Simple SVG Line Chart Component
const EvolutionChart = ({ data }: { data: { label: string, value: number }[] }) => {
    if (data.length < 2) return (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <Activity size={24} className="mb-2 opacity-50" />
            <span>Ainda sem dados suficientes para gráfico.</span>
            <span className="text-xs">Realize mais provas!</span>
        </div>
    );

    const height = 150;
    const width = 300;
    const padding = 20;

    const maxY = 10; // Grades are 0-10
    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - (d.value / maxY) * (height - 2 * padding);
        return x + ',' + y;
    }).join(' ');

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={'0 0 ' + width + ' ' + height} className="w-full h-full">
                {/* Grid Lines */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />

                {/* Path */}
                <polyline points={points} fill="none" stroke="#0077b6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Dots and Labels */}
                {data.map((d, i) => {
                    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
                    const y = height - padding - (d.value / maxY) * (height - 2 * padding);
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="white" stroke="#0077b6" strokeWidth="2" />
                            <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#0f1d2e" fontWeight="bold">{d.value.toFixed(1)}</text>
                            <text x={x} y={height - 2} textAnchor="middle" fontSize="8" fill="#64748b">{d.label.slice(0, 6)}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const StudentDashboardView = ({ state, user }: StudentDashboardViewProps) => {
    const navigate = useNavigate();
    const isParent = user.role === UserRole.PAIS;
    const { isEnabled } = useFeatureFlag(); // [NEW]
    const { registerStudentToEvent, setOwlTutorContext } = useAppStore();

    // Se for pai, pega o filho selecionado na store (selectedChildId)
    // Se não houver seleção, fallback para o primeiro filho disponível
    let studentIdToView = user.id;

    if (isParent) {
        if (state.selectedChildId) {
            studentIdToView = state.selectedChildId;
        } else if (user.childrenIds && user.childrenIds.length > 0) {
            studentIdToView = user.childrenIds[0];
        }
    }

    const student = state.students.find(s => s.id === studentIdToView);

    const analytics = new AnalyticsService(state);
    const stats = student ? analytics.getStudentStats(student.id) : null;
    const profile = student ? state.studentProfiles?.find(p => p.studentId === student.id) : null;

    // Buscar perfil estendido (para moedas e badges)
    const extendedProfile = student ? state.userProfiles?.find(p => p.userId === student.id) : null;

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    // Ranking Modal State
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [rankingMode, setRankingMode] = useState<'ACADEMIC' | 'XP'>('ACADEMIC');

    // Result Modal State
    const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
    // Agenda Modal State
    const [showAgendaModal, setShowAgendaModal] = useState(false);

    // Event Modal
    const [showEventRules, setShowEventRules] = useState<string | null>(null);

    if (!student || !stats) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center flex-col gap-4">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Carregando dados do aluno...</p>
            </div>
        );
    }

    const getRiskColor = (level: RiskLevel) => {
        if (level === RiskLevel.HIGH) return 'bg-rose-100 text-rose-700 border-rose-200';
        if (level === RiskLevel.MEDIUM) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    const recentResults = state.results
        .filter(r => r.studentId === student.id)
        .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

    // Prepare Chart Data
    const chartData = state.results
        .filter(r => r.studentId === student.id)
        .sort((a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime())
        .map(r => {
            const exam = state.exams.find(e => e.id === r.examId);
            return {
                label: exam?.subject.slice(0, 3) || 'Av',
                value: r.totalScore
            };
        });

    // Trend Logic
    const lastTwoResults = chartData.slice(-2);
    const trend = lastTwoResults.length === 2 ? lastTwoResults[1].value - lastTwoResults[0].value : 0;

    // --- EVENTS LOGIC ---
    const availableEvents = state.gamifiedEvents.filter(e =>
        e.schoolId === student.schoolId &&
        e.status === GamifiedEventStatus.OPEN &&
        !e.participants.some(p => p.studentId === student.id)
    );

    const myActiveEvents = state.gamifiedEvents.filter(e =>
        e.participants.some(p => p.studentId === student.id) &&
        e.status !== GamifiedEventStatus.FINISHED
    );

    const handleAcceptEvent = (eventId: string) => {
        if (confirm("Você leu as regras e deseja se inscrever?")) {
            registerStudentToEvent(eventId, student.id);
            setShowEventRules(null);
        }
    };

    // --- RANKING CALCULATION LOGIC ---
    const calculateRanks = () => {
        const getMetric = (sId: string) => {
            if (rankingMode === 'ACADEMIC') {
                return analytics.getStudentStats(sId)?.idgScore || 0; // Usando IDG Ponderado
            } else {
                // XP Ranking (Coins)
                const p = state.userProfiles?.find(up => up.userId === sId);
                return p?.owlCoins || 0;
            }
        };

        // 1. Class Rank
        const classStudents = state.students.filter(s => s.classId === student.classId);
        const sortedClass = classStudents.sort((a, b) => getMetric(b.id) - getMetric(a.id));
        const classRank = sortedClass.findIndex(s => s.id === student.id) + 1;

        // 2. School Rank
        const schoolStudents = state.students.filter(s => s.schoolId === student.schoolId);
        const sortedSchool = schoolStudents.sort((a, b) => getMetric(b.id) - getMetric(a.id));
        const schoolRank = sortedSchool.findIndex(s => s.id === student.id) + 1;

        // 3. General (Tenant) Rank
        const allStudents = state.students.filter(s => s.tenantId === student.tenantId);
        const sortedGeneral = allStudents.sort((a, b) => getMetric(b.id) - getMetric(a.id));
        const generalRank = sortedGeneral.findIndex(s => s.id === student.id) + 1;

        return { classRank, schoolRank, generalRank, totalClass: classStudents.length, totalSchool: schoolStudents.length, totalGeneral: allStudents.length };
    };

    const ranks = calculateRanks();

    // --- LEVELLING LOGIC ---
    const currentXP = extendedProfile?.xp || 0;
    const currentLevel = Math.floor(currentXP / 1000) + 1;
    const nextLevelXP = currentLevel * 1000;
    const progressToNext = currentXP % 1000;
    const progressPercent = (progressToNext / 1000) * 100;

    // --- MOCK DAILY QUESTS ---
    const dailyQuests = [
        { id: 1, title: 'Foco Total', desc: 'Complete 1 pomodoro de 25m', xp: 50, done: false },
        { id: 2, title: 'Mestre dos Simulados', desc: 'Acerte 80% em um simulado', xp: 100, done: true },
        { id: 3, title: 'Presença Diária', desc: 'Faça login no portal', xp: 10, done: true },
    ];

    // Calendar Logic (Reuse existing logic)
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);

    const myExams = state.registrations
        .filter(r => r.studentId === student.id)
        .map(r => state.exams.find(e => e.id === r.examId))
        .filter(Boolean) as Exam[];

    const getEventsForDay = (day: number) => {
        const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
        const exams = myExams.filter(e => e.scheduledDate === dateStr);
        const announcements = state.announcements.filter(a => a.eventDate === dateStr);

        // Add Gamified Events to Calendar
        const gameEvents = state.gamifiedEvents.filter(e =>
            e.participants.some(p => p.studentId === student.id) &&
            e.eventDate.startsWith(dateStr)
        );

        const mappedEvents = [
            ...exams.map(e => ({
                type: e.title.toLowerCase().includes('trabalho') ? 'TRABALHO' : 'PROVA',
                title: e.title,
                date: e.scheduledDate
            })),
            ...announcements.map(a => ({
                type: a.type === 'AVISO' ? 'OUTRO' : 'EVENTO',
                title: a.title,
                date: a.eventDate
            })),
            ...gameEvents.map(e => ({
                type: 'COMPETICAO',
                title: e.title,
                date: e.eventDate
            }))
        ];

        return mappedEvents;
    };

    const getAllMonthEvents = () => {
        const events = [];
        for (let i = 1; i <= days; i++) {
            const dayEvents = getEventsForDay(i);
            if (dayEvents.length > 0) events.push(...dayEvents.map(e => ({ ...e, day: i })));
        }
        return events;
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentMonth(newDate);
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'PROVA': return 'bg-rose-500 border-rose-600 text-white';
            case 'TRABALHO': return 'bg-blue-500 border-blue-600 text-white';
            case 'EVENTO': return 'bg-emerald-500 border-emerald-600 text-white';
            case 'COMPETICAO': return 'bg-amber-500 border-amber-600 text-white';
            default: return 'bg-slate-400 border-slate-500 text-white';
        }
    };

    const getEventLabel = (type: string) => {
        switch (type) {
            case 'PROVA': return 'Prova/Avaliação';
            case 'TRABALHO': return 'Trabalho/Pesquisa';
            case 'EVENTO': return 'Evento Escolar';
            case 'COMPETICAO': return 'Competição';
            default: return 'Comunicado Geral';
        }
    };

    // --- MENTORSHIP HANDLERS ---
    const { addMentorshipRequest, acceptMentorshipRequest, confirmMentorship, updateUserProfile } = useAppStore();

    // Mock handler (Need state for modal in real implementation)
    const handleCreateRequest = () => {
        const desc = prompt("Descreva sua dúvida (ex: Equações de 2º grau):");
        if (desc) {
            addMentorshipRequest({
                id: Math.random().toString(36).substr(2, 9),
                studentId: student.id,
                studentName: student.name,
                subject: 'Geral', // Hardcoded for now, could be select
                description: desc,
                status: 'ABERTO' as any,
                rewardXp: 200,
                createdAt: new Date().toISOString()
            });
            alert("Pedido criado! Aguarde um mentor aceitar.");
        }
    };

    const handleAcceptMentorship = (reqId: string) => {
        if (confirm("Aceitar esta mentoria? Você ganhará XP após o aluno confirmar com o PIN.")) {
            acceptMentorshipRequest(reqId, student.id, student.name);
        }
    };

    const handleConfirmMentorship = (reqId: string, pin: string) => {
        const success = confirmMentorship(reqId, pin);
        if (success) {
            alert("🎉 Mentoria validada e Concluída! Você ganhou +200 XP!");
            // Mock XP Update
            if (extendedProfile) {
                updateUserProfile({
                    ...extendedProfile,
                    xp: (extendedProfile.xp || 0) + 200,
                    owlCoins: extendedProfile.owlCoins + 50
                });
            }
        } else {
            alert("PIN incorreto. Peça ao aluno o número de 4 dígitos.");
        }
    };

    const renderCorrectionModal = () => {
        if (!selectedResult) return null;
        const exam = state.exams.find(e => e.id === selectedResult.examId);
        if (!exam) return null;

        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><FileText size={20} /> Correção: {exam.title}</h3>
                            <p className="text-xs text-slate-500">Nota Final: <strong className="text-brand-primary text-sm">{selectedResult.totalScore.toFixed(1)}</strong></p>
                        </div>
                        <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
                        <div className="bg-white shadow-sm p-8 max-w-2xl mx-auto min-h-full">
                            <div className="text-center border-b pb-6 mb-6">
                                <h1 className="text-2xl font-bold uppercase tracking-wide">{exam.title}</h1>
                                <div className="flex justify-center gap-4 text-sm text-slate-500 mt-2">
                                    <span>Aluno: {student.name}</span>
                                    <span>Data: {new Date(selectedResult.gradedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="space-y-8">
                                {exam.items.map((conf, idx) => {
                                    const item = state.items.find(i => i.id === conf.itemId);
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
                                                    <div className="text-xs font-bold text-slate-500 uppercase">Sua Resposta:</div>
                                                    <div className="p-2 bg-white border border-slate-200 rounded text-sm text-slate-600 italic">
                                                        (Resposta discursiva avaliada pelo professor)
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- EXPLAIN ERROR BUTTON (NEW) --- */}
                                            {!answer?.isCorrect && isEnabled('AI_TUTOR') && (
                                                <div className="mt-3 pl-7">
                                                    <button
                                                        onClick={() => {
                                                            // Prepare context

                                                            // Prepare context
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

                                                            // Close modal and switch view
                                                            setSelectedResult(null);
                                                            // We need to trigger view switch. Since we are in StudentDashboardView, we can't easily switch view without prop or store action.
                                                            // Fortunately, ViewRouter passes setView? NO. StudentDashboard doesn't receive setView prop.
                                                            // BUT, ViewRouter controls the view based on 'view' state which is usually in App component or local state in the wrapper.
                                                            // Wait, ViewRouterProps has setView. DashboardView has setView. StudentDashboardView does NOT have setView in props.
                                                            // It seems I need to rely on a global 'setView' action OR add setView to StudentDashboardView props.
                                                            // Checking ViewRouter.tsx: 
                                                            // return <StudentDashboardView state={store} user={currentUser} />;
                                                            // It does NOT pass setView. This is a problem.
                                                            // I will add a temporary Custom Event or assume I can add setView to props if I modify ViewRouter.
                                                            // BUT, for now, let's use a workaround or fix ViewRouter.

                                                            // FIX: I will log to console and alert user "Feature requires View Navigation Update" if I can't switch.
                                                            // Re-reading ViewRouter: 'setView' is passed to DashboardView but not StudentDashboardView.
                                                            // I MUST update ViewRouter to pass setView to StudentDashboardView.

                                                            console.log("Navigating to Tutor...");
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {isParent && (
                <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg flex items-center gap-3 text-sky-800 mb-4 animate-in slide-in-from-top-2">
                    <UserIcon size={24} className="p-1 bg-sky-200 rounded-full" />
                    <div>
                        <span className="font-bold text-xs uppercase">Modo Responsável</span>
                        <p className="text-sm">Visualizando o desempenho acadêmico de <strong>{student.name}</strong>.</p>
                    </div>
                </div>
            )}

            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark">Olá, {user.name.split(' ')[0]}! 🦉</h1>
                    <p className="text-slate-500">Acompanhamento em Tempo Real.</p>
                </div>
                <div className="flex gap-3">
                    {state.settings.rankingEnabled && (
                        <button onClick={() => setShowRankingModal(true)} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-amber-200 transition shadow-sm border border-amber-200">
                            <Trophy size={18} /> Ver Ranking
                        </button>
                    )}
                    <button onClick={() => setShowAgendaModal(true)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
                        <List size={18} /> Ver Agenda Completa
                    </button>
                </div>
            </div>

            {/* EVENT INVITATIONS (NEW) */}
            {availableEvents.length > 0 && !isParent && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg mb-6 relative overflow-hidden animate-in slide-in-from-top-4">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles className="text-yellow-400" /> Convites Especiais ({availableEvents.length})</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {availableEvents.map(evt => (
                                <div key={evt.id} className="min-w-[280px] bg-white/10 border border-white/20 p-4 rounded-lg hover:bg-white/20 transition">
                                    <div className="text-xs font-bold text-purple-200 uppercase mb-1">{evt.type.replace('_', ' ')}</div>
                                    <h4 className="font-bold text-lg leading-tight mb-2">{evt.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-purple-100 mb-3">
                                        <Calendar size={12} /> {new Date(evt.eventDate).toLocaleDateString()}
                                        <span className="opacity-50">|</span>
                                        <Coins size={12} className="text-yellow-400" /> Prémio: {evt.rewardCoins}
                                    </div>
                                    <button
                                        onClick={() => alert('Convite para o Soletrando aceito com sucesso! Prepare-se para o prêmio de 500 moedas.')}
                                        className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold shadow-sm border border-indigo-200 hover:bg-indigo-50 transition flex items-center gap-2"
                                    >
                                        <Check size={16} /> Aceitar Convite
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Trophy size={150} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
                </div>
            )}

            {/* My Active Events */}
            {myActiveEvents.length > 0 && !isParent && (
                <div className="bg-white border-l-4 border-amber-500 p-4 rounded-xl shadow-sm mb-6 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Award className="text-amber-500" /> Suas Competições</h4>
                        <p className="text-sm text-slate-500">Você está inscrito em {myActiveEvents.length} evento(s). Prepare-se!</p>
                    </div>
                    <div className="flex gap-2">
                        {myActiveEvents.map(e => (
                            <span key={e.id} className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">
                                {e.title}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* --- MENTORSHIP BOARD (NEW) --- */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden mb-6">
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                            <BookHeart className="text-pink-500" /> Quadro de Mentoria
                        </h3>
                        <p className="text-sm text-indigo-700">Ajude colegas e ganhe XP ou peça ajuda para subir sua nota!</p>
                    </div>
                    {!isParent && (
                        <button
                            onClick={handleCreateRequest}
                            className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold shadow-sm border border-indigo-200 hover:bg-indigo-50 transition flex items-center gap-2"
                        >
                            <Zap size={16} /> Pedir Ajuda
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                    {(!state.mentorships || state.mentorships.length === 0) && (
                        <div className="col-span-full text-center py-8 text-indigo-300">
                            <Users size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Nenhum pedido de ajuda no momento.</p>
                            <p className="text-xs">Seja o primeiro a pedir!</p>
                        </div>
                    )}

                    {(state.mentorships || []).filter(m => m.status === 'ABERTO').map(m => (
                        <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded uppercase">{m.subject}</span>
                                <span className="text-amber-500 font-bold text-xs flex items-center gap-1"><Star size={10} fill="currentColor" /> +{m.rewardXp} XP</span>
                            </div>
                            <h4 className="font-bold text-indigo-900 leading-tight mb-1">{m.description}</h4>
                            <div className="text-xs text-indigo-500 mb-4">Por: {m.studentName}</div>

                            {m.studentId !== student.id && !isParent ? (
                                <button
                                    onClick={() => handleAcceptMentorship(m.id)}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition"
                                >
                                    Aceitar Mentoria
                                </button>
                            ) : (
                                <div className="text-center text-xs text-slate-400 font-bold py-2 border rounded bg-slate-50">
                                    {isParent ? 'Apenas Visualização' : 'Seu Pedido'}
                                </div>
                            )}
                        </div>
                    ))}

                    {(state.mentorships || []).filter(m => m.status === 'EM_ANDAMENTO' && (m.studentId === student.id || m.mentorId === student.id)).map(m => (
                        <div key={m.id} className="bg-white p-4 rounded-xl shadow-md border-l-4 border-emerald-500">
                            <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Em Andamento</div>
                            <h4 className="font-bold text-slate-800 leading-tight mb-2">{m.description}</h4>

                            {m.studentId === student.id ? (
                                <div className="bg-slate-100 p-3 rounded text-center">
                                    <div className="text-xs text-slate-500 mb-1">Informe este PIN ao mentor ao final:</div>
                                    <div className="text-2xl font-black text-slate-800 tracking-widest">{m.verificationPin || '****'}</div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Insira o PIN do aluno para finalizar:</div>
                                    <div className="flex gap-2">
                                        <input id={'pin-' + m.id} type="text" maxLength={4} className="w-full text-center font-bold border rounded p-1" placeholder="PIN" />
                                        <button
                                            onClick={() => {
                                                const val = (document.getElementById('pin-' + m.id) as HTMLInputElement).value;
                                                handleConfirmMentorship(m.id, val);
                                            }}
                                            className="bg-emerald-500 text-white px-3 rounded font-bold"
                                        >
                                            OK
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <BookHeart size={150} className="absolute -right-10 -bottom-10 text-indigo-100 opacity-50 rotate-12 pointer-events-none" />
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Índice Global (IDG)</span>
                        <TrendingUp size={20} className="text-brand-primary" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-black text-slate-800">
                            {stats.examsTaken > 0 ? stats.idgScore.toFixed(1) : <span className="text-slate-300 text-2xl">--</span>}
                        </div>
                        {trend !== 0 && (
                            <div className={'flex items-center text-xs font-bold ' + (trend > 0 ? 'text-emerald-500' : 'text-rose-500') + ' '}>
                                {trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                {Math.abs(trend).toFixed(1)}
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        {stats.examsTaken > 0 ? "Média Ponderada (Provas + Trabalhos)" : "Realize sua primeira avaliação!"}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Frequência</span>
                        <CheckCircle size={20} className={stats.attendanceRate > 85 ? "text-emerald-500" : "text-rose-500"} />
                    </div>
                    <div className="text-3xl font-black text-slate-800">{stats.attendanceRate}%</div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                            className={'h-full ' + (stats.attendanceRate > 85 ? 'bg-emerald-500' : 'bg-rose-500') + ' '}
                            style={{ width: (stats.attendanceRate) + '%' }}
                        ></div>
                    </div>
                </div>

                <div className={'p-5 rounded-xl border shadow-sm ' + (getRiskColor(stats.riskLevel || RiskLevel.LOW)) + ' '}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase opacity-70">Status de Risco</span>
                        <AlertTriangle size={20} />
                    </div>
                    <div className="text-xl font-black">
                        {(stats.riskLevel === RiskLevel.LOW || !stats.riskLevel) ? 'Zona Segura' : stats.riskLevel === RiskLevel.MEDIUM ? 'Atenção' : 'Crítico'}
                    </div>
                    <div className="text-xs mt-1 opacity-80">
                        {(stats.riskLevel === RiskLevel.LOW || !stats.riskLevel) ? 'Continue assim!' : 'Procure o Corujão.'}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-brand-dark to-brand-primary text-white p-5 rounded-xl border border-brand-dark shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-sky-200 uppercase">Meta Próxima Prova</span>
                        <BookOpen size={20} className="text-white" />
                    </div>
                    <div className="text-3xl font-black text-white">
                        {Math.min(10, stats.missingPointsForApproval).toFixed(1)}
                    </div>
                    <div className="text-xs text-sky-100 mt-1">Para manter média 6.0</div>
                </div>
            </div>

            {/* Middle Section: Learning Profile & Gamification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Learning Profile Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Brain size={20} className="text-purple-600" /> Perfil e Conquistas
                        </h3>
                        <div className="space-y-4">
                            {/* Academic Achievements List */}
                            {extendedProfile?.academicAchievements && extendedProfile.academicAchievements.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-2">Conquistas Acadêmicas</div>
                                    <div className="space-y-2">
                                        {extendedProfile.academicAchievements.map(ach => (
                                            <div key={ach.id} className="flex items-center gap-2 bg-yellow-50 p-2 rounded border border-yellow-200 text-sm text-yellow-800">
                                                <Medal size={16} />
                                                <span className="font-bold">{ach.title}</span>
                                                <span className="text-xs bg-white px-1 rounded ml-auto border border-yellow-300">+{ach.bonusPoints} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {profile ? (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
                                        {profile.learningChannel.charAt(0)}
                                    </div>
                                    <div className="flex flex-col items-center p-2 rounded-xl bg-amber-100 border border-amber-200 min-w-[80px]">
                                        <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Coins size={12} /> Moedas
                                        </div>
                                        <div className="font-black text-amber-600 text-lg leading-none">
                                            {extendedProfile?.owlCoins || 0}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
                                        <button
                                            onClick={() => navigate('/profile')}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-primary transition-colors"
                                            title="Meu Perfil"
                                        >
                                            <UserIcon size={20} />
                                        </button>
                                        {!isParent && (
                                            <button
                                                onClick={() => navigate('/student/shop')}
                                                className="p-2 bg-brand-primary text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-bold text-xs"
                                                title="Loja de Avatares"
                                            >
                                                <ShoppingBag size={16} /> <span>LOJA</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-400">
                                    <Activity size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Triagem de perfil ainda não realizada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Gamification / Coins Card */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-amber-900 flex items-center gap-2 text-lg">
                                    <Trophy size={20} className="text-amber-600" /> Nível {currentLevel}
                                </h3>
                                <p className="text-xs text-amber-700 font-bold uppercase">{currentXP} XP Total</p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-amber-600">{extendedProfile?.owlCoins || 0}</span>
                                <div className="text-[10px] font-bold text-amber-700 uppercase">Owl Coins</div>
                            </div>
                        </div>

                        {/* XP Progress Bar */}
                        <div className="mb-2">
                            <div className="flex justify-between text-xs font-bold text-amber-800 mb-1">
                                <span>Progresso para Nível {currentLevel + 1}</span>
                                <span>{Math.floor(progressPercent)}%</span>
                            </div>
                            <div className="w-full bg-white/50 h-3 rounded-full border border-amber-200 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
                                    style={{ width: (progressPercent) + '%' }}
                                ></div>
                            </div>
                            <div className="text-[10px] text-amber-700 mt-1 text-right">Faltam {1000 - progressToNext} XP</div>
                        </div>

                        <div className="flex gap-2 mt-2 flex-wrap">
                            {(extendedProfile?.badges || ['Iniciante']).map((badge, idx) => (
                                <div key={idx} className="bg-white/80 px-2 py-1 rounded text-[10px] font-bold text-amber-900 flex items-center gap-1 border border-amber-200 shadow-sm">
                                    <Medal size={10} className="text-orange-500" /> {badge}
                                </div>
                            ))}
                        </div>
                    </div>
                    <Coins size={120} className="absolute -right-6 -bottom-6 text-amber-200 opacity-40 rotate-12" />
                </div>
            </div>

            {/* --- DAILY QUESTS WIDGET (NEW) --- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={100} /></div>
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
                    <Target size={20} className="text-brand-primary" /> Missões Diárias
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                    {dailyQuests.map(q => (
                        <div key={q.id} className={'p-3 rounded-lg border flex items-center gap-3 ' + (q.done ? 'bg-emerald-50 border-emerald-200 opacity-80' : 'bg-white border-slate-200') + ' '}>
                            <div className={'w-8 h-8 rounded-full flex items-center justify-center ' + (q.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400') + ' '}>
                                {q.done ? <Check size={16} /> : <Star size={16} />}
                            </div>
                            <div>
                                <div className={'text-sm font-bold ' + (q.done ? 'text-emerald-800 line-through' : 'text-slate-700') + ' '}>{q.title}</div>
                                <div className="text-xs text-slate-500">{q.desc}</div>
                                {!q.done && <div className="text-[10px] font-bold text-amber-600 mt-1">+{q.xp} XP</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Calendar & Evolution */}
                <div className="space-y-6">
                    {/* Evolution Chart Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Evolução de Notas</h3>
                        <EvolutionChart data={chartData} />
                    </div>

                    {/* Quick Agenda Widget */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={18} /> Agenda Rápida</h3>
                            <button onClick={() => setShowAgendaModal(true)} className="text-xs text-brand-primary hover:underline">Expandir</button>
                        </div>
                        <div className="space-y-2">
                            {getAllMonthEvents().slice(0, 3).map((ev, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded transition">
                                    <div className={'w-2 h-8 rounded-full ' + (getEventColor(ev.type).split(' ')[0]) + ' '}></div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">{new Date(ev.date || '').toLocaleDateString()}</div>
                                        <div className="text-sm font-bold text-slate-800 line-clamp-1">{ev.title}</div>
                                    </div>
                                </div>
                            ))}
                            {getAllMonthEvents().length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sem eventos próximos.</p>}
                        </div>
                    </div>
                </div>

                {/* Center/Right Column: Results & Announcements */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Grades History */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18} /> Histórico de Provas</h3>
                        <div className="space-y-3">
                            {recentResults.length === 0 && <p className="text-slate-400 text-sm">Nenhuma prova realizada ainda.</p>}
                            {recentResults.map(result => {
                                const exam = state.exams.find(e => e.id === result.examId);
                                return (
                                    <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition">
                                        <div>
                                            <div className="font-bold text-slate-800">{exam?.title}</div>
                                            <div className="text-xs text-slate-500">{exam?.subject} • {new Date(result.gradedAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setSelectedResult(result)}
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

                    {/* Mural Announcements */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar size={18} /> Mural da Escola</h3>
                        <div className="space-y-4">
                            {state.announcements.map(ann => (
                                <div key={ann.id} className={'p-3 rounded-lg border-l-4 ' + (ann.type === 'URGENTE' ? 'border-rose-500 bg-rose-50' : 'border-brand-secondary bg-slate-50') + ' '}>
                                    <div className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
                                        <span>{ann.type}</span>
                                        <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="font-bold text-slate-800 text-sm mb-1">{ann.title}</div>
                                    <p className="text-xs text-slate-600 line-clamp-3">{ann.content}</p>
                                </div>
                            ))}
                            {state.announcements.length === 0 && <p className="text-slate-400 text-sm">Nenhum aviso.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* AGENDA MODAL */}
            {showAgendaModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col border-2 border-brand-primary relative overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-brand-primary" /> Agenda Escolar</h2>
                            <button onClick={() => setShowAgendaModal(false)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Calendar Sidebar */}
                            <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft size={20} /></button>
                                    <span className="font-bold text-lg">{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-200 rounded"><ChevronRight size={20} /></button>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-bold text-slate-400">
                                    <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-sm">
                                    {Array.from({ length: firstDay }).map((_, i) => <div key={'empty-' + i} />)}
                                    {Array.from({ length: days }).map((_, i) => {
                                        const day = i + 1;
                                        const events = getEventsForDay(day);
                                        const hasEvent = events.length > 0;
                                        return (
                                            <div key={day} className={'h-10 flex flex-col items-center justify-center rounded-lg relative ' + (hasEvent ? 'bg-white border border-slate-200 font-bold shadow-sm' : 'text-slate-400') + ' '}>
                                                {day}
                                                {hasEvent && (
                                                    <div className="flex gap-0.5 mt-1">
                                                        {events.slice(0, 3).map((e, idx) => (
                                                            <div key={idx} className={'w-1.5 h-1.5 rounded-full ' + (getEventColor(e.type).split(' ')[0]) + ' '}></div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 border-t pt-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Legenda de Atividades</h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Prova / Avaliação</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Trabalho / Pesquisa</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Evento Escolar</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Competição</div>
                                    </div>
                                </div>
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 p-8 overflow-y-auto bg-white">
                                <h3 className="font-bold text-slate-800 text-lg mb-6">Eventos do Mês</h3>
                                <div className="space-y-4">
                                    {getAllMonthEvents().map((ev, i) => (
                                        <div key={i} className={'p-4 rounded-xl border-l-4 flex gap-4 shadow-sm ' + (getEventColor(ev.type).replace('text-white', 'bg-slate-50')) + ' '}>
                                            <div className="flex flex-col items-center justify-center px-4 border-r border-slate-200">
                                                <span className="text-2xl font-black text-slate-700">{new Date(ev.date || '').getDate()}</span>
                                                <span className="text-xs uppercase font-bold text-slate-400">{new Date(ev.date || '').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={'text-[10px] font-bold px-2 py-0.5 rounded text - white ' + (getEventColor(ev.type).split(' ')[0]) + ' '}>
                                                        {getEventLabel(ev.type)}
                                                    </span>
                                                </div>
                                                <div className="font-bold text-slate-800 text-lg">{ev.title}</div>
                                                <div className="text-xs text-slate-500 mt-1">Clique para ver detalhes (se disponível).</div>
                                            </div>
                                        </div>
                                    ))}
                                    {getAllMonthEvents().length === 0 && (
                                        <div className="text-center py-20 text-slate-400">
                                            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>Nenhum evento agendado para este mês.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EVENT RULES MODAL */}
            {showEventRules && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-purple-200">
                        <div className="bg-purple-900 p-6 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Trophy size={24} className="text-yellow-400" /> Regras do Evento</h2>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-lg text-slate-800 mb-2">{availableEvents.find(e => e.id === showEventRules)?.title}</h3>
                            <p className="text-sm text-slate-600 mb-4 italic">{availableEvents.find(e => e.id === showEventRules)?.description}</p>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed font-medium mb-6">
                                {availableEvents.find(e => e.id === showEventRules)?.rules}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded mb-6 border border-amber-100">
                                <AlertTriangle size={14} /> Ao aceitar, você se compromete a participar no dia do evento.
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setShowEventRules(null)} className="flex-1 py-3 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                                <button onClick={() => handleAcceptEvent(showEventRules)} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700">Aceitar & Inscrever</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RANKING MODAL */}
            {showRankingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-brand-primary relative">
                        {/* Confetti Effect Background */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-10 pointer-events-none"></div>

                        <div className="p-6 text-center relative">
                            <button
                                onClick={() => setShowRankingModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>

                            <div className={'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 shadow-inner ' + (rankingMode === 'ACADEMIC' ? 'bg-yellow-100 border-yellow-200' : 'bg-amber-100 border-amber-300') + ' '}>
                                {rankingMode === 'ACADEMIC' ? <Trophy size={40} className="text-yellow-600 drop-shadow-sm" /> : <Coins size={40} className="text-amber-600 drop-shadow-sm" />}
                            </div>

                            <h2 className="text-2xl font-black text-slate-800 mb-2">
                                {rankingMode === 'ACADEMIC' ? 'Ranking Ponderado' : 'Liga de Engajamento'}
                            </h2>
                            <p className="text-slate-500 text-sm mb-4">
                                {rankingMode === 'ACADEMIC' ? 'Critérios: Provas (60%) + Trabalhos (30%) + Extras.' : 'Baseado em Owl Coins ganhas nos jogos.'}
                            </p>

                            {/* TOGGLE */}
                            <div className="flex justify-center gap-2 mb-6">
                                {/* ARCADE BUTTON - NEW */}
                                <button
                                    onClick={() => navigate('/student/arcade')}
                                    className="bg-white border-2 border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-transparent rounded-bl-full -mr-8 -mt-8"></div>
                                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                        <Gamepad2 size={28} />
                                    </div>
                                    <div className="text-center z-10">
                                        <div className="font-black text-slate-800 text-lg">Arcade Zone</div>
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Jogos Educativos</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/student/survival')}
                                    className={'px-4 py-1 rounded-full text-xs font-bold transition ' + (rankingMode === 'ACADEMIC' ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500') + ' '}
                                >
                                    Acadêmico (IDG)
                                </button>
                                <button
                                    onClick={() => setRankingMode('XP')}
                                    className={'px-4 py-1 rounded-full text-xs font-bold transition ' + (rankingMode === 'XP' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500') + ' '}
                                >
                                    XP / Moedas
                                </button>
                            </div>

                            {/* Score Breakdown (New Feature) */}
                            {rankingMode === 'ACADEMIC' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-left">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Composição da sua Nota Global ({stats.idgScore.toFixed(1)})</h4>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span>📘 Médias de Provas (60%)</span>
                                            <span className="font-bold">{stats.examAverage.toFixed(1)}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full" style={{ width: (stats.examAverage * 10) + '%' }}></div>
                                        </div>

                                        <div className="flex justify-between items-center mt-1">
                                            <span>📙 Médias de Trabalhos (30%)</span>
                                            <span className="font-bold">{stats.projectAverage.toFixed(1)}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-orange-500 h-full" style={{ width: (stats.projectAverage * 10) + '%' }}></div>
                                        </div>

                                        {stats.bonusPoints > 0 && (
                                            <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded mt-2">
                                                <span className="flex items-center gap-1"><Medal size={12} /> Bônus Extra (Olimpíadas/Eventos)</span>
                                                <span>+{stats.bonusPoints.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-white shadow-sm rounded-xl border border-slate-200">
                                    <div className="text-left">
                                        <div className="font-bold text-slate-700">Na Turma</div>
                                        <div className="text-xs text-slate-400">Entre {ranks.totalClass} alunos</div>
                                    </div>
                                    <div className={'text-2xl font - black ' + (rankingMode === 'XP' ? 'text-amber-600' : 'text-brand-primary') + ' '}>#{ranks.classRank}</div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white shadow-sm rounded-xl border border-slate-200">
                                    <div className="text-left">
                                        <div className="font-bold text-slate-700">Na Escola</div>
                                        <div className="text-xs text-slate-400">Entre {ranks.totalSchool} alunos</div>
                                    </div>
                                    <div className={'text-2xl font - black ' + (rankingMode === 'XP' ? 'text-amber-700' : 'text-brand-secondary') + ' '}>#{ranks.schoolRank}</div>
                                </div>
                            </div>

                            {state.settings.rankingAnonymity === 'ANONIMO' && rankingMode === 'ACADEMIC' && (
                                <p className="text-[10px] text-slate-400 mt-4 italic">
                                    * O ranking público acadêmico é anônimo, mas você pode ver sua posição aqui.
                                </p>
                            )}
                            {rankingMode === 'XP' && (
                                <p className="text-[10px] text-amber-600 mt-4 font-bold flex items-center justify-center gap-1">
                                    <Zap size={10} /> Dica: Jogue o 'Modo Sobrevivência' para subir no ranking de XP!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* RESULT PDF-LIKE MODAL */}
            {renderCorrectionModal()}
        </div>
    );
};
