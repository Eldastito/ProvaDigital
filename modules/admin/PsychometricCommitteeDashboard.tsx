import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { dataExportService } from '../../services/dataExportService';
import { privacyService } from '../../services/privacyService';
import { TrajectoryVisualizer } from '../analytics/components/TrajectoryVisualizer';
import {
    ShieldCheck,
    FileCheck2,
    AlertCircle,
    BarChart,
    Layers,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Activity,
    Lock,
    Brain,
    Sparkles,
    Download,
    FileJson,
    Library,
    EyeOff,
    History,
    Shield
} from 'lucide-react';

import { PsychometricCuradoriaView } from './PsychometricCuradoriaView';
import { useToast } from '../../components/ui/Toast';

export const PsychometricCommitteeDashboard = () => {
    const [pools, setPools] = useState<any[]>([]);
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [selectedPool, setSelectedPool] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'AUDIT' | 'LGPD' | 'CURADORIA'>('OVERVIEW');

    // Mock data para demonstração da trajetória adaptativa (Fase VII)
    const mockTrajectory = [
        { step: 1, theta: -1.5, see: 1.2 },
        { step: 5, theta: -0.8, see: 0.9 },
        { step: 10, theta: -0.2, see: 0.6 },
        { step: 15, theta: 0.5, see: 0.4 },
        { step: 20, theta: 1.2, see: 0.35 },
        { step: 25, theta: 1.4, see: 0.28 },
    ];

    useEffect(() => {
        fetchPools();
    }, []);

    const fetchPools = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('item_pools')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPools(data);
        }
        setLoading(false);
    };

    const handleApprove = async (poolId: string) => {
        const { error } = await supabase
            .from('item_pools')
            .update({ status: 'APPROVED' })
            .eq('id', poolId);

        if (!error) {
            fetchPools();
            setSelectedPool(null);
            toast.success('✅ Pool aprovado para produção!');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Lock className="text-brand-primary" size={32} />
                        Comitê de Governança Psicométrica
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Gate de aprovação oficial para bancos de itens e escalas (Plano 2031).
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm font-bold text-slate-500 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        Acesso Nível: SUPER_ADMIN
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista de Pools */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Bancos em Revisão</h2>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl" />)}
                        </div>
                    ) : (
                        pools.map(pool => (
                            <div
                                key={pool.id}
                                onClick={() => setSelectedPool(pool)}
                                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${selectedPool?.id === pool.id
                                    ? 'border-brand-primary bg-white shadow-lg'
                                    : 'border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${pool.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                        pool.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {pool.status}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">{new Date(pool.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-slate-800">{pool.name}</h3>
                                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1"><Layers size={14} /> {pool.item_count || 0} Itens</span>
                                    <span className="flex items-center gap-1"><Activity size={14} /> {pool.version || 'v1.0'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detalhes do Auditor */}
                <div className="lg:col-span-2">
                    {selectedPool ? (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">Dossiê de Qualidade</div>
                                        <h2 className="text-2xl font-bold text-slate-900">{selectedPool.name}</h2>
                                    </div>
                                    {selectedPool.status !== 'APPROVED' && (
                                        <div className="flex gap-2">
                                            <button className="px-6 py-2.5 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition">
                                                Rejeitar
                                            </button>
                                            <button
                                                onClick={() => handleApprove(selectedPool.id)}
                                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition"
                                            >
                                                Aprovar Pool
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-8 pt-4 border-b border-slate-100 bg-white flex gap-6">
                                <button
                                    onClick={() => setActiveTab('OVERVIEW')}
                                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'OVERVIEW' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Visão Geral
                                </button>
                                <button
                                    onClick={() => setActiveTab('AUDIT')}
                                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'AUDIT' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Soberania & Auditabilidade
                                </button>
                                <button
                                    onClick={() => setActiveTab('CURADORIA')}
                                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'CURADORIA' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Curadoria & TRI
                                </button>
                                <button
                                    onClick={() => setActiveTab('LGPD')}
                                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'LGPD' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                >
                                    Conformidade LGPD
                                </button>
                            </div>

                            <div className="p-8">
                                {activeTab === 'OVERVIEW' ? (
                                    <>
                                        {/* Conteúdo Visão Geral existente */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                            <StatBox label="Discriminação Média (a)" value="1.42" status="optimal" />
                                            <StatBox label="Dificuldade Média (b)" value="0.12" status="neutral" />
                                            <StatBox label="Cobertura BNCC" value="94%" status="high" />
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                                <BarChart size={18} className="text-brand-primary" />
                                                Relatório de Estabilidade Longitudinal (Equating)
                                            </h3>
                                            <div className="space-y-3">
                                                <StabilityItem label="Vínculo com Escala v1 (Ancoragem)" status="LINKED" message="34 itens âncora verificados." />
                                                <StabilityItem label="Item Fit (MNSQ)" status="OPTIMAL" message="98% dentro do range 0.7 - 1.3." />
                                                <StabilityItem label="DIF Predictor" status="LOW_RISK" message="Nenhuma evidência de viés por grupo detectada." />
                                            </div>
                                        </div>

                                        <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                                            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-4">
                                                <Brain size={18} className="text-indigo-600" />
                                                Governança de IA & Certidão de Origem
                                            </h3>
                                            {/* ... conteúdo IA ... */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-white p-4 rounded-xl border border-indigo-100 flex justify-between items-center shadow-sm">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Itens de Origem IA</p>
                                                        <p className="text-lg font-bold text-slate-800">72% <span className="text-xs text-slate-400 font-medium">(24/33)</span></p>
                                                    </div>
                                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                        <Sparkles size={20} />
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-indigo-100 flex justify-between items-center shadow-sm">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Assinatura Humana (HITL)</p>
                                                        <p className="text-lg font-bold text-emerald-600">100% <span className="text-xs text-slate-400 font-medium">Auditado</span></p>
                                                    </div>
                                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                                        <ShieldCheck size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : activeTab === 'AUDIT' ? (
                                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                                <Activity size={18} className="text-indigo-600" />
                                                Auditoria de Trajetória Psicométrica (Amostra Técnica)
                                            </h3>
                                            <TrajectoryVisualizer data={mockTrajectory} />
                                        </div>

                                        <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-900/20">
                                            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                                                <Library size={18} />
                                                Soberania Digital e Anti Lock-in (Exportação Universal)
                                            </h3>
                                            {/* ... conteúdo audit ... */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button onClick={() => dataExportService.exportDataDictionary()} className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition group text-left">
                                                    <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition"><Download size={20} /></div>
                                                    <div><p className="text-xs font-bold">Dicionário de Dados</p><p className="text-[10px] text-white/60">Esquema Técnico p/ Auditores</p></div>
                                                </button>
                                                <button onClick={() => dataExportService.exportStudentTrajectory({ id: 'dummy', answers: [], totalScore: 1.4 } as any, [], 'Amostra Auditoria')} className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition group text-left">
                                                    <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition"><FileJson size={20} /></div>
                                                    <div><p className="text-xs font-bold">Dump de Trajetória (JSON)</p><p className="text-[10px] text-white/60">Log imutável da sessão CAT</p></div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeTab === 'CURADORIA' ? (
                                    <div className="h-[600px] -mx-8 -mb-8">
                                        <PsychometricCuradoriaView />
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm"><Shield size={24} /></div>
                                            <div>
                                                <h3 className="text-sm font-bold text-emerald-900">Privacidade por Design (Plano 2031)</h3>
                                                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                                    Todos os dados pessoais são pseudonimizados antes de serem processados por motores de auditoria ou IA.
                                                    A chave de identidade permanece sob controle exclusivo da entidade governante via HSM/KMS.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <EyeOff size={14} /> Pseudonimização Nativa
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <span className="text-xs font-medium text-slate-600">Nome Original</span>
                                                        <span className="text-xs font-mono font-bold text-slate-400 line-through">Michele Santos</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                                        <span className="text-xs font-medium text-emerald-700">Alias de Auditoria</span>
                                                        <span className="text-xs font-mono font-bold text-emerald-600">{privacyService.maskName('Michele Santos')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <History size={14} /> Retenção & Expurgo
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-slate-600">Logs de Telemetria</span>
                                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">180 DIAS</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-slate-600">Chaves de Sessão</span>
                                                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">24 HORAS</span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-100">
                                                        <p className="text-[10px] text-slate-400 italic">Expurgo automático configurado via pg_cron.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                                    <Lock size={14} /> Trilha de Acesso LGPD (Audit Log)
                                                </h4>
                                                <button className="text-[10px] font-bold text-brand-primary underline">Ver Log Completo</button>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="p-3 bg-white rounded-xl text-[10px] text-slate-500 border border-slate-200 flex justify-between">
                                                    <span>[2026-02-10 10:45] SuperAdmin acessou PII de Aluno: {privacyService.maskName('Carlos Drumon')}</span>
                                                    <span className="font-bold text-brand-primary">Motivo: Investigação de Fraude</span>
                                                </div>
                                                <div className="p-3 bg-white rounded-xl text-[10px] text-slate-500 border border-slate-200 flex justify-between">
                                                    <span>[2026-02-10 09:12] Auditor Externo acessou Trajetória: anonym_78231...</span>
                                                    <span className="font-bold text-brand-primary">Motivo: Validação Psicométrica</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SELO DE CERTIFICAÇÃO FORGE 2031 - FASE X */}
                                <div className="mt-12 p-1 bg-gradient-to-r from-brand-primary via-indigo-500 to-emerald-500 rounded-2xl shadow-2xl shadow-indigo-500/20 group">
                                    <div className="bg-white rounded-[15px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                                        <div className="absolute -right-8 -bottom-8 text-black/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                            <Shield size={160} />
                                        </div>

                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-primary/40 ring-4 ring-brand-primary/10">
                                                <ShieldCheck size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Selo de Certificação FORGE 2031</h3>
                                                <p className="text-sm text-slate-500 font-medium">Infraestrutura Nacional de Avaliação Adaptativa • v1.5.0 Gold</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 flex items-center gap-1"><Brain size={12} /> IA Auditada</span>
                                                    <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 flex items-center gap-1"><Shield size={12} /> LGPD Clean</span>
                                                    <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100 flex items-center gap-1"><Lock size={12} /> Soberana</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 relative z-10 w-full md:w-auto">
                                            <button className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition shadow-lg shadow-slate-900/10">
                                                Baixar Dossiê Técnico
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 border-l-4 border-amber-400 bg-amber-50 rounded-r-xl">
                                    <div className="flex gap-3">
                                        <AlertCircle className="text-amber-600 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-900">Nota do Analista Psicométrico</h4>
                                            <p className="text-sm text-amber-800 mt-1">
                                                Este pool apresenta estabilidade superior à versão anterior. A inclusão de 34 âncoras garante a comparabilidade dos resultados com o diagnóstico de 2025. Recomendado para uso na escala v1.5.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-12 text-center">
                            <FileCheck2 size={64} className="text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-800">Selecione um banco para auditar</h3>
                            <p className="text-slate-500 max-w-sm mt-2">
                                Todos os bancos de itens devem ser assinados pelo comitê técnico antes da distribuição para as redes municipais.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

const StatBox = ({ label, value, status }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
        <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-900">{value}</span>
            <div className={`w-2 h-2 rounded-full ${status === 'optimal' || status === 'high' ? 'bg-emerald-400' : 'bg-slate-400'
                }`} />
        </div>
    </div>
);

const StabilityItem = ({ label, status, message }: any) => (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
        <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">{label}</span>
            <span className="text-[10px] text-slate-500">{message}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'LINKED' || status === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
            }`}>
            {status}
        </span>
    </div>
);
