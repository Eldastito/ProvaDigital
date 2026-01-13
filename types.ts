
// Enums
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STATE_ADMIN = 'STATE_ADMIN', // Secretaria Estadual
  TENANT_ADMIN = 'TENANT_ADMIN', // Secretaria Municipal
  DIRETOR = 'DIRETOR',
  SUPERVISOR = 'SUPERVISOR',
  PROFESSOR = 'PROFESSOR',
  ALUNO = 'ALUNO',
  PAIS = 'PAIS' // Pais/Responsáveis
}

export enum TenantType {
  PUBLIC_MUNICIPAL = 'PUBLIC_MUNICIPAL',
  PUBLIC_STATE = 'PUBLIC_STATE',
  PUBLIC_FEDERAL = 'PUBLIC_FEDERAL',
  PRIVATE = 'PRIVATE'
}

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  features: {
    ai_audit?: boolean;
    neuro_screening?: boolean;
    tablet_mode?: boolean;
    offline_sync?: boolean;
    bi_advanced?: boolean;
  };
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorId?: string;
  actorEmail?: string;
  actionType: string;
  targetResource?: string;
  targetId?: string;
  details: any;
  createdAt: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  ESSAY = 'ESSAY', // Questão Discursiva
  REDACTION = 'REDACTION' // Redação
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

export enum ItemLifecycleStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

// --- PERMISSIONS & CAPABILITIES ---

export type Resource =
  | 'SCHOOL_DATA'      // Escolas, Turmas
  | 'USER_DATA'        // Alunos, Professores
  | 'ITEM_BANK'        // Questões
  | 'EXAM_MGMT'        // Provas, Alocação
  | 'OFFLINE_OPS'      // App Tablet, Sync
  | 'ANALYTICS'        // Dashboards
  | 'COMMUNICATION'    // Chat, Mural
  | 'AI_FEATURES'      // Geração, Correção
  | 'FINANCIAL'       // Apenas Super Admin
  | 'NEURO_SCREENING' // Triagem
  | 'GAMIFIED_EVENTS'; // NOVO: Gestão de Eventos

export type Action = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE';

export interface PermissionMatrix {
  [role: string]: {
    [resource in Resource]?: Action[];
  }
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

export interface AcademicAchievement {
  id: string;
  title: string; // ex: "Ouro - Olimpíada de Matemática"
  type: 'OLIMPIADA' | 'CONCURSO' | 'EVENTO' | 'MONITORIA';
  date: string;
  bonusPoints: number; // Pontos extras no IDG (ex: 0.5)
}

export interface UserProfileExtended {
  userId: string;
  avatarUrl?: string;
  bio?: string;
  assessments: AssessmentResult[];
  owlCoins: number;
  xp?: number; // Pontos de experiência para gamificação
  badges: string[]; // Badges gamificados (visual)
  inventory?: string[]; // IDs de itens comprados
  equippedItems?: {
    hat?: string;
    outfit?: string;
    accessory?: string;
    body?: string; // Base Avatar ID
  };
  academicAchievements?: AcademicAchievement[]; // Conquistas com peso acadêmico
}

export type ShopItemCategory = 'HAT' | 'OUTFIT' | 'ACCESSORY' | 'BODY';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShopItemCategory;
  imageUrl: string; // Emoji ou URL
  minLevel?: number;
}

export interface ExternalGame {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  gameUrl: string;
  category: 'MATH' | 'LOGIC' | 'MEMORY' | 'STRATEGY';
  minLevel?: number;
}

export interface Tenant {
  id: string;
  name: string;
  type: TenantType; // NOVO: Tipo de Rede
  cnpj: string;
  disabledResources?: Resource[];
}

export interface SchoolResources {
  funding: boolean;
  uniforms: boolean;
  textbooks: boolean;
  adminMaterials: boolean;
  extracurricular: boolean;
  internet: boolean;
  lab: boolean;
  accessibility: boolean;
  food: boolean;
  transportation: boolean;
  security: boolean;
  ac_cooling: boolean;
}

export interface School {
  id: string;
  tenantId: string;
  name: string;
  inep: string;
  resources?: SchoolResources;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  name: string;
  series: string;
  shift: 'MANHA' | 'TARDE' | 'NOITE';
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
  status?: string;
  childrenIds?: string[]; // Array de IDs dos filhos
  specialNeeds?: string[]; // Condition codes like TEA, TDAH, DISLEXIA
}

export interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  classId: string;
  schoolId: string;
  tenantId: string;
}

