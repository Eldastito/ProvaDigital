import React, { useState } from 'react';
import { useLocation, useNavigate, Outlet, Navigate } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, GraduationCap, Users, FileText,
    LogOut, Menu, ChevronRight, Tablet, PieChart, MessageCircle,
    Printer, Compass, Globe,
    PenTool, Target, UserCircle, Shield, Stethoscope, Map, Home, ChevronDown, Swords, Flame, Trophy, Cast, Calendar, Gamepad2, BarChart, Activity, CalendarCheck, Bot,
    Gamepad as Arcade,
    TrendingUp
} from 'lucide-react';
import { useSafeAppStore } from '../store/useAppStore';
import { UserRole, TenantType, ExamModel } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { ProfileSwitcher } from './ProfileSwitcher';
import { ModernSidebar } from './layout/ModernSidebar';
import { FloatingOwlHelp } from './layout/FloatingOwlHelp';
import { OECDPortalView } from '../modules/analytics/OECDPortalView';
import { supabase } from '../services/supabaseClient';

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-4 ${active
            ? 'bg-[#162a42] text-white border-brand-secondary'
            : 'text-slate-400 hover:bg-[#112336] hover:text-white border-transparent'
            } `}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {label}
    </button>
);

const TenantBadge = ({ type }: { type: TenantType }) => {
    const config = {
        [TenantType.PUBLIC_MUNICIPAL]: { color: 'bg-emerald-500', label: 'Muni' },
        [TenantType.PUBLIC_STATE]: { color: 'bg-blue-500', label: 'Est' },
        [TenantType.PUBLIC_FEDERAL]: { color: 'bg-indigo-600', label: 'Fed' },
        [TenantType.PRIVATE]: { color: 'bg-amber-500', label: 'Priv' },
    };
    const c = config[type] || config[TenantType.PUBLIC_MUNICIPAL];
    return <span className={`text-[9px] text-white px-1.5 py-0.5 rounded font-bold ${c.color}`}>{c.label}</span>;
};

export const DashboardLayout = () => {
    const store = useSafeAppStore();
    const { currentUser, setCurrentUser, tenants, students, schools, selectedChildId, setSelectedChildId, isInitialized, initIdentity, identityKeys } = store;
    const { canView } = usePermissions();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [childMenuOpen, setChildMenuOpen] = useState(true);

    React.useEffect(() => {
        if (currentUser && !identityKeys) {
            initIdentity();
        }
    }, [currentUser, identityKeys, initIdentity]);

    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

    if (!currentUser) return <Navigate to="/login" replace />;

    // Data Loading Guard
    if (!isInitialized && (!store.users?.length || !store.schools?.length)) {
        return (
            <div className="flex h-screen w-screen items-center justify-center flex-col gap-4 bg-slate-50">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Sincronizando dados...</p>
            </div>
        );
    }

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Erro ao fazer logout Supabase:", error);
        }
        localStorage.clear();
        sessionStorage.clear();
        setCurrentUser(null);
        navigate('/login');
    };

    const isSystemAdmin = currentUser.role === UserRole.SYSTEM_ADMIN;
    const isMecAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const isStudent = currentUser.role === UserRole.ALUNO;
    const isParent = currentUser.role === UserRole.PAIS;
    const isStateAdmin = currentUser.role === UserRole.STATE_ADMIN;
    const isTenantAdmin = currentUser.role === UserRole.TENANT_ADMIN;
    const isOperational = currentUser.role === UserRole.PROFESSOR;

    const isStrategic = isStateAdmin || isTenantAdmin;
    const isManagement = isSystemAdmin || isMecAdmin || isStrategic || currentUser.role === UserRole.DIRETOR || currentUser.role === UserRole.SUPERVISOR;

    const canManageCapabilities = isSystemAdmin || isMecAdmin || isStrategic || currentUser.role === UserRole.DIRETOR;

    let tenantName = tenants.find(t => t.id === currentUser.tenantId)?.name || 'Tenant';
    if (isParent && selectedChildId) {
        const child = students.find(s => s.id === selectedChildId);
        if (child) {
            tenantName = tenants.find(t => t.id === child.tenantId)?.name || tenantName;
        }
    }

    const myChildren = isParent && currentUser.childrenIds && students
        ? students.filter(s => currentUser.childrenIds?.includes(s.id))
        : [];

    const cleanDisplayName = currentUser.name.replace(/\s*\(.*?\)\s*/g, '').trim();

    return (
        <div className="flex h-screen overflow-hidden font-sans">
            <ModernSidebar
                collapsed={!sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden bg-secondary">
                <header className="h-20 bg-surface border-b border-color flex items-center justify-between px-6 shadow-sm flex-shrink-0 z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-500/10 rounded-lg transition-colors">
                            <Menu size={20} className="text-secondary" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <h1 className="text-lg font-black text-brand-dark tracking-tight">{tenantName}</h1>
                                <p className="text-xs text-slate-500 font-medium">ExamePad SaaS</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ProfileSwitcher />
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-primary">{cleanDisplayName}</p>
                                <p className="text-xs text-secondary">{currentUser.email}</p>
                            </div>
                            <button onClick={handleLogout} className="p-2 hover:bg-slate-500/10 rounded-lg transition-colors group" title="Sair">
                                <LogOut size={18} className="text-secondary group-hover:text-rose-600 transition-colors" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-secondary">
                    <Outlet />
                </main>

                {/* 🦉 Corujinha Flutuante */}
                <FloatingOwlHelp />
            </div>
        </div>
    );
};
