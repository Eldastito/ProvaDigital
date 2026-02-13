import { operationalHealthService } from '../services/operationalHealthService';
import { create } from 'zustand';
import {
    AppState, Exam, Item, ExamModel, ExamStatus, QuestionType, DifficultyLevel,
    ItemOrigin, UserRole, User, AppSettings, PermissionMatrix, ChatMessage,
    ChatGroup, Announcement, LessonPlan, StudyPlan, GamifiedEvent, ExamResult, Student,
    MentorshipRequest, MentorshipStatus, OwlTutorContext, ItemGenerationBatch,
    ItemLifecycleStatus, ExamVersion, ExamVariant, Tenant, School, SchoolClass,
    UserProfileExtended, ExamRegistration, RegistrationStatus,
    ExamAttempt, ExamAttemptEvent, AuditLog, ArcadeGame, ExamVariantOverride,
    LiveQuizSession, LiveQuizParticipant, LiveQuizResult,
    LogisticsSuitcase, SuitcaseStatus, TabletLogistics, LogisticsAuditEntry
} from '../types';
import { uuidv4 } from '../utils/helpers';
import { INITIAL_TENANTS, INITIAL_SCHOOLS, INITIAL_CLASSES, INITIAL_USERS, INITIAL_ITEMS, INITIAL_STUDENTS, INITIAL_RESULTS, INITIAL_EXAMS, INITIAL_REGISTRATIONS, INITIAL_ANNOUNCEMENTS, INITIAL_MESSAGES, INITIAL_LESSON_PLANS, INITIAL_STUDY_PLANS, INITIAL_STUDENT_PROFILES, INITIAL_USER_PROFILES, INITIAL_SETTINGS, INITIAL_GAMIFIED_EVENTS } from '../utils/mockData';
import { supabase } from '../services/supabaseClient';
import { userMigrationService } from '../services/userMigrationService';
import { enrollmentService } from '../services/enrollmentService';

// OTIMIZAÇÃO HIERÁRQUICA DE PERMISSÕES - [Deploy Trigger: 2026-01-11]
const DEFAULT_PERMISSIONS: PermissionMatrix = {
    [UserRole.SYSTEM_ADMIN]: {
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
        SCHEDULING: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        COMMAND_CENTER: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        REPORTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        SYSTEM_MGMT: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        TENANT_MGMT: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        SaaS_BILLING: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        PLATFORM_HEALTH: ['VIEW', 'CREATE', 'EDIT', 'DELETE']
    },
    [UserRole.SUPER_ADMIN]: {
        SCHOOL_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        ITEM_BANK: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        EXAM_MGMT: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        OFFLINE_OPS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        ANALYTICS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        AI_FEATURES: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        NEURO_SCREENING: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        SCHEDULING: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        COMMAND_CENTER: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
        REPORTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE']
    },
    [UserRole.ALUNO]: {
        SCHOOL_DATA: ['VIEW'],
        USER_DATA: ['VIEW'],
        ITEM_BANK: [],
        EXAM_MGMT: ['VIEW'],
        OFFLINE_OPS: [],
        ANALYTICS: ['VIEW'],
        COMMUNICATION: ['VIEW', 'CREATE'],
        AI_FEATURES: [],
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
    [UserRole.STATE_ADMIN]: { SCHOOL_DATA: ['VIEW'], USER_DATA: ['VIEW'], ITEM_BANK: ['VIEW'], EXAM_MGMT: [], OFFLINE_OPS: [], ANALYTICS: ['VIEW', 'CREATE', 'EDIT'], COMMUNICATION: ['VIEW', 'CREATE'], AI_FEATURES: ['VIEW'], FINANCIAL: ['VIEW'], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW'], SCHEDULING: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], COMMAND_CENTER: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], REPORTS: ['VIEW', 'CREATE'] },
    [UserRole.TENANT_ADMIN]: { SCHOOL_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], ITEM_BANK: [], EXAM_MGMT: [], OFFLINE_OPS: [], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], AI_FEATURES: ['VIEW'], FINANCIAL: [], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW'], SCHEDULING: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], COMMAND_CENTER: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], REPORTS: ['VIEW', 'CREATE'] },
    [UserRole.DIRETOR]: { SCHOOL_DATA: ['VIEW', 'EDIT'], USER_DATA: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], ITEM_BANK: ['VIEW'], EXAM_MGMT: ['VIEW'], OFFLINE_OPS: ['VIEW'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], AI_FEATURES: ['VIEW'], FINANCIAL: [], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT'], SCHEDULING: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], COMMAND_CENTER: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], REPORTS: ['VIEW', 'CREATE'] },
    [UserRole.SUPERVISOR]: { SCHOOL_DATA: ['VIEW'], USER_DATA: ['VIEW'], ITEM_BANK: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], EXAM_MGMT: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], OFFLINE_OPS: ['VIEW', 'CREATE'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE'], AI_FEATURES: ['VIEW', 'CREATE'], FINANCIAL: [], NEURO_SCREENING: ['VIEW'], GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT'], SCHEDULING: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], COMMAND_CENTER: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], REPORTS: ['VIEW'] },
    [UserRole.PROFESSOR]: { SCHOOL_DATA: ['VIEW'], USER_DATA: ['VIEW'], ITEM_BANK: ['VIEW', 'CREATE'], EXAM_MGMT: ['VIEW', 'CREATE'], OFFLINE_OPS: ['VIEW', 'CREATE', 'EDIT'], ANALYTICS: ['VIEW'], COMMUNICATION: ['VIEW', 'CREATE'], AI_FEATURES: ['VIEW', 'CREATE'], FINANCIAL: [], NEURO_SCREENING: [], GAMIFIED_EVENTS: ['VIEW', 'CREATE', 'EDIT', 'DELETE'], SCHEDULING: ['VIEW'], COMMAND_CENTER: ['VIEW'], REPORTS: ['VIEW'] }
};

interface AppActions {
    setCurrentUser: (user: User | null) => void;
    initIdentity: () => Promise<void>; // Phase 9
    setSelectedChildId: (childId: string | null) => void;
    loadRemoteData: () => Promise<void>; // NOVA AÇÃO DE CARGA
    addItem: (item: Item) => void;
    addItems: (items: Item[]) => Promise<void>;
    updateItem: (item: Item) => Promise<void>;
    updateItemWithVersion: (itemId: string, updates: Partial<Item>, changeReason: string) => Promise<void>;
    addExam: (exam: Exam) => void;
    deleteExam: (examId: string) => Promise<void>; // Added
    // Live Quiz Actions
    addLiveQuizSession: (session: LiveQuizSession) => Promise<void>;
    updateLiveQuizSession: (sessionId: string, updates: Partial<LiveQuizSession>) => Promise<void>;
    deleteLiveQuizSession: (sessionId: string) => Promise<void>;
    fetchLiveQuizSessions: () => Promise<void>;
    addSchool: (school: School) => Promise<void>;
    updateSchool: (school: School) => Promise<void>;
    deleteSchool: (schoolId: string) => Promise<void>; // Added
    addClass: (cls: SchoolClass) => Promise<void>;
    updateClass: (cls: SchoolClass) => Promise<void>; // Added
    deleteClass: (classId: string) => Promise<void>; // Added
    addStudent: (student: Student) => Promise<void>;
    updateStudent: (student: Student) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>; // Added
    addUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>; // Added
    updateSettings: (settings: AppSettings) => void;
    updatePermissions: (matrix: PermissionMatrix) => void;
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
    // --- AI ACTIONS ---
    addGenerationBatch: (batch: ItemGenerationBatch) => Promise<void>;
    approveAllItemsInBatch: (batchId: string) => Promise<number>;
    approveOneItem: (itemId: string) => Promise<void>;
    discardOneItem: (itemId: string) => Promise<void>;
    setActiveBatchId: (id: string | null) => void;
    addExamVariant: (variant: ExamVariant) => Promise<void>;
    saveOverride: (override: ExamVariantOverride) => Promise<void>;
    loadExamVariants: (examId: string) => Promise<void>;
    loadGenerationBatches: () => Promise<void>;

    // --- BULK ACTIONS ---
    removeItems: (ids: string[]) => Promise<void>;
    bulkAddTag: (ids: string[], tag: string) => Promise<void>;
    forceFetchBatchItems: (batchId: string) => Promise<Item[] | void>;
    deleteGenerationBatch: (batchId: string) => Promise<void>;

    // --- PHASE 3 ACTIONS ---
    startExamAttempt: (attempt: { examId: string; examVersionId: string; studentId: string }) => Promise<string>;
    logSecurityEvent: (event: { attemptId: string; eventType: string; severity: string; eventData?: any }) => Promise<void>;
    submitExamAttempt: (attemptId: string, status: 'submitted' | 'timed_out') => Promise<void>;
    reopenExamAttempt: (attemptId: string) => Promise<void>;
    saveExamProgress: (attemptId: string, answers: Record<string, string>, metadata?: any) => Promise<void>;

    // --- PHASE 4 ACTIONS ---
    calculateAndSaveResult: (attemptId: string, answers: any[]) => Promise<void>;
    getRecommendedVariant: (studentId: string, versionId: string) => Promise<string | null>;

    // --- PHASE 5: ADMIN & BI ---
    updateTenantFeatures: (tenantId: string, features: any) => Promise<void>;
    addTenant: (tenant: Tenant) => Promise<void>;
    fetchAuditLogs: (tenantId: string) => Promise<AuditLog[]>;
    loadTenants: () => Promise<void>;

    // --- PHASE 6: ARCADE GAMES ---
    loadArcadeGames: () => Promise<void>;
    distributeOECDExam: (examId: string) => Promise<void>;
    addArcadeGame: (game: ArcadeGame) => Promise<void>;
    updateArcadeGame: (game: ArcadeGame) => Promise<void>;
    deleteArcadeGame: (id: string) => Promise<void>;

    // --- PHASE 7: SCALABILITY ---
    fetchExamItems: (examId: string) => Promise<void>;
    fetchNetworkExams: () => Promise<void>; // 🌐 Buscar provas públicas

    // --- PHASE 8: ENCRYPTION ---
    sealExam: (examId: string) => Promise<any>;
    // --- REALTIME ---
    initializeExamEvents: (examId: string) => void;
    leaveExamChannel: () => Promise<void>;

    // --- EXAM BUILDER V2 ---
    addExamVersion: (version: ExamVersion) => Promise<void>;
    broadcastEvent: (type: string, payload: any) => Promise<void>;

    // --- PHASE 9: AI REFINEMENTS ---
    updatePedagogicalFeedback: (resultId: string, feedback: string) => Promise<void>;

    // --- LOGISTICS ACTIONS ---
    addLogisticsSuitcase: (suitcase: LogisticsSuitcase) => Promise<void>;
    updateSuitcaseStatus: (id: string, status: SuitcaseStatus) => Promise<void>;
    logTabletMovement: (serialId: string, suitcaseId: string, action: 'CHECK_IN' | 'CHECK_OUT', actorId: string) => Promise<void>;
    loadLogisticsData: () => Promise<void>;

    // --- UI/THEME ACTIONS ---
    toggleTheme: () => void;
}

export type AppStore = AppState & AppActions;

// Check if mock data should be used
const PRODUCTION_MODE = import.meta.env.VITE_PRODUCTION_MODE === 'true';
const USE_MOCK_DATA = !PRODUCTION_MODE && import.meta.env.VITE_USE_MOCK_DATA === 'true';

