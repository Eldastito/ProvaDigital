
import { Tenant, School, SchoolClass, User, UserRole, Item, QuestionType, DifficultyLevel, ItemOrigin, Student, Exam, ExamModel, ExamStatus, ExamRegistration, RegistrationStatus, ExamResult, Announcement, ChatMessage, LessonPlan, StudyPlan, StudentProfile, AppSettings, RiskLevel, UserProfileExtended, AssessmentType, TenantType, GamifiedEvent, GamifiedEventStatus } from '../types';

// --- 1. TENANTS (REDES) ---
export const INITIAL_TENANTS: Tenant[] = [
  { id: 't1', name: 'Secretaria Mun. de Educação', type: TenantType.PUBLIC_MUNICIPAL, cnpj: '00.000.000/0001-00' },
  { id: 't2', name: 'Secretaria Estadual de Educação', type: TenantType.PUBLIC_STATE, cnpj: '11.111.111/0001-11' },
  { id: 't3', name: 'Ministério da Educação (MEC)', type: TenantType.PUBLIC_FEDERAL, cnpj: '22.222.222/0001-22' },
  { id: 't4', name: 'Rede Privada Elite', type: TenantType.PRIVATE, cnpj: '33.333.333/0001-33' }
];

// --- 2. SCHOOLS (UMA POR REDE) ---
export const INITIAL_SCHOOLS: School[] = [
  { 
      id: 's1', tenantId: 't1', name: 'Escola Municipal Cora Coralina', inep: '12345678',
      resources: { funding: true, uniforms: true, textbooks: true, adminMaterials: true, extracurricular: false, internet: true, lab: false, accessibility: true, food: true, transportation: true, security: false, ac_cooling: false }
  },
  { 
      id: 's2', tenantId: 't2', name: 'Colégio Estadual Darcy Ribeiro', inep: '87654321',
      resources: { funding: true, uniforms: false, textbooks: true, adminMaterials: false, extracurricular: true, internet: true, lab: true, accessibility: true, food: true, transportation: false, security: true, ac_cooling: true }
  },
  { 
      id: 's3', tenantId: 't3', name: 'Campus Federal Tecnológico', inep: '99887766',
      resources: { funding: true, uniforms: false, textbooks: false, adminMaterials: true, extracurricular: true, internet: true, lab: true, accessibility: true, food: true, transportation: true, security: true, ac_cooling: true }
  },
  { 
      id: 's4', tenantId: 't4', name: 'Colégio Internacional Elite', inep: '55443322',
      resources: { funding: true, uniforms: true, textbooks: true, adminMaterials: true, extracurricular: true, internet: true, lab: true, accessibility: true, food: true, transportation: true, security: true, ac_cooling: true }
  }
];

// --- 3. CLASSES ---
export const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'c1', schoolId: 's1', name: 'Turma 9A', series: '9º Ano', shift: 'MANHA' },
  { id: 'c2', schoolId: 's2', name: 'Turma 3B', series: '3º Ano Médio', shift: 'TARDE' },
  { id: 'c3', schoolId: 's3', name: 'Téc. Informática 1', series: '1º Módulo', shift: 'MANHA' },
  { id: 'c4', schoolId: 's4', name: 'High School Year 2', series: '2º Ano', shift: 'MANHA' }
];

// --- 4. STUDENTS (FILHOS) ---
export const INITIAL_STUDENTS: Student[] = [
  { id: 'st_muni', name: 'João Pedro (Muni)', registrationNumber: 'MUN-001', classId: 'c1', schoolId: 's1', tenantId: 't1' },
  { id: 'st_state', name: 'Maria Eduarda (Est)', registrationNumber: 'EST-002', classId: 'c2', schoolId: 's2', tenantId: 't2' },
  { id: 'st_fed', name: 'Pedro Henrique (Fed)', registrationNumber: 'FED-003', classId: 'c3', schoolId: 's3', tenantId: 't3' },
  { id: 'st_priv', name: 'Ana Clara (Part)', registrationNumber: 'PRI-004', classId: 'c4', schoolId: 's4', tenantId: 't4' },
  // Extras para volume
  { id: 'st_5', name: 'Lucas Ferreira', registrationNumber: '2024005', classId: 'c1', schoolId: 's1', tenantId: 't1' },
];

