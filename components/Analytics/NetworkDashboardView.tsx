
import React, { useRef, useState, useEffect } from 'react';
import { BarChart2, TrendingUp, AlertTriangle, Printer, Download, School, MapPin, Award, Package, Check, X, Bus, Shield, Snowflake, LayoutGrid, Trophy, Cloud, RefreshCw, Server, Lock, Unlock, CheckCircle, Database, ArrowUp, Sparkles, FileText, Lightbulb, ArrowRight, Target, PieChart, Activity, Calendar, History, ChevronRight, Clock, Zap, Thermometer, FileDigit, MousePointer2, Hourglass, Grip, Coins, Users, PenTool, Music, Dna, ShieldAlert, Filter, TrendingDown, Brain } from 'lucide-react';
import { AppState, RiskLevel, SchoolResources, UserRole } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { Badge } from '../ui/Badge';
import { GlobalRankingView } from './GlobalRankingView';

// ... (Mock Data Constants) ...
const MOCK_INCOMING_PACKAGES = [
    { id: 'pkg_01', schoolName: 'Escola Municipal Cora Coralina', coordinator: 'Carlos Souza', event: 'Avaliação Bimestral (9A)', timestamp: 'Há 10 min', size: '2.4 MB', status: 'PENDING', records: 25 },
    { id: 'pkg_02', schoolName: 'Colégio Estadual Darcy Ribeiro', coordinator: 'Ana Beatriz', event: 'Simulado Geral (3B)', timestamp: 'Há 45 min', size: '3.1 MB', status: 'PENDING', records: 32 },
];

const HISTORY_REPORTS = [
    {
        id: 'rep_current',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        title: 'Análise de Telemetria & Comportamento',
        status: 'Atual',
        type: 'STANDARD',
        metrics: { idebDelta: 0.12, riskDelta: -2, rankingChange: { up: 'E.M. Cora Coralina', down: 'C.E. Darcy Ribeiro' } },
        insights: [
            { type: 'ACADEMIC', title: 'Padrão de Erro em Matemática (9º Ano)', desc: '68% de erro em Equações de 2º Grau. Dificuldade sistêmica.', prioridade: 'Alta', bncc: 'EF09MA09' },
            { type: 'INFRA', title: 'Correlação Crítica: Climatização', desc: 'Turmas vespertinas em salas sem ar-condicionado tiveram rendimento 18% inferior às climatizadas (Índice de Fadiga Elevado).' }
        ],
        telemetry: {
            avgTimePerQuestion: '3m 12s',
            guessingRate: '12%',
            fatigueDrop: '15%',
            reviewRate: '45%',
            indecisionIndex: 'Alta (3.4 trocas/item)',
            strategyType: 'Sequencial Rigído',
            integrityIndex: '98.2%'
        },
        clusters: [],
        correlations: [
            { factor: 'Uso do Rascunho Digital', impact: 22, label: 'Aumento na Nota (Exatas)', type: 'positive', icon: 'PEN' },
            { factor: 'Frequência de Pausas', impact: 5, label: 'Recuperação de Foco', type: 'positive', icon: 'CLOCK' },
            { factor: 'Troca de Aba (Foco)', impact: -15, label: 'Queda no Desempenho', type: 'negative', icon: 'FOCUS' }
        ],
        aiSuggestions: [
            { target: 'Rede Municipal', area: 'Matemática (9º Ano)', problem: 'Defasagem em Geometria Espacial identificada em 60% das escolas via Mapa de Calor BNCC.', action: 'Implementar módulo de reforço visual com sólidos geométricos 3D.', impact_projection: '+1.2 pontos no IDEB' },
            { target: 'Infraestrutura', area: 'E.M. Darcy Ribeiro', problem: 'Queda de rendimento no turno vespertino correlacionada a altas temperaturas (Índice de Fadiga).', action: 'Priorizar instalação de climatização ou ventiladores nesta unidade.', impact_projection: '+15% engajamento' }
        ]
    }
];

