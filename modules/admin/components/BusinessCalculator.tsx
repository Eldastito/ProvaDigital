import React, { useState, useMemo, useEffect } from 'react';
import {
    Calculator, Laptop, TrendingUp, FileText,
    Plus, Minus, TrendingDown, DollarSign,
    Package, MapPin, BarChart3, Receipt,
    Download, Printer, Shield, Users, Clock, Globe,
    Sparkles, BrainCircuit, MessageSquare, ToggleLeft, ToggleRight,
    Zap, Target, Layers, Activity, Briefcase
} from 'lucide-react';
import { calculateLogistics, calculateBusinessMetrics } from '../../../utils/saasCalculators';
import { useAppStore } from '../../../store/useAppStore';
import { getRealLogisticsDemand } from '../../../utils/logisticsEngine';
import { analyticsService } from '../../../services/analyticsService';
import { AITutorDrawer } from './AITutorDrawer';
import { KPI_KNOWLEDGE_BASE } from '../../../utils/kpiKnowledgeBase';

const Card = ({ children, className = "" }: any) => (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

const InputField = ({ label, value, onChange, type = "number", suffix, prefix, help, onLearnMore, kpiId, min, max, step }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
            <span className="flex items-center gap-1">
                {label}
                {kpiId && (
                    <button
                        onClick={() => onLearnMore(kpiId)}
                        className="p-1 text-brand-primary/50 hover:text-brand-primary transition-colors"
                    >
                        <Sparkles size={10} />
                    </button>
                )}
            </span>
            {help && <span className="normal-case font-medium text-slate-300">({help})</span>}
        </label>
        <div className="relative">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{prefix}</span>}
            <input
                type={type}
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                className={`w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-brand-primary/30 transition-all outline-none ${prefix ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-10' : 'pr-4'}`}
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{suffix}</span>}
        </div>
    </div>
);

