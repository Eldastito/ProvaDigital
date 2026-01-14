import { create } from 'zustand';
import {
    AppState, Exam, Item, ExamModel, ExamStatus, QuestionType, DifficultyLevel,
    ItemOrigin, UserRole, User, AppSettings, PermissionMatrix, ChatMessage,
    ChatGroup, Announcement, LessonPlan, StudyPlan, GamifiedEvent, ExamResult,
    MentorshipRequest, MentorshipStatus, OwlTutorContext, ItemGenerationBatch,
    ItemLifecycleStatus, ExamVersion, ExamVariant, Tenant, School, SchoolClass,
    UserProfileExtended, ExamRegistration, RegistrationStatus,
    ExamAttempt, ExamAttemptEvent, AuditLog, ArcadeGame, ExamVariantOverride
} from '../types';
import { uuidv4 } from '../utils/helpers';
import { INITIAL_TENANTS, INITIAL_SCHOOLS, INITIAL_CLASSES, INITIAL_USERS, INITIAL_ITEMS, INITIAL_STUDENTS, INITIAL_RESULTS, INITIAL_EXAMS, INITIAL_REGISTRATIONS, INITIAL_ANNOUNCEMENTS, INITIAL_MESSAGES, INITIAL_LESSON_PLANS, INITIAL_STUDY_PLANS, INITIAL_STUDENT_PROFILES, INITIAL_USER_PROFILES, INITIAL_SETTINGS, INITIAL_GAMIFIED_EVENTS } from '../utils/mockData';
import { supabase } from '../services/supabaseClient';

// OTIMIZAÇÃO HIERÁRQUICA DE PERMISSÕES - [Deploy Trigger: 2026-01-11]
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
    addItems: (items: Item[]) => Promise<void>;
    updateItem: (item: Item) => Promise<void>;
    updateItemWithVersion: (itemId: string, updates: Partial<Item>, changeReason: string) => Promise<void>;
    addExam: (exam: Exam) => void;
    addSchool: (school: any) => void;
    addClass: (cls: any) => void;
    addStudent: (student: any) => void;
    addUser: (user: User) => void;
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
    startExamAttempt: (attempt: { examVersionId: string; studentId: string }) => Promise<string>;
    logSecurityEvent: (event: { attemptId: string; eventType: string; severity: string; eventData?: any }) => Promise<void>;
    submitExamAttempt: (attemptId: string, status: 'submitted' | 'timed_out') => Promise<void>;
    reopenExamAttempt: (attemptId: string) => Promise<void>;

    // --- PHASE 4 ACTIONS ---
    calculateAndSaveResult: (attemptId: string, answers: any[]) => Promise<void>;
    getRecommendedVariant: (studentId: string, versionId: string) => Promise<string | null>;

    // --- PHASE 5: ADMIN & BI ---
    updateTenantFeatures: (tenantId: string, features: any) => Promise<void>;
    fetchAuditLogs: (tenantId: string) => Promise<AuditLog[]>;
    loadTenants: () => Promise<void>;

    // --- PHASE 6: ARCADE GAMES ---
    loadArcadeGames: () => Promise<void>;
    addArcadeGame: (game: ArcadeGame) => Promise<void>;
    updateArcadeGame: (game: ArcadeGame) => Promise<void>;
    deleteArcadeGame: (id: string) => Promise<void>;
}

export type AppStore = AppState & AppActions;

