
import React, { useState } from 'react';
import { Shield, Check, X, Save, AlertTriangle, Building } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { Action, Resource, UserRole, PermissionMatrix } from '../../../types';

const RESOURCES: { id: Resource; label: string; description: string }[] = [
    { id: 'SCHOOL_DATA', label: 'Gestão de Escolas', description: 'Gerir escolas, turmas e matrículas' },
    { id: 'USER_DATA', label: 'Gestão de Usuários', description: 'Cadastrar alunos e staff' },
    { id: 'ITEM_BANK', label: 'Banco de Itens', description: 'Acessar e criar questões' },
    { id: 'EXAM_MGMT', label: 'Gestão de Provas', description: 'Criar, agendar e corrigir provas' },
    { id: 'OFFLINE_OPS', label: 'Ecossistema Offline', description: 'App Tablet e Sincronização' },
    { id: 'ANALYTICS', label: 'Analytics', description: 'Ver dashboards e relatórios' },
    { id: 'COMMUNICATION', label: 'Comunicação', description: 'Chat e Mural de Avisos' },
    { id: 'AI_FEATURES', label: 'Ferramentas de IA', description: 'Geração de questões e correção automática' },
    { id: 'GAMIFIED_EVENTS', label: 'Eventos Gamificados', description: 'Competições, Olimpíadas e Soletrando' },
];

// HIERARQUIA ESTRITA DEFINIDA PELO USUÁRIO
const ROLES = [
    UserRole.SUPER_ADMIN,   // 1. Gestão SaaS Inteiro
    UserRole.STATE_ADMIN,   // 2. Secretaria Estadual
    UserRole.TENANT_ADMIN,  // 3. Secretaria Municipal
    UserRole.DIRETOR,       // 4. Gestor Escolar
    UserRole.SUPERVISOR,    // 5. Supervisor Escolar
    UserRole.PROFESSOR,     // 6. Professores
    UserRole.ALUNO,         // 7. Alunos
    UserRole.PAIS           // 8. Pais e Responsáveis
];

const ACTIONS: Action[] = ['VIEW', 'CREATE', 'EDIT', 'DELETE'];

