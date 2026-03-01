import { ExamStatus, RiskLevel, QuestionType, GamifiedEventStatus, UserRole, DifficultyLevel, LiteracyDomain } from '../types';

export const translateDifficultyLevel = (level: DifficultyLevel): string => {
    const map: Record<DifficultyLevel, string> = {
        [DifficultyLevel.EASY]: 'Fácil',
        [DifficultyLevel.MEDIUM]: 'Médio',
        [DifficultyLevel.HARD]: 'Difícil',
    };
    return map[level] || level;
};

export const translateLiteracyDomain = (domain: LiteracyDomain): string => {
    const map: Record<LiteracyDomain, string> = {
        [LiteracyDomain.READING]: 'Leitura',
        [LiteracyDomain.MATHEMATICS]: 'Matemática',
        [LiteracyDomain.SCIENCE]: 'Ciências',
        [LiteracyDomain.FINANCIAL]: 'Educação Financeira',
        [LiteracyDomain.CREATIVE_THINKING]: 'Pensamento Criativo',
    };
    return map[domain] || domain;
};

export const translateExamStatus = (status: ExamStatus): string => {
    const map: Record<ExamStatus, string> = {
        [ExamStatus.DRAFT]: 'Rascunho',
        [ExamStatus.ACTIVE]: 'Ativa',
        [ExamStatus.COMPLETED]: 'Concluída',
        [ExamStatus.PUBLISHED]: 'Publicada',
        [ExamStatus.PENDING_RESCHEDULE]: 'Pendente Reagendamento',
    };
    return map[status] || status;
};

export const translateRiskLevel = (level: RiskLevel): string => {
    const map: Record<RiskLevel, string> = {
        [RiskLevel.LOW]: 'Baixo',
        [RiskLevel.MEDIUM]: 'Médio',
        [RiskLevel.HIGH]: 'Alto',
    };
    return map[level] || level;
};

export const translateQuestionType = (type: QuestionType): string => {
    const map: Record<QuestionType, string> = {
        [QuestionType.MULTIPLE_CHOICE]: 'Múltipla Escolha',
        [QuestionType.TRUE_FALSE]: 'Verdadeiro ou Falso',
        [QuestionType.ESSAY]: 'Discursiva',
        [QuestionType.REDACTION]: 'Redação',
        [QuestionType.SIMULATION]: 'Simulação Interativa',
    };
    return map[type] || type;
};

export const translateBehaviorCluster = (cluster: string): string => {
    const map: Record<string, string> = {
        'RAPID_PREC': 'Domínio (Rápido/Preciso)',
        'SLOW_PREC': 'Esforçado (Lento/Preciso)',
        'SLOW_ERR': 'Dificuldade (Lento/Errado)',
        'RAPID_ERR': 'Chute/Desengajado',
        'NORMAL': 'Normal',
    };
    return map[cluster] || cluster;
};

export const translateSecurityFlag = (flag: string): string => {
    const map: Record<string, string> = {
        'FOCUS_LOST': 'Fuga de Tela',
        'ALT_TAB': 'Troca de Janela (Alt+Tab)',
        'FULLSCREEN_EXIT': 'Saída de Tela Cheia',
        'KEYBOARD_VIOLATION': 'Uso de Teclado Bloqueado',
        'MOUSE_VIOLATION': 'Clique Fora da Área',
    };
    return map[flag] || flag;
};

export const translateUserRole = (role: UserRole): string => {
    const map: Record<UserRole, string> = {
        [UserRole.MASTER_SAAS]: 'Gestão ExamePad (Master)',
        [UserRole.SYSTEM_ADMIN]: 'Gestão SaaS (Global)',
        [UserRole.SUPER_ADMIN]: 'Gestão MEC (Educacional)',
        [UserRole.STATE_ADMIN]: 'Secretaria Estadual',
        [UserRole.TENANT_ADMIN]: 'Secretaria Municipal',
        [UserRole.DIRETOR]: 'Diretor',
        [UserRole.SUPERVISOR]: 'Supervisor',
        [UserRole.PROFESSOR]: 'Professor',
        [UserRole.ALUNO]: 'Aluno',
        [UserRole.PAIS]: 'Pais/Responsáveis',
    };
    return map[role] || role;
};

export const translateGamifiedEventStatus = (status: GamifiedEventStatus): string => {
    const map: Record<GamifiedEventStatus, string> = {
        [GamifiedEventStatus.OPEN]: 'Inscrições Abertas',
        [GamifiedEventStatus.CLOSED]: 'Inscrições Encerradas',
        [GamifiedEventStatus.LIVE]: 'Ocorrendo Agora',
        [GamifiedEventStatus.FINISHED]: 'Finalizado',
    };
    return map[status] || status;
};

export const translateResource = (resource: string): string => {
    const map: Record<string, string> = {
        'SCHOOL_DATA': 'Dados Escolares',
        'USER_DATA': 'Dados de Usuários',
        'ITEM_BANK': 'Banco de Itens',
        'EXAM_MGMT': 'Gestão de Provas',
        'OFFLINE_OPS': 'Operações Offline',
        'ANALYTICS': 'Análises',
        'COMMUNICATION': 'Comunicação',
        'AI_FEATURES': 'Recursos de IA',
        'FINANCIAL': 'Faturamento & Contratos',
        'NEURO_SCREENING': 'Triagem Neuro',
        'GAMIFIED_EVENTS': 'Eventos Gamificados',
        'EXAM': 'Prova',
        'STUDENT': 'Aluno',
        'CLASS': 'Turma',
        'SCHOOL': 'Escola',
        'REPORTS': 'Relatórios e BI',
        'SYSTEM_MGMT': 'Configurações de Sistema',
        'TENANT_MGMT': 'Gestão de Clientes',
        'SaaS_BILLING': 'Faturamento SaaS',
        'PLATFORM_HEALTH': 'Saúde da Plataforma',
        'TENANT': 'Rede/Secretaria',
    };
    return map[resource] || resource;
};

export const translateActionType = (type: string): string => {
    const map: Record<string, string> = {
        'LOGIN': 'Login',
        'LOGOUT': 'Logout',
        'CREATE': 'Criação',
        'UPDATE': 'Atualização',
        'DELETE': 'Exclusão',
        'PUBLISH': 'Publicação',
        'ARCHIVE': 'Arquivamento',
        'SYNC': 'Sincronização',
    };
    // Split types like "CREATE_EXAM"
    const parts = type.split('_');
    const action = map[parts[0]] || parts[0];
    const resource = parts[1] ? ` de ${translateResource(parts[1])}` : '';
    return `${action}${resource}`;
};
