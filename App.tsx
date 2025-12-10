
import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { UserRole } from './types';
import { useAppStore } from './store/useAppStore';

// Infrastructure
import { Layout } from './components/Layout';
import { ViewRouter } from './components/ViewRouter';

// Tablet Apps
import { TabletLauncher } from './components/TabletApp/TabletLauncher';
import { CoordinatorApp } from './components/TabletApp/CoordinatorApp';
import { ProfessorApp } from './components/TabletApp/ProfessorApp';
import { StudentApp } from './components/TabletApp/StudentApp';

// Demo
import { LiveDemoLobby } from './components/Demo/LiveDemoLobby';

export default function App() {
  const store = useAppStore();
  const { currentUser, setCurrentUser, users, setSelectedChildId } = store;

  // Global View State
  const [view, setView] = useState('LOGIN');
  const [tabletPayload, setTabletPayload] = useState<any>(null);
  
  // Specific Context State
  const [selectedExamIdForPrint, setSelectedExamIdForPrint] = useState<string | null>(null);
  const [selectedExamIdForResults, setSelectedExamIdForResults] = useState<string | null>(null);

  // DEMO MODE: Check URL params on mount
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const isMobileMode = params.get('mode') === 'mobile';
      const demoRole = params.get('role');

      if (isMobileMode) {
          // Auto-login as a generic user based on role to bypass login screen for audience
          if (demoRole === 'STUDENT') {
              const studentUser = users.find(u => u.role === UserRole.ALUNO);
              if (studentUser) setCurrentUser(studentUser);
              setView('TABLET_STUDENT');
          } else if (demoRole === 'PROFESSOR') {
              const profUser = users.find(u => u.role === UserRole.PROFESSOR);
              if (profUser) setCurrentUser(profUser);
              setView('TABLET_PROF');
          } else if (demoRole === 'COORDINATOR') {
              const coordUser = users.find(u => u.role === UserRole.SUPERVISOR);
              if (coordUser) setCurrentUser(coordUser);
              setView('TABLET_COORD');
          } else {
              // Default launcher
              setView('TABLET_LAUNCHER');
          }
      }
  }, [users, setCurrentUser]);

  const handleLogin = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === UserRole.ALUNO) {
          setView('STUDENT_PORTAL');
      } else if (user.role === UserRole.PAIS) {
          // Auto-select first child
          if (user.childrenIds && user.childrenIds.length > 0) {
              setSelectedChildId(user.childrenIds[0]);
          }
          setView('STUDENT_PORTAL');
      } else {
          setView('DASHBOARD');
      }
    }
  };

  // --- 1. LOGIN VIEW ---
  if (!currentUser && view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-brand-secondary">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-dark">ExamePad</h1>
            <p className="text-brand-primary text-sm">Plataforma Educacional</p>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <button 
                key={u.id} 
                onClick={() => handleLogin(u.id)} 
                className="w-full flex items-center p-3 border rounded-lg hover:bg-brand-light group transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold mr-3 text-brand-primary group-hover:bg-white group-hover:shadow-sm">
                  {u.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-800">{u.name}</div>
                  <div className="text-xs text-slate-500 uppercase">{u.role}</div>
                </div>
                <ChevronRight className="ml-auto text-slate-300 group-hover:text-brand-primary" size={18}/>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- 2. OFFLINE / TABLET ECOSYSTEM ---
  const handleCoordinatorSyncUp = (events: any[]) => {
      alert("Simulação: Dados sincronizados com sucesso para a nuvem SaaS.");
      console.log("Synced Events:", events);
  };

  if (view === 'TABLET_LAUNCHER') {
    return <TabletLauncher 
      state={store}
      onBack={() => setView('DASHBOARD')} 
      onSelectApp={(app, payload) => { 
        setTabletPayload(payload);
        if (app === 'COORDINATOR') setView('TABLET_COORD'); 
        if (app === 'PROFESSOR') setView('TABLET_PROF'); 
        if (app === 'STUDENT') setView('TABLET_STUDENT'); 
      }} 
    />;
  }
  if (view === 'TABLET_COORD') return <CoordinatorApp state={store} initialPayload={tabletPayload} onBack={() => setView('TABLET_LAUNCHER')} onSyncUp={handleCoordinatorSyncUp} />;
  if (view === 'TABLET_PROF') return <ProfessorApp state={store} onBack={() => setView('TABLET_LAUNCHER')} />;
  if (view === 'TABLET_STUDENT') return <StudentApp state={store} onBack={() => setView('TABLET_LAUNCHER')} />;

  // --- 3. DEMO LOBBY (PRESENTATION MODE) ---
  if (view === 'LIVE_DEMO') {
      return <LiveDemoLobby onClose={() => setView('DASHBOARD')} />;
  }

  // --- 4. MAIN SAAS APP (DESKTOP LAYOUT) ---
  const handlePrintExam = (examId: string) => { setSelectedExamIdForPrint(examId); setView('PRINT_PREVIEW'); };
  const handleGradeExam = (examId: string) => { setSelectedExamIdForResults(examId); setView('RESULTS_ENTRY'); };

  if (view === 'PRINT_PREVIEW') {
     return <ViewRouter 
        view={view} 
        setView={setView} 
        selectedExamIdForPrint={selectedExamIdForPrint} 
        selectedExamIdForResults={null}
        onPrintExam={handlePrintExam}
        onGradeExam={handleGradeExam}
     />;
  }

  return (
    <Layout currentView={view} setView={setView}>
      <ViewRouter 
        view={view} 
        setView={setView} 
        selectedExamIdForPrint={selectedExamIdForPrint}
        selectedExamIdForResults={selectedExamIdForResults}
        onPrintExam={handlePrintExam}
        onGradeExam={handleGradeExam}
     />
    </Layout>
  );
}
