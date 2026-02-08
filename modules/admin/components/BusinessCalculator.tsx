import React, { useState, useMemo } from 'react';
import {
    Calculator, Laptop, TrendingUp, FileText,
    Plus, Minus, TrendingDown, DollarSign,
    Package, MapPin, BarChart3, Receipt,
    Download, Printer, Shield
} from 'lucide-react';
import { calculateLogistics, calculateBusinessMetrics } from '../../../utils/saasCalculators';

const Card = ({ children, className = "" }: any) => (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

const InputField = ({ label, value, onChange, type = "number", suffix, prefix, help }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
            {label}
            {help && <span className="normal-case font-medium text-slate-300">({help})</span>}
        </label>
        <div className="relative">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{prefix}</span>}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                className={`w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-brand-primary/30 transition-all outline-none ${prefix ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-10' : 'pr-4'}`}
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{suffix}</span>}
        </div>
    </div>
);

const ResultTab = ({ label, value, sub, icon: Icon, color = "brand-primary" }: any) => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 bg-slate-50/30">
        <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
            <Icon size={20} />
        </div>
        <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">{label}</div>
            <div className="text-lg font-black text-slate-800">{value}</div>
            {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
        </div>
    </div>
);

export const BusinessCalculator = () => {
    const [activeTab, setActiveTab] = useState<'logistics' | 'financial' | 'report'>('logistics');

    // Logistics state
    const [maxClassSize, setMaxClassSize] = useState(50);
    const [totalAlunos, setTotalAlunos] = useState(600);

    // Financial state
    const [fixedCosts, setFixedCosts] = useState(15000);
    const [varCostPerStudent, setVarCostPerStudent] = useState(5);
    const [taxPercent, setTaxPercent] = useState(14.5);
    const [cac, setCac] = useState(2000);
    const [churn, setChurn] = useState(2);
    const [targetScale, setTargetScale] = useState(2000);

    // Dynamic calculations
    const logistics = useMemo(() => calculateLogistics(maxClassSize, totalAlunos), [maxClassSize, totalAlunos]);
    const financial = useMemo(() => calculateBusinessMetrics(
        fixedCosts, varCostPerStudent, 0, taxPercent, cac, churn, targetScale
    ), [fixedCosts, varCostPerStudent, taxPercent, cac, churn, targetScale]);

    const handlePrint = () => window.print();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/20">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cálculo Estratégico SaaS</h2>
                        <p className="text-slate-500 text-sm font-medium">Logística, KPIs e Precificação Inteligente</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('logistics')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'logistics' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Logística
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'financial' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Financeiro & KPIs
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'report' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Preços & Relatório
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs Sidebar */}
                <Card className="lg:col-span-4 space-y-8 flex flex-col h-full print:hidden">
                    {activeTab === 'logistics' ? (
                        <>
                            <div className="space-y-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Package size={18} className="text-brand-primary" /> Dados da Escola</h3>
                                <InputField label="Maior Turma da Escola" value={maxClassSize} onChange={setMaxClassSize} suffix="alunos" help="Ponto de Ref." />
                                <InputField label="Total de Alunos" value={totalAlunos} onChange={setTotalAlunos} suffix="alunos" />
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                                    <strong>Regra de Negócio:</strong> Calculamos os tablets baseados na maior turma para permitir o reuso entre as 6 janelas diárias de aplicação. Adicionamos 10% de reserva e hardware de suporte.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500" /> Estrutura de Custos</h3>
                                <InputField label="Custos Fixos Mensais" value={fixedCosts} onChange={setFixedCosts} prefix="R$" help="Aluguel, Staff, Cloud" />
                                <InputField label="Custo Var. por Aluno" value={varCostPerStudent} onChange={setVarCostPerStudent} prefix="R$" help="IA, Provas, SMS" />
                                <InputField label="Carga Tributária" value={taxPercent} onChange={setTaxPercent} suffix="%" help="Fed + Est + Mun" />
                                <InputField label="Escala Alvo" value={targetScale} onChange={setTargetScale} suffix="alunos" />
                            </div>
                            <div className="space-y-6 pt-4 border-t border-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> Métricas de Crescimento</h3>
                                <InputField label="CAC Unitário" value={cac} onChange={setCac} prefix="R$" />
                                <InputField label="Churn Mensal" value={churn} onChange={setChurn} suffix="%" />
                            </div>
                        </>
                    )}
                    <div className="mt-auto pt-6 border-t border-slate-50">
                        <button
                            onClick={() => setActiveTab('report')}
                            className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                        >
                            Ver Simulador de Preços
                        </button>
                    </div>
                </Card>

                {/* Results Main Area */}
                <div className="lg:col-span-8 space-y-6 h-full flex flex-col">
                    {activeTab === 'logistics' && (
                        <Card className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Necessidade de Hardware</h3>
                                <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-full">PROJEÇÃO LOGÍSTICA</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ResultTab label="Tablets Ativos" value={logistics.tabletsNecessários} icon={Laptop} sub="Capacidade Maior Turma" />
                                <ResultTab label="Reserva Técnica" value={logistics.reservaTécnica} icon={Shield} color="emerald" sub="10% para imprevistos" />
                                <ResultTab label="Malas de Transporte" value={logistics.malasTransporte} icon={Package} color="blue" sub="20 unidades por mala" />
                                <ResultTab label="Total de Hardware" value={logistics.totalTablets} icon={Plus} color="orange" sub="Hardware Total + Suporte" />
                            </div>

                            <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Package size={120} />
                                </div>
                                <h4 className="text-xs font-bold text-brand-secondary uppercase mb-4 tracking-widest">Configuração de Suporte Fixo</h4>
                                <div className="flex gap-8">
                                    <div>
                                        <div className="text-2xl font-black">01</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Tablet Professor</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black">01</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Ponto Rede Mesh</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black">01</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Tablet Coordenação</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'financial' && (
                        <Card className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Indicadores de Negócio</h3>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full tracking-wider">HEALTH CHECK</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div className="p-4 rounded-xl border border-slate-100 space-y-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custo Operacional (OPEX)</div>
                                    <div className="text-xl font-black text-slate-800">R$ {financial.opexTotal.toLocaleString('pt-BR')}</div>
                                    <div className="text-[10px] text-slate-400">Mensal na escala atual</div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-100 space-y-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impostos Totais</div>
                                    <div className="text-xl font-black text-rose-500">R$ {financial.impostosTotais.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                                    <div className="text-[10px] text-slate-400">Fed + Est + Mun ({taxPercent}%)</div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-100 space-y-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Break-Even Point</div>
                                    <div className="text-xl font-black text-blue-500">{financial.breakEvenAlunos.toLocaleString('pt-BR')}</div>
                                    <div className="text-[10px] text-slate-400">Alunos necessários</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-primary w-[75%]" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500">LTV / CAC Ratio</span>
                                        <span className="text-sm font-black text-brand-primary">{financial.ltvCacRatio.toFixed(1)}x</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[45%]" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500">CAC Payback</span>
                                        <span className="text-sm font-black text-emerald-600">{financial.paybackMonths.toFixed(1)} meses</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[60%]" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500">Margem EBITDA</span>
                                        <span className="text-sm font-black text-blue-600">~{financial.margemEbitda}%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'report' && (
                        <Card className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-6 print:hidden">
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Sugestão de Precificação</h3>
                                <div className="flex gap-2">
                                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200">
                                        <Printer size={14} /> IMPRIMIR RELATÓRIO
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition-all space-y-4">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço Mínimo</div>
                                    <div className="text-3xl font-black text-slate-600 tracking-tighter">
                                        R$ {financial.sugestõesPreço.mínimo.toFixed(2)}
                                        <span className="text-xs font-medium text-slate-400">/aluno</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Margem de sobrevivência. Cobre apenas OPEX e impostos diretos.</p>
                                </div>

                                <div className="p-6 rounded-2xl border-2 border-brand-primary bg-brand-primary/5 shadow-xl shadow-brand-primary/10 space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 bg-brand-primary text-white text-[8px] font-black rounded-bl-lg uppercase">Ideal</div>
                                    <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Preço Sugerido</div>
                                    <div className="text-3xl font-black text-brand-dark tracking-tighter">
                                        R$ {financial.sugestõesPreço.ideal.toFixed(2)}
                                        <span className="text-xs font-medium text-slate-400">/aluno</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Garante reinvestimento em P&D, margem de segurança e ROI saudável.</p>
                                </div>

                                <div className="p-6 rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500/50 transition-all space-y-4">
                                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Preço Premium</div>
                                    <div className="text-3xl font-black text-emerald-700 tracking-tighter">
                                        R$ {financial.sugestõesPreço.folgado.toFixed(2)}
                                        <span className="text-xs font-medium text-slate-400">/aluno</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Margem folgada para expansão agressiva e projetos customizados.</p>
                                </div>
                            </div>

                            <div className="hidden print:block pt-10 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-900 uppercase mb-4">Resumo Executivo de Viabilidade</h4>
                                <div className="grid grid-cols-2 gap-8 text-xs">
                                    <div className="space-y-2">
                                        <p><strong>Total de Alunos:</strong> {totalAlunos}</p>
                                        <p><strong>Hardware Necessário:</strong> {logistics.totalTablets} unidades</p>
                                        <p><strong>Malas de Transporte:</strong> {logistics.malasTransporte}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p><strong>OPEX Estimado:</strong> R$ {financial.opexTotal.toLocaleString('pt-BR')}</p>
                                        <p><strong>Carga Tributária:</strong> {taxPercent}%</p>
                                        <p><strong>ROI Estimado:</strong> {financial.ltvCacRatio.toFixed(1)}x (LTV/CAC)</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