// --- 5. USERS (PERFIS) ---
export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Ana Silva', email: 'ana.prof@escola.com', role: UserRole.PROFESSOR, tenantId: 't1', schoolId: 's1', classIds: ['c1'] },
  { id: 'u2', name: 'Carlos Souza', email: 'carlos.coord@escola.com', role: UserRole.SUPERVISOR, tenantId: 't1', schoolId: 's1' },
  { id: 'u3', name: 'Diretora Marta', email: 'marta.dir@escola.com', role: UserRole.DIRETOR, tenantId: 't1', schoolId: 's1' },
  
  // GESTORES DE REDE (MACRO)
  { id: 'u_mec', name: 'Ministro da Educação', email: 'ministro@mec.gov.br', role: UserRole.SUPER_ADMIN, tenantId: 't3' }, // PERFIL NACIONAL
  { id: 'u_sec_mun', name: 'Sec. Municipal', email: 'admin@sme.gov.br', role: UserRole.TENANT_ADMIN, tenantId: 't1' },
  { id: 'u_sec_est', name: 'Sec. Estadual', email: 'gov@estado.gov.br', role: UserRole.STATE_ADMIN, tenantId: 't2' },
  { id: 'u_super', name: 'Super Admin', email: 'root@examepad.com', role: UserRole.SUPER_ADMIN, tenantId: 't1' },

  // ALUNOS (LOGIN DIRETO)
  { id: 'aluno1', name: 'João Pedro', nickname: 'JotaPê', email: 'joao.p@aluno.com', role: UserRole.ALUNO, tenantId: 't1', schoolId: 's1' },

  // MÃE MULTI-REDE
  { 
      id: 'u_pais', 
      name: 'Maria Silva (Mãe)', 
      email: 'maria@pais.com', 
      role: UserRole.PAIS, 
      tenantId: 't1', // Tenant "Principal" de cadastro, mas acessa todos
      schoolId: 's1', 
      childrenIds: ['st_muni', 'st_state', 'st_fed', 'st_priv'] 
  }
];

// --- 6. ITEMS & EXAMS ---
export const INITIAL_ITEMS: Item[] = [
  {
    id: 'i1', tenantId: 't1', schoolId: 's1', ownerId: 'u1',
    knowledgeArea: 'Humanas', subject: 'História', type: QuestionType.MULTIPLE_CHOICE,
    statement: 'Qual foi o principal motivo da vinda da Família Real?',
    alternatives: [ { id: 'a1', text: 'Napoleão', isCorrect: true }, { id: 'a2', text: 'Férias', isCorrect: false } ],
    correctAnswerJustification: 'Invasões Napoleônicas.',
    difficulty: DifficultyLevel.MEDIUM, score: 1.0, origin: ItemOrigin.MANUAL, tags: ['Brasil'], usageCount: 5, createdAt: new Date().toISOString()
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'e1', tenantId: 't1', schoolId: 's1', creatorId: 'u1',
    title: 'História - 9º Ano', subject: 'História', model: ExamModel.SOMATIVO, durationMinutes: 50, targetQuestionCount: 10,
    status: ExamStatus.PUBLISHED, items: [ { itemId: 'i1', order: 1 } ], classIds: ['c1'], createdAt: new Date().toISOString(), scheduledDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'e2', tenantId: 't2', schoolId: 's2', creatorId: 'u_sec_est',
    title: 'Simulado Estadual (SAEB)', subject: 'Português', model: ExamModel.SOMATIVO, durationMinutes: 90, targetQuestionCount: 40,
    status: ExamStatus.PUBLISHED, items: [], classIds: ['c2'], createdAt: new Date().toISOString(), scheduledDate: new Date().toISOString().split('T')[0]
  },
  // Adding a "Trabalho" to test weighted ranking
  {
    id: 'e3', tenantId: 't1', schoolId: 's1', creatorId: 'u1',
    title: 'Trabalho de Pesquisa: Guerra Fria', subject: 'História', model: ExamModel.SOMATIVO, durationMinutes: 0, targetQuestionCount: 1,
    status: ExamStatus.PUBLISHED, items: [], classIds: ['c1'], createdAt: new Date().toISOString(), scheduledDate: new Date().toISOString().split('T')[0]
  }
];

