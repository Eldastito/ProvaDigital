
import { create } from 'zustand';
import { AppState, User, Item, Exam, ExamResult, ChatMessage, ChatGroup, Announcement, LessonPlan, StudyPlan, UserProfileExtended, AppSettings, PermissionMatrix, UserRole } from '../types';
import { INITIAL_TENANTS, INITIAL_SCHOOLS, INITIAL_CLASSES, INITIAL_USERS, INITIAL_ITEMS, INITIAL_STUDENTS, INITIAL_RESULTS, INITIAL_EXAMS, INITIAL_REGISTRATIONS, INITIAL_ANNOUNCEMENTS, INITIAL_MESSAGES, INITIAL_LESSON_PLANS, INITIAL_STUDY_PLANS, INITIAL_STUDENT_PROFILES, INITIAL_SETTINGS, INITIAL_USER_PROFILES } from '../utils/mockData';

// OTIMIZAÇÃO HIERÁRQUICA DE PERMISSÕES
// Removemos acesso "Operacional" de perfis Estratégicos conforme solicitado.
const DEFAULT_PERMISSIONS: PermissionMatrix = {
    [UserRole.SUPER_ADMIN]: {
        SCHOOL_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        ITEM_BANK: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        EXAM_MGMT: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        OFFLINE_OPS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        ANALYTICS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        AI_FEATURES: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        FINANCIAL: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        NEURO_SCREENING: ['VIEW', 'CREATE', 'EDIT', 'DELETE']
    },
    [UserRole.STATE_ADMIN]: {
        // Foco: Gestão Macro e Resultados
        SCHOOL_DATA: ['VIEW'], // Apenas visualiza a rede
        USER_DATA: ['VIEW'], // Visualiza censo
        ITEM_BANK: [], // NÃO PRECISA ver questões individuais
        EXAM_MGMT: [], // NÃO CRIA provas (isso é da escola/prof)
        OFFLINE_OPS: [], // Não opera tablets
        ANALYTICS: ['VIEW', 'CREATE', 'EDIT'], // Foco TOTAL em BI
        COMMUNICATION: ['VIEW', 'CREATE'], // Comunicados Oficiais em Massa
        AI_FEATURES: ['VIEW'], 
        FINANCIAL: ['VIEW'], 
        NEURO_SCREENING: ['VIEW'] // Estatísticas de saúde macro
    },
    [UserRole.TENANT_ADMIN]: { // Secretaria Municipal (Mesmo padrão Estadual)
        SCHOOL_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], // Gere a rede
        USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        ITEM_BANK: [], // Não operacional
        EXAM_MGMT: [], // Não operacional
        OFFLINE_OPS: [],
        ANALYTICS: ['VIEW'],
        COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        AI_FEATURES: ['VIEW'],
        FINANCIAL: [],
        NEURO_SCREENING: ['VIEW']
    },
    [UserRole.DIRETOR]: {
        SCHOOL_DATA: ['VIEW', 'EDIT'], // Edita dados da própria escola (Infra)
        USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], // Gere seu RH
        ITEM_BANK: ['VIEW'], // Pode auditar
        EXAM_MGMT: ['VIEW'], // Acompanha agendamento
        OFFLINE_OPS: ['VIEW'],
        ANALYTICS: ['VIEW'], // Vital
        COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        AI_FEATURES: ['VIEW'],
        FINANCIAL: [],
        NEURO_SCREENING: ['VIEW', 'CREATE'] // Pode solicitar triagem
    },
    [UserRole.SUPERVISOR]: {
        SCHOOL_DATA: ['VIEW'],
        USER_DATA: ['VIEW'],
        ITEM_BANK: ['VIEW', 'CREATE', 'EDIT'], // Curadoria Pedagógica
        EXAM_MGMT: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], // Tático
        OFFLINE_OPS: ['VIEW', 'CREATE'], // Apoio logístico
        ANALYTICS: ['VIEW'],
        COMMUNICATION: ['VIEW', 'CREATE'],
        AI_FEATURES: ['VIEW', 'CREATE'],
        FINANCIAL: [],
        NEURO_SCREENING: ['VIEW'] // Pode apoiar na aplicação
    },
    [UserRole.PROFESSOR]: {
        SCHOOL_DATA: ['VIEW'],
        USER_DATA: ['VIEW'], 
        ITEM_BANK: ['VIEW', 'CREATE'], // CORE
        EXAM_MGMT: ['VIEW', 'CREATE'], // CORE
        OFFLINE_OPS: ['VIEW', 'EDIT'], // Aplicação
        ANALYTICS: ['VIEW'],
        COMMUNICATION: ['VIEW', 'CREATE'],
        AI_FEATURES: ['VIEW', 'CREATE'],
        FINANCIAL: [],
        NEURO_SCREENING: [] // Professor não deve ter acesso a dados clínicos sensíveis
    },
    [UserRole.ALUNO]: {
        SCHOOL_DATA: ['VIEW'],
        USER_DATA: ['VIEW'],
        ITEM_BANK: [],
        EXAM_MGMT: ['VIEW'], // Vê agenda
        OFFLINE_OPS: [],
        ANALYTICS: ['VIEW'], // Próprio
        COMMUNICATION: ['VIEW', 'CREATE'],
        AI_FEATURES: ['VIEW'],
        FINANCIAL: [],
        NEURO_SCREENING: [] // REMOVIDO
    },
    [UserRole.PAIS]: {
        SCHOOL_DATA: ['VIEW'],
        USER_DATA: ['VIEW'],
        ITEM_BANK: [],
        EXAM_MGMT: ['VIEW'],
        OFFLINE_OPS: [],
        ANALYTICS: ['VIEW'],
        COMMUNICATION: ['VIEW', 'CREATE'],
        AI_FEATURES: [], 
        FINANCIAL: ['VIEW'],
        NEURO_SCREENING: [] // REMOVIDO
    }
};

