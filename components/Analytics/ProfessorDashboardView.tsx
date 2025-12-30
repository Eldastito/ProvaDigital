
import React, { useState, useMemo } from 'react';
import { FileText, Plus, Tablet, Users, Brain, ClipboardCheck, ArrowRight, Search, ShieldAlert, Clock, Star, Target, Activity, AlertTriangle, CheckSquare, Zap, ShieldCheck, Sparkles, X, Loader2, Download, Info, Check, XCircle, Calendar, MapPin, School as SchoolIcon } from 'lucide-react';
import { AppState, UserRole, ExamStatus, Student, SchoolClass, ExamResult, Exam, ExamRegistration, UserProfileExtended, RiskLevel, DailyAttendance } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchStudents, fetchClasses, fetchExams, fetchResults, fetchRegistrations, fetchUserProfiles, insertLessonPlan, fetchAttendance, upsertAttendance } from '../../services/supabaseClient';
import { generateLessonPlanSuggestions } from '../../services/geminiService';
import { uuidv4 } from '../../utils/helpers';

export const ProfessorDashboardView = ({ state, setView }: { state: AppState, setView: (v: string) => void }) => {
    const { currentUser } = state;
    const analytics = useMemo(() => new AnalyticsService(), []);

    const [activeSection, setActiveSection] = useState<'ANALYTICS' | 'ATTENDANCE'>('ANALYTICS');

    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allClasses } = useQuery<SchoolClass[]>({ queryKey: ['classes'], queryFn: fetchClasses, initialData: [] });
    const { data: allExams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams, initialData: [] });
    const { data: allResults } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults, initialData: [] });
    const { data: allRegistrations } = useQuery<ExamRegistration[]>({ queryKey: ['registrations'], queryFn: fetchRegistrations, initialData: [] });
    const { data: allUserProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });
    
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: todayAttendance } = useQuery<DailyAttendance[]>({ 
        queryKey: ['attendance', todayStr], 
        queryFn: () => fetchAttendance(todayStr),
        initialData: [] 
    });

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [isLessonPlanModalOpen, setIsLessonPlanModalOpen] = useState(false);
    const [lessonPlanTopic, setLessonPlanTopic] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Filtra apenas as turmas que o professor logado tem aula
    const professorClasses = useMemo(() => 
        (allClasses || []).filter(c => currentUser?.classIds?.includes(c.id)),
    [allClasses, currentUser]);

    React.useEffect(() => {
        if (professorClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(professorClasses[0].id);
        }
    }, [professorClasses, selectedClassId]);

    const studentStats = useMemo(() => {
        const classStudents = (allStudents || []).filter(s => s.classId === selectedClassId);
        return classStudents.map(s => {
            const stats = analytics.getStudentStats(s.id, allStudents || [], allResults || [], allExams || [], allRegistrations || [], allUserProfiles || []);
            const rankings = analytics.getRankings(s.id, allStudents || [], allResults || [], allExams || [], allRegistrations || [], allUserProfiles || []);
            const results = (allResults || []).filter(r => r.studentId === s.id);
            const violations = results.reduce((acc, r) => acc + (r.violationCount || 0), 0);
            const presence = todayAttendance?.find(a => a.studentId === s.id);
            return { ...s, stats, rankings, violations, presence };
        });
    }, [selectedClassId, allStudents, allResults, allExams, allRegistrations, allUserProfiles, todayAttendance, analytics]);

    const metrics = useMemo(() => {
        if (studentStats.length === 0) return { avg: 0, risk: 0, violations: 0 };
        const avg = studentStats.reduce((acc, s) => acc + (s.stats?.idgScore || 0), 0) / studentStats.length;
        const risk = studentStats.filter(s => s.stats?.riskLevel !== RiskLevel.LOW).length;
        const violations = studentStats.reduce((acc, s) => acc + s.violations, 0);
        return { avg, risk, violations };
    }, [studentStats]);

    const attendanceMutation = useMutation({
        mutationFn: upsertAttendance,
        onSuccess: () => {
            // Sucesso silencioso para feedback fluido
        }
    });

    const togglePresence = (studentId: string, currentStatus: 'PRESENT' | 'ABSENT' | undefined) => {
        const nextStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
        const attendance: DailyAttendance = {
            id: `${todayStr}_${studentId}`,
            studentId,
            classId: selectedClassId,
            professorId: currentUser?.id || '',
            date: todayStr,
            status: nextStatus,
            timestamp: new Date().toISOString()
        };
        attendanceMutation.mutate([attendance]);
    };

    const handleGenerateLessonPlan = async () => {
        if (!lessonPlanTopic.trim()) return;
        setIsGenerating(true);
        try {
            const currentClass = professorClasses.find(c => c.id === selectedClassId);
            const plan = await generateLessonPlanSuggestions(
                lessonPlanTopic,
                "Disciplina Geral",
                currentClass?.series || "Ensino Fundamental",
                "" 
            );
            setGeneratedPlan(plan);
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar plano de aula.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
            {/* Header com Ações Rápidas */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-brand-dark tracking-tighter uppercase italic">Painel Pedagógico</h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Gestão de turmas e monitoramento de aprendizagem.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setView('TABLET_LAUNCHER')} className="bg-emerald-600 text-white px-6 py-4 rounded-[1.5rem] flex items-center gap-3 hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20 font-black text-sm uppercase tracking-wider">
                        <Tablet size={20}/> Iniciar Prova
                    </button>
                    <button onClick={() => setIsLessonPlanModalOpen(true)} className="btn-premium px-6 py-4 rounded-[1.5rem] flex items-center gap-3 shadow-xl font-black text-sm uppercase tracking-wider">
                        <Sparkles size={20}/> Gerar Aula IA
                    </button>
                </div>
            </div>

            {/* Abas Superiores */}
            <div className="flex gap-4 border-b border-slate-200">
                <button 
                    onClick={() => setActiveSection('ANALYTICS')}
                    className={`pb-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeSection === 'ANALYTICS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
                >
                    Saúde da Turma (Analytics)
                </button>
                <button 
                    onClick={() => setActiveSection('ATTENDANCE')}
                    className={`pb-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${activeSection === 'ATTENDANCE' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
                >
                    <CheckSquare size={16}/> Diário de Classe (Presença)
                </button>
            </div>

            {/* Seletor de Turma Fixo */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Minhas Turmas Ativas</label>
                    <div className="relative">
                        <select className="w-full border-2 border-slate-50 rounded-2xl p-4 font-black text-brand-dark focus:ring-4 focus:ring-brand-primary/10 outline-none bg-slate-50 appearance-none transition-all" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                            {professorClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.series}</option>)}
                            {professorClasses.length === 0 && <option>Sem turmas atribuídas</option>}
                        </select>
                        <ArrowRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none"/>
                    </div>
                </div>
                <div className="flex-shrink-0 bg-indigo-50 p-5 rounded-2xl text-center border border-indigo-100">
                     <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Alunos</div>
                     <div className="text-2xl font-black text-indigo-600">{studentStats.length}</div>
                </div>
            </div>

            {activeSection === 'ANALYTICS' ? (
                <>
                    {/* KPIs Operacionais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl text-center flex flex-col justify-center group hover:border-brand-primary transition-colors">
                            <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                                <Star size={16} className="text-amber-500" fill="currentColor"/>
                                <span className="text-[10px] font-black uppercase tracking-widest">Média Turma (IDG)</span>
                            </div>
                            <div className="text-5xl font-black text-brand-dark tracking-tighter">{metrics.avg.toFixed(1)}</div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-xl text-center flex flex-col justify-center group hover:bg-rose-50 transition-colors">
                            <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                                <AlertTriangle size={16} className="text-rose-500"/>
                                <span className="text-[10px] font-black uppercase tracking-widest">Alunos em Risco</span>
                            </div>
                            <div className="text-5xl font-black text-rose-600 tracking-tighter">{metrics.risk}</div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-amber-100 shadow-xl text-center flex flex-col justify-center group hover:bg-amber-50 transition-colors">
                            <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                                <ShieldAlert size={16} className="text-amber-600"/>
                                <span className="text-[10px] font-black uppercase tracking-widest">Incidentes Anti-Cola</span>
                            </div>
                            <div className="text-5xl font-black text-amber-600 tracking-tighter">{metrics.violations}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Lista de Alunos e Saúde Acadêmica */}
                        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-8 bg-slate-50/50 border-b flex justify-between items-center">
                                <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter text-lg">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-primary"><Users size={20}/></div>
                                    Monitoramento da Turma
                                </h3>
                                <span className="text-[10px] font-black text-brand-primary uppercase bg-brand-light px-4 py-2 rounded-full shadow-sm">{studentStats.length} Alunos</span>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-slate-50">
                                {studentStats.map(s => (
                                    <div key={s.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group cursor-pointer">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform group-hover:rotate-6 transition-transform ${s.stats?.riskLevel === RiskLevel.HIGH ? 'bg-rose-100 text-rose-600' : 'bg-brand-light text-indigo-600'}`}>
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 text-lg leading-none mb-1">{s.name}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">RM: {s.registrationNumber}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            <div className="text-center">
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-1">IDG</div>
                                                <div className={`font-black text-2xl ${s.stats?.idgScore! >= 6 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {s.stats?.idgScore.toFixed(1)}
                                                </div>
                                            </div>
                                            {s.violations > 0 && (
                                                <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 animate-pulse" title="Possui violações de segurança">
                                                    <ShieldAlert size={20}/>
                                                </div>
                                            )}
                                            <button className="p-3 text-slate-300 hover:text-brand-primary hover:bg-white rounded-2xl transition shadow-none hover:shadow-xl group-hover:translate-x-1">
                                                <ArrowRight size={24}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar: IA */}
                        <div className="space-y-6">
                            <div className="bg-[#0f1d2e] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border-2 border-brand-primary/20">
                                <Brain size={180} className="absolute -right-16 -bottom-16 opacity-5 rotate-12"/>
                                <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                                    <div className="p-3 bg-brand-primary/20 rounded-2xl text-brand-secondary"><Zap size={24} className="animate-pulse"/></div>
                                    Corujão IA
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="p-5 bg-white/5 border border-white/10 rounded-3xl text-sm leading-relaxed backdrop-blur-xl">
                                        <strong className="text-emerald-400 block mb-2 uppercase text-[10px] tracking-widest">Destaque do Dia:</strong> 
                                        {studentStats.length > 0 && studentStats[0].name} lidera o ranking de performance da escola nesta semana.
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                                <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                                    <div className="p-3 bg-slate-50 rounded-2xl text-brand-secondary shadow-sm"><CheckSquare size={20}/></div>
                                    Ações
                                </h3>
                                <div className="space-y-4">
                                    <div onClick={() => setView('EXAMS')} className="flex items-center gap-5 p-5 bg-slate-50 rounded-[1.5rem] hover:bg-slate-100 transition cursor-pointer group border border-slate-100">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform"><ClipboardCheck size={24}/></div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-black text-slate-800 leading-tight">Lançar Notas</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Correções pendentes</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* SEÇÃO DE PRESENÇA (DIÁRIO DE CLASSE) */
                <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                        <div className="p-8 bg-slate-50/50 border-b flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm"><Calendar size={24}/></div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-xl tracking-tighter uppercase italic">Chamada Diária</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sessão: {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-[9px] font-black text-slate-400 uppercase">Confirmados</div>
                                    <div className="text-xl font-black text-emerald-600">{studentStats.filter(s => s.presence?.status === 'PRESENT').length}</div>
                                </div>
                                <div className="w-px h-8 bg-slate-200"></div>
                                <div className="text-right">
                                    <div className="text-[9px] font-black text-slate-400 uppercase">Ausentes</div>
                                    <div className="text-xl font-black text-rose-500">{studentStats.filter(s => s.presence?.status === 'ABSENT').length}</div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-8 py-6">Estudante</th>
                                        <th className="px-6 py-6">Rankings Acadêmicos</th>
                                        <th className="px-6 py-6">IDG</th>
                                        <th className="px-8 py-6 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {studentStats.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg transition-all ${s.presence?.status === 'PRESENT' ? 'bg-emerald-500 scale-110' : s.presence?.status === 'ABSENT' ? 'bg-rose-500' : 'bg-slate-200'}`}>
                                                        {s.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-base">{s.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">RM: {s.registrationNumber}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex gap-2">
                                                    <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-blue-100 flex items-center gap-1" title="Posição na Turma">
                                                        <Users size={10}/> T: #{s.rankings.class}
                                                    </div>
                                                    <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-amber-100 flex items-center gap-1" title="Posição na Escola">
                                                        <SchoolIcon size={10}/> E: #{s.rankings.school}
                                                    </div>
                                                    <div className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-indigo-100 flex items-center gap-1" title="Posição na Rede/Estado">
                                                        <MapPin size={10}/> M: #{s.rankings.global}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className={`text-lg font-black ${s.stats?.idgScore! >= 6 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {s.stats?.idgScore.toFixed(1)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center gap-3">
                                                    <button 
                                                        onClick={() => togglePresence(s.id, s.presence?.status)}
                                                        className={`p-3 rounded-xl transition-all shadow-sm ${s.presence?.status === 'PRESENT' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-emerald-200 hover:text-emerald-500'}`}
                                                        title="Marcar como Presente"
                                                    >
                                                        <Check size={20} strokeWidth={3}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => togglePresence(s.id, s.presence?.status)}
                                                        className={`p-3 rounded-xl transition-all shadow-sm ${s.presence?.status === 'ABSENT' ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-white border-2 border-slate-100 text-slate-300 hover:border-rose-200 hover:text-rose-500'}`}
                                                        title="Marcar como Ausente"
                                                    >
                                                        <XCircle size={20} strokeWidth={3}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Plano de Aula IA */}
            {isLessonPlanModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Brain size={24}/></div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Gerador de Plano de Aula</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Assistente Gemini IA</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsLessonPlanModalOpen(false); setGeneratedPlan(null); }} className="p-2 hover:bg-slate-100 rounded-full transition"><X/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            {!generatedPlan ? (
                                <div className="space-y-6">
                                    <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl text-sm text-indigo-700 leading-relaxed">
                                        <Info size={18} className="mb-2"/>
                                        Diga-me o tema da aula e eu estruturarei Objetivos, Desenvolvimento, Materiais e códigos da BNCC para você.
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tema / Tópico da Aula</label>
                                        <textarea 
                                            className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all h-32"
                                            placeholder="Ex: Introdução à Trigonometria no Triângulo Retângulo"
                                            value={lessonPlanTopic}
                                            onChange={e => setLessonPlanTopic(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleGenerateLessonPlan}
                                        disabled={isGenerating || !lessonPlanTopic.trim()}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles size={20}/>}
                                        {isGenerating ? "Consultando Gemini..." : "Gerar Plano Estruturado"}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                                    <div className="prose prose-slate max-w-none bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                        <h3 className="font-black text-indigo-600 uppercase tracking-widest text-xs mb-4">Sugestão Gemini IA</h3>
                                        <div className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed text-sm">
                                            {generatedPlan}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => setGeneratedPlan(null)} className="flex-1 py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition">Voltar</button>
                                        <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition flex items-center justify-center gap-2">
                                            <Download size={16}/> Salvar PDF
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