export interface ItemAlternative {
  id: string;
  text: string;
  isCorrect: boolean;
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
  alternatives: ItemAlternative[];
  correctAnswerJustification: string;
  difficulty: DifficultyLevel;
  score: number;
  origin: ItemOrigin;
  tags: string[];
  bnccCode?: string;
  minLines?: number;
  maxLines?: number;
  showWordCount?: boolean;
  triParams?: {
    difficulty: number; // b parameter
    discrimination: number; // a parameter
    guessing: number; // c parameter
    bloomTaxonomy?: string;
  };
  usageCount: number;
  isAccessible?: boolean; // Se a questão foi adaptada para PCD/Neuro
  accessibilityInstructions?: string; // Orientações p/ ledor/transcritor
  multimedia?: {
    type: 'IMAGE' | 'VIDEO' | 'AUDIO';
    url: string;
    description?: string; // Alt text p/ acessibilidade
  }[];
  generationBatchId?: string;
  lifecycleStatus?: ItemLifecycleStatus;
  currentVersionId?: string; // Phase V2: Link to official version head
  createdAt: string;
}

export interface ItemVersion {
  id: string;
  itemId: string;
  versionNumber: number;
  statement: string;
  alternatives: ItemAlternative[];
  correctAnswerJustification: string;
  metadata: any;
  changeReason: string;
  changedBy: string;
  createdAt: string;
}

export enum ExamModel {
  SOMATIVO = 'SOMATIVO',
  ADAPTADO = 'ADAPTADO'
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PUBLISHED = 'PUBLISHED'
}

// Phase 10: Print Configuration
export interface PrintConfig {
  includeCover: boolean;
  includeAnswerSheet: boolean;
  includeInstructions: boolean;
  logoUrl?: string;
  coverTemplate: 'formal' | 'modern' | 'minimalist';
  showPointValues: boolean;
  showBNCC: boolean;
  headerText?: string;
  footerText?: string;
}

export interface ExamItemConfig {
  itemId: string;
  itemVersionId?: string; // Phase V2: Link to immutable version
  order: number;
  customScore?: number;
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
  items: ExamItemConfig[];
  classIds: string[];
  shuffleItems?: boolean; // Embaralhamento randômico anti-cola
  printConfig?: PrintConfig; // Phase 10: Print settings
  maxScore: number; // Max possible score
  createdAt: string;
  scheduledDate?: string;
}

export interface ExamVariant {
  id: string;
  examId: string;
  name: string;
  slug: string;
  description: string;
  accessibilityConfig: any;
  createdAt: string;
}

export interface ExamVariantOverride {
  id: string;
  variantId: string;
  itemVersionId: string;
  overridePayload: any;
  rationale: string;
  status: string;
  createdAt: string;
}

export enum RegistrationStatus {
  INSCRITO = 'INSCRITO',
  PRESENTE = 'PRESENTE',
  AUSENTE = 'AUSENTE',
  FINALIZADO = 'FINALIZADO'
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
  text?: string; // For Essay answers
  isCorrect: boolean;
  scoreObtained: number;
  essayFeedback?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  classId?: string; // Optional for filtering compatibility
  answers: StudentAnswer[];
  totalScore: number;
  gradedAt: string;
  submittedAt?: string; // When the exam was submitted
  violationCount?: number;
  securityFlags?: string[];
  pedagogicalFeedback?: string; // AI-generated tips
  autoGradeLog?: any; // Details of the grading process
}

export interface ItemGenerationBatch {
  id: string;
  creatorId: string;
  tenantId: string;
  promptContext?: string;
  promptHash?: string;
  totalRequested: number;
  status?: 'open' | 'finalized' | 'archived';
  source?: string;
  createdAt: string;
}

export interface ExamVersion {
  id: string;
  examId: string;
  versionNumber: number;
  itemsSnapshot: any[];
  gradingConfig: {
    totalsByDiscipline: Record<string, number>;
    totalScore: number;
  };
  coverConfig: {
    title: string;
    instructions: string[];
    securityNotices: string[];
  };
  status: 'draft' | 'published' | 'archived';
  scheduledStart?: string;
  scheduledEnd?: string;
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  examVersionId: string;
  studentId: string;
  status: 'started' | 'submitted' | 'flagged' | 'timed_out';
  startedAt: string;
  submittedAt?: string;
  lastPingAt: string;
  violationCount: number;
  ipAddress?: string;
  deviceInfo?: any;
  metadata?: any;
}

export interface ExamAttemptEvent {
  id: string;
  attemptId: string;
  eventType: 'focus_lost' | 'focus_gained' | 'screenshot' | 'devtools_open' | 'copy_paste';
  severity: 'info' | 'warning' | 'critical';
  eventData?: any;
  createdAt: string;
}

export interface ExamVariant {
  id: string;
  examVersionId: string;
  conditionCode: string; // TEA | TDAH | DIFIC_APRENDIZAGEM
  variantRules: any;
  status: 'active' | 'archived';
  accessibilityRules?: any; // UI/Process overrides
  createdAt: string;
}



