import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation, useRoutes } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { UserRole, ExamResult } from './types';
import { useAppStore } from './store/useAppStore';
import { appRoutes } from './routes';
import { checkConnection, supabase } from './services/supabaseClient';
import { LoginPage } from './modules/auth/LoginPage';
import { uuidv4 } from './utils/helpers';
import { INITIAL_TENANTS, INITIAL_SCHOOLS } from './utils/mockData';

// Infrastructure
import { PrivacyPolicyModal } from './components/Legal/PrivacyPolicyModal';
import { nativeBridge } from './services/nativeBridgeService';

export default function App() {
  const store = useAppStore();

  // Inicializa ponte nativa (Android Back Button, etc)
  useEffect(() => {
    nativeBridge.getIsNative(); // Trigger constructor
  }, []);
  const { currentUser, setCurrentUser, users, loadRemoteData, isInitialized, hasConsented, setHasConsented } = store;
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

  // --- 2. GUEST BYPASS FOR MOBILE DEMO ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isMobileMode = params.get('mode') === 'mobile';

    if (isMobileMode && !store.currentUser) {
      console.log("Entering Mobile Demo Mode as Guest...");
      store.setCurrentUser({
        id: 'guest-' + uuidv4().slice(0, 8),
        name: 'Visitante (Demo)',
        email: 'guest@examepad.com',
        role: UserRole.ALUNO,
        tenantId: INITIAL_TENANTS[0].id,
        schoolId: INITIAL_SCHOOLS[0].id
      });
    }
  }, [location.search, store.currentUser, isInitialized]);

  // --- 3. AUTH LISTENER ---
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
          tenant_id: INITIAL_TENANTS[0].id, // Default tenant
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
  }, [isInitialized]); // FIX: Add isInitialized dependency

  // --- 4. THEME INITIALIZATION ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('examepad_theme') as 'light' | 'dark' | null;
    if (savedTheme && savedTheme !== store.settings.theme) {
      useAppStore.setState(state => ({
        settings: { ...state.settings, theme: savedTheme }
      }));
    }
  }, []);

  const element = useRoutes(appRoutes);
  const currentTheme = store.settings.theme || 'light';
  const userRoleClass = currentUser ? `role-${currentUser.role.toLowerCase()}` : '';

  if (authChecking) {
    return (
      <div className={`flex h-screen w-screen items-center justify-center flex-col gap-4 bg-slate-50 ${currentTheme}`}>
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Autenticando...</p>
      </div>
    );
  }

  return (
    <div className={`${currentTheme} ${userRoleClass} min-h-screen bg-primary transition-colors duration-300`}>
      {element}
      {!hasConsented && (
        <PrivacyPolicyModal
          onAccept={() => { setHasConsented(true); localStorage.setItem('lgpd_consent', 'true'); }}
          onReject={() => alert("O aceite é obrigatório.")}
        />
      )}
    </div>
  );
}

