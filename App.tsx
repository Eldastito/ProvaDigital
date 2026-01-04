
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { UserRole } from './types';
import { useAppStore } from './store/useAppStore';
import { checkConnection, supabase } from './services/supabaseClient';
import { LoginPage } from './components/Auth/LoginPage';

// Infrastructure
import { Layout } from './components/Layout';
import { ViewRouter } from './components/ViewRouter';
import { PrivacyPolicyModal } from './components/Legal/PrivacyPolicyModal';

// Tablet Apps
import { TabletLauncher } from './components/TabletApp/TabletLauncher';
import { CoordinatorApp } from './components/TabletApp/CoordinatorApp';
import { ProfessorApp } from './components/TabletApp/ProfessorApp';
import { StudentApp } from './components/TabletApp/StudentApp';

// Demo
import { LiveDemoLobby } from './components/Demo/LiveDemoLobby';
import { ProfileSwitcher } from './components/ProfileSwitcher';

export default function App() {
  const store = useAppStore();
  const { currentUser, setCurrentUser, users, setSelectedChildId, loadRemoteData, isInitialized } = store;

  // Global View State
  const [view, setView] = useState('LOGIN');
  const [tabletPayload, setTabletPayload] = useState<any>(null);

  // Specific Context State
  const [selectedExamIdForPrint, setSelectedExamIdForPrint] = useState<string | null>(null);
  const [selectedExamIdForResults, setSelectedExamIdForResults] = useState<string | null>(null);

  // --- 1. INIT & DATA LOADING ---
  useEffect(() => {
    // 0. Check LGPD Consent
    const storedConsent = localStorage.getItem('lgpd_consent');
    if (storedConsent === 'true') {
      store.setHasConsented(true);
    }

    // 1. Check & Load Data (Async)
    checkConnection().then(connected => {
      if (connected) {
        loadRemoteData();
      } else {
        // If offline or error, we still need to set initialized to allow app to function (e.g. tablet mode)
        useAppStore.setState({ isInitialized: true });
      }
    });
  }, []); // Run once on mount

  // --- 2. AUTH LISTENER (SAFE) ---
  // Only subscribe to auth changes AFTER data is initialized to avoid race conditions
  useEffect(() => {
    if (!isInitialized) return;

    console.log('🔌 Iniciando conexão com Supabase...');

    // Unified Auth Handler
    const handleAuthUser = async (sessionUser: any) => {
      console.log('✅ User authenticated:', sessionUser.email);

      let userMatch = users.find(u => u.email === sessionUser.email);

      if (userMatch) {
        console.log('👤 User found in store:', userMatch.name);

        // 🧪 Check for Test Profile
        const testProfile = localStorage.getItem('test_profile');
        const testProfileLocked = sessionStorage.getItem('test_profile_locked');

        if (testProfile && !testProfileLocked) {
          userMatch = { ...userMatch, role: testProfile as UserRole };
          if (testProfile === 'PAIS') userMatch = { ...userMatch, childrenIds: ['st_muni', 'st_state', 'st_fed', 'st_priv'] };
          sessionStorage.setItem('test_profile_locked', 'true');
        } else if (testProfileLocked && testProfile) {
          userMatch = { ...userMatch, role: testProfile as UserRole };
          if (testProfile === 'PAIS') userMatch = { ...userMatch, childrenIds: ['st_muni', 'st_state', 'st_fed', 'st_priv'] };
        }

        setCurrentUser(userMatch);
        if (userMatch.role === UserRole.ALUNO) setView('STUDENT_PORTAL');
        else setView('DASHBOARD');
      } else {
        // Fallback for new users
        console.warn("⚠️ User not found in store. Creating temp profile...");
        const newUser: any = {
          id: sessionUser.id,
          name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Novo Usuário',
          email: sessionUser.email!,
          role: UserRole.TENANT_ADMIN,
          tenantId: 't1',
          schoolId: 's1'
        };
        setCurrentUser(newUser);
        setView('DASHBOARD');
      }
    };

    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleAuthUser(session.user);
    });

    // 2. Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth Event:', event);
      if (event === 'SIGNED_IN' && session?.user) {
        handleAuthUser(session.user);
      }
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setCurrentUser(null);
        setView('LOGIN');
      }
    });

    return () => subscription.unsubscribe();
  }, [isInitialized, users, setCurrentUser]); // Depend on isInitialized

  // ... (Demo Mode Logic Remains) ...

  const handleLogin = (userId: string) => {
    // Legacy Handler (Mantido para compatibilidade se necessário, mas não usado na UI nova)
  };

  // --- 0. LOADING SCREEN ---
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0f172a] flex-col gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando sistema...</p>
      </div>
    );
  }

  // --- 1. LOGIN VIEW ---
  if (!currentUser && view === 'LOGIN') {
    return <LoginPage />;
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

      {/* LGPD Compliance Modal - Blocks usage until accepted */}
      {!store.hasConsented && (
        <PrivacyPolicyModal
          onAccept={() => {
            store.setHasConsented(true);
            localStorage.setItem('lgpd_consent', 'true');
          }}
          onReject={() => {
            alert("O aceite da Política de Privacidade é obrigatório para utilizar a plataforma.");
          }}
        />
      )}
    </Layout>
  );
}
