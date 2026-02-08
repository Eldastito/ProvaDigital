import React from 'react';
import {
    LayoutDashboard, Users, CreditCard, Activity,
    TrendingUp, Shield, Settings, AlertCircle,
    CheckCircle2, Clock, Globe, Zap, Calculator, TrendingDown
} from 'lucide-react';
import { useSafeAppStore } from '../../store/useAppStore';
import { BusinessCalculator } from './components/BusinessCalculator';

const MetricCard = ({ title, value, detail, icon: Icon, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-brand-primary/5 rounded-xl group-hover:bg-brand-primary/10 transition-colors">
                <Icon className="text-brand-primary" size={22} />
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
        <p className="text-slate-400 text-[10px] mt-2 font-medium">{detail}</p>
    </div>
);

export const SaaSControlPanelView = () => {
    const { tenants, students } = useSafeAppStore();
    const [view, setView] = React.useState<'dashboard' | 'calculator'>('dashboard');

    // Mock metrics for demo/business management
    const totalMRR = 45500;
    const activeStudents = students.length;
    const totalTenants = tenants.length;
    const examsInLast24h = 1240;

    if (view === 'calculator') {
        return (
            <div className="p-8 space-y-6">
                <button
                    onClick={() => setView('dashboard')}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-brand-primary transition-colors uppercase tracking-widest"
                >
                    <TrendingDown size={14} className="rotate-90" /> Voltar ao Dashboard
                </button>
                <BusinessCalculator />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto p-8 pb-12">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-brand-dark tracking-tight">Central de Controle SaaS</h1>
                    <p className="text-slate-500 font-medium">Gestão Empresarial, Faturamento e Monitoramento Global</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('calculator')}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Calculator size={18} /> Calculadora de Negócios
                    </button>
                    <button className="px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform active:scale-95">
                        Novo Cliente / Prefeitura
                    </button>
                </div>
            </header>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Faturamento Mensal (MRR)"
                    value={`R$ ${totalMRR.toLocaleString('pt-BR')}`}
                    detail="Crescimento estável este mês"
                    icon={CreditCard}
                    trend={12.5}
                />
                <MetricCard
                    title="Alunos Ativos"
                    value={activeStudents.toLocaleString('pt-BR')}
                    detail="Em 18 prefeituras ativas"
                    icon={Users}
                    trend={4.2}
                />
                <MetricCard
                    title="Provas Realizadas"
                    value={examsInLast24h.toLocaleString('pt-BR')}
                    detail="Nas últimas 24 horas"
                    icon={Activity}
                    trend={25.1}
                />
                <MetricCard
                    title="Health Score"
                    value="99.9%"
                    detail="Infraestrutura operando normalmente"
                    icon={Shield}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Managed Tenants List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-sm">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase text-xs">
                                <Globe size={16} /> Gestão de Clientes (Tenants)
                            </h2>
                            <span className="text-[10px] font-bold text-slate-400">{totalTenants} Redes Ativas</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Cliente / CNPJ</th>
                                        <th className="px-6 py-4">Alunos / Limite</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Vencimento</th>
                                        <th className="px-6 py-4">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tenants.map(tenant => (
                                        <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{tenant.name}</div>
                                                <div className="text-[10px] text-slate-400">{tenant.cnpj || '00.000.000/0001-00'}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {students.filter(s => s.tenantId === tenant.id).length} / {(tenant as any).maxStudents || 5000}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${(tenant as any).status === 'active' || !tenant.status ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${(tenant as any).status === 'active' || !tenant.status ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    {((tenant as any).status === 'active' || !tenant.status) ? 'Ativo' : 'Suspenso'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {(tenant as any).contractEnd || '31/12/2026'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-brand-primary font-bold text-[10px] hover:underline">GERENCIAR</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-brand-dark rounded-2xl p-6 text-white shadow-xl shadow-brand-dark/20 relative overflow-hidden">
                        <Zap className="absolute -top-4 -right-4 text-white/5" size={120} />
                        <h3 className="text-xs font-bold text-brand-secondary uppercase mb-4 relative z-10 font-sans">IA Consumption</h3>
                        <div className="flex justify-between items-end mb-4 relative z-10">
                            <span className="text-3xl font-black tracking-tighter">842.1k</span>
                            <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">tokens this week</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-6 relative z-10">
                            <div className="h-full bg-brand-secondary w-[72%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed relative z-10">
                            O uso de IA aumentou 18% em relação à semana passada devido ao novo motor de correção de redações.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Próximos Vencimentos</h3>
                        <div className="space-y-4">
                            {[
                                { name: 'P.M. São Paulo', date: 'Em 4 dias', value: 'R$ 15.420' },
                                { name: 'P.M. Campinas', date: 'Em 12 dias', value: 'R$ 8.900' },
                                { name: 'P.M. Curitiba', date: 'Em 15 dias', value: 'R$ 12.100' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">{item.name}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                                    </div>
                                    <span className="text-xs font-black text-brand-primary">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