export const NetworkDashboardView = ({ state }: { state: AppState }) => {
    const analytics = new AnalyticsService(state);
    const reportRef = useRef<HTMLDivElement>(null);
    const [tab, setTab] = useState<'PERFORMANCE' | 'RESOURCES'>('PERFORMANCE');
    const [showRanking, setShowRanking] = useState(false);
    
    // Multi-Tenant Filter (Para Super Admin ou State Admin verem municípios)
    const [selectedTenantId, setSelectedTenantId] = useState<string>(state.currentUser?.tenantId || 'ALL');
    const isSuperAdmin = state.currentUser?.role === UserRole.SUPER_ADMIN;
    const isStateAdmin = state.currentUser?.role === UserRole.STATE_ADMIN;
    // Se for State Admin, ele vê sua rede e as municipais abaixo (simulado)
    const canFilterTenants = isSuperAdmin || isStateAdmin;

    // Cloud Sync State
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [incomingPackages, setIncomingPackages] = useState(MOCK_INCOMING_PACKAGES);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncComplete, setSyncComplete] = useState(false);
    
    // Post-Processing State (Demo Magic)
    const [dataVersion, setDataVersion] = useState(0); 
    const [showSuccessBanner, setShowSuccessBanner] = useState(false);
    const [showImpactReport, setShowImpactReport] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(HISTORY_REPORTS[0]);
    
    // Demo State: Audience Results
    const [audienceResultsCount, setAudienceResultsCount] = useState(0);

    // 1. Filtrar Escolas pelo Tenant Selecionado
    const filteredSchools = state.schools.filter(s => 
        (selectedTenantId === 'ALL' || s.tenantId === selectedTenantId)
    );

    // 2. Processar Dados da Rede (Com base no filtro)
    const schoolsData = filteredSchools.map((school, index) => {
        const students = state.students.filter(s => s.schoolId === school.id);
        const stats = students.map(s => analytics.getStudentStats(s.id)).filter(Boolean) as any[];
        
        let avgGrade = stats.length > 0 
            ? stats.reduce((acc, curr) => acc + curr.idgScore, 0) / stats.length 
            : 0;
        
        // SIMULATION: If synced, inject random noise to simulate real-time updates from audience
        if (dataVersion > 0) {
            // Random variation based on school index to look organic
            const variation = (Math.random() * 1.5) - 0.5; // -0.5 to +1.0
            avgGrade = Math.min(10, Math.max(0, avgGrade + variation));
        }

        const riskCount = stats.filter(s => s.riskLevel !== RiskLevel.LOW).length;
        const riskPercentage = students.length > 0 ? (riskCount / students.length) * 100 : 0;

        const director = state.users.find(u => u.schoolId === school.id && u.role === 'DIRETOR');

        // Contagem de tentativas de fraude
        const schoolResults = state.results.filter(r => students.some(s => s.id === r.studentId));
        const fraudAttempts = schoolResults.reduce((acc, r) => acc + (r.violationCount || 0), 0);

        return {
            ...school,
            directorName: director?.name || 'Não atribuído',
            studentCount: students.length,
            avgGrade,
            riskCount,
            riskPercentage,
            fraudAttempts
        };
    });

    const networkAvg = schoolsData.reduce((acc, s) => acc + s.avgGrade, 0) / (schoolsData.length || 1);
    const totalStudents = schoolsData.reduce((acc, s) => acc + s.studentCount, 0);
    const totalRisk = schoolsData.reduce((acc, s) => acc + s.riskCount, 0);
    const totalFraudAttempts = schoolsData.reduce((acc, s) => acc + s.fraudAttempts, 0);

    const sortedSchools = [...schoolsData].sort((a, b) => b.avgGrade - a.avgGrade);
    const top3 = sortedSchools.slice(0, 3);
    const bottom3 = [...sortedSchools].sort((a, b) => a.avgGrade - b.avgGrade).slice(0, 3);

    const resourceMetrics = [
        { key: 'uniforms', label: 'Uniformes', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { key: 'textbooks', label: 'Mat. Didático', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
        { key: 'funding', label: 'Verba Recebida', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { key: 'food', label: 'Merenda', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
        { key: 'transportation', label: 'Transporte', icon: Bus, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { key: 'security', label: 'Segurança', icon: Shield, color: 'text-slate-700', bg: 'bg-slate-200' },
        { key: 'ac_cooling', label: 'Climatização', icon: Snowflake, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { key: 'extracurricular', label: 'Extracurricular', icon: Music, color: 'text-pink-600', bg: 'bg-pink-50' },
    ];

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = "Relatorio_Executivo_Secretaria_Educacao";
        window.print();
        document.title = originalTitle;
    };

    const processSync = () => {
        setIsSyncing(true);
        
        // Simulation steps
        setTimeout(() => setIncomingPackages(prev => prev.map(p => ({...p, status: 'DECRYPTING'}))), 1000);
        setTimeout(() => setIncomingPackages(prev => prev.map(p => ({...p, status: 'MERGING'}))), 2500);
        
        setTimeout(() => {
            setIncomingPackages(prev => prev.map(p => ({...p, status: 'COMPLETE'})));
            setIsSyncing(false);
            setSyncComplete(true);
            
            // MAGIC SYNC: Simulate receiving audience data
            const simulatedAudienceCount = Math.floor(Math.random() * 20) + 10; // 10-30 people
            setAudienceResultsCount(simulatedAudienceCount + 57); // 57 existing mock
            setDataVersion(prev => prev + 1); // Trigger re-render of stats
        }, 4000);
    };

    const handleCloseSync = () => {
        setShowSyncModal(false);
        if (syncComplete) {
            setShowSuccessBanner(true);
        }
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto" ref={reportRef}>
            {showRanking && <GlobalRankingView state={state} onClose={() => setShowRanking(false)} />}

            {/* Banner de Novos Dados (Pós-Sync) */}
            {showSuccessBanner && (
                <div className="bg-emerald-900 text-white p-4 rounded-xl shadow-lg flex justify-between items-center animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-800 rounded-lg animate-pulse">
                            <Sparkles size={24} className="text-yellow-400"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Dados da Rede Atualizados</h3>
                            <p className="text-emerald-200 text-sm">
                                {audienceResultsCount} novas avaliações (incluindo Demo Live) foram integradas e as métricas foram recalculadas com sucesso.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowSuccessBanner(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition">Dispensar</button>
                        <button onClick={() => { setShowImpactReport(true); setSelectedReport(HISTORY_REPORTS[0]); }} className="px-4 py-2 bg-white text-emerald-900 rounded-lg text-sm font-bold hover:bg-emerald-50 transition flex items-center gap-2 shadow-sm">
                            <FileText size={16}/> Ver Relatório de Inteligência
                        </button>
                    </div>
                </div>
            )}

            {/* Header Executivo */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 print:border-black">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-3xl font-bold text-brand-dark flex items-center gap-3">
                            <MapPin size={32} className="text-brand-secondary"/> 
                            {isStateAdmin ? 'Secretaria Estadual de Educação' : 'Secretaria de Educação'}
                        </h1>
                        {canFilterTenants && (
                            <div className="relative print:hidden">
                                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <select 
                                    className="pl-9 pr-4 py-1 bg-slate-100 border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-primary"
                                    value={selectedTenantId}
                                    onChange={(e) => setSelectedTenantId(e.target.value)}
                                >
                                    <option value="ALL">Todas as Redes</option>
                                    {state.tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-500 text-lg">
                        Painel Estratégico de Monitoramento • {selectedTenantId === 'ALL' ? 'Visão Consolidada' : state.tenants.find(t => t.id === selectedTenantId)?.name}
                    </p>
                </div>
                <div className="flex gap-3 print:hidden">
                    <button 
                        onClick={() => setShowSyncModal(true)} 
                        className="bg-brand-primary text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-dark shadow-sm relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Cloud size={20}/> 
                        {!syncComplete && incomingPackages.some(p => p.status !== 'COMPLETE') && (
                            <span className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                        {syncComplete ? 'Sincronizado' : `Sincronização Offline`}
                    </button>
                    
                    <button onClick={() => setShowRanking(true)} className="bg-amber-100 text-amber-800 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-amber-200 shadow-sm border border-amber-200">
                        <Trophy size={20}/> Ranking Geral
                    </button>
                    <button onClick={handlePrint} className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700 shadow-lg">
                        <Printer size={20}/> PDF
                    </button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-6 border-b border-slate-200 print:hidden">
                <button onClick={() => setTab('PERFORMANCE')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${tab === 'PERFORMANCE' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <BarChart2 size={18}/> Desempenho Acadêmico
                </button>
                <button onClick={() => setTab('RESOURCES')} className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${tab === 'RESOURCES' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    <LayoutGrid size={18}/> MATRIZ DE INFRAESTRUTURA
                </button>
            </div>

            {tab === 'PERFORMANCE' && (
                <>
                    {/* KPIs Principais */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 print:hidden"><TrendingUp size={24}/></div>
                                <span className="text-sm font-bold text-slate-500 uppercase">IDEB Simulado (IDG)</span>
                            </div>
                            <div className="text-4xl font-black text-slate-800 relative z-10 flex items-end gap-2">
                                {networkAvg.toFixed(1)}
                                {dataVersion > 0 && <span className="text-xs font-bold text-emerald-500 mb-2 flex items-center bg-emerald-50 px-2 py-1 rounded-full"><ArrowUp size={12}/> Atualizado</span>}
                            </div>
                            <div className="text-xs text-slate-400 mt-2 relative z-10">Média da rede selecionada</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 print:hidden"><School size={24}/></div>
                                <span className="text-sm font-bold text-slate-500 uppercase">Escolas Ativas</span>
                            </div>
                            <div className="text-4xl font-black text-slate-800">{schoolsData.length}</div>
                            <div className="text-xs text-slate-400 mt-2">Unidades monitoradas</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-600 print:hidden"><ShieldAlert size={24}/></div>
                                <span className="text-sm font-bold text-slate-500 uppercase">Integridade (Tentativas)</span>
                            </div>
                            <div className="text-4xl font-black text-slate-800">{totalFraudAttempts}</div>
                            <div className="text-xs text-slate-400 mt-2">Incidentes de segurança bloqueados</div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-rose-50 rounded-lg text-rose-600 print:hidden"><AlertTriangle size={24}/></div>
                                <span className="text-sm font-bold text-slate-500 uppercase">Alunos em Risco</span>
                            </div>
                            <div className="text-4xl font-black text-rose-600">{totalRisk}</div>
                            <div className="text-xs text-slate-400 mt-2">{totalStudents > 0 ? ((totalRisk/totalStudents)*100).toFixed(1) : 0}% da rede</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
                        {/* Ranking de Escolas */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-xl">
                                <Award className="text-yellow-500"/> Ranking de Desempenho
                            </h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <span className="text-xs font-bold text-emerald-600 uppercase mb-2 block">Top 3 Escolas (Destaque)</span>
                                    <div className="space-y-3">
                                        {top3.map((school, idx) => (
                                            <div key={school.id} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">{idx + 1}</div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">{school.name}</div>
                                                        <div className="text-xs text-slate-500">Gestor: {school.directorName}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-emerald-700 text-lg">{school.avgGrade.toFixed(1)}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase">IDG</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {bottom3.length > 0 && bottom3[0].avgGrade < 6 && (
                                    <div>
                                        <span className="text-xs font-bold text-rose-600 uppercase mb-2 block mt-6">Atenção Prioritária (Menores Índices)</span>
                                        <div className="space-y-3">
                                            {bottom3.map((school, idx) => (
                                                <div key={school.id} className="flex items-center justify-between p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-rose-200 text-rose-800 rounded-full flex items-center justify-center font-bold text-sm border border-rose-300">!</div>
                                                        <div>
                                                            <div className="font-bold text-slate-800">{school.name}</div>
                                                            <div className="text-xs text-slate-500">Gestor: {school.directorName}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-black text-rose-700 text-lg">{school.avgGrade.toFixed(1)}</div>
                                                        <div className="text-[10px] text-rose-400 uppercase">IDG</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabela Geral / Radar de Risco */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black print:break-before-page">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-xl">
                                <AlertTriangle className="text-orange-500"/> Monitoramento de Risco & Fraude
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                                        <tr>
                                            <th className="px-4 py-3">Escola</th>
                                            <th className="px-4 py-3 text-center">Em Risco</th>
                                            <th className="px-4 py-3 text-center">% Crítica</th>
                                            <th className="px-4 py-3 text-center">Fraudes (Tent.)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sortedSchools.map(school => (
                                            <tr key={school.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-800">{school.name}</div>
                                                    <div className="text-[10px] text-slate-400">INEP: {school.inep}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {school.riskCount > 0 ? (
                                                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold text-xs">{school.riskCount}</span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                            <div className={`h-full rounded-full ${school.riskPercentage > 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${school.riskPercentage}%`}}></div>
                                                        </div>
                                                        <span className="text-xs font-medium">{school.riskPercentage.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono text-slate-600">
                                                    {school.fraudAttempts > 0 ? (
                                                        <span className="text-rose-600 font-bold">{school.fraudAttempts}</span>
                                                    ) : (
                                                        <span className="text-emerald-500">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* MATRIZ DE INFRAESTRUTURA */}
            {tab === 'RESOURCES' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><LayoutGrid size={20}/> Matriz de Infraestrutura por Escola</h3>
                            <p className="text-xs text-slate-500">Visão consolidada dos recursos reportados pelos diretores.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-center">
                                <thead className="bg-white text-slate-500 font-bold border-b text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-4 text-left w-64">Escola</th>
                                        {resourceMetrics.map(r => <th key={r.key} className="px-2 py-4">{r.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {schoolsData.map(school => (
                                        <tr key={school.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-left font-medium text-slate-800">{school.name}</td>
                                            {resourceMetrics.map(r => {
                                                const hasResource = school.resources?.[r.key as keyof SchoolResources];
                                                return (
                                                    <td key={r.key} className="px-2 py-3">
                                                        {hasResource ? (
                                                            <Check size={18} className="text-emerald-500 mx-auto stroke-[3px]"/>
                                                        ) : (
                                                            <X size={18} className="text-rose-300 mx-auto"/>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync Modal Logic (Existing) */}
            {showSyncModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-brand-primary">
                        <div className="bg-[#0f1d2e] p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-brand-secondary rounded-xl text-brand-dark">
                                    <Server size={32}/>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Central de Recebimento (SaaS)</h2>
                                    <p className="text-slate-300 text-sm">Sincronização segura de dados vindos dos tablets dos Coordenadores.</p>
                                </div>
                            </div>
                            <button onClick={handleCloseSync} className="text-white/50 hover:text-white"><X size={24}/></button>
                        </div>

                        <div className="p-8 bg-slate-50 min-h-[400px] flex flex-col">
                            {!syncComplete ? (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                            <Download size={20} className="text-brand-primary"/> Pacotes na Fila de Processamento
                                        </h3>
                                        {isSyncing && <span className="text-xs font-bold text-brand-secondary animate-pulse flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> Processando Criptografia...</span>}
                                    </div>

                                    <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-inner mb-6">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-100 text-slate-500 font-bold border-b">
                                                <tr>
                                                    <th className="p-4">Escola / Coordenador</th>
                                                    <th className="p-4">Evento</th>
                                                    <th className="p-4">Registros</th>
                                                    <th className="p-4">Status Segurança</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {incomingPackages.map(pkg => (
                                                    <tr key={pkg.id} className="hover:bg-slate-50 transition">
                                                        <td className="p-4">
                                                            <div className="font-bold text-slate-800">{pkg.schoolName}</div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-1"><School size={10}/> Coord: {pkg.coordinator}</div>
                                                        </td>
                                                        <td className="p-4 text-slate-700">{pkg.event}</td>
                                                        <td className="p-4 font-mono text-slate-600">{pkg.records} provas</td>
                                                        <td className="p-4">
                                                            {pkg.status === 'PENDING' && (
                                                                <span className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                                                    <Lock size={12}/> Criptografado (AES-256)
                                                                </span>
                                                            )}
                                                            {pkg.status === 'DECRYPTING' && (
                                                                <span className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                                                    <Unlock size={12} className="animate-ping"/> Descriptografando...
                                                                </span>
                                                            )}
                                                            {pkg.status === 'MERGING' && (
                                                                <span className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                                                                    <Database size={12} className="animate-bounce"/> Consolidando DB...
                                                                </span>
                                                            )}
                                                            {pkg.status === 'COMPLETE' && (
                                                                <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                                                    <CheckCircle size={12}/> Sincronizado
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end">
                                        <button 
                                            onClick={processSync}
                                            disabled={isSyncing || incomingPackages.every(p => p.status === 'COMPLETE')}
                                            className="btn-gradient px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSyncing ? 'Sincronizando...' : <><RefreshCw size={24}/> Receber Dados da Aula (Live)</>}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                                        <CheckCircle size={48}/>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Sincronização Concluída com Sucesso!</h3>
                                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                                        Todos os dados coletados offline pelos coordenadores (incluindo a sessão ao vivo da plateia) foram descriptografados, verificados e unificados.
                                    </p>
                                    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mb-8">
                                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                                            <div className="text-3xl font-black text-slate-800">{audienceResultsCount || 57}</div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Novas Provas</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                                            <div className="text-3xl font-black text-emerald-600">100%</div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">IA Correção</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                                            <div className="text-3xl font-black text-emerald-600">0s</div>
                                            <div className="text-xs text-slate-500 uppercase font-bold">Latência</div>
                                        </div>
                                    </div>
                                    <button onClick={handleCloseSync} className="text-slate-500 font-bold hover:text-slate-800 underline">Fechar e Atualizar Dashboard</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showImpactReport && selectedReport && (
               <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-0 md:p-8 backdrop-blur-md animate-in fade-in overflow-y-auto">
                    {/* ... (Report Modal Code - Mantido igual) ... */}
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-full md:h-[95vh] flex flex-col relative overflow-hidden">
                        
                        {/* Report Header */}
                        <div className="bg-[#0f1d2e] px-8 py-6 text-white flex justify-between items-start flex-shrink-0">
                            <div className="flex gap-4">
                                <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                                    <Sparkles className="text-yellow-400" size={32}/>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-brand-secondary uppercase tracking-widest mb-1">SaaS Intelligence</div>
                                    <h2 className="text-3xl font-bold leading-none">Relatório de Inteligência da Rede</h2>
                                    <p className="text-slate-400 text-sm mt-1">Gerado automaticamente via IA • Análise Preditiva e Telemetria de Prova</p>
                                </div>
                            </div>
                            <button onClick={() => setShowImpactReport(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition"><X size={24}/></button>
                        </div>

                        {/* Report Content */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                
                                {/* Left Column: Summary & Metrics */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Target size={20}/> Impacto Estratégico</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                <span className="text-sm font-bold text-emerald-800">Projeção IDEB</span>
                                                <div className="flex items-center gap-1 font-black text-emerald-600">
                                                    <ArrowUp size={16}/> +{selectedReport.metrics.idebDelta}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                                                <span className="text-sm font-bold text-slate-700">Risco Escolar</span>
                                                <div className="flex items-center gap-1 font-bold text-slate-600">
                                                    <TrendingDown size={16}/> {selectedReport.metrics.riskDelta}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={20}/> Telemetria Agregada</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Tempo/Questão</div>
                                                <div className="text-xl font-bold text-slate-800">{selectedReport.telemetry.avgTimePerQuestion}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Taxa de Chute</div>
                                                <div className="text-xl font-bold text-amber-600">{selectedReport.telemetry.guessingRate}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Integridade</div>
                                                <div className="text-xl font-bold text-emerald-600">{selectedReport.telemetry.integrityIndex}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Queda Fadiga</div>
                                                <div className="text-xl font-bold text-rose-600">{selectedReport.telemetry.fatigueDrop}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Trophy size={20}/> Movimentação no Ranking</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><ArrowUp size={18}/></div>
                                                <div>
                                                    <div className="text-xs text-slate-500">Maior Evolução</div>
                                                    <div className="font-bold text-slate-800">{selectedReport.metrics.rankingChange.up}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><TrendingDown size={18}/></div>
                                                <div>
                                                    <div className="text-xs text-slate-500">Queda Acentuada</div>
                                                    <div className="font-bold text-slate-800">{selectedReport.metrics.rankingChange.down}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Insights & AI */}
                                <div className="lg:col-span-2 space-y-6">
                                    
                                    {/* Correlations */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Dna size={20}/> Fatores de Correlação (Causa & Efeito)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {selectedReport.correlations.map((corr: any, idx: number) => (
                                                <div key={idx} className={`p-4 rounded-xl border-l-4 ${corr.type === 'positive' ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className={`p-2 rounded-lg ${corr.type === 'positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {corr.icon === 'PEN' && <PenTool size={18}/>}
                                                            {corr.icon === 'CLOCK' && <Clock size={18}/>}
                                                            {corr.icon === 'FOCUS' && <ShieldAlert size={18}/>}
                                                        </div>
                                                        <span className={`font-black text-lg ${corr.type === 'positive' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                            {corr.type === 'positive' ? '+' : ''}{corr.impact}%
                                                        </span>
                                                    </div>
                                                    <div className="font-bold text-slate-800 text-sm mb-1">{corr.factor}</div>
                                                    <div className="text-xs text-slate-500">{corr.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Insights List */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {selectedReport.insights.map((insight: any, idx: number) => (
                                            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${insight.type === 'ACADEMIC' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {insight.type === 'ACADEMIC' ? 'Pedagógico' : 'Infraestrutura'}
                                                    </span>
                                                    {insight.bncc && <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded border">{insight.bncc}</span>}
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight">{insight.title}</h4>
                                                <p className="text-sm text-slate-600 leading-relaxed">{insight.desc}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* AI Action Plan */}
                                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                                <Brain className="text-yellow-400" size={24}/> Plano de Ação Recomendado (IA)
                                            </h3>
                                            <div className="space-y-4">
                                                {selectedReport.aiSuggestions.map((sug: any, idx: number) => (
                                                    <div key={idx} className="bg-white/10 border border-white/20 p-4 rounded-xl flex gap-4 backdrop-blur-sm">
                                                        <div className="flex-shrink-0 mt-1">
                                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">{idx + 1}</div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between mb-1">
                                                                <span className="text-xs font-bold text-purple-200 uppercase">{sug.target} • {sug.area}</span>
                                                                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1"><ArrowUp size={10}/> {sug.impact_projection}</span>
                                                            </div>
                                                            <div className="font-bold text-white mb-1">{sug.action}</div>
                                                            <div className="text-sm text-indigo-200 opacity-80">Problema: {sug.problem}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Lightbulb size={200}/>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="bg-white p-4 border-t border-slate-200 text-center text-xs text-slate-400">
                            Relatório gerado em {new Date().toLocaleDateString()} • ExamePad Intelligence v2.4
                        </div>
                    </div>
               </div>
            )}

            <div className="text-center text-xs text-slate-400 mt-12 print:fixed print:bottom-4 print:w-full">
                Documento Gerado via ExamePad SaaS • Acesso Restrito ao Gabinete • {new Date().toLocaleDateString()}
            </div>
        </div>
    );
};