// --- MENTORSHIP SYSTEM (NEW) ---
export enum MentorshipStatus {
  OPEN = 'ABERTO',
  IN_PROGRESS = 'EM_ANDAMENTO',
  COMPLETED = 'CONCLUIDO',
  CANCELLED = 'CANCELADO'
}

export interface MentorshipRequest {
  id: string;
  studentId: string; // Quem pediu
  studentName: string;
  subject: string;
  description: string;
  status: MentorshipStatus;
  mentorId?: string; // Quem aceitou
  mentorName?: string;
  createdAt: string;
  verificationPin?: string; // PIN 4 dígitos gerado pelo sistema
  rewardXp: number; // XP de recompensa
}

// --- NOVO: GAMIFIED EVENTS ---
export type GamifiedEventType = 'OLIMPIADA' | 'SOLETRANDO' | 'QUIZ_SHOW' | 'FEIRA_CIENCIAS' | 'DEBATE';

export enum GamifiedEventStatus {
  OPEN = 'INSCRICOES_ABERTAS',
  CLOSED = 'INSCRICOES_ENCERRADAS',
  LIVE = 'EM_ANDAMENTO',
  FINISHED = 'FINALIZADO'
}

export interface GamifiedEventParticipant {
  studentId: string;
  status: 'INSCRITO' | 'CONFIRMADO' | 'DESCLASSIFICADO' | 'CONCLUIDO';
  score: number; // Pontuação no evento
  rank?: number; // Classificação final
  feedback?: string; // Feedback individual
}

export interface GamifiedEvent {
  id: string;
  schoolId: string;
  creatorId: string; // Professor responsável
  title: string;
  type: GamifiedEventType;
  subject: string; // Matéria vinculada (ex: Matemática)
  description: string;
  rules: string; // Regras para "Dar Ciente"
  eventDate: string;
  registrationDeadline: string;
  status: GamifiedEventStatus;
  rewardCoins: number; // Prêmio em moedas
  participants: GamifiedEventParticipant[];
}

export interface Announcement {
  id: string;
  tenantId: string;
  schoolId: string;
  authorId: string;
  title: string;
  content: string;
  type: 'AVISO' | 'EVENTO' | 'URGENTE';
  createdAt: string;
  eventDate?: string;
  priority?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'IMAGE' | 'PDF' | 'DOC' | 'AUDIO';
  url: string;
  duration?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  groupId?: string;
  content: string;
  attachment?: ChatAttachment;
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
  messages: { role: 'user' | 'model', text: string }[];
  startedAt: string;
}

export interface OwlTutorContext {
  initialMessage?: string;
  contextData?: string;
  examId?: string;
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
  generatedBy: string;
  title: string;
  tasks: { id: string, description: string, completed: boolean }[];
  createdAt: string;
}

export interface StudentProfile {
  studentId: string;
  learningChannel: string;
  discProfile: string;
  topStrengths: string[];
  lastUpdated: string;
}

export interface AppSettings {
  rankingEnabled: boolean;
  rankingAnonymity: 'NOMINAL' | 'ANONIMO';
}

export type MeshRole = 'SERVER' | 'COORDINATOR' | 'PROFESSOR' | 'STUDENT' | 'UNASSIGNED';
export type MeshMessageType = 'ANNOUNCE' | 'PROVISION_CMD' | 'SYNC_DATA' | 'HEARTBEAT' | 'ALERT';

