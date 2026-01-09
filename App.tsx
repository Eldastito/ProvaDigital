
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { UserRole } from './types';
import { useAppStore } from './store/useAppStore';
import { checkConnection, supabase } from './services/supabaseClient';
import { LoginPage } from './components/Auth/LoginPage';

// Infrastructure
import { Layout } from './components/Layout';
import { PrivacyPolicyModal } from './components/Legal/PrivacyPolicyModal';

// Views Imports
import { DashboardView } from './components/DashboardView';
import { ItemsListView } from './components/ItemsListView';
import { ItemEditorView } from './components/ItemEditorView';
import { ExamsListView } from './components/ExamsListView';
import { ExamBuilderView } from './components/ExamBuilderView';
import { AllocationView } from './components/AllocationView';
import { ManagementView } from './components/ManagementView';
import { PrintableExamView } from './components/PrintableExamView';
import { ResultsEntryView } from './components/ResultsEntryView';
import { StudentDashboardView } from './components/StudentPortal/StudentDashboardView';
import { OwlTutorView } from './components/StudentPortal/OwlTutorView';
import { SchoolDashboardView } from './components/Analytics/SchoolDashboardView';
import { CommunicationView } from './components/Communication/CommunicationView';
import { StudyPlansView } from './components/Academic/StudyPlansView';
import { UserProfileView } from './components/Profile/UserProfileView';
import { CapabilitiesView } from './components/Admin/CapabilitiesView';
import { NeuroScreeningView } from './components/NeuroScreening/NeuroScreeningView';
import { StudentBattleView } from './components/StudentPortal/StudentBattleView';
import { SurvivalView } from './components/StudentPortal/SurvivalView';
import { GamifiedEventsManager } from './components/GamifiedEvents/GamifiedEventsManager';
import { RiskDashboard } from './components/RiskManagement/RiskDashboard';
import { ClassDiaryView } from './components/ClassDiary/ClassDiaryView';
import { ProfessorDashboardView } from './components/Professor/ProfessorDashboardView';
import { ParentsDashboardView } from './components/Parents/ParentsDashboardView';
import { ArcadeView } from './components/StudentPortal/ArcadeView';
import { AvatarShopView } from './components/StudentPortal/AvatarShopView';
import { GovernanceView } from './components/Admin/GovernanceView';
import { AuditLogView } from './components/Admin/AuditLogView';
import { TabletLauncher } from './components/TabletApp/TabletLauncher';
import { LiveDemoLobby } from './components/Demo/LiveDemoLobby';
import { AIDiagnosticView } from './components/Diagnostics/AIDiagnosticView';

