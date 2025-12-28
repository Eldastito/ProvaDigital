
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, Calendar, Brain, Trophy, Star, ArrowRight, Sparkles, Medal, 
  Target, School, MapPin, FileText, Activity, AlertCircle, Info, 
  GraduationCap, Stethoscope, Award, BarChart3, Clock, Zap, Swords, Flame, CheckCircle, Timer, BookOpen, Bot
} from 'lucide-react';
import { AppState, RiskLevel, User, Exam, ExamResult, UserRole, Student, ExamRegistration, UserProfileExtended, AssessmentResult } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { useAppStore } from '../../store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { fetchStudents, fetchResults, fetchUserProfiles, fetchExams, fetchRegistrations, fetchSchools } from '../../services/supabaseClient';
import { ScreeningReportModal } from '../NeuroScreening/ScreeningReportModal';
import { INITIAL_STUDENTS, INITIAL_RESULTS, INITIAL_EXAMS, INITIAL_REGISTRATIONS, INITIAL_USER_PROFILES } from '../../utils/mockData';

const EvolutionChart = ({ data }: { data: { label: string, value: number }[] }) => {
    if (data.length < 2) return <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic font-medium">Você ainda não tem avaliações suficientes para o gráfico.</div>;
    const height = 150; const width = 300; const padding = 20; const maxY = 10;
    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - (d.value / maxY) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');
    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#4f46e5', stopOpacity:0.3}} />
                        <stop offset="100%" style={{stopColor:'#4f46e5', stopOpacity:0}} />
                    </linearGradient>
                </defs>
                <path d={`M ${padding},${height-padding} L ${points} L ${width-padding},${height-padding} Z`} fill="url(#grad)" />
                <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => {
                    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
                    const y = height - padding - (d.value / maxY) * (height - 2 * padding);
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
                            <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#1e293b" fontWeight="bold">{d.value.toFixed(1)}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

interface StudentDashboardViewProps {
    state: AppState;
    user: User;
    setView: (v: string) => void;
}

export const StudentDashboardView = ({ state, user, setView }: StudentDashboardViewProps) => {
    const isParent = user.role === UserRole.PAIS;
    const { selectedChildId } = state;

    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allResults } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults, initialData: [] });
    const { data: allUserProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });
    const { data: allExams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams, initialData: [] });
    const { data: allRegistrations } = useQuery<ExamRegistration[]>({ queryKey: ['registrations'], queryFn: fetchRegistrations, initialData: [] });
    const { data: allSchools } = useQuery<any[]>({ queryKey: ['schools'], queryFn: fetchSchools, initialData: [] });

    // Lógica para encontrar o estudante, mesmo em mocks onde o user.id pode ser diferente do student.id
    const student = useMemo(() => {
        if (isParent) return (allStudents && allStudents.length > 0) ? allStudents.find(s => s.id === selectedChildId) : INITIAL_STUDENTS.find(s => s.id === selectedChildId);
        const found = allStudents?.find(s => s.id === user.id);
        return found || (allStudents && allStudents.length > 0 ? allStudents[0] : INITIAL_STUDENTS[0]); 
    }, [allStudents, user.id, isParent, selectedChildId]);

    const studentSchool = allSchools?.find(s => s.id === student?.schoolId);

    const analytics = useMemo(() => new AnalyticsService(), []);
    
    // Garantir que temos dados para o analytics (fallback para mocks se Supabase estiver vazio)
    const effectiveStudents = allStudents && allStudents.length > 0 ? allStudents : INITIAL_STUDENTS;
    const effectiveResults = allResults && allResults.length > 0 ? allResults : INITIAL_RESULTS;
    const effectiveExams = allExams && allExams.length > 0 ? allExams : INITIAL_EXAMS;
    const effectiveRegistrations = allRegistrations && allRegistrations.length > 0 ? allRegistrations : INITIAL_REGISTRATIONS;
    const effectiveProfiles = allUserProfiles && allUserProfiles.length > 0 ? allUserProfiles : INITIAL_USER_PROFILES;

    const stats = student ? analytics.getStudentStats(student.id, effectiveStudents, effectiveResults, effectiveExams, effectiveRegistrations, effectiveProfiles) : null;
    const extendedProfile = student ? effectiveProfiles.find(p => p.userId === student.id) : null;
    
    const rankingPosition = useMemo(() => {
        if (!student) return null;
        const classRanking = analytics.getClassRanking(student.classId, effectiveStudents, effectiveResults, effectiveExams, effectiveRegistrations, effectiveProfiles);
        const pos = classRanking.findIndex(r => r.studentId === student.id) + 1;
        return { pos, total: classRanking.length };
    }, [student, effectiveStudents, effectiveResults, effectiveExams, effectiveRegistrations, effectiveProfiles]);

    const [selectedReport, setSelectedReport] = useState<AssessmentResult | null>(null);

    if (!student || !stats) return <div className="p-20 text-center flex flex-col items-center">
        <Activity size={48} className="animate-spin text-indigo-500 mb-4"/>
        <p className="font-black text-slate-400 uppercase tracking-widest">Sincronizando prontuário acadêmico...</p>
    </div>;

    const chartData = effectiveResults
        .filter(r => r.studentId === student.id)
        .sort((a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime())
        .map(r => ({
            label: effectiveExams?.find(e => e.id === r.examId)?.subject.slice(0,3) || 'Av',
            value: r.totalScore
        })).slice(-6);

    const screeningResults = extendedProfile?.assessments.filter(a => a.type.includes('SCREENING')) || [];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-700">
            
            {/* Boas Vindas */}
            <div className="bg-[#0f172a] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border-t-4 border-indigo-500">
                <div className="absolute top-0 right-0 p-12 opacity-[0.05] rotate-12">
                    <Trophy size={200} className="text-white" />
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center font-black text-4xl text-white shadow-xl rotate-3">
                                {student.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0f172a] font-black text-xs">
                                Lvl 5
                            </div>
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white tracking-tight mb-2">
                                {isParent ? `Painel de ${student.name.split(' ')[0]}` : `E aí, ${student.name.split(' ')[0]}!`}
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                <span className="bg-white/10 text-indigo-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-white/5 tracking-widest">RM: {student.registrationNumber}</span>
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-full border border-emerald-500/30 tracking-widest">{studentSchool?.name || 'Rede ExamePad'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center min-w-[120px]">
                            <div className="text-amber-400 mb-1 flex justify-center"><Star size={20} fill="currentColor"/></div>
                            <div className="text-2xl font-black text-white">{extendedProfile?.owlCoins || 0}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase">Moedas</div>
                        </div>
                        <div className="bg-indigo-600 p-5 rounded-3xl text-center min-w-[120px] shadow-lg shadow-indigo-600/20">
                            <div className="text-white mb-1 flex justify-center"><Trophy size={20}/></div>
                            <div className="text-2xl font-black text-white">{rankingPosition?.pos}º</div>
                            <div className="text-[9px] font-black text-indigo-200 uppercase">Ranking</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lado Esquerdo: Métricas e Gráficos */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center group hover:scale-[1.02] transition-all">
                            <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Poder Acadêmico (IDG)</div>
                            <div className="text-6xl font-black text-slate-900 tracking-tighter">{stats.idgScore.toFixed(1)}</div>
                            <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden">
                                <div className="bg-indigo-500 h-full transition-all duration-1000" style={{width: `${stats.idgScore * 10}%`}}></div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center group hover:scale-[1.02] transition-all">
                            <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Frequência</div>
                            <div className="text-6xl font-black text-emerald-600 tracking-tighter">{stats.attendanceRate}%</div>
                            <p className="text-[10px] text-slate-400 mt-6 font-black uppercase">Participação Ativa</p>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl shadow-xl text-center text-white relative overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className="absolute -right-4 -bottom-4 opacity-20"><Zap size={100}/></div>
                            <div className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Insígnias</div>
                            <div className="text-6xl font-black tracking-tighter">{extendedProfile?.badges?.length || 0}</div>
                            <div className="mt-6 flex justify-center -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-indigo-400 flex items-center justify-center">
                                        <Award size={14}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Evolução */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><TrendingUp size={24}/></div>
                                Evolução das Notas
                            </h3>
                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-600">Ver Boletim Completo</button>
                        </div>
                        <div className="h-64">
                            <EvolutionChart data={chartData} />
                        </div>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm"><Sparkles size={20}/></div>
                                <div>
                                    <div className="text-[9px] font-black text-emerald-600 uppercase mb-0.5">Destaque</div>
                                    <div className="font-black text-slate-800 uppercase">{stats.strongestSubject}</div>
                                </div>
                            </div>
                            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl text-amber-600 shadow-sm"><Target size={20}/></div>
                                <div>
                                    <div className="text-[9px] font-black text-amber-600 uppercase mb-0.5">Focar Estudos</div>
                                    <div className="font-black text-slate-800 uppercase">{stats.weakestSubject}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar do Dashboard */}
                <div className="space-y-8">
                    {/* Acesso Rápido - Ferramentas de Apoio (FIX: Added setView actions) */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase text-xs tracking-wider">
                            <Zap size={20} className="text-amber-500"/> Apoio ao Estudo
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                             <div onClick={() => setView('LEARNING_PATH')} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center hover:bg-indigo-50 transition cursor-pointer group">
                                <Timer size={24} className="mx-auto mb-2 text-indigo-500 group-hover:scale-110 transition"/>
                                <span className="text-[9px] font-black uppercase text-slate-400">Pomodoro</span>
                             </div>
                             <div onClick={() => setView('LEARNING_PATH')} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center hover:bg-emerald-50 transition cursor-pointer group">
                                <BookOpen size={24} className="mx-auto mb-2 text-emerald-500 group-hover:scale-110 transition"/>
                                <span className="text-[9px] font-black uppercase text-slate-400">Materiais</span>
                             </div>
                             <div onClick={() => setView('OWL_TUTOR')} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center hover:bg-purple-50 transition cursor-pointer group">
                                <Bot size={24} className="mx-auto mb-2 text-purple-500 group-hover:scale-110 transition"/>
                                <span className="text-[9px] font-black uppercase text-slate-400">Tutor IA</span>
                             </div>
                             <div onClick={() => setView('LEARNING_PATH')} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center hover:bg-rose-50 transition cursor-pointer group">
                                <Target size={24} className="mx-auto mb-2 text-rose-500 group-hover:scale-110 transition"/>
                                <span className="text-[9px] font-black uppercase text-slate-400">Plano IA</span>
                             </div>
                        </div>
                    </div>

                    {/* Próximas Atividades */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase text-xs tracking-wider">
                            <Calendar size={20} className="text-indigo-600"/> Agenda de Provas
                        </h3>
                        <div className="space-y-4">
                            {effectiveExams?.filter(e => e.classIds.includes(student.classId) && new Date(e.scheduledDate || '') >= new Date()).slice(0, 2).map(exam => (
                                <div key={exam.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-500 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exam.subject}</div>
                                        <div className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-100">
                                            {new Date(exam.scheduledDate!).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                        </div>
                                    </div>
                                    <div className="font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{exam.title}</div>
                                </div>
                            ))}
                            {effectiveExams?.length === 0 && <p className="text-[10px] text-slate-400 italic">Nenhuma prova agendada.</p>}
                        </div>
                    </div>

                    {/* Saúde e Desenvolvimento */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase text-xs tracking-wider">
                            <Stethoscope size={20} className="text-rose-500"/> Desenvolvimento
                        </h3>
                        <div className="space-y-3">
                            {screeningResults.length > 0 ? (
                                screeningResults.map(res => (
                                    <button 
                                        key={res.id}
                                        onClick={() => setSelectedReport(res)}
                                        className="w-full text-left p-4 bg-slate-50 hover:bg-rose border border-slate-100 rounded-2xl transition group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm text-rose-500">
                                                <FileText size={18}/>
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-800 uppercase truncate max-w-[120px]">{res.type.replace('TRIAGEM_', '')}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(res.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-300 group-hover:text-rose-600" />
                                    </button>
                                ))
                            ) : (
                                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Info size={24} className="mx-auto mb-2 text-slate-300"/>
                                    <p className="text-[10px] font-black text-slate-400 uppercase leading-tight">Nenhum laudo clínico para visualizar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Laudo */}
            {selectedReport && student && (
                <ScreeningReportModal 
                    report={selectedReport}
                    studentName={student.name}
                    studentId={student.registrationNumber}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </div>
    );
};
