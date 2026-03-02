import { create } from 'zustand';
export { useSafeAppStore } from '../hooks/useSafeAppStore';
import { AuthSlice, createAuthSlice } from './slices/authSlice';
import { ItemSlice, createItemSlice } from './slices/itemSlice';
import { ExamSlice, createExamSlice } from './slices/examSlice';
import { AcademicSlice, createAcademicSlice } from './slices/academicSlice';
import { AdminSlice, createAdminSlice } from './slices/adminSlice';
import { ExtraSlice, createExtraSlice } from './slices/extraSlice';
import { UISlice, createUISlice } from './slices/uiSlice';
import { LogisticsSlice, createLogisticsSlice } from './slices/logisticsSlice';
import { SystemSlice, createSystemSlice } from './slices/systemSlice';
import { TaskSlice, createTaskSlice } from './slices/taskSlice';
import { INITIAL_TENANTS, INITIAL_SCHOOLS, INITIAL_CLASSES, INITIAL_USERS, INITIAL_ITEMS, INITIAL_EXAMS, INITIAL_RESULTS, INITIAL_REGISTRATIONS, INITIAL_ANNOUNCEMENTS, INITIAL_MESSAGES, INITIAL_LESSON_PLANS, INITIAL_STUDY_PLANS, INITIAL_GAMIFIED_EVENTS, MOCK_ITEM_ID, INITIAL_STUDENT_PROFILES, INITIAL_USER_PROFILES, INITIAL_SETTINGS, MOCK_TENANT_ID } from '../utils/mockData';
import { UserRole, ItemOrigin, ExamStatus } from '../types';
import { DEFAULT_PERMISSIONS } from './constants';
import { supabase } from '../services/supabaseClient';

export type AppStore = AuthSlice & ItemSlice & ExamSlice & AcademicSlice & AdminSlice & ExtraSlice & UISlice & LogisticsSlice & SystemSlice & TaskSlice;

const PRODUCTION_MODE = import.meta.env.VITE_PRODUCTION_MODE === 'true';
// FORCING MOCKS based on environment variable
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || import.meta.env.VITE_USE_MOCK_DATA === undefined;

export const useAppStore = create<AppStore>()((set, get, api) => ({
    ...createAuthSlice(set, get, api),
    ...createItemSlice(set, get, api),
    ...createExamSlice(set, get, api),
    ...createAcademicSlice(set, get, api),
    ...createAdminSlice(set, get, api),
    ...createExtraSlice(set, get, api),
    ...createUISlice(set, get, api),
    ...createLogisticsSlice(set, get, api),
    ...createSystemSlice(set, get, api),
    ...createTaskSlice(set, get, api),

    // Overrides/Initialization for Mock Data
    tenants: USE_MOCK_DATA ? INITIAL_TENANTS : [],
    schools: USE_MOCK_DATA ? INITIAL_SCHOOLS : [],
    classes: USE_MOCK_DATA ? INITIAL_CLASSES : [],
    users: USE_MOCK_DATA ? [
        { id: 'u_system', name: 'Gestor SaaS', email: 'saas@examepad.com', role: UserRole.SYSTEM_ADMIN, tenantId: 't_system', status: 'active' },
        ...INITIAL_USERS
    ] : [],
    students: USE_MOCK_DATA ? INITIAL_USERS.filter(u => u.role === UserRole.ALUNO).map(u => ({
        id: u.id,
        name: u.name,
        registrationNumber: u.registrationNumber || '',
        classId: u.classIds?.[0] || '',
        schoolId: u.schoolId || '',
        tenantId: u.tenantId
    })) : [],
    items: USE_MOCK_DATA ? INITIAL_ITEMS : [],
    exams: USE_MOCK_DATA ? INITIAL_EXAMS : [],
    results: USE_MOCK_DATA ? INITIAL_RESULTS : [],
    registrations: USE_MOCK_DATA ? INITIAL_REGISTRATIONS : [],
    gamifiedEvents: USE_MOCK_DATA ? INITIAL_GAMIFIED_EVENTS : [],
    announcements: USE_MOCK_DATA ? INITIAL_ANNOUNCEMENTS : [],
    messages: USE_MOCK_DATA ? INITIAL_MESSAGES : [],
    lessonPlans: USE_MOCK_DATA ? INITIAL_LESSON_PLANS : [],
    studyPlans: USE_MOCK_DATA ? INITIAL_STUDY_PLANS : [],
    globalPermissions: DEFAULT_PERMISSIONS,
    studentProfiles: USE_MOCK_DATA ? INITIAL_STUDENT_PROFILES : [],
    userProfiles: USE_MOCK_DATA ? INITIAL_USER_PROFILES : [],
    institutionalEvents: [],

    // Multi-slice orchestration (Main actions)
    loadRemoteData: async () => {
        console.log("🔄 Sincronizando dados com a nuvem (Modular)...");
        if (USE_MOCK_DATA) {
            console.log("⏭️ Mock data ativo, pulando busca remota.");
            return;
        }

        const state = get();
        await Promise.all([
            state.loadTenants?.(),
            state.loadItems?.(),
            state.loadSchools?.(),
            state.loadClasses?.(),
            state.loadStudents?.(),
            state.loadUsers?.(),
            state.loadGenerationBatches?.(),
            state.loadExams?.(),
            state.loadSchedules?.(),
            state.loadInstitutionalEvents?.()
        ]);

        console.log("✅ Dados sincronizados.");
    }
}));
