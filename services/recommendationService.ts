import { QuestionType, DifficultyLevel, AppState, Question } from '../types';
import { generateQuestionsFromText } from './geminiService';

export interface RecommendationRequest {
    subject: string;
    gradeLevel: number; // 6 to 9
    topic?: string;
    excludeItemIds?: string[];
}

export interface RecommendedItem extends Question {
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

    // 1. Identify "Weak Spots" (Mock logic for now, would analyze state.results)
    // Real logic: Filter results by subject/grade -> find topics with avg score < 6.0
    const weakSpots = [
        { topic: 'Equações de 1º Grau', bncc: 'EF07MA18', reason: 'Turma com 40% de erro neste tópico na última prova.' },
        { topic: 'Interpretação de Texto', bncc: 'EF69LP03', reason: 'Histórico de dificuldade em inferência.' }
    ];

    const targetSpot = weakSpots[0]; // Pick top priority

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
                bncc: item.bnccCode || targetSpot.bncc, // Fallback to requested BNCC
                tags: ['Recomendado por IA', targetSpot.topic],
                score: 1.0,
                authorId: 'AI_MENTOR',
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
        bncc: 'EF07MA18',
        tags: ['Recomendado (Offline)', 'Álgebra'],
        score: 1.0,
        authorId: 'SYSTEM',
        createdAt: new Date().toISOString(),
        reason: 'Turma com dificuldade em Equações (Simulado)',
        matchScore: 88
    }];
};