// --- 7. GAMIFIED EVENTS (NOVO) ---
export const INITIAL_GAMIFIED_EVENTS: GamifiedEvent[] = [
    {
        id: 'evt_soletrando_24',
        schoolId: 's1',
        creatorId: 'u1',
        title: 'I Soletrando Escolar - Cora Coralina',
        type: 'SOLETRANDO',
        subject: 'Português',
        description: 'Competição de soletração para alunos do 9º Ano. Preparem seus vocabulários!',
        rules: '1. O aluno deve soletrar a palavra corretamente. 2. Tem 30 segundos para responder. 3. Errou, está eliminado da rodada.',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 dias
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: GamifiedEventStatus.OPEN,
        rewardCoins: 500,
        participants: [
            { studentId: 'st_muni', status: 'INSCRITO', score: 0 }
        ]
    },
    {
        id: 'evt_olimpiada_mat_24',
        schoolId: 's1',
        creatorId: 'u1',
        title: 'Olimpíada Interna de Matemática',
        type: 'OLIMPIADA',
        subject: 'Matemática',
        description: 'Resolva problemas lógicos complexos e concorra a medalhas!',
        rules: 'Prova individual sem consulta. 2 horas de duração.',
        eventDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Passado
        registrationDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: GamifiedEventStatus.FINISHED,
        rewardCoins: 1000,
        participants: [
            { studentId: 'st_muni', status: 'CONCLUIDO', score: 9.5, rank: 1, feedback: 'Excelente raciocínio lógico.' },
            { studentId: 'st_5', status: 'CONCLUIDO', score: 7.0, rank: 2, feedback: 'Bom desempenho.' }
        ]
    }
];

export const INITIAL_REGISTRATIONS: ExamRegistration[] = [
  { id: 'r1', examId: 'e1', studentId: 'st_muni', classId: 'c1', status: RegistrationStatus.INSCRITO },
  { id: 'r2', examId: 'e2', studentId: 'st_state', classId: 'c2', status: RegistrationStatus.INSCRITO },
  { id: 'r3', examId: 'e3', studentId: 'st_muni', classId: 'c1', status: RegistrationStatus.INSCRITO },
];

export const INITIAL_RESULTS: ExamResult[] = [
    { id: 'res_1', examId: 'e1', studentId: 'st_muni', gradedAt: new Date().toISOString(), totalScore: 8.5, answers: [], violationCount: 0 },
    { id: 'res_2', examId: 'e2', studentId: 'st_state', gradedAt: new Date().toISOString(), totalScore: 7.0, answers: [], violationCount: 0 },
    { id: 'res_3', examId: 'e3', studentId: 'st_muni', gradedAt: new Date().toISOString(), totalScore: 9.5, answers: [], violationCount: 0 } // Nota alta no trabalho
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
    { id: 'anc_1', tenantId: 't1', schoolId: 's1', authorId: 'u3', title: 'Reunião Pais', content: 'Dia 20/10', type: 'EVENTO', createdAt: new Date().toISOString() },
    { id: 'anc_2', tenantId: 't2', schoolId: 's2', authorId: 'u_sec_est', title: 'Matrículas Estaduais', content: 'Abertas', type: 'AVISO', createdAt: new Date().toISOString() }
];

export const INITIAL_MESSAGES: ChatMessage[] = [];
export const INITIAL_LESSON_PLANS: LessonPlan[] = [];
export const INITIAL_STUDY_PLANS: StudyPlan[] = [];
export const INITIAL_STUDENT_PROFILES: StudentProfile[] = [
    { studentId: 'st_muni', learningChannel: 'VISUAL', discProfile: 'I', topStrengths: ['Criatividade'], lastUpdated: new Date().toISOString() },
    { studentId: 'st_state', learningChannel: 'AUDITIVO', discProfile: 'S', topStrengths: ['Empatia'], lastUpdated: new Date().toISOString() }
];
export const INITIAL_SETTINGS: AppSettings = { rankingEnabled: true, rankingAnonymity: 'NOMINAL' };

// Extended Profile with Achievements
export const INITIAL_USER_PROFILES: UserProfileExtended[] = [
    {
        userId: 'st_muni',
        owlCoins: 120,
        badges: ['Iniciante', 'Focado'],
        assessments: [],
        academicAchievements: [
            {
                id: 'ach_1',
                title: 'Ouro - Olimpíada de Matemática (OBMEP)',
                type: 'OLIMPIADA',
                date: new Date().toISOString(),
                bonusPoints: 0.5
            },
            {
                id: 'ach_2',
                title: 'Participação - Soletrando Escolar',
                type: 'EVENTO',
                date: new Date().toISOString(),
                bonusPoints: 0.2
            }
        ]
    }
];
