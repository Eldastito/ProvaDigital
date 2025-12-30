
import React, { useRef, useState, useMemo } from 'react';
import { TrendingUp, Users, ShieldAlert, Zap, School, MapPin, Globe, Cloud, FileText, RefreshCw, BarChart2, BookOpen, AlertCircle, ArrowUpRight, Search, Filter } from 'lucide-react';
import { AppState, TenantType, School as SchoolType, Student, ExamResult, Exam, ExamRegistration, UserProfileExtended, Tenant } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { GlobalRankingView } from './GlobalRankingView';
import { DataNebulaView } from './DataNebulaView'; // Importar o novo componente
import { useQuery } from '@tanstack/react-query';
import { fetchTenants, fetchSchools, fetchStudents, fetchResults, fetchExams, fetchRegistrations, fetchUserProfiles } from '../../services/supabaseClient';

export const NetworkDashboardView = ({ state }: { state: AppState }) => {
    const { currentUser } = state;
    
    // Fetch all necessary data via React Query
    // @fix: Updated useQuery calls to new object-based syntax (v5+)
    const { data: allTenants } = useQuery<Tenant[]>({ queryKey: ['tenants'], queryFn: fetchTenants, initialData: [] });
    const { data: allSchools } = useQuery<SchoolType[]>({ queryKey: ['schools'], queryFn: fetchSchools, initialData: [] });
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allResults } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults, initialData: [] });
    const { data: allExams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams, initialData: [] });
    const { data: allRegistrations } = useQuery<ExamRegistration[]>({ queryKey: ['registrations'], queryFn: fetchRegistrations, initialData: [] });
    const { data: allUserProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });

    // Initialize AnalyticsService with fetched data
    const analytics = useMemo(() => new AnalyticsService(), []);

    // Identificar Nível Hierárquico
    let dashboardLevel: 'FEDERAL' | 'STATE' | 'MUNICIPAL' = 'MUNICIPAL';
    // @fix: Added optional chaining for data access
    const userTenant = (allTenants || []).find(t => t.id === currentUser?.tenantId);
    
    if (userTenant?.type === TenantType.PUBLIC_FEDERAL) dashboardLevel = 'FEDERAL';
    else if (userTenant?.type === TenantType.PUBLIC_STATE) dashboardLevel = 'STATE';
    
    // Estados de UI
    const [showRanking, setShowRanking] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null); // Filtro pelo mapa
    
    // --- DADOS DO MAPA (COORDENADAS CALIBRADAS PARA O NOVO MAPA IBGE) ---
    // ViewBox de Referência: 612 x 650
    // As coordenadas abaixo são porcentagens (X%, Y%) da caixa total
    const mapPoints = useMemo(() => {
        if (dashboardLevel === 'FEDERAL') {
            return [
                { id: 'sp', x: 62, y: 72, label: 'São Paulo (SP)', status: 'NORMAL', value: 7.2 },
                { id: 'rj', x: 73, y: 70, label: 'Rio de Janeiro (RJ)', status: 'WARNING', value: 6.5 },
                { id: 'mg', x: 67, y: 62, label: 'Minas Gerais (MG)', status: 'NORMAL', value: 7.0 },
                { id: 'ba', x: 76, y: 45, label: 'Bahia (BA)', status: 'CRITICAL', value: 5.8 },
                { id: 'am', x: 25, y: 28, label: 'Amazonas (AM)', status: 'WARNING', value: 6.1 },
                { id: 'rs', x: 55, y: 88, label: 'Rio Grande do Sul (RS)', status: 'NORMAL', value: 6.9 },
                { id: 'mt', x: 42, y: 52, label: 'Mato Grosso (MT)', status: 'NORMAL', value: 6.4 },
                { id: 'pe', x: 88, y: 35, label: 'Pernambuco (PE)', status: 'WARNING', value: 5.9 },
                { id: 'ce', x: 83, y: 25, label: 'Ceará (CE)', status: 'NORMAL', value: 6.8 },
                { id: 'df', x: 60, y: 53, label: 'Distrito Federal (DF)', status: 'NORMAL', value: 7.5 },
                { id: 'pa', x: 50, y: 20, label: 'Pará (PA)', status: 'WARNING', value: 5.2 },
            ];
        } else {
            // Escolas reais ou mockadas para níveis menores (Posições fictícias)
            // @fix: Added fallback array and optional chaining
            return (allSchools || []).map((school) => {
                const pseudoRandom = (seed: string) => {
                    let val = 0;
                    for(let j=0; j<seed.length; j++) val += seed.charCodeAt(j);
                    return val;
                };
                const x = (pseudoRandom(school.id + 'x') % 50) + 25; 
                const y = (pseudoRandom(school.id + 'y') % 50) + 25;
                
                // @fix: Added optional chaining and fallback for array filtering
                const students = (allStudents || []).filter(s => s.schoolId === school.id);
                // @fix: Provided fallbacks for analytics parameters
                const stats = students.map(s => analytics.getStudentStats(s.id, allStudents || [], allResults || [], allExams || [], allRegistrations || [], allUserProfiles || [])).filter(Boolean) as any[];
                const avg = stats.reduce((acc, curr) => acc + curr.idgScore, 0) / (stats.length || 1);
                
                let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
                if (avg < 5) status = 'CRITICAL';
                else if (avg < 7) status = 'WARNING';

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
    }, [dashboardLevel, allSchools, allStudents, allResults, allExams, allRegistrations, allUserProfiles]);

    // --- GRÁFICO 1: PROJEÇÃO IDEB (SVG Line Chart) ---
    // Simula dados históricos + projeção
    const idebData = [
        { year: '2020', value: 4.8 },
        { year: '2021', value: 5.1 },
        { year: '2022', value: 5.3 },
        { year: '2023', value: 5.9 },
        { year: '2024', value: 6.2 },
        { year: '2025', value: 6.8 }, // Projeção
    ];

    const renderLineChart = () => {
        const height = 150;
        const width = 300;
        const padding = 20;
        const maxY = 8;
        
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

    // --- GRÁFICO 2: DESEMPENHO POR DISCIPLINA (Bar Chart) ---
    const subjectsData = [
        { label: 'Português', value: 7.5, color: '#3b82f6' },
        { label: 'Matemática', value: 6.2, color: '#2563eb' },
        { label: 'Ciências', value: 6.8, color: '#1d4ed8' },
        { label: 'História', value: 7.9, color: '#1e40af' },
        { label: 'Geografia', value: 7.1, color: '#172554' },
    ];

    const renderBarChart = () => {
        return (
            <div className="h-48 flex items-end justify-between gap-3 pt-6">
                {subjectsData.map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div className="relative w-full flex items-end justify-center h-full bg-slate-100 rounded-t-lg overflow-hidden">
                            <div 
                                className="w-full transition-all duration-1000 ease-out relative hover:opacity-90"
                                style={{ height: `${s.value * 10}%`, backgroundColor: s.color }}
                            >
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    {s.value}
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
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-dark p-2 rounded-lg text-white">
                        {dashboardLevel === 'FEDERAL' ? <Globe size={24}/> : <MapPin size={24}/>}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 leading-none">
                            {dashboardLevel === 'FEDERAL' ? 'Ministério da Educação' : dashboardLevel === 'STATE' ? 'Secretaria Estadual' : 'Secretaria Municipal'}
                        </h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                            Command Center • {selectedRegion ? `Filtrado: ${selectedRegion}` : 'Visão Geral'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                        <Filter size={16} className="text-slate-400"/>
                        <select className="bg-transparent text-sm font-bold text-slate-700 outline-none">
                            <option>Todos os Anos</option>
                            <option>9º Ano Fundamental</option>
                            <option>3º Ano Médio</option>
                        </select>
                    </div>
                    <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50">
                        Exportar PDF
                    </button>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto p-8 grid grid-cols-12 gap-8">
                
                {/* ESQUERDA: MAPA INTERATIVO (8 Cols) */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                    
                    {/* KPI CARDS FLOATING OVER MAP AREA */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Índice Geral (IDEB)</div>
                            <div className="text-3xl font-black text-slate-800 flex items-end gap-2">
                                6.8 <span className="text-xs text-emerald-500 font-bold mb-1 flex items-center"><ArrowUpRight size={12}/> +0.4</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Total Alunos</div>
                            <div className="text-3xl font-black text-slate-800">14.2k</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Risco Acadêmico</div>
                            <div className="text-3xl font-black text-rose-500">12%</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Conectividade</div>
                            <div className="text-3xl font-black text-brand-primary">98%</div>
                        </div>
                    </div>

                    {/* THE MAP (Now Data Nebula) */}
                    <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 p-1 relative overflow-hidden min-h-[500px]">
                        {/* Remove o rótulo "Brasil / Estados" pois não é mais um mapa geográfico */}
                        {/* <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold text-slate-500 uppercase shadow-sm border border-slate-100 flex items-center gap-2">
                            <MapPin size={12}/> Brasil / Estados
                        </div> */}
                        <div className="w-full h-full rounded-xl overflow-hidden bg-white">
                            <DataNebulaView // Usar o novo componente DataNebulaView
                                level={dashboardLevel} 
                                dataPoints={mapPoints as any} 
                                onSelect={(id) => {
                                    const point = mapPoints.find(p => p.id === id);
                                    setSelectedRegion(point?.label || id.toUpperCase());
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* DIREITA: PAINEL DE INDICADORES (4 Cols) */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6">
                    
                    {/* CHART 1: PROJEÇÃO IDEB */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="text-amber-500"/> Projeção IDEB da Rede
                            </h3>
                            <button className="text-xs text-slate-400 hover:text-brand-primary"><Filter size={14}/></button>
                        </div>
                        {renderLineChart()}
                        <div className="mt-4 text-xs text-slate-500 text-center bg-amber-50 p-2 rounded border border-amber-100">
                            Meta 2025: <strong>7.0</strong> (Necessário +0.2 pontos)
                        </div>
                    </div>

                    {/* CHART 2: DESEMPENHO POR DISCIPLINA */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                            <BarChart2 className="text-brand-primary"/> Desempenho por Disciplina
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">Média ponderada das últimas avaliações.</p>
                        {renderBarChart()}
                    </div>

                    {/* CHART 3: GARGALOS DE APRENDIZAGEM (HUD STYLE) */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle size={80}/></div>
                        
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 relative z-10">
                            <Zap className="text-rose-500" fill="currentColor"/> Gargalos de Aprendizagem
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
                        <RefreshCw size={48} className="mx-auto text-brand-primary mb-4 animate-spin"/>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sincronizando Rede...</h2>
                        <p className="text-slate-500 mb-6">Recebendo pacotes criptografados das unidades escolares.</p>
                        <button onClick={() => setShowSyncModal(false)} className="btn-gradient px-6 py-2 rounded-lg text-white font-bold">Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};
