
// Enums
export enum UserRole {
  MASTER_SAAS = 'MASTER_SAAS', // Novo: Gestão ExamePad (Logística/Controle Master)
  SYSTEM_ADMIN = 'SYSTEM_ADMIN', // Gestão total do SaaS / Business
  SUPER_ADMIN = 'SUPER_ADMIN', // MEC / Gestão Educacional
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

// Tenant duplicado removido
/* 
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
*/

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

export interface ItemUsageRecord {
  questionId: string;
  schoolId: string;
  examId: string;
  year: number;
  usedAt: string;
  studentsCount: number;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  ESSAY = 'ESSAY', // Questão Discursiva
  REDACTION = 'REDACTION', // Redação
  SIMULATION = 'SIMULATION' // Simulação Interativa (Iframe/Canvas)
}

export enum DifficultyLevel {
  EASY = 'FACIL',
  MEDIUM = 'MEDIO',
  HARD = 'DIFICIL'
}

export enum BloomTaxonomy {
  REMEMBER = 'LEMBRAR',
  UNDERSTAND = 'ENTENDER',
  APPLY = 'APLICAR',
  ANALYZE = 'ANALISAR',
  EVALUATE = 'AVALIAR',
  CREATE = 'CRIAR'
}

export enum CognitiveAxis {
  DOMINAR_LINGUAGENS = 'DOMINAR_LINGUAGENS',
  COMPREENDER_FENOMENOS = 'COMPREENDER_FENOMENOS',
  ENFRENTAR_SITUACOES = 'ENFRENTAR_SITUACOES',
  CONSTRUIR_ARGUMENTACAO = 'CONSTRUIR_ARGUMENTACAO',
  ELABORAR_PROPOSTAS = 'ELABORAR_PROPOSTAS'
}

export enum ItemOrigin {
  MANUAL = 'MANUAL',
  IA = 'IA'
}

export enum LiteracyDomain {
  READING = 'LEITURA',
  MATHEMATICS = 'MATEMATICA',
  SCIENCE = 'CIENCIAS',
  FINANCIAL = 'FINANCEIRA',
  CREATIVE_THINKING = 'PENSAMENTO_CRIATIVO'
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
  | 'FINANCIAL'        // Apenas System Admin (Contratos/Faturamento)
  | 'NEURO_SCREENING'  // Triagem
  | 'GAMIFIED_EVENTS'  // NOVO: Gestão de Eventos
  | 'SCHEDULING'       // Agendamento de Provas
  | 'COMMAND_CENTER'   // Central de Comando
  | 'REPORTS'          // Relatórios e BI
  | 'SYSTEM_MGMT'      // Configurações globais do sistema
  | 'TENANT_MGMT'      // Gestão de clientes/prefeituras
  | 'SaaS_BILLING'     // Faturamento SaaS
  | 'PLATFORM_HEALTH'  // Monitoramento de infra
  | 'LOGISTICS_MASTER' // Novo: Controle ExamePad de Malas/Ativos
  | 'CUSTODY_OPS';     // Novo: Operação de Entrega/Retirada

export type Action = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE';

export interface PermissionMatrix {
  [role: string]: {
    [resource in Resource]?: Action[];
  }
}

// --- RESOURCE DEPENDENCIES ---

export interface ResourceDependency {
  resource: Resource;
  dependsOn: Resource[];
  description: string;
  impactWarning: string;
}

export const RESOURCE_DEPENDENCIES: ResourceDependency[] = [
  {
    resource: 'GAMIFIED_EVENTS',
    dependsOn: ['ANALYTICS', 'COMMUNICATION', 'USER_DATA'],
    description: 'Eventos Gamificados',
    impactWarning: 'Eventos Gamificados precisam de Analytics (rankings), Comunicação (notificações) e Gestão de Usuários (participantes)'
  },
  {
    resource: 'AI_FEATURES',
    dependsOn: ['ITEM_BANK'],
    description: 'Ferramentas de IA',
    impactWarning: 'IA precisa do Banco de Itens para gerar e corrigir questões'
  },
  {
    resource: 'OFFLINE_OPS',
    dependsOn: ['EXAM_MGMT', 'ITEM_BANK', 'USER_DATA'],
    description: 'Ecossistema Offline',
    impactWarning: 'App Tablet precisa sincronizar Provas, Questões e Alunos'
  },
  {
    resource: 'ANALYTICS',
    dependsOn: ['EXAM_MGMT', 'USER_DATA'],
    description: 'Analytics e Dashboards',
    impactWarning: 'Analytics precisa de dados de Provas e Alunos para gerar relatórios'
  },
  {
    resource: 'COMMUNICATION',
    dependsOn: ['USER_DATA'],
    description: 'Sistema de Comunicação',
    impactWarning: 'Chat e Mural precisam de Gestão de Usuários para enviar mensagens'
  },
  {
    resource: 'NEURO_SCREENING',
    dependsOn: ['USER_DATA'],
    description: 'Triagem Neuropsicológica',
    impactWarning: 'Triagens precisam de Gestão de Usuários para vincular resultados aos alunos'
  },
  {
    resource: 'REPORTS',
    dependsOn: ['ANALYTICS', 'EXAM_MGMT'],
    description: 'Relatórios e BI',
    impactWarning: 'Relatórios precisam de Analytics e dados de Provas'
  },
  {
    resource: 'COMMAND_CENTER',
    dependsOn: ['EXAM_MGMT', 'ANALYTICS'],
    description: 'Central de Comando',
    impactWarning: 'Central de Comando precisa gerenciar Provas e visualizar Analytics'
  },
  {
    resource: 'SCHEDULING',
    dependsOn: ['EXAM_MGMT', 'SCHOOL_DATA'],
    description: 'Agendamento de Provas',
    impactWarning: 'Agendamento precisa de Gestão de Provas e dados de Escolas/Turmas'
  }
];


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
  validatedBy?: string; // NOVO: Profissional que validou a triagem (Hardening)
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
  type: TenantType;
  cnpj: string;
  status: 'active' | 'suspended' | 'trial'; // Status de negócio
  billingEmail?: string;
  contractEnd?: string;
  maxStudents?: number;
  disabledResources?: Resource[];
  features?: {
    ai_audit?: boolean;
    neuro_screening?: boolean;
    tablet_mode?: boolean;
    offline_sync?: boolean;
    bi_advanced?: boolean;
  };
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
  city?: string;
  inep: string;
  resources?: SchoolResources;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  name: string;
  series: string;
  shift: 'MANHA' | 'TARDE' | 'NOITE';
  room?: string; // Sala de aula física
  teacherId?: string;
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
  phone?: string; // Telefone/WhatsApp de contato
  registrationNumber?: string; // Número de matrícula (para Alunos)
  birthDate?: string;
  gender?: 'M' | 'F' | 'OUTRO';
  motherName?: string;
  fatherName?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  documentNumber?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  subjectIds?: string[]; // Disciplinas/Áreas de conhecimento (para Professores)
  theme?: 'light' | 'dark'; // Preferência de tema do usuário
  createdAt?: string;
}

export interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  classId: string;
  schoolId: string;
  tenantId: string;
  birthDate?: string;
}