// Check if mock data should be used
// const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const USE_MOCK_DATA = false; // Forced to FALSE per user request

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

    examAttempts: [],
    examAttemptEvents: [],
    settings: USE_MOCK_DATA ? INITIAL_SETTINGS : INITIAL_SETTINGS, // Always use settings
    globalPermissions: DEFAULT_PERMISSIONS,
    hasConsented: false,
    isInitialized: false,
    auditLogs: [],

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
                    usageCount: 0,
                    createdAt: i.created_at
                }));
                // Mescla com mocks, usando Map para garantir que DB sobrescreva estado local/parcial
                set(state => {
                    const itemMap = new Map(state.items.map(i => [i.id, i]));
                    formattedItems.forEach(item => {
                        itemMap.set(item.id, item);
                    });
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
                    classIds: e.class_ids,
                    model: e.model || 'SOMATIVO',
                    durationMinutes: e.duration_minutes || 60,
                    targetQuestionCount: e.target_question_count || 10,
                    scheduledDate: e.scheduled_date,
                    maxScore: e.max_score || 100, // Default to 100
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
    updateTenantFeatures: async (tenantId, features) => {
        set((state) => ({
            tenants: state.tenants.map(t => t.id === tenantId ? { ...t, features } : t)
        }));
        try {
            await supabase.from('tenants').update({ features }).eq('id', tenantId);
        } catch (e) { console.error(e); }
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

    // --- ARCADE GAMES IMPLEMENTATION ---
    loadArcadeGames: async () => {
        try {
            const { data, error } = await supabase.from('arcade_games').select('*');
            if (error) throw error;
            if (data) {
                const games: ArcadeGame[] = data.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    description: d.description,
                    url: d.url,
                    category: d.category,
                    thumbnailUrl: d.thumbnail_url,
                    isActive: d.is_active,
                    playCount: d.play_count,
                    tenantId: d.tenant_id,
                    createdAt: d.created_at
                }));
                // Merge with mocks if needed, or just set
                set({ arcadeGames: games });
            }
        } catch (e) {
            console.error("Error loading arcade games:", e);
        }
    },

    addArcadeGame: async (game) => {
        // Optimistic
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
                play_count: 0, // Default
                tenant_id: get().currentUser?.tenantId,
                created_at: game.createdAt
            });
            if (error) throw error;
        } catch (e) {
            console.error("Error saving arcade game:", e);
            // Rollback
            set(state => ({ arcadeGames: state.arcadeGames.filter(g => g.id !== game.id) }));
            alert("Erro ao salvar jogo. Verifique o console.");
        }
    },

    updateArcadeGame: async (game) => {
        // Optimistic
        set(state => ({ arcadeGames: state.arcadeGames.map(g => g.id === game.id ? game : g) }));
        try {
            const { error } = await supabase.from('arcade_games').update({
                title: game.title,
                description: game.description,
                url: game.gameUrl,
                category: game.category,
                thumbnail_url: game.thumbnailUrl,
                is_active: game.status === 'active',
                play_count: 0 // Keep unchanged ideally, but simplified for now
            }).eq('id', game.id);
            if (error) throw error;
        } catch (e) {
            console.error("Error updating arcade game:", e);
        }
    },

    deleteArcadeGame: async (id) => {
        // Optimistic
        set(state => ({ arcadeGames: state.arcadeGames.filter(g => g.id !== id) }));
        try {
            const { error } = await supabase.from('arcade_games').delete().eq('id', id);
            if (error) throw error;
        } catch (e) {
            console.error("Error deleting arcade game:", e);
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
            const { error } = await supabase.from('exam_attempts').insert({
                id: newAttempt.id,
                exam_version_id: newAttempt.examVersionId,
                student_id: newAttempt.studentId,
                status: newAttempt.status,
                started_at: newAttempt.startedAt,
                metadata: newAttempt.metadata
            });
            if (error) throw error;
        } catch (e) {
            console.error("Error starting attempt:", e);
        }
        return id;
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
            const { error } = await supabase.from('exam_attempt_events').insert({
                id: newEvent.id,
                attempt_id: newEvent.attemptId,
                event_type: newEvent.eventType,
                severity: newEvent.severity,
                event_data: newEvent.eventData
            });
            if (error) throw error;

            await supabase.rpc('increment_violation_count', { attempt_id_input: dto.attemptId });
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
        let pedagogicalFeedback = "Bom desempenho! Continue praticando os tópicos abordados.";
        if (incorrectItems.length > 0) {
            try {
                const { generateStudyPlanSuggestions } = await import('../services/geminiService');
                const feedback = await generateStudyPlanSuggestions(
                    state.currentUser?.name || 'Aluno',
                    incorrectItems[0].subject,
                    totalScore
                );
                pedagogicalFeedback = `${feedback.title}: ${feedback.tasks.join(', ')}`;
            } catch (e) {
                console.error("Error generating AI feedback:", e);
            }
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
            const { data } = await supabase.from('audit_logs')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });
            if (data) {
                const logs = data as AuditLog[];
                set({ auditLogs: logs });
                return logs;
            }
        } catch (e) { console.error(e); }
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
                    createdAt: g.created_at
                }));

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
}));

// Wrapper para garantir que arrays nunca sejam null/undefined
export const useSafeAppStore = () => {
    const store = useAppStore();
    return {
        ...store,
        items: store.items || [],
        exams: store.exams || [],
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
    };
};