console.log('🚀 Mode:', PRODUCTION_MODE ? 'PRODUCTION (Real Data Only)' : 'DEVELOPMENT');
console.log('🎲 Mock Data:', USE_MOCK_DATA ? 'ENABLED' : 'DISABLED');

// Helper for Auto-Adaptation (Module Scope)
const checkAndTriggerAdaptation = async (exam: Exam, classIds: string[], state: AppState, actions: AppActions) => {
    console.log(`🤖 Auto-Adaptation: Checking classes [${classIds.join(', ')}] for special needs...`);

    // 1. Find Students in these classes
    const studentsInClasses = state.students.filter(s => classIds.includes(s.classId));
    const studentIds = studentsInClasses.map(s => s.id);

    // 2. Find Users with Special Needs among these students
    const vulnerableUsers = state.users.filter(u =>
        studentIds.includes(u.id) &&
        u.specialNeeds &&
        u.specialNeeds.length > 0
    );

    if (vulnerableUsers.length === 0) {
        console.log("✅ No special needs detected in target classes.");
        return;
    }

    // 3. Identify distinct conditions
    const distinctConditions = new Set<string>();
    vulnerableUsers.forEach(u => u.specialNeeds?.forEach(n => distinctConditions.add(n)));

    console.log(`⚠️ Detected Conditions: ${Array.from(distinctConditions).join(', ')}`);

    // 4. Generate Variants for each condition
    for (const condition of Array.from(distinctConditions)) {
        // Check if variant already exists
        const exists = state.examVariants.some(v => v.examId === exam.id && v.conditionCode === condition);
        if (exists) {
            console.log(`⏩ Variant for ${condition} already exists. Skipping.`);
            continue;
        }

        console.log(`✨ Generating AI Variant for condition: ${condition}...`);

        // Generate Adapted Items (Async)
        const adaptedItems: any[] = [];
        for (const itemConfig of exam.items) {
            const originalItem = state.items.find(i => i.id === itemConfig.itemId);
            if (originalItem) {
                // Map internal codes to prompt profiles
                const profileMap: any = { 'TEA': 'TEA', 'TDAH': 'TDAH', 'BAIXA_VISAO': 'VISUAL' };
                const profile = profileMap[condition] || 'GERAL';

                // Call AI Service dynamically to avoid circular deps if any
                try {
                    const gemini = await import('../services/geminiService');
                    const adapted = await gemini.adaptItemForAccessibility(JSON.stringify(originalItem), profile);
                    if (adapted) {
                        adaptedItems.push({ originalId: originalItem.id, adaptedContent: adapted });
                    }
                } catch (e) {
                    console.error("AI Adaptation Failed:", e);
                }
            }
        }

        // Create Valid ExamVariant
        const newVariant: ExamVariant = {
            id: uuidv4(),
            examId: exam.id,
            name: `Adaptada - ${condition}`,
            slug: `adapt-${condition.toLowerCase()}`,
            description: `Versão gerada automaticamente por IA para alunos com ${condition}.`,
            accessibilityConfig: {
                theme: condition === 'BAIXA_VISAO' ? 'high-contrast' : 'default',
                fontSize: 120,
                extraTime: condition === 'TDAH' ? 25 : 0
            },
            conditionCode: condition,
            status: 'active',
            createdAt: new Date().toISOString(),
            variantRules: {
                adaptedItemsCount: adaptedItems.length
            }
        };

        await actions.addExamVariant(newVariant);
    }
};