// --- CLASS DIARY QUALITATIVE DATA ---
export interface DiaryEntry {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  attendance: 'PRESENT' | 'ABSENT' | 'JUSTIFIED';
  occurrences: string[]; // IDs from QUICK_OCCURRENCES
  teacherId: string;
}

// --- PROJECTION LAB ---
export interface ProjectionMaterial {
  id: string;
  tenantId: string;
  schoolId: string;
  ownerId: string;
  title: string;
  type: '3D_MODEL' | 'VIDEO' | 'DOCUMENT' | 'MIND_MAP';
  category: string;
  url: string;
  thumbnail?: string;
  description?: string;
  createdAt?: string;
}

// --- AUDIT & METADATA TYPES ---

export interface QuestionMetadata {
  // Fonte
  source?: {
    type: 'manual' | 'ai_upload' | 'ai_context' | 'ai_topic';
    fileName?: string;
    fileType?: string;
    uploadDate?: string;
    pageRange?: string;
    extractedContext?: string;
  };

  // Geração
  generatedBy: 'professor' | 'ai';
  aiModel?: string;
  promptVersion?: string;
  generatedAt: string;

  // Uso
  timesUsed?: number;
  lastUsedAt?: string;
  usedInExams?: Array<{
    examId: string;
    examName: string;
    date: string;
    studentsCount: number;
  }>;
}