const ResultTab = ({ label, value, sub, icon: Icon, color = "brand-primary", kpiId, onLearnMore, benchmark }: any) => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 bg-slate-50/30 group relative">
        <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
            <Icon size={20} />
        </div>
        <div className="flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                    {label}
                    {kpiId && (
                        <button
                            onClick={() => onLearnMore(kpiId)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-brand-primary hover:text-brand-light transition-all"
                        >
                            <Sparkles size={10} />
                        </button>
                    )}
                </span>
                {benchmark && (
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${benchmark === 'Best-in-Class' ? 'bg-emerald-500 text-white' :
                            benchmark === 'Tier 1' ? 'bg-blue-500 text-white' :
                                'bg-slate-200 text-slate-500'
                        }`}>
                        {benchmark}
                    </span>
                )}
            </div>
            <div className="text-lg font-black text-slate-800">{value}</div>
            {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
        </div>
    </div>
);

export const BusinessCalculator = () => {
    const store = useAppStore();
    const [activeTab, setActiveTab] = useState<'logistics' | 'financial' | 'report' | 'xray' | 'clevel' | 'simulation'>('xray');
    const [isIntelligenceMode, setIsIntelligenceMode] = useState(false);
    const [tutorKpi, setTutorKpi] = useState<string | null>(null);

    // RAIO-X: Custos Fixos Detalhados
    const [fixos, setFixos] = useState({
        aluguel: 3500,
        folhaPagamento: 12000,
        assinaturas: 800,
        financiamentos: 1500,
        outros: 1000
    });

    // RAIO-X: Custos Variáveis Detalhados
    const [variáveis, setVariáveis] = useState({
        combustível: 2.5,
        colaboradoresProjeto: 1.5,
        benefícios: 0.8,
        outros: 0.2
    });

    // RAIO-X: Ativos e Patrimônio (CapEx)
    const [patrimônio, setPatrimônio] = useState({
        tablets: 85000,
        computadores: 15000,
        infraestrutura: 5000
    });

    // RAIO-X: Fiscal
    const [fiscal, setFiscal] = useState({
        iss: 5,
        pisCofins: 3.65,
        encargosFolha: 28 // INSS + FGTS + Riscos
    });

    // Sales & Customers state
    const [cac, setCac] = useState(2500);
    const [churn, setChurn] = useState(1.8);
    const [targetScale, setTargetScale] = useState(1500);
    const [ticketManual, setTicketManual] = useState<number | undefined>(undefined);

    // What-IF Sliders
    const [simPriceAdj, setSimPriceAdj] = useState(0); // em %
    const [simChurnAdj, setSimChurnAdj] = useState(0); // em %

    // --- EFFECT: DATA SYNC ---
    useEffect(() => {
        if (isIntelligenceMode) {
            const realLogistics = getRealLogisticsDemand(store);
            if (realLogistics) {
                const peak = Math.max(...realLogistics.schools.map(s => s.peakStudentCount), 0);
                setPatrimônio(prev => ({ ...prev, tablets: peak * 1200 }));
                setTargetScale(store.students.length);
            }
        }
    }, [isIntelligenceMode, store]);

    // Dynamic calculations
    const adjustedTicket = useMemo(() => {
        const base = ticketManual || 0;
        if (base === 0) return undefined;
        return base * (1 + simPriceAdj / 100);
    }, [ticketManual, simPriceAdj]);

    const adjustedChurn = useMemo(() => {
        return Math.max(0.1, churn * (1 + simChurnAdj / 100));
    }, [churn, simChurnAdj]);

    const metrics = useMemo(() => calculateBusinessMetrics(
        fixos, variáveis, patrimônio, fiscal, cac, adjustedChurn, targetScale, 12, 85, 4, adjustedTicket
    ), [fixos, variáveis, patrimônio, fiscal, cac, adjustedChurn, targetScale, adjustedTicket]);

    const ops = useMemo(() => calculateLogistics(50, targetScale, 5, 6, 98, 2, 1), [targetScale]);

    const handlePrint = () => window.print();
    const handleOpenTutor = (id: string) => setTutorKpi(id);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
            <AITutorDrawer
                isOpen={!!tutorKpi}
                onClose={() => setTutorKpi(null)}
                kpi={tutorKpi ? KPI_KNOWLEDGE_BASE[tutorKpi] : null}
            />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800">
                        <Briefcase size={24} className="text-brand-secondary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight text-brand-dark uppercase">Enterprise RAIO-X</h2>
                        <p className="text-slate-500 text-sm font-medium">Gestão C-Level, Valuation & Sensibilidade</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsIntelligenceMode(!isIntelligenceMode)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${isIntelligenceMode
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                            }`}
                    >
                        <BrainCircuit size={18} className={isIntelligenceMode ? "animate-pulse" : ""} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isIntelligenceMode ? '🧠 Inteligência Real Ativa' : '🧪 Business Designer'}
                        </span>
                    </button>

                    <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl">
                        {[
                            { id: 'xray', label: 'Dashboard' },
                            { id: 'clevel', label: 'C-Level' },
                            { id: 'simulation', label: 'Simulação' },
                            { id: 'logistics', label: 'Logística' },
                            { id: 'report', label: 'Relatório' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-4 space-y-6 flex flex-col h-[85vh] overflow-y-auto no-scrollbar print:hidden sticky top-8 border-slate-200 shadow-sm">
                    <div className="space-y-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[10px] uppercase tracking-wider"><Package size={16} className="text-brand-primary" /> Ativos & CapEx</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Frota Tablets" value={patrimônio.tablets} onChange={(v: any) => setPatrimônio({ ...patrimônio, tablets: v })} prefix="R$" />
                            <InputField label="Workstations" value={patrimônio.computadores} onChange={(v: any) => setPatrimônio({ ...patrimônio, computadores: v })} prefix="R$" />
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[10px] uppercase tracking-wider"><DollarSign size={16} className="text-emerald-500" /> Estrutura de Custos (OpEx)</h3>
                        <InputField label="Salários (Total)" value={fixos.folhaPagamento} onChange={(v: any) => setFixos({ ...fixos, folhaPagamento: v })} prefix="R$" />
                        <InputField label="SaaS & Cloud" value={fixos.assinaturas} onChange={(v: any) => setFixos({ ...fixos, assinaturas: v })} prefix="R$" />
                        <InputField label="Custos de Terceiros" value={fixos.outros} onChange={(v: any) => setFixos({ ...fixos, outros: v })} prefix="R$" />
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[10px] uppercase tracking-wider"><TrendingUp size={16} className="text-blue-500" /> Escala & CAC</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Escala (Alunos)" value={targetScale} onChange={(v: any) => setTargetScale(v)} suffix="un" />
                            <InputField label="CAC Unitário" value={cac} onChange={(v: any) => setCac(v)} prefix="R$" />
                        </div>
                        <InputField label="Churn Mensal Base" value={churn} onChange={(v: any) => setChurn(v)} suffix="%" />
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-50 space-y-4">
                        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
                            <Zap className="absolute -right-4 -top-4 text-white/5" size={80} />
                            <div className="flex items-center gap-2 text-brand-secondary font-black text-[10px] mb-2 uppercase tracking-widest relative z-10">
                                <Sparkles size={12} /> Valuation de Saída
                            </div>
                            <div className="text-2xl font-black text-white relative z-10 transition-all duration-700">
                                R$ {metrics.financial.valuationEstimado.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-1 relative z-10">Estimativa conservadora (5x ARR)</div>
                        </div>
                    </div>
                </Card>

                <div className="lg:col-span-8 space-y-6">
                    {activeTab === 'xray' && (
                        <Card className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <h3 className="font-black text-brand-dark uppercase text-[10px] tracking-widest">DRE Profissional Consolidado</h3>
                                <div className="text-[10px] font-bold text-slate-400">Padrão de Auditoria Real</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Demonstrativo Gerencial</div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-bold uppercase text-[9px]">Receita Bruta</span>
                                            <span className="font-black text-slate-800">R$ {(metrics.marketing.ticketMédio * targetScale).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-rose-500">
                                            <span className="font-medium text-[9px] uppercase">(-) Impostos & Deduções</span>
                                            <span className="font-bold">R$ {metrics.financial.impostosTotais.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-slate-400">
                                            <span className="font-medium text-[9px] uppercase">(-) OpEx (Fixo + Variável)</span>
                                            <span className="font-bold">R$ {metrics.financial.opexTotal.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-800">
                                            <span className="uppercase text-[9px]">EBITDA Mensal</span>
                                            <span className="text-brand-primary">R$ {metrics.financial.ebitdaReal.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-slate-400">
                                            <span className="font-medium text-[9px] uppercase">(-) Depreciação (Non-Cash)</span>
                                            <span className="font-bold">R$ {metrics.financial.depreciaçãoMensal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-sm font-black text-slate-900 uppercase text-[10px]">Net Profit (Lucro Líquido)</span>
                                        <span className="text-lg font-black text-brand-dark">R$ {(metrics.financial.ebitdaReal - metrics.financial.depreciaçãoMensal).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>

                                <div className="bg-brand-dark rounded-2xl p-6 text-white flex flex-col justify-center space-y-6 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Target size={120} />
                                    </div>
                                    <div className="text-center space-y-1 relative z-10">
                                        <div className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">Margem Líquida Real</div>
                                        <div className="text-4xl font-black text-white">{metrics.financial.margemLíquida.toFixed(1)}%</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Pós-Depreciação de Hardware</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 relative z-10">
                                        <div className="text-center border-r border-white/10">
                                            <div className="text-[8px] font-bold text-white/40 uppercase mb-1 tracking-widest">Margem Contrib.</div>
                                            <div className="text-xl font-bold">{metrics.financial.margemContribuição.toFixed(1)}%</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[8px] font-bold text-white/40 uppercase mb-1 tracking-widest">Capital Giro</div>
                                            <div className="text-lg font-bold text-brand-secondary">R$ {metrics.financial.capitalGiroNecessário.toLocaleString('pt-BR')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-8">
                                <ResultTab label="Payback (Meses)" value={metrics.financial.paybackMonths.toFixed(1)} icon={Clock} color="rose" benchmark={metrics.financial.paybackMonths < 12 ? 'Best-in-Class' : 'Tier 1'} />
                                <ResultTab label="LTV/CAC" value={`${metrics.financial.ltvCacRatio.toFixed(1)}x`} icon={Shield} color="orange" benchmark={metrics.financial.ltvCacRatio > 3 ? 'SaaS Gold' : 'Healthy'} />
                                <ResultTab label="Rentab. Ativos" value={`${metrics.financial.rentabilidade.toFixed(1)}%`} color="emerald" icon={TrendingUp} />
                            </div>
                        </Card>
                    )}

                    {activeTab === 'clevel' && (
                        <Card className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <h3 className="font-black text-brand-dark uppercase text-[10px] tracking-widest flex items-center gap-2">
                                    <Shield size={16} className="text-brand-primary" /> Eficiência SaaS & Board Reporting
                                </h3>
                                <div className="p-1 px-3 bg-brand-primary text-white text-[8px] font-black rounded-full uppercase tracking-widest">C-Level View</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule of 40</div>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded ${metrics.financial.ruleOf40 > 40 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                {metrics.financial.ruleOf40 > 40 ? 'SaaS Tier 1' : 'Growing'}
                                            </span>
                                        </div>
                                        <div className="text-4xl font-black text-slate-800">{metrics.financial.ruleOf40.toFixed(1)}%</div>
                                        <p className="text-[11px] text-slate-500 mt-2 leading-tight">Soma da taxa de crescimento e margem líquida. Benchmark de eficiência em Venture Capital.</p>
                                    </div>
                                    <div className="mt-6 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-primary" style={{ width: `${Math.min(100, metrics.financial.ruleOf40)}%` }} />
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Magic Number</div>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded ${metrics.financial.magicNumber > 0.75 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                {metrics.financial.magicNumber > 0.75 ? 'Sales Machine' : 'Otimizar'}
                                            </span>
                                        </div>
                                        <div className="text-4xl font-black text-slate-800">{metrics.financial.magicNumber.toFixed(2)}</div>
                                        <p className="text-[11px] text-slate-500 mt-2 leading-tight">Quantos reais de receita recorrente anual (ARR) você gera para cada R$ 1 investido em vendas.</p>
                                    </div>
                                    <div className="mt-6 flex justify-between gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < metrics.financial.magicNumber * 5 ? 'bg-blue-500' : 'bg-slate-200'}`} />
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Capital de Giro & Runway</div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Reserva Recomendada (3m)</span>
                                            <span className="font-bold text-slate-800">R$ {metrics.financial.capitalGiroNecessário.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Burn Multiple</span>
                                            <span className="font-bold text-rose-500">{metrics.financial.burnMultiple.toFixed(1)}x</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Eficiência de Ativos</div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Utilização da Frota</span>
                                            <span className="font-bold text-slate-800">{metrics.financial.taxaUtilizaçãoAtivos}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Margem Bruta SaaS</span>
                                            <span className="font-bold text-emerald-500">{metrics.financial.margemBrutaSaaS}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'simulation' && (
                        <Card className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <h3 className="font-black text-brand-dark uppercase text-[10px] tracking-widest">Laboratório de Sensibilidade (What-IF)</h3>
                                <div className="text-[10px] font-bold text-slate-400">Simulação de Impacto Financeiro</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-black text-slate-700 uppercase tracking-tighter">Ajuste de Preço</label>
                                            <span className={`text-xs font-black ${simPriceAdj >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{simPriceAdj > 0 ? '+' : ''}{simPriceAdj}%</span>
                                        </div>
                                        <input
                                            type="range" min="-30" max="100" value={simPriceAdj}
                                            onChange={(e) => setSimPriceAdj(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                        />
                                        <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase">
                                            <span>Desconto Aggressive</span>
                                            <span>Premium Pricing</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-black text-slate-700 uppercase tracking-tighter">Impacto no Churn</label>
                                            <span className={`text-xs font-black ${simChurnAdj <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{simChurnAdj > 0 ? '+' : ''}{simChurnAdj}%</span>
                                        </div>
                                        <input
                                            type="range" min="-50" max="200" value={simChurnAdj}
                                            onChange={(e) => setSimChurnAdj(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
                                        />
                                        <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase">
                                            <span>Retenção Total</span>
                                            <span>Erosão de Base</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-6 shadow-2xl relative overflow-hidden">
                                    <div className="absolute -right-8 -bottom-8 opacity-10">
                                        <TrendingUp size={160} />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <div className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">Impacto no Valuation</div>
                                        <div className="text-4xl font-black text-white">R$ {metrics.financial.valuationEstimado.toLocaleString('pt-BR')}</div>
                                        <div className="text-[9px] text-white/40 uppercase tracking-tighter mt-2">Valor Simulado da Empresa</div>
                                    </div>
                                    <div className="space-y-3 pt-6 border-t border-white/10 relative z-10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-white/60 uppercase">EBITDA Simulado</span>
                                            <span className="text-sm font-black text-brand-secondary">R$ {metrics.financial.ebitdaReal.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-white/60 uppercase">Novo LTV Unitário</span>
                                            <span className="text-sm font-black">R$ {metrics.financial.ltv.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[10px] text-white/60 leading-tight">
                                        A combinação de preço e retenção pode multiplicar seu valuation em até {((metrics.financial.valuationEstimado / (metrics.marketing.ticketMédio * targetScale * 12 * 5))).toFixed(1)}x.
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'logistics' && (
                        <Card className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <h3 className="font-black text-brand-dark uppercase text-[10px] tracking-widest border-b border-slate-50 pb-4">Logística & Eficiência de Hardware</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ResultTab label="Tablets Ativos" value={ops.totalTablets} icon={Laptop} sub="Foco: Pico de Demanda Real" />
                                <ResultTab label="Malas de Campo" value={ops.malasTransporte} icon={Package} color="orange" sub="Logística de Distribuição" />
                                <ResultTab label="On-Time Delivery (OTD)" value={`${ops.otd}%`} icon={Clock} color="emerald" sub="SLA de Entrega em Escolas" />
                                <ResultTab label="Taxa de Refugo Alvo" value={`${ops.taxaRefugo}%`} icon={TrendingDown} color="rose" sub="Limite de perdas de hardware" />
                            </div>
                        </Card>
                    )}

                    {activeTab === 'report' && (
                        <Card className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-6 print:hidden">
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">DRE Executivo Enterprise</h3>
                                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:scale-105 transition-transform shadow-md">
                                    <Printer size={14} /> IMPRIMIR RAIO-X
                                </button>
                            </div>

                            <div className="space-y-8">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-brand-primary font-black uppercase text-[10px]">
                                        <div className="w-1.5 h-4 bg-brand-primary rounded-full" /> Diagnóstico de Margens
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="text-[8px] font-bold text-slate-400 mb-1">EBITDA</div>
                                            <div className="text-xl font-black text-slate-800">{metrics.financial.margemEbitda.toFixed(1)}%</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                            <div className="text-[8px] font-bold text-emerald-600 mb-1">LUCRO LÍQUIDO</div>
                                            <div className="text-xl font-black text-emerald-700">{metrics.financial.margemLíquida.toFixed(1)}%</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                                            <div className="text-[8px] font-bold text-blue-600 mb-1">MARGEM CONTRIB.</div>
                                            <div className="text-xl font-black text-blue-700">{metrics.financial.margemContribuição.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-brand-secondary font-black uppercase text-[10px]">
                                        <div className="w-1.5 h-4 bg-brand-secondary rounded-full" /> Visão Patrimonial Consolidada
                                    </div>
                                    <div className="p-6 rounded-2xl bg-slate-900 text-white flex justify-between items-center">
                                        <div>
                                            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Valor Justo de Mercado</div>
                                            <div className="text-3xl font-black">R$ {metrics.financial.valuationEstimado.toLocaleString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-bold text-brand-secondary uppercase tracking-widest mb-1">Status Rule of 40</div>
                                            <div className="text-2xl font-black text-brand-secondary">{metrics.financial.ruleOf40.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase text-[10px]">
                                        <div className="w-1.5 h-4 bg-orange-400 rounded-full" /> Matriz de Precificação Estratégica
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-slate-100 space-y-2">
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">Preço Mínimo (Breakeven)</div>
                                            <div className="text-2xl font-black text-slate-600">R$ {metrics.financial.sugestõesPreço.mínimo.toFixed(2)}</div>
                                        </div>
                                        <div className="p-4 rounded-xl border-2 border-brand-primary bg-brand-primary/5 space-y-2">
                                            <div className="text-[8px] font-bold text-brand-primary uppercase">Ticket Ideal Recomendado</div>
                                            <div className="text-2xl font-black text-brand-dark">R$ {metrics.financial.sugestõesPreço.ideal.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
