
import React, { useState, useEffect } from 'react';
import { Shield, Check, Save, AlertCircle, Eye, Plus, Edit3, Trash2, ChevronRight, Lock, Zap, HardDrive, DollarSign } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Action, Resource, UserRole, PermissionMatrix } from '../../types';

const RESOURCES: { id: Resource; label: string; description: string; icon?: any }[] = [
    { id: 'SCHOOL_DATA', label: 'Gestão de Unidades', description: 'Escolas, prédios e turmas' },
    { id: 'USER_DATA', label: 'Matrículas e Staff', description: 'Cadastro de alunos, pais e equipe' },
    { id: 'ITEM_BANK', label: 'Banco de Itens', description: 'Criação e curadoria de questões' },
    { id: 'EXAM_MGMT', label: 'Provas Digitais', description: 'Montagem, agendamento e correção' },
    { id: 'ANALYTICS', label: 'Dashboards IDG', description: 'Monitoramento de rendimento e evasão' },
    { id: 'COMMUNICATION', label: 'Comunicação Digital', description: 'Mural, chat e avisos oficiais' },
    { id: 'AI_FEATURES', label: 'Inteligência Artificial', description: 'Geração e correção assistida' },
    { id: 'NEURO_SCREENING', label: 'Triagem Neuropsic.', description: 'Laudos e rastreio de TEA/TDAH' },
    { id: 'GAMIFIED_EVENTS', label: 'Gamificação', description: 'Olimpíadas e Quiz Show' },
    { id: 'FINANCIAL', label: 'Financeiro', description: 'Contratos e cobranças de mensalidades', icon: DollarSign },
    { id: 'OFFLINE_OPS', label: 'Operações Tablet', description: 'Sincronização e logística de dispositivos', icon: HardDrive },
    { id: 'GOVERNANCE', label: 'Gestão do Sistema', description: 'Acesso a esta tela de governança' },
];

const ROLES_HIERARCHY = [
    UserRole.SUPER_ADMIN,
    UserRole.STATE_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.DIRETOR,
    UserRole.SUPERVISOR,
    UserRole.PROFESSOR,
    UserRole.ALUNO,
    UserRole.PAIS
];

