
import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, GraduationCap, Users, FileText,
  LogOut, Menu, ChevronRight, Tablet, PieChart, MessageCircle, Bot, Target, UserCircle, Shield, Stethoscope, Map, Home, ChevronDown, Swords, Flame, Trophy, Cast, Calendar
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { UserRole, TenantType } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { Badge } from './ui/Badge';
import { ProfileSwitcher } from './ProfileSwitcher';

interface LayoutProps {
  children?: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
}

const NavItem = ({ icon: Icon, label, target, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-4 ${active
      ? 'bg-[#162a42] text-white border-brand-secondary'
      : 'text-slate-400 hover:bg-[#112336] hover:text-white border-transparent'
      }`}
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

export const Layout = ({ children, currentView, setView }: LayoutProps) => {
  const { currentUser, setCurrentUser, tenants, students, schools, selectedChildId, setSelectedChildId } = useAppStore();
  const { canView } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [childMenuOpen, setChildMenuOpen] = useState(true);

  if (!currentUser) return null;

  const handleLogout = () => {
    setCurrentUser(null);
    setView('LOGIN');
  };

  const isStudent = currentUser.role === UserRole.ALUNO;
  const isParent = currentUser.role === UserRole.PAIS;
  const isStateAdmin = currentUser.role === UserRole.STATE_ADMIN;
  const isTenantAdmin = currentUser.role === UserRole.TENANT_ADMIN;
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  // Lógica de Visibilidade Baseada em Perfil
  const isStrategic = isStateAdmin || isTenantAdmin;
  const isOperational = currentUser.role === UserRole.PROFESSOR || currentUser.role === UserRole.SUPERVISOR;
  const isManagement = currentUser.role === UserRole.DIRETOR || isStrategic || currentUser.role === UserRole.SUPER_ADMIN;

  const canManageCapabilities = currentUser.role === UserRole.SUPER_ADMIN || isStrategic || currentUser.role === UserRole.DIRETOR;

  // Nome do Tenant no Header
  let tenantName = tenants.find(t => t.id === currentUser.tenantId)?.name || 'Tenant';
  if (isParent && selectedChildId) {
    const child = students.find(s => s.id === selectedChildId);
    if (child) {
      tenantName = tenants.find(t => t.id === child.tenantId)?.name || tenantName;
    }
  }

  const myChildren = isParent && currentUser.childrenIds
    ? students.filter(s => currentUser.childrenIds?.includes(s.id))
    : [];

  const currentChild = myChildren.find(c => c.id === selectedChildId) || myChildren[0];
  const cleanDisplayName = currentUser.name.replace(/\s*\(.*?\)\s*/g, '').trim();

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-brand-dark border-r border-[#1e3a8a] flex-shrink-0 transition-all duration-300 flex flex-col shadow-xl`}>
        <div className="h-20 border-b border-[#1e3a8a] flex items-center justify-center gap-3 overflow-hidden px-4">
          <div className="w-8 h-8 bg-brand-secondary rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-brand-secondary/20">E</div>
          <div className={`${!sidebarOpen && 'opacity-0'} transition-opacity duration-200`}>
            <h2 className="text-xl font-bold text-white tracking-tight">ExamePad</h2>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-1">

          {!isStrategic && <NavItem icon={UserCircle} label="Meu Perfil" target="MY_PROFILE" active={currentView === 'MY_PROFILE'} onClick={() => setView('MY_PROFILE')} />}

          {isParent && myChildren.length > 0 && (
            <div className="mb-4 px-2">
              <div className="bg-[#162a42] rounded-lg overflow-hidden border border-[#1e3a8a]">
                <button
                  onClick={() => setChildMenuOpen(!childMenuOpen)}
                  className="w-full p-3 flex items-center justify-between text-xs font-bold text-brand-secondary uppercase"
                >
                  <span>Aluno Selecionado</span>
                  <ChevronDown size={14} className={`transition-transform ${childMenuOpen ? 'rotate-180' : ''}`} />
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
                          className={`w-full text-left px-4 py-3 text-sm flex flex-col gap-1 hover:bg-white/5 transition border-l-2 ${selectedChildId === child.id ? 'border-brand-secondary bg-white/10' : 'border-transparent'}`}
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
              <NavItem icon={LayoutDashboard} label="Desempenho" target="STUDENT_PORTAL" active={currentView === 'STUDENT_PORTAL'} onClick={() => setView('STUDENT_PORTAL')} />
              <NavItem icon={MessageCircle} label="Comunicação" target="COMMUNICATION" active={currentView === 'COMMUNICATION'} onClick={() => setView('COMMUNICATION')} />
              <NavItem icon={Target} label="Plano de Estudos" target="STUDY_PLANS" active={currentView === 'STUDY_PLANS'} onClick={() => setView('STUDY_PLANS')} />
              {canView('NEURO_SCREENING') && (
                <NavItem icon={Stethoscope} label="Triagem Neuro." target="NEURO_SCREENING" active={currentView === 'NEURO_SCREENING'} onClick={() => setView('NEURO_SCREENING')} />
              )}
            </>
          )}

          {isStudent && (
            <>
              <NavItem icon={LayoutDashboard} label="Meu Desempenho" target="STUDENT_PORTAL" active={currentView === 'STUDENT_PORTAL'} onClick={() => setView('STUDENT_PORTAL')} />
              <NavItem icon={Target} label="Plano de Estudos" target="STUDY_PLANS" active={currentView === 'STUDY_PLANS'} onClick={() => setView('STUDY_PLANS')} />
              <div className="px-4 pt-6 pb-2 text-[11px] font-bold text-[#48cae4] uppercase tracking-wider opacity-70">Gamificação</div>
              <NavItem icon={Swords} label="Desafio de Turma" target="BATTLE_ARENA" active={currentView === 'BATTLE_ARENA'} onClick={() => setView('BATTLE_ARENA')} />
              <NavItem icon={Flame} label="Modo Sobrevivência" target="SURVIVAL_MODE" active={currentView === 'SURVIVAL_MODE'} onClick={() => setView('SURVIVAL_MODE')} />
              <div className="px-4 pt-6 pb-2 text-[11px] font-bold text-[#48cae4] uppercase tracking-wider opacity-70">Assistente</div>
              <NavItem icon={Bot} label="Corujão Tutor" target="OWL_TUTOR" active={currentView === 'OWL_TUTOR'} onClick={() => setView('OWL_TUTOR')} />
              <NavItem icon={MessageCircle} label="Mensagens" target="COMMUNICATION" active={currentView === 'COMMUNICATION'} onClick={() => setView('COMMUNICATION')} />
            </>
          )}

          {!isStudent && !isParent && (
            <>
              {isStrategic ? (
                <NavItem icon={Map} label="Visão Estratégica" target="DASHBOARD" active={currentView === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
              ) : (
                <NavItem icon={LayoutDashboard} label="Visão Geral" target="DASHBOARD" active={currentView === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
              )}

              {!isStrategic && (
                <>
                  <div className="px-4 pt-6 pb-2 text-[11px] font-bold text-[#48cae4] uppercase tracking-wider opacity-70">Acadêmico</div>
                  {canView('ITEM_BANK') && <NavItem icon={BookOpen} label="Banco de Itens" target="ITEMS" active={currentView === 'ITEMS' || currentView === 'ITEM_NEW'} onClick={() => setView('ITEMS')} />}
                  {canView('EXAM_MGMT') && <NavItem icon={FileText} label="Provas" target="EXAMS" active={currentView === 'EXAMS' || currentView === 'EXAM_NEW' || currentView === 'RESULTS_ENTRY'} onClick={() => setView('EXAMS')} />}
                  {canView('EXAM_MGMT') && <NavItem icon={Calendar} label="Diário de Classe" target="CLASS_DIARY" active={currentView === 'CLASS_DIARY'} onClick={() => setView('CLASS_DIARY')} />}
                  {canView('EXAM_MGMT') && <NavItem icon={Users} label="Alocação" target="ALLOCATION" active={currentView === 'ALLOCATION'} onClick={() => setView('ALLOCATION')} />}
                  {canView('GAMIFIED_EVENTS') && <NavItem icon={Trophy} label="Eventos & Competições" target="GAMIFIED_EVENTS" active={currentView === 'GAMIFIED_EVENTS'} onClick={() => setView('GAMIFIED_EVENTS')} />}
                  <NavItem icon={Target} label="Planos de Ensino" target="STUDY_PLANS" active={currentView === 'STUDY_PLANS'} onClick={() => setView('STUDY_PLANS')} />
                </>
              )}

              <div className="px-4 pt-6 pb-2 text-[11px] font-bold text-[#48cae4] uppercase tracking-wider opacity-70">Gestão & BI</div>

              {canView('ANALYTICS') && <NavItem icon={PieChart} label="Analytics" target="ANALYTICS" active={currentView === 'ANALYTICS'} onClick={() => setView('ANALYTICS')} />}
              {canView('COMMUNICATION') && <NavItem icon={MessageCircle} label="Comunicação" target="COMMUNICATION" active={currentView === 'COMMUNICATION'} onClick={() => setView('COMMUNICATION')} />}

              {isManagement && (
                <NavItem icon={GraduationCap} label="Gestão de Rede" target="MANAGEMENT" active={currentView === 'MANAGEMENT'} onClick={() => setView('MANAGEMENT')} />
              )}

              {canView('NEURO_SCREENING') && (
                <NavItem icon={Stethoscope} label="Saúde Mental" target="NEURO_SCREENING" active={currentView === 'NEURO_SCREENING'} onClick={() => setView('NEURO_SCREENING')} />
              )}

              {canManageCapabilities && (
                <NavItem icon={Shield} label="Governança" target="CAPABILITIES" active={currentView === 'CAPABILITIES'} onClick={() => setView('CAPABILITIES')} />
              )}

              {!isStrategic && canView('OFFLINE_OPS') && (
                <>
                  <div className="px-4 pt-6 pb-2 text-[11px] font-bold text-[#48cae4] uppercase tracking-wider opacity-70">Dispositivos</div>
                  <button onClick={() => setView('TABLET_LAUNCHER')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-[#112336] hover:text-emerald-300 border-l-4 border-transparent transition-all">
                    <Tablet size={20} strokeWidth={2} /> App Tablet
                  </button>
                </>
              )}

              {/* DEMO MODE BUTTON (For Presentation) */}
              {(isSuperAdmin || isTenantAdmin) && (
                <button onClick={() => setView('LIVE_DEMO')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-yellow-400 hover:bg-[#112336] hover:text-yellow-300 border-l-4 border-transparent transition-all animate-pulse">
                  <Cast size={20} strokeWidth={2} /> MODO DEMO LIVE
                </button>
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-[#1e3a8a] bg-[#0b1826]">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-rose-400 hover:bg-rose-900/20 border border-transparent rounded-lg transition font-medium">
            <LogOut size={16} /> <span className={!sidebarOpen ? 'hidden' : ''}>Sair</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER */}
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
            {/* Profile Switcher for Testing */}
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
          {children}
        </main>
      </div >
    </div >
  );
};
