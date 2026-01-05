
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
  const { currentUser, setCurrentUser, users, loadRemoteData, isInitialized } = store;
  const navigate = useNavigate();

  // Specific Context State (Keep for now, move to URL later)
  const [selectedExamIdForPrint, setSelectedExamIdForPrint] = useState<string | null>(null);
  const [selectedExamIdForResults, setSelectedExamIdForResults] = useState<string | null>(null);

  // --- 1. INIT & DATA LOADING ---
  useEffect(() => {
    const storedConsent = localStorage.getItem('lgpd_consent');
    if (storedConsent === 'true') store.setHasConsented(true);

    checkConnection().then(connected => {
      if (connected) loadRemoteData();
      else useAppStore.setState({ isInitialized: true });
    });
  }, []);

  // --- 2. AUTH LISTENER ---
  useEffect(() => {
    if (!isInitialized) return;

    const handleAuthUser = async (sessionUser: any) => {
      let userMatch = users.find(u => u.email === sessionUser.email);

      if (userMatch) {
        // Test Profile Logic
        const testProfile = localStorage.getItem('test_profile');
        const testProfileLocked = sessionStorage.getItem('test_profile_locked');
        if (testProfile && (!testProfileLocked || testProfileLocked)) {
          userMatch = { ...userMatch, role: testProfile as UserRole };
          if (testProfile === 'PAIS') userMatch = { ...userMatch, childrenIds: ['st_muni', 'st_state', 'st_fed', 'st_priv'] };
          sessionStorage.setItem('test_profile_locked', 'true');
        }
        setCurrentUser(userMatch);

        // Redirect Logic
        if (window.location.pathname === '/' || window.location.pathname === '/login') {
          if (userMatch.role === UserRole.ALUNO) navigate('/aluno');
          else navigate('/dashboard');
        }
      } else {
        // Fallback
        const newUser: any = {
          id: sessionUser.id,
          name: sessionUser.user_metadata?.full_name || 'Novo Usuário',
          email: sessionUser.email!,
          role: UserRole.TENANT_ADMIN,
          tenantId: 't1', schoolId: 's1'
        };
        setCurrentUser(newUser);
        navigate('/dashboard');
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleAuthUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) handleAuthUser(session.user);
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [isInitialized, users, setCurrentUser, navigate]);

  // --- LOADING SCREEN ---
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0f172a] flex-col gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Carregando sistema...</p>
      </div>
    );
  }

  // --- HANDLERS (Adapters for Legacy ViewRouter) ---
  const handleSetView = (viewName: string) => {
    // Map legacy view names to routes
    const routeMap: Record<string, string> = {
      'LOGIN': '/login',
      'DASHBOARD': '/dashboard',
      'STUDENT_PORTAL': '/aluno',
      'ITEMS': '/itens',
      'ITEM_NEW': '/itens/novo',
      'EXAMS': '/provas',
      'EXAM_NEW': '/provas/nova',
      'ALLOCATION': '/allocation',
      'MANAGEMENT': '/admin/gestao',
      'GOVERNANCE': '/admin/governanca',
      'CAPABILITIES': '/capabilities',
      'NEURO_SCREENING': '/neuro-screening',
      'CLASS_DIARY': '/class-diary',
      'GAMIFIED_EVENTS': '/gamified-events',
      'RISK_DASHBOARD': '/risk-dashboard',
      'STUDY_PLANS': '/study-plans',
      'BATTLE_ARENA': '/battle-arena',
      'SURVIVAL_MODE': '/survival-mode',
      'ARCADE': '/arcade',
      'AVATAR_SHOP': '/shop',
      'MY_PROFILE': '/my-profile',
      'COMMUNICATION': '/communication'
    };
    const path = routeMap[viewName];
    if (path) navigate(path);
    else console.warn("Rota não mapeada para view:", viewName);
  };

  const currentPath = window.location.pathname; // Helper for Layout

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes Wrapper */}
        <Route path="/" element={
          currentUser ? (
            <Layout currentView={currentPath} setView={handleSetView}>
              <ViewRouterWrapper
                store={store}
                setView={handleSetView}
                printId={selectedExamIdForPrint}
                resultId={selectedExamIdForResults}
                setPrintId={setSelectedExamIdForPrint}
                setResultId={setSelectedExamIdForResults}
              />
            </Layout>
          ) : <Navigate to="/login" />
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<div />} /> {/* Rendered by ViewRouterWrapper for now */}
          <Route path="aluno/*" element={<div />} />
          <Route path="itens/*" element={<div />} />
          <Route path="provas/*" element={<div />} />
          <Route path="admin/*" element={<div />} />
          <Route path="*" element={<div />} /> {/* Catch all for ViewRouter */}
        </Route>
      </Routes>

      {!store.hasConsented && (
        <PrivacyPolicyModal
          onAccept={() => { store.setHasConsented(true); localStorage.setItem('lgpd_consent', 'true'); }}
          onReject={() => alert("O aceite é obrigatório.")}
        />
      )}
    </>
  );
}

// --- ADAPTER COMPONENT ---
// This bridges the URL path back to the String expected by ViewRouter
// allowing us to keep all the ViewRouter logic for now.
const ViewRouterWrapper = ({ store, setView, printId, resultId, setPrintId, setResultId }: any) => {
  const { pathname } = window.location;
  let view = 'DASHBOARD'; // Default

  // Order matters! Check specific sub-paths first
  if (pathname.includes('/itens/novo')) view = 'ITEM_NEW';
  else if (pathname.includes('/itens')) view = 'ITEMS';
  else if (pathname.includes('/provas/nova')) view = 'EXAM_NEW';
  else if (pathname.includes('/provas')) view = 'EXAMS';
  else if (pathname.includes('/admin/gestao')) view = 'MANAGEMENT';
  else if (pathname.includes('/admin/governanca')) view = 'GOVERNANCE';
  else if (pathname.includes('/aluno')) view = 'STUDENT_PORTAL';
  else if (pathname.includes('/allocation')) view = 'ALLOCATION';
  else if (pathname.includes('/capabilities')) view = 'CAPABILITIES';
  else if (pathname.includes('/neuro-screening')) view = 'NEURO_SCREENING';
  else if (pathname.includes('/class-diary')) view = 'CLASS_DIARY';
  else if (pathname.includes('/gamified-events')) view = 'GAMIFIED_EVENTS';
  else if (pathname.includes('/risk-dashboard')) view = 'RISK_MANAGEMENT';
  else if (pathname.includes('/analytics')) view = 'ANALYTICS';
  else if (pathname.includes('/teaching-plans')) view = 'STUDY_PLANS';
  else if (pathname.includes('/study-plans')) view = 'STUDY_PLANS';
  else if (pathname.includes('/battle-arena')) view = 'BATTLE_ARENA';
  else if (pathname.includes('/survival-mode')) view = 'SURVIVAL_MODE';
  else if (pathname.includes('/arcade')) view = 'ARCADE';
  else if (pathname.includes('/shop')) view = 'AVATAR_SHOP';
  else if (pathname.includes('/my-profile')) view = 'MY_PROFILE';
  else if (pathname.includes('/communication')) view = 'COMMUNICATION';

  // Handlers
  const onPrintExam = (id: string) => { setPrintId(id); /* Need Route for Print */ };
  const onGradeExam = (id: string) => { setResultId(id); /* Need Route for Grade */ };

  return <ViewRouter
    view={view}
    setView={setView}
    selectedExamIdForPrint={printId}
    selectedExamIdForResults={resultId}
    onPrintExam={onPrintExam}
    onGradeExam={onGradeExam}
  />;
};
