import React, { useEffect, useState } from 'react';
import { 
    Activity, 
    Zap, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    Globe, 
    Signal,
    BarChart3
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';
import { operationalHealthService } from '../../services/operationalHealthService';

/**
 * OperationalHealthDashboard - Fase 8
 * Centro de monitoramento global de SLOs e telemetria de campo.
 */
export default function OperationalHealthDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHealth() {
            setLoading(true);
            try {
                // Simulação de agregação para visualização (Fase VIII)
                const mockChart = Array.from({ length: 24 }).map((_, i) => ({
                    hour: `${i}h`,
                    latency: 800 + Math.random() * 2000,
                    success: 95 + Math.random() * 5
                }));
                setChartData(mockChart);

                const currentLocal = operationalHealthService.getLocalHealthMetrics();
                setStats(currentLocal);
            } catch (error) {
                console.error('Erro ao carregar saúde operacional:', error);
            } finally {
                setLoading(false);
            }
        }
        loadHealth();
    }, []);

    const sloStatus = stats?.status || 'OK';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${sloStatus === 'OK' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            <Activity size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Saúde Operacional (SLO)
                        </h1>
                    </div>
                    <p className="text-slate-500">
                        Monitoramento de telemetria em tempo real e conformidade de nível de serviço.
                    </p>
                </div>

                <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 border-2 ${sloStatus === 'OK' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                    {sloStatus === 'OK' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} className="animate-pulse" />}
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Status Global</div>
                        <div className="text-lg font-black leading-none">{sloStatus === 'OK' ? 'SISTEMA SAUDÁVEL' : 'ALERTA DE SLO'}</div>
                    </div>
                </div>
            </header>

            {/* Grid de Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard 
                    icon={<Clock className="text-brand-primary" />}
                    label="Latência P95"
                    value={`${stats?.p95Latency || 0}ms`}
                    description="Objetivo: < 5000ms"
                    status={stats?.p95Latency < 5000 ? 'good' : 'bad'}
                />
                <MetricCard 
                    icon={<Zap className="text-amber-500" />}
                    label="Taxa de Sucesso"
                    value={`${stats?.successRate || 0}%`}
                    description="Objetivo: > 98%"
                    status={stats?.successRate > 98 ? 'good' : 'bad'}
                />
                <MetricCard 
                    icon={<Signal className="text-blue-500" />}
                    label="Amostras (24h)"
                    value={stats?.sampleSize || 0}
                    description="Volume de telemetria"
                />
                <MetricCard 
                    icon={<Globe className="text-indigo-500" />}
                    label="Escolas Ativas"
                    value="12"
                    description="Em janelas de prova"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Latência */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 size={18} className="text-brand-primary" /> Histórico de Latência (P95)
                        </h3>
                        <span className="text-xs text-slate-400">Últimas 24 horas</span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1b6ca8" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#1b6ca8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="latency" stroke="#1b6ca8" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Sucesso */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-500" /> Disponibilidade de Sincronização
                        </h3>
                        <span className="text-xs text-slate-400">Objetivo: 99.9%</span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <YAxis domain={[90, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Hotspots de Erro */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="text-amber-500" />
                    <div>
                        <h3 className="font-bold text-slate-800 leading-tight">Hotspots de Performance</h3>
                        <p className="text-xs text-slate-500">Escolas que violaram o SLO nos últimos 60 minutos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <HotspotCard school="E.M. Dom Pedro II" latency="8.4s" trend="up" />
                    <HotspotCard school="Instituto Marista" latency="5.1s" trend="down" />
                    <HotspotCard school="Colégio Objetivo Centro" latency="4.8s" trend="up" />
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, description, status }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
                {status && (
                    <div className={`h-2 w-2 rounded-full ${status === 'good' ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                )}
            </div>
            <div className="text-2xl font-black text-slate-800 mb-1">{value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
            <p className="text-[10px] text-slate-400">{description}</p>
        </div>
    );
}

function HotspotCard({ school, latency, trend }: any) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs">
                    {school[0]}
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-800">{school}</div>
                    <div className="text-[10px] text-rose-500 font-bold">Latência: {latency}</div>
                </div>
            </div>
            <div className={`text-xs font-bold ${trend === 'up' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {trend === 'up' ? '↗' : '↘'}
            </div>
        </div>
    );
}