export interface MeshPeer {
  id: string;
  name: string;
  role: MeshRole;
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

export interface ProvisioningPayload {
  targetRole: MeshRole;
  assignedName?: string;
  killNetworkAfter: boolean;
}

export enum EventStatus {
  DOWNLOADED = 'DOWNLOADED',
  DISTRIBUTED = 'DISTRIBUTED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  SYNCED = 'SYNCED'
}

export interface ExamEvent {
  eventId: string;
  examTitle: string;
  className: string;
  date: string;
  status: EventStatus;
  keyMaterial: JsonWebKey;
  packages: {
    exam: EncryptedPackage;
    allocation: EncryptedPackage;
  };
  studentPackages?: { studentId: string, package: EncryptedPackage }[];
  stats: { expected: number, present: number };
}

export interface EncryptedPackage {
  iv: string;
  data: string;
}

export interface EventKey {
  eventId: string;
  keyMaterial: JsonWebKey;
}

export interface ExamPackageDecrypted {
  examId: string;
  title: string;
  items: Item[];
  duration: number;
}

export interface AllocationPackageDecrypted {
  examId: string;
  classId: string;
  students: { id: string, name: string, registrationNumber: string }[];
}

export interface SessionStudent {
  studentId: string;
  name: string;
  registrationNumber: string;
  status: 'DISCONNECTED' | 'CONNECTED' | 'FINISHED';
  encryptedAnswers?: EncryptedPackage;
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface StudentStats {
  studentId: string;
  idgScore: number; // Índice de Desempenho Global (Ponderado)
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

export interface SecurityEvent {
  timestamp: string;
  type: 'FOCUS_LOST' | 'ALT_TAB' | 'FULLSCREEN_EXIT' | 'KEYBOARD_VIOLATION' | 'MOUSE_VIOLATION';
  details: string;
}

export interface StoredSession {
  sessionId: string;
  studentId: string;
  studentName: string;
  eventId: string;
  encryptedData: string;
  timestamp: string;
  synced: boolean;
}

// ============================================
// Phase 12: Arcade Mode
// ============================================

export interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  thumbnailUrl?: string;
  isActive: boolean;
  playCount: number;
  tenantId?: string;
  createdAt?: string;
}

export interface AppState {
  currentUser: User | null;
  selectedChildId: string | null;
  tenants: Tenant[];
  schools: School[];
  classes: SchoolClass[];
  users: User[];
  students: Student[];
  items: Item[];
  exams: Exam[];
  registrations: ExamRegistration[];
  results: ExamResult[];
  mentorships: MentorshipRequest[]; // NOVO
  events: ExamEvent[];
  gamifiedEvents: GamifiedEvent[]; // NOVO
  arcadeGames: ArcadeGame[];
  announcements: Announcement[];
  messages: ChatMessage[];
  chatGroups: ChatGroup[];
  owlSessions: OwlSession[];
  owlTutorContext: OwlTutorContext | null; // NOVO: Contexto para abrir o chat
  lessonPlans: LessonPlan[];
  studyPlans: StudyPlan[];
  studentProfiles: StudentProfile[];
  userProfiles: UserProfileExtended[];
  itemGenerationBatches: ItemGenerationBatch[];
  activeBatchId: string | null;
  examVersions: ExamVersion[];
  examVariants: ExamVariant[];
  examAttempts: ExamAttempt[];
  examAttemptEvents: ExamAttemptEvent[];
  settings: AppSettings;
  globalPermissions: PermissionMatrix;
  hasConsented: boolean; // LGPD Consent Status
  isInitialized: boolean;
  auditLogs: AuditLog[];
}

// ============================================
// Phase 11: Advanced Analytics & Reports Types
// ============================================

export interface PerformanceMetrics {
  averageScore: number;
  medianScore: number;
  standardDeviation: number;
  completionRate: number;
  improvementRate: number;
  totalStudents: number;
  passRate: number; // Percentage of students above passing threshold
}

export interface BNCCCompetency {
  code: string;
  description: string;
  averageScore: number;
  questionsCount: number;
  masteryLevel: 'low' | 'medium' | 'high';
  studentsAboveAverage: number;
  studentsBelowAverage: number;
}

export type ReportType = 'student' | 'class' | 'subject' | 'bncc' | 'risk';
export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  dateRange: { start: string; end: string };
  includeCharts: boolean;
  includeRecommendations: boolean;
  targetIds: string[]; // Student IDs, Class IDs, etc.
  customTitle?: string;
}

export interface AnalyticsFilter {
  dateRange?: { start: string; end: string };
  classIds?: string[];
  subjects?: string[];
  difficultyLevels?: DifficultyLevel[];
  bnccCodes?: string[];
  examIds?: string[];
}

export interface PerformanceDataPoint {
  date: string;
  score: number;
  examTitle: string;
  subject: string;
}

export interface SubjectPerformance {
  subject: string;
  averageScore: number;
  questionsCount: number;
  examsCount: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface CompetencyRadarData {
  competency: string;
  studentScore: number;
  classAverage: number;
  maxScore: number;
}

export interface ComparativeMetrics {
  entityId: string;
  entityName: string;
  metrics: PerformanceMetrics;
  rank?: number;
}

export interface TrendAnalysis {
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dataPoints: PerformanceDataPoint[];
  trendLine: number[]; // Linear regression values
  growthRate: number; // Percentage
  prediction?: number; // Next period prediction
}

export interface StudentReportData {
  student: User;
  overallMetrics: PerformanceMetrics;
  subjectPerformance: SubjectPerformance[];
  bnccCompetencies: BNCCCompetency[];
  performanceEvolution: PerformanceDataPoint[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ClassReportData {
  class: SchoolClass;
  overallMetrics: PerformanceMetrics;
  topPerformers: { studentId: string; name: string; score: number }[];
  atRiskStudents: { studentId: string; name: string; riskLevel: RiskLevel }[];
  subjectBreakdown: SubjectPerformance[];
  bnccHeatmap: BNCCCompetency[];
}
