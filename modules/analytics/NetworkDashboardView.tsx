
import React, { useRef, useState, useMemo } from 'react';
import { TrendingUp, Users, ShieldAlert, Zap, School, MapPin, Globe, Cloud, FileText, RefreshCw, BarChart2, BookOpen, AlertCircle, ArrowUpRight, Search, Filter } from 'lucide-react';
import { AppState, TenantType, UserRole } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { AnalyticsService } from '../../services/analyticsService';
import { ReportingService } from '../../services/reportingService';
import { Download } from 'lucide-react';

import { GlobalRankingView } from './GlobalRankingView';
import { GeoMap } from './GeoMap';
import { AuditLogView } from '../admin/components/AuditLogView';

export const NetworkDashboardView = () => {
    const state = useAppStore();
    const analytics = new AnalyticsService();

    const { currentUser, tenants } = state;

    // Identificar Nível Hierárquico (FORÇADO FEDERAL PARA CALIBRAÇÃO)
    let dashboardLevel: 'FEDERAL' | 'STATE' | 'MUNICIPAL' = 'FEDERAL';
    /* 
    const userTenant = tenants.find(t => t.id === currentUser?.tenantId);
    if (currentUser?.role === UserRole.SUPER_ADMIN || userTenant?.type === TenantType.PUBLIC_FEDERAL) {
        dashboardLevel = 'FEDERAL';
    } else if (userTenant?.type === TenantType.PUBLIC_STATE) {
        dashboardLevel = 'STATE';
    }
    */

    // Estados de UI
    const [showRanking, setShowRanking] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null); // Filtro pelo mapa
    const [selectedState, setSelectedState] = useState<string | null>(null); // Estado para o modal de Ranking
    const [viewMode, setViewMode] = useState<'DASHBOARD' | 'GOVERNANCE'>('DASHBOARD');
    const [chartMode, setChartMode] = useState<'IDEB' | 'PISA'>('IDEB');

    // ... (Map logic remains)

    // --- RENDER GOVERNANCE VIEW ---
    if (viewMode === 'GOVERNANCE') {
        return (
            <div className="min-h-screen bg-slate-50 font-sans">
                {/* Header Simples com Voltar */}
                <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('DASHBOARD')} className="bg-slate-100 p-2 rounded hover:bg-slate-200 transition">
                            <TrendingUp size={20} className="text-slate-600" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800">Central de Governança</h1>
                    </div>
                </div>
                <AuditLogView />
            </div>
        );
    }


    const mapPoints = useMemo(() => {
        if (dashboardLevel === 'FEDERAL') {
            // ... (keep federal static for demo context if needed, but schools are more important)
            return [
                { id: 'ac', x: 10.5, y: 40.1, label: 'Acre (AC)', status: 'NORMAL', value: 6.2 },
                { id: 'al', x: 92.0, y: 38.0, label: 'Alagoas (AL)', status: 'WARNING', value: 5.5 },
                { id: 'ap', x: 74.0, y: 64.4, label: 'Amapá (AP)', status: 'NORMAL', value: 6.0 },
                { id: 'am', x: 25.0, y: 30.0, label: 'Amazonas (AM)', status: 'WARNING', value: 6.1 },
                { id: 'ba', x: 78.5, y: 47.0, label: 'Bahia (BA)', status: 'CRITICAL', value: 5.8 },
                { id: 'ce', x: 86.0, y: 65.0, label: 'Ceará (CE)', status: 'NORMAL', value: 6.8 },
                { id: 'df', x: 62.9, y: 54.0, label: 'Distrito Federal (DF)', status: 'NORMAL', value: 7.5 },
                { id: 'es', x: 78.0, y: 68.0, label: 'Espírito Santo (ES)', status: 'NORMAL', value: 6.9 },
                { id: 'go', x: 59.7, y: 56.2, label: 'Goiás (GO)', status: 'NORMAL', value: 6.7 },
                { id: 'ma', x: 66.5, y: 28.3, label: 'Maranhão (MA)', status: 'CRITICAL', value: 5.2 },
                { id: 'mt', x: 45.0, y: 53.5, label: 'Mato Grosso (MT)', status: 'NORMAL', value: 6.4 },
                { id: 'ms', x: 48.0, y: 69.5, label: 'Mato Grosso do Sul (MS)', status: 'NORMAL', value: 6.3 },
                { id: 'mg', x: 70.0, y: 66.0, label: 'Minas Gerais (MG)', status: 'NORMAL', value: 7.0 },
                { id: 'pa', x: 52.0, y: 28.3, label: 'Pará (PA)', status: 'WARNING', value: 5.2 },
                { id: 'pb', x: 94.0, y: 30.0, label: 'Paraíba (PB)', status: 'NORMAL', value: 6.1 },
                { id: 'pr', x: 58.0, y: 82.0, label: 'Paraná (PR)', status: 'NORMAL', value: 7.1 },
                { id: 'pe', x: 52.0, y: 33.5, label: 'Pernambuco (PE)', status: 'WARNING', value: 5.9 },
                { id: 'pi', x: 68.0, y: 4.0, label: 'Piauí (PI)', status: 'NORMAL', value: 6.3 },
                { id: 'rj', x: 75.0, y: 72.0, label: 'Rio de Janeiro (RJ)', status: 'WARNING', value: 6.5 },
                { id: 'rn', x: 92.0, y: 66.0, label: 'Rio Grande do Norte (RN)', status: 'NORMAL', value: 6.2 },
                { id: 'rs', x: 54.0, y: 92.0, label: 'Rio Grande do Sul (RS)', status: 'NORMAL', value: 6.9 },
                { id: 'ro', x: 28.6, y: 20.6, label: 'Rondônia (RO)', status: 'NORMAL', value: 6.1 },
                { id: 'rr', x: 30.0, y: 40.3, label: 'Roraima (RR)', status: 'NORMAL', value: 6.0 },
                { id: 'sc', x: 62.0, y: 87.0, label: 'Santa Catarina (SC)', status: 'NORMAL', value: 7.2 },
                { id: 'sp', x: 65.0, y: 76.0, label: 'São Paulo (SP)', status: 'NORMAL', value: 7.2 },
                { id: 'se', x: 92.0, y: 41.0, label: 'Sergipe (SE)', status: 'WARNING', value: 5.6 },
                { id: 'to', x: 63.7, y: 40.0, label: 'Tocantins (TO)', status: 'NORMAL', value: 6.2 },
            ];
        } else {
            // Escolas reais
            return state.schools.map((school) => {
                const pseudoRandom = (seed: string) => {
                    let val = 0;
                    for (let j = 0; j < seed.length; j++) val += seed.charCodeAt(j);
                    return val;
                };
                const x = (pseudoRandom(school.id + 'x') % 60) + 20;
                const y = (pseudoRandom(school.id + 'y') % 60) + 20;

                const students = state.students.filter(s => s.schoolId === school.id);
                const stats = students.map(s => analytics.getStudentStats(s.id)).filter(Boolean) as any[];

                const avg = stats.length > 0
                    ? stats.reduce((acc, curr) => acc + curr.idgScore, 0) / stats.length
                    : 0;

                let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
                // Only mark as Critical/Warning if there's actually data
                if (stats.length > 0) {
                    if (avg < 5) status = 'CRITICAL';
                    else if (avg < 7) status = 'WARNING';
                }

                return {
                    id: school.id,
                    x,
                    y,
                    label: school.name,
                    status,
                    value: avg
                };
            });
        }
    }, [dashboardLevel, state.schools, state.students]);

    // --- GRÁFICO 1: PROJEÇÃO IDEB (SVG Line Chart) ---
    // Simula dados históricos + projeção
    // --- GRÁFICO 1: PROJEÇÃO (SVG Line Chart) ---
    // Simula dados históricos + projeção (IDEB vs PISA mapping)
    const idebDataRaw = [
        { year: '2020', value: 4.8 },
        { year: '2021', value: 5.1 },
        { year: '2022', value: 5.3 },
        { year: '2023', value: 5.9 },
        { year: '2024', value: 6.2 },
        { year: '2025', value: 6.8 }, // Projeção
    ];

    const chartData = useMemo(() => {
        if (chartMode === 'IDEB') return idebDataRaw;
        // PISA Mapping: PISA = (IDEB * 35) + 320 (Realistic simulation for Brazil context)
        return idebDataRaw.map(d => ({
            ...d,
            value: Math.round((d.value * 35) + 320)
        }));
    }, [chartMode]);

    const renderLineChart = () => {
        const height = 150;
        const width = 300;
        const padding = 20;
        const isPisa = chartMode === 'PISA';
        const maxY = isPisa ? 650 : 8;
        const minY = isPisa ? 300 : 0;

        const points = chartData.map((d, i) => {
            const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((d.value - minY) / (maxY - minY)) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(' ');

        // Benchmarks PISA (OECD)
        const benchmarks = [
            { label: 'OCDE Mat', value: 472, color: '#3b82f6' },
            { label: 'OCDE Leit', value: 476, color: '#10b981' }
        ];

        return (
            <div className="w-full h-48 relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isPisa ? "#8b5cf6" : "#f59e0b"} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={isPisa ? "#8b5cf6" : "#f59e0b"} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Benchmark Lines (PISA only) */}
                    {isPisa && benchmarks.map((b, i) => {
                        const y = height - padding - ((b.value - minY) / (maxY - minY)) * (height - 2 * padding);
                        return (
                            <g key={i}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke={b.color} strokeWidth="1" strokeDasharray="4" />
                                <text x={width - padding + 2} y={y + 3} fontSize="7" fill={b.color} fontWeight="bold">{b.label}</text>
                            </g>
                        );
                    })}

                    {/* Area Fill */}
                    <path d={`M ${points} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#lineGradient)" />

                    {/* Line */}
                    <polyline points={points} fill="none" stroke={isPisa ? "#8b5cf6" : "#f59e0b"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />

                    {/* Dots */}
                    {chartData.map((d, i) => {
                        const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
                        const y = height - padding - ((d.value - minY) / (maxY - minY)) * (height - 2 * padding);
                        return (
                            <g key={i} className="group">
                                <circle cx={x} cy={y} r="4" fill="#fff" stroke={isPisa ? "#8b5cf6" : "#f59e0b"} strokeWidth="2" className="group-hover:r-6 transition-all cursor-pointer" />
                                <text x={x} y={y - 12} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="bold">{d.value}</text>
                                <text x={x} y={height + 10} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.year}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    // --- DATA FETCHING ---
    const networkStats = analytics.getNetworkStats();
    const realSubjectsData = analytics.getSubjectBreakdown();

    // --- GRÁFICO 1: PROJEÇÃO IDEB (SVG Line Chart) ---

    const renderBarChart = () => {
        const displayData = realSubjectsData.length > 0 ? realSubjectsData : [
            { label: 'Sem Dados', value: 0, color: '#cbd5e1' }
        ];

        return (
            <div className="h-48 flex items-end justify-between gap-3 pt-6">
                {displayData.map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div className="relative w-full flex items-end justify-center h-full bg-slate-100 rounded-t-lg overflow-hidden">
                            <div
                                className="w-full transition-all duration-1000 ease-out relative hover:opacity-90"
                                style={{ height: `${s.value * 10}%`, backgroundColor: s.color }}
                            >
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    {s.value.toFixed(1)}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 font-bold uppercase truncate w-full text-center">{s.label}</span>
                    </div>
                ))}
            </div>
        );
    };

    // --- GRÁFICO 3: GARGALOS DE APRENDIZAGEM (Futuristic Tags) ---
    const gaps = [
        { topic: 'Equação do 2º Grau', subject: 'Matemática', impact: 'Crítico', value: 4.2 },
        { topic: 'Interpretação de Texto', subject: 'Português', impact: 'Crítico', value: 5.1 },
        { topic: 'Geometria Espacial', subject: 'Matemática', impact: 'Alerta', value: 5.8 },
        { topic: 'Regras de Acentuação', subject: 'Português', impact: 'Alerta', value: 6.0 },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans">

            {/* TOP BAR / FILTERS */}
            <div className="bg-white border-b border-slate-200 sticky top-0 md:top-0 z-20 px-4 md:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-dark p-2 rounded-lg text-white">
                        {dashboardLevel === 'FEDERAL' ? <Globe size={24} /> : <MapPin size={24} />}
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-none">
                            {dashboardLevel === 'FEDERAL' ? 'Ministério da Educação' : dashboardLevel === 'STATE' ? 'Secretaria Estadual' : 'Secretaria Municipal'}
                        </h1>
                        <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                            Centro de Comando • {selectedRegion ? `Filtrado: ${selectedRegion}` : 'Visão Geral'}
                        </p>
                    </div>
                </div>

                <div className="flex w-full sm:w-auto gap-2 md:gap-3">
                    <button
                        onClick={() => setViewMode('GOVERNANCE')}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition shadow-sm"
                    >
                        <ShieldAlert size={16} className="text-amber-600" /> Governança & Auditoria
                    </button>
                    <div className="flex-1 sm:flex-none flex items-center gap-2 bg-slate-100 px-3 md:px-4 py-2 rounded-lg border border-slate-200">
                        <Filter size={14} className="text-slate-400" />
                        <select className="bg-transparent text-xs md:text-sm font-bold text-slate-700 outline-none w-full">
                            <option>Todos os Anos</option>
                            <option>9º Ano Fundamental</option>
                            <option>3º Ano Médio</option>
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            const data = mapPoints.map(p => ({
                                Regiao: p.label,
                                Status: p.status,
                                'Média IDG': p.value.toFixed(2),
                                'Risco': p.status === 'CRITICAL' ? 'Alto' : p.status === 'WARNING' ? 'Médio' : 'Baixo'
                            }));
                            ReportingService.exportToExcel(data, `Relatorio_Rede_${new Date().toISOString().split('T')[0]}`);
                        }}
                        className="bg-emerald-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold shadow-sm hover:bg-emerald-500 flex items-center gap-2"
                    >
                        <Download size={14} /> Excel
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-white border border-slate-300 text-slate-700 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold shadow-sm hover:bg-slate-50 whitespace-nowrap"
                    >
                        Exportar PDF
                    </button>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto p-4 md:p-8 grid grid-cols-12 gap-6 md:gap-8">

                {/* ESQUERDA: MAPA INTERATIVO (8 Cols) */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

                    {/* KPI CARDS FLOATING OVER MAP AREA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Índice Geral (IDEB)</div>
                            <div className="text-2xl md:text-3xl font-black text-slate-800 flex items-end gap-2">
                                {networkStats.avgIDG.toFixed(1)} <span className="text-xs text-emerald-500 font-bold mb-1 flex items-center"><ArrowUpRight size={12} /> +0.4</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Total Alunos</div>
                            <div className="text-2xl md:text-3xl font-black text-slate-800">
                                {networkStats.totalStudents > 1000 ? `${(networkStats.totalStudents / 1000).toFixed(1)}k` : networkStats.totalStudents}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-400 text-[10px] md:text-xs font-bold uppercase mb-1">Risco Acadêmico</div>
                            <div className="text-2xl md:text-3xl font-black text-rose-500">{networkStats.riskPercentage.toFixed(0)}%</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-400 text-[10px] md:text-xs font-bold uppercase mb-1">Conectividade</div>
                            <div className="text-2xl md:text-3xl font-black text-brand-primary">100%</div>
                        </div>
                    </div>

                    {/* THE MAP - 3D VERSION */}
                    <div className="flex-1 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden min-h-[500px] bg-[#0f172a]">
                        <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-slate-400 uppercase shadow-sm border border-slate-700 flex items-center gap-2">
                            <MapPin size={12} /> Brasil 2D
                        </div>

                        {/* RANKING MODAL */}
                        {selectedState && (
                            <div className="absolute bottom-2 left-2 right-2 md:right-auto md:bottom-4 md:left-4 z-40 md:w-72 bg-slate-900/95 backdrop-blur shadow-2xl rounded-2xl border border-slate-700 animate-in slide-in-from-left-4 overflow-hidden">
                                <div className="bg-brand-dark p-3 flex justify-between items-center border-b border-slate-700">
                                    <div>
                                        <div className="text-[9px] font-bold text-brand-secondary uppercase tracking-widest">Top 10 Escolas</div>
                                        <h4 className="text-white font-bold text-sm tracking-tight">{selectedState}</h4>
                                    </div>
                                    <button onClick={() => setSelectedState(null)} className="text-slate-400 hover:text-white p-1">
                                        <AlertCircle size={16} className="rotate-45" />
                                    </button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 group">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[10px] font-mono text-slate-500 w-3">{i + 1}</span>
                                                <div>
                                                    <div className="text-[11px] font-bold text-slate-200 group-hover:text-brand-secondary transition-colors line-clamp-1">Escola Estadual {['Cora Coralina', 'Darcy Ribeiro', 'Machado de Assis', 'Cecília Meireles'][i % 4]} {i + 1}</div>
                                                    <div className="text-[9px] text-slate-500">Média IDEB • 98% Part.</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[11px] font-black text-emerald-400">{(8.5 - (i * 0.15)).toFixed(1)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 bg-slate-800/80 border-t border-slate-700 text-center">
                                    <button className="text-[9px] font-bold text-brand-primary uppercase hover:underline">Relatório Completo</button>
                                </div>
                            </div>
                        )}

                        <div className="w-full h-full rounded-xl overflow-hidden">
                            <GeoMap
                                level={dashboardLevel}
                                dataPoints={mapPoints as any}
                                onSelect={(id) => {
                                    const normalizedId = id.toLowerCase();
                                    const point = mapPoints.find(p => p.id.toLowerCase() === normalizedId);
                                    const label = point?.label || id.toUpperCase();

                                    setSelectedRegion(label);
                                    if (dashboardLevel === 'FEDERAL') {
                                        setSelectedState(label);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* DIREITA: PAINEL DE INDICADORES (4 Cols) */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6">

                    {/* CHART 1: PROJEÇÃO IDEB / PISA */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className={chartMode === 'PISA' ? "text-purple-500" : "text-amber-500"} />
                                {chartMode === 'IDEB' ? 'Projeção IDEB da Rede' : 'Simulação PISA (Consolidado)'}
                            </h3>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setChartMode('IDEB')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${chartMode === 'IDEB' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    IDEB
                                </button>
                                <button
                                    onClick={() => setChartMode('PISA')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${chartMode === 'PISA' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    PISA
                                </button>
                            </div>
                        </div>
                        {renderLineChart()}
                        <div className={`mt-4 text-xs text-center p-2 rounded border ${chartMode === 'PISA' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            {chartMode === 'IDEB' ? (
                                <>Meta 2025: <strong>7.0</strong> (Necessário +0.2 pontos)</>
                            ) : (
                                <>Projeção PISA 2025: <strong>558 pts</strong> (Média Brasil 2022: 379-418)</>
                            )}
                        </div>
                    </div>

                    {/* CHART 2: DESEMPENHO POR DISCIPLINA */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                            <BarChart2 className="text-brand-primary" /> Desempenho por Disciplina
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">Média ponderada das últimas avaliações.</p>
                        {renderBarChart()}
                    </div>

                    {/* CHART 3: GARGALOS DE APRENDIZAGEM (HUD STYLE) */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle size={80} /></div>

                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 relative z-10">
                            <Zap className="text-rose-500" fill="currentColor" /> Gargalos de Aprendizagem
                        </h3>

                        <div className="space-y-3 relative z-10">
                            {gaps.map((gap, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-rose-200 transition group">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase mb-0.5">{gap.subject}</div>
                                        <div className="font-bold text-slate-800 text-sm">{gap.topic}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xl font-black ${gap.impact === 'Crítico' ? 'text-rose-500' : 'text-amber-500'}`}>
                                            {gap.value.toFixed(1)}
                                        </div>
                                        <div className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white ${gap.impact === 'Crítico' ? 'bg-rose-500' : 'bg-amber-500'}`}>
                                            {gap.impact}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Sync Modal (Mantido) */}
            {showSyncModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center">
                        <RefreshCw size={48} className="mx-auto text-brand-primary mb-4 animate-spin" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sincronizando Rede...</h2>
                        <p className="text-slate-500 mb-6">Recebendo pacotes criptografados das unidades escolares.</p>
                        <button onClick={() => setShowSyncModal(false)} className="btn-gradient px-6 py-2 rounded-lg text-white font-bold">Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};
