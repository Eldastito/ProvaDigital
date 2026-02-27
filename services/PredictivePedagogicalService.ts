import { Item, DifficultyLevel } from '../types';
import { calculateAverage, calculateStandardDeviation } from './analyticsEngine';
import { searchKnowledgeBase } from './geminiService';

export interface SkillInsight {
    type: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO';
    title: string;
    message: string;
    actionLabel?: string;
    actionType?: 'BNCC' | 'DIFFICULTY' | 'VARIETY';
}

export interface PedagogicalAuditReport {
    score: number;
    insights: SkillInsight[];
    metrics: {
        difficultyDistribution: Record<DifficultyLevel, number>;
        bnccCoverage: number; // Percentage of items with BNCC
        estimatedTimeMinutes: number;
        cognitiveEntropy: number; // Measure of variety
    };
}

/**
 * Predictive Pedagogical Skill
 * Acts as a mini-specialist to audit exams before publication.
 */
export const auditExamPedagogically = async (items: Item[], tenantId?: string): Promise<PedagogicalAuditReport> => {
    // RAG Phase: Check if exam items align with school's official didactic material
    if (tenantId && items.length > 0) {
        const subjects = Array.from(new Set(items.map(i => i.subject))).join(", ");
        const ragContext = await searchKnowledgeBase(`material didático oficial conteúdo para ${subjects}`, tenantId, 2);

        if (ragContext) {
            // We'll add an INFO insight about RAG alignment
            // In a real implementation, we could call another AI function to verify alignment
        }
    }

    const insights: SkillInsight[] = [];
    const totalItems = items.length;

    if (totalItems === 0) {
        return {
            score: 0,
            insights: [{ type: 'INFO', title: 'Prova Vazia', message: 'Adicione itens para iniciar a auditoria pedagógica.' }],
            metrics: {
                difficultyDistribution: { [DifficultyLevel.EASY]: 0, [DifficultyLevel.MEDIUM]: 0, [DifficultyLevel.HARD]: 0 },
                bnccCoverage: 0,
                estimatedTimeMinutes: 0,
                cognitiveEntropy: 0
            }
        };
    }

    // 1. Difficulty Analysis
    const difficultyCounts = {
        [DifficultyLevel.EASY]: items.filter(i => i.difficulty === DifficultyLevel.EASY).length,
        [DifficultyLevel.MEDIUM]: items.filter(i => i.difficulty === DifficultyLevel.MEDIUM).length,
        [DifficultyLevel.HARD]: items.filter(i => i.difficulty === DifficultyLevel.HARD).length
    };

    const easyPct = (difficultyCounts[DifficultyLevel.EASY] / totalItems) * 100;
    const hardPct = (difficultyCounts[DifficultyLevel.HARD] / totalItems) * 100;

    if (hardPct > 40) {
        insights.push({
            type: 'WARNING',
            title: 'Alta Complexidade',
            message: 'Mais de 40% da prova é composta por itens difíceis. Isso pode desmotivar alunos de desempenho médio.',
            actionType: 'DIFFICULTY'
        });
    } else if (easyPct > 70) {
        insights.push({
            type: 'INFO',
            title: 'Prova de Nivelamento',
            message: 'Esta prova parece ser de nivelamento básico, com grande maioria de itens fáceis.'
        });
    } else {
        insights.push({
            type: 'SUCCESS',
            title: 'Equilíbrio de Dificuldade',
            message: 'A distribuição entre itens fáceis, médios e difíceis está equilibrada.'
        });
    }

    // 2. BNCC Coverage
    const itemsWithBNCC = items.filter(i => i.bnccCode).length;
    const bnccCoverage = (itemsWithBNCC / totalItems) * 100;

    if (bnccCoverage < 80) {
        insights.push({
            type: 'DANGER',
            title: 'Baixa Cobertura BNCC',
            message: `${(100 - bnccCoverage).toFixed(0)}% dos itens não possuem código BNCC associado. Isso prejudica a auditabilidade pedagógica.`,
            actionLabel: 'Sugerir Códigos',
            actionType: 'BNCC'
        });
    }

    // 3. Estimated Time
    // Based on usual metrics: 2min for easy, 4min for medium, 7min for hard
    const estimatedTime = items.reduce((acc, item) => {
        if (item.difficulty === DifficultyLevel.EASY) return acc + 2;
        if (item.difficulty === DifficultyLevel.HARD) return acc + 7;
        return acc + 4;
    }, 0);

    // 4. Score Calculation (0-100)
    let score = 100;
    if (bnccCoverage < 80) score -= 30;
    if (hardPct > 50) score -= 20;
    if (totalItems < 5) score -= 10;

    return {
        score: Math.max(0, score),
        insights,
        metrics: {
            difficultyDistribution: difficultyCounts,
            bnccCoverage,
            estimatedTimeMinutes: estimatedTime,
            cognitiveEntropy: 0 // To be implemented with Bloom Taxonomy analysis
        }
    };
};
