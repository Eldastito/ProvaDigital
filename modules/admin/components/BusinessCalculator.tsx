import React, { useState, useMemo } from 'react';
import {
    Calculator, Laptop, TrendingUp, FileText,
    Plus, Minus, TrendingDown, DollarSign,
    Package, MapPin, BarChart3, Receipt,
    Download, Printer, Shield, Users, Clock, Globe
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
    const [activeTab, setActiveTab] = useState<'logistics' | 'financial' | 'sales' | 'hr' | 'report'>('logistics');

    // Logistics & Ops state
    const [maxClassSize, setMaxClassSize] = useState(50);
    const [totalAlunos, setTotalAlunos] = useState(600);
    const [otd, setOtd] = useState(98);
    const [ruptura, setRuptura] = useState(2);
    const [refugo, setRefugo] = useState(1);

    // Financial base state
    const [fixedCosts, setFixedCosts] = useState(15000);
    const [varCostPerStudent, setVarCostPerStudent] = useState(5);
    const [taxPercent, setTaxPercent] = useState(14.5);
    const [hardwareInvestment, setHardwareInvestment] = useState(120000);

    // Sales & Customers state
    const [cac, setCac] = useState(2000);
    const [churn, setChurn] = useState(2);
    const [conversion, setConversion] = useState(12);
    const [targetScale, setTargetScale] = useState(2000);
    const [nps, setNps] = useState(78);

    // HR state
    const [turnover, setTurnover] = useState(4);
    const [absenteísmo, setAbsenteísmo] = useState(3);

    // Dynamic calculations
    const ops = useMemo(() => calculateLogistics(maxClassSize, totalAlunos, 5, 6, otd, ruptura, refugo),
        [maxClassSize, totalAlunos, otd, ruptura, refugo]);

    const metrics = useMemo(() => calculateBusinessMetrics(
        fixedCosts, varCostPerStudent, hardwareInvestment, taxPercent, cac, churn, targetScale, conversion, nps, turnover
    ), [fixedCosts, varCostPerStudent, hardwareInvestment, taxPercent, cac, churn, targetScale, conversion, nps, turnover]);

    const handlePrint = () => window.print();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/20">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight text-brand-dark uppercase">Business Intel & KPIs</h2>
                        <p className="text-slate-500 text-sm font-medium">Simulador de Viabilidade Corporativa 360°</p>
                    </div>
                </div>

                <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl">
                    {[
                        { id: 'logistics', label: 'Logística & Ops' },
                        { id: 'financial', label: 'Finanças' },
                        { id: 'sales', label: 'Vendas & Mkt' },
                        { id: 'hr', label: 'RH' },
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs Sidebar */}
                <Card className="lg:col-span-4 space-y-8 flex flex-col h-fit print:hidden sticky top-8">
                    {activeTab === 'logistics' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Package size={18} className="text-brand-primary" /> Eficiência Operacional</h3>
                            <InputField label="Maior Turma" value={maxClassSize} onChange={setMaxClassSize} suffix="alunos" help="Capacidade" />
                            <InputField label="Alunos por Escola" value={totalAlunos} onChange={setTotalAlunos} suffix="alunos" />
                            <InputField label="OTD Alvo (Entrega)" value={otd} onChange={setOtd} suffix="%" />
                            <InputField label="Ruptura Alvo" value={ruptura} onChange={setRuptura} suffix="%" />
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500" /> Capex & Opex</h3>
                            <InputField label="Custos Fixos Mensais" value={fixedCosts} onChange={setFixedCosts} prefix="R$" />
                            <InputField label="Variável / Aluno" value={varCostPerStudent} onChange={setVarCostPerStudent} prefix="R$" />
                            <InputField label="Inv. Inicial Hardware" value={hardwareInvestment} onChange={setHardwareInvestment} prefix="R$" />
                            <InputField label="Carga Tributária" value={taxPercent} onChange={setTaxPercent} suffix="%" />
                            <InputField label="Total Alunos (Escala)" value={targetScale} onChange={setTargetScale} suffix="alunos" />
                        </div>
                    )}

                    {activeTab === 'sales' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> Growth & Retenção</h3>
                            <InputField label="CAC Médio" value={cac} onChange={setCac} prefix="R$" />
                            <InputField label="Taxa de Conversão" value={conversion} onChange={setConversion} suffix="%" />
                            <InputField label="Churn Rate Mensal" value={churn} onChange={setChurn} suffix="%" />
                            <InputField label="NPS Alvo" value={nps} onChange={setNps} suffix="pts" />
                        </div>
                    )}

                    {activeTab === 'hr' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-orange-500" /> Capital Humano</h3>
                            <InputField label="Turnover Alvo" value={turnover} onChange={setTurnover} suffix="%" />
                            <InputField label="Absenteísmo" value={absenteísmo} onChange={setAbsenteísmo} suffix="%" />
                        </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-slate-50">
                        <button
                            onClick={() => setActiveTab('report')}
                            className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg uppercase tracking-tighter"
                        >
                            Gerar Relatório de Viabilidade
                        </button>
                    </div>
                </Card>

                {/* Results Main Area */}
                <div className="lg:col-span-8 space-y-6 h-full flex flex-col">
                    {activeTab === 'logistics' && (
                        <Card className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <h3 className="font-black text-brand-dark uppercase text-[10px] tracking-widest border-b border-slate-50 pb-4">Logística & Eficiência</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ResultTab label="Tablets Alunos" value={ops.tabletsNecessários} icon={Laptop} sub="Ponto de Ref. Maior Turma" />
                                <ResultTab label="Total Hardware" value={ops.totalTablets} icon={Plus} color="orange" sub="Hardware + Suporte + Reserva" />
                                <ResultTab label="OTD (On-Time Delivery)" value={`${ops.otd}%`} icon={Clock} color="emerald" sub="Pontualidade Logística" />
                                <ResultTab label="Refugo / Danos" value={`${ops.taxaRefugo}%`} icon={TrendingDown} color="rose" sub="Volume de Manutenção" />
                            </div>
                            <div className="p-4 bg-slate-900 rounded-xl text-white flex justify-between items-center">
                                <div>
                                    <div className="text-[8px] font-bold text-brand-secondary uppercase tracking-widest mb-1">Malas Nécessárias</div>
                                    <div className="text-2xl font-black">{ops.malasTransporte} Malas de Transporte</div>
                                </div>
                                <Package className="text-white/20" size={40} />
                            </div>
                        </Card>
                    )}

                    {activeTab === 'financial' && (
                        <Card className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <h3 className="font-black text-brand-dark uppercase text-[10px] tracking-widest border-b border-slate-50 pb-4">Indicadores Financeiros</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl border border-slate-100 bg-emerald-50/20">
                                    <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mb-1">EBITDA Mensal</div>
                                    <div className="text-lg font-black text-emerald-700">R$ {metrics.financial.ebitdaReal.toLocaleString('pt-BR')}</div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-100">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Margem Líquida</div>
                                    <div className="text-lg font-black text-slate-800">{metrics.financial.margemLíquida.toFixed(1)}%</div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-100">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Margem Contribuição</div>
                                    <div className="text-lg font-black text-blue-600">{metrics.financial.margemContribuição.toFixed(1)}%</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">ROE (Retorno s/ Capital)</span>
                                        <span className="text-sm font-black text-brand-primary">{metrics.financial.rentabilidade.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-primary" style={{ width: `${Math.min(metrics.financial.rentabilidade, 100)}%` }} />
                                    </div>
                                </div>
                                <div className="space-y-4 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">ROI Acumulado</span>
                                        <span className="text-sm font-black text-emerald-600">{metrics.financial.roi.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(metrics.financial.roi, 100)}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Ponto de Equilíbrio (Break-even)</h4>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black text-slate-800">{metrics.financial.breakEvenAlunos.toLocaleString()}</span>
                                    <span className="text-sm font-bold text-slate-400 pb-1 mb-1">alunos para zerar custos</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'sales' && (
                        <Card className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <h3 className="font-black text-brand-dark uppercase text-[10px] tracking-widest border-b border-slate-50 pb-4">Gestão de Vendas & Clientes</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <ResultTab label="Ticket Médio (ARPU)" value={`R$ ${metrics.marketing.ticketMédio.toFixed(2)}`} icon={Receipt} sub="Por aluno/mês" />
                                <ResultTab label="LTV Estimado" value={`R$ ${metrics.financial.ltv.toFixed(0)}`} icon={TrendingUp} color="emerald" sub="Valor total por cliente" />
                                <ResultTab label="NPS (Satisfação)" value={metrics.customers.nps} icon={Shield} color="blue" sub="Lealdade do Cliente" />
                                <ResultTab label="Market Share" value={`${metrics.marketing.marketShare.toFixed(3)}%`} icon={Globe} color="orange" sub="Fatia do mercado nacional" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="p-4 rounded-xl border border-slate-100 bg-brand-primary/5 space-y-1">
                                    <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Saúde do Modelo (LTV/CAC)</div>
                                    <div className="text-2xl font-black text-brand-dark">{metrics.financial.ltvCacRatio.toFixed(1)}x</div>
                                    <div className="text-[10px] text-slate-500">Benchmark ideal: {'>'} 3.0x</div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-100 bg-rose-50/30 space-y-1">
                                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">CAC Payback</div>
                                    <div className="text-2xl font-black text-rose-700">{metrics.financial.paybackMonths.toFixed(1)} meses</div>
                                    <div className="text-[10px] text-slate-500">Tempo para recuperar investimentos</div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'hr' && (
                        <Card className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <h3 className="font-black text-brand-dark uppercase text-[10px] tracking-widest border-b border-slate-50 pb-4">Gestão de Pessoas (RH)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Turnover Mensal</div>
                                            <div className="text-3xl font-black text-slate-800">{metrics.hr.turnover}%</div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 leading-relaxed font-medium">
                                        Reflete a rotatividade do staff operacional e técnico. Uma taxa alta impacta o custo fixo via treinamentos.
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Absenteísmo</div>
                                            <div className="text-3xl font-black text-slate-800">{metrics.hr.absenteísmo}%</div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 leading-relaxed font-medium">
                                        Impacto direto na produtividade e necessidade de sobrecarga de rede/suporte.
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-50">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">ROI de Treinamento</h4>
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl font-black text-blue-600">{metrics.hr.roiTreinamento}%</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase max-w-[150px]">Retorno Estimado sobre capacitação de rede</div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'report' && (
                        <Card className="flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-6 print:hidden">
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Estratégia de Precificação</h3>
                                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:scale-105 transition-transform">
                                    <Printer size={14} /> GERAR PDF EXECUTIVO
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl border-2 border-slate-100 space-y-4">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço Sobrevivência</div>
                                    <div className="text-3xl font-black text-slate-600 tracking-tighter">
                                        R$ {metrics.financial.sugestõesPreço.mínimo.toFixed(2)}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">Margem de contribuição mínima.</p>
                                </div>
                                <div className="p-6 rounded-2xl border-2 border-brand-primary bg-brand-primary/5 shadow-xl shadow-brand-primary/10 space-y-4">
                                    <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Preço Recomendado</div>
                                    <div className="text-3xl font-black text-brand-dark tracking-tighter">
                                        R$ {metrics.financial.sugestõesPreço.ideal.toFixed(2)}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">Ideal para EBITDA de saudável.</p>
                                </div>
                                <div className="p-6 rounded-2xl border-2 border-emerald-500/30 space-y-4">
                                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Preço de Expansão</div>
                                    <div className="text-3xl font-black text-emerald-700 tracking-tighter">
                                        R$ {metrics.financial.sugestõesPreço.folgado.toFixed(2)}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">Margem premium para reinvestimento.</p>
                                </div>
                            </div>

                            <div className="hidden print:block pt-10 border-t border-slate-100">
                                <div className="flex justify-between mb-8">
                                    <h1 className="text-2xl font-black text-slate-900 underline underline-offset-8">Relatório de Viabilidade SaaS</h1>
                                    <span className="text-xs font-bold text-slate-400">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-12 text-[10px] leading-relaxed">
                                    <div className="space-y-4">
                                        <h4 className="font-bold border-b pb-1">Operacional & Logística</h4>
                                        <div className="grid grid-cols-2">
                                            <span>Hardware Total:</span> <span className="font-bold text-right">{ops.totalTablets} un</span>
                                            <span>OTD Alvo:</span> <span className="font-bold text-right">{ops.otd}%</span>
                                            <span>Malas Transporte:</span> <span className="font-bold text-right">{ops.malasTransporte}</span>
                                        </div>
                                        <h4 className="font-bold border-b pb-1 mt-6">Vendas & Clientes</h4>
                                        <div className="grid grid-cols-2">
                                            <span>LTV Estimado:</span> <span className="font-bold text-right">R$ {metrics.financial.ltv.toFixed(0)}</span>
                                            <span>CAC Global:</span> <span className="font-bold text-right">R$ {metrics.financial.cac.toLocaleString()}</span>
                                            <span>Payback:</span> <span className="font-bold text-right">{metrics.financial.paybackMonths.toFixed(1)} meses</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-bold border-b pb-1">Financeiro & Saúde</h4>
                                        <div className="grid grid-cols-2">
                                            <span>Margem EBITDA:</span> <span className="font-bold text-right">{metrics.financial.margemEbitda.toFixed(1)}%</span>
                                            <span>Margem Líquida:</span> <span className="font-bold text-right">{metrics.financial.margemLíquida.toFixed(1)}%</span>
                                            <span>ROI Dự Kiến:</span> <span className="font-bold text-right">{metrics.financial.roi.toFixed(1)}%</span>
                                        </div>
                                        <h4 className="font-bold border-b pb-1 mt-6">Sugestão Comercial</h4>
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                            <div className="text-[8px] uppercase font-bold text-slate-400">Preço Ideal p/ Aluno</div>
                                            <div className="text-xl font-black text-brand-dark">R$ {metrics.financial.sugestõesPreço.ideal.toFixed(2)}</div>
                                        </div>
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
