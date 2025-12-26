
import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles, User, Globe, ShieldCheck, GraduationCap, Tablet, BookOpen } from 'lucide-react';
import { UserRole } from './types';
import { useAppStore } from './store/useAppStore';
import { checkConnection, supabase } from './services/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from './services/supabaseClient';
import { INITIAL_USERS } from './utils/mockData';

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
  const { currentUser, setCurrentUser, setSelectedChildId } = store;

  const [view, setView] = useState('LOGIN');
  const [tabletPayload, setTabletPayload] = useState<any>(null);
  
  const [selectedExamIdForPrint, setSelectedExamIdForPrint] = useState<string | null>(null);
  const [selectedExamIdForResults, setSelectedExamIdForResults] = useState<string | null>(null);

  useEffect(() => {
      checkConnection(); 
  }, []);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const isMobileMode = params.get('mode') === 'mobile';
      const demoRole = params.get('role');

      const fetchInitialUsers = async () => {
          const { data } = await supabase.from('users').select('*');
          if (isMobileMode) {
              const usersToSearch = (data && data.length > 0) ? data : INITIAL_USERS;
              if (demoRole === 'STUDENT') {
                  const studentUser = usersToSearch?.find((u:any) => u.role === UserRole.ALUNO);
                  if (studentUser) setCurrentUser(studentUser);
                  setView('TABLET_STUDENT');
              } else if (demoRole === 'PROFESSOR') {
                  const profUser = usersToSearch?.find((u:any) => u.role === UserRole.PROFESSOR);
                  if (profUser) setCurrentUser(profUser);
                  setView('TABLET_PROF');
              } else if (demoRole === 'COORDINATOR') {
                  const coordUser = usersToSearch?.find((u:any) => u.role === UserRole.SUPERVISOR);
                  if (coordUser) setCurrentUser(coordUser);
                  setView('TABLET_COORD');
              } else {
                  setView('TABLET_LAUNCHER');
              }
          }
      };
      fetchInitialUsers();
  }, [setCurrentUser]);

  const handleLogin = async (userId: string) => {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    let finalUser = user || INITIAL_USERS.find(u => u.id === userId);

    if (finalUser) {
      setCurrentUser(finalUser);
      if (finalUser.role === UserRole.ALUNO || finalUser.role === UserRole.PAIS) {
          if (finalUser.role === UserRole.PAIS && finalUser.childrenIds?.length) {
              setSelectedChildId(finalUser.childrenIds[0]);
          }
          setView('STUDENT_PORTAL');
      } else {
          setView('DASHBOARD');
      }
    }
  };

  const { data: dbUsers, isLoading: loadingUsers } = useQuery({
      queryKey: ['users'], 
      queryFn: fetchUsers,
      initialData: []
  });

  const loginUsers = (dbUsers && dbUsers.length > 0) ? dbUsers : INITIAL_USERS;

  if (!currentUser && view === 'LOGIN') {
    return (
      <div className="min-h-screen flex flex-col md:flex-row font-sans">
        
        {/* LADO ESQUERDO: CONCEITUAL (PAPEL PARA DIGITAL) */}
        <div className="hidden md:flex md:w-1/2 bg-slate-100 relative overflow-hidden items-center justify-center p-12">
            {/* Background Image representativa */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop" 
                    alt="Educação Híbrida" 
                    className="w-full h-full object-cover opacity-20 grayscale"
                />
            </div>
            
            <div className="relative z-10 space-y-8 max-w-lg">
                <div className="flex items-center gap-6">
                    <div className="p-6 bg-white shadow-xl rounded-2xl border border-slate-200 transform -rotate-3">
                        <BookOpen size={48} className="text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Fase Impressa</p>
                    </div>
                    <div className="h-px w-12 bg-slate-300"></div>
                    <div className="p-6 bg-brand-primary shadow-2xl rounded-2xl transform rotate-3">
                        <Tablet size={48} className="text-white" />
                        <p className="text-[10px] font-bold text-white/70 mt-2 uppercase tracking-tighter">Fase Digital</p>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-4xl font-black text-slate-800 leading-tight">O futuro das avaliações começa aqui.</h2>
                    <p className="text-slate-600 text-lg mt-4 leading-relaxed">
                        ExamePad une a tradição pedagógica com a inteligência de dados, transformando o papel em progresso real.
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <div className="flex -space-x-2">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-slate-500 font-medium self-center">Junte-se a mais de 500 escolas.</p>
                </div>
            </div>
        </div>

        {/* LADO DIREITO: FORMULÁRIO DE LOGIN */}
        <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-24">
          <div className="w-full max-w-md fade-up">
            <div className="mb-12 text-center md:text-left">
              <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-primary/20">
                 <Sparkles className="text-white" size={32} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Portal de Acesso</h1>
              <p className="text-slate-500 font-medium mt-2">Selecione seu perfil institucional abaixo.</p>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {loginUsers?.map((u:any) => (
                <button 
                  key={u.id} 
                  onClick={() => handleLogin(u.id)} 
                  className="w-full group flex items-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-brand-primary hover:border-brand-primary transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-black mr-4 text-brand-primary border border-slate-200 group-hover:bg-brand-primary group-hover:text-white group-hover:border-white/20 transition-all shadow-sm">
                    {u.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-slate-800 text-base group-hover:text-white transition-colors">{u.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest group-hover:text-white/60">{u.role.replace('_', ' ')}</div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-white transition-colors" />
                </button>
              ))}
              {loginUsers.length === 0 && !loadingUsers && (
                  <div className="text-slate-400 text-center py-10 italic">Nenhum perfil sincronizado.</div>
              )}
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck size={16} className="text-emerald-500"/>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Acesso Governamental Seguro</span>
               </div>
               <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">v2.5.0 SaaS</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCoordinatorSyncUp = (events: any[]) => {
      alert("Simulação: Dados sincronizados com sucesso para a nuvem SaaS.");
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

  if (view === 'LIVE_DEMO') {
      return <LiveDemoLobby onClose={() => setView('DASHBOARD')} />;
  }

  const handlePrintExam = (examId: string) => { setSelectedExamIdForPrint(examId); setView('PRINT_PREVIEW'); };
  const handleGradeExam = (examId: string) => { setSelectedExamIdForResults(examId); setView('RESULTS_ENTRY'); };

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
