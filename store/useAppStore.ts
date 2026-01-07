
import { create } from 'zustand';
import { AppState, User, Item, Exam, ExamResult, ChatMessage, ChatGroup, Announcement, LessonPlan, StudyPlan, UserProfileExtended, AppSettings, PermissionMatrix, UserRole, GamifiedEvent, OwlTutorContext, MentorshipRequest, MentorshipStatus, ExamRegistration, RegistrationStatus } from '../types';
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
    updateUser: (user: User) => void; // Admin action
    resetUserPassword: (email: string) => Promise<void>; // Admin action
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

    // --- MENTORSHIP ACTIONS ---
    addMentorshipRequest: (request: MentorshipRequest) => void;
    acceptMentorshipRequest: (requestId: string, mentorId: string, mentorName: string) => void;
    confirmMentorship: (requestId: string, pinInput: string) => boolean; // Returns true if PIN matches
    setHasConsented: (hasConsented: boolean) => void;
    setOwlTutorContext: (context: OwlTutorContext | null) => void;
}

type AppStore = AppState & AppActions;

// Check if mock data should be used
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

console.log('🎲 Mock Data Mode:', USE_MOCK_DATA ? 'ENABLED (using mock data)' : 'DISABLED (Supabase only)');

export const useAppStore = create<AppStore>((set, get) => ({
    currentUser: null,
    selectedChildId: null,
    tenants: USE_MOCK_DATA ? INITIAL_TENANTS : [],
    schools: USE_MOCK_DATA ? INITIAL_SCHOOLS : [],
    classes: USE_MOCK_DATA ? INITIAL_CLASSES : [],
    users: USE_MOCK_DATA ? INITIAL_USERS : [],
    students: USE_MOCK_DATA ? INITIAL_STUDENTS : [],
    items: USE_MOCK_DATA ? INITIAL_ITEMS : [],
    exams: USE_MOCK_DATA ? INITIAL_EXAMS : [],
    registrations: USE_MOCK_DATA ? INITIAL_REGISTRATIONS : [],
    results: USE_MOCK_DATA ? INITIAL_RESULTS : [],
    events: [],
    gamifiedEvents: USE_MOCK_DATA ? INITIAL_GAMIFIED_EVENTS : [],
    announcements: USE_MOCK_DATA ? INITIAL_ANNOUNCEMENTS : [],
    messages: USE_MOCK_DATA ? INITIAL_MESSAGES : [],
    chatGroups: [],
    owlSessions: [],
    owlTutorContext: null,
    lessonPlans: USE_MOCK_DATA ? INITIAL_LESSON_PLANS : [],
    studyPlans: USE_MOCK_DATA ? INITIAL_STUDY_PLANS : [],
    studentProfiles: USE_MOCK_DATA ? INITIAL_STUDENT_PROFILES : [],
    userProfiles: USE_MOCK_DATA ? INITIAL_USER_PROFILES : [],
    settings: USE_MOCK_DATA ? INITIAL_SETTINGS : INITIAL_SETTINGS, // Always use settings
    globalPermissions: DEFAULT_PERMISSIONS,
    isInitialized: false,
    hasConsented: false,

    setHasConsented: (val) => set({ hasConsented: val }),
    setOwlTutorContext: (ctx) => set({ owlTutorContext: ctx }),

    setCurrentUser: (user) => set({ currentUser: user, selectedChildId: null }),
    setSelectedChildId: (childId) => set({ selectedChildId: childId }),

    // --- CARREGAMENTO DO SUPABASE (Sincronização) ---
    loadRemoteData: async () => {
        console.log("🔄 Sincronizando dados com a nuvem...");
        try {
            // -1. Carregar Tenants e Escolas (CRÍTICO para evitar white screen)
            const { data: dbTenants } = await supabase.from('tenants').select('*');
            if (dbTenants && dbTenants.length > 0) {
                set({ tenants: dbTenants });
            }

            const { data: dbSchools } = await supabase.from('schools').select('*');
            if (dbSchools && dbSchools.length > 0) {
                set({ schools: dbSchools });
            }

            // 0. Carregar Usuários (Users)
            const { data: dbUsers } = await supabase.from('users').select('*');
            if (dbUsers && dbUsers.length > 0) {
                const formattedUsers: User[] = dbUsers.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    tenantId: u.tenant_id,
                    schoolId: u.school_id,
                    childrenIds: u.children_ids || [],
                    status: u.status
                }));

                set(state => {
                    const existingIds = new Set(state.users.map(x => x.id));
                    const newUsers = formattedUsers.filter((x: any) => !existingIds.has(x.id));
                    return { users: [...state.users, ...newUsers] };
                });
            }

            // 0.1 Carregar Estudantes (Students)
            const { data: dbStudents } = await supabase.from('students').select('*');
            if (dbStudents && dbStudents.length > 0) {
                const formattedStudents = dbStudents.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    registrationNumber: s.registration_number,
                    classId: s.class_id,
                    schoolId: s.school_id,
                    tenantId: s.tenant_id
                }));
                set(state => {
                    const existingIds = new Set(state.students.map(x => x.id));
                    const newStudents = formattedStudents.filter((x: any) => !existingIds.has(x.id));
                    return { students: [...state.students, ...newStudents] };
                });
            }

            // 1. Carregar Items
            const { data: dbItems } = await supabase.from('items').select('*');
            if (dbItems && dbItems.length > 0) {
                const formattedItems: Item[] = dbItems.map((i: any) => ({
                    id: i.id,
                    tenantId: i.tenant_id,
                    ownerId: i.owner_id || '',
                    subject: i.subject,
                    knowledgeArea: i.knowledge_area || i.subject,
                    statement: i.statement,
                    type: i.type,
                    difficulty: i.difficulty,
                    alternatives: i.alternatives,
                    correctAnswerJustification: i.correct_justification,
                    bnccCode: i.bncc_code,
                    origin: i.origin,
                    score: i.score || 1.0,
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
                const formattedExams: Exam[] = dbExams.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    tenantId: e.tenant_id,
                    schoolId: e.school_id,
                    creatorId: e.creator_id || '',
                    subject: e.subject,
                    status: e.status,
                    items: e.items_config,
                    classIds: e.class_ids,
                    model: e.model || 'SOMATIVO',
                    durationMinutes: e.duration_minutes || 60,
                    targetQuestionCount: e.target_question_count || 10,
                    scheduledDate: e.scheduled_date,
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

            console.log("✅ Dados da nuvem sincronizados (users, items, exams, results).");
            set({ isInitialized: true });
        } catch (error) {
            console.error("❌ Erro ao sincronizar dados:", error);
            // Mesmo com erro, marcamos como inicializado para não bloquear o app
            set({ isInitialized: true });
        }
    },

    // --- AÇÕES DE ESCRITA (Com Persistência Supabase + Error Handling) ---
    addItem: async (item) => {
        // 1. Optimistic update
        set((state) => ({ items: [...state.items, item] }));

        // 2. Persist to Supabase
        try {
            const { error } = await supabase.from('items').insert({
                id: item.id,
                tenant_id: item.tenantId,
                owner_id: item.ownerId,
                subject: item.subject,
                knowledge_area: item.knowledgeArea || item.subject,
                statement: item.statement,
                type: item.type,
                difficulty: item.difficulty,
                alternatives: item.alternatives,
                correct_justification: item.correctAnswerJustification,
                bncc_code: item.bnccCode,
                origin: item.origin,
                score: item.score || 1.0,
                created_at: item.createdAt
            });

            if (error) {
                console.error('❌ Error saving item to Supabase:', error);
                // 3. Rollback on error
                set((state) => ({
                    items: state.items.filter(i => i.id !== item.id)
                }));
                throw error;
            }
            console.log('✅ Item saved successfully:', item.id);
        } catch (e) {
            console.error('Failed to persist item:', e);
        }
    },

    addExam: async (exam) => {
        // 1. Optimistic update
        set((state) => ({ exams: [...state.exams, exam] }));

        // 2. Persist to Supabase
        try {
            const { error } = await supabase.from('exams').insert({
                id: exam.id,
                title: exam.title,
                tenant_id: exam.tenantId,
                school_id: exam.schoolId,
                creator_id: exam.creatorId,
                subject: exam.subject,
                status: exam.status,
                items_config: exam.items,
                class_ids: exam.classIds,
                model: exam.model,
                duration_minutes: exam.durationMinutes,
                target_question_count: exam.targetQuestionCount,
                scheduled_date: exam.scheduledDate,
                created_at: exam.createdAt
            });

            if (error) {
                console.error('❌ Error saving exam to Supabase:', error);
                // 3. Rollback on error
                set((state) => ({
                    exams: state.exams.filter(e => e.id !== exam.id)
                }));
                throw error;
            }
            console.log('✅ Exam saved successfully:', exam.id);
        } catch (e) {
            console.error('Failed to persist exam:', e);
        }
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

    // Ações Locais (Com persistência aprimorada)
    addSchool: async (school) => {
        set((state) => ({ schools: [...state.schools, school] }));
        try {
            const { error } = await supabase.from('schools').insert({
                id: school.id,
                tenant_id: school.tenantId,
                name: school.name,
                inep: school.inep,
                resources: school.resources
            });
            if (error) {
                console.error('❌ Error saving school:', error);
                set((state) => ({ schools: state.schools.filter(s => s.id !== school.id) }));
                throw error;
            }
            console.log('✅ School saved:', school.id);
        } catch (e) { console.error(e); }
    },
    addClass: async (cls) => {
        set((state) => ({ classes: [...state.classes, cls] }));
        try {
            const { error } = await supabase.from('classes').insert({
                id: cls.id,
                school_id: cls.schoolId,
                name: cls.name,
                series: cls.series,
                shift: cls.shift,
                teacher_id: cls.teacherId
            });
            if (error) {
                console.error('❌ Error saving class:', error);
                set((state) => ({ classes: state.classes.filter(c => c.id !== cls.id) }));
                throw error;
            }
            console.log('✅ Class saved:', cls.id);
        } catch (e) { console.error(e); }
    },
    addStudent: async (student) => {
        set((state) => ({ students: [...state.students, student] }));
        try {
            const { error } = await supabase.from('students').insert({
                id: student.id,
                name: student.name,
                registration_number: student.registrationNumber,
                class_id: student.classId,
                school_id: student.schoolId,
                tenant_id: student.tenantId
            });
            if (error) {
                console.error('❌ Error saving student:', error);
                set((state) => ({ students: state.students.filter(s => s.id !== student.id) }));
                throw error;
            }
            console.log('✅ Student saved:', student.id);
        } catch (e) { console.error(e); }
    },
    addUser: async (user) => {
        set((state) => ({ users: [...state.users, user] }));
        try {
            const { error } = await supabase.from('users').insert({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_id: user.tenantId,
                school_id: user.schoolId || null,
                children_ids: user.childrenIds || []
                // Removed 'status' field - doesn't exist in Supabase schema
            });
            if (error) {
                console.error('❌ Error saving user:', error);
                set((state) => ({ users: state.users.filter(u => u.id !== user.id) }));
                throw error;
            }
            console.log('✅ User saved:', user.id);
        } catch (e) { console.error(e); }
    },
    updateUser: async (user) => {
        set((state) => ({
            users: state.users.map(u => u.id === user.id ? user : u)
        }));
        try {
            await supabase.from('users').update({
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }).eq('id', user.id);
        } catch (e) { console.error(e); }
    },
    resetUserPassword: async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/update-password',
            });
            if (error) throw error;
            alert(`Email de redefinição enviado para ${email}`);
        } catch (e: any) {
            console.error(e);
            alert("Erro ao enviar email: " + e.message);
        }
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
    updateUserProfile: async (profile) => {
        const stateBackup = useAppStore.getState().userProfiles;
        const otherProfiles = stateBackup.filter(p => p.userId !== profile.userId);
        set({ userProfiles: [...otherProfiles, profile] });

        try {
            const { error } = await supabase.from('user_profiles').upsert({
                user_id: profile.userId,
                owl_coins: profile.owlCoins,
                xp: profile.xp,
                badges: profile.badges,
                inventory: profile.inventory,
                equipped_items: profile.equippedItems,
                academic_achievements: profile.academicAchievements
            });
            if (error) {
                console.error('❌ Error saving user profile:', error);
                set({ userProfiles: stateBackup });
                throw error;
            }
            console.log('✅ User profile saved:', profile.userId);
        } catch (e) { console.error(e); }
    },
    updateExamAllocation: (examId, classIds) => set((state) => {
        const newRegistrations = [...state.registrations];
        const filteredRegistrations = newRegistrations.filter(r => r.examId !== examId);
        const studentsToRegister: any[] = [];
        classIds.forEach(cId => {
            const classStudents = state.students.filter(s => s.classId === cId);
            studentsToRegister.push(...classStudents);
        });
        const freshRegistrations: ExamRegistration[] = studentsToRegister.map(s => ({
            id: Math.random().toString(36).substr(2, 9),
            examId,
            studentId: s.id,
            classId: s.classId,
            status: RegistrationStatus.INSCRITO
        }));
        return {
            exams: state.exams.map(e => e.id === examId ? { ...e, classIds } : e),
            registrations: [...filteredRegistrations, ...freshRegistrations]
        };
    }),
    addAnnouncement: async (anc) => {
        set((state) => ({ announcements: [anc, ...state.announcements] }));
        try {
            const { error } = await supabase.from('announcements').insert({
                id: anc.id,
                title: anc.title,
                content: anc.content,
                author_id: anc.authorId,
                school_id: anc.schoolId,
                priority: anc.priority,
                created_at: anc.createdAt
            });
            if (error) {
                console.error('❌ Error saving announcement:', error);
                set((state) => ({ announcements: state.announcements.filter(a => a.id !== anc.id) }));
                throw error;
            }
            console.log('✅ Announcement saved:', anc.id);
        } catch (e) { console.error(e); }
    },
    deleteAnnouncement: async (id) => {
        const stateBackup = useAppStore.getState().announcements;
        set((state) => ({ announcements: state.announcements.filter(a => a.id !== id) }));
        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) {
                console.error('❌ Error deleting announcement:', error);
                set({ announcements: stateBackup });
                throw error;
            }
            console.log('✅ Announcement deleted:', id);
        } catch (e) { console.error(e); }
    },
    deleteMessage: async (id) => {
        const stateBackup = useAppStore.getState().messages;
        set((state) => ({ messages: state.messages.filter(m => m.id !== id) }));
        try {
            const { error } = await supabase.from('messages').delete().eq('id', id);
            if (error) {
                console.error('❌ Error deleting message:', error);
                set({ messages: stateBackup });
                throw error;
            }
            console.log('✅ Message deleted:', id);
        } catch (e) { console.error(e); }
    },
    addLessonPlan: async (plan) => {
        set((state) => ({ lessonPlans: [...state.lessonPlans, plan] }));
        try {
            await supabase.from('lesson_plans').insert({
                id: plan.id,
                professor_id: plan.professorId,
                class_id: plan.classId,
                subject: plan.subject,
                topic: plan.topic,
                objectives: plan.objectives,
                content: plan.content,
                date: plan.date
            });
        } catch (e) {
            console.error("Error saving lesson plan:", e);
        }
    },
    addStudyPlan: async (plan) => {
        set((state) => ({ studyPlans: [...state.studyPlans, plan] }));
        try {
            await supabase.from('study_plans').insert({
                id: plan.id,
                student_id: plan.studentId,
                title: plan.title,
                generated_by: plan.generatedBy,
                created_at: plan.createdAt,
                tasks: plan.tasks
            });
        } catch (e) {
            console.error("Error saving study plan:", e);
        }
    },
    updateStudyPlan: async (plan) => {
        set((state) => ({
            studyPlans: state.studyPlans.map(p => p.id === plan.id ? plan : p)
        }));
        try {
            await supabase.from('study_plans').update({
                title: plan.title,
                tasks: plan.tasks
            }).eq('id', plan.id);
        } catch (e) {
            console.error("Error updating study plan:", e);
        }
    },
    updateGamifiedEvent: (event) => set((state) => ({
        gamifiedEvents: state.gamifiedEvents.map(e => e.id === event.id ? event : e)
    })),
    registerStudentToEvent: async (eventId, studentId) => {
        const stateBackup = useAppStore.getState().gamifiedEvents;

        set((state) => ({
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
        }));

        try {
            const { error } = await supabase.from('event_participants').insert({
                event_id: eventId,
                student_id: studentId,
                status: 'INSCRITO',
                score: 0
            });

            if (error) {
                console.error('❌ Error registering student to event:', error);
                set({ gamifiedEvents: stateBackup });
                throw error;
            }
            console.log('✅ Student registered to event:', eventId, studentId);
        } catch (e) { console.error(e); }
    },

    // --- MENTORSHIP IMPL ---
    mentorships: [], // Init empty
    addMentorshipRequest: async (req) => {
        set(state => ({ mentorships: [req, ...state.mentorships] }));
        try {
            const { error } = await supabase.from('mentorship_requests').insert({
                id: req.id,
                student_id: req.studentId,
                student_name: req.studentName,
                subject: req.subject,
                description: req.description,
                status: req.status,
                created_at: req.createdAt
            });
            if (error) {
                console.error('❌ Error saving mentorship request:', error);
                set(state => ({ mentorships: state.mentorships.filter(m => m.id !== req.id) }));
                throw error;
            }
            console.log('✅ Mentorship request saved:', req.id);
        } catch (e) { console.error(e); }
    },
    acceptMentorshipRequest: async (reqId, mentorId, mentorName) => {
        const verificationPin = Math.floor(1000 + Math.random() * 9000).toString();
        const stateBackup = useAppStore.getState().mentorships;

        set(state => ({
            mentorships: state.mentorships.map(m =>
                m.id === reqId
                    ? { ...m, status: MentorshipStatus.IN_PROGRESS, mentorId, mentorName, verificationPin }
                    : m
            )
        }));

        try {
            const { error } = await supabase.from('mentorship_requests').update({
                status: MentorshipStatus.IN_PROGRESS,
                mentor_id: mentorId,
                mentor_name: mentorName,
                verification_pin: verificationPin
            }).eq('id', reqId);

            if (error) {
                console.error('❌ Error accepting mentorship:', error);
                set({ mentorships: stateBackup });
                throw error;
            }
            console.log('✅ Mentorship accepted:', reqId);
        } catch (e) { console.error(e); }
    },
    confirmMentorship: (reqId, pinInput) => {
        let success = false;
        set(state => {
            const mentorship = state.mentorships.find(m => m.id === reqId);
            if (mentorship && mentorship.verificationPin === pinInput) {
                success = true;
                // Award XP logic would go here (updateUserProfile)
                return {
                    mentorships: state.mentorships.map(m => m.id === reqId ? { ...m, status: MentorshipStatus.COMPLETED } : m)
                };
            }
            return state;
        });
        return success;
    }
}));
