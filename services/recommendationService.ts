import { QuestionType, DifficultyLevel, AppState, Item, ItemOrigin } from '../types';
import { generateQuestionsFromText } from './geminiService';

export interface RecommendationRequest {
    subject: string;
    gradeLevel: number; // 6 to 9
    topic?: string;
    excludeItemIds?: string[];
}

export interface RecommendedItem extends Item {
    reason: string; // Why this item was recommended (e.g. "Low performance in Algebra")
    matchScore: number; // 0-100
}

/**
 * Service to generate or fetch recommended items based on class history
 */
export const getRecommendedItems = async (
    request: RecommendationRequest,
    state: AppState
): Promise<RecommendedItem[]> => {

    // 1. Identify "Weak Spots" - Real Analysis of results
    const subjectResults = state.results.filter(r => {
        const exam = state.exams.find(e => e.id === r.examId);
        return exam?.subject === request.subject;
    });

    // Mapear média por BNCC
    const bnccPerformances = new Map<string, { total: number, count: number }>();
    subjectResults.forEach(res => {
        res.answers.forEach((ans: any) => {
            const item = state.items.find(i => i.id === ans.itemId);
            if (item?.bnccCode) {
                const current = bnccPerformances.get(item.bnccCode) || { total: 0, count: 0 };
                bnccPerformances.set(item.bnccCode, {
                    total: current.total + (ans.isCorrect ? 1 : 0),
                    count: current.count + 1
                });
            }
        });
    });

    const weakSpots = Array.from(bnccPerformances.entries())
        .map(([bncc, stats]) => ({
            bncc,
            avg: stats.total / stats.count,
            count: stats.count
        }))
        .filter(s => s.avg < 0.6 && s.count >= 2) // Pelo menos 2 tentativas e média < 60%
        .sort((a, b) => a.avg - b.avg);

    const targetSpot = weakSpots.length > 0
        ? { bncc: weakSpots[0].bncc, topic: `Reforço Habilidade ${weakSpots[0].bncc}`, reason: `Turma com ${(weakSpots[0].avg * 100).toFixed(0)}% de acerto nesta habilidade.` }
        : { bncc: 'BNCC_GERAL', topic: request.subject, reason: 'Manutenção de performance.' };

    // 2. Generate content using Gemini
    // We construct a prompt context based on the weak spot
    const promptContext = `
        Gere uma questão sobre: ${targetSpot.topic}.
        Habilidade BNCC: ${targetSpot.bncc}.
        Contexto: Os alunos estão errando muito conceitos básicos de isolar a variável.
        Crie uma questão que ajude a diagnosticar esse erro específico.
    `;

    try {
        const generated = await generateQuestionsFromText(
            promptContext,
            1,
            QuestionType.MULTIPLE_CHOICE,
            DifficultyLevel.MEDIUM,
            request.subject
        );

        if (generated && generated.length > 0) {
            const item = generated[0];
            return [{
                id: `rec_${Date.now()}`,
                type: QuestionType.MULTIPLE_CHOICE,
                statement: item.statement,
                alternatives: item.alternatives.map((a, i) => ({
                    id: `alt_${Date.now()}_${i}`,
                    text: a.text,
                    isCorrect: a.isCorrect
                })),
                correctAnswerJustification: item.justification,
                difficulty: DifficultyLevel.MEDIUM,
                bnccCode: item.bnccCode || targetSpot.bncc, // Fallback to requested BNCC
                tags: ['Recomendado por IA', targetSpot.topic],
                score: 1.0,
                ownerId: 'AI_MENTOR',
                tenantId: 'system',
                knowledgeArea: 'Matemática', // Helper/Mock
                subject: request.subject,
                origin: ItemOrigin.IA,
                usageCount: 0,
                createdAt: new Date().toISOString(),
                reason: targetSpot.reason,
                matchScore: 95
            }];
        }
    } catch (error) {
        console.error("Error generating recommendation:", error);
    }

    // Fallback Mock if AI fails
    return [{
        id: `mock_rec_${Date.now()}`,
        type: QuestionType.MULTIPLE_CHOICE,
        statement: `(Mock) Qual o valor de x na equação 2x + 10 = 20? (Recomendado para Reforço)`,
        alternatives: [
            { id: '1', text: '5', isCorrect: true },
            { id: '2', text: '10', isCorrect: false },
            { id: '3', text: '15', isCorrect: false },
            { id: '4', text: '2', isCorrect: false }
        ],
        correctAnswerJustification: "Subtrai 10 de ambos os lados e divide por 2.",
        difficulty: DifficultyLevel.EASY,
        bnccCode: 'EF07MA18',
        tags: ['Recomendado (Offline)', 'Álgebra'],
        score: 1.0,
        ownerId: 'SYSTEM',
        tenantId: 'system',
        knowledgeArea: 'Matemática',
        subject: 'Matemática',
        origin: ItemOrigin.MANUAL,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        reason: 'Turma com dificuldade em Equações (Simulado)',
        matchScore: 88
    }];
};
