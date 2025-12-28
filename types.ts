
// Enums
export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    STATE_ADMIN = 'STATE_ADMIN',
    TENANT_ADMIN = 'TENANT_ADMIN',
    DIRETOR = 'DIRETOR',
    SUPERVISOR = 'SUPERVISOR',
    PROFESSOR = 'PROFESSOR',
    ALUNO = 'ALUNO',
    PAIS = 'PAIS'
}

export enum TenantType {
    PUBLIC_MUNICIPAL = 'PUBLIC_MUNICIPAL',
    PUBLIC_STATE = 'PUBLIC_STATE',
    PUBLIC_FEDERAL = 'PUBLIC_FEDERAL',
    PRIVATE = 'PRIVATE'
}

export enum QuestionType {
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    TRUE_FALSE = 'TRUE_FALSE',
    ESSAY = 'ESSAY',
    REDACTION = 'REDACTION'
}

export enum DifficultyLevel {
    EASY = 'FACIL',
    MEDIUM = 'MEDIO',
    HARD = 'DIFICIL'
}

export enum ItemOrigin {
    MANUAL = 'MANUAL',
    IA = 'IA'
}

// Recursos que podem ser controlados via Gestão
export type Resource = 
    | 'SCHOOL_DATA'      // Escolas e Turmas
    | 'USER_DATA'        // Cadastros de Alunos/Staff
    | 'ITEM_BANK'        // Banco de Itens
    | 'EXAM_MGMT'        // Provas Digitais
    | 'ANALYTICS'        // Dashboards e Relatórios
    | 'COMMUNICATION'    // Chat e Mensagens
    | 'AI_FEATURES'      // Ferramentas Gemini
    | 'FINANCIAL'        // Cobranças e Recursos
    | 'NEURO_SCREENING'  // Triagem Clínica
    | 'GAMIFIED_EVENTS'  // Olimpíadas e Quiz
    | 'GOVERNANCE'       // Acesso à própria tela de Permissões
    | 'OFFLINE_OPS';     // Operações Offline (Tablet)

export type Action = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE';

export interface PermissionMatrix {
    [role: string]: {
        [resource in Resource]?: Action[];
    }
}

export interface AppState {
    currentUser: User | null;
    selectedChildId: string | null;
    settings: AppSettings;
    globalPermissions: PermissionMatrix;
}

export interface User {
    id: string;
    name: string;
    nickname?: string;
    email: string;
    role: UserRole;
    tenantId: string;
    schoolId?: string;
    classIds?: string[];
    childrenIds?: string[];
}

export interface AppSettings {
    rankingEnabled: boolean;
    rankingAnonymity: 'NOMINAL' | 'ANONIMO';
}

export interface Tenant {
    id: string;
    name: string;
    type: TenantType;
    cnpj: string;
    disabledResources?: Resource[];
}

export interface SchoolResources {
    [key: string]: boolean; // Permite campos dinâmicos adicionados pelo usuário
}

export interface School {
    id: string;
    tenantId: string;
    name: string;
    inep: string;
    resources: SchoolResources;
}

export interface SchoolClass {
    id: string;
    schoolId: string;
    name: string;
    series: string;
    shift: string;
    capacity?: number; // Lotação máxima da turma
}

export interface Student {
    id: string;
    name: string;
    registrationNumber: string;
    classId: string;
    schoolId: string;
    tenantId: string;
}

export interface DailyAttendance {
    id: string;
    studentId: string;
    classId: string;
    professorId: string;
    date: string; // ISO Date YYYY-MM-DD
    status: 'PRESENT' | 'ABSENT';
    timestamp: string; // Exact check-in time
}

export enum ExamModel {
    SOMATIVO = 'SOMATIVO',
    ADAPTADO = 'ADAPTADO'
}

export enum ExamStatus {
    DRAFT = 'RASCUNHO',
    PUBLISHED = 'PUBLICADA'
}

export interface Exam {
    id: string;
    tenantId: string;
    schoolId: string;
    creatorId: string;
    title: string;
    description?: string;
    subject: string;
    model: ExamModel;
    durationMinutes: number;
    targetQuestionCount: number;
    status: ExamStatus;
    items: { itemId: string; order: number; customScore?: number }[];
    classIds: string[];
    createdAt: string;
    scheduledDate?: string;
}

export interface Item {
    id: string;
    tenantId: string;
    schoolId?: string;
    ownerId: string;
    knowledgeArea: string;
    subject: string;
    type: QuestionType;
    statement: string;
    imageUrl?: string;
    alternatives: { id: string; text: string; isCorrect: boolean }[];
    correctAnswerJustification: string;
    difficulty: DifficultyLevel;
    score: number;
    origin: ItemOrigin;
    tags: string[];
    usageCount: number;
    createdAt: string;
    bnccCode?: string;
    minLines?: number;
    maxLines?: number;
    showWordCount?: boolean;
}

export enum RegistrationStatus {
    INSCRITO = 'INSCRITO',
    PRESENTE = 'PRESENTE',
    AUSENTE = 'AUSENTE',
    CONCLUIDO = 'CONCLUIDO'
}

export interface ExamRegistration {
    id: string;
    examId: string;
    studentId: string;
    classId: string;
    status: RegistrationStatus;
}

export interface StudentAnswer {
    itemId: string;
    selectedAlternativeId: string | null;
    isCorrect: boolean;
    scoreObtained: number;
}

