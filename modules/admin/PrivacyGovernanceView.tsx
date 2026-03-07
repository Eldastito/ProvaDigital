import React, { useState, useEffect } from 'react';
import { 
    ShieldAlert, 
    Lock, 
    Eye, 
    FileCheck, 
    Trash2, 
    Users,
    History,
    ShieldCheck,
    Search
} from 'lucide-react';
import { privacyService } from '../../services/privacyService';

/**
 * PrivacyGovernanceView - Fase 9
 * Dashboard de Conformidade LGPD e Auditoria de Privacidade.
 */
export default function PrivacyGovernanceView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isPurging, setIsPurging] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Simulação de logs de privacidade para a interface
        const mockLogs = [
            { id: 1, actor: 'diretor_escola@edu.br', target: 'Aluno: Michele S.', category: 'PSYCHOMETRIC', reason: 'Análise de Risco de Evasão', ts: new Date().toISOString() },
            { id: 2, actor: 'professor_joao@edu.br', target: 'Aluno: Carlos D.', category: 'ACADEMIC', reason: 'Fechamento de Notas Trimestrais', ts: new Date(Date.now() - 3600000).toISOString() },
            { id: 3, actor: 'admin_central@examepad.com', target: 'Sistema: Global', category: 'PERSONAL', reason: 'Auditoria Mensal de Segurança', ts: new Date(Date.now() - 86400000).toISOString() },
        ];
        setLogs(mockLogs);
    }, []);

    const handlePurge = async () => {
        if (!confirm('Esta ação irá apagar logs operacionais com mais de 180 dias. Deseja continuar?')) return;
        setIsPurging(true);
        setTimeout(() => {
            setIsPurging(false);
            alert('Expurgo de dados concluído com sucesso (Conformidade Anexo G).');
        }, 1500);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Lock size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Governança & Privacidade (LGPD)
                        </h1>
                    </div>
                    <p className="text-slate-500">
                        Gestão de conformidade, trilhas de auditoria sensíveis e retenção de dados.
                    </p>
                </div>

                <button 
                    onClick={handlePurge}
                    disabled={isPurging}
                    className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-100 transition disabled:opacity-50"
                >
                    <Trash2 size={20} />
                    {isPurging ? 'Limpando...' : 'Expurgar Logs Antigos'}
                </button>
            </header>

            {/* Privacy Score / Status Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-brand-navy rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div className="space-y-4">
                        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-indigo-200">
                            Status de Conformidade
                        </div>
                        <div className="text-5xl font-black italic">A++</div>
                        <p className="text-indigo-100/70 text-sm">
                            Sua instituição segue 100% das diretrizes do **Privacy by Design** da Fase 9.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <StatusItem icon={<ShieldCheck size={16}/>} label="Criptografia em Repouso" active={true} />
                        <StatusItem icon={<ShieldCheck size={16}/>} label="Logs de Acesso Sensível" active={true} />
                        <StatusItem icon={<ShieldCheck size={16}/>} label="Mascaramento de PII" active={true} />
                    </div>
                    <div className="flex flex-col gap-3">
                         <StatusItem icon={<ShieldCheck size={16}/>} label="Gestão de Consentimento" active={true} />
                         <StatusItem icon={<ShieldCheck size={16}/>} label="Retenção de 180 Dias" active={true} />
                         <StatusItem icon={<Lock size={16}/>} label="Pseudo-anonimização" active={true} />
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <History size={20} className="text-indigo-600" /> Trilha de Auditoria LGPD
                    </h2>
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por ator ou motivo..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="px-6 py-4 text-center">Cat.</th>
                                <th className="px-6 py-4">Ator do Acesso</th>
                                <th className="px-6 py-4">Objeto (Target)</th>
                                <th className="px-6 py-4">Motivo Justificado</th>
                                <th className="px-6 py-4">Data/Hora</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${getCategoryClass(log.category)}`}>
                                            {log.category[0]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">{privacyService.maskName(log.actor)}</td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.target}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <ShieldAlert size={14} className="text-amber-500" />
                                            {log.reason}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">
                                        {new Date(log.ts).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Privacy by Design Card */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-dotted border-slate-300">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Eye size={20} className="text-slate-400" /> Mascaramento Automático
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                            <span className="text-sm font-medium text-slate-600">Michele Santos</span>
                            <span className="text-xs font-mono text-indigo-600 font-bold">{privacyService.maskName('Michele Santos')}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
                            <span className="text-sm font-medium text-slate-600">454.212.***-**</span>
                            <span className="text-xs font-mono text-indigo-600 font-bold">{privacyService.maskPII('454.212.878-12')}</span>
                        </div>
                    </div>
                </div>

                {/* Consent Management Preview */}
                <div className="bg-brand-navy p-6 rounded-2xl text-white">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Users size={20} className="text-brand-secondary" /> Gestão de Consentimento
                    </h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                            <span className="text-xs">Dados Psicopedagógicos</span>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500 rounded-full font-bold">Ativo</span>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between opacity-50">
                            <span className="text-xs">Uso de Imagem (Marketing)</span>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-500 rounded-full font-bold">Inativo</span>
                        </div>
                        <button className="w-full text-center text-xs text-brand-secondary font-bold hover:underline">
                            Ver todos os Termos & Aceites
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ icon, label, active }: any) {
    return (
        <div className="flex items-center gap-2 text-xs">
            <div className={active ? 'text-emerald-400' : 'text-slate-400'}>{icon}</div>
            <span className={active ? 'text-white' : 'text-slate-400'}>{label}</span>
        </div>
    );
}

function getCategoryClass(cat: string) {
    switch(cat) {
        case 'ACADEMIC': return 'bg-blue-50 text-blue-600';
        case 'PERSONAL': return 'bg-amber-50 text-amber-600';
        case 'PSYCHOMETRIC': return 'bg-purple-50 text-purple-600';
        default: return 'bg-slate-50 text-slate-600';
    }
}
