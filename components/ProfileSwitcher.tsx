import React, { useState } from 'react';
import { UserRole } from '../types';
import { useAppStore } from '../store/useAppStore';
import { ChevronDown, User, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PROFILE_OPTIONS = [
    { role: 'MASTER_SAAS' as UserRole, label: '🚀 GESTÃO SAAS (MASTER)', color: 'emerald', description: 'Controle Total & Business Intel' },
    { role: 'SYSTEM_ADMIN' as UserRole, label: '⚙️ ADMIN DO SISTEMA', color: 'slate', description: 'Gestão Técnica do SaaS' },
    { role: 'SUPER_ADMIN' as UserRole, label: '🏛️ MEC (SUPERADMIN)', color: 'purple', description: 'Visão Nacional' },
    { role: 'STATE_ADMIN' as UserRole, label: '🏢 Secretaria Estadual', color: 'indigo', description: 'Gestão Estadual' },
    { role: 'TENANT_ADMIN' as UserRole, label: '🌐 Secretaria Municipal', color: 'blue', description: 'Gestão Municipal' },
    { role: 'DIRETOR' as UserRole, label: '🏫 Diretor de Escola', color: 'green', description: 'Gestão Escolar' },
    { role: 'SUPERVISOR' as UserRole, label: '👔 Supervisor', color: 'cyan', description: 'Supervisão Pedagógica' },
    { role: 'PROFESSOR' as UserRole, label: '👨‍🏫 Professor', color: 'orange', description: 'Gestão de Turmas' },
    { role: 'ALUNO' as UserRole, label: '🎓 Aluno', color: 'pink', description: 'Portal do Estudante' },
    { role: 'PAIS' as UserRole, label: '👨‍👩‍👧‍👦 Pais e Responsáveis', color: 'teal', description: 'Acompanhamento Familiar' },
];

export const ProfileSwitcher: React.FC = () => {
    const { currentUser, setCurrentUser } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    if (!currentUser) return null;

    const currentProfile = PROFILE_OPTIONS.find(p => p.role === currentUser.role);

    const handleSwitch = (role: UserRole) => {
        if (!currentUser) return;

        // Update user with new role
        const updatedUser = { ...currentUser, role };

        // Save to localStorage for persistence
        localStorage.setItem('test_profile', role);

        // Update store immediately
        setCurrentUser(updatedUser);

        // Redirect to appropriate dashboard
        const targetPath = role === UserRole.ALUNO ? '/aluno' : '/dashboard';
        navigate(targetPath);

        setIsOpen(false);

        // Force a full reload to clear all global state/permissions/filters
        // This ensures the new profile starts with a clean slate
        console.log('🔄 ProfileSwitcher: Hard reload initiated...');
        setTimeout(() => {
            window.location.href = targetPath;
            window.location.reload();
        }, 100);
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 transition-all group"
            >
                <User size={16} className="text-brand-primary" />
                <div className="flex flex-col items-start">
                    <span className="text-xs font-bold text-white">{currentProfile?.label || 'Perfil'}</span>
                    <span className="text-[10px] text-slate-400">{currentProfile?.description}</span>
                </div>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                <RefreshCw size={12} />
                                Trocar Perfil de Teste
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                                Selecione um perfil para testar suas funcionalidades
                            </p>
                        </div>

                        {/* Profile List */}
                        <div className="max-h-96 overflow-y-auto">
                            {PROFILE_OPTIONS.map((profile) => {
                                const isActive = profile.role === currentUser.role;

                                return (
                                    <button
                                        key={profile.role}
                                        onClick={() => handleSwitch(profile.role)}
                                        disabled={isActive}
                                        className={`
                                            w-full px-4 py-3 flex items-center gap-3 transition-all
                                            ${isActive
                                                ? 'bg-brand-primary/20 border-l-4 border-brand-primary cursor-default'
                                                : 'hover:bg-slate-800/50 border-l-4 border-transparent hover:border-slate-600'
                                            }
                                        `}
                                    >
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">
                                                    {profile.label}
                                                </span>
                                                {isActive && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-primary text-white rounded-full">
                                                        ATIVO
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {profile.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700">
                            <p className="text-[10px] text-slate-500 text-center">
                                💡 O perfil será alterado instantaneamente
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