export const CapabilitiesView = () => {
    const { globalPermissions, updatePermissions, tenants, updateTenantFeatures } = useAppStore();
    const [localMatrix, setLocalMatrix] = useState<PermissionMatrix>(JSON.parse(JSON.stringify(globalPermissions)));
    const [selectedTenant, setSelectedTenant] = useState<string>('');

    React.useEffect(() => {
        if (tenants && tenants.length > 0 && !selectedTenant) {
            setSelectedTenant(tenants[0].id);
        }
    }, [tenants, selectedTenant]);

    const currentTenant = tenants?.find(t => t.id === selectedTenant);

    if (!tenants || tenants.length === 0) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center flex-col gap-4">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Carregando dados das secretarias...</p>
            </div>
        );
    }

    const togglePermission = (role: UserRole, resource: Resource, action: Action) => {
        // Bloqueia a edição do SUPER_ADMIN para evitar lockout acidental
        if (role === UserRole.SUPER_ADMIN) {
            alert("As permissões de Super Admin são absolutas e não podem ser revogadas nesta interface.");
            return;
        }

        setLocalMatrix(prev => {
            const newMatrix = { ...prev };
            // Initialize role/resource if undefined
            if (!newMatrix[role]) newMatrix[role] = {};

            const currentActions = newMatrix[role][resource] || [];

            if (currentActions.includes(action)) {
                newMatrix[role][resource] = currentActions.filter(a => a !== action);
            } else {
                newMatrix[role][resource] = [...currentActions, action];
            }
            return newMatrix;
        });
    };

    const toggleTenantFeature = (resource: Resource) => {
        if (!currentTenant) return;
        const currentDisabled = currentTenant.disabledResources || [];
        const isDisabled = currentDisabled.includes(resource);

        let newDisabled;
        if (isDisabled) {
            newDisabled = currentDisabled.filter(r => r !== resource);
        } else {
            newDisabled = [...currentDisabled, resource];
        }
        updateTenantFeatures(currentTenant.id, newDisabled);
    };

    const saveGlobal = () => {
        updatePermissions(localMatrix);
        alert("Matriz global de permissões atualizada com sucesso!");
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                        <Shield className="text-brand-primary" /> Governança Hierárquica
                    </h1>
                    <p className="text-slate-500 mt-1">Defina a cascata de permissões do nível Super Admin até Pais/Responsáveis.</p>
                </div>
                <button onClick={saveGlobal} className="btn-gradient px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition">
                    <Save size={20} /> Salvar Alterações Globais
                </button>
            </div>

            {/* GLOBAL MATRIX */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-slate-50">
                    <h2 className="font-bold text-lg text-slate-800">Matriz de Capacidades (Padrão Global)</h2>
                    <p className="text-xs text-slate-500">Estas regras aplicam-se a toda a hierarquia.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-600 font-bold">
                            <tr>
                                <th className="p-4 border border-slate-200 w-64 min-w-[250px] sticky left-0 bg-slate-100 z-10">Funcionalidade / Recurso</th>
                                {ROLES.map(role => (
                                    <th key={role} className={`p-4 border border-slate-200 text-center min-w-[150px] ${role === UserRole.SUPER_ADMIN ? 'bg-brand-dark text-white' : ''}`}>
                                        {role.replace('_', ' ')}
                                        {role === UserRole.SUPER_ADMIN && <span className="block text-[9px] font-normal opacity-70">Nível Máximo</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {RESOURCES.map(res => (
                                <tr key={res.id} className="hover:bg-slate-50">
                                    <td className="p-4 border border-slate-200 bg-white sticky left-0 z-10">
                                        <div className="font-bold text-slate-800">{res.label}</div>
                                        <div className="text-xs text-slate-500">{res.description}</div>
                                    </td>
                                    {ROLES.map(role => (
                                        <td key={`${res.id}-${role}`} className={`p-2 border border-slate-200 ${role === UserRole.SUPER_ADMIN ? 'bg-slate-50' : ''}`}>
                                            <div className="flex justify-center gap-1 flex-wrap">
                                                {ACTIONS.map(action => {
                                                    const isActive = localMatrix[role]?.[res.id]?.includes(action);

                                                    // Visual styling based on action type
                                                    let colorClass = 'bg-slate-100 text-slate-400 border-slate-200';
                                                    if (isActive) {
                                                        if (action === 'VIEW') colorClass = 'bg-sky-100 text-sky-700 border-sky-300';
                                                        if (action === 'CREATE') colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-300';
                                                        if (action === 'EDIT') colorClass = 'bg-amber-100 text-amber-700 border-amber-300';
                                                        if (action === 'DELETE') colorClass = 'bg-rose-100 text-rose-700 border-rose-300';
                                                    }

                                                    // Super Admin always visually active but maybe locked
                                                    if (role === UserRole.SUPER_ADMIN) {
                                                        return (
                                                            <div key={action} className={`w-8 h-8 rounded flex items-center justify-center border text-[10px] font-bold ${colorClass} opacity-100 cursor-not-allowed`}>
                                                                {action[0]}
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            key={action}
                                                            onClick={() => togglePermission(role, res.id, action)}
                                                            className={`w-8 h-8 rounded flex items-center justify-center border text-[10px] font-bold transition-all ${colorClass} ${!isActive && 'opacity-50 hover:opacity-100'}`}
                                                            title={`${action} - ${res.label} (${role})`}
                                                        >
                                                            {action[0]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50 flex gap-4 text-xs text-slate-500 border-t justify-end">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-sky-100 border border-sky-300 rounded block"></span> V = Visualizar</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded block"></span> C = Criar</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-100 border border-amber-300 rounded block"></span> E = Editar</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-100 border border-rose-300 rounded block"></span> D = Deletar</span>
                </div>
            </div>

            {/* TENANT FEATURE TOGGLES */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Building size={20} /> Configuração por Cliente (Prefeitura)</h2>
                        <p className="text-xs text-slate-500">Desabilite módulos inteiros para clientes específicos (Cascata de Restrição).</p>
                    </div>
                    <select
                        className="border border-slate-300 rounded-lg p-2 text-sm font-medium"
                        value={selectedTenant}
                        onChange={(e) => setSelectedTenant(e.target.value)}
                    >
                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.cnpj})</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {RESOURCES.map(res => {
                        const isDisabled = currentTenant?.disabledResources?.includes(res.id) ?? false;

                        return (
                            <div
                                key={res.id}
                                onClick={() => toggleTenantFeature(res.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isDisabled ? 'bg-slate-50 border-slate-200 opacity-60 grayscale' : 'bg-white border-brand-secondary shadow-sm hover:shadow-md'}`}
                            >
                                <div>
                                    <div className={`font-bold text-sm ${isDisabled ? 'text-slate-500' : 'text-brand-dark'}`}>{res.label}</div>
                                    <div className="text-[10px] text-slate-400">{isDisabled ? 'Desativado para este cliente' : 'Ativo'}</div>
                                </div>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDisabled ? 'bg-slate-300' : 'bg-emerald-500'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${isDisabled ? 'translate-x-0' : 'translate-x-4'}`}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span>Atenção: Desabilitar um módulo aqui remove o acesso para <strong>TODOS</strong> os usuários desta prefeitura, independente da matriz acima.</span>
                </div>
            </div>
        </div>
    );
};