interface AppActions {
  setCurrentUser: (user: User | null) => void;
  setSelectedChildId: (childId: string | null) => void;
  addItem: (item: Item) => void;
  addExam: (exam: Exam) => void;
  addSchool: (school: any) => void;
  addClass: (cls: any) => void;
  addStudent: (student: any) => void;
  addUser: (user: User) => void;
  updateSettings: (settings: AppSettings) => void;
  updatePermissions: (matrix: PermissionMatrix) => void;
  updateTenantFeatures: (tenantId: string, disabled: any[]) => void;
  updateMessages: (messages: ChatMessage[]) => void;
  updateChatGroups: (groups: ChatGroup[]) => void;
  updateCurrentUser: (user: User) => void;
  updateUserProfile: (profile: UserProfileExtended) => void;
  updateExamAllocation: (examId: string, classIds: string[]) => void;
  updateResults: (newResults: ExamResult[]) => void;
  addAnnouncement: (anc: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
  deleteMessage: (id: string) => void;
  addLessonPlan: (plan: LessonPlan) => void;
  addStudyPlan: (plan: StudyPlan) => void;
  updateStudyPlan: (plan: StudyPlan) => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set) => ({
  currentUser: null,
  selectedChildId: null,
  tenants: INITIAL_TENANTS,
  schools: INITIAL_SCHOOLS,
  classes: INITIAL_CLASSES,
  users: INITIAL_USERS,
  students: INITIAL_STUDENTS,
  items: INITIAL_ITEMS,
  exams: INITIAL_EXAMS,
  registrations: INITIAL_REGISTRATIONS,
  results: INITIAL_RESULTS,
  events: [],
  announcements: INITIAL_ANNOUNCEMENTS,
  messages: INITIAL_MESSAGES,
  chatGroups: [],
  owlSessions: [],
  lessonPlans: INITIAL_LESSON_PLANS,
  studyPlans: INITIAL_STUDY_PLANS,
  studentProfiles: INITIAL_STUDENT_PROFILES,
  userProfiles: INITIAL_USER_PROFILES,
  settings: INITIAL_SETTINGS,
  globalPermissions: DEFAULT_PERMISSIONS,

  setCurrentUser: (user) => set({ currentUser: user, selectedChildId: null }),
  setSelectedChildId: (childId) => set({ selectedChildId: childId }),
  
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  addExam: (exam) => set((state) => ({ exams: [...state.exams, exam] })),
  addSchool: (school) => set((state) => ({ schools: [...state.schools, school] })),
  addClass: (cls) => set((state) => ({ classes: [...state.classes, cls] })),
  addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateSettings: (settings) => set({ settings }),
  updatePermissions: (matrix) => set({ globalPermissions: matrix }),
  updateTenantFeatures: (tenantId, disabled) => set((state) => ({
      tenants: state.tenants.map(t => t.id === tenantId ? { ...t, disabledResources: disabled } : t)
  })),
  updateMessages: (messages) => set({ messages }),
  updateChatGroups: (groups) => set({ chatGroups: groups }),
  updateCurrentUser: (user) => set((state) => ({
      currentUser: user,
      users: state.users.map(u => u.id === user.id ? user : u)
  })),
  updateUserProfile: (profile) => set((state) => {
      const otherProfiles = state.userProfiles.filter(p => p.userId !== profile.userId);
      return { userProfiles: [...otherProfiles, profile] };
  }),
  updateExamAllocation: (examId, classIds) => set((state) => {
      const newRegistrations = [...state.registrations];
      const filteredRegistrations = newRegistrations.filter(r => r.examId !== examId);
      const studentsToRegister: any[] = [];
      classIds.forEach(cId => {
          const classStudents = state.students.filter(s => s.classId === cId);
          studentsToRegister.push(...classStudents);
      });
      const freshRegistrations = studentsToRegister.map(s => ({
          id: Math.random().toString(36).substr(2, 9),
          examId,
          studentId: s.id,
          classId: s.classId,
          status: 'INSCRITO' as const
      }));
      return {
          exams: state.exams.map(e => e.id === examId ? { ...e, classIds } : e),
          registrations: [...filteredRegistrations, ...freshRegistrations]
      };
  }),
  updateResults: (newResults) => set((state) => {
       const otherResults = state.results.filter(r => 
          !newResults.some(nr => nr.examId === r.examId && nr.studentId === r.studentId)
       );
       return { results: [...otherResults, ...newResults] };
  }),
  addAnnouncement: (anc) => set((state) => ({ announcements: [anc, ...state.announcements] })),
  deleteAnnouncement: (id) => set((state) => ({ announcements: state.announcements.filter(a => a.id !== id) })),
  deleteMessage: (id) => set((state) => ({ messages: state.messages.filter(m => m.id !== id) })),
  addLessonPlan: (plan) => set((state) => ({ lessonPlans: [...state.lessonPlans, plan] })),
  addStudyPlan: (plan) => set((state) => ({ studyPlans: [...state.studyPlans, plan] })),
  updateStudyPlan: (plan) => set((state) => ({
      studyPlans: state.studyPlans.map(p => p.id === plan.id ? plan : p)
  })),
}));
