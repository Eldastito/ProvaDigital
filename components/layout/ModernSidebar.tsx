import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, GraduationCap, Users, FileText,
    LogOut, Menu, ChevronRight, Tablet, PieChart, MessageCircle,
    Printer, Compass, Globe, PenTool, Target, UserCircle, Shield,
    Stethoscope, Map, Home, ChevronDown, Swords, Flame, Trophy,
    Cast, Calendar, Gamepad2, BarChart, Activity, CalendarCheck, Bot,
    Gamepad2 as Arcade,
    Sun, Moon
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { UserRole } from '../../types';

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
        className={`w-full group relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl mb-1 ${active
            ? 'bg-brand-primary/10 text-brand-primary'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
    >
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        </div>
        {!collapsed && <span className="truncate">{label}</span>}
        {active && (
            <div className="absolute left-0 w-1 h-6 bg-brand-primary rounded-r-full shadow-[0_0_8px_rgba(0,163,224,0.6)]" />
        )}
    </button>
);

export const ModernSidebar = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
    const { currentUser, toggleTheme, settings, setCurrentUser } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const handleLogout = () => {
        localStorage.clear();
        setCurrentUser(null);
        navigate('/login');
    };

    if (!currentUser) return null;

    const isStudent = currentUser.role === UserRole.ALUNO;
    const isProfessor = currentUser.role === UserRole.PROFESSOR;
    const isParent = currentUser.role === UserRole.PAIS;
    const isSystemAdmin = currentUser.role === UserRole.SYSTEM_ADMIN;
    const isMecAdmin = currentUser.role === UserRole.SUPER_ADMIN;

    const isManagement = isSystemAdmin || isMecAdmin ||
        currentUser.role === UserRole.STATE_ADMIN ||
        currentUser.role === UserRole.TENANT_ADMIN ||
        currentUser.role === UserRole.DIRETOR ||
        currentUser.role === UserRole.SUPERVISOR;

    return (
        <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-950 border-r border-white/5 flex-shrink-0 transition-all duration-500 flex flex-col relative z-50`}>
            {/* Logo Section */}
            <div className="h-20 flex items-center px-4 mb-4">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
                    <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 shrink-0">
                        <Flame size={20} fill="currentColor" />
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                            <h2 className="text-lg font-black text-white tracking-tighter uppercase">ExamePad</h2>
                            <p className="text-[8px] text-brand-primary font-black tracking-[0.2em] -mt-1 uppercase">Digital Evolution</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                <NavItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" active={currentPath === '/dashboard' || currentPath === '/'} onClick={() => navigate('/dashboard')} collapsed={collapsed} />

                {isStudent && (
                    <>
                        <NavItem icon={Target} label="Estudos" path="/study-plans" active={currentPath === '/study-plans'} onClick={() => navigate('/study-plans')} collapsed={collapsed} />
                        <NavItem icon={Arcade} label="Arcade" path="/aluno/arcade" active={currentPath === '/aluno/arcade'} onClick={() => navigate('/aluno/arcade')} collapsed={collapsed} />
                        <NavItem icon={Bot} label="Corujão AI" path="/aluno/tutor" active={currentPath === '/aluno/tutor'} onClick={() => navigate('/aluno/tutor')} collapsed={collapsed} />
                        <NavItem icon={Compass} label="Bússola" path="/aluno/bussola" active={currentPath === '/aluno/bussola'} onClick={() => navigate('/aluno/bussola')} collapsed={collapsed} />
                    </>
                )}

                {isManagement && (
                    <>
                        <div className={`px-4 pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${collapsed ? 'hidden' : ''}`}>Acadêmico</div>
                        <NavItem icon={FileText} label="Itens" path="/items" active={currentPath.includes('/items')} onClick={() => navigate('/items')} collapsed={collapsed} />
                        <NavItem icon={BookOpen} label="Provas" path="/exams" active={currentPath.includes('/exams')} onClick={() => navigate('/exams')} collapsed={collapsed} />
                        <NavItem icon={BarChart} label="Analytics" path="/analytics" active={currentPath === '/analytics'} onClick={() => navigate('/analytics')} collapsed={collapsed} />
                        <NavItem icon={Shield} label="Risco" path="/risk-dashboard" active={currentPath === '/risk-dashboard'} onClick={() => navigate('/risk-dashboard')} collapsed={collapsed} />
                    </>
                )}

                {isProfessor && !isManagement && (
                    <>
                        <NavItem icon={Calendar} label="Diário" path="/class-diary" active={currentPath === '/class-diary'} onClick={() => navigate('/class-diary')} collapsed={collapsed} />
                        <NavItem icon={FileText} label="Questões" path="/items" active={currentPath.includes('/items')} onClick={() => navigate('/items')} collapsed={collapsed} />
                        <NavItem icon={BookOpen} label="Minhas Provas" path="/exams" active={currentPath.includes('/exams')} onClick={() => navigate('/exams')} collapsed={collapsed} />
                    </>
                )}

                <div className="my-4 border-t border-white/5 mx-2" />
                <NavItem icon={UserCircle} label="Perfil" path="/my-profile" active={currentPath === '/my-profile'} onClick={() => navigate('/my-profile')} collapsed={collapsed} />
            </div>

            {/* Bottom Actions */}
            <div className="p-4 space-y-2">
                <button
                    onClick={toggleTheme}
                    className="w-full h-10 flex items-center justify-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all overflow-hidden"
                >
                    {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    {!collapsed && <span className="text-xs font-bold uppercase tracking-wider">{settings.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full h-10 flex items-center justify-center gap-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all overflow-hidden"
                >
                    <LogOut size={18} />
                    {!collapsed && <span className="text-xs font-bold uppercase tracking-wider">Sair</span>}
                </button>
            </div>
        </aside>
    );
};