export default function App() {
  const store = useAppStore();
  const { currentUser, setCurrentUser, users, loadRemoteData, isInitialized } = store;
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true); // Track auth verification state

  // --- 1. INIT & DATA LOADING ---
  useEffect(() => {
    const storedConsent = localStorage.getItem('lgpd_consent');
    if (storedConsent === 'true') store.setHasConsented(true);

    checkConnection().then(connected => {
      useAppStore.setState({ isInitialized: true });
    });
  }, []);

  // --- 2. AUTH LISTENER ---
  useEffect(() => {
    if (!isInitialized) return;

    const handleAuthUser = async (sessionUser: any) => {
      setAuthChecking(true);

      // BUSCA DIRETA: Sempre buscar no Supabase para garantir que temos o dado mais fresco
      // sem depender do estado global 'users' que flutua durante o loadRemoteData
      let userMatch = null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', sessionUser.email)
          .single();

        if (data) {
          userMatch = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            tenantId: data.tenant_id,
            schoolId: data.school_id,
            childrenIds: data.children_ids || [],
            status: data.status
          };
        }
      } catch (err) {
        console.error("Erro ao buscar usuário no login:", err);
      }

      if (userMatch) {
        // Test Profile Logic
        const testProfileRole = localStorage.getItem('test_profile');
        if (testProfileRole) {
          userMatch = { ...userMatch, role: testProfileRole as UserRole };
        }

        setCurrentUser(userMatch);

        const currentPath = window.location.pathname;
        const lastRoute = localStorage.getItem('examepad_last_route');

        if (currentPath === '/' || currentPath === '/login') {
          if (lastRoute && lastRoute !== '/login' && lastRoute !== '/') {
            navigate(lastRoute);
            localStorage.removeItem('examepad_last_route');
          } else {
            if (userMatch.role === UserRole.ALUNO) navigate('/aluno');
            else navigate('/dashboard');
          }
        }

        // Carregar o restante dos dados (uma única vez por sessão bem-sucedida)
        loadRemoteData();
      } else if (sessionUser) {
        // AUTO-SYNC: Criar registro no banco se não existir
        console.log("🛠️ Sincronizando novo perfil de usuário com o banco...", sessionUser.email);

        const newProfile = {
          id: sessionUser.id,
          name: sessionUser.user_metadata?.full_name || 'Usuário',
          email: sessionUser.email,
          role: sessionUser.user_metadata?.role || UserRole.PAIS,
          tenant_id: 't1', // Default tenant
          status: 'ACTIVE'
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert([newProfile]);

        if (!insertError) {
          setCurrentUser({
            id: newProfile.id,
            name: newProfile.name,
            email: newProfile.email,
            role: newProfile.role,
            tenantId: newProfile.tenant_id,
            childrenIds: []
          });
          navigate('/dashboard');
          loadRemoteData();
        } else {
          console.error("Erro ao criar perfil automático:", insertError);
          // Fallback final
          await supabase.auth.signOut();
          setCurrentUser(null);
          navigate('/login');
        }
      } else {
        console.warn("Usuário autenticado mas não encontrado no Banco.", sessionUser.email);
        await supabase.auth.signOut();
        setCurrentUser(null);
        navigate('/login');
      }

      setAuthChecking(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleAuthUser(session.user);
      else setAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) handleAuthUser(session.user);
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setAuthChecking(false);
        localStorage.removeItem('examepad_last_route');
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [isInitialized, setCurrentUser, navigate]); // REMOVIDO 'users' das dependências

  // --- 3. ROUTE PERSISTENCE ---
  // Save current route before unload/refresh to restore after F5
  useEffect(() => {
    if (!currentUser) return;

    const saveCurrentRoute = () => {
      const currentPath = window.location.pathname;
      // Don't save login or root routes
      if (currentPath !== '/login' && currentPath !== '/') {
        try {
          localStorage.setItem('examepad_last_route', currentPath);
          console.log('💾 Rota salva para restauração:', currentPath);
        } catch (e) {
          console.warn('Não foi possível salvar rota:', e);
        }
      }
    };

    // Save on navigation
    saveCurrentRoute();

    // Save before page unload (F5, close tab, etc)
    window.addEventListener('beforeunload', saveCurrentRoute);
    return () => window.removeEventListener('beforeunload', saveCurrentRoute);
  }, [currentUser, window.location.pathname]);

  // --- LOADING SCREEN ---
  // Show loading while initializing OR checking authentication
  if (!isInitialized || authChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0f172a] flex-col gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">
          {!isInitialized ? 'Carregando sistema...' : 'Verificando autenticação...'}
        </p>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes Wrapper */}
        <Route path="/*" element={
          currentUser ? (
            <Layout>
              {/* This Layout renders the sidebar and header, and {children} is the Outlet content */}
              <div className="h-full w-full">
                {/* We don't use Outlet here because Layout uses {children}. 
                       Ideally Layout should use <Outlet /> but for now we wrap standard Routes inside it? 
                       Wait, react-router v6 supports nesting.
                       Let's use the standard pattern: Layout wraps the Routes.
                   */}
                <Routes>
                  {/* GLOBAL DATA LOADING GUARD */}
                  {/* Se o usuário está logado, mas os dados críticos ainda não carregaram (array vazio), mostra Loading */}
                  {/* Isso previne a Tela Branca no Dashboard que assume que já existem dados */}
                  {(currentUser && (!store.users?.length || !store.schools?.length) && !store.isInitialized) ? (
                    <Route path="*" element={
                      <div className="flex h-full w-full items-center justify-center flex-col gap-4 bg-slate-50">
                        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium">Sincronizando dados...</p>
                      </div>
                    } />
                  ) : (
                    <>
                      {/* DASHBOARDS */}
                      <Route path="dashboard" element={
                        currentUser.role === 'PROFESSOR' ? <ProfessorDashboardView /> :
                          currentUser.role === 'PAIS' ? <ParentsDashboardView /> :
                            <DashboardView state={store} />
                      } />

                      {/* TEACHER / ACADEMIC */}
                      <Route path="teacher/itens" element={<ItemsListView state={store} />} />
                      <Route path="teacher/itens/novo" element={<ItemEditorView state={store} />} />
                      <Route path="teacher/provas" element={<ExamsListView state={store} />} />
                      <Route path="teacher/provas/nova" element={<ExamBuilderView state={store} />} />

                      {/* ADMIN */}
                      <Route path="admin/gestao" element={<ManagementView state={store} onAddSchool={store.addSchool} onAddClass={store.addClass} onAddStudent={store.addStudent} onAddUser={store.addUser} onUpdateUser={store.updateUser} onResetPassword={store.resetUserPassword} onUpdateSettings={store.updateSettings} />} />
                      <Route path="admin/governanca" element={<GovernanceView state={store} />} />
                      <Route path="admin/capabilities" element={<CapabilitiesView />} />
                      <Route path="admin/audit" element={<AuditLogView />} />
                      <Route path="allocation" element={<AllocationView state={store} onUpdate={store.updateExamAllocation} />} />
                      <Route path="risk-dashboard" element={<RiskDashboard />} />
                      <Route path="analytics" element={<SchoolDashboardView state={store} />} />

                      {/* STUDENT */}
                      <Route path="aluno" element={<StudentDashboardView state={store} user={currentUser} />} />
                      <Route path="aluno/loja" element={<AvatarShopView />} />
                      <Route path="aluno/arcade" element={<ArcadeView />} />
                      <Route path="aluno/tutor" element={<OwlTutorView state={store} user={currentUser} />} />
                      <Route path="battle-arena" element={<StudentBattleView state={store} user={currentUser} onUpdateProfile={store.updateUserProfile} />} />
                      <Route path="survival-mode" element={<SurvivalView state={store} user={currentUser} onUpdateProfile={store.updateUserProfile} />} />

                      {/* COMMON */}
                      <Route path="communication" element={<CommunicationView state={store} user={currentUser} onUpdateMessages={store.updateMessages} onUpdateGroups={store.updateChatGroups} onUpdateUser={store.updateCurrentUser} />} />
                      <Route path="my-profile" element={<UserProfileView state={store} user={currentUser} onUpdateProfile={store.updateUserProfile} />} />
                      <Route path="study-plans" element={<StudyPlansView state={store} user={currentUser} />} />
                      <Route path="class-diary" element={<ClassDiaryView />} />
                      <Route path="neuro-screening" element={<NeuroScreeningView state={store} onUpdateProfile={store.updateUserProfile} />} />
                      <Route path="gamified-events" element={<GamifiedEventsManager state={store} user={currentUser} />} />

                      {/* APPS & DEMO (Full Screen Modes) */}
                      <Route path="apps/tablet" element={<div className="fixed inset-0 z-50 bg-slate-900"><TabletLauncher state={store} onSelectApp={() => { }} onBack={() => navigate('/dashboard')} /></div>} />
                      <Route path="apps/demo" element={<LiveDemoLobby onClose={() => navigate('/dashboard')} />} />

                      {/* UTILS */}
                      <Route path="diag-ai" element={<AIDiagnosticView />} />
                      <Route path="print-exam/:id" element={<PrintUtilWrapper store={store} />} />
                      <Route path="results/:id" element={<ResultsUtilWrapper store={store} navigate={navigate} />} />

                      {/* Catch */}
                      <Route path="*" element={<Navigate to="/dashboard" />} />
                    </>
                  )}
                </Routes>
              </div>
            </Layout>
          ) : <Navigate to="/login" />
        } />
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

// Helper Wrappers for Params
const PrintUtilWrapper = ({ store }: any) => {
  const { id } = useParams();
  return id ? <PrintableExamView state={store} examId={id} onBack={() => window.history.back()} /> : null;
};

const ResultsUtilWrapper = ({ store, navigate }: any) => {
  const { id } = useParams();
  return id ? <ResultsEntryView state={store} examId={id} onBack={() => navigate('/teacher/provas')} onSaveResults={store.updateResults} /> : null;
};