export const useAppStore = create<AppStore>((set, get) => ({
    currentUser: null,
    selectedChildId: null,
    examEncryptionKey: null,
    identityKeys: null,
    tenants: USE_MOCK_DATA ? INITIAL_TENANTS : [],
    schools: USE_MOCK_DATA ? INITIAL_SCHOOLS : [],
    classes: USE_MOCK_DATA ? INITIAL_CLASSES : [],
    users: USE_MOCK_DATA ? [
        { id: 'u_system', name: 'Gestor SaaS', email: 'saas@examepad.com', role: UserRole.SYSTEM_ADMIN, tenantId: 't_system', status: 'active' },
        ...INITIAL_USERS
    ] : [],
    students: USE_MOCK_DATA ? INITIAL_STUDENTS : [],
    items: USE_MOCK_DATA ? INITIAL_ITEMS : [],
    exams: USE_MOCK_DATA ? INITIAL_EXAMS : [],
    networkExams: [], // 🌐 Inicializa vazio
    liveQuizSessions: [], // Live quiz sessions (separate from formal exams)
    examVariants: [],
    variantOverrides: [],
    registrations: USE_MOCK_DATA ? INITIAL_REGISTRATIONS : [],
    results: USE_MOCK_DATA ? INITIAL_RESULTS : [],
    events: [],
    gamifiedEvents: USE_MOCK_DATA ? INITIAL_GAMIFIED_EVENTS : [],
    arcadeGames: [],
    announcements: USE_MOCK_DATA ? INITIAL_ANNOUNCEMENTS : [],
    messages: USE_MOCK_DATA ? INITIAL_MESSAGES : [],
    chatGroups: [],
    owlSessions: [],
    owlTutorContext: null,
    lessonPlans: USE_MOCK_DATA ? INITIAL_LESSON_PLANS : [],
    studyPlans: USE_MOCK_DATA ? INITIAL_STUDY_PLANS : [],
    studentProfiles: USE_MOCK_DATA ? INITIAL_STUDENT_PROFILES : [],
    userProfiles: USE_MOCK_DATA ? INITIAL_USER_PROFILES : [],
    itemGenerationBatches: [],
    activeBatchId: null,
    examVersions: [],
    logisticsSuitcases: [],
    logisticsTablets: [],
    logisticsAudit: [],



    examAttempts: [],
    examAttemptEvents: [],
    settings: USE_MOCK_DATA ? INITIAL_SETTINGS : INITIAL_SETTINGS, // Always use settings
    globalPermissions: DEFAULT_PERMISSIONS,
    hasConsented: false,
    isInitialized: false,
    auditLogs: [],

    toggleTheme: () => {
        set((state) => {
            const newTheme = (state.settings.theme === 'light' ? 'dark' : 'light') as 'light' | 'dark';
            const updatedSettings = { ...state.settings, theme: newTheme };

            // Persist preference
            localStorage.setItem('examepad_theme', newTheme);

            // update currentUser theme too if exists
            const updatedUser = state.currentUser ? { ...state.currentUser, theme: newTheme } : null;

            return {
                settings: updatedSettings,
                currentUser: updatedUser
            } as Partial<AppStore>;
        });
    },

    setHasConsented: (val) => set({ hasConsented: val }),
    setOwlTutorContext: (ctx) => set({ owlTutorContext: ctx }),

    setCurrentUser: (user) => {
        set((state) => {
            // Se o usuário for o mesmo, não reseta a seleção do filho para evitar loop de UI
            const isSameUser = state.currentUser?.id === user?.id;
            return {
                currentUser: user,
                selectedChildId: isSameUser ? state.selectedChildId : null
            };
        });
    },
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

            const { data: dbClasses } = await supabase.from('classes').select('*');
            if (dbClasses && dbClasses.length > 0) {
                const formattedClasses: SchoolClass[] = dbClasses.map((c: any) => ({
                    id: c.id,
                    schoolId: c.school_id,
                    name: c.name,
                    series: c.series,
                    shift: c.shift,
                    room: c.room,
                    teacherId: c.teacher_id
                }));
                set({ classes: formattedClasses });
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
                    classIds: u.class_ids || [],
                    phone: u.phone,
                    registrationNumber: u.registration_number,
                    subjectIds: u.subject_ids || [],
                    status: u.status
                }));

                set(state => {
                    const existingIds = new Set(state.users.map(x => x.id));
                    const newUsers = formattedUsers.filter((x: any) => !existingIds.has(x.id));
                    return { users: [...state.users, ...newUsers] };
                });
            }

            // 0.1 Derivar Estudantes (A partir de Users - SSOT)
            set(state => ({
                students: state.users
                    .filter(u => u.role === UserRole.ALUNO)
                    .map(u => ({
                        id: u.id,
                        name: u.name,
                        registrationNumber: u.registrationNumber || '',
                        classId: u.classIds?.[0] || '',
                        schoolId: u.schoolId || '',
                        tenantId: u.tenantId
                    }))
            }));

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
                    bnccCode: i.bncc_code || '',
                    origin: i.origin || ItemOrigin.MANUAL,
                    score: i.score || 1.0,
                    tags: i.tags || [],
                    triParams: i.tri_params,
                    generationBatchId: i.generation_batch_id,
                    lifecycleStatus: i.lifecycle_status,
                    isAccessible: i.is_accessible,
                    accessibilityInstructions: i.accessibility_instructions,
                    multimedia: i.multimedia || [],
                    aiModelId: i.ai_model_id,
                    aiPromptVersion: i.ai_prompt_version,
                    aiGenerationSettings: i.ai_generation_settings,
                    reviewerId: i.reviewer_id,
                    reviewedAt: i.reviewed_at,
                    usageCount: 0,
                    createdAt: i.created_at
                }));
                // Mescla com mocks se não estiver em produção
                set(state => {
                    const itemMap = new Map(formattedItems.map(i => [i.id, i]));

                    if (!PRODUCTION_MODE) {
                        const demoItems = INITIAL_ITEMS.filter(i =>
                            i.id.startsWith('sim_') || i.tags?.some(t => t.startsWith('TRI_'))
                        );
                        demoItems.forEach(item => {
                            if (!itemMap.has(item.id)) {
                                itemMap.set(item.id, item);
                            }
                        });
                    }

                    return { items: Array.from(itemMap.values()) };
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
                    classIds: e.class_ids || [],
                    model: e.model || 'SOMATIVO',
                    durationMinutes: e.duration_minutes || 60,
                    targetQuestionCount: e.target_question_count || 10,
                    scheduledDate: e.scheduled_date,
                    maxScore: e.max_score || 100, // Default to 100
                    createdAt: e.created_at
                }));
                set(state => {
                    const existingIds = new Set(state.exams.map(x => x.id));

                    if (!PRODUCTION_MODE) {
                        const demoExams = INITIAL_EXAMS.filter(e =>
                            e.id === 'e_adapt_1' || e.id === 'e_sim_1'
                        );
                        const allNewExams = [...formattedExams, ...demoExams];
                        const newExams = allNewExams.filter((x: any) => !existingIds.has(x.id));
                        return { exams: [...state.exams, ...newExams] };
                    }

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

            // 4. Carregar Perfil Gamificado (User Profiles)
            const { data: dbProfiles, error: profileError } = await supabase.from('user_profiles').select('*');

            if (!profileError && dbProfiles && dbProfiles.length > 0) {
                const formattedProfiles: UserProfileExtended[] = dbProfiles.map((p: any) => ({
                    userId: p.user_id,
                    avatarUrl: p.avatar_url,
                    bio: p.bio,
                    owlCoins: p.owl_coins || 0,
                    xp: p.xp || 0,
                    badges: p.badges || [],
                    inventory: p.inventory || [],
                    equippedItems: p.equipped_items || {},
                    assessments: p.assessments || [],
                    academicAchievements: p.academic_achievements || []
                }));
                set({ userProfiles: formattedProfiles });
            } else {
                console.warn("⚠️ Nenhum perfil encontrado no Supabase.");
                set({ userProfiles: [] });
            }

            // --- MIGRAÇÃO DE DADOS LEGADOS ---
            const state = get();
            const { updatedUsers, updatedStudents } = await userMigrationService.syncLegacyData(
                state.users,
                state.students,
                state.tenants
            );

            if (updatedUsers.length !== state.users.length || updatedStudents.length !== state.students.length ||
                JSON.stringify(updatedUsers) !== JSON.stringify(state.users)) {
                set({ users: updatedUsers, students: updatedStudents });
                // Persistência em background para não travar o carregamento
                userMigrationService.persistMigration(updatedUsers);
            }

            //4.5 Carregar Live Quiz Sessions
            await get().fetchLiveQuizSessions();

            // 5. Carregar Arcade Games
            await get().loadArcadeGames();

            console.log("✅ Dados da nuvem sincronizados (users, items, exams, results, profiles, arcade).");
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
                statement: item.statement,
                type: item.type,
                difficulty: item.difficulty,
                alternatives: item.alternatives,
                correct_justification: item.correctAnswerJustification,
                bncc_code: item.bnccCode,
                origin: item.origin,
                score: item.score,
                tags: item.tags,
                tri_params: item.triParams,
                generation_batch_id: item.generationBatchId,
                knowledge_area: item.knowledgeArea,
                lifecycle_status: item.lifecycleStatus || 'APPROVED',
                is_accessible: item.isAccessible || false,
                accessibility_instructions: item.accessibilityInstructions || '',
                multimedia: item.multimedia || [],
                ai_model_id: item.aiModelId,
                ai_prompt_version: item.aiPromptVersion,
                ai_generation_settings: item.aiGenerationSettings,
                reviewer_id: item.reviewerId,
                reviewed_at: item.reviewedAt,
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
            throw e;
        }
    },

    addItems: async (items) => {
        // 1. Optimistic update
        set((state) => ({ items: [...items, ...state.items] }));
        if (USE_MOCK_DATA) return;
        // 2. Persist to Supabase
        try {
            const dbPayload = items.map(item => ({
                id: item.id,
                tenant_id: item.tenantId,
                owner_id: item.ownerId,
                subject: item.subject,
                statement: item.statement,
                type: item.type,
                difficulty: item.difficulty,
                alternatives: item.alternatives,
                correct_justification: item.correctAnswerJustification,
                bncc_code: item.bnccCode,
                origin: item.origin,
                score: item.score,
                tags: item.tags,
                tri_params: item.triParams,
                generation_batch_id: item.generationBatchId,
                knowledge_area: item.knowledgeArea,
                lifecycle_status: item.lifecycleStatus || 'APPROVED',
                is_accessible: item.isAccessible || false,
                accessibility_instructions: item.accessibilityInstructions || '',
                multimedia: item.multimedia || [],
                created_at: item.createdAt
            }));
            console.log('📤 Sending items to Supabase:', dbPayload);
            const { error } = await supabase.from('items').insert(dbPayload);
            if (error) {
                console.error('❌ Supabase Error Detail (items):', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                // Rollback local state
                set((state) => ({
                    items: state.items.filter(i => !items.some(ni => ni.id === i.id))
                }));
                throw error;
            }
            console.log('✅ Items saved successfully:', items.map(i => i.id));
        } catch (e) {
            console.error('Failed to persist items:', e);
            throw e;
        }
    },

    updateItem: async (item) => {
        // 1. Optimistic update
        const previousItems = get().items;
        set((state) => ({
            items: state.items.map(i => i.id === item.id ? item : i)
        }));
        // 2. Persist to Supabase
        try {
            const { error } = await supabase.from('items').update({
                subject: item.subject,
                statement: item.statement,
                type: item.type,
                difficulty: item.difficulty,
                alternatives: item.alternatives,
                correct_justification: item.correctAnswerJustification,
                bncc_code: item.bnccCode,
                tri_params: item.triParams,
                knowledge_area: item.knowledgeArea,
                tags: item.tags,
                is_accessible: item.isAccessible,
                accessibility_instructions: item.accessibilityInstructions
            }).eq('id', item.id);
            if (error) {
                console.error('❌ Error updating item in Supabase:', error);
                set({ items: previousItems }); // Rollback
                throw error;
            }
            console.log('✅ Item updated successfully:', item.id);
        } catch (e) {
            console.error('Failed to update item:', e);
            throw e;
        }
    },

    updateItemWithVersion: async (itemId, updates, changeReason) => {
        try {
            const currentItem = get().items.find(i => i.id === itemId);
            if (!currentItem) throw new Error("Item not found locally");

            // 1. Snapshot Current State
            const { data: versionData, error: vError } = await supabase.from('item_versions').insert({
                item_id: itemId,
                version_number: Math.floor(Date.now() / 1000), // Unix timestamp as naive version
                statement: currentItem.statement,
                alternatives: currentItem.alternatives,
                correct_justification: currentItem.correctAnswerJustification,
                metadata: {
                    difficulty: currentItem.difficulty,
                    tags: currentItem.tags,
                    bncc: currentItem.bnccCode
                },
                change_reason: changeReason,
                changed_by: get().currentUser?.id
            }).select().single();

            if (vError) throw vError;

            // 2. Update Head
            const { error: uError } = await supabase.from('items').update({
                ...updates,
                current_version_id: versionData.id
            }).eq('id', itemId);

            if (uError) throw uError;

            // 3. Update Local
            set(state => ({
                items: state.items.map(i => i.id === itemId ? { ...i, ...updates, currentVersionId: versionData.id } : i)
            }));

            console.log(`✅ Item ${itemId} updated with version ${versionData.id}`);
        } catch (e) {
            console.error("Error versioning item:", e);
            alert("Erro ao salvar versão. Veja o console.");
        }
    },


    removeItems: async (ids) => {
        // 1. Optimistic update
        const previousItems = get().items;
        set((state) => ({ items: state.items.filter(i => !ids.includes(i.id)) }));

        // 2. Persist to Supabase
        try {
            const { error } = await supabase.from('items').delete().in('id', ids);
            if (error) {
                console.error('❌ Error removing items from Supabase:', error);
                set({ items: previousItems }); // Rollback
                throw error;
            }
            console.log('✅ Items removed successfully:', ids.length);
        } catch (e) {
            console.error('Failed to remove items:', e);
        }
    },

    bulkAddTag: async (ids, tag) => {
        // 1. Prepare updates for local state
        const updatedItems = get().items.map(i => ids.includes(i.id)
            ? { ...i, tags: Array.from(new Set([...(i.tags || []), tag])) }
            : i);
        const previousItems = get().items;
        set({ items: updatedItems });

        // 2. Persist to Supabase (Individual updates due to array tag logic)
        try {
            const currentItems = previousItems.filter(i => ids.includes(i.id));
            const updates = currentItems.map(item => {
                const newTags = Array.from(new Set([...(item.tags || []), tag]));
                return supabase.from('items').update({ tags: newTags }).eq('id', item.id);
            });

            const results = await Promise.all(updates);
            const errors = results.filter(r => r.error);

            if (errors.length > 0) {
                console.error('❌ Errors tagging items:', errors);
                // Partial rollback or notify user? For now, we keep optimistic if it mostly worked
            }
        } catch (e) {
            console.error('Failed to bulk tag items:', e);
            set({ items: previousItems }); // Full rollback on critical failure
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
                description: exam.description,
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
                max_score: exam.maxScore,
                shuffle_items: exam.shuffleItems,
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

            // --- AUTO ADAPTATION TRIGGER ---
            if (exam.classIds && exam.classIds.length > 0) {
                // checkAndTriggerAdaptation(exam, exam.classIds, get(), get()); // This function was removed
            }

        } finally {
            // Cleanup or final logs if needed
        }
    },

    distributeOECDExam: async (examId: string) => {
        try {
            const { error } = await supabase
                .from('exams')
                .update({
                    status: 'PUBLISHED',
                    is_official_standard: true
                })
                .eq('id', examId);

            if (error) throw error;

            set(state => ({
                exams: state.exams.map(e =>
                    e.id === examId ? { ...e, status: ExamStatus.PUBLISHED, isOfficialStandard: true } : e
                )
            }));
            console.log('✅ Exam distributed to network:', examId);
        } catch (e) {
            console.error('Failed to distribute exam:', e);
            throw e;
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
    updateSchool: async (school) => {
        set((state) => ({
            schools: state.schools.map(s => s.id === school.id ? school : s)
        }));
        try {
            const { error } = await supabase.from('schools').update({
                name: school.name,
                inep: school.inep,
                resources: school.resources
            }).eq('id', school.id);

            if (error) {
                console.error('❌ Error updating school:', error);
                throw error;
            }
            console.log('✅ School updated:', school.id);
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
                room: cls.room,
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
    updateClass: async (cls) => {
        set((state) => ({
            classes: state.classes.map(c => c.id === cls.id ? cls : c)
        }));
        try {
            const { error } = await supabase.from('classes').update({
                name: cls.name,
                series: cls.series,
                shift: cls.shift,
                room: cls.room,
                teacher_id: cls.teacherId
            }).eq('id', cls.id);
            if (error) throw error;
        } catch (e) { console.error(e); }
    },
    deleteClass: async (classId) => {
        const state = get();
        await state.logSecurityEvent({
            attemptId: 'SYSTEM',
            eventType: 'CLASS_DELETE',
            severity: 'WARNING',
            eventData: { classId, deletedBy: state.currentUser?.email }
        });
        set((state) => ({ classes: state.classes.filter(c => c.id !== classId) }));
        try {
            await supabase.from('classes').delete().eq('id', classId);
        } catch (e) { console.error(e); }
    },
    addStudent: async (student) => {
        set((state) => ({ students: [...state.students, student] }));
        try {
            const { error } = await supabase.from('users').insert({
                id: student.id,
                name: student.name,
                role: UserRole.ALUNO,
                registration_number: student.registrationNumber,
                class_ids: [student.classId],
                school_id: student.schoolId,
                tenant_id: student.tenantId,
                status: 'ACTIVE'
            });
            if (error) {
                console.error('❌ Error saving student:', error);
                set((state) => ({ students: state.students.filter(s => s.id !== student.id) }));
                throw error;
            }
            console.log('✅ Student saved to users table:', student.id);
        } catch (e) { console.error(e); }
    },
    updateStudent: async (student) => {
        set((state) => ({
            students: state.students.map(s => s.id === student.id ? student : s)
        }));
        try {
            const { error } = await supabase.from('users').update({
                name: student.name,
                registration_number: student.registrationNumber,
                class_ids: [student.classId],
                school_id: student.schoolId
            }).eq('id', student.id);

            if (error) {
                console.error('❌ Error updating student in users table:', error);
                // Rollback logic could be added here
                throw error;
            }
            console.log('✅ Student updated in users table:', student.id);
        } catch (e) { console.error(e); }
    },
    deleteStudent: async (studentId) => {
        const state = get();
        await state.logSecurityEvent({
            attemptId: 'SYSTEM',
            eventType: 'STUDENT_DELETE',
            severity: 'WARNING',
            eventData: { studentId, deletedBy: state.currentUser?.email }
        });
        set((state) => ({ students: state.students.filter(s => s.id !== studentId) }));
        try {
            await supabase.from('users').delete().eq('id', studentId);
        } catch (e) { console.error(e); }
    },
    deleteSchool: async (schoolId) => {
        const state = get();
        await state.logSecurityEvent({
            attemptId: 'SYSTEM',
            eventType: 'SCHOOL_DELETE',
            severity: 'WARNING',
            eventData: { schoolId, deletedBy: state.currentUser?.email }
        });
        set((state) => ({ schools: state.schools.filter(s => s.id !== schoolId) }));
        try {
            await supabase.from('schools').delete().eq('id', schoolId);
        } catch (e) { console.error(e); }
    },
    addUser: async (user) => {
        const state = get();

        // 1. RBAC Check (Hardening)
        const canCreate = state.globalPermissions[state.currentUser?.role || '']?.USER_DATA?.includes('CREATE');
        if (!canCreate && state.currentUser?.role !== UserRole.SYSTEM_ADMIN) {
            console.error('❌ Permission Denied: User cannot create records.');
            alert('Você não tem permissão para cadastrar usuários.');
            return;
        }

        // 2. Matrícula Automática se for Aluno e não tiver
        if (user.role === UserRole.ALUNO && !user.registrationNumber) {
            const tenant = state.tenants.find(t => t.id === user.tenantId);
            user.registrationNumber = enrollmentService.generateRegistrationNumber(tenant?.type || 'PUBLIC_MUNICIPAL');
        }

        // 3. Optimistic Update (Users ONLY - SSOT)
        set((state) => ({ users: [...state.users, user] }));

        // 4. Auditoria Preventiva
        await state.logSecurityEvent({
            attemptId: 'SYSTEM',
            eventType: 'USER_CREATE',
            severity: 'INFO',
            eventData: {
                createdUserId: user.id,
                role: user.role,
                createdBy: state.currentUser?.email
            }
        });

        try {
            const { error } = await supabase.from('users').insert({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_id: user.tenantId,
                school_id: user.schoolId || null,
                class_ids: user.classIds || [],
                children_ids: user.childrenIds || [],
                phone: user.phone || null,
                registration_number: user.registrationNumber || null,
                subject_ids: user.subjectIds || [],
                status: user.status || 'ACTIVE'
            });

            if (error) {
                console.error('❌ Error saving user:', error);
                // Rollback
                set((state) => ({ users: state.users.filter(u => u.id !== user.id) }));
                alert(`Erro ao salvar: ${error.message}`);
                throw error;
            }
            console.log('✅ User saved (SSOT):', user.id);
        } catch (e) { console.error(e); }
    },

    deleteUser: async (userId) => {
        const state = get();
        await state.logSecurityEvent({
            attemptId: 'SYSTEM',
            eventType: 'USER_DELETE',
            severity: 'CRITICAL',
            eventData: { userId, deletedBy: state.currentUser?.email }
        });
        try {
            await supabase.from('users').delete().eq('id', userId);
            set((state) => ({ users: state.users.filter(u => u.id !== userId) }));
            console.log('✅ User deleted:', userId);
        } catch (e) {
            console.error('❌ Error deleting user:', e);
        }
    },
    deleteExam: async (examId) => {
        const state = get();
        const exam = state.exams.find(e => e.id === examId);
        await state.logSecurityEvent({
            attemptId: 'SYSTEM',
            eventType: 'EXAM_DELETE',
            severity: 'CRITICAL',
            eventData: { examTitle: exam?.title, deletedBy: state.currentUser?.email }
        });

        const previousExams = state.exams;
        set((state) => ({ exams: state.exams.filter(e => e.id !== examId) }));
        try {
            const { error } = await supabase.from('exams').delete().eq('id', examId);
            if (error) {
                console.error('❌ Error deleting exam:', error);
                set({ exams: previousExams }); // Rollback
                alert("Erro ao excluir prova: " + (error.message || 'Erro desconhecido'));
                throw error;
            }
            console.log('✅ Exam deleted:', examId);
            alert('✅ Prova excluída com sucesso!');
        } catch (e: any) {
            console.error('❌ Error deleting exam:', e);
            set({ exams: previousExams }); // Rollback
        }
    },

    // ===================================================
    // LIVE QUIZ SESSION ACTIONS
    // ===================================================
    addLiveQuizSession: async (session: LiveQuizSession) => {
        // Optimistic update
        set((state) => ({ liveQuizSessions: [...state.liveQuizSessions, session] }));
        try {
            const { error } = await supabase.from('live_quiz_sessions').insert({
                id: session.id,
                tenant_id: session.tenantId,
                creator_id: session.creatorId,
                title: session.title,
                class_name: session.className,
                max_participants: session.maxParticipants,
                session_code: session.sessionCode,
                item_ids: session.itemIds,
                shuffle_questions: session.shuffleQuestions,
                status: session.status,
                participants: session.participants,
                metadata: session.metadata || {},
                created_at: session.createdAt || new Date().toISOString()
            });

            if (error) {
                console.error('❌ Error saving quiz session:', error);
                set((state) => ({
                    liveQuizSessions: state.liveQuizSessions.filter(s => s.id !== session.id)
                }));
                throw error;
            }
            console.log('✅ Live quiz session created:', session.id);
        } catch (e: any) {
            console.error('❌ Error creating live quiz session:', e);
            set((state) => ({
                liveQuizSessions: state.liveQuizSessions.filter(s => s.id !== session.id)
            }));
        }
    },

    updateLiveQuizSession: async (sessionId: string, updates: Partial<LiveQuizSession>) => {
        const previousSessions = get().liveQuizSessions;
        set((state) => ({
            liveQuizSessions: state.liveQuizSessions.map(s =>
                s.id === sessionId ? { ...s, ...updates } : s
            )
        }));

        try {
            const dbUpdates: any = {};
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.startedAt) dbUpdates.started_at = updates.startedAt;
            if (updates.finishedAt) dbUpdates.finished_at = updates.finishedAt;
            if (updates.participants) dbUpdates.participants = updates.participants;
            if (updates.metadata) dbUpdates.metadata = updates.metadata;

            const { error } = await supabase
                .from('live_quiz_sessions')
                .update(dbUpdates)
                .eq('id', sessionId);

            if (error) {
                console.error('❌ Error updating quiz session:', error);
                set({ liveQuizSessions: previousSessions });
                throw error;
            }
            console.log('✅ Live quiz session updated:', sessionId);
        } catch (e: any) {
            console.error('❌ Error updating live quiz session:', e);
            set({ liveQuizSessions: previousSessions });
        }
    },

    deleteLiveQuizSession: async (sessionId: string) => {
        const previousSessions = get().liveQuizSessions;
        set((state) => ({
            liveQuizSessions: state.liveQuizSessions.filter(s => s.id !== sessionId)
        }));

        try {
            const { error } = await supabase
                .from('live_quiz_sessions')
                .delete()
                .eq('id', sessionId);

            if (error) {
                console.error('❌ Error deleting quiz session:', error);
                set({ liveQuizSessions: previousSessions });
                alert("Erro ao excluir quiz: " + (error.message || 'Erro desconhecido'));
                throw error;
            }
            console.log('✅ Live quiz session deleted:', sessionId);
            alert('✅ Quiz excluído com sucesso!');
        } catch (e: any) {
            console.error('❌ Error deleting quiz session:', e);
            set({ liveQuizSessions: previousSessions });
        }
    },

    fetchLiveQuizSessions: async () => {
        try {
            const { data, error } = await supabase
                .from('live_quiz_sessions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const sessions: LiveQuizSession[] = (data || []).map((row: any) => ({
                id: row.id,
                tenantId: row.tenant_id,
                creatorId: row.creator_id,
                title: row.title || 'Quiz Interativo',
                className: row.class_name,
                maxParticipants: row.max_participants,
                sessionCode: row.session_code,
                itemIds: row.item_ids || [],
                shuffleQuestions: row.shuffle_questions || true,
                status: row.status,
                startedAt: row.started_at,
                finishedAt: row.finished_at,
                participants: row.participants || [],
                createdAt: row.created_at,
                metadata: row.metadata || {}
            }));

            set({ liveQuizSessions: sessions });
            console.log(`✅ Loaded ${sessions.length} live quiz sessions`);
        } catch (e: any) {
            console.error('❌ Error fetching live quiz sessions:', e);
        }
    },


    updateUser: async (user) => {
        const state = get();

        // 1. RBAC Check (Hardening)
        const canEdit = state.globalPermissions[state.currentUser?.role || '']?.USER_DATA?.includes('EDIT');
        if (!canEdit && state.currentUser?.role !== UserRole.SYSTEM_ADMIN) {
            console.error('❌ Permission Denied: User cannot edit records.');
            alert('Você não tem permissão para editar usuários.');
            return;
        }

        const previousUser = state.users.find(u => u.id === user.id);

        // 2. Optimistic Update (SSOT)
        set((state) => ({
            users: state.users.map((u) => (u.id === user.id ? user : u))
        }));

        // 3. Auditoria de Alteração
        if (previousUser && (previousUser.name !== user.name || previousUser.classIds !== user.classIds)) {
            await state.logSecurityEvent({
                attemptId: 'SYSTEM',
                eventType: 'USER_UPDATE',
                severity: 'INFO',
                eventData: {
                    updatedUserId: user.id,
                    changes: {
                        name: previousUser.name !== user.name,
                        classIds: previousUser.classIds !== user.classIds
                    },
                    updatedBy: state.currentUser?.email
                }
            });
        }

        try {
            const { error } = await supabase.from('users').update({
                name: user.name,
                email: user.email,
                role: user.role,
                school_id: user.schoolId || null,
                class_ids: user.classIds || [],
                children_ids: user.childrenIds || [],
                phone: user.phone || null,
                registration_number: user.registrationNumber || null,
                subject_ids: user.subjectIds || [],
                status: user.status
            }).eq('id', user.id);

            if (error) {
                console.error('❌ Error updating user:', error);
                // Rollback
                if (previousUser) {
                    set((state) => ({
                        users: state.users.map(u => u.id === user.id ? previousUser : u)
                    }));
                }
                alert(`Erro ao atualizar: ${error.message}`);
                throw error;
            }
            console.log('✅ User updated (SSOT):', user.id);
        } catch (e) {
            console.error('❌ Error updating user:', e);
        }
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
    updatePermissions: (matrix: PermissionMatrix) => {
        const state = get();
        state.logSecurityEvent({
            attemptId: 'SYSTEM',
            eventType: 'PERMISSION_CHANGE',
            severity: 'CRITICAL',
            eventData: { changedBy: state.currentUser?.email, timestamp: new Date() }
        });
        set({ globalPermissions: matrix });
    },
    updateTenantFeatures: async (tenantId, features) => {
        set((state) => ({
            tenants: state.tenants.map(t => t.id === tenantId ? { ...t, features } : t)
        }));
        try {
            await supabase.from('tenants').update({ features }).eq('id', tenantId);
        } catch (e) { console.error(e); }
    },
    addTenant: async (tenant) => {
        set((state) => ({ tenants: [...state.tenants, tenant] }));
        try {
            const { error } = await supabase.from('tenants').insert({
                id: tenant.id,
                name: tenant.name,
                type: tenant.type,
                cnpj: tenant.cnpj,
                status: tenant.status,
                billing_email: tenant.billingEmail,
                contract_end: tenant.contractEnd,
                max_students: tenant.maxStudents,
                features: tenant.features,
                created_at: new Date().toISOString()
            });

            if (error) {
                console.error('❌ Error saving tenant:', error);
                set((state) => ({ tenants: state.tenants.filter(t => t.id !== tenant.id) }));
                throw error;
            }
            console.log('✅ Tenant saved successfully:', tenant.id);
        } catch (e) {
            console.error('Failed to persist tenant:', e);
            throw e;
        }
    },
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
                // set({ userProfiles: stateBackup }); // DESABILITADO: Evitar "blink" se a tabela não existir
                // throw error; // Não lançar erro para não quebrar a UI
            }
            console.log('✅ User profile saved:', profile.userId);
        } catch (e) { console.error(e); }
    },
    updateExamAllocation: (examId, classIds) => {
        // Optimistic
        set((state) => {
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

            // --- AUTO ADAPTATION TRIGGER (POST-UPDATE) ---
            // Ideally we do this async, but inside setState is risky.
            // We should use Get() outside.
            // But this is an action implementation. We can break out.
            return {
                exams: state.exams.map(e => e.id === examId ? { ...e, classIds } : e),
                registrations: [...filteredRegistrations, ...freshRegistrations]
            };
        });

        // Trigger Async Adaptation
        const state = get();
        const exam = state.exams.find(e => e.id === examId);
        if (exam) {
            // Need to pass the NEW classIds, not the old ones from state if they weren't updated yet?
            // "set" is synchronous for the next "get"? No, Zustand set merges.
            // But strict state might not be immediate if we just returned above.
            // Safe bet: Pass explicit args.
            checkAndTriggerAdaptation(exam, classIds, state, get());
        }
    },
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
        } catch (e) {
            console.error(e);
        }
    },

    // --- AI BATCH & VERSION ACTIONS ---
    addGenerationBatch: async (batch) => {
        set((state) => ({ itemGenerationBatches: [batch, ...state.itemGenerationBatches] }));
        try {
            console.log('📤 Saving batch to Supabase:', batch);
            const { error } = await supabase.from('item_generation_batches').insert({
                id: batch.id,
                creator_id: batch.creatorId,
                created_by: batch.creatorId,
                tenant_id: batch.tenantId,
                status: batch.status || 'open',
                source: batch.source || 'IA',
                prompt_context: batch.promptContext,
                prompt_hash: batch.promptHash,
                total_requested: batch.totalRequested
            });
            if (error) {
                console.error('❌ Supabase Error Detail (batch):', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                set((state) => ({
                    itemGenerationBatches: state.itemGenerationBatches.filter(b => b.id !== batch.id)
                }));
                throw error;
            }
        } catch (e) {
            console.error("Error saving batch:", e);
            throw e;
        }
    },

    deleteGenerationBatch: async (batchId) => {
        set((state) => ({
            itemGenerationBatches: state.itemGenerationBatches.filter(b => b.id !== batchId),
            items: state.items.filter(i => i.generationBatchId !== batchId)
        }));
        try {
            // Delete items first (manual cascade if foreign key doesn't handle)
            const { error: itemsError } = await supabase.from('items').delete().eq('generation_batch_id', batchId);
            if (itemsError) throw itemsError;

            const { error: batchError } = await supabase.from('item_generation_batches').delete().eq('id', batchId);
            if (batchError) throw batchError;
        } catch (e) {
            console.error("Error deleting batch:", e);
            // Optionally reload to restore state on error, but optimistic update is usually preferred
        }
    },



    updateItemStatus: async (itemId, status) => {
        set((state) => ({
            items: state.items.map(i => i.id === itemId ? { ...i, lifecycleStatus: status } : i)
        }));
        try {
            await supabase.from('items').update({ lifecycle_status: status }).eq('id', itemId);
        } catch (e) { console.error("Error updating status:", e); }
    },

    bulkUpdateItemStatus: async (itemIds, status) => {
        set((state) => ({
            items: state.items.map(i => itemIds.includes(i.id) ? { ...i, lifecycleStatus: status } : i)
        }));
        try {
            await supabase.from('items').update({ lifecycle_status: status }).in('id', itemIds);
        } catch (e) { console.error("Error updating status:", e); }
    },

    approveAllItemsInBatch: async (batchId) => {
        // Validation Guard: Ensure batchId is a valid UUID
        // "t1" is a common mock tenant ID that sometimes leaks into batchId
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!batchId || !uuidRegex.test(batchId)) {
            console.warn(`⚠️ [approveAllItemsInBatch] Blocked invalid UUID: "${batchId}". This prevents RPC 400 error.`);
            return { data: null, error: { message: "ID de lote inválido. Operação abortada." } };
        }

        try {
            const { data, error } = await supabase.rpc('approve_all_items_in_batch', { p_batch_id: batchId });
            if (error) throw error;

            // Reload from server to ensure we get the updated status and any RLS changes take effect
            await get().loadRemoteData();

            return data;
        } catch (e) {
            console.error("RPC Error:", e);
            throw e;
        }
    },

    approveOneItem: async (itemId) => {
        set((state) => ({
            items: state.items.map(i => i.id === itemId ? { ...i, lifecycleStatus: ItemLifecycleStatus.APPROVED } : i)
        }));
        try {
            await supabase.from('items').update({ lifecycle_status: 'APPROVED' }).eq('id', itemId);
        } catch (e) { console.error("Error approving item:", e); }
    },

    discardOneItem: async (itemId) => {
        set((state) => ({
            items: state.items.map(i => i.id === itemId ? { ...i, lifecycleStatus: ItemLifecycleStatus.REJECTED } : i)
        }));
        try {
            await supabase.from('items').update({ lifecycle_status: 'REJECTED' }).eq('id', itemId);
        } catch (e) { console.error("Error discarding item:", e); }
    },

    setActiveBatchId: (id) => set({ activeBatchId: id }),

    addExamVersion: async (version) => {
        set((state) => ({ examVersions: [version, ...state.examVersions] }));
        try {
            const { error } = await supabase.from('exam_versions').insert({
                id: version.id,
                exam_id: version.examId,
                version_number: version.versionNumber,
                items_snapshot: version.itemsSnapshot,
                grading_config: version.gradingConfig,
                cover_config: version.coverConfig,
                status: version.status
            });
            if (error) throw error;
        } catch (e) {
            console.error("Error saving exam version:", e);
            throw e;
        }
    },


    loadGenerationBatches: async () => {
        const { data, error } = await supabase
            .from('item_generation_batches')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) {
            set({
                itemGenerationBatches: data.map(b => ({
                    id: b.id,
                    creatorId: b.creator_id,
                    tenantId: b.tenant_id,
                    promptContext: b.prompt_context,
                    totalRequested: b.total_requested,
                    createdAt: b.created_at
                }))
            });
        }
    },

    startExamAttempt: async (dto) => {
        const id = uuidv4();
        const newAttempt: ExamAttempt = {
            id,
            examId: dto.examId,
            examVersionId: dto.examVersionId,
            studentId: dto.studentId,
            status: 'started',
            startedAt: new Date().toISOString(),
            lastPingAt: new Date().toISOString(),
            violationCount: 0,
            metadata: {}
        };

        set((state) => ({ examAttempts: [newAttempt, ...state.examAttempts] }));

        try {
            // Explicitly map fields to match DB schema (examId is NOT in DB yet)
            const payload = {
                id: newAttempt.id,
                exam_version_id: newAttempt.examVersionId,
                student_id: newAttempt.studentId,
                status: newAttempt.status,
                started_at: newAttempt.startedAt,
                metadata: newAttempt.metadata
            };

            const { error } = await supabase.from('exam_attempts').insert(payload);

            if (error) throw error;
        } catch (e) {
            console.error("Error starting attempt:", e);
        }
        return id;
    },

    saveExamProgress: async (attemptId: string, answers: Record<string, string>, metadata?: any) => {
        // 1. Optimistic local update (Merge metadata)
        set((state) => ({
            examAttempts: state.examAttempts.map(a =>
                a.id === attemptId
                    ? { ...a, metadata: { ...a.metadata, savedAnswers: answers, ...metadata }, lastPingAt: new Date().toISOString() }
                    : a
            )
        }));

        const state = get();
        const updatedAttempt = state.examAttempts.find(a => a.id === attemptId);

        // Safety check: if attempt not found locally, we fall back to the args, but warn.
        //Ideally we should have it locally if we are running the exam.
        let metadataToSave: any = updatedAttempt?.metadata || { savedAnswers: answers, ...metadata };

        try {
            // --- PHASE 8: ENCRYPTION (PREMIUM) ---
            if (state.examEncryptionKey) {
                const { cryptoService } = await import('../services/cryptoService');
                const encryptedPayload = await cryptoService.encryptAnswer(answers, state.examEncryptionKey);

                metadataToSave = {
                    ...metadataToSave, // Keep other metadata (adaptivePath, etc)
                    savedAnswers: null, // Wipe plain text
                    encryptedAnswers: encryptedPayload,
                    isEncrypted: true,
                    encryptionMethod: 'AES-256-GCM'
                };
            }

            // Persist to Supabase
            await supabase.from('exam_attempts').update({
                metadata: metadataToSave,
                last_ping_at: new Date().toISOString()
            }).eq('id', attemptId);
        } catch (e) {
            console.error("Error saving progress:", e);
        }
    },

    logSecurityEvent: async (dto) => {
        const id = uuidv4();
        const newEvent: ExamAttemptEvent = {
            id,
            attemptId: dto.attemptId,
            eventType: dto.eventType as any,
            severity: dto.severity as any,
            eventData: dto.eventData || {},
            createdAt: new Date().toISOString()
        };

        set((state) => ({
            examAttemptEvents: [newEvent, ...state.examAttemptEvents],
            examAttempts: state.examAttempts.map(a => a.id === dto.attemptId ? { ...a, violationCount: a.violationCount + 1 } : a)
        }));

        try {
            // 1. Persist to DB
            const { error } = await supabase.from('exam_attempt_events').insert({
                id: newEvent.id,
                attempt_id: newEvent.attemptId,
                event_type: newEvent.eventType,
                severity: newEvent.severity,
                event_data: newEvent.eventData
            });
            if (error) throw error;

            await supabase.rpc('increment_violation_count', { attempt_id_input: dto.attemptId });

            // 2. Broadcast to Live Monitor (Professor View)
            const attempt = get().examAttempts.find(a => a.id === dto.attemptId);

            // Fallback strategy for Exam ID
            let currentExamId = attempt?.examId;
            if (!currentExamId && attempt?.examVersionId) {
                // In demo, versionId often equals examId, or we can try to guess
                currentExamId = attempt.examVersionId;
            }
            // Last resort: check if there is an active exam in store (might overlap, but better than nothing for alerts)
            if (!currentExamId) {
                const exam = get().exams.find(e => e.status === 'ACTIVE');
                if (exam) currentExamId = exam.id;
            }

            console.log(`📡 Broadcast Alert: Attempt=${dto.attemptId} Exam=${currentExamId} Type=${newEvent.eventType}`);

            if (currentExamId) {
                const currentUser = get().currentUser || { id: attempt?.studentId, name: 'Aluno' }; // Fallback user

                supabase.channel(`exam_monitor:${currentExamId}`).send({
                    type: 'broadcast',
                    event: 'ALERT',
                    payload: {
                        studentId: currentUser.id || attempt?.studentId,
                        studentName: currentUser.name || 'Aluno',
                        type: newEvent.eventType,
                        severity: newEvent.severity,
                        timestamp: new Date().toISOString()
                    }
                }).catch(err => console.error("Broadcast failed:", err));
            } else {
                console.warn("⚠️ Broadcast skipped: No examId found for attempt", dto.attemptId);
            }

        } catch (e) {
            console.error("Error logging security event:", e);
        }
    },

    submitExamAttempt: async (attemptId, status) => {
        set((state) => ({
            examAttempts: state.examAttempts.map(a => a.id === attemptId ? { ...a, status: status as any, submittedAt: new Date().toISOString() } : a)
        }));

        try {
            const { error } = await supabase.from('exam_attempts').update({
                status: status,
                submitted_at: new Date().toISOString()
            }).eq('id', attemptId);
            if (error) throw error;
        } catch (e) {
            console.error("Error submitting attempt:", e);
        }
    },

    reopenExamAttempt: async (attemptId) => {
        set((state) => ({
            examAttempts: state.examAttempts.map(a =>
                a.id === attemptId ? { ...a, status: 'started' } : a
            )
        }));

        try {
            await supabase
                .from('exam_attempts')
                .update({ status: 'started' })
                .eq('id', attemptId);

            await get().logSecurityEvent({
                attemptId,
                eventType: 'focus_gained', // Reuse event for focus return
                severity: 'info',
                eventData: { reason: 'SUPERVISOR_REOPEN' }
            });
        } catch (e) {
            console.error("Error reopening attempt:", e);
        }
    },

    // --- PHASE 4 IMPLEMENTATION ---
    calculateAndSaveResult: async (attemptId, answers) => {
        const state = get();
        const attempt = state.examAttempts.find(a => a.id === attemptId);
        if (!attempt) return;

        const version = state.examVersions.find(v => v.id === attempt.examVersionId);
        if (!version) return;

        let totalScore = 0;
        const autoGradeLog: any[] = [];
        const incorrectItems: any[] = [];

        // 1. Core Grading Logic
        // SECURITY CHECK: If exam is encrypted, WE DO NOT GRADE ON CLIENT.
        // We just verify that answers were captured and mark as submitted.
        // The server will pick this up via Edge Function.
        const isEncryptedSession = !!state.examEncryptionKey;

        if (isEncryptedSession) {
            console.log("🔒 Encrypted Session: Skipping Client-Side Grading. Delegating to Server.");

            set(state => ({
                examAttempts: state.examAttempts.map(a => a.id === attemptId ? { ...a, status: 'submitted' as const, submittedAt: new Date().toISOString() } : a)
            }));

            try {
                // Just update status. The encrypted answers are already in 'metadata' from saveProgress
                await supabase.from('exam_attempts').update({
                    status: 'submitted', // Or 'pending_grading' if we add that enum
                    submitted_at: new Date().toISOString()
                }).eq('id', attemptId);

                // We do NOT carry on to create exam_results locally.
                return;
            } catch (e) {
                console.error("Error submitting encrypted attempt:", e);
                return;
            }
        }

        (version.itemsSnapshot || []).forEach((snap: any) => {
            const studentAns = answers.find(a => a.itemId === (snap.id || snap.itemId));
            const item = state.items.find(i => i.id === (snap.id || snap.itemId));

            if (item && studentAns) {
                const correctAlt = item.alternatives.find(alt => alt.isCorrect);
                const isCorrect = studentAns.selectedAlternativeId === correctAlt?.id;

                const weight = version.gradingConfig?.totalsByDiscipline?.[item.subject] || 1;
                const score = isCorrect ? weight : 0;

                totalScore += score;
                autoGradeLog.push({
                    itemId: item.id,
                    isCorrect,
                    score,
                    studentAnswerId: studentAns.selectedAlternativeId,
                    correctAnswerId: correctAlt?.id
                });

                if (!isCorrect) {
                    // Only generating feedback for non-encrypted exams locally
                    incorrectItems.push({
                        subject: item.subject,
                        statement: item.statement,
                        studentAnswer: item.alternatives.find(a => a.id === studentAns.selectedAlternativeId)?.text || 'Nenhuma',
                        correctAnswer: correctAlt?.text
                    });
                }
            }
        });

        // 2. AI Pedagogical Feedback
        let pedagogicalFeedback = "";
        try {
            const { generatePedagogicalReport } = await import('../services/geminiService');

            const correctCount = autoGradeLog.filter(l => l.isCorrect).length;
            const totalCount = autoGradeLog.length;
            const exam = state.exams.find(e => e.id === version.examId);

            const maxScore = version.itemsSnapshot?.reduce((acc: number, snap: any) => {
                return acc + (version.gradingConfig?.totalsByDiscipline?.[snap.subject] || 1);
            }, 0) || 0;

            const subjectBreakdown = Array.from(new Set(version.itemsSnapshot?.map((s: any) => s.subject))).map(subject => {
                const subjectItems = autoGradeLog.filter(l => {
                    const item = version.itemsSnapshot?.find((s: any) => (s.id || s.itemId) === l.itemId);
                    return item?.subject === subject;
                });
                const subjCorrect = subjectItems.filter(l => l.isCorrect).length;
                return { subject: subject as string, correct: subjCorrect, total: subjectItems.length };
            });

            pedagogicalFeedback = await generatePedagogicalReport(
                state.currentUser?.name || 'Aluno',
                exam?.title || 'Avaliação',
                totalScore,
                maxScore,
                correctCount,
                totalCount,
                subjectBreakdown
            );
        } catch (e) {
            console.error("Error generating AI feedback:", e);
            pedagogicalFeedback = "Bom desempenho! Continue praticando os tópicos abordados.";
        }

        // 3. Save Result
        const resultId = uuidv4();
        const newResult: any = {
            id: resultId,
            examId: version.examId,
            studentId: attempt.studentId,
            answers: answers.map(a => ({
                itemId: a.itemId,
                selectedAlternativeText: a.selectedAlternativeText,
                scoreObtained: autoGradeLog.find(log => log.itemId === a.itemId)?.score || 0
            })),
            totalScore,
            gradedAt: new Date().toISOString(),
            violationCount: attempt.violationCount,
            pedagogicalFeedback,
            autoGradeLog
        };

        set(state => ({
            results: [...state.results, newResult],
            examAttempts: state.examAttempts.map(a => a.id === attemptId ? { ...a, status: 'submitted' as const, submittedAt: new Date().toISOString() } : a)
        }));

        try {
            await supabase.from('exam_results').insert({
                id: newResult.id,
                exam_id: newResult.examId,
                student_id: newResult.studentId,
                answers: newResult.answers,
                total_score: newResult.totalScore,
                graded_at: newResult.gradedAt,
                pedagogical_feedback: newResult.pedagogicalFeedback,
                auto_grade_log: newResult.autoGradeLog
            });

            await supabase.from('exam_attempts').update({
                status: 'submitted',
                submitted_at: newResult.gradedAt
            }).eq('id', attemptId);
        } catch (e) {
            console.error("Error persisting result:", e);
        }
    },

    updatePedagogicalFeedback: async (resultId, feedback) => {
        set(state => ({
            results: state.results.map(r => r.id === resultId ? { ...r, pedagogicalFeedback: feedback } : r)
        }));
        try {
            const { error } = await supabase
                .from('exam_results')
                .update({ pedagogical_feedback: feedback })
                .eq('id', resultId);
            if (error) throw error;
        } catch (e) {
            console.error("Error updating pedagogical feedback:", e);
        }
    },

    // --- LOGISTICS ACTIONS implementation ---
    addLogisticsSuitcase: async (suitcase) => {
        set(state => ({ logisticsSuitcases: [suitcase, ...state.logisticsSuitcases] }));
    },
    updateSuitcaseStatus: async (id, status) => {
        set(state => ({
            logisticsSuitcases: state.logisticsSuitcases.map(s =>
                s.id === id ? { ...s, status, lastUpdatedAt: new Date().toISOString() } : s
            )
        }));
    },
    logTabletMovement: async (serialId, suitcaseId, action, actorId) => {
        const entry: LogisticsAuditEntry = {
            id: uuidv4(),
            suitcaseId,
            tabletSerial: serialId,
            action,
            actorId,
            timestamp: new Date().toISOString()
        };
        set(state => ({
            logisticsAudit: [entry, ...state.logisticsAudit],
            logisticsTablets: state.logisticsTablets.map(t =>
                t.serialId === serialId ? {
                    ...t,
                    status: action === 'CHECK_OUT' ? 'IN_USE' : 'RETURNED',
                    currentSuitcaseId: action === 'CHECK_OUT' ? suitcaseId : undefined
                } : t
            )
        }));
    },
    loadLogisticsData: async () => {
        console.log("🚚 Dados logísticos simulados carregados.");
    },

    getRecommendedVariant: async (studentId, versionId) => {
        const state = get();
        const user = state.users.find(u => u.id === studentId);
        if (!user || !user.specialNeeds || user.specialNeeds.length === 0) return null;

        const variants = state.examVariants.filter(v => v.examVersionId === versionId && v.status === 'active');

        const match = variants.find(v => user.specialNeeds?.includes(v.conditionCode));
        return match ? match.id : null;
    },

    // --- MENTORSHIP IMPL ---
    mentorships: [],
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
        } catch (e) { console.error(e); }
    },

    // --- PHASE 5 IMPL ---
    loadTenants: async () => {
        try {
            const { data } = await supabase.from('tenants').select('*');
            if (data) set({ tenants: data as Tenant[] });
        } catch (e) { console.error(e); }
    },
    fetchAuditLogs: async (tenantId) => {
        try {
            const { data, error } = await supabase.from('audit_logs')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const logs: AuditLog[] = data.map((log: any) => ({
                    id: log.id,
                    tenantId: log.tenant_id,
                    actorId: log.actor_id,
                    actorEmail: log.actor_email,
                    actionType: log.action_type,
                    targetResource: log.target_resource,
                    targetId: log.target_id,
                    details: log.details,
                    ipAddress: log.ip_address,
                    userAgent: log.user_agent,
                    createdAt: log.created_at
                }));
                set({ auditLogs: logs });
                return logs;
            }
        } catch (e) {
            console.error("Error fetching audit logs:", e);
        }
        return [];
    },
    confirmMentorship: (reqId, pinInput) => {
        let success = false;
        set(state => {
            const mentorship = state.mentorships.find(m => m.id === reqId);
            if (mentorship && mentorship.verificationPin === pinInput) {
                success = true;
                return {
                    mentorships: state.mentorships.map(m => m.id === reqId ? { ...m, status: MentorshipStatus.COMPLETED } : m)
                };
            }
            return state;
        });
        return success;
    },
    forceFetchBatchItems: async (batchId) => {
        console.log(`🔍 Forçando busca de itens do lote: ${batchId}`);
        const { data: dbItems, error } = await supabase
            .from('items')
            .select('*')
            .eq('generation_batch_id', batchId);

        if (error) {
            console.error('❌ Erro ao buscar itens do lote:', error);
            throw error;
        }

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
                bnccCode: i.bncc_code || '',
                origin: i.origin || ItemOrigin.MANUAL,
                score: i.score || 1.0,
                tags: i.tags || [],
                triParams: i.tri_params,
                generationBatchId: i.generation_batch_id,
                lifecycleStatus: i.lifecycle_status,
                isAccessible: i.is_accessible,
                accessibilityInstructions: i.accessibility_instructions,
                multimedia: i.multimedia || [],
                currentVersionId: i.current_version_id,
                usageCount: i.usage_count || 0,
                createdAt: i.created_at || new Date().toISOString(),
                updatedAt: i.updated_at || new Date().toISOString()
            }));
            return formattedItems;
        }
    },

    addExamVariant: async (variant) => {
        set(state => ({ examVariants: [...state.examVariants, variant] }));
        try {
            const { error } = await supabase.from('exam_variants').insert({
                id: variant.id,
                exam_id: variant.examId,
                name: variant.name,
                slug: variant.slug,
                description: variant.description,
                accessibility_config: variant.accessibilityConfig,
                created_at: variant.createdAt
            });
            if (error) {
                console.error("❌ Error saving exam variant:", error);
                set(state => ({ examVariants: state.examVariants.filter(v => v.id !== variant.id) }));
                throw error;
            }
        } catch (e) { console.error(e); }
    },

    addStudyPlan: async (plan: StudyPlan) => {
        set(state => ({ studyPlans: [...state.studyPlans, plan] }));
        try {
            const { error } = await supabase.from('study_plans').insert({
                id: plan.id,
                student_id: plan.studentId,
                title: plan.title,
                tasks: plan.tasks,
                status: plan.status,
                related_exam_id: plan.relatedExamId,
                created_at: plan.createdAt
            });

            if (error) {
                console.error("Error saving study plan:", error);
                throw error;
            }
        } catch (e) {
            console.error("Failed to persist study plan:", e);
        }
    },

    completeStudyTask: async (planId: string, taskId: string) => {
        const state = get();
        const plan = state.studyPlans.find(p => p.id === planId);
        if (!plan) return;

        const task = plan.tasks.find(t => t.id === taskId);
        if (!task || task.completed) return;

        // 1. Update Local State (Optimistic)
        const updatedPlans = state.studyPlans.map(p => {
            if (p.id === planId) {
                return {
                    ...p,
                    tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t)
                };
            }
            return p;
        });

        // 2. Add Reward (OwlCoins/BonusPoints)
        const reward = task.rewardSafe || 0;
        // Find stats for current student (this logic assumes single student context for simplicity or needs robust lookup)
        // Updating 'stats' directly might be tricky if it's derived. Let's assume we update a local 'userPoints' or similar if available.
        // For now, we will just log the reward and update the task status in DB.

        console.log(`💰 Rewarding ${reward} OwlCoins to student!`);

        set({ studyPlans: updatedPlans });

        // 3. Persist
        try {
            // Update plan in DB (Supabase has no deep partial update for JSONB array easily, replacing tasks array)
            const updatedPlan = updatedPlans.find(p => p.id === planId);

            const { error } = await supabase.from('study_plans').update({
                tasks: updatedPlan?.tasks
            }).eq('id', planId);

            if (error) throw error;

            // TODO: Transaction to increment points in student_stats table

        } catch (e) {
            console.error("Error completing study task:", e);
            // Revert?
        }
    },

    saveOverride: async (override) => {
        // Optimistic
        set(state => ({
            variantOverrides: [...state.variantOverrides.filter(o => o.id !== override.id), override]
        }));

        try {
            const payload = {
                id: override.id,
                variant_id: override.variantId,
                item_version_id: override.itemVersionId,
                override_payload: override.overridePayload,
                rationale: override.rationale,
                status: override.status,
                created_by: override.createdBy,
                created_at: override.createdAt,
                updated_at: override.updatedAt
            };

            const { error } = await supabase.from('exam_variant_overrides').upsert(payload);

            if (error) {
                console.error("❌ Error saving override:", error);
                // Rollback? Complicated for upsert. Just alert.
                throw error;
            }
        } catch (e) { console.error(e); }
    },

    loadExamVariants: async (examId) => {
        try {
            const { data: variants } = await supabase.from('exam_variants').select('*').eq('exam_id', examId);
            const { data: overrides } = await supabase.from('exam_variant_overrides')
                .select('*')
                .in('variant_id', (variants || []).map(v => v.id));

            if (variants) {
                const formattedVariants: ExamVariant[] = variants.map((v: any) => ({
                    id: v.id,
                    examId: v.exam_id,
                    name: v.name,
                    slug: v.slug,
                    description: v.description,
                    accessibilityConfig: v.accessibility_config,
                    status: 'active', // Default for now as DB col missing
                    createdAt: v.created_at
                }));
                // Merge into state (avoid duplicates)
                set(state => ({
                    examVariants: [
                        ...state.examVariants.filter(old => !formattedVariants.some(newV => newV.id === old.id)),
                        ...formattedVariants
                    ]
                }));
            }

            if (overrides) {
                const formattedOverrides: ExamVariantOverride[] = overrides.map((o: any) => ({
                    id: o.id,
                    variantId: o.variant_id,
                    itemVersionId: o.item_version_id,
                    overridePayload: o.override_payload,
                    rationale: o.rationale,
                    status: o.status,
                    createdBy: o.created_by,
                    createdAt: o.created_at,
                    updatedAt: o.updated_at
                }));
                set(state => ({
                    variantOverrides: [
                        ...state.variantOverrides.filter(old => !formattedOverrides.some(newO => newO.id === old.id)),
                        ...formattedOverrides
                    ]
                }));
            }

        } catch (e) { console.error(e); }
    },




    loadArcadeGames: async () => {
        try {
            const { data } = await supabase.from('arcade_games')
                .select('*')
                .eq('is_active', true);

            if (data) {
                const games: ArcadeGame[] = data.map((g: any) => ({
                    id: g.id,
                    title: g.title,
                    description: g.description,
                    thumbnailUrl: g.thumbnail_url,
                    gameUrl: g.url,
                    category: g.category,
                    minLevel: 1, // Default as not in DB
                    status: g.is_active ? 'active' : 'inactive',
                    playCount: g.play_count || 0,
                    createdAt: g.created_at
                }));

                // SHIM: Custom Images provided by User
                games.forEach(g => {
                    if (g.title.toLowerCase().includes('game quizz') || g.title.toLowerCase().includes('quiz master')) {
                        g.thumbnailUrl = '/assets/images/Game Quizz Interativo.png';
                    }
                    if (g.title.toLowerCase().includes('eduquest')) {
                        g.thumbnailUrl = '/assets/images/Gemini_Generate.png';
                    }
                    if (g.title.toLowerCase().includes('silabajoy')) {
                        g.thumbnailUrl = '/assets/images/silabajoy.jpg';
                    }
                    if (g.title.toLowerCase().includes('alfabichos') || g.title.toLowerCase().includes('alfabetização')) {
                        g.thumbnailUrl = '/assets/images/AlfaBichos Jogos de Alfabetiz.png';
                    }
                });

                set(state => {
                    const existingIds = new Set(state.arcadeGames.map(g => g.id));
                    const newGames = games.filter(g => !existingIds.has(g.id));
                    return { arcadeGames: [...state.arcadeGames, ...newGames] };
                });
            }
        } catch (e) {
            console.error("Error loading arcade games:", e);
        }
    },

    addArcadeGame: async (game) => {
        set(state => ({ arcadeGames: [...state.arcadeGames, game] }));
        try {
            const { error } = await supabase.from('arcade_games').insert({
                id: game.id,
                title: game.title,
                description: game.description,
                url: game.gameUrl,
                category: game.category,
                thumbnail_url: game.thumbnailUrl,
                is_active: game.status === 'active',
                play_count: 0,
                tenant_id: get().currentUser?.tenantId,
                created_at: game.createdAt
            });
            if (error) throw error;
        } catch (e) {
            console.error("Error saving arcade game:", e);
            set(state => ({ arcadeGames: state.arcadeGames.filter(g => g.id !== game.id) }));
        }
    },

    updateArcadeGame: async (game) => {
        set(state => ({ arcadeGames: state.arcadeGames.map(g => g.id === game.id ? game : g) }));
        try {
            const { error } = await supabase.from('arcade_games').update({
                title: game.title,
                description: game.description,
                url: game.gameUrl,
                category: game.category,
                thumbnail_url: game.thumbnailUrl,
                is_active: game.status === 'active'
            }).eq('id', game.id);
            if (error) throw error;
        } catch (e) {
            console.error("Error updating arcade game:", e);
        }
    },

    deleteArcadeGame: async (id) => {
        set(state => ({ arcadeGames: state.arcadeGames.filter(g => g.id !== id) }));
        try {
            const { error } = await supabase.from('arcade_games').delete().eq('id', id);
            if (error) throw error;
        } catch (e) {
            console.error("Error deleting arcade game:", e);
        }
    },

    // --- PHASE 7: SCALABLE EXAM LOADING ---
    fetchExamItems: async (examId: string) => {
        try {
            // FETCH FULL EXAM DATA (Fix for "Prova não encontrada" error)
            // Use limit(1) instead of single() to avoid 406 (Accept header issues)
            const { data: exams, error } = await supabase.from('exams').select('*').eq('id', examId).limit(1);

            if (error) {
                console.error("fetchExamItems failed:", error);
                throw error;
            }

            if (!exams || exams.length === 0) {
                throw new Error("Prova não encontrada (ID inválido).");
            }

            const exam = exams[0];

            // Upsert Exam into Local Store (Crucial for Mobile App)
            set(state => {
                const existing = state.exams.find(e => e.id === examId);
                if (!existing) {
                    const formattedExam: Exam = {
                        id: exam.id,
                        title: exam.title,
                        description: exam.description,
                        items_config: exam.items_config,
                        schoolId: exam.school_id,
                        tenantId: exam.tenant_id,
                        status: exam.status as any,
                        createdAt: exam.created_at,
                        // updatedAt removed to match interface
                        durationMinutes: exam.settings?.duration || 60,
                        items: [], // Will be filled below
                        classIds: exam.class_ids,
                        creatorId: exam.creator_id || 'system',
                        subject: exam.subject || 'Geral',
                        model: exam.model || 'SOMATIVO',
                        targetQuestionCount: exam.settings?.target_questions || 10,
                        maxScore: exam.settings?.max_score || 100
                    } as Exam;
                    return { exams: [...state.exams, formattedExam] };
                }
                return {};
            });

            // 1. CHECk FOR HIGH-SECURITY ENCRYPTED PAYLOAD (PHASE 8)
            if (exam.description && exam.description.startsWith('[SECURE_PAYLOAD]')) {
                console.log("🔐 Encrypted Exam Detected");

                try {
                    const payloadJson = exam.description.substring(16); // Remove prefix
                    const payload = JSON.parse(payloadJson);

                    // --- PHASE 9: PKI AUTO-UNLOCK ---
                    const { cryptoService } = await import('../services/cryptoService');
                    let key: CryptoKey | null = null;
                    const state = get();

                    // 1. Try Automatic PKI Unwrap (Transparent)
                    if (state.identityKeys) {
                        try {
                            const { data: secureKeyRecord } = await supabase
                                .from('exam_secure_keys')
                                .select('wrapped_key')
                                .eq('exam_id', examId)
                                .eq('student_id', state.currentUser?.id || '')
                                .single();

                            if (secureKeyRecord) {
                                console.log("🔓 Attempting PKI Auto-Unlock...");
                                key = await cryptoService.unwrapKey(secureKeyRecord.wrapped_key, state.identityKeys.privateKey);
                                console.log("✅ Auto-Unlock Successful!");
                            }
                        } catch (unwrapErr) {
                            console.warn("Auto-Unlock failed:", unwrapErr);
                        }
                    }

                    // 2. Fallback to Manual Key Entry (Interoperability)
                    if (!key) {
                        const keyString = prompt("🔒 ESTA PROVA É CRIPTOGRAFADA\n\n(Desbloqueio automático indisponível)\nPor favor, insira a CHAVE DE ACESSO manual:");
                        if (!keyString) {
                            alert("Chave obrigatória.");
                            window.history.back();
                            return;
                        }
                        try {
                            const keyJwk = JSON.parse(keyString);
                            key = await cryptoService.importKey(keyJwk);
                        } catch (e) {
                            alert("Chave inválida.");
                            return;
                        }
                    }
                    console.log("🔓 Decrypting in Memory...");
                    const items = await cryptoService.decryptData(payload, key);

                    if (items) {
                        console.log("✅ Exam Decrypted Successfully in RAM");
                        set(state => ({
                            examEncryptionKey: key, // Store for answer encryption
                            // Merge ensuring uniqueness
                            items: [...state.items.filter(i => !items.find((newI: any) => newI.id === i.id)), ...items]
                        }));
                    }
                    return; // Done, skip standard fetch
                } catch (e) {
                    console.error("Decryption failed:", e);
                    alert("Falha crítica ao descriptografar. Chave incorreta ou arquivo adulterado.");
                    return;
                }
            }

            // ROBUST ID EXTRACTION (Handles legacy arrays, new config objects, and item_ids column)
            let itemIds: string[] = [];

            if (Array.isArray(exam.items_config)) {
                if (exam.items_config.length > 0 && typeof exam.items_config[0] === 'string') {
                    // Legacy: ["id1", "id2"]
                    itemIds = exam.items_config;
                } else if (exam.items_config.length > 0 && typeof exam.items_config[0] === 'object') {
                    // Modern: [{itemId: "id1"}, {itemId: "id2"}]
                    itemIds = exam.items_config.map((ic: any) => ic.itemId).filter(Boolean);
                }
            }

            // Fallback to item_ids column if available and items_config failed
            if (itemIds.length === 0 && Array.isArray(exam.item_ids)) {
                itemIds = exam.item_ids;
            }

            if (itemIds.length === 0) {
                console.warn("Nenhuma questão encontrada nesta prova (items_config e item_ids vazios).");
                return;
            }

            // Check which items we already have AND are valid (have statement AND statement is not just the ID)
            const state = get();
            const loadedIds = new Set(
                state.items
                    .filter(i => i.id && i.statement && i.statement.length > 5 && i.statement !== i.id)
                    .map(i => i.id)
            );
            const missingIds = itemIds.filter((id: string) => !loadedIds.has(id));

            if (missingIds.length === 0) return; // All loaded

            // alert(`DEBUG: Buscando ${missingIds.length} questões do DB...`);

            console.log(`📥 Fetching exam content securely via RPC for exam ${examId}`);

            // SECURE FETCH (Via RPC - "Higienizado")
            const { data: dbItems, error: itemsError } = await supabase
                .rpc('get_secure_exam_content', { p_exam_id: examId });

            if (itemsError) {
                console.error("Secure Fetch Error:", itemsError);
                throw itemsError;
            }

            if (dbItems && dbItems.length > 0) {
                // Format items (RPC returns sanitized structure, we map to internal Item type)
                const formattedItems: Item[] = dbItems.map((i: any) => ({
                    id: i.id,
                    tenantId: 'secure', // RPC doesn't return tenant for privacy
                    ownerId: 'system',
                    subject: i.subject,
                    knowledgeArea: i.subject,
                    statement: i.statement,
                    type: i.type,
                    difficulty: i.difficulty,
                    alternatives: i.alternatives, // Now sanitized (no isCorrect)
                    correctAnswerJustification: '', // Hidden
                    bnccCode: '', // Hidden
                    origin: ItemOrigin.MANUAL,
                    score: 1.0,
                    tags: [],
                    triParams: null, // HIDDEN (Security)
                    generationBatchId: null,
                    lifecycleStatus: 'APPROVED',
                    isAccessible: false,
                    accessibilityInstructions: '',
                    multimedia: i.multimedia || [],
                    currentVersionId: null,
                    usageCount: 0,
                    createdAt: new Date().toISOString()
                }));

                set(state => ({
                    items: [...state.items, ...formattedItems]
                }));
            }
        } catch (e) {
            console.error("Error fetching exam items:", e);
            throw e; // RETHROW TO ALLOW CALLER (StudentApp) TO HANDLE ERROR
        }
    },

    // --- PHASE 9: PKI IDENTITY ---
    initIdentity: async () => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        try {
            const { cryptoService } = await import('../services/cryptoService');
            const storageKey = `pki_identity_${currentUser.id}`;
            const storedIdentity = localStorage.getItem(storageKey);

            let keyPair: CryptoKeyPair;

            if (storedIdentity) {
                // Load existing
                const jwks = JSON.parse(storedIdentity);
                const publicKey = await cryptoService.importPublicKey(jwks.publicKey);
                const privateKey = await cryptoService.importPrivateKey(jwks.privateKey);
                keyPair = { publicKey, privateKey };
                // console.log("🔑 Identity loaded");
            } else {
                // Generate new
                console.log("🆕 Generating new PKI Identity...");
                const newKeys = await cryptoService.generateIdentityKeyPair();

                const pubJwk = await cryptoService.exportKey(newKeys.publicKey);
                const privJwk = await cryptoService.exportKey(newKeys.privateKey);

                localStorage.setItem(storageKey, JSON.stringify({ publicKey: pubJwk, privateKey: privJwk }));

                await supabase.from('user_public_keys').upsert({
                    user_id: currentUser.id,
                    public_key_json: pubJwk
                });

                keyPair = newKeys;
                console.log("☁️ Public Key Uploaded");
            }

            set({ identityKeys: keyPair });
        } catch (e) {
            console.error("Error initializing PKI identity:", e);
        }
    },

    // --- PHASE 8: ENCRYPTION (PREMIUM) ---
    // 🌐 BUSCAR PROVAS DA REDE
    fetchNetworkExams: async () => {
        try {
            console.log('🌐 Fetching network exams...');
            const { data, error } = await supabase
                .from('exams')
                .select('*')
                .eq('status', 'PUBLICADA')
                .limit(50);

            if (data) {
                const mappedExams = data.map((e: any) => ({ ...e, isNetwork: true }));
                // @ts-ignore
                set({ networkExams: mappedExams });
            }
        } catch (error) {
            console.error('Network fetch error:', error);
        }
    },

    sealExam: async (examId: string) => {
        try {
            // 1. Fetch complete exam data
            // Removed items(*) as it might fail if relationship not defined, and we use hybrid fetch anyway
            const { data: exam, error: fetchErr } = await supabase.from('exams').select('items_config').eq('id', examId).single();
            if (fetchErr) throw fetchErr;

            // Hybrid fetch (Get items from items_config if not pre-joined)
            let items: any[] = [];
            if (exam?.items_config) {
                const itemIds = Array.isArray(exam.items_config)
                    ? exam.items_config.map((ic: any) => typeof ic === 'string' ? ic : ic.itemId)
                    : [];

                if (itemIds.length > 0) {
                    const { data: fetchedItems, error: itemsErr } = await supabase.from('items').select('*').in('id', itemIds);
                    if (itemsErr) throw itemsErr;
                    items = fetchedItems || [];
                }
            }

            if (!items || items.length === 0) throw new Error("Questões não encontradas para criptografia.");

            // 2. Generate Key
            const { cryptoService } = await import('../services/cryptoService');
            const sessionKeyJwk = await cryptoService.generateExamKey();
            const sessionKey = await cryptoService.importKey(sessionKeyJwk);

            // 3. Encrypt Blob
            const payload = await cryptoService.encryptData(items, sessionKey);

            // 4. PKI: Wrap Key for Allocated Students (Corrected table name to exam_registrations)
            const { data: allocations, error: allocErr } = await supabase.from('exam_registrations').select('student_id').eq('exam_id', examId);
            if (allocErr) console.warn("Erro ao buscar alocações (Ignorado):", allocErr);

            if (allocations && allocations.length > 0) {
                const studentIds = allocations.map(a => a.student_id);
                const { data: publicKeys } = await supabase.from('user_public_keys').select('user_id, public_key_json').in('user_id', studentIds);

                const secureKeysPayload = [];
                if (publicKeys) {
                    for (const pkRecord of publicKeys) {
                        try {
                            const studentPubKey = await cryptoService.importPublicKey(pkRecord.public_key_json);
                            const wrappedKey = await cryptoService.wrapKey(sessionKey, studentPubKey);
                            secureKeysPayload.push({
                                exam_id: examId,
                                student_id: pkRecord.user_id,
                                wrapped_key: wrappedKey
                            });
                        } catch (err) { console.warn("PKI Wrap Error:", err); }
                    }
                    if (secureKeysPayload.length > 0) {
                        await supabase.from('exam_secure_keys').insert(secureKeysPayload);
                    }
                }
            }

            // 5. SERVER GRADING: Store Key for the "Grading Bot" (Service Role)
            // This table allows the server to decrypt and grade the exam later.
            const { error: serverKeyError } = await supabase.from('exam_server_keys').insert({
                exam_id: examId,
                session_key_json: sessionKeyJwk
            });
            if (serverKeyError) {
                console.error("Failed to save Server Key (Grading might fail):", serverKeyError);
                // We don't block the flow, but warn logic could be better
            }

            // 6. Save Sealed Exam Blob
            const { error: updateError } = await supabase.from('exams').update({
                description: `[SECURE_PAYLOAD]${JSON.stringify(payload)}`,
                status: ExamStatus.PUBLISHED // Corrected to enum
            }).eq('id', examId);
            if (updateError) throw updateError;

            console.log("🔒 Exam Sealed Successfully (PKI Mode)", payload);
            alert(`Prova Criptografada e Distribuída!\n${allocations?.length || 0} chaves digitais enviadas.`);

            return { payload, key: sessionKeyJwk };

        } catch (e) {
            console.error("Error sealing exam:", e);
            throw e;
        }
    },



    // --- LIVE PROCTORING (REALTIME) ---
    realtimeChannel: null as any,
    liveAlerts: [] as any[], // Ephemeral alerts

    initializeExamEvents: (examId: string) => {
        const state = get();
        if (state.realtimeChannel) return; // Already connected

        const channel = supabase.channel(`exam_monitor:${examId}`, {
            config: {
                presence: {
                    key: state.currentUser?.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                // Presence synced
                // const newState = channel.presenceState();
            })
            .on('broadcast', { event: 'ALERT' }, (payload) => {
                console.log("🚨 Live Alert:", payload);
                set(state => ({ liveAlerts: [payload, ...state.liveAlerts] }));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const userStatus = {
                        studentId: state.currentUser?.id,
                        name: state.currentUser?.name,
                        role: state.currentUser?.role,
                        onlineAt: new Date().toISOString(),
                    };
                    await channel.track(userStatus);
                }
            });

        set({ realtimeChannel: channel });
    },

    broadcastEvent: async (eventName: string, payload: any) => {
        const state = get();
        if (state.realtimeChannel) {
            await state.realtimeChannel.send({
                type: 'broadcast',
                event: eventName,
                payload: payload
            });
        }
    },

    leaveExamChannel: async () => {
        const state = get();
        if (state.realtimeChannel) {
            await supabase.removeChannel(state.realtimeChannel);
            set({ realtimeChannel: null });
        }
    },

}));

// Wrapper para garantir que arrays nunca sejam null/undefined
export const useSafeAppStore = () => {
    const store = useAppStore();
    return {
        ...store,
        items: store.items || [],
        exams: store.exams || [],
        liveQuizSessions: store.liveQuizSessions || [],
        students: store.students || [],
        schools: store.schools || [],
        classes: store.classes || [],
        users: store.users || [],
        tenants: store.tenants || [],
        results: store.results || [],
        registrations: store.registrations || [],
        announcements: store.announcements || [],
        messages: store.messages || [],
        chatGroups: store.chatGroups || [],
        owlSessions: store.owlSessions || [],
        lessonPlans: store.lessonPlans || [],
        studyPlans: store.studyPlans || [],
        studentProfiles: store.studentProfiles || [],
        userProfiles: store.userProfiles || [],
        gamifiedEvents: store.gamifiedEvents || [],
        events: store.events || [],
        fetchExamItems: store.fetchExamItems,
        sealExam: store.sealExam
    };
};
