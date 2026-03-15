import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, GraduationCap, Users, FileText,
    LogOut, Menu, ChevronRight, Tablet, PieChart, MessageCircle,
    Printer, Compass, Globe, PenTool, Target, UserCircle, Shield,
    Stethoscope, Map, Home, ChevronDown, Flame, Trophy,
    Cast, Calendar, Gamepad2, BarChart, Activity, CalendarCheck, Bot,
    Gamepad2 as Arcade,
    Sun, Moon,
    TrendingUp,
    Settings,
    Bird as Owl,
    ShoppingBag,
    Swords,
    Zap,
    Package,
    FlaskConical,
    FileUp,
    Terminal,
    Truck
} from 'lucide-react';
import { useSafeAppStore } from '../../store/useAppStore';
import { UserRole, TenantType } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useGovernance } from '../../hooks/useGovernance';
import { studentModule } from '../../modules/student-portal/module';
import { professorModule } from '../../modules/professor/module';
import { adminModule } from '../../modules/admin/module';
import { strategicModule } from '../../modules/analytics/module';
import { managementModule } from '../../modules/school-management/module';
import { parentsModule } from '../../modules/parents/module';

const modules = [
    studentModule,
    professorModule,
    adminModule,
    strategicModule,
    managementModule,
    parentsModule
];

interface NavItemProps {
    icon: any;
    label: string;
    path: string;
    active: boolean;
    onClick: () => void;
    collapsed: boolean;
}

const NavItem = ({ icon: Icon, label, path, active, onClick, collapsed }: NavItemProps) => (
    <button
        onClick={onClick}
        title={collapsed ? label : ''}
        className={`w-full group relative flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-300 rounded-xl mb-1 ${active
            ? 'bg-emerald-50 text-emerald-600'
            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
            }`}
    >
        <div className={`transition-all duration-300 p-2 rounded-xl ${active ? 'bg-emerald-100/50 scale-105 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' : 'group-hover:scale-105'}`}>
            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
        </div>
        {!collapsed && <span className="truncate">{label}</span>}
        {active && (
            <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
        )}
    </button>
);

const SectionHeader = ({ label, collapsed }: { label: string, collapsed: boolean }) => (
    !collapsed ? (
        <div className="px-4 pt-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-in fade-in duration-700">
            {label}
        </div>
    ) : null
);

const TenantBadge = ({ type }: { type: TenantType }) => {
    const config = {
        [TenantType.PUBLIC_MUNICIPAL]: { color: 'bg-emerald-500', label: 'Muni' },
        [TenantType.PUBLIC_STATE]: { color: 'bg-blue-500', label: 'Est' },
        [TenantType.PUBLIC_FEDERAL]: { color: 'bg-indigo-600', label: 'Fed' },
        [TenantType.PRIVATE]: { color: 'bg-amber-500', label: 'Priv' },
    };
    const c = config[type] || config[TenantType.PUBLIC_MUNICIPAL];
    return <span className={`text-[8px] text-white px-1.5 py-0.5 rounded font-black uppercase ${c.color}`}>{c.label}</span>;
};

