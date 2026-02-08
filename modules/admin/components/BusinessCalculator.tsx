import React, { useState, useMemo, useEffect } from 'react';
import {
    Calculator, Laptop, TrendingUp, FileText,
    Plus, Minus, TrendingDown, DollarSign,
    Package, MapPin, BarChart3, Receipt,
    Download, Printer, Shield, Users, Clock, Globe,
    Sparkles, BrainCircuit, MessageSquare, ToggleLeft, ToggleRight,
    Zap, Target, Layers, Activity, Briefcase
} from 'lucide-react';
import { calculateLogistics, calculateBusinessMetrics, Collaborator, Infrastructure, Vehicle, SchoolProfile } from '../../../utils/saasCalculators';
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
    const [activeTab, setActiveTab] = useState<'logistics' | 'financial' | 'report' | 'xray' | 'clevel' | 'simulation' | 'proposal'>('xray');
    const [isIntelligenceMode, setIsIntelligenceMode] = useState(false);
    const [tutorKpi, setTutorKpi] = useState<string | null>(null);

    // FINANCEIRO: Novos Estados Granulares
    const [colaboradores, setColaboradores] = useState<Collaborator[]>([
        { id: '1', cargo: 'Gestor de Projeto', salario: 5500, quantidade: 1, beneficios: 1200 },
        { id: '2', cargo: 'Suporte Técnico', salario: 2800, quantidade: 2, beneficios: 800 },
    ]);

    const [infra, setInfra] = useState<Infrastructure>({
        luz: 450,
        agua: 120,
        internet: 350,
        manutencao: 500,
        seguros: 800
    });

    const [veiculo, setVeiculo] = useState<Vehicle>({
        valor: 85000,
        tipo: 'aquisicao',
        seguro: 3500,
        manutencao: 1200
    });

    const [perfisEscolas, setPerfisEscolas] = useState<SchoolProfile[]>([
        { id: '1', nome: 'Escola Municipal Sede', totalAlunos: 1200, turmas: 40, mediaAlunosTurma: 30 }
    ]);

    const [custosVariáveis, setCustosVariáveis] = useState({
        combustívelMensal: 2500,
        outrosPorAluno: 1.2
    });

    const [fiscal, setFiscal] = useState({
        iss: 5,
        pisCofins: 3.65,
        encargosFolha: 28
    });

    // Sales & Customers state
    const [cac, setCac] = useState(2500);
    const [churn, setChurn] = useState(1.8);
    const [targetScale, setTargetScale] = useState(1500);
    const [ticketManual, setTicketManual] = useState<number | undefined>(undefined);
    const [margemAlvo, setMargemAlvo] = useState(35); // Mark-up alvo em %

    // What-IF Sliders
    const [simPriceAdj, setSimPriceAdj] = useState(0);
    const [simChurnAdj, setSimChurnAdj] = useState(0);

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
        colaboradores,
        infra,
        veiculo,
        { computadores: 15000, infraestrutura: 5000 },
        custosVariáveis,
        fiscal,
        cac,
        adjustedChurn,
        targetScale,
        12,
        85,
        4,
        adjustedTicket
    ), [colaboradores, infra, veiculo, custosVariáveis, fiscal, cac, adjustedChurn, targetScale, adjustedTicket]);

    const handlePrint = () => window.print();
    const handleOpenTutor = (id: string) => setTutorKpi(id);

    // Helper to add collaborator
    const addCollaborator = () => {
        const newCollab: Collaborator = {
            id: Math.random().toString(36).substr(2, 9),
            cargo: 'Nova Função',
            salario: 2500,
            quantidade: 1,
            beneficios: 600
        };
        setColaboradores([...colaboradores, newCollab]);
    };

    const removeCollaborator = (id: string) => {
        setColaboradores(colaboradores.filter(c => c.id !== id));
    };

    const updateCollaborator = (id: string, field: keyof Collaborator, value: any) => {
        setColaboradores(colaboradores.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // Helper for School Profiles
    const addSchool = () => {
        const newSchool: SchoolProfile = {
            id: Math.random().toString(36).substr(2, 9),
            nome: 'Nova Escola',
            totalAlunos: 500,
            turmas: 15,
            mediaAlunosTurma: 33
        };
        setPerfisEscolas([...perfisEscolas, newSchool]);
    };

    // Calculate total students from profiles
    const totalStudentsComputed = useMemo(() => perfisEscolas.reduce((acc, s) => acc + s.totalAlunos, 0), [perfisEscolas]);

    // Sync with computed scale unless in intelligence mode
    useEffect(() => {
        if (!isIntelligenceMode) {
            setTargetScale(totalStudentsComputed);
        }
    }, [totalStudentsComputed, isIntelligenceMode]);

    // ... (metrics useMemo remains same)

    const ops = useMemo(() => calculateLogistics(
        Math.max(...perfisEscolas.map(s => s.mediaAlunosTurma * 1), 50),
        targetScale, 5, 6, 98, 2, 1
    ), [perfisEscolas, targetScale]);

    // Proposal Adjustment Logic
    const proposalPrice = useMemo(() => {
        const costPerStudent = metrics.financial.opexTotal / targetScale;
        const taxRate = (fiscal.iss + fiscal.pisCofins) / 100;
        return (costPerStudent * (1 + margemAlvo / 100)) / (1 - taxRate);
    }, [metrics.financial.opexTotal, targetScale, margemAlvo, fiscal]);

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
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight text-brand-dark uppercase italic">Business X-Ray <span className="text-brand-primary">Pro</span></h2>
                        <p className="text-slate-500 text-sm font-medium">Motor de Precificação & Viabilidade Real</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsIntelligenceMode(!isIntelligenceMode)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${isIntelligenceMode
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.2)]'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                            }`}
                    >
                        <BrainCircuit size={18} className={isIntelligenceMode ? "animate-pulse" : ""} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isIntelligenceMode ? '🧠 Inteligência Real Ativa' : '🧪 Designer de Operação'}
                        </span>
                    </button>

                    <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl">
                        {[
                            { id: 'xray', label: 'Dashboard' },
                            { id: 'proposal', label: 'Proposta' },
                            { id: 'clevel', label: 'C-Level' },
                            { id: 'simulation', label: 'Simulação' },
                            { id: 'logistics', label: 'Logística' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-white text-brand-primary shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SIDEBAR: Detalhamento de Ativos e Infra */}
                <Card className="lg:col-span-4 space-y-6 flex flex-col h-[85vh] overflow-y-auto no-scrollbar print:hidden sticky top-8 border-slate-200 shadow-xl bg-slate-50/50">

                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[10px] uppercase tracking-wider"><Users size={16} className="text-brand-primary" /> Time e Salários</h3>
                            <button onClick={addCollaborator} className="p-1 bg-brand-primary/10 text-brand-primary rounded hover:bg-brand-primary hover:text-white transition-all">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                            {colaboradores.map(c => (
                                <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-100 space-y-2 group">
                                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
                                        <input
                                            value={c.cargo}
                                            onChange={(e) => updateCollaborator(c.id, 'cargo', e.target.value)}
                                            className="bg-transparent border-none outline-none focus:text-brand-primary w-2/3"
                                        />
                                        <button onClick={() => removeCollaborator(c.id)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600">
                                            <Minus size={12} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputField label="Salário" value={c.salario} onChange={(v: any) => updateCollaborator(c.id, 'salario', v)} prefix="R$" />
                                        <InputField label="Qtd" value={c.quantidade} onChange={(v: any) => updateCollaborator(c.id, 'quantidade', v)} suffix="x" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[10px] uppercase tracking-wider"><Globe size={16} className="text-blue-500" /> Infra e Sede (Mês)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Luz & Água" value={infra.luz + infra.agua} onChange={(v: any) => setInfra({ ...infra, luz: v * 0.8, agua: v * 0.2 })} prefix="R$" />
                            <InputField label="Internet" value={infra.internet} onChange={(v: any) => setInfra({ ...infra, internet: v })} prefix="R$" />
                        </div>
                        <InputField label="Assinaturas & Cloud" value={800} onChange={() => { }} prefix="R$" help="Mock" />
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[10px] uppercase tracking-wider"><MapPin size={16} className="text-orange-500" /> Cenário Escolar</h3>
                        <div className="space-y-4">
                            {perfisEscolas.map(s => (
                                <div key={s.id} className="p-3 bg-white rounded-xl border border-slate-200">
                                    <div className="text-[9px] font-black text-brand-dark uppercase mb-2 group flex justify-between">
                                        {s.nome}
                                        <span className="text-slate-300 font-normal">ID: {s.id}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <InputField label="Total Alunos" value={s.totalAlunos} onChange={(v: any) => setPerfisEscolas(perfisEscolas.map(item => item.id === s.id ? { ...item, totalAlunos: v } : item))} suffix="un" />
                                        <InputField label="Turmas" value={s.turmas} onChange={(v: any) => setPerfisEscolas(perfisEscolas.map(item => item.id === s.id ? { ...item, turmas: v } : item))} suffix="un" />
                                    </div>
                                </div>
                            ))}
                            <button onClick={addSchool} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-black text-slate-400 uppercase hover:border-brand-primary/30 hover:text-brand-primary transition-all">
                                + Adicionar Escola
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-200 space-y-4">
                        <div className="p-4 bg-brand-dark rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
                            <Zap className="absolute -right-4 -top-4 text-white/5" size={80} />
                            <div className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest relative z-10 mb-1">Custo Operacional Total</div>
                            <div className="text-2xl font-black text-white relative z-10">
                                R$ {metrics.financial.opexTotal.toLocaleString('pt-BR')}
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="lg:col-span-8 space-y-6">
                    {activeTab === 'xray' && (
                        <Card className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <h3 className="font-black text-brand-dark uppercase text-[10px] tracking-widest flex items-center gap-2"><Layers size={16} className="text-brand-primary" /> DRE Consolidado (TCO Real)</h3>
                                <div className="text-[10px] font-bold text-slate-400">Total Cost of Ownership</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estrutura de Gastos Mensais</div>
                                    <div className="space-y-3">
                                        {metrics.financial.custosDetalhados.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-bold uppercase text-[9px]">{item.label}</span>
                                                <span className="font-black text-slate-800">R$ {item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                        <span className="text-sm font-black text-slate-900 uppercase text-[10px]">Ponto de Equilíbrio (Breakeven)</span>
                                        <span className="text-lg font-black text-brand-primary">{metrics.financial.breakEvenAlunos} <span className="text-[10px] font-bold">alunos</span></span>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-center space-y-6 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Target size={120} />
                                    </div>
                                    <div className="text-center space-y-1 relative z-10">
                                        <div className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest">Resultado Líquido Projetado</div>
                                        <div className="text-4xl font-black text-white">R$ {metrics.financial.ebitdaReal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Margem Ebitda: {metrics.financial.margemEbitda.toFixed(1)}%</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 relative z-10">
                                        <div className="text-center border-r border-white/10">
                                            <div className="text-[8px] font-bold text-white/40 uppercase mb-1 tracking-widest">LTV Projetado</div>
                                            <div className="text-lg font-bold">R$ {metrics.financial.ltv.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[8px] font-bold text-white/40 uppercase mb-1 tracking-widest">CAC Un.</div>
                                            <div className="text-lg font-bold text-brand-secondary">R$ {metrics.financial.cac.toLocaleString('pt-BR')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'proposal' && (
                        <Card className="space-y-8 animate-in fade-in zoom-in-95 duration-300 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                                <div className="space-y-1">
                                    <h3 className="font-black text-brand-dark uppercase text-xs tracking-widest">Gerador de Proposta Comercial</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">Simulação de Preço baseada em Custo Real + Mark-up</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-brand-primary uppercase">Mark-up Alvo:</span>
                                    <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
                                        {[20, 35, 50, 70].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setMargemAlvo(m)}
                                                className={`px-3 py-1 rounded text-[10px] font-black transition-all ${margemAlvo === m ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {m}%
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">Resumo da Oferta</div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-500 font-bold uppercase">Base de Alunos</span>
                                                <span className="text-sm font-black text-slate-800">{targetScale.toLocaleString()} un</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-500 font-bold uppercase">Custo OpEx/Aluno</span>
                                                <span className="text-sm font-black text-slate-800">R$ {(metrics.financial.opexTotal / targetScale).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                                <span className="text-xs font-black text-brand-primary uppercase">Mark-up Aplicado</span>
                                                <span className="text-sm font-black text-brand-primary">+{margemAlvo}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 space-y-4">
                                        <div className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Consumo de Combustível (Logístico)</div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Diário</div>
                                                <div className="text-md font-black text-slate-700">R$ {metrics.financial.combustívelFrequência.diário.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Semanal</div>
                                                <div className="text-md font-black text-slate-700">R$ {metrics.financial.combustívelFrequência.semanal.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Quinzenal</div>
                                                <div className="text-md font-black text-slate-700">R$ {metrics.financial.combustívelFrequência.quinzenal.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Mensal</div>
                                                <div className="text-md font-black text-slate-700">R$ {metrics.financial.combustívelFrequência.mensal.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center items-center p-8 bg-slate-900 rounded-[32px] text-white shadow-3xl border border-slate-800 relative group overflow-hidden">
                                    <Sparkles className="absolute top-6 left-6 text-brand-secondary/40 animate-pulse" size={40} />
                                    <div className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-4">Valor Sugerido do SaaS</div>
                                    <div className="text-6xl font-black text-white tracking-tighter mb-2 group-hover:scale-105 transition-transform duration-500">
                                        <span className="text-2xl align-top mr-1">R$</span>
                                        {proposalPrice.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Por Aluno / Mês</div>

                                    <div className="w-full space-y-4">
                                        <button onClick={() => setTicketManual(proposalPrice)} className="w-full py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-light shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)] transition-all active:scale-95">
                                            Adotar este Preço
                                        </button>
                                        <div className="text-[8px] text-white/30 text-center uppercase font-bold px-4">
                                            Este valor cobre OpEx, Impostos ({fiscal.iss + fiscal.pisCofins}%) e garante {margemAlvo}% de margem bruta.
                                        </div>
                                    </div>
                                </div>
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
