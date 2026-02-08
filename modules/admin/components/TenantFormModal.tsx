import React, { useState } from 'react';
import { X, Building2, Shield, Users, Mail, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Tenant, TenantType } from '../../../types';
import { uuidv4 } from '../../../utils/helpers';
import { useSafeAppStore } from '../../../store/useAppStore';

interface TenantFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TenantFormModal = ({ isOpen, onClose }: TenantFormModalProps) => {
    const { addTenant } = useSafeAppStore();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        type: TenantType.PUBLIC_MUNICIPAL,
        billingEmail: '',
        maxStudents: 5000,
        contractEnd: '2026-12-31',
        features: {
            ai_audit: true,
            neuro_screening: false,
            tablet_mode: true,
            offline_sync: true,
            bi_advanced: true
        }
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const newTenant: Tenant = {
                id: 't_' + uuidv4().slice(0, 8),
                ...formData,
                status: 'active'
            };

            await addTenant(newTenant);
            onClose();
            alert('✅ Cliente/Prefeitura cadastrado com sucesso!');
        } catch (error) {
            alert('❌ Erro ao cadastrar cliente. Verifique os dados e tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                <header className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-primary/10 rounded-xl">
                            <Building2 className="text-brand-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Novo Cliente / Prefeitura</h2>
                            <p className="text-slate-500 text-xs font-medium">Provisionar nova instância no ecossistema SaaS</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                            <FileText size={12} /> Dados Cadastrais
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nome da Instituição / Prefeitura</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: P.M. de Santana do Sul"
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-primary/50 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">CNPJ (Obrigatório)</label>
                                <input
                                    required
                                    value={formData.cnpj}
                                    onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                    placeholder="00.000.000/0001-00"
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-primary/50 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo de Cliente</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as TenantType })}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-primary/50 focus:bg-white transition-all appearance-none"
                                >
                                    <option value={TenantType.PUBLIC_MUNICIPAL}>Prefeitura (Municipal)</option>
                                    <option value={TenantType.PUBLIC_STATE}>Estado (Estadual)</option>
                                    <option value={TenantType.PUBLIC_FEDERAL}>Federal (Federal)</option>
                                    <option value={TenantType.PRIVATE}>Escola Privada / Rede</option>
                                </select>
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail de Faturamento</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input
                                        type="email"
                                        value={formData.billingEmail}
                                        onChange={e => setFormData({ ...formData, billingEmail: e.target.value })}
                                        placeholder="financeiro@pm.gov.br"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-primary/50 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Details */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                            <Shield size={12} /> Plano e Limites
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex justify-between">
                                    Limite de Alunos <span>{formData.maxStudents.toLocaleString()}</span>
                                </label>
                                <input
                                    type="range"
                                    min="500"
                                    max="200000"
                                    step="500"
                                    value={formData.maxStudents}
                                    onChange={e => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                                    className="accent-brand-primary h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-2"
                                />
                                <p className="text-[9px] text-slate-400 font-medium">Impacta diretamente no MRR calculado.</p>
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Vencimento do Contrato</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input
                                        type="date"
                                        value={formData.contractEnd}
                                        onChange={e => setFormData({ ...formData, contractEnd: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-primary/50 focus:bg-white transition-all font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Toggle */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                            <Users size={12} /> Recursos Habilitados
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'ai_audit', label: 'IA Audit Pro', desc: 'Correção automática de redações' },
                                { id: 'neuro_screening', label: 'Neuro Screening', desc: 'Avaliação de TDAH/Autismo' },
                                { id: 'tablet_mode', label: 'Modo Offline (Tablet)', desc: 'Sincronização mesh local' },
                                { id: 'bi_advanced', label: 'Advanced BI', desc: 'Dashboards C-Level p/ Prefeito' },
                            ].map(feature => (
                                <label
                                    key={feature.id}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.features[feature.id as keyof typeof formData.features]
                                        ? 'bg-brand-primary/5 border-brand-primary/20 ring-1 ring-brand-primary/10'
                                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.features[feature.id as keyof typeof formData.features] ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800 leading-tight">{feature.label}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{feature.desc}</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.features[feature.id as keyof typeof formData.features]}
                                        onChange={() => setFormData({
                                            ...formData,
                                            features: {
                                                ...formData.features,
                                                [feature.id]: !formData.features[feature.id as keyof typeof formData.features]
                                            }
                                        })}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    <footer className="pt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] px-6 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Processando...' : 'Provisionar Cliente'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};
