import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, GraduationCap, Users, FileText,
    LogOut, Menu, ChevronRight, Tablet, PieChart, MessageCircle,
    Printer, Compass, Globe, PenTool, Target, UserCircle, Shield,
    Stethoscope, Map, Home, ChevronDown, Swords, Flame, Trophy,
    Cast, Calendar, Gamepad2, BarChart, Activity, CalendarCheck, Bot,
    Gamepad2 as Arcade,
    Sun, Moon,
    TrendingUp,
    Settings,
    Bird as Owl
} from 'lucide-react';
import { useSafeAppStore } from '../../store/useAppStore';
import { UserRole, TenantType } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';

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
    const isSystemAdmin = currentUser.role === UserRole.SYSTEM_ADMIN;
    const isMecAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const isStudent = currentUser.role === UserRole.ALUNO;
    const isParent = currentUser.role === UserRole.PAIS;
    const isStateAdmin = currentUser.role === UserRole.STATE_ADMIN;
    const isTenantAdmin = currentUser.role === UserRole.TENANT_ADMIN;
    const isProfessor = currentUser.role === UserRole.PROFESSOR;

    const isStrategic = isStateAdmin || isTenantAdmin;
    const isManagement = isSystemAdmin || isMecAdmin || isStrategic || currentUser.role === UserRole.DIRETOR || currentUser.role === UserRole.SUPERVISOR;
    const canManageCapabilities = isSystemAdmin || isMecAdmin || isStrategic || currentUser.role === UserRole.DIRETOR;

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
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl shadow-slate-900/10 shrink-0 transform hover:rotate-3 transition-transform neon-owl">
                        <Owl size={24} fill="currentColor" strokeWidth={1.5} />
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

                {/* SaaS Admin Section */}
                {isSystemAdmin && (
                    <>
                        <SectionHeader label="Gestão SaaS" collapsed={collapsed} />
                        <NavItem icon={Shield} label="Central de Controle" path="/admin/saas" active={currentPath === '/admin/saas'} onClick={() => navigate('/admin/saas')} collapsed={collapsed} />
                        <NavItem icon={Users} label="Gestão de Clientes" path="/admin/tenants" active={currentPath === '/admin/tenants'} onClick={() => navigate('/admin/tenants')} collapsed={collapsed} />
                        <NavItem icon={BarChart} label="Métricas Globais" path="/admin/metrics" active={currentPath === '/admin/metrics'} onClick={() => navigate('/admin/metrics')} collapsed={collapsed} />
                    </>
                )}

                {/* Student Flow */}
                {isStudent && (
                    <>
                        <SectionHeader label="Portal Aluno" collapsed={collapsed} />
                        <NavItem icon={LayoutDashboard} label="Meu Desempenho" path="/aluno" active={currentPath === '/aluno' || currentPath === '/dashboard'} onClick={() => navigate('/aluno')} collapsed={collapsed} />
                        <NavItem icon={Target} label="Plano de Estudos" path="/study-plans" active={currentPath === '/study-plans'} onClick={() => navigate('/study-plans')} collapsed={collapsed} />
                        <NavItem icon={Arcade} label="Games Arcade" path="/aluno/arcade" active={currentPath === '/aluno/arcade'} onClick={() => navigate('/aluno/arcade')} collapsed={collapsed} />
                        <NavItem icon={Bot} label="Corujão Tutor" path="/aluno/tutor" active={currentPath === '/aluno/tutor'} onClick={() => navigate('/aluno/tutor')} collapsed={collapsed} />
                        <NavItem icon={Compass} label="Bússola" path="/aluno/bussola" active={currentPath === '/aluno/bussola'} onClick={() => navigate('/aluno/bussola')} collapsed={collapsed} />
                        <NavItem icon={Trophy} label="Avatar Shop" path="/aluno/loja" active={currentPath === '/aluno/loja'} onClick={() => navigate('/aluno/loja')} collapsed={collapsed} />
                    </>
                )}

                {/* Parent Flow */}
                {isParent && (
                    <>
                        <SectionHeader label="Portal Família" collapsed={collapsed} />
                        <NavItem icon={LayoutDashboard} label="Desempenho" path="/dashboard" active={currentPath === '/dashboard'} onClick={() => navigate('/dashboard')} collapsed={collapsed} />
                        <NavItem icon={MessageCircle} label="Comunicação" path="/communication" active={currentPath === '/communication'} onClick={() => navigate('/communication')} collapsed={collapsed} />
                    </>
                )}

                {/* Management / Strategic Flow */}
                {isManagement && (
                    <>
                        <SectionHeader label="Dashboard Geral" collapsed={collapsed} />
                        <NavItem icon={PieChart} label="Visão Geral" path="/dashboard" active={currentPath === '/dashboard'} onClick={() => navigate('/dashboard')} collapsed={collapsed} />

                        <SectionHeader label="Acadêmico" collapsed={collapsed} />
                        <NavItem icon={FileText} label="Banco de Itens" path="/items" active={currentPath.includes('/items')} onClick={() => navigate('/items')} collapsed={collapsed} />
                        <NavItem icon={BookOpen} label="Provas" path="/exams" active={currentPath.includes('/exams')} onClick={() => navigate('/exams')} collapsed={collapsed} />
                        <NavItem icon={GraduationCap} label="Aplicação" path="/online-exam" active={currentPath.includes('/online-exam')} onClick={() => navigate('/online-exam')} collapsed={collapsed} />
                        <NavItem icon={Calendar} label="Diário" path="/class-diary" active={currentPath === '/class-diary'} onClick={() => navigate('/class-diary')} collapsed={collapsed} />
                        <NavItem icon={Map} label="Alocação" path="/allocation" active={currentPath === '/allocation'} onClick={() => navigate('/allocation')} collapsed={collapsed} />
                        <NavItem icon={Cast} label="Eventos" path="/gamified-events" active={currentPath === '/gamified-events'} onClick={() => navigate('/gamified-events')} collapsed={collapsed} />
                        <NavItem icon={GraduationCap} label="Ensino" path="/study-plans" active={currentPath === '/study-plans'} onClick={() => navigate('/study-plans')} collapsed={collapsed} />

                        <SectionHeader label="Estratégico" collapsed={collapsed} />
                        <NavItem icon={BarChart} label="Analytics" path="/analytics" active={currentPath === '/analytics'} onClick={() => navigate('/analytics')} collapsed={collapsed} />
                        <NavItem icon={TrendingUp} label="Advanced BI" path="/advanced-analytics" active={currentPath === '/advanced-analytics'} onClick={() => navigate('/advanced-analytics')} collapsed={collapsed} />
                        <NavItem icon={Globe} label="Portal OCDE" path="/oecd-portal" active={currentPath === '/oecd-portal'} onClick={() => navigate('/oecd-portal')} collapsed={collapsed} />
                        {canView('REPORTS') && (
                            <NavItem icon={Printer} label="Relatórios" path="/adm-relatorios" active={currentPath === '/adm-relatorios'} onClick={() => navigate('/adm-relatorios')} collapsed={collapsed} />
                        )}
                        <NavItem icon={Users} label="Rede" path="/admin/gestao" active={currentPath.includes('/admin/gestao')} onClick={() => navigate('/admin/gestao')} collapsed={collapsed} />

                        <SectionHeader label="Especializado" collapsed={collapsed} />
                        <NavItem icon={Shield} label="Risco" path="/risk-dashboard" active={currentPath === '/risk-dashboard'} onClick={() => navigate('/risk-dashboard')} collapsed={collapsed} />
                        <NavItem icon={Stethoscope} label="Saúde Mental" path="/neuro-screening" active={currentPath === '/neuro-screening'} onClick={() => navigate('/neuro-screening')} collapsed={collapsed} />
                        <NavItem icon={Gamepad2} label="Arcade Gov" path="/admin/governanca" active={currentPath.includes('/admin/governanca')} onClick={() => navigate('/admin/governanca')} collapsed={collapsed} />

                        <SectionHeader label="Apps" collapsed={collapsed} />
                        <NavItem icon={Tablet} label="App Tablet" path="/apps/tablet" active={currentPath.includes('/apps/tablet')} onClick={() => navigate('/apps/tablet')} collapsed={collapsed} />
                        <NavItem icon={Cast} label="Demo Live" path="/apps/demo" active={currentPath.includes('/apps/demo')} onClick={() => navigate('/apps/demo')} collapsed={collapsed} />

                        {/* Gov & Security */}
                        {canManageCapabilities && (
                            <>
                                <SectionHeader label="Sistema" collapsed={collapsed} />
                                <NavItem icon={Target} label="Governança" path="/admin/capabilities" active={currentPath === '/admin/capabilities'} onClick={() => navigate('/admin/capabilities')} collapsed={collapsed} />
                            </>
                        )}
                        {(isSystemAdmin || isMecAdmin) && (
                            <NavItem icon={Shield} label="Auditoria" path="/admin/audit" active={currentPath === '/admin/audit'} onClick={() => navigate('/admin/audit')} collapsed={collapsed} />
                        )}
                    </>
                )}

                {/* Professor specific (Non-Management) */}
                {isProfessor && !isManagement && (
                    <>
                        <SectionHeader label="Sala de Aula" collapsed={collapsed} />
                        <NavItem icon={PieChart} label="Minhas Turmas" path="/dashboard" active={currentPath === '/dashboard'} onClick={() => navigate('/dashboard')} collapsed={collapsed} />
                        <NavItem icon={Calendar} label="Diário" path="/class-diary" active={currentPath === '/class-diary'} onClick={() => navigate('/class-diary')} collapsed={collapsed} />

                        {canView('COMMAND_CENTER') && (
                            <NavItem icon={Activity} label="Painel de Controle" path="/central-comando" active={currentPath === '/central-comando'} onClick={() => navigate('/central-comando')} collapsed={collapsed} />
                        )}

                        <NavItem icon={Users} label="Conselho Digital (IA)" path="/coordinator/council" active={currentPath === '/coordinator/council'} onClick={() => navigate('/coordinator/council')} collapsed={collapsed} />

                        <SectionHeader label="Pedagógico" collapsed={collapsed} />
                        <NavItem icon={FileText} label="Banco de Questões" path="/items" active={currentPath.includes('/items')} onClick={() => navigate('/items')} collapsed={collapsed} />
                        <NavItem icon={BookOpen} label="Minhas Provas" path="/exams" active={currentPath.includes('/exams')} onClick={() => navigate('/exams')} collapsed={collapsed} />
                        <NavItem icon={GraduationCap} label="Aplicação" path="/online-exam" active={currentPath.includes('/online-exam')} onClick={() => navigate('/online-exam')} collapsed={collapsed} />
                        <NavItem icon={BarChart} label="Analytics" path="/analytics" active={currentPath === '/analytics'} onClick={() => navigate('/analytics')} collapsed={collapsed} />
                        <NavItem icon={GraduationCap} label="Planos de Ensino" path="/study-plans" active={currentPath === '/study-plans'} onClick={() => navigate('/study-plans')} collapsed={collapsed} />

                        <SectionHeader label="Coordenação" collapsed={collapsed} />
                        {canView('SCHEDULING') && (
                            <NavItem icon={CalendarCheck} label="Agendamento" path="/agendamento" active={currentPath === '/agendamento'} onClick={() => navigate('/agendamento')} collapsed={collapsed} />
                        )}
                    </>
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
                                <img src={`https://ui-avatars.com/api/?name=${currentUser.name}&background=random&size=100`} alt="Avatar" className="w-full h-full object-cover" />
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
        </aside>
    );
};