export interface ItemAlternative {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Item {
  id: string;
  isPublic?: boolean; // Novo campo para Marketplace (Sprint 6)
  downloadsCount?: number;
  ratingAvg?: number;
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
  literacyDomain?: LiteracyDomain; // Metadado OCDE/PISA
  minLines?: number;
  maxLines?: number;
  showWordCount?: boolean;
  triParams?: {
    calibrationStatus?: 'MODEL_ESTIMATED' | 'DATA_CALIBRATED' | 'FLAGGED';
    calibrationMetadata?: {
      sampleSize?: number;
      standardError?: number;
      lastCalibratedAt?: string;
    };
    difficulty: number; // b parameter
    discrimination: number; // a parameter
    guessing: number; // c parameter
    bloomTaxonomy?: BloomTaxonomy;
    cognitiveAxis?: CognitiveAxis;
  };
  usageCount: number;
  isAccessible?: boolean; // Se a questão foi adaptada para PCD/Neuro
  accessibilityInstructions?: string; // Orientações p/ ledor/transcritor
  multimedia?: {
    type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SIMULATION' | '3D_MODEL';
    url: string;
    description?: string; // Alt text p/ acessibilidade
  }[];
  simulationConfig?: {
    url: string;
    allowFullScreen?: boolean;
    communicationType?: 'POST_MESSAGE' | 'NONE';
    parameters?: Record<string, any>;
  };
  generationBatchId?: string;
  lifecycleStatus?: ItemLifecycleStatus;
  currentVersionId?: string; // Phase V2: Link to official version head

  // AI Governance (Phase VI)
  aiModelId?: string;
  aiPromptVersion?: string;
  aiGenerationSettings?: any;
  reviewerId?: string;
  reviewedAt?: string;

  metadata?: QuestionMetadata;

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
  ADAPTADO = 'ADAPTADO',
  OCDE_PISA = 'OCDE_PISA'
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PUBLISHED = 'PUBLISHED',
  PENDING_RESCHEDULE = 'PENDING_RESCHEDULE'
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
  items_config?: ExamItemConfig[]; // DB column alias
  classIds: string[];
  shuffleItems?: boolean; // Embaralhamento randômico anti-cola
  printConfig?: PrintConfig; // Phase 10: Print settings
  maxScore: number; // Max possible score
  isOfficialStandard?: boolean; // Flag para avaliações regulatórias/internacionais
  createdAt: string;
  scheduledDate?: string;
}

// ============================================================================
// LIVE QUIZ (Separate from Formal Exams)
// ============================================================================

export interface LiveQuizSession {
  id: string;
  tenantId: string;
  creatorId: string;
  title: string;
  className: string;
  maxParticipants: number;
  sessionCode: string; // QR code

  // Quiz Content
  itemIds: string[]; // IDs of questions from items table
  shuffleQuestions: boolean;

  // Session State
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  startedAt?: string;
  finishedAt?: string;

  // Participants
  participants: LiveQuizParticipant[];

