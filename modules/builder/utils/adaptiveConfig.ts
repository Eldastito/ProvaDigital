import { DifficultyLevelConfig } from '../../../types';

/**
 * Calcula a distribuição automática de questões por nível de dificuldade
 * baseado no total de questões desejado.
 * 
 * Distribuição padrão:
 * - Muito Fácil: 16.7%
 * - Fácil: 20%
 * - Médio: 26.6%
 * - Difícil: 20%
 * - Muito Difícil: 16.7%
 */
export function calculateDistribution(totalQuestions: number): DifficultyLevelConfig[] {
    const distribution = [
        { level: 'MUITO_FACIL' as const, percentage: 0.167, triRange: [-2.0, -1.0] as [number, number] },
        { level: 'FACIL' as const, percentage: 0.20, triRange: [-1.0, -0.5] as [number, number] },
        { level: 'MEDIO' as const, percentage: 0.266, triRange: [-0.5, 0.5] as [number, number] },
        { level: 'DIFICIL' as const, percentage: 0.20, triRange: [0.5, 1.0] as [number, number] },
        { level: 'MUITO_DIFICIL' as const, percentage: 0.167, triRange: [1.0, 2.0] as [number, number] }
    ];

    // Calcular quantidades
    const configs = distribution.map(d => ({
        level: d.level,
        quantity: Math.round(totalQuestions * d.percentage),
        enabled: true,
        triRange: d.triRange
    }));

    // Ajustar para garantir que a soma seja exatamente totalQuestions
    const sum = configs.reduce((acc, c) => acc + c.quantity, 0);
    const diff = totalQuestions - sum;

    if (diff !== 0) {
        // Adicionar/remover a diferença do nível médio
        const medioIndex = configs.findIndex(c => c.level === 'MEDIO');
        configs[medioIndex].quantity += diff;
    }

    return configs;
}

/**
 * Presets de configuração adaptativa
 */
export const ADAPTIVE_PRESETS = {
    quick: {
        name: 'Diagnóstica Rápida',
        bankSize: 20,
        questionsPerStudent: 10,
        description: 'Avaliação inicial rápida'
    },
    standard: {
        name: 'Padrão',
        bankSize: 30,
        questionsPerStudent: 15,
        description: 'Provas bimestrais regulares'
    },
    gold: {
        name: 'Padrão Ouro',
        bankSize: 60,
        questionsPerStudent: 25,
        description: 'Simulados SAEB/ENEM'
    },
    complete: {
        name: 'Banco Completo',
        bankSize: 100,
        questionsPerStudent: 35,
        description: 'Avaliação anual robusta'
    }
} as const;

/**
 * Valida se a configuração é válida
 */
export function validateAdaptiveConfig(bankSize: number, questionsPerStudent: number): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (bankSize < 10) {
        errors.push('O banco deve ter no mínimo 10 questões');
    }
    if (bankSize > 200) {
        errors.push('O banco não pode ter mais de 200 questões');
    }
    if (questionsPerStudent < 5) {
        errors.push('Cada aluno deve responder no mínimo 5 questões');
    }
    if (questionsPerStudent > 50) {
        errors.push('Cada aluno não pode responder mais de 50 questões');
    }
    if (questionsPerStudent > bankSize) {
        errors.push('Questões por aluno não pode ser maior que o tamanho do banco');
    }
    if (questionsPerStudent > bankSize * 0.7) {
        errors.push('Recomendamos que cada aluno responda no máximo 70% do banco');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