export const ModernSidebar = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
    const store = useSafeAppStore();
    const { currentUser, toggleTheme, settings, setCurrentUser, students, schools, tenants, selectedChildId, setSelectedChildId } = store;
    const { canView } = usePermissions();
    const { can } = useGovernance('Sidebar');
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const [childMenuOpen, setChildMenuOpen] = useState(true);

    const handleLogout = () => {
        localStorage.clear();
        setCurrentUser(null);
        navigate('/login');
    };

    if (!currentUser) return null;

    // Roles and Logic (Strict restoration)
    const isMasterSaas = currentUser.role === UserRole.MASTER_SAAS;
    const isSystemAdmin = currentUser.role === UserRole.SYSTEM_ADMIN;
    const isMecAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const isStudent = currentUser.role === UserRole.ALUNO;
    const isParent = currentUser.role === UserRole.PAIS;
    const isStateAdmin = currentUser.role === UserRole.STATE_ADMIN;
    const isTenantAdmin = currentUser.role === UserRole.TENANT_ADMIN;
    const isProfessor = currentUser.role === UserRole.PROFESSOR;

    const isStrategic = isStateAdmin || isTenantAdmin;
    const isManagement = isMasterSaas || isSystemAdmin || isMecAdmin || isStrategic || currentUser.role === UserRole.DIRETOR || currentUser.role === UserRole.SUPERVISOR;
    const canManageCapabilities = isMasterSaas || isSystemAdmin || isMecAdmin || isStrategic || currentUser.role === UserRole.DIRETOR;

    // Get all modules allowed for current role
    const activeModules = modules.filter(m => m.allowedRoles.includes(currentUser.role));

    // Aggregate and deduplicate items by path
    const allItems = activeModules.reduce((acc, mod) => {
        mod.sidebarItems.forEach(item => {
            if (!acc.find(prev => prev.path === item.path)) {
                acc.push(item);
            }
        });
        return acc;
    }, [] as any[]);

    const myChildren = isParent && currentUser.childrenIds && students
        ? students.filter(s => currentUser.childrenIds?.includes(s.id))
        : [];

    return (
        <aside className={`${collapsed ? 'w-20' : 'w-72'} bg-white/80 backdrop-blur-xl border-r border-slate-100 flex-shrink-0 transition-all duration-500 flex flex-col relative z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
            {/* Pulsing Neon Logo Placeholder Style */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes neon-pulse {
                    0%, 100% { filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.4)) drop-shadow(0 0 5px rgba(16, 185, 129, 0.2)); }
                    50% { filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 12px rgba(16, 185, 129, 0.4)); }
                }
                .neon-owl {
                    animation: neon-pulse 2.5s infinite ease-in-out;
                }
            `}} />

            {/* Logo Section */}
            <div className="h-24 flex items-center px-6">
                <div className={`flex items-center gap-4 ${collapsed ? 'justify-center w-full' : ''}`}>
                    <div className={`shrink-0 transform hover:rotate-3 transition-transform ${collapsed ? 'w-10 h-10' : 'w-12 h-12'} relative group`}>
                        <img
                            src="/social1.png"
                            alt="Logo"
                            className="w-full h-full object-contain drop-shadow-xl"
                        />
                        <div className="absolute inset-0 bg-brand-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-tight">ExamePad</h2>
                            <p className="text-[9px] text-emerald-600 font-black tracking-[0.25em] -mt-0.5 uppercase">Digital Platform</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Nav Content */}
            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-10">
                {/* 1. Profile / Settings (All except Strategic) */}
                {!isStrategic && (
                    <NavItem
                        icon={UserCircle}
                        label="Meu Perfil"
                        path="/my-profile"
                        active={currentPath === '/my-profile'}
                        onClick={() => navigate('/my-profile')}
                        collapsed={collapsed}
                    />
                )}

                {/* 2. Parent Context Selection */}
                {isParent && myChildren.length > 0 && !collapsed && (
                    <div className="my-6 px-1 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => setChildMenuOpen(!childMenuOpen)}
                                className="w-full p-4 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100/50 transition"
                            >
                                <span>Aluno Ativo</span>
                                <ChevronDown size={14} className={`transition-transform duration-300 ${childMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {childMenuOpen && (
                                <div className="p-2 space-y-1">
                                    {myChildren.map(child => {
                                        const childSchool = schools.find(s => s.id === child.schoolId);
                                        const childTenant = tenants.find(t => t.id === child.tenantId);
                                        const isActive = selectedChildId === child.id;
                                        return (
                                            <button
                                                key={child.id}
                                                onClick={() => setSelectedChildId(child.id)}
                                                className={`w-full group text-left p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-white shadow-md' : 'hover:bg-white/60'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-inner ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                        {child.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                                            <span className={`text-xs font-bold truncate ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                {child.name.split(' ')[0]}
                                                            </span>
                                                            <TenantBadge type={childTenant?.type || TenantType.PUBLIC_MUNICIPAL} />
                                                        </div>
                                                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{childSchool?.name}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Role-Based Navigation */}

                {/* Unified Access Tools */}
                <SectionHeader label="Ferramentas" collapsed={collapsed} />
                {allItems
                    .filter(item => {
                        const legacyDecision = !item.resource || canView(item.resource);
                        // Shadow Check: Não altera o resultado, apenas gera log/audit
                        if (item.resource) can(item.resource as any, 'VIEW');
                        return legacyDecision;
                    })
                    .map(item => (
                        <NavItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            active={currentPath === item.path}
                            onClick={() => navigate(item.path)}
                            collapsed={collapsed}
                        />
                    ))
                }

                {/* Parent Selection Context (Keep if parent and no child selected yet) */}
                {isParent && myChildren.length > 0 && selectedChildId === '' && !collapsed && (
                    <div className="text-center text-slate-400 p-8 text-xs font-medium bg-slate-50/50 rounded-2xl mx-4 my-2 border border-dashed border-slate-200">
                        Selecione um aluno acima para visualizar os dados acadêmicos detalhados.
                    </div>
                )}

            </div>

            {/* Bottom Panel */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/30 backdrop-blur-md rounded-t-3xl">
                <div className="flex flex-col gap-3">
                    <button
                        onClick={toggleTheme}
                        className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-300 shadow-sm"
                    >
                        {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        {!collapsed && <span className="text-xs font-black uppercase tracking-widest">{settings.theme === 'dark' ? 'Dia' : 'Noite'}</span>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-300 shadow-sm"
                    >
                        <LogOut size={20} />
                        {!collapsed && <span className="text-xs font-black uppercase tracking-widest">Sair</span>}
                    </button>

                    {!collapsed && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-bottom-2 duration-700">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[11px] font-black text-slate-900 truncate uppercase">{currentUser.name.split(' ')[0]}</p>
                                <p className="text-[9px] text-slate-400 truncate">{currentUser.role}</p>
                            </div>
                            <Settings size={14} className="text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer" />
                        </div>
                    )}
                </div>
            </div>
        </aside >
    );
};
