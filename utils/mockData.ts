
import { Tenant, School, SchoolClass, User, UserRole, Item, QuestionType, DifficultyLevel, ItemOrigin, Student, Exam, ExamModel, ExamStatus, ExamRegistration, RegistrationStatus, ExamResult, Announcement, ChatMessage, LessonPlan, StudyPlan, StudentProfile, AppSettings, RiskLevel, UserProfileExtended, AssessmentType, TenantType, GamifiedEvent, GamifiedEventStatus } from '../types';

// UUIDs válidos para evitar erros de sintaxe no Banco de Dados (RPCs/Foreign Keys)
export const MOCK_TENANT_ID = 'd5f2c7a0-9b3e-4b8a-8c9d-6e1f0a2b3c4d';
export const MOCK_TENANT_ID_2 = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
export const MOCK_SCHOOL_ID = 'b7d1e8a9-c2b3-4f5g-6h7i-8j9k0l1m2n3o';
export const MOCK_CLASS_ID = 'c1d2e3f4-g5h6-7i8j-9k0l-1m2n3o4p5q6r';
export const MOCK_USER_ID = 'u1v2w3x4-y5z6-7a8b-9c0d-1e2f3g4h5i6j';
export const MOCK_ITEM_ID = 'i1j2k3l4-m5n6-7o8p-9q0r-1s2t3u4v5w6x';
export const MOCK_EXAM_ID = 'e1f2g3h4-i5j6-7k8l-9m0n-1o2p3q4r5s6t';
export const MOCK_STUDENT_ID = 's1t2u3v4-w5x6-7y8z-9a0b-1c2d3e4f5g6h';

// --- 1. TENANTS (REDES) ---
export const INITIAL_TENANTS: Tenant[] = [
  { id: MOCK_TENANT_ID, name: 'Secretaria Mun. de Educação', type: TenantType.PUBLIC_MUNICIPAL, cnpj: '00.000.000/0001-00', status: 'active' },
  { id: MOCK_TENANT_ID_2, name: 'Secretaria Estadual de Educação', type: TenantType.PUBLIC_STATE, cnpj: '11.111.111/0001-11', status: 'active' }
];

// --- 2. SCHOOLS ---
export const INITIAL_SCHOOLS: School[] = [
  {
    id: MOCK_SCHOOL_ID, tenantId: MOCK_TENANT_ID, name: 'Escola Municipal Cora Coralina', inep: '12345678',
    resources: { funding: true, uniforms: true, textbooks: true, adminMaterials: true, extracurricular: false, internet: true, lab: false, accessibility: true, food: true, transportation: true, security: false, ac_cooling: false }
  }
];

// --- 3. CLASSES ---
export const INITIAL_CLASSES: SchoolClass[] = [
  { id: MOCK_CLASS_ID, schoolId: MOCK_SCHOOL_ID, name: 'Turma 9A', series: '9º Ano', shift: 'MANHA' }
];

// --- 4. STUDENTS ---
export const INITIAL_STUDENTS: Student[] = [
  { id: MOCK_STUDENT_ID, name: 'João Pedro', registrationNumber: 'MUN-001', classId: MOCK_CLASS_ID, schoolId: MOCK_SCHOOL_ID, tenantId: MOCK_TENANT_ID }
];

// --- 5. USERS ---
export const INITIAL_USERS: User[] = [
  { id: MOCK_USER_ID, name: 'Ana Silva', email: 'ana.prof@escola.com', role: UserRole.PROFESSOR, tenantId: MOCK_TENANT_ID, schoolId: MOCK_SCHOOL_ID, classIds: [MOCK_CLASS_ID] },
  { id: 'b7d1e8a9-c2b3-4f5g-6h7i-8j9k0l1m2n3p', name: 'Super Admin', email: 'root@examepad.com', role: UserRole.SUPER_ADMIN, tenantId: MOCK_TENANT_ID }
];

// --- 6. ITEMS & EXAMS ---
export const INITIAL_ITEMS: Item[] = [
  {
    id: MOCK_ITEM_ID, tenantId: MOCK_TENANT_ID, schoolId: MOCK_SCHOOL_ID, ownerId: MOCK_USER_ID,
    knowledgeArea: 'Humanas', subject: 'História', type: QuestionType.MULTIPLE_CHOICE,
    statement: 'Qual foi o principal motivo da vinda da Família Real?',
    alternatives: [{ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5e', text: 'Napoleão', isCorrect: true }, { id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5f', text: 'Férias', isCorrect: false }],
    correctAnswerJustification: 'Invasões Napoleônicas.',
    difficulty: DifficultyLevel.MEDIUM, score: 1.0, origin: ItemOrigin.MANUAL, tags: ['Brasil'], usageCount: 5, createdAt: new Date().toISOString()
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: MOCK_EXAM_ID, tenantId: MOCK_TENANT_ID, schoolId: MOCK_SCHOOL_ID, creatorId: MOCK_USER_ID,
    title: 'História - 9º Ano', subject: 'História', model: ExamModel.SOMATIVO, durationMinutes: 50, targetQuestionCount: 10,
    status: ExamStatus.PUBLISHED, items: [{ itemId: MOCK_ITEM_ID, order: 1 }], classIds: [MOCK_CLASS_ID], createdAt: new Date().toISOString(), scheduledDate: new Date().toISOString().split('T')[0], maxScore: 10.0
  }
];

export const INITIAL_REGISTRATIONS: ExamRegistration[] = [];
export const INITIAL_GAMIFIED_EVENTS: GamifiedEvent[] = [];

export const INITIAL_RESULTS: ExamResult[] = [
  { id: 'r1e2g3h4-i5j6-7k8l-9m0n-1o2p3q4r5s6u', examId: MOCK_EXAM_ID, studentId: MOCK_STUDENT_ID, gradedAt: new Date().toISOString(), totalScore: 8.5, answers: [], violationCount: 0 }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ac1d2e3f-g5h6-7i8j-9k0l-1m2n3o4p5q6s', tenantId: MOCK_TENANT_ID, schoolId: MOCK_SCHOOL_ID, authorId: MOCK_USER_ID, title: 'Reunião Pais', content: 'Dia 20/10', type: 'EVENTO', createdAt: new Date().toISOString() }
];

export const INITIAL_MESSAGES: ChatMessage[] = [];
export const INITIAL_LESSON_PLANS: LessonPlan[] = [];
export const INITIAL_STUDY_PLANS: StudyPlan[] = [];
export const INITIAL_STUDENT_PROFILES: StudentProfile[] = [
  { studentId: MOCK_STUDENT_ID, learningChannel: 'VISUAL', discProfile: 'I', topStrengths: ['Criatividade'], lastUpdated: new Date().toISOString() }
];
export const INITIAL_SETTINGS: AppSettings = { rankingEnabled: true, rankingAnonymity: 'NOMINAL', theme: 'light' };

// Extended Profile
export const INITIAL_USER_PROFILES: UserProfileExtended[] = [
  {
    userId: MOCK_STUDENT_ID,
    owlCoins: 120,
    badges: ['Iniciante', 'Focado'],
    assessments: [],
    academicAchievements: [
      {
        id: 'ach_1a2b3c4d-e5f6-4a5b-8c9d-0e1f2a3b4c5g',
        title: 'Ouro - Olimpíada de Matemática (OBMEP)',
        type: 'OLIMPIADA',
        date: new Date().toISOString(),
        bonusPoints: 0.5
      }
    ]
  }
];