  // Metadata
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface LiveQuizParticipant {
  name: string;
  id?: string; // If logged in
  score: number;
  violations: number;
  answers: Record<string, any>;
  joinedAt?: string;
}

export interface LiveQuizResult {
  id: string;
  sessionId: string;
  participantName: string;
  participantId?: string;
  score: number;
  answers: Record<string, any>;
  completedAt: string;
  violations: any[];
}


export interface ExamVariant {
  id: string;
  examId: string;
  name: string;
  slug: string;
  description: string;
  accessibilityConfig: any;
  examVersionId?: string; // Optional for now
  conditionCode?: string; // e.g. TDAH, LOW_VISION
  variantRules?: any;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface ExamVariantOverride {
  id: string;
  variantId: string;
  itemVersionId: string;
  overridePayload: any;
  rationale: string;
  status: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
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
  text?: string; // For Essay answers (Legacy)
  essayText?: string; // Explicit field for essays
  isCorrect: boolean;
  scoreObtained: number;
  essayFeedback?: string; // Legacy feedback
  aiFeedback?: string; // AI-generated feedback
  professorFeedback?: string; // Human teacher feedback
  gradingMethod?: 'OFFLINE_OBJECTIVE' | 'OFFLINE_PATTERN' | 'ONLINE_AI' | 'MANUAL_REQUIRED' | 'NOT_ANSWERED';
  needsHumanReview?: boolean; // Flag para correção manual posterior

  // --- FASE 8: CORREÇÃO DE REDAÇÃO DETALHADA ---
  essayCorrection?: {
    globalScore: number;
    competencies: {
      id: number;
      name: string;
      score: number;
      maxScore: number;
      feedback: string;
    }[];
    issues: {
      excerpt: string;
      suggestion: string;
      type: 'GRAMMAR' | 'ORTHOGRAPHY' | 'COHESION' | 'CLARITY';
      explanation: string;
      position?: { start: number; end: number };
    }[];
    generalFeedback: string;
    gradedAt: string;
    modelUsed: string;
  };
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

export interface CoverSection {
  id: string;
  title: string;
  type: 'text' | 'distribution';
  content?: string;
  distribution?: {
    groups: {
      name: string;
      items: {
        subject: string;
        range: string;
        points: string;
      }[];
    }[];
  };
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
    sections?: CoverSection[];
  };
  status: 'draft' | 'published' | 'archived';
  scheduledStart?: string;
  scheduledEnd?: string;
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string; // Added for easier lookup
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

export interface StudyTask {
  id: string;
  title?: string;
  description: string;
  type?: 'VIDEO' | 'EXERCISE' | 'READING';
  contentUrl?: string;
  estimatedMinutes?: number;
  completed: boolean;
  rewardSafe?: number; // OwlCoins
}

export interface StudyPlan {
  id: string;
  studentId: string;
  generatedBy: string;
  title: string;
  tasks: StudyTask[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  relatedExamId?: string;
  createdAt: string;
}

export interface AnswerCluster {
  id: string;
  label: string;
  summary: string;
  answerIds: string[];
  suggestedGrade?: number;
  confidence: number;
  gradeReasoning?: string;
  // New fields for Plagiarism Detection
  avgSimilarity?: number;
  isPlagiarismSuspect?: boolean;
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
  theme: 'light' | 'dark';
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

// --- LOGISTICS & INDUSTRIAL FLOW (NEW) ---

export type SuitcaseStatus = 'PREPARING' | 'READY' | 'IN_TRANSIT' | 'AT_SCHOOL' | 'RETURNED' | 'MAINTENANCE';

export interface TabletLogistics {
  id: string;
  serialId: string;
  model: string;
  status: 'IDLE' | 'LOADING' | 'IN_SUITCASE' | 'IN_USE' | 'RETURNED' | 'FAULTY';
  currentSuitcaseId?: string;
  lastSyncAt: string;
  batteryLevel?: number;
  assignedEventId?: string;
}

export interface LogisticsSuitcase {
  id: string;
  tag: string; // Ex: MALA-001
  schoolId: string;
  tenantId: string;
  targetEventIds: string[];
  status: SuitcaseStatus;
  tablets: string[]; // Serial IDs
  expectedTabletCount: number;
  actualTabletCount: number;
  responsibleId?: string;
  lastUpdatedAt: string;
  createdAt?: string;
}

export interface LogisticsAuditEntry {
  id: string;
  suitcaseId?: string;
  tabletSerial?: string;
  action: 'CHECK_OUT' | 'CHECK_IN' | 'LOAD' | 'REPAIR' | 'WIPE';
  actorId: string;
  timestamp: string;
  details?: string;
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

// --- VOCATIONAL COMPASS (NEW) ---
export interface CareerRecommendation {
  id: string;
  title: string;
  matchScore: number; // 0-100
  description: string;
  salaryRange: string;
  requiredSkills: string[];
  whyThisFits: string; // "Combinou sua lógica matemática com sua empatia..."
  educationalPath: string[]; // "Faculdade de X -> Pós em Y"
}

export interface IkigaiData {
  love: string[]; // O que você ama
  goodAt: string[]; // O que você é bom (Skills)
  paidFor: string[]; // Pelo que você pode ser pago
  needs: string[]; // O que o mundo precisa
}

export interface VocationalProfile {
  studentId: string;
  generatedAt: string;
  discArchetype: string; // ex: "Influenciador Criativo"
  dominantIntelligences: string[]; // Gardner (Logico-matematica, etc)
  careerMatches: CareerRecommendation[];
  ikigai: IkigaiData;
  purposeStatement: string; // "Seu propósito é usar a tecnologia para curar pessoas..."
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
  type: 'FOCUS_LOST' | 'FOCUS_GAINED' | 'ALT_TAB' | 'FULLSCREEN_EXIT' | 'KEYBOARD_VIOLATION' | 'MOUSE_VIOLATION' | 'MOUSE_LEAVE' | 'WINDOW_RESIZE' | 'SCREEN_SHARE_ENDED';
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
  currentQuestionIndex?: number;
  remainingSeconds?: number;
}

// ============================================
// Phase 12: Arcade Mode
// ============================================



// @ts-ignore
import { RealtimeChannel } from '@supabase/supabase-js';

export interface AppState {
  currentUser: User | null;
  selectedChildId: string | null;
  selectedUserIds: string[]; // Phase 6: Bulk Selection
  examEncryptionKey: CryptoKey | null;
  identityKeys: CryptoKeyPair | null; // Phase 9: PKI
  tenants: Tenant[];
  schools: School[];
  classes: SchoolClass[];
  users: User[];
  students: Student[];
  items: Item[];
  exams: Exam[];
  networkExams: Exam[]; // 🌐 Banco de Provas da Rede (Public)
  liveQuizSessions: LiveQuizSession[]; // Separate from formal exams
  liveQuizResults: any[];
  // examVariants and variantOverrides moved below to avoid duplication
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
  variantOverrides: ExamVariantOverride[]; // V2
  examAttempts: ExamAttempt[];
  examAttemptEvents: ExamAttemptEvent[];
  settings: AppSettings;
  globalPermissions: PermissionMatrix;
  hasConsented: boolean; // LGPD Consent Status
  isInitialized: boolean;
  auditLogs: AuditLog[];
  liveAlerts: any[]; // Phase 5: Live Monitoring
  realtimeChannel: RealtimeChannel | null;
  // Logistics Extensions
  logisticsAssets: LogisticsAsset[];
  logisticsCases: LogisticsCase[];
  logisticsSuitcases: LogisticsCase[]; // Alias for compatibility
  logisticsSeals: LogisticsSeal[];
  custodyTransfers: CustodyTransfer[];
  logisticsIncidents: LogisticsIncident[];
  logisticsTablets: TabletLogistics[];
  logisticsAudit: LogisticsAuditEntry[];
  neuroReportDeliveries: NeuroReportDelivery[];
  diaryEntries: DiaryEntry[];
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

export type ReportType = 'student' | 'class' | 'subject' | 'bncc' | 'risk' | 'CLASS_REPORT' | 'EXAM_ANALYSIS' | 'STUDENT_BULLETIN' | 'AUDIT_LOG';
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

export interface ArcadeGame {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  gameUrl: string;
  category: string;
  minLevel?: number;
  status: 'active' | 'inactive';
  playCount: number;
  tenantId?: string;
  createdAt: string;
}

// ============================================================================
// AI GENERATION: Multi-Level Configuration & Validation
// ============================================================================

export type QualityStandard = 'INEP' | 'BNCC' | 'OCDE';

export interface BNCCCodeSuggestion {
  code: string;
  description: string;
  relevanceScore?: number;
}

export interface DifficultyLevelConfig {
  level: 'MUITO_FACIL' | 'FACIL' | 'MEDIO' | 'DIFICIL' | 'MUITO_DIFICIL';
  quantity: number;
  enabled: boolean;
  triRange: [number, number]; // e.g., [-2.0, -1.0]
}

export interface MultilevelAIRequest {
  subject: string;
  topic: string;
  bnccCodes: string[];
  examType: 'LINEAR' | 'ADAPTIVE';
  questionCount: number;
  bankSize: number;
  levels: DifficultyLevelConfig[];
  standards: QualityStandard[];
  context?: string;
  fileContent?: string;
}

export interface ValidationIssue {
  questionId: string;
  questionNumber: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'DISTRACTOR' | 'COMMAND' | 'CONTEXT' | 'ANSWER_KEY' | 'LANGUAGE';
  description: string;
  suggestion?: string;
}

export interface QualityValidationResult {
  skillCoverage: number; // 0-100%
  difficultyDistribution: boolean;
  triParamsEstimated: boolean;
  distractorDiversity: number; // 0-100%
  noPitfalls: boolean;
}

export interface StandardsValidationResult {
  inepCompliance: number; // 0-100%
  bnccCompliance: number; // 0-100%
  ocdeCompliance?: number; // 0-100%
  issues: ValidationIssue[];
  suggestions: string[];
  detailedReport: {
    contextualization: boolean;
    clearCommand: boolean;
    plausibleDistractors: boolean;
    unambiguousAnswer: boolean;
    bnccAlignment: boolean;
    appropriateComplexity: boolean;
    appropriateLanguage: boolean;
  };
}

export interface DualValidationResult {
  phase1: QualityValidationResult;
  phase2: StandardsValidationResult;
  overallScore: number; // 0-100%
  approved: boolean;
  flaggedQuestions: string[];
}

export interface ReportFilter {
  schoolId?: string;
  classId?: string;
  examId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GeneratedQuestion {
  id?: string;
  statement: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  subject: string;
  alternatives: {
    id: string;
    text: string;
    isCorrect: boolean;
    justification?: string;
  }[];
  correctAnswerJustification?: string;
  bnccCodes?: string[];
  triParams?: {
    a: number;
    b: number;
    c: number;
  };
  bloomLevel?: string;
  governanceMetadata?: {
    generatedAt: string;
    model: string;
    promptVersion: string;
    tenantId?: string;
  };
}

export interface ExamCoverData {
  examType: 'LINEAR' | 'ADAPTIVE';
  subject: string;
  topic: string;
  bnccCodes: string[];
  questionCount: number;
  bankSize?: number;
  distribution?: {
    veryEasy: number;
    easy: number;
    medium: number;
    hard: number;
    veryHard: number;
  };
  standards: QualityStandard[];
  validationScore?: number;
}

// --- LOGISTICS & CUSTODY MODULE ---

export interface LogisticsAsset {
  id: string;
  serialNumber: string;
  qrId: string;
  model: string;
  status: 'AVAILABLE' | 'IN_TRANSIT' | 'IN_USE' | 'MAINTENANCE' | 'LOST';
  lastBatteryLevel: number;
  lastSyncAt?: string;
  schoolId?: string;
  createdAt: string;
}

export interface LogisticsCase {
  id: string;
  caseNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNING' | 'MAINTENANCE' | 'LOST';
  currentSchoolId?: string;
  assets?: string[]; // IDs dos assets dentro da mala
  createdAt: string;
  updatedAt?: string;
}

export interface LogisticsSeal {
  id: string; // Número do lacre
  status: 'AVAILABLE' | 'APPLIED' | 'BROKEN' | 'DISCARDED';
  appliedAt?: string;
  appliedBy?: string;
  brokenAt?: string;
  brokenBy?: string;
  caseId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CustodyTransferType = 'OUT_FROM_BASE' | 'DELIVERY_TO_SCHOOL' | 'COLLECTION_FROM_SCHOOL' | 'IN_TO_BASE';

export interface CustodyTransfer {
  id: string;
  fromUserId: string;
  toUserId: string;
  caseId: string;
  sealId: string;
  type: CustodyTransferType;
  expectedQuantity: number;
  confirmedQuantity: number;
  sealStatus: 'INTACT' | 'BROKEN_ACCIDENT' | 'BROKEN_SUSPICIOUS';
  notes?: string;
  evidenceUrls?: string[];
  location?: { lat: number, lng: number };
  createdAt: string;
}

export interface LogisticsIncident {
  id: string;
  transferId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

// --- NEURO-SCREENING AUDIT & REFERRAL ---

export interface NeuroReportDelivery {
  id: string;
  studentId: string;
  recipientName: string;
  deliveredById: string; // Professor ID
  deliveredAt: string;
  snapshot: {
    studentName: string;
    studentRegistration: string;
    observations: any[]; // Daily occurrences
    screeningResults: AssessmentResult[];
  };
  disclaimerAccepted: boolean;
  signatureUrl?: string; // Optativo: Placeholder para assinatura digital
}

// --- INSTITUTIONAL EVENTS (MACRO CALENDAR) ---
export enum InstitutionalEventType {
  HOLIDAY = 'FERIADO',
  OPTIONAL_HOLIDAY = 'FERIADO_PONTO_FACULTATIVO',
  RECESS = 'RECESSO',
  SIMULATION = 'SIMULADO',
  MEETING = 'REUNIAO_PEDAGOGICA',
  OTHER = 'OUTRO'
}

export interface InstitutionalEvent {
  id: string;
  tenantId: string;
  schoolId: string;
  title: string;
  type: InstitutionalEventType;
  date: string;
  endDate?: string;
  description?: string;
  appliesToClasses?: string[]; // IDs das turmas (vazio = escola toda)
  blocksScheduling: boolean; // Impede marcação de provas nesta data
  createdAt: string;
  createdBy: string;
}



