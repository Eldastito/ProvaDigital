
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
