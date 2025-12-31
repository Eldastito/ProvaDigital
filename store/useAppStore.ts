
import { create } from 'zustand';
import { AppState, User, Item, Exam, ExamResult, ChatMessage, ChatGroup, Announcement, LessonPlan, StudyPlan, UserProfileExtended, AppSettings, PermissionMatrix, UserRole, GamifiedEvent } from '../types';
import { INITIAL_TENANTS, INITIAL_SCHOOLS, INITIAL_CLASSES, INITIAL_USERS, INITIAL_ITEMS, INITIAL_STUDENTS, INITIAL_RESULTS, INITIAL_EXAMS, INITIAL_REGISTRATIONS, INITIAL_ANNOUNCEMENTS, INITIAL_MESSAGES, INITIAL_LESSON_PLANS, INITIAL_STUDY_PLANS, INITIAL_STUDENT_PROFILES, INITIAL_USER_PROFILES, INITIAL_SETTINGS, INITIAL_GAMIFIED_EVENTS } from '../utils/mockData';
import { supabase } from '../services/supabaseClient';

// OTIMIZAÇÃO HIERÁRQUICA DE PERMISSÕES
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
        GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE']
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
        NEURO_SCREENING: [],
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
        AI_FEATURES: [],
        FINANCIAL: ['VIEW'],
        NEURO_SCREENING: [],
        GAMIFIED_EVENTS: ['VIEW']
    },
    [UserRole.STATE_ADMIN]: { SCHOOL_DATA: ['VIEW'], USER_DATA: ['VIEW'], ITEM_BANK: [], EXAM_MGMT: [], OFFLINE_OPS: [], ANALYTICS: ['VIEW', 'CREATE', 'EDIT'], COMMUNICATION: ['VIEW', 'CREATE'], AI_FEATURES: ['VIEW'], FINANCIAL: ['VIEW'], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW'] },
    [UserRole.TENANT_ADMIN]: { SCHOOL_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], ITEM_BANK: [], EXAM_MGMT: [], OFFLINE_OPS: [], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], AI_FEATURES: ['VIEW'], FINANCIAL: [], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW'] },
    [UserRole.DIRETOR]: { SCHOOL_DATA: ['VIEW', 'EDIT'], USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], ITEM_BANK: ['VIEW'], EXAM_MGMT: ['VIEW'], OFFLINE_OPS: ['VIEW'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], AI_FEATURES: ['VIEW'], FINANCIAL: [], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT'] },
    [UserRole.SUPERVISOR]: { SCHOOL_DATA: ['VIEW'], USER_DATA: ['VIEW'], ITEM_BANK: ['VIEW', 'CREATE', 'EDIT'], EXAM_MGMT: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], OFFLINE_OPS: ['VIEW', 'CREATE'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE'], AI_FEATURES: ['VIEW', 'CREATE'], FINANCIAL: [], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT'] },
    [UserRole.PROFESSOR]: { SCHOOL_DATA: ['VIEW'], USER_DATA: ['VIEW'], ITEM_BANK: ['VIEW', 'CREATE'], EXAM_MGMT: ['VIEW', 'CREATE'], OFFLINE_OPS: ['VIEW', 'EDIT'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE'], AI_FEATURES: ['VIEW', 'CREATE'], FINANCIAL: [], NEURO_SCREENING: [], GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] }
};

interface AppActions {
    setCurrentUser: (user: User | null) => void;
    setSelectedChildId: (childId: string | null) => void;
    loadRemoteData: () => Promise<void>; // NOVA AÇÃO DE CARGA
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
    addGamifiedEvent: (event: GamifiedEvent) => void;
    updateGamifiedEvent: (event: GamifiedEvent) => void;
    registerStudentToEvent: (eventId: string, studentId: string) => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>((set, get) => ({
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
    gamifiedEvents: INITIAL_GAMIFIED_EVENTS,
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

    // --- CARREGAMENTO DO SUPABASE (Sincronização) ---
    loadRemoteData: async () => {
        console.log("🔄 Sincronizando dados com a nuvem...");
        try {
            // 1. Carregar Items
            const { data: dbItems } = await supabase.from('items').select('*');
            if (dbItems && dbItems.length > 0) {
                const formattedItems = dbItems.map((i: any) => ({
                    id: i.id,
                    tenantId: i.tenant_id,
                    subject: i.subject,
                    statement: i.statement,
                    type: i.type,
                    difficulty: i.difficulty,
                    alternatives: i.alternatives,
                    correctAnswerJustification: i.correct_justification,
                    bnccCode: i.bncc_code,
                    origin: i.origin,
                    tags: [],
                    usageCount: 0,
                    createdAt: i.created_at
                }));
                // Mescla com mocks, evitando duplicatas por ID
                set(state => {
                    const existingIds = new Set(state.items.map(x => x.id));
                    const newItems = formattedItems.filter((x: any) => !existingIds.has(x.id));
                    return { items: [...state.items, ...newItems] };
                });
            }

            // 2. Carregar Provas (Exams)
            const { data: dbExams } = await supabase.from('exams').select('*');
            if (dbExams && dbExams.length > 0) {
                const formattedExams = dbExams.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    tenantId: e.tenant_id,
                    schoolId: e.school_id,
                    subject: e.subject,
                    status: e.status,
                    items: e.items_config,
                    classIds: e.class_ids,
                    model: 'SOMATIVO', // Default fallback
                    durationMinutes: 60,
                    targetQuestionCount: 10,
                    createdAt: e.created_at
                }));
                set(state => {
                    const existingIds = new Set(state.exams.map(x => x.id));
                    const newExams = formattedExams.filter((x: any) => !existingIds.has(x.id));
                    return { exams: [...state.exams, ...newExams] };
                });
            }

            // 3. Carregar Resultados
            const { data: dbResults } = await supabase.from('exam_results').select('*');
            if (dbResults && dbResults.length > 0) {
                const formattedResults = dbResults.map((r: any) => ({
                    id: r.id,
                    examId: r.exam_id,
                    studentId: r.student_id,
                    answers: r.answers,
                    totalScore: r.total_score,
                    gradedAt: r.graded_at,
                    securityFlags: r.security_flags
                }));
                set(state => {
                    const existingIds = new Set(state.results.map(x => x.id));
                    const newResults = formattedResults.filter((x: any) => !existingIds.has(x.id));
                    return { results: [...state.results, ...newResults] };
                });
            }

            console.log("✅ Dados sincronizados!");
        } catch (e) {
            console.error("Erro no loadRemoteData:", e);
        }
    },

    // --- AÇÕES DE ESCRITA (Mantidas igual) ---
    addItem: async (item) => {
        set((state) => ({ items: [...state.items, item] }));
        try {
            await supabase.from('items').insert({
                id: item.id,
                tenant_id: item.tenantId,
                subject: item.subject,
                statement: item.statement,
                type: item.type,
                difficulty: item.difficulty,
                alternatives: item.alternatives,
                correct_justification: item.correctAnswerJustification,
                bncc_code: item.bnccCode,
                origin: item.origin
            });
        } catch (e) { console.error(e); }
    },

    addExam: async (exam) => {
        set((state) => ({ exams: [...state.exams, exam] }));
        try {
            await supabase.from('exams').insert({
                id: exam.id,
                title: exam.title,
                tenant_id: exam.tenantId,
                school_id: exam.schoolId,
                subject: exam.subject,
                status: exam.status,
                items_config: exam.items,
                class_ids: exam.classIds
            });
        } catch (e) { console.error(e); }
    },

    updateResults: async (newResults) => {
        set((state) => {
            const otherResults = state.results.filter(r =>
                !newResults.some(nr => nr.examId === r.examId && nr.studentId === r.studentId)
            );
            return { results: [...otherResults, ...newResults] };
        });

        try {
            const dbPayload = newResults.map(r => ({
                id: r.id,
                exam_id: r.examId,
                student_id: r.studentId,
                answers: r.answers,
                total_score: r.totalScore,
                graded_at: r.gradedAt,
                security_flags: r.securityFlags || []
            }));
            await supabase.from('exam_results').upsert(dbPayload);
        } catch (e) { console.error(e); }
    },

    addGamifiedEvent: async (event) => {
        set((state) => ({ gamifiedEvents: [...state.gamifiedEvents, event] }));
        try {
            await supabase.from('gamified_events').insert({
                id: event.id,
                school_id: event.schoolId,
                title: event.title,
                type: event.type,
                status: event.status,
                participants: event.participants,
                reward_coins: event.rewardCoins,
                event_date: event.eventDate
            });
        } catch (e) { console.error("Sync Error (Event)", e); }
    },

    // Ações Locais (Mock ou menos críticas para demo de DB)
    addSchool: async (school) => {
        set((state) => ({ schools: [...state.schools, school] }));
        try {
            await supabase.from('schools').insert({
                id: school.id,
                tenant_id: school.tenantId,
                name: school.name,
                inep: school.inep,
                resources: school.resources
            });
        } catch (e) { console.error(e); }
    },
    addClass: async (cls) => {
        set((state) => ({ classes: [...state.classes, cls] }));
        try {
            await supabase.from('classes').insert({
                id: cls.id,
                school_id: cls.schoolId,
                name: cls.name,
                series: cls.series,
                shift: cls.shift
            });
        } catch (e) { console.error(e); }
    },
    addStudent: async (student) => {
        set((state) => ({ students: [...state.students, student] }));
        try {
            await supabase.from('students').insert({
                id: student.id,
                name: student.name,
                registration_number: student.registrationNumber,
                class_id: student.classId,
                school_id: student.schoolId,
                tenant_id: student.tenantId
            });
        } catch (e) { console.error(e); }
    },
    addUser: async (user) => {
        set((state) => ({ users: [...state.users, user] }));
        try {
            // Nota: Em prod, criaríamos o Auth User via Edge Function, aqui salvamos o perfil
            await supabase.from('users').insert({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_id: user.tenantId,
                school_id: user.schoolId
            });
        } catch (e) { console.error(e); }
    },
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
    addAnnouncement: (anc) => set((state) => ({ announcements: [anc, ...state.announcements] })),
    deleteAnnouncement: (id) => set((state) => ({ announcements: state.announcements.filter(a => a.id !== id) })),
    deleteMessage: (id) => set((state) => ({ messages: state.messages.filter(m => m.id !== id) })),
    addLessonPlan: (plan) => set((state) => ({ lessonPlans: [...state.lessonPlans, plan] })),
    addStudyPlan: (plan) => set((state) => ({ studyPlans: [...state.studyPlans, plan] })),
    updateStudyPlan: (plan) => set((state) => ({
        studyPlans: state.studyPlans.map(p => p.id === plan.id ? plan : p)
    })),
    updateGamifiedEvent: (event) => set((state) => ({
        gamifiedEvents: state.gamifiedEvents.map(e => e.id === event.id ? event : e)
    })),
    registerStudentToEvent: (eventId, studentId) => set((state) => ({
        gamifiedEvents: state.gamifiedEvents.map(e => {
            if (e.id === eventId) {
                if (e.participants.some(p => p.studentId === studentId)) return e;
                return {
                    ...e,
                    participants: [...e.participants, { studentId, status: 'INSCRITO', score: 0 }]
                };
            }
            return e;
        })
    }))
}));
