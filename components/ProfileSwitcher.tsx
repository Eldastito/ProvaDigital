import React, { useState } from 'react';
import { UserRole } from '../types';
import { useAppStore } from '../store/useAppStore';
import { ChevronDown, User, RefreshCw } from 'lucide-react';

const PROFILE_OPTIONS = [
    { role: 'SUPER_ADMIN' as UserRole, label: '🏛️ MEC (SUPERADMIN)', color: 'purple', description: 'Visão Nacional' },
    { role: 'TENANT_ADMIN' as UserRole, label: '🌐 Secretaria Municipal', color: 'blue', description: 'Gestão de Rede' },
    { role: 'DIRETOR' as UserRole, label: '🏫 Diretor de Escola', color: 'green', description: 'Gestão Escolar' },
    { role: 'SUPERVISOR' as UserRole, label: '👔 Supervisor', color: 'cyan', description: 'Supervisão Pedagógica' },
    { role: 'PROFESSOR' as UserRole, label: '👨‍🏫 Professor', color: 'orange', description: 'Gestão de Turmas' },
    { role: 'ALUNO' as UserRole, label: '🎓 Aluno', color: 'pink', description: 'Portal do Estudante' },
];

export const ProfileSwitcher: React.FC = () => {
    const { currentUser, setCurrentUser } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!currentUser) return null;

    const currentProfile = PROFILE_OPTIONS.find(p => p.role === currentUser.role);

    const handleSwitch = (role: UserRole) => {
        const updatedUser = { ...currentUser, role };
        setCurrentUser(updatedUser);
        localStorage.setItem('test_profile', role);
        setIsOpen(false);

        // Force reload to apply new role and update UI
        setTimeout(() => window.location.reload(), 100);
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
                                💡 A página será recarregada ao trocar de perfil
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