export interface ExamResult {
    id: string;
    examId: string;
    studentId: string;
    answers: StudentAnswer[];
    totalScore: number;
    gradedAt: string;
    violationCount?: number;
    securityFlags?: string[];
}

export interface Announcement {
    id: string;
    tenantId: string;
    schoolId: string;
    authorId: string;
    title: string;
    content: string;
    type: 'EVENTO' | 'AVISO';
    createdAt: string;
    eventDate?: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    recipientId?: string;
    groupId?: string;
    content: string;
    attachment?: string;
    timestamp: string;
    isRead: boolean;
    isReported?: boolean;
}

export interface ChatGroup {
    id: string;
    name: string;
    schoolId: string;
    creatorId: string;
    moderatorId: string;
    memberIds: string[];
    createdAt: string;
}

export interface OwlSession {
    id: string;
    studentId: string;
    messages: { role: 'user' | 'model'; text: string }[];
    startedAt: string;
}

export interface LessonPlan {
    id: string;
    professorId: string;
    classId: string;
    subject: string;
    topic: string;
    objectives: string;
    content: string;
    date: string;
}

export interface StudyPlan {
    id: string;
    studentId: string;
    generatedBy: 'IA' | 'PROFESSOR';
    title: string;
    tasks: string[];
    createdAt: string;
}

export interface StudentProfile {
    studentId: string;
    learningChannel: 'VISUAL' | 'AUDITIVO' | 'CINESTESICO';
    discProfile: string;
    topStrengths: string[];
    lastUpdated: string;
}

export enum RiskLevel {
    LOW = 'BAIXO',
    MEDIUM = 'MEDIO',
    HIGH = 'ALTO'
}

export enum AssessmentType {
    DISC = 'DISC',
    LEARNING_STYLE = 'ESTILO_APRENDIZAGEM',
    POSITIVE_PSYCH = 'PSICOLOGIA_POSITIVA',
    TEMPERAMENT = 'TEMPERAMENTO',
    TDAH_SCREENING = 'TRIAGEM_TDAH',
    AUTISM_SCREENING = 'TRIAGEM_AUTISMO',
    LEARNING_SCREENING = 'TRIAGEM_APRENDIZAGEM'
}

export interface AssessmentResult {
    id: string;
    type: AssessmentType;
    date: string;
    resultType: string;
    report: string;
    strengths: string[];
    weaknesses: string[];
}

export interface UserProfileExtended {
    userId: string;
    avatarUrl?: string;
    bio?: string;
    assessments: AssessmentResult[];
    owlCoins: number;
    badges: string[];
    academicAchievements?: {
        id: string;
        title: string;
        type: 'OLIMPIADA' | 'EVENTO';
        date: string;
        bonusPoints: number;
    }[];
}

export enum GamifiedEventStatus {
    OPEN = 'ABERTO',
    ONGOING = 'EM_ANDAMENTO',
    FINISHED = 'FINALIZADO'
}

export type GamifiedEventType = 'OLIMPIADA' | 'SOLETRANDO' | 'QUIZ_SHOW';

export interface GamifiedEvent {
    id: string;
    schoolId: string;
    creatorId: string;
    title: string;
    type: GamifiedEventType;
    subject: string;
    description: string;
    rules: string;
    eventDate: string;
    registrationDeadline: string;
    status: GamifiedEventStatus;
    rewardCoins: number;
    participants: {
        studentId: string;
        status: 'INSCRITO' | 'CONCLUIDO';
        score: number;
        rank?: number;
        feedback?: string;
    }[];
}

export interface EncryptedPackage {
    iv: string;
    data: string;
}

export interface EventKey {
    eventId: string;
    keyMaterial: JsonWebKey;
}

export enum EventStatus {
    PENDING = 'PENDENTE',
    ACTIVE = 'ATIVO',
    FINISHED = 'FINALIZADO'
}

export interface ExamEvent {
    eventId: string;
    examId: string;
    classId: string;
    status: EventStatus;
    date: string;
}

export enum MeshRole {
    COORDINATOR = 'COORDINATOR',
    PROFESSOR = 'PROFESSOR',
    STUDENT = 'STUDENT',
    UNASSIGNED = 'UNASSIGNED'
}

export type MeshMessageType = 'ANNOUNCE' | 'PROVISION_CMD' | 'ALERT' | 'SYNC_RESULTS';

export interface MeshPeer {
    id: string;
    name: string;
    role: MeshRole | 'UNASSIGNED';
    isOnline: boolean;
    lastSeen: number;
}

export interface MeshMessage {
    type: MeshMessageType;
    sender: MeshPeer;
    targetId?: string;
    payload: any;
    timestamp: number;
}

export interface StudentStats {
    studentId: string;
    idgScore: number;
    examAverage: number;
    projectAverage: number;
    bonusPoints: number;
    examsTaken: number;
    attendanceRate: number;
    riskLevel: RiskLevel;
    missingPointsForApproval: number;
    strongestSubject: string;
    weakestSubject: string;
}

export interface StoredSession {
    sessionId: string;
    studentId: string;
    eventId: string;
    synced: boolean;
    data: any;
}

export interface SecurityEvent {
    timestamp: string;
    type: 'FOCUS_LOST' | 'KEYBOARD_VIOLATION' | 'FULLSCREEN_EXIT';
    details: string;
}

export interface ProvisioningPayload {
    targetRole: MeshRole;
    assignedName: string;
    killNetworkAfter: boolean;
}
