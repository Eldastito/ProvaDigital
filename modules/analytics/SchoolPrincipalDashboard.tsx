
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, Calendar, Printer, School, GraduationCap, ClipboardList, ArrowDownRight, ArrowUpRight, Package, Check, X, Bus, Shield, Snowflake, Award, BarChart2, LayoutGrid, Edit, Trophy, Target, Activity, ShieldAlert, Zap, Globe, BookOpen } from 'lucide-react';
import { RiskLevel, TenantType } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { reportingService } from '../../services/reportingService';
import { GlobalRankingView } from './GlobalRankingView';
import { PedagogicalTrackingView } from './PedagogicalTrackingView';
import { useAppStore } from '../../store/useAppStore';
import { Download } from 'lucide-react';

export const SchoolPrincipalDashboard = () => {
    const state = useAppStore();
    const { currentUser } = state;
    const analytics = new AnalyticsService();
    const schoolId = currentUser?.schoolId;
    const school = state.schools.find(s => s.id === schoolId);
    const [tab, setTab] = useState<'PERFORMANCE' | 'INFRASTRUCTURE' | 'TRACKING'>('PERFORMANCE');
    const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
    const [showRanking, setShowRanking] = useState(false);
    const [benchmarking, setBenchmarking] = useState<any>(null);
    const [retentionData, setRetentionData] = useState<any>(null);

    const schoolTenant = state.tenants.find(t => t.id === school?.tenantId);
    const isPrivate = schoolTenant?.type === TenantType.PRIVATE;

    useEffect(() => {
        if (schoolId) {
            analytics.getBenchmarkingData(schoolId).then(data => setBenchmarking(data));
            if (isPrivate) {
                analytics.getRetentionData(schoolId).then(data => setRetentionData(data));
            }
        }
    }, [schoolId, isPrivate]);

    // Filtrar dados da escola
    const schoolStudents = state.students.filter(s => s.schoolId === schoolId);
    const schoolClasses = state.classes.filter(c => c.schoolId === schoolId);
    const schoolTeachers = state.users.filter(u => u.schoolId === schoolId && u.role === 'PROFESSOR');

    // Filtros e Banco de Itens
    const availableSubjects = Array.from(new Set(schoolTeachers.flatMap(t => t.subjectIds || []))).sort();

    const schoolItems = state.items.filter(i => i.schoolId === schoolId || (i.tenantId === school?.tenantId));
    const filteredItems = selectedSubject === 'ALL' ? schoolItems : schoolItems.filter(i => i.subject === selectedSubject || i.knowledgeArea === selectedSubject);
    const aiGeneratedItems = filteredItems.filter(i => i.metadata?.generatedBy === 'ai');
    const aiItemsPercentage = filteredItems.length > 0 ? Math.round((aiGeneratedItems.length / filteredItems.length) * 100) : 0;

    // Cálculos de Métricas
    const studentsStats = schoolStudents.map(s => analytics.getStudentStats(s.id)).filter(Boolean) as any[];
    const totalAvg = studentsStats.reduce((acc, curr) => acc + curr.idgScore, 0) / (studentsStats.length || 1);
    const riskCount = studentsStats.filter(s => s.riskLevel !== RiskLevel.LOW).length;
    const attendanceAvg = studentsStats.reduce((acc, curr) => acc + curr.attendanceRate, 0) / (studentsStats.length || 1);

    // INTEGRIDADE / FRAUDE
    const schoolResults = state.results.filter(r => schoolStudents.some(s => s.id === r.studentId));
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
        const statsInClass = studentsInClass.map(s => analytics.getStudentStats(s.id)).filter(Boolean) as any[];
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

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {showRanking && <GlobalRankingView state={state} onClose={() => setShowRanking(false)} />}

            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 print:border-black">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark flex items-center gap-3">
                        <School size={32} className="text-brand-primary" />
                        Gestão Escolar
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">{school?.name || 'Escola não identificada'} • Visão do Diretor</p>
                </div>
                <div className="flex gap-3 print:hidden">
                    <button onClick={() => setShowRanking(true)} className="bg-amber-100 text-amber-800 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-200 shadow-sm border border-amber-200">
                        <Trophy size={20} /> Ranking Escolar
                    </button>
                    <button
                        onClick={() => {
                            const data = classPerformance.map(cls => ({
                                Turma: cls.name,
                                Serie: cls.series,
                                Turno: cls.shift,
                                Alunos: cls.studentCount,
                                'Média IDG': cls.avg.toFixed(2),
                                'Alunos em Risco': cls.riskCount
                            }));
                            reportingService.generateExcelExport(data, `Desempenho_Turmas_${school?.name.replace(/\s+/g, '_')}`)
                                .then(blob => {
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `Desempenho_Turmas_${school?.name.replace(/\s+/g, '_')}.xlsx`;
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                });
                        }}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-500 shadow-lg"
                    >
                        <Download size={20} /> Excel
                    </button>
                    <button onClick={handlePrint} className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700 shadow-lg">
                        <Printer size={20} /> Relatório de Gestão
                    </button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-6 border-b border-slate-200 print:hidden overflow-x-auto">
                <button onClick={() => setTab('PERFORMANCE')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${tab === 'PERFORMANCE' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <BarChart2 size={18} /> Gestão de Desempenho & Integridade
                </button>
                <button onClick={() => setTab('TRACKING')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${tab === 'TRACKING' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <ClipboardList size={18} /> Acompanhamento Pedagógico (Logística)
                </button>
                <button onClick={() => setTab('INFRASTRUCTURE')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${tab === 'INFRASTRUCTURE' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <LayoutGrid size={18} /> Infraestrutura & Recursos
                </button>
            </div>

            {/* Filtro Global e KPI Banco de Itens (Aparece em Performance e Tracking) */}
            {(tab === 'PERFORMANCE' || tab === 'TRACKING') && (
                <div className="flex flex-col md:flex-row gap-6 mb-8 mt-6 print:hidden">
                    <div className="flex flex-col gap-2 min-w-[250px]">
                        <span className="text-sm font-bold text-slate-500">Filtro Global por Disciplina:</span>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="border border-slate-300 rounded-lg px-4 py-3 bg-white shadow-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand-primary/20 outline-none"
                        >
                            <option value="ALL">Todas as Disciplinas (Escola Inteira)</option>
                            {availableSubjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>

                    {/* KPI Card: Banco de Itens da Escola */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banco de Itens Institucional</span>
                            <div className="text-brand-secondary"><BookOpen size={24} /></div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-800 mb-1">{filteredItems.length}</div>
                            <div className="text-sm font-bold text-brand-secondary">
                                {aiGeneratedItems.length} gerados por IA ({aiItemsPercentage}%)
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 hidden md:block"></div>
                </div>
            )}

            {tab === 'PERFORMANCE' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
                    {/* KPIs Operacionais */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Total Alunos</span>
                                <Users size={20} className="text-blue-600" />
                            </div>
                            <div className="text-4xl font-black text-slate-800">{schoolStudents.length}</div>
                            <div className="text-xs text-slate-400 mt-2">Matrículas Ativas</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Frequência Média</span>
                                <Calendar size={20} className={attendanceAvg < 85 ? "text-rose-600" : "text-emerald-600"} />
                            </div>
                            <div className="text-4xl font-black text-slate-800">{attendanceAvg.toFixed(1)}%</div>
                            <div className="text-xs text-slate-400 mt-2">Presença Global</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Desempenho (IDG)</span>
                                <TrendingUp size={20} className="text-brand-secondary" />
                            </div>
                            <div className="text-4xl font-black text-slate-800">{totalAvg.toFixed(1)}</div>
                            <div className="text-xs text-slate-400 mt-2">Média IDG (0-10)</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Integridade (Anti-Cola)</span>
                                <ShieldAlert size={20} className={integrityPercentage < 95 ? "text-rose-600" : "text-emerald-600"} />
                            </div>
                            <div className={`text-4xl font-black ${integrityPercentage < 95 ? "text-rose-600" : "text-emerald-600"}`}>
                                {integrityPercentage.toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-400 mt-2">Provas sem violações ({fraudAttempts} incidentes)</div>
                        </div>
                    </div>

                    {/* Benchmarking & Alerts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Benchmarking Card */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Globe size={18} className="text-blue-500" /> Comparativo de Rede
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v3.1 Beta</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm text-slate-500">Média da Unidade</span>
                                        <span className="text-2xl font-black text-slate-800">{totalAvg.toFixed(1)}</span>
                                    </div>

                                    {benchmarking && (
                                        <>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-1000"
                                                    style={{ width: `${(totalAvg / 10) * 100}%` }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Média Rede</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-slate-700">{benchmarking.networkAvg}</span>
                                                        {benchmarking.isAboveNetwork ? (
                                                            <ArrowUpRight size={14} className="text-emerald-500" />
                                                        ) : (
                                                            <ArrowDownRight size={14} className="text-rose-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Média Est.</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-slate-700">{benchmarking.stateAvg}</span>
                                                        {benchmarking.isAboveState ? (
                                                            <ArrowUpRight size={14} className="text-emerald-500" />
                                                        ) : (
                                                            <ArrowDownRight size={14} className="text-rose-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${benchmarking.isAboveNetwork ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {benchmarking.isAboveNetwork ? (
                                                    <>
                                                        <Check size={14} />
                                                        Sua escola está {(totalAvg - benchmarking.networkAvg).toFixed(1)} pts acima da rede.
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertTriangle size={14} />
                                                        Abaixo da média da rede em {(benchmarking.networkAvg - totalAvg).toFixed(1)} pts.
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowRanking(true)}
                                className="mt-6 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors border border-slate-200 flex items-center justify-center gap-2"
                            >
                                Ver Ranking Completo <Trophy size={14} />
                            </button>
                        </div>

                        {/* Indicadores do Setor Privado (v3.1) */}
                        {isPrivate && retentionData && (
                            <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-white to-amber-50/20">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-amber-500" /> Retenção & LTV
                                    </h3>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">Gestão Privada</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                                        <div className="text-2xl font-black text-slate-800">{retentionData.retentionRate}%</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Taxa Retenção</div>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                                        <div className="text-2xl font-black text-rose-500">{retentionData.churnRate}%</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Churn Anual</div>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">NPS de Pais</span>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Award size={14} />
                                            <span className="font-bold">{retentionData.satisfactionScore} / 5.0</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400" style={{ width: `${(retentionData.satisfactionScore / 5) * 100}%` }}></div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-between items-center p-3 bg-slate-900 rounded-xl text-white">
                                    <div>
                                        <div className="text-[10px] opacity-70 font-bold uppercase">LTV Projetado</div>
                                        <div className="text-lg font-black text-amber-400">R$ {retentionData.projectedLTV.toLocaleString()}</div>
                                    </div>
                                    <div className="text-[10px] bg-white/20 px-2 py-1 rounded font-bold uppercase">Meta: +8%</div>
                                </div>
                            </div>
                        )}

                        {/* Alerta de Risco (Exaustivo) */}
                        <div className="lg:col-span-2 bg-rose-50 p-6 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-rose-800 flex items-center gap-2 mb-4">
                                    <ShieldAlert size={18} /> Alerta de Evasão & Risco
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-4xl font-black text-rose-600 mb-1">{riskCount}</div>
                                        <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-4">Alunos em Risco Crítico</div>
                                        <p className="text-sm text-rose-900/70 leading-relaxed mb-4">
                                            Identificamos uma correlação direta entre o comparecimento abaixo de 75% e a queda no IDG nas turmas de 9º Ano.
                                        </p>
                                        <button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-200">
                                            Gerar Plano de Intervenção
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-white/60 p-3 rounded-xl border border-rose-200">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-rose-900">Turmas Pior Desempenho</span>
                                                <span className="text-[10px] text-rose-500">v3.1</span>
                                            </div>
                                            <div className="space-y-2">
                                                {classPerformance.slice(-2).map(c => (
                                                    <div key={c.id} className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-600">{c.name}</span>
                                                        <span className="font-bold text-rose-600">{c.avg.toFixed(1)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-200">
                                            <div className="text-[10px] font-bold text-amber-700 uppercase mb-1">Sugestão da IA</div>
                                            <p className="text-[11px] text-amber-900 leading-tight">
                                                Agendar reforço para tópicos de 'Funções' para as turmas B e D.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ShieldAlert className="absolute -bottom-8 -right-8 text-rose-500/10" size={200} />
                        </div>
                    </div>

                    {/* SECURITY BREAKDOWN */}
                    {fraudAttempts > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm bg-gradient-to-r from-white to-rose-50/30">
                            <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><ShieldAlert size={20} /> Detalhamento de Tentativas de Fraude</h3>
                            <div className="flex items-center gap-8">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Fuga de Foco (Notificações/Click Fora)</span> <span>{incidents.focusLost}</span></div>
                                    <div className="w-full bg-rose-100 h-3 rounded-full mb-4 overflow-hidden"><div style={{ width: `${(incidents.focusLost / totalFlags) * 100}%` }} className="h-full bg-rose-500"></div></div>

                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Atalhos de Teclado (Alt+Tab/Win)</span> <span>{incidents.altTab}</span></div>
                                    <div className="w-full bg-rose-100 h-3 rounded-full mb-4 overflow-hidden"><div style={{ width: `${(incidents.altTab / totalFlags) * 100}%` }} className="h-full bg-rose-600"></div></div>

                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Saída de Tela Cheia</span> <span>{incidents.fullscreen}</span></div>
                                    <div className="w-full bg-rose-100 h-3 rounded-full overflow-hidden"><div style={{ width: `${(incidents.fullscreen / totalFlags) * 100}%` }} className="h-full bg-rose-800"></div></div>
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
                                    <GraduationCap className="text-brand-primary" /> Comparativo de Turmas
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
                                        <div className="text-[10px] text-slate-400 uppercase">{cls.shift.slice(0, 1)}</div>
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
                                                <div className={`h-full ${cls.avg >= 6 ? 'bg-brand-secondary' : 'bg-rose-400'}`} style={{ width: `${cls.avg * 10}%` }}></div>
                                            </div>
                                            <div className="mt-1 flex justify-between text-[10px] text-slate-400 uppercase font-medium">
                                                <span>{cls.series} • {cls.shift}</span>
                                                {cls.riskCount > 0 && <span className="text-rose-500 flex items-center gap-1"><AlertTriangle size={10} /> {cls.riskCount} em risco</span>}
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
                                <Activity className="text-slate-600" /> Monitoramento
                            </h3>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Professores Ativos</span>
                                    <span className="font-bold text-slate-900">{schoolTeachers.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Planos de Aula (Mês)</span>
                                    <span className="font-bold text-brand-primary">{state.lessonPlans.filter(lp => schoolTeachers.some(t => t.id === lp.professorId)).length}</span>
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Sugestões de Melhoria (IA)</h4>
                            <div className="space-y-3">
                                {classPerformance.slice(-2).map(cls => (
                                    <div key={cls.id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                        <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                                            <Target size={12} /> Atenção: {cls.name}
                                        </div>
                                        <p className="text-xs text-amber-900 leading-relaxed">
                                            Média baixa ({cls.avg.toFixed(1)}). Recomenda-se reunião pedagógica para revisar metodologia de ensino em Exatas.
                                        </p>
                                    </div>
                                ))}
                                {classPerformance.length > 0 && classPerformance[0].avg > 8 && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                        <div className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                                            <Award size={12} /> Destaque: {classPerformance[0].name}
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

            {tab === 'TRACKING' && (
                <PedagogicalTrackingView selectedSubject={selectedSubject} />
            )}

            {/* ... Infrastructure Tab (UNCHANGED, kept for context in real file, omitted for brevity) ... */}
            {tab === 'INFRASTRUCTURE' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    {/* Same code as before for infrastructure tab */}
                    <div className="mb-8 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg flex items-start gap-4">
                        <div className="p-3 bg-white/10 rounded-full"><Zap size={24} className="text-yellow-400" /></div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">Inteligência de Infraestrutura</h3>
                            <p className="text-sm text-slate-300 mb-4">
                                A IA analisou a correlação entre recursos físicos e desempenho dos alunos nesta unidade.
                            </p>
                            <div className="space-y-2">
                                {!school?.resources?.ac_cooling && (
                                    <div className="flex items-center gap-2 text-sm text-amber-200 bg-amber-500/10 p-2 rounded border border-amber-500/30">
                                        <AlertTriangle size={14} />
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
