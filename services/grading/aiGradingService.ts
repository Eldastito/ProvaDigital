import { Item, StudentAnswer } from '../../types';
import * as geminiServiceModule from '../geminiService';

/**
 * Serviço de correção com IA (Gemini)
 * Usado como backup online ou para Live Demo
 */
export class AIGradingService {
    /**
     * Corrige dissertativa usando Gemini AI
     * 
     * @param item - Questão dissertativa
     * @param answer - Resposta do aluno
     * @returns Resposta corrigida com score e feedback
     */
    static async gradeEssayWithGemini(
        item: Item,
        answer: StudentAnswer
    ): Promise<StudentAnswer> {
        if (!answer.text || answer.text.trim().length === 0) {
            return {
                ...answer,
                isCorrect: false,
                scoreObtained: 0,
                essayFeedback: 'Resposta vazia',
                gradingMethod: 'ONLINE_AI' as const
            };
        }

        try {
            const maxScore = item.score || 1;

            // Monta prompt para o Gemini
            const prompt = this.buildGradingPrompt(item, answer.text, maxScore);

            // Chama Gemini
            const response = await geminiServiceModule.askOwlTutor([], prompt, 'Corretor', '', []);

            // Parse da resposta JSON
            const result = this.parseGeminiResponse(response);

            // Valida score
            const scoreObtained = Math.max(0, Math.min(result.score, maxScore));

            return {
                ...answer,
                isCorrect: scoreObtained >= maxScore * 0.6, // 60% = aprovado
                scoreObtained: Math.round(scoreObtained * 10) / 10,
                essayFeedback: result.feedback,
                gradingMethod: 'ONLINE_AI'
            };

        } catch (error) {
            console.error('Erro na correção com IA:', error);

            // Fallback: marca para correção manual
            return {
                ...answer,
                isCorrect: false,
                scoreObtained: 0,
                essayFeedback: 'Erro na correção automática com IA. Aguardando correção manual.',
                gradingMethod: 'MANUAL_REQUIRED' as const,
                needsHumanReview: true
            };
        }
    }

    /**
     * Monta prompt otimizado para correção de dissertativas
     */
    private static buildGradingPrompt(item: Item, answerText: string, maxScore: number): string {
        return `Você é um corretor pedagógico experiente. Avalie a resposta dissertativa do aluno de forma justa e construtiva.

**QUESTÃO:**
${item.statement}

**GABARITO ESPERADO / CRITÉRIOS:**
${item.correctAnswerJustification || 'Não fornecido'}

**RESPOSTA DO ALUNO:**
${answerText}

**INSTRUÇÕES DE CORREÇÃO:**
1. Avalie se o aluno compreendeu o conceito principal
2. Verifique coerência, clareza e organização das ideias
3. Considere gramática e ortografia (mas não seja excessivamente rigoroso)
4. Pontuação máxima: ${maxScore} pontos
5. Seja justo mas exigente - a resposta precisa demonstrar compreensão real

**FORMATO DE SAÍDA (JSON estrito, sem markdown):**
{
  "score": <número de 0 a ${maxScore}>,
  "feedback": "<feedback construtivo em português, 2-4 linhas, destacando pontos fortes e áreas de melhoria>"
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois.`;
    }

    /**
     * Parse da resposta do Gemini
     */
    private static parseGeminiResponse(response: string): { score: number; feedback: string } {
        try {
            // Remove markdown code blocks se presentes
            let cleaned = response.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }

            const parsed = JSON.parse(cleaned);

            if (typeof parsed.score !== 'number' || typeof parsed.feedback !== 'string') {
                throw new Error('Formato de resposta inválido');
            }

            return {
                score: parsed.score,
                feedback: parsed.feedback
            };

        } catch (error) {
            console.error('Erro ao parsear resposta do Gemini:', error, 'Response:', response);

            // Fallback: tenta extrair score e feedback de forma mais flexível
            const scoreMatch = response.match(/"score":\s*([0-9.]+)/);
            const feedbackMatch = response.match(/"feedback":\s*"([^"]+)"/);

            if (scoreMatch && feedbackMatch) {
                return {
                    score: parseFloat(scoreMatch[1]),
                    feedback: feedbackMatch[1]
                };
            }

            throw new Error('Não foi possível parsear resposta da IA');
        }
    }

    /**
     * Corrige múltiplas dissertativas em lote (otimizado para servidor)
     * Usado para processar todas as respostas de uma escola de uma vez
     */
    static async gradeEssayBatch(
        items: Item[],
        answers: StudentAnswer[]
    ): Promise<StudentAnswer[]> {
        const results: StudentAnswer[] = [];

        // Processa em paralelo (máximo 5 requisições simultâneas para não sobrecarregar API)
        const BATCH_SIZE = 5;

        for (let i = 0; i < answers.length; i += BATCH_SIZE) {
            const batch = answers.slice(i, i + BATCH_SIZE);

            const batchPromises = batch.map(async (answer) => {
                const item = items.find(it => it.id === answer.itemId);
                if (!item) {
                    return {
                        ...answer,
                        scoreObtained: 0,
                        gradingMethod: 'MANUAL_REQUIRED' as const,
                        essayFeedback: 'Item não encontrado'
                    };
                }

                return await this.gradeEssayWithGemini(item, answer);
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Pequena pausa entre batches para respeitar rate limits
            if (i + BATCH_SIZE < answers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }
}
