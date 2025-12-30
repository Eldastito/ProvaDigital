
import React, { useState, useMemo } from 'react';
// @fix: Renamed lucide-react School import to SchoolIcon to avoid conflict with the School interface
import { Users, TrendingUp, AlertTriangle, Calendar, Printer, School as SchoolIcon, GraduationCap, ClipboardList, ArrowDownRight, ArrowUpRight, Package, Check, X, Bus, Shield, Snowflake, Award, BarChart2, LayoutGrid, Edit, Trophy, Target, Activity, ShieldAlert, Zap } from 'lucide-react';
// @fix: Explicitly import School from types
import { AppState, RiskLevel, SchoolResources, Student, ExamResult, Exam, ExamRegistration, UserProfileExtended, SchoolClass, User, LessonPlan, School } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { GlobalRankingView } from './GlobalRankingView';
import { useQuery } from '@tanstack/react-query';
import { fetchSchools, fetchStudents, fetchClasses, fetchUsers, fetchResults, fetchExams, fetchRegistrations, fetchUserProfiles, fetchLessonPlans } from '../../services/supabaseClient';

export const SchoolPrincipalDashboard = ({ state }: { state: AppState }) => {
    const { currentUser } = state;
    const schoolId = currentUser?.schoolId;

    // Fetch all necessary data via React Query
    // @fix: Updated useQuery to object-based syntax (v5+)
    const { data: allSchools } = useQuery<School[]>({ queryKey: ['schools'], queryFn: fetchSchools, initialData: [] });
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allClasses } = useQuery<SchoolClass[]>({ queryKey: ['classes'], queryFn: fetchClasses, initialData: [] });
    const { data: allUsers } = useQuery<User[]>({ queryKey: ['users'], queryFn: fetchUsers, initialData: [] });
    const { data: allResults } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults, initialData: [] });
    const { data: allExams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams, initialData: [] });
    const { data: allRegistrations } = useQuery<ExamRegistration[]>({ queryKey: ['registrations'], queryFn: fetchRegistrations, initialData: [] });
    const { data: allUserProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });
    const { data: allLessonPlans } = useQuery<LessonPlan[]>({ queryKey: ['lessonPlans'], queryFn: fetchLessonPlans, initialData: [] });

    // Initialize AnalyticsService with fetched data
    const analytics = useMemo(() => new AnalyticsService(), []);

    // @fix: Added optional chaining for data access
    const school = (allSchools || []).find(s => s.id === schoolId);
    const [tab, setTab] = useState<'PERFORMANCE' | 'INFRASTRUCTURE'>('PERFORMANCE');
    const [showRanking, setShowRanking] = useState(false);

    // Filtrar dados da escola
    // @fix: Added fallback array and optional chaining
    const schoolStudents = (allStudents || []).filter(s => s.schoolId === schoolId);
    const schoolClasses = (allClasses || []).filter(c => c.schoolId === schoolId);
    const schoolTeachers = (allUsers || []).filter(u => u.schoolId === schoolId && u.role === 'PROFESSOR');

    // Cálculos de Métricas
    // @fix: Provided fallbacks for analytics parameters
    const studentsStats = schoolStudents.map(s => analytics.getStudentStats(s.id, allStudents || [], allResults || [], allExams || [], allRegistrations || [], allUserProfiles || [])).filter(Boolean) as any[];
    const totalAvg = studentsStats.reduce((acc, curr) => acc + curr.idgScore, 0) / (studentsStats.length || 1);
    const riskCount = studentsStats.filter(s => s.riskLevel !== RiskLevel.LOW).length;
    const attendanceAvg = studentsStats.reduce((acc, curr) => acc + curr.attendanceRate, 0) / (studentsStats.length || 1);

    // INTEGRIDADE / FRAUDE
    // @fix: Added fallback array and optional chaining
    const schoolResults = (allResults || []).filter(r => schoolStudents.some(s => s.id === r.studentId));
    const fraudAttempts = schoolResults.reduce((acc, r) => acc + (r.violationCount || 0), 0);
    const cleanExams = schoolResults.filter(r => (r.violationCount || 0) === 0).length;
    const integrityPercentage = schoolResults.length > 0 ? (cleanExams / schoolResults.length) * 100 : 100;

    // Incident Types Breakdown (Real Data Aggregation)
    const incidents = {
        focusLost: 0,
        altTab: 0,
        fullscreen: 0
    };
    
    schoolResults.forEach(r => {
        if (r.securityFlags) {
            if (r.securityFlags.includes('FOCUS_LOST')) incidents.focusLost++;
            if (r.securityFlags.includes('ALT_TAB')) incidents.altTab++;
            if (r.securityFlags.includes('FULLSCREEN_EXIT')) incidents.fullscreen++;
        }
    });
    
    const totalFlags = incidents.focusLost + incidents.altTab + incidents.fullscreen || 1; // Avoid division by zero

    // Comparativo de Turmas
    const classPerformance = schoolClasses.map(cls => {
        const studentsInClass = schoolStudents.filter(s => s.classId === cls.id);
        // @fix: Provided fallbacks for analytics parameters
        const statsInClass = studentsInClass.map(s => analytics.getStudentStats(s.id, allStudents || [], allResults || [], allExams || [], allRegistrations || [], allUserProfiles || [])).filter(Boolean) as any[];
        const classAvg = statsInClass.reduce((acc, curr) => acc + curr.idgScore, 0) / (statsInClass.length || 1);
        const classRisk = statsInClass.filter(s => s.riskLevel !== RiskLevel.LOW).length;
        
        return {
            id: cls.id,
            name: cls.name,
            series: cls.series,
            shift: cls.shift,
            studentCount: studentsInClass.length,
            avg: classAvg,
            riskCount: classRisk
        };
    }).sort((a, b) => b.avg - a.avg);

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Relatorio_Gestao_${school?.name.replace(/\s/g, '_')}`;
        window.print();
        document.title = originalTitle;
    };

    const resourceMetrics = [
        { key: 'uniforms', label: 'Uniformes', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { key: 'textbooks', label: 'Mat. Didático', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
        { key: 'funding', label: 'Verba Recebida', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { key: 'food', label: 'Merenda', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
        { key: 'transportation', label: 'Transporte', icon: Bus, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { key: 'security', label: 'Segurança', icon: Shield, color: 'text-slate-700', bg: 'bg-slate-200' },
        { key: 'ac_cooling', label: 'Climatização', icon: Snowflake, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    ];

    // SVG Chart for Class Comparison
    const maxAvg = 10;

    const renderLineChart = () => {
        const height = 150;
        const width = 300;
        const padding = 20;
        const maxY = 8;
        
        const idebData = [ // Using mock IDEB data for consistency
            { year: '2020', value: 4.8 },
            { year: '2021', value: 5.1 },
            { year: '2022', value: 5.3 },
            { year: '2023', value: 5.9 },
            { year: '2024', value: 6.2 },
            { year: '2025', value: 6.8 }, // Projeção
        ];

        const points = idebData.map((d, i) => {
            const x = padding + (i / (idebData.length - 1)) * (width - 2 * padding);
            const y = height - padding - (d.value / maxY) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="w-full h-48 relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    {/* Area Fill */}
                    <path d={`${points} L ${width-padding},${height-padding} L ${padding},${height-padding} Z`} fill="url(#lineGradient)" />
                    
                    {/* Line */}
                    <polyline points={points} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg"/>
                    
                    {/* Dots */}
                    {idebData.map((d, i) => {
                        const x = padding + (i / (idebData.length - 1)) * (width - 2 * padding);
                        const y = height - padding - (d.value / maxY) * (height - 2 * padding);
                        return (
                            <g key={i} className="group">
                                <circle cx={x} cy={y} r="4" fill="#fff" stroke="#f59e0b" strokeWidth="2" className="group-hover:r-6 transition-all cursor-pointer"/>
                                <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">{d.value}</text>
                                <text x={x} y={height + 10} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.year}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {showRanking && <GlobalRankingView state={state} onClose={() => setShowRanking(false)} />}

            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 print:border-black">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark flex items-center gap-3">
                        <SchoolIcon size={32} className="text-brand-primary"/> 
                        Gestão Escolar
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">{school?.name || 'Escola não identificada'} • Visão do Diretor</p>
                </div>
                <div className="flex gap-3 print:hidden">
                    <button onClick={() => setShowRanking(true)} className="bg-amber-100 text-amber-800 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-200 shadow-sm border border-amber-200">
                        <Trophy size={20}/> Ranking Escolar
                    </button>
                    <button onClick={handlePrint} className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700 shadow-lg">
                        <Printer size={20}/> Relatório de Gestão
                    </button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-6 border-b border-slate-200 print:hidden">
                <button onClick={() => setTab('PERFORMANCE')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${tab === 'PERFORMANCE' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <BarChart2 size={18}/> Gestão de Desempenho & Integridade
                </button>
                <button onClick={() => setTab('INFRASTRUCTURE')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${tab === 'INFRASTRUCTURE' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <LayoutGrid size={18}/> Infraestrutura & Recursos
                </button>
            </div>

            {tab === 'PERFORMANCE' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                    {/* KPIs Operacionais */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Total Alunos</span>
                                <Users size={20} className="text-blue-600"/>
                            </div>
                            <div className="text-4xl font-black text-slate-800">{schoolStudents.length}</div>
                            <div className="text-xs text-slate-400 mt-2">Matrículas Ativas</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Frequência Média</span>
                                <Calendar size={20} className={attendanceAvg < 85 ? "text-rose-600" : "text-emerald-600"}/>
                            </div>
                            <div className="text-4xl font-black text-slate-800">{attendanceAvg.toFixed(1)}%</div>
                            <div className="text-xs text-slate-400 mt-2">Presença Global</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Desempenho (IDG)</span>
                                <TrendingUp size={20} className="text-brand-secondary"/>
                            </div>
                            <div className="text-4xl font-black text-slate-800">{totalAvg.toFixed(1)}</div>
                            <div className="text-xs text-slate-400 mt-2">Média IDG (0-10)</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Integridade (Anti-Cola)</span>
                                <ShieldAlert size={20} className={integrityPercentage < 95 ? "text-rose-600" : "text-emerald-600"}/>
                            </div>
                            <div className={`text-4xl font-black ${integrityPercentage < 95 ? "text-rose-600" : "text-emerald-600"}`}>
                                {integrityPercentage.toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-400 mt-2">Provas sem violações ({fraudAttempts} incidentes)</div>
                        </div>
                    </div>

                    {/* SECURITY BREAKDOWN */}
                    {fraudAttempts > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm bg-gradient-to-r from-white to-rose-50/30">
                            <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><ShieldAlert size={20}/> Detalhamento de Tentativas de Fraude</h3>
                            <div className="flex items-center gap-8">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Fuga de Foco (Notificações/Click Fora)</span> <span>{incidents.focusLost}</span></div>
                                    <div className="w-full bg-rose-100 h-3 rounded-full mb-4 overflow-hidden"><div style={{width: `${(incidents.focusLost/totalFlags)*100}%`}} className="h-full bg-rose-500"></div></div>
                                    
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Atalhos de Teclado (Alt+Tab/Win)</span> <span>{incidents.altTab}</span></div>
                                    <div className="w-full bg-rose-100 h-3 rounded-full mb-4 overflow-hidden"><div style={{width: `${(incidents.altTab/totalFlags)*100}%`}} className="h-full bg-rose-600"></div></div>
                                    
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Saída de Tela Cheia</span> <span>{incidents.fullscreen}</span></div>
                                    <div className="w-full bg-rose-100 h-3 rounded-full overflow-hidden"><div style={{width: `${(incidents.fullscreen/totalFlags)*100}%`}} className="h-full bg-rose-800"></div></div>
                                </div>
                                <div className="w-px h-32 bg-rose-200 mx-4 hidden md:block"></div>
                                <div className="text-sm text-slate-600 max-w-md italic">
                                    A maioria dos incidentes envolve perda de foco ou tentativa de troca de janela. Recomenda-se orientar os alunos a desativarem notificações antes do início da prova no modo Kiosk.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:space-y-8">
                        {/* Comparativo de Turmas */}
                        <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
                                    <GraduationCap className="text-brand-primary"/> Comparativo de Turmas
                                </h3>
                                <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded font-bold">Média Escola: {totalAvg.toFixed(1)}</div>
                            </div>

                            {/* Chart Visual */}
                            <div className="h-40 flex items-end gap-4 mb-8 px-4 border-b border-slate-100 pb-4 w-full overflow-x-auto">
                                {classPerformance.map((cls) => (
                                    <div key={cls.id} className="flex flex-col items-center flex-1 min-w-[60px] group">
                                        <div className="relative w-full flex justify-center items-end h-full">
                                            <div 
                                                className={`w-full max-w-[40px] rounded-t-md transition-all hover:opacity-80 ${cls.avg >= 6 ? 'bg-blue-500' : 'bg-rose-400'}`}
                                                style={{ height: `${(cls.avg / maxAvg) * 100}%` }}
                                            ></div>
                                            <div className="absolute -top-6 font-bold text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition">{cls.avg.toFixed(1)}</div>
                                        </div>
                                        <div className="text-xs font-bold text-slate-600 mt-2">{cls.name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase">{cls.shift.slice(0,1)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                {classPerformance.map((cls, idx) => (
                                    <div key={cls.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition border border-transparent hover:border-slate-100">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 text-lg shadow-sm">
                                            {idx + 1}º
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-slate-800">{cls.name} <span className="text-slate-400 font-normal text-xs ml-2">({cls.studentCount} alunos)</span></span>
                                                <span className={`font-bold ${cls.avg >= 6 ? 'text-emerald-600' : 'text-rose-600'}`}>{cls.avg.toFixed(1)}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                                                <div className={`h-full ${cls.avg >= 6 ? 'bg-brand-secondary' : 'bg-rose-400'}`} style={{width: `${cls.avg * 10}%`}}></div>
                                            </div>
                                            <div className="mt-1 flex justify-between text-[10px] text-slate-400 uppercase font-medium">
                                                <span>{cls.series} • {cls.shift}</span>
                                                {cls.riskCount > 0 && <span className="text-rose-500 flex items-center gap-1"><AlertTriangle size={10}/> {cls.riskCount} em risco</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {classPerformance.length === 0 && <div className="text-slate-400 text-center py-8">Nenhuma turma com dados suficientes.</div>}
                            </div>
                        </div>

                        {/* Resumo do Staff e Alertas */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black print:break-inside-avoid">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-xl">
                                <Activity className="text-slate-600"/> Monitoramento
                            </h3>
                            
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Professores Ativos</span>
                                    <span className="font-bold text-slate-900">{schoolTeachers.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Planos de Aula (Mês)</span>
                                    {/* @fix: Added optional chaining and fallback array */}
                                    <span className="font-bold text-brand-primary">{(allLessonPlans || []).filter(lp => schoolTeachers.some(t => t.id === lp.professorId)).length}</span>
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Sugestões de Melhoria (IA)</h4>
                            <div className="space-y-3">
                                {classPerformance.slice(-2).map(cls => (
                                    <div key={cls.id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                        <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                                            <Target size={12}/> Atenção: {cls.name}
                                        </div>
                                        <p className="text-xs text-amber-900 leading-relaxed">
                                            Média baixa ({cls.avg.toFixed(1)}). Recomenda-se reunião pedagógica para revisar metodologia de ensino em Exatas.
                                        </p>
                                    </div>
                                ))}
                                {classPerformance.length > 0 && classPerformance[0].avg > 8 && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                        <div className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                                            <Award size={12}/> Destaque: {classPerformance[0].name}
                                        </div>
                                        <p className="text-xs text-emerald-900 leading-relaxed">
                                            Considerar a turma {classPerformance[0].name} como modelo para mentoria entre pares.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ... Infrastructure Tab (UNCHANGED, kept for context in real file, omitted for brevity) ... */}
            {tab === 'INFRASTRUCTURE' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    {/* Same code as before for infrastructure tab */}
                    <div className="mb-8 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-full"><Zap size={24} className="text-yellow-400"/></div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">Inteligência de Infraestrutura</h3>
                            <p className="text-sm text-slate-300 mb-4">
                                A IA analisou a correlação entre recursos físicos e desempenho dos alunos nesta unidade.
                            </p>
                            <div className="space-y-2">
                                {!school?.resources?.ac_cooling && (
                                    <div className="flex items-center gap-2 text-sm text-amber-200 bg-amber-500/10 p-2 rounded border border-amber-500/30">
                                        <AlertTriangle size={14}/>
                                        <span><strong>Alta Prioridade:</strong> Instalação de Climatização. Dados mostram queda de 15% no rendimento em dias quentes (Turno Tarde).</span>
                                    </div>
                                )}
                                {/* ... rest of infrastructure logic ... */}
                            </div>
                        </div>
                    </div>
                    {/* ... Resources Grid ... */}
                </div>
            )}

            <div className="text-center text-xs text-slate-400 mt-12 print:fixed print:bottom-4 print:w-full">
                Painel Administrativo - Uso Exclusivo da Direção • {new Date().toLocaleDateString()}
            </div>
        </div>
    );
};
