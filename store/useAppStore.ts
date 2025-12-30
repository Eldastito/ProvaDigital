
import { create } from 'zustand';
import { AppState, User, Item, Exam, ExamResult, ChatGroup, Announcement, LessonPlan, StudyPlan, UserProfileExtended, AppSettings, PermissionMatrix, UserRole, GamifiedEvent, Resource, School, SchoolClass, Student, RegistrationStatus, ExamRegistration } from '../types';
import { INITIAL_SETTINGS } from '../utils/mockData';
import { 
  queryClient,
  insertItem, insertExam, upsertResults, insertGamifiedEvent, updateGamifiedEventData,
  insertSchool, updateSchool, insertClass, insertStudent, insertUser,
  updateTenantData, updateUserProfileData, upsertExamRegistrations,
  insertAnnouncement, removeAnnouncementById, insertChatMessage, deleteChatMessageById,
  insertLessonPlan, insertStudyPlan, updateStudyPlanData,
  registerStudentToEventDB,
  supabase
} from '../services/supabaseClient';

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
        NEURO_SCREENING: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        GOVERNANCE: ['VIEW', 'CREATE', 'EDIT', 'DELETE']
    },
    [UserRole.ALUNO]: {
        SCHOOL_DATA: ['VIEW'],
        USER_DATA: ['VIEW'],
        ITEM_BANK: [],
        EXAM_MGMT: ['VIEW'],
        OFFLINE_OPS: [],
        ANALYTICS: ['VIEW'],
        COMMUNICATION: ['VIEW', 'CREATE'],
        AI_FEATURES: ['VIEW'],
        FINANCIAL: [],
        NEURO_SCREENING: ['VIEW'], 
        GAMIFIED_EVENTS: ['VIEW']
    },
    [UserRole.PAIS]: {
        SCHOOL_DATA: ['VIEW'],
        USER_DATA: ['VIEW'],
        ITEM_BANK: [],
        EXAM_MGMT: ['VIEW'], 
        OFFLINE_OPS: [],
        ANALYTICS: ['VIEW'], 
        COMMUNICATION: ['VIEW', 'CREATE'],
        AI_FEATURES: ['VIEW'], 
        FINANCIAL: ['VIEW'],
        NEURO_SCREENING: ['VIEW', 'CREATE'],
        GAMIFIED_EVENTS: ['VIEW'] 
    },
    [UserRole.STATE_ADMIN]: { SCHOOL_DATA: ['VIEW'], USER_DATA: ['VIEW'], ITEM_BANK: [], EXAM_MGMT: [], OFFLINE_OPS: [], ANALYTICS: ['VIEW', 'CREATE', 'EDIT'], COMMUNICATION: ['VIEW', 'CREATE'], AI_FEATURES: ['VIEW'], FINANCIAL: ['VIEW'], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW'] },
    [UserRole.TENANT_ADMIN]: { SCHOOL_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], ITEM_BANK: [], EXAM_MGMT: [], OFFLINE_OPS: ['VIEW', 'EDIT'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], AI_FEATURES: ['VIEW'], FINANCIAL: [], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW'], GOVERNANCE: ['VIEW', 'EDIT'] },
    [UserRole.DIRETOR]: { SCHOOL_DATA: ['VIEW', 'EDIT'], USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], ITEM_BANK: ['VIEW'], EXAM_MGMT: ['VIEW'], OFFLINE_OPS: ['VIEW', 'EDIT'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], AI_FEATURES: ['VIEW'], FINANCIAL: [], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT'] },
    [UserRole.SUPERVISOR]: { SCHOOL_DATA: ['VIEW'], USER_DATA: ['VIEW'], ITEM_BANK: ['VIEW', 'CREATE', 'EDIT'], EXAM_MGMT: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], OFFLINE_OPS: ['VIEW', 'CREATE', 'EDIT'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE'], AI_FEATURES: ['VIEW', 'CREATE'], FINANCIAL: [], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT'] },
    [UserRole.PROFESSOR]: { SCHOOL_DATA: ['VIEW'], USER_DATA: ['VIEW'], ITEM_BANK: ['VIEW', 'CREATE'], EXAM_MGMT: ['VIEW', 'CREATE'], OFFLINE_OPS: ['VIEW', 'CREATE', 'EDIT'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE'], AI_FEATURES: ['VIEW', 'CREATE'], FINANCIAL: [], NEURO_SCREENING: [], GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] }
};

interface AppActions {
  setCurrentUser: (user: User | null) => void;
  setSelectedChildId: (childId: string | null) => void;
  addItem: (item: Item) => Promise<void>;
  addExam: (exam: Exam) => Promise<void>;
  addSchool: (school: School) => Promise<void>;
  updateSchoolData: (school: School) => Promise<void>;
  addClass: (cls: SchoolClass) => Promise<void>;
  addStudent: (student: Student) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateSettings: (settings: AppSettings) => void;
  updatePermissions: (matrix: PermissionMatrix) => void;
  updateTenantFeatures: (tenantId: string, disabled: Resource[]) => Promise<void>;
  updateChatGroups: (groups: ChatGroup[]) => Promise<void>;
  updateCurrentUser: (user: User) => void; 
  updateUserProfile: (profile: UserProfileExtended) => Promise<void>;
  updateExamAllocation: (examId: string, classIds: string[], students: Student[], classes: SchoolClass[]) => Promise<void>;
  updateResults: (newResults: ExamResult[]) => Promise<void>;
  addAnnouncement: (anc: Announcement) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  insertChatMessage: (message: any) => Promise<void>;
  addLessonPlan: (plan: LessonPlan) => Promise<void>;
  addStudyPlan: (plan: StudyPlan) => Promise<void>;
  updateStudyPlan: (plan: StudyPlan) => Promise<void>;
  addGamifiedEvent: (event: GamifiedEvent) => Promise<void>;
  updateGamifiedEvent: (event: GamifiedEvent) => Promise<void>;
  registerStudentToEvent: (eventId: string, studentId: string, currentParticipants: GamifiedEvent['participants']) => Promise<void>;
}

type AppStore = AppState & AppActions;

const loadPermissions = (): PermissionMatrix => {
    const saved = localStorage.getItem('examepad_permissions');
    return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
};

export const useAppStore = create<AppStore>((set, get) => ({
  currentUser: null,
  selectedChildId: null,

  settings: INITIAL_SETTINGS,
  globalPermissions: loadPermissions(),

  setCurrentUser: (user) => set({ currentUser: user, selectedChildId: null }),
  setSelectedChildId: (childId) => set({ selectedChildId: childId }),
  
  addItem: async (item) => { await insertItem(item); },
  addExam: async (exam) => { await insertExam(exam); },
  updateResults: async (newResults) => { await upsertResults(newResults); },
  addGamifiedEvent: async (event) => { await insertGamifiedEvent(event); },
  updateGamifiedEvent: async (event) => { await updateGamifiedEventData(event); },
  addSchool: async (school) => { await insertSchool(school); },
  updateSchoolData: async (school) => { await updateSchool(school); },
  addClass: async (cls) => { await insertClass(cls); },
  addStudent: async (student) => { await insertStudent(student); },
  addUser: async (user) => { await insertUser(user); },
  updateSettings: (settings) => set({ settings }),
  
  updatePermissions: (matrix) => {
      const newMatrix = JSON.parse(JSON.stringify(matrix));
      localStorage.setItem('examepad_permissions', JSON.stringify(newMatrix));
      set({ globalPermissions: newMatrix });
  },

  updateTenantFeatures: async (tenantId, disabled) => { await updateTenantData(tenantId, disabled); },
  insertChatMessage: async (message) => { await insertChatMessage(message); },
  updateChatGroups: async (groups) => { queryClient.invalidateQueries({ queryKey: ['chatGroups'] }); },
  updateCurrentUser: (user) => set({ currentUser: user }),
  updateUserProfile: async (profile) => { await updateUserProfileData(profile); },
  updateExamAllocation: async (examId, classIds, allStudents, allClasses) => {
      const { error: examUpdateError } = await supabase.from('exams').update({ class_ids: classIds }).eq('id', examId);
      if (examUpdateError) throw examUpdateError;
      queryClient.invalidateQueries({ queryKey: ['exams'] });
  
      const newRegistrations: ExamRegistration[] = [];
      const studentsInAllocatedClasses = allStudents.filter(s => classIds.includes(s.classId));
      
      studentsInAllocatedClasses.forEach(s => {
          newRegistrations.push({
              id: Math.random().toString(36).substr(2, 9),
              examId: examId,
              studentId: s.id,
              classId: s.classId,
              status: RegistrationStatus.INSCRITO,
          });
      });
  
      const currentRegistrations = queryClient.getQueryData<ExamRegistration[]>(['registrations']) || [];
      const registrationsToRemove = currentRegistrations.filter(r => 
          r.examId === examId && !classIds.includes(r.classId)
      );
      if (registrationsToRemove.length > 0) {
          await supabase.from('exam_registrations').delete().in('id', registrationsToRemove.map(r => r.id));
      }
      await upsertExamRegistrations(newRegistrations);
  },
  addAnnouncement: async (anc) => { await insertAnnouncement(anc); },
  deleteAnnouncement: async (id) => { await removeAnnouncementById(id); },
  deleteMessage: async (id) => { await deleteChatMessageById(id); },
  addLessonPlan: async (plan) => { await insertLessonPlan(plan); },
  addStudyPlan: async (plan) => { await insertStudyPlan(plan); },
  updateStudyPlan: async (plan) => { await updateStudyPlanData(plan); },
  registerStudentToEvent: async (eventId, studentId, currentParticipants) => {
      await registerStudentToEventDB(eventId, studentId, currentParticipants);
  }
}));
