import React from 'react';
import { useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, CreditCard, Activity,
    TrendingUp, Shield, Settings, AlertCircle,
    CheckCircle2, Clock, Globe, Zap, Calculator, TrendingDown
} from 'lucide-react';
import { useSafeAppStore } from '../../store/useAppStore';
import { BusinessCalculator } from './components/BusinessCalculator';
import { AIAdvisorDashboard } from './components/AIAdvisorDashboard';
import { TenantFormModal } from './components/TenantFormModal';
import { calculateBusinessMetrics, calculateLogistics, generateAIInsights } from '../../utils/saasCalculators';

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
    const [view, setInternalView] = React.useState<'dashboard' | 'calculator'>('dashboard');
    const [isTenantModalOpen, setIsTenantModalOpen] = React.useState(false);
    const location = useLocation();
    const path = location.pathname;

    // Novos dados granulares compatíveis com o motor atualizado (Business X-Ray)
    const colaboradores = [
        { id: '1', cargo: 'Operação Central', salario: 12000, quantidade: 1, beneficios: 1500 },
        { id: '2', cargo: 'Suporte Técnico', salario: 3500, quantidade: 2, beneficios: 800 },
    ];
    const infra_sede = { luz: 500, agua: 100, internet: 800, manutencao: 500, seguros: 1500 };
    const veiculo_ops = { valor: 85000, tipo: 'aquisicao' as const, seguro: 2500, manutencao: 1200 };
    const patrimônio_extra = { computadores: 15000, infraestrutura: 5000 };
    const custos_variáveis = { combustívelMensal: 2500, outrosPorAluno: 2.5 };
    const fiscal_config = { iss: 5, pisCofins: 3.65, encargosFolha: 28 };

    const cac_global = 2500;
    const churn_global = 3.5;
    const target_scale = 5000;

    const metrics = React.useMemo(() => calculateBusinessMetrics(
        colaboradores, infra_sede, veiculo_ops, patrimônio_extra, custos_variáveis, fiscal_config,
        cac_global, churn_global, target_scale,
        // Novos argumentos (investimentoHardware, custoInicialPorAluno, outrosCustos) com valores default para o Dashboard
        85000, // Valor fixo de investimento em hardware para o dashboard simplificado
        150,   // Custo inicial padrão
        { fixo: 0, variavel: 0 } // Outros custos zerados
    ), [tenants.length, students.length]);

    const ops = React.useMemo(() => calculateLogistics(
        50, target_scale, 5, 6, 92
    ), [target_scale]);

    const aiInsights = React.useMemo(() => generateAIInsights(metrics, ops), [metrics, ops]);

    const totalMRR = metrics.marketing.ticketMédio * target_scale;
    const activeStudents = students.length;
    const totalTenants = tenants.length;
    const examsInLast24h = 1240;

    if (view === 'calculator') {
        return (
            <div className="p-8 space-y-6">
                <button
                    onClick={() => setInternalView('dashboard')}
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
                    <h1 className="text-3xl font-black text-brand-dark tracking-tight">
                        {path.includes('/admin/tenants') ? 'Gestão de Clientes (Tenants)' :
                            path.includes('/admin/metrics') ? 'Métricas de Negócio & KPIs' :
                                'Central de Controle SaaS'}
                    </h1>
                    <p className="text-slate-500 font-medium font-sans">
                        {path.includes('/admin/tenants') ? 'Administração de prefeituras, contratos e limites' :
                            path.includes('/admin/metrics') ? 'Visão detalhada de faturamento, CAC, LTV e Churn' :
                                'Gestão Empresarial, Faturamento e Monitoramento Global'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setInternalView('calculator')}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <Calculator size={18} /> Calculadora de Negócios
                    </button>
                    <button
                        onClick={() => setIsTenantModalOpen(true)}
                        className="px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
                    >
                        <Users size={18} /> Novo Cliente / Prefeitura
                    </button>
                </div>
            </header>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Prefeituras / Redes"
                    value={totalTenants}
                    detail="Instâncias ativas no core"
                    icon={Globe}
                />
                <MetricCard
                    title="Alunos Ativos (Global)"
                    value={activeStudents.toLocaleString()}
                    detail={`${((activeStudents / target_scale) * 100).toFixed(1)}% da meta de escala`}
                    icon={Users}
                />
                <MetricCard
                    title="MRR Projetado"
                    value={`R$ ${totalMRR.toLocaleString('pt-BR')}`}
                    detail="Receita Recorrente Mensal"
                    icon={CreditCard}
                    trend={12.4}
                />
                <MetricCard
                    title="Exames (24h)"
                    value={examsInLast24h.toLocaleString()}
                    detail="Monitoramento em tempo real"
                    icon={Activity}
                    trend={5.2}
                />
            </div>

            {/* Strategic Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-sm">
                <div className="lg:col-span-2 space-y-8">
                    {/* AI Advisor Strategic Panel */}
                    <AIAdvisorDashboard insights={aiInsights} />

                    {/* Table of active tenants */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <h2 className="font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase text-[10px] tracking-widest">
                                <Globe size={14} className="text-brand-primary" /> Clientes Ativos
                            </h2>
                            <span className="text-[10px] font-bold text-slate-400">{totalTenants} Redes Ativas</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Cliente / CNPJ</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">LTV Estimado</th>
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
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${tenant.status === 'active' || !tenant.status ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'active' || !tenant.status ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    {(tenant.status === 'active' || !tenant.status) ? 'Ativo' : 'Suspenso'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-600">
                                                R$ {metrics.financial.ltv.toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-brand-primary font-black text-[10px] hover:underline uppercase tracking-widest">Gerenciar</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {tenants.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                                Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Escalabilidade Detail */}
                    <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/40">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                            <Zap size={150} />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="p-3 bg-brand-primary/20 rounded-xl w-fit">
                                <Zap className="text-brand-primary" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight leading-tight">Métricas Críticas de Ecossistema</h3>
                                <p className="text-slate-400 text-xs mt-3 leading-relaxed font-medium">
                                    Seu Unit Economic é positivo. A relação LTV/CAC de <span className="text-white font-black">{metrics.financial.ltvCacRatio.toFixed(1)}x</span> indica alta sustentabilidade.
                                </p>
                            </div>
                            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Valuation Estimado</p>
                                    <p className="text-2xl font-black tracking-tighter">R$ {(metrics.financial.valuationEstimado / 1000000).toFixed(1)}M</p>
                                </div>
                                <div className="text-brand-secondary font-black text-[9px] uppercase flex items-center gap-1 border border-brand-secondary/30 px-2 py-1 rounded">
                                    <TrendingUp size={10} /> Tier 1 SaaS
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure Status */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500" /> Infraestrutura & API
                        </h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Auth Gateway', status: 'online', ms: 45 },
                                { label: 'Vector DB (IA)', status: 'online', ms: 12 },
                                { label: 'Mesh Sync Server', status: 'online', ms: 82 },
                                { label: 'Supabase Cluster', status: 'warning', ms: 320 },
                            ].map((s, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="font-bold text-slate-600 text-xs">{s.label}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400 font-mono text-[10px]">{s.ms}ms</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TenantFormModal
                isOpen={isTenantModalOpen}
                onClose={() => setIsTenantModalOpen(false)}
            />
        </div>
    );
};
