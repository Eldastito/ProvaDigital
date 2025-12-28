
import React, { useState } from 'react';
import { 
  LayoutDashboard, BookOpen, GraduationCap, Users, FileText, 
  LogOut, Menu, ChevronRight, Tablet, Shield, Trophy, Cast, UserCircle, Stethoscope, Route, MessageCircle, Bot, Zap
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { UserRole, Tenant, Student, School } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { useQuery } from '@tanstack/react-query';
import { fetchTenants, fetchStudents, fetchSchools } from '../services/supabaseClient';

interface LayoutProps {
  children?: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
}

const NavItem = ({ icon: Icon, label, active, onClick, badge, visible = true }: any) => {
  if (!visible) return null;
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-bold transition-all border-l-4 ${
        active 
        ? 'bg-indigo-600/10 text-indigo-700 border-indigo-600' 
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-600 border-transparent'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-indigo-600' : ''} />
      <span className="flex-1 text-left">{label}</span>
      {badge && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
};

export const Layout = ({ children, currentView, setView }: LayoutProps) => {
  const { currentUser, setCurrentUser } = useAppStore();
  const { canView } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isParent = currentUser?.role === UserRole.PAIS;
  const isStudent = currentUser?.role === UserRole.ALUNO;
  const isStaff = currentUser?.role !== UserRole.ALUNO && currentUser?.role !== UserRole.PAIS;
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  if (!currentUser) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} sidebar-dark flex-shrink-0 transition-all duration-300 flex flex-col z-40 relative shadow-2xl overflow-hidden`}>
        <div className="h-20 flex items-center px-6 gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">EP</div>
          <div className={`${!sidebarOpen && 'hidden'} transition-all`}>
            <h2 className="text-xl font-black tracking-tight text-white leading-none">ExamePad</h2>
            <p className="text-[8px] font-black uppercase text-indigo-400 tracking-widest mt-1">SaaS Educacional</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
          <div className="px-6 mb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Geral</div>
          <NavItem icon={LayoutDashboard} label="Painel Inicial" active={currentView === 'DASHBOARD' || currentView === 'STUDENT_PORTAL'} onClick={() => setView(isStudent || isParent ? 'STUDENT_PORTAL' : 'DASHBOARD')} />
          <NavItem icon={Stethoscope} label="Triagem Clínica" active={currentView === 'NEURO_SCREENING'} onClick={() => setView('NEURO_SCREENING')} visible={canView('NEURO_SCREENING')} />

          <div className="px-6 pt-6 mb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Aprendizagem</div>
          <NavItem icon={Route} label="Trilha de Estudos" active={currentView === 'LEARNING_PATH'} onClick={() => setView('LEARNING_PATH')} visible={isStudent || isParent} />
          <NavItem icon={Bot} label="Corujão IA" active={currentView === 'OWL_TUTOR'} onClick={() => setView('OWL_TUTOR')} visible={isStudent || isParent} />
          <NavItem icon={Trophy} label="Eventos Gamificados" active={currentView === 'GAMIFIED_EVENTS'} onClick={() => setView('GAMIFIED_EVENTS')} />

          {isStaff && (
            <>
              <div className="px-6 pt-6 mb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Gestão Escolar</div>
              <NavItem icon={BookOpen} label="Banco de Itens" active={currentView === 'ITEMS'} onClick={() => setView('ITEMS')} visible={canView('ITEM_BANK')} />
              <NavItem icon={FileText} label="Provas Digitais" active={currentView === 'EXAMS'} onClick={() => setView('EXAMS')} visible={canView('EXAM_MGMT')} />
              <NavItem icon={Tablet} label="Logística Offline" active={currentView === 'ALLOCATION'} onClick={() => setView('ALLOCATION')} visible={canView('OFFLINE_OPS')} />
              <NavItem icon={Users} label="Unidades & Turmas" active={currentView === 'MANAGEMENT'} onClick={() => setView('MANAGEMENT')} visible={canView('SCHOOL_DATA')} />
              <NavItem icon={Shield} label="Governança" active={currentView === 'CAPABILITIES'} onClick={() => setView('CAPABILITIES')} visible={canView('GOVERNANCE')} />
            </>
          )}

          {isSuperAdmin && (
             <>
               <div className="px-6 pt-6 mb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Apresentação</div>
               <NavItem icon={Cast} label="Demo Live" active={currentView === 'LIVE_DEMO'} onClick={() => setView('LIVE_DEMO')} />
             </>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => { setCurrentUser(null); setView('LOGIN'); }} className="w-full flex items-center gap-2 p-3 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-bold">
            <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{currentView.replace('_', ' ')}</h2>
          </div>
          <button onClick={() => setView('MY_PROFILE')} className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg">
                <UserCircle size={28} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#f8fafc]">
           <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
