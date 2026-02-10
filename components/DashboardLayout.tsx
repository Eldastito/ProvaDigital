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
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
            <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-brand-dark border-r border-[#1e3a8a] flex-shrink-0 transition-all duration-300 flex flex-col shadow-xl overflow-hidden`}>
                <div className="h-20 border-b border-[#1e3a8a] flex items-center justify-center gap-3 overflow-hidden px-4">
                    <div className="w-8 h-8 bg-brand-secondary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-brand-secondary/20">E</div>
                    <div className={`${!sidebarOpen && 'opacity-0'} transition-opacity duration-200`}>
                        <h2 className="text-xl font-bold text-white tracking-tight">ExamePad</h2>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 space-y-1">
                    {!isStrategic && <NavItem icon={UserCircle} label="Meu Perfil" active={path === '/my-profile'} onClick={() => navigate('/my-profile')} />}

                    {isParent && myChildren.length > 0 && (
                        <div className="mb-4 px-2">
                            <div className="bg-[#162a42] rounded-lg overflow-hidden border border-[#1e3a8a]">
                                <button
                                    onClick={() => setChildMenuOpen(!childMenuOpen)}
                                    className="w-full p-3 flex items-center justify-between text-xs font-bold text-brand-secondary uppercase"
                                >
                                    <span>Aluno Selecionado</span>
                                    <ChevronDown size={14} className={`transition-transform ${childMenuOpen ? 'rotate-180' : ''} `} />
                                </button>
                                {childMenuOpen && (
                                    <div className="bg-[#0b1826] py-1">
                                        {myChildren.map(child => {
                                            const childSchool = schools.find(s => s.id === child.schoolId);
                                            const childTenant = tenants.find(t => t.id === child.tenantId);
                                            return (
                                                <button
                                                    key={child.id}
                                                    onClick={() => setSelectedChildId(child.id)}
                                                    className={`w-full text-left px-4 py-3 text-sm flex flex-col gap-1 hover:bg-white/5 transition border-l-2 ${selectedChildId === child.id ? 'border-brand-secondary bg-white/10' : 'border-transparent'} `}
                                                >
                                                    <div className="font-bold text-white flex items-center gap-2">
                                                        <TenantBadge type={childTenant?.type || TenantType.PUBLIC_MUNICIPAL} />
                                                        {child.name.split(' ')[0]}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 pl-4 leading-tight truncate">
                                                        {childSchool?.name}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isParent && (
                        <>
                            <NavItem icon={LayoutDashboard} label="Meu Desempenho" active={path === '/dashboard' || path === '/'} onClick={() => navigate('/dashboard')} />
                            <NavItem icon={MessageCircle} label="Comunicação" active={path === '/communication'} onClick={() => navigate('/communication')} />
                        </>
                    )}

                    {isStudent && (
                        <>
                            <NavItem icon={LayoutDashboard} label="Meu Desempenho" active={path === '/aluno'} onClick={() => navigate('/aluno')} />
                            <NavItem icon={Target} label="Plano de Estudos" active={path === '/study-plans'} onClick={() => navigate('/study-plans')} />
                            <NavItem icon={Arcade} label="Games Arcade" active={path === '/aluno/arcade'} onClick={() => navigate('/aluno/arcade')} />
                            <NavItem icon={Bot} label="Corujão Tutor" active={path === '/aluno/tutor'} onClick={() => navigate('/aluno/tutor')} />
                            <NavItem icon={Compass} label="Bússola do Futuro" active={path === '/aluno/bussola'} onClick={() => navigate('/aluno/bussola')} />
                            <NavItem icon={Trophy} label="Loja de Avatares" active={path === '/aluno/loja'} onClick={() => navigate('/aluno/loja')} />
                        </>
                    )}

                    {isSystemAdmin && (
                        <>
                            <div className="px-4 pt-4 pb-2 text-[10px] font-bold text-brand-secondary uppercase tracking-wider">Gestão do Negócio (SaaS)</div>
                            <NavItem icon={Shield} label="Central de Controle" active={path === '/admin/saas'} onClick={() => navigate('/admin/saas')} />
                            <NavItem icon={Users} label="Gestão de Clientes" active={path === '/admin/tenants'} onClick={() => navigate('/admin/tenants')} />
                            <NavItem icon={BarChart} label="Métricas Globais" active={path === '/admin/metrics'} onClick={() => navigate('/admin/metrics')} />
                        </>
                    )}

                    {isManagement && (
                        <>
                            <NavItem icon={PieChart} label="Visão Geral" active={path === '/dashboard'} onClick={() => navigate('/dashboard')} />
                            <div className="px-4 pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acadêmico</div>
                            <NavItem icon={FileText} label="Banco de Itens" active={path.includes('/items')} onClick={() => navigate('/items')} />
                            <NavItem icon={BookOpen} label="Provas" active={path.includes('/exams')} onClick={() => navigate('/exams')} />
                            <NavItem icon={GraduationCap} label="Aplicação de Prova" active={path.includes('/online-exam')} onClick={() => navigate('/online-exam')} />
                            <NavItem icon={Calendar} label="Diário de Classe" active={path === '/class-diary'} onClick={() => navigate('/class-diary')} />
                            <NavItem icon={Map} label="Alocação" active={path === '/allocation'} onClick={() => navigate('/allocation')} />
                            <NavItem icon={Cast} label="Eventos & Competições" active={path === '/gamified-events'} onClick={() => navigate('/gamified-events')} />
                            <NavItem icon={GraduationCap} label="Planos de Ensino" active={path === '/study-plans'} onClick={() => navigate('/study-plans')} />

                            <div className="px-4 pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gestão & BI</div>
                            <NavItem icon={BarChart} label="Analytics" active={path === '/analytics'} onClick={() => navigate('/analytics')} />
                            <NavItem icon={TrendingUp} label="Analytics Avançado & DL" active={path === '/advanced-analytics'} onClick={() => navigate('/advanced-analytics')} />
                            <NavItem icon={MessageCircle} label="Comunicação" active={path === '/communication'} onClick={() => navigate('/communication')} />
                            <NavItem icon={Users} label="Gestão de Rede" active={path.includes('/admin/gestao')} onClick={() => navigate('/admin/gestao')} />
                            <NavItem icon={Globe} label="Portal OCDE" active={path === '/oecd-portal'} onClick={() => navigate('/oecd-portal')} />

                            {canView('REPORTS') && (
                                <NavItem icon={Printer} label="Relatórios & BI" active={path === '/adm-relatorios'} onClick={() => navigate('/adm-relatorios')} />
                            )}

                            <NavItem icon={Stethoscope} label="Saúde Mental" active={path === '/neuro-screening'} onClick={() => navigate('/neuro-screening')} />
                            <NavItem icon={Gamepad2} label="Gestão Arcade Zone" active={path.includes('/admin/governanca')} onClick={() => navigate('/admin/governanca')} />
                            <NavItem icon={Tablet} label="App Tablet (Aplicação)" active={path.includes('/apps/tablet')} onClick={() => navigate('/apps/tablet')} />
                            <NavItem icon={Cast} label="Demo Live (Apresentação)" active={path.includes('/apps/demo')} onClick={() => navigate('/apps/demo')} />

                            {(canView('SCHEDULING') || canView('COMMAND_CENTER')) && (
                                <div className="px-4 pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sprint 0: Coordenação</div>
                            )}
                            {canView('SCHEDULING') && (
                                <NavItem icon={CalendarCheck} label="Agendamento de Provas" active={path === '/agendamento'} onClick={() => navigate('/agendamento')} />
                            )}
                            {canView('COMMAND_CENTER') && (
                                <NavItem icon={Activity} label="Central de Comando" active={path === '/central-comando'} onClick={() => navigate('/central-comando')} />
                            )}

                            {canManageCapabilities && (
                                <NavItem icon={Target} label="Governança Hierárquica" active={path === '/admin/capabilities'} onClick={() => navigate('/admin/capabilities')} />
                            )}

                            {(isSystemAdmin || (isMecAdmin && currentUser.role !== UserRole.SUPERVISOR)) && (
                                <NavItem icon={Shield} label="Auditoria & Logs" active={path === '/admin/audit'} onClick={() => navigate('/admin/audit')} />
                            )}
                            <NavItem icon={Shield} label="Gestão de Risco" active={path === '/risk-dashboard'} onClick={() => navigate('/risk-dashboard')} />
                        </>
                    )}

                    {isOperational && !isManagement && (
                        <>
                            <NavItem icon={PieChart} label="Minhas Turmas" active={path === '/dashboard'} onClick={() => navigate('/dashboard')} />
                            <NavItem icon={Calendar} label="Diário de Classe" active={path === '/class-diary'} onClick={() => navigate('/class-diary')} />

                            {/* Sprint 0 Features for Professors */}

                            {canView('COMMAND_CENTER') && (
                                <NavItem icon={Activity} label="Painel de Controle" active={path === '/central-comando'} onClick={() => navigate('/central-comando')} />
                            )}
                            {(canView('SCHEDULING') || canView('COMMAND_CENTER')) && (
                                <NavItem icon={Users} label="Conselho Digital (IA)" active={path === '/coordinator/council'} onClick={() => navigate('/coordinator/council')} />
                            )}

                            <NavItem icon={FileText} label="Banco de Questões" active={path.includes('/items')} onClick={() => navigate('/items')} />
                            <NavItem icon={BookOpen} label="Minhas Provas" active={path.includes('/exams')} onClick={() => navigate('/exams')} />
                            <NavItem icon={GraduationCap} label="Aplicação de Prova" active={path.includes('/online-exam')} onClick={() => navigate('/online-exam')} />
                            <NavItem icon={BarChart} label="Analytics" active={path === '/analytics'} onClick={() => navigate('/analytics')} />
                            <NavItem icon={GraduationCap} label="Planos de Ensino" active={path === '/study-plans'} onClick={() => navigate('/study-plans')} />

                            <div className="px-4 pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sprint 0: Coordenação</div>
                            <NavItem icon={CalendarCheck} label="Agendamento de Provas" active={path === '/agendamento'} onClick={() => navigate('/agendamento')} />
                            <NavItem icon={Activity} label="Central de Comando" active={path === '/central-comando'} onClick={() => navigate('/central-comando')} />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-[#1e3a8a] bg-[#0b1826]">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-rose-400 hover:bg-rose-900/20 border border-transparent rounded-lg transition font-medium">
                        <LogOut size={16} /> <span className={!sidebarOpen ? 'hidden' : ''}>Sair</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Menu size={20} className="text-slate-700" />
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
                                <p className="text-sm font-bold text-slate-800">{cleanDisplayName}</p>
                                <p className="text-xs text-slate-500">{currentUser.email}</p>
                            </div>
                            <button onClick={handleLogout} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group" title="Sair">
                                <LogOut size={18} className="text-slate-600 group-hover:text-rose-600 transition-colors" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
