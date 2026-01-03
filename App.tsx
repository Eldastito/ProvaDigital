
import React, { useState, useEffect } from 'react';
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
  const { currentUser, setCurrentUser, users, setSelectedChildId, loadRemoteData } = store;

  // Global View State
  const [view, setView] = useState('LOGIN');
  const [tabletPayload, setTabletPayload] = useState<any>(null);

  // Specific Context State
  const [selectedExamIdForPrint, setSelectedExamIdForPrint] = useState<string | null>(null);
  const [selectedExamIdForResults, setSelectedExamIdForResults] = useState<string | null>(null);

  // --- INIT: LOAD DATA FROM SUPABASE ---
  useEffect(() => {
    // 0. Check LGPD Consent
    const storedConsent = localStorage.getItem('lgpd_consent');
    if (storedConsent === 'true') {
      store.setHasConsented(true);
    }

    // 1. Check & Load Data
    checkConnection().then(connected => {
      if (connected) loadRemoteData();
    });

    // 2. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth Event:', event, 'Session:', session?.user?.email);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);

        // Buscar perfil extendido do usuário na store local (pode ter vindo do loadRemoteData)
        let userMatch = users.find(u => u.email === session.user.email);

        if (userMatch) {
          console.log('👤 User found in store:', userMatch.name);

          // 🧪 CHECK FOR TEST PROFILE OVERRIDE (with persistence flag)
          const testProfile = localStorage.getItem('test_profile');
          const testProfileLocked = sessionStorage.getItem('test_profile_locked');

          if (testProfile && !testProfileLocked) {
            console.log('🧪 Test profile detected:', testProfile);
            userMatch = { ...userMatch, role: testProfile as UserRole };

            // 🧒 Se for perfil PAIS, adicionar filhos de teste
            if (testProfile === 'PAIS') {
              userMatch = {
                ...userMatch,
                childrenIds: ['st_muni', 'st_state', 'st_fed', 'st_priv']
              };
              console.log('👨‍👩‍👧‍👦 Adicionando filhos de teste ao perfil PAIS');
            }

            // 🎓 Se for perfil ALUNO, criar registro de estudante
            if (testProfile === 'ALUNO') {
              const studentExists = store.students.find(s => s.id === userMatch.id);
              if (!studentExists) {
                const newStudent = {
                  id: userMatch.id,
                  name: userMatch.name,
                  registrationNumber: 'TEST-' + userMatch.id.slice(0, 6),
                  classId: 'c1',
                  schoolId: userMatch.schoolId || 's1',
                  tenantId: userMatch.tenantId
                };
                store.students.push(newStudent);
                console.log('🎓 Criando registro de estudante para teste:', newStudent.name);
              }
            }

            console.log('🔄 Overriding role to:', testProfile);

            // Lock the test profile for this session to prevent auth events from overriding it
            sessionStorage.setItem('test_profile_locked', 'true');
          } else if (testProfileLocked) {
            // Profile already locked, use the test profile from localStorage
            console.log('🔒 Test profile locked, maintaining:', testProfile);
            userMatch = { ...userMatch, role: testProfile as UserRole };

            // 🧒 Se for perfil PAIS, adicionar filhos de teste
            if (testProfile === 'PAIS') {
              userMatch = {
                ...userMatch,
                childrenIds: ['st_muni', 'st_state', 'st_fed', 'st_priv']
              };
            }

            // 🎓 Se for perfil ALUNO, garantir que estudante existe
            if (testProfile === 'ALUNO') {
              const studentExists = store.students.find(s => s.id === userMatch.id);
              if (!studentExists) {
                const newStudent = {
                  id: userMatch.id,
                  name: userMatch.name,
                  registrationNumber: 'TEST-' + userMatch.id.slice(0, 6),
                  classId: 'c1',
                  schoolId: userMatch.schoolId || 's1',
                  tenantId: userMatch.tenantId
                };
                store.students.push(newStudent);
              }
            }
          }

          setCurrentUser(userMatch);
          // Route based on Role
          if (userMatch.role === UserRole.ALUNO) setView('STUDENT_PORTAL');
          else setView('DASHBOARD');
        } else {
          // Fallback: Criar perfil dinâmico para novos usuários do Supabase
          console.warn("⚠️ Usuário novo detectado. Criando perfil local...");

          const newUser: any = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Novo Usuário',
            email: session.user.email!,
            role: UserRole.TENANT_ADMIN, // Default role for new signups via this portal
            tenantId: 't1', // Default tenant
            schoolId: 's1'  // Default school
          };

          console.log('➕ Creating new user profile:', newUser);

          // Adicionar ao store e setar como atual
          store.addUser(newUser);
          setCurrentUser(newUser);
          setView('DASHBOARD');
        }
      }
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setCurrentUser(null);
        setView('LOGIN');
      }
    });

    return () => subscription.unsubscribe();
  }, [users, setCurrentUser]); // Depend on users to match email

  // ... (Demo Mode Logic Remains) ...

  const handleLogin = (userId: string) => {
    // Legacy Handler (Mantido para compatibilidade se necessário, mas não usado na UI nova)
  };

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