const ACTIONS: { id: Action; icon: any; color: string; bg: string }[] = [
    { id: 'VIEW', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'CREATE', icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'EDIT', icon: Edit3, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'DELETE', icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50' }
];

export const CapabilitiesView = () => {
    const { globalPermissions, updatePermissions } = useAppStore();
    // Inicializa com uma cópia profunda para evitar referências compartilhadas
    const [localMatrix, setLocalMatrix] = useState<PermissionMatrix>(() => JSON.parse(JSON.stringify(globalPermissions)));
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.PROFESSOR);
    const [isDirty, setIsDirty] = useState(false);

    // Sincroniza se as permissões globais mudarem externamente
    useEffect(() => {
        setLocalMatrix(JSON.parse(JSON.stringify(globalPermissions)));
    }, [globalPermissions]);

    const togglePermission = (resource: Resource, action: Action) => {
        setIsDirty(true);
        setLocalMatrix(prev => {
            // Cópia profunda manual para garantir imutabilidade correta no React
            const newMatrix = { ...prev };
            
            // 1. Garantir que o objeto do perfil existe
            const rolePerms = { ...(newMatrix[selectedRole] || {}) };
            
            // 2. Garantir que a lista de ações do recurso existe
            const resourceActions = [...(rolePerms[resource] || [])];
            
            // 3. Toggle da ação
            if (resourceActions.includes(action)) {
                rolePerms[resource] = resourceActions.filter(a => a !== action);
            } else {
                rolePerms[resource] = [...resourceActions, action];
            }
            
            newMatrix[selectedRole] = rolePerms;
            return newMatrix;
        });
    };

    const handleSave = () => {
        updatePermissions(localMatrix);
        setIsDirty(false);
        alert("Matriz de governança aplicada! As alterações de visibilidade de menus e botões foram propagadas para todos os usuários logados.");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Governança SaaS</h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Configuração mestre de visibilidade e ações por perfil.</p>
                </div>
                <div className="flex items-center gap-4">
                    {isDirty && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-pulse border border-amber-200">
                            Alterações pendentes...
                        </span>
                    )}
                    <button 
                        onClick={handleSave} 
                        className={`btn-premium px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl transform transition-all ${!isDirty ? 'opacity-50 grayscale cursor-default scale-100' : 'hover:scale-105 active:scale-95'}`}
                        disabled={!isDirty}
                    >
                        <Save size={24}/> Aplicar Alterações
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Lado Esquerdo: Sidebar de Perfis */}
                <div className="lg:w-96 flex-shrink-0 space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4 mb-4">Hierarquia de Perfis</h3>
                    {ROLES_HIERARCHY.map(role => (
                        <button 
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group shadow-sm ${selectedRole === role ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/20' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-300'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedRole === role ? 'bg-white/20' : 'bg-slate-50 text-indigo-600'}`}>
                                    {role.charAt(0)}
                                </div>
                                <span className="font-black uppercase tracking-tight text-sm">{role.replace('_', ' ')}</span>
                            </div>
                            <ChevronRight size={20} className={selectedRole === role ? 'text-white' : 'text-slate-200 group-hover:translate-x-1 transition-transform'} />
                        </button>
                    ))}
                    
                    <div className="mt-8 p-6 bg-[#0f1d2e] rounded-[2rem] text-white relative overflow-hidden">
                        <Lock size={120} className="absolute -right-10 -bottom-10 opacity-5 rotate-12"/>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-indigo-400 mb-3 font-black text-xs uppercase tracking-widest">
                                <Shield size={14}/> Segurança Ativa
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                                Alterações nesta tela afetam imediatamente a visibilidade de menus e botões para todos os usuários do perfil selecionado.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Matriz Dinâmica */}
                <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
                    <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Painel de Controle</div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{selectedRole.replace('_', ' ')}</h2>
                        </div>
                        <div className="flex gap-4">
                           {ACTIONS.map(act => (
                               <div key={act.id} className="flex flex-col items-center">
                                   <div className={`p-2 rounded-lg ${act.bg} ${act.color}`}><act.icon size={16}/></div>
                                   <span className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">{act.id}</span>
                               </div>
                           ))}
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50 max-h-[700px] overflow-y-auto custom-scrollbar">
                        {RESOURCES.map(res => (
                            <div key={res.id} className="p-8 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                                <div className="max-w-lg">
                                    <div className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors uppercase tracking-tight flex items-center gap-2">
                                        {res.icon && <res.icon size={18} className="text-slate-400"/>}
                                        {res.label}
                                    </div>
                                    <div className="text-sm text-slate-400 font-medium mt-1">{res.description}</div>
                                </div>
                                <div className="flex gap-3">
                                    {ACTIONS.map(action => {
                                        const roleConfig = localMatrix[selectedRole] || {};
                                        const isAllowed = (roleConfig[res.id] || []).includes(action.id);
                                        
                                        return (
                                            <button 
                                                key={action.id}
                                                onClick={() => togglePermission(res.id, action.id)}
                                                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all shadow-sm ${isAllowed ? `${action.bg} ${action.color} border-transparent scale-110 shadow-lg` : 'bg-white border-slate-50 text-slate-200 hover:border-slate-200 hover:text-slate-400'}`}
                                                title={`${action.id} ${res.label}`}
                                            >
                                                {isAllowed ? <Check size={28} strokeWidth={4}/> : <action.icon size={20}/>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[2.5rem] flex gap-6 items-start shadow-sm border-dashed">
                <div className="p-4 bg-amber-100 rounded-2xl text-amber-600 animate-pulse">
                    <Zap size={32} fill="currentColor"/>
                </div>
                <div>
                    <h4 className="font-black text-amber-900 uppercase tracking-widest text-sm mb-2">Dica de Gestão</h4>
                    <p className="text-amber-800 leading-relaxed font-medium">
                        Ao remover a permissão <strong>VIEW</strong> de um recurso, o módulo correspondente será ocultado do menu lateral para simplificar a interface do usuário. Use isso para criar uma experiência focada para alunos e professores.
                    </p>
                </div>
            </div>
        </div>
    );
};
