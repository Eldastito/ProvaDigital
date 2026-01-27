import { Exam, Item, StudentAnswer, QuestionType } from '../../types';
import * as geminiService from '../geminiService';

export interface GradingResult {
    answers: StudentAnswer[];
    totalScore: number;
    maxScore: number;
    gradedAt: string;
    gradingMode: 'offline' | 'online' | 'demo';
    isConnected?: boolean;
}

export interface GradingCriteria {
    required: string[];
    optional: string[];
    minLines?: number;
}

export type GradingMethod =
    | 'OFFLINE_OBJECTIVE'
    | 'OFFLINE_PATTERN'
    | 'ONLINE_AI'
    | 'MANUAL_REQUIRED'
    | 'NOT_ANSWERED';

/**
 * Serviço de correção automática - Offline-First
 * 
 * Estratégia:
 * 1. Questões objetivas: correção local instantânea
 * 2. Questões dissertativas offline: padrões de palavras-chave
 * 3. Questões dissertativas online: IA Gemini (backup/emergência)
 */
export class AutoGradingService {
    /**
     * Corrige uma prova completa
     * 
     * @param exam - Prova a ser corrigida
     * @param answers - Respostas do aluno
     * @param mode - Modo de aplicação (offline/online/demo)
     * @param isConnected - Se há conexão internet disponível
     * @returns Resultado da correção com notas
     */
    static async gradeFullExam(
        exam: Exam,
        answers: StudentAnswer[],
        mode: 'offline' | 'online' | 'demo',
        isConnected = false
    ): Promise<GradingResult> {
        const results: StudentAnswer[] = [];
        let totalScore = 0;
        const maxScore = exam.maxScore || 100;

        // Mapeia answers por itemId para lookup rápido
        const answersMap = new Map<string, StudentAnswer>();
        answers.forEach(ans => answersMap.set(ans.itemId, ans));

        // Itera sobre todas as questões da prova
        for (const itemConfig of exam.items) {
            const item = await this.getItemById(itemConfig.itemId);
            const answer = answersMap.get(item.id);

            if (!answer) {
                // Questão não respondida
                results.push({
                    itemId: item.id,
                    selectedAlternativeId: null,
                    text: null,
                    isCorrect: false,
                    scoreObtained: 0,
                    gradingMethod: 'NOT_ANSWERED'
                });
                continue;
            }

            let graded: StudentAnswer;

            // Decisão de estratégia de correção baseada no tipo de questão
            if (item.type === QuestionType.MULTIPLE_CHOICE) {
                // Objetivas SEMPRE podem ser corrigidas offline
                graded = await this.gradeObjectiveOffline(item, answer);
            }
            else if (item.type === QuestionType.ESSAY || item.type === QuestionType.REDACTION) {
                // Dissertativas: prioriza offline, fallback para IA se online
                if (mode === 'offline' || !isConnected) {
                    graded = await this.gradeEssayWithPatterns(item, answer);
                } else {
                    // Online: tenta IA, fallback para padrões se falhar
                    try {
                        const { AIGradingService } = require('./aiGradingService');
                        graded = await AIGradingService.gradeEssayWithGemini(item, answer);
                    } catch (error) {
                        console.warn('AI grading falhou, usando padrões offline:', error);
                        graded = await this.gradeEssayWithPatterns(item, answer);
                    }
                }
            }
            else {
                // Tipo não suportado (ex: upload de arquivo)
                graded = {
                    ...answer,
                    scoreObtained: 0,
                    gradingMethod: 'MANUAL_REQUIRED',
                    essayFeedback: 'Este tipo de questão requer correção manual'
                };
            }

            results.push(graded);
            totalScore += graded.scoreObtained || 0;
        }

        return {
            answers: results,
            totalScore: Math.round(totalScore * 10) / 10, // Arredonda para 1 decimal
            maxScore,
            gradedAt: new Date().toISOString(),
            gradingMode: mode,
            isConnected
        };
    }

    /**
     * Correção de questão objetiva (múltipla escolha)
     * Funciona 100% offline
     */
    static async gradeObjectiveOffline(
        item: Item,
        answer: StudentAnswer
    ): Promise<StudentAnswer> {
        // Encontra a alternativa correta
        const correctAlt = item.alternatives?.find(alt => alt.isCorrect);

        if (!correctAlt) {
            console.error('Item sem alternativa correta definida:', item.id);
            return {
                ...answer,
                isCorrect: false,
                scoreObtained: 0,
                gradingMethod: 'OFFLINE_OBJECTIVE',
                essayFeedback: 'Erro: gabarito não encontrado'
            };
        }

        const isCorrect = correctAlt.id === answer.selectedAlternativeId;
        const scoreObtained = isCorrect ? (item.score || 1) : 0;

        return {
            ...answer,
            isCorrect,
            scoreObtained,
            gradingMethod: 'OFFLINE_OBJECTIVE'
        };
    }

    /**
     * Correção de dissertativa usando padrões de palavras-chave
     * Funciona 100% offline
     * 
     * Extrai critérios do campo correctAnswerJustification no formato:
     * ```
     * Explicação do gabarito...
     * 
     * REQUIRED: palavra1, palavra2, palavra3
     * OPTIONAL: palavra4, palavra5
     * ```
     */
    static async gradeEssayWithPatterns(
        item: Item,
        answer: StudentAnswer
    ): Promise<StudentAnswer> {
        // Resposta vazia
        if (!answer.text || answer.text.trim().length === 0) {
            return {
                ...answer,
                isCorrect: false,
                scoreObtained: 0,
                essayFeedback: 'Resposta vazia',
                gradingMethod: 'OFFLINE_PATTERN'
            };
        }

        // Extrai critérios de correção do gabarito
        const criteria = this.extractCriteria(item.correctAnswerJustification || '');

        // Se não há critérios definidos, marca como necessária correção manual
        if (criteria.required.length === 0 && criteria.optional.length === 0) {
            return {
                ...answer,
                isCorrect: false,
                scoreObtained: 0,
                essayFeedback: 'Sem critérios de correção automática. Aguardando correção manual.',
                gradingMethod: 'MANUAL_REQUIRED',
                needsHumanReview: true
            };
        }

        let score = 0;
        let feedback = '';
        const maxScore = item.score || 1;
        const answerLower = answer.text.toLowerCase();

        // 1. Verifica tamanho mínimo (se definido)
        if (criteria.minLines && criteria.minLines > 0) {
            const lines = answer.text.split('\n').filter(l => l.trim().length > 0).length;
            if (lines < criteria.minLines) {
                feedback += `Resposta muito curta (${lines}/${criteria.minLines} linhas). `;
                score -= 0.2 * maxScore; // Penalidade de 20%
            }
        }

        // 2. Palavras-chave OBRIGATÓRIAS (70% da nota)
        const keywordsFound = criteria.required.filter(keyword =>
            answerLower.includes(keyword.toLowerCase())
        );

        const keywordScore = (keywordsFound.length / Math.max(criteria.required.length, 1)) * maxScore * 0.7;
        score += keywordScore;

        if (keywordsFound.length < criteria.required.length) {
            const missing = criteria.required.filter(k =>
                !keywordsFound.map(f => f.toLowerCase()).includes(k.toLowerCase())
            );
            feedback += `Conceitos faltantes: ${missing.join(', ')}. `;
        }

        // 3. Palavras-chave OPCIONAIS (até 30% bônus)
        if (criteria.optional.length > 0) {
            const bonusFound = criteria.optional.filter(keyword =>
                answerLower.includes(keyword.toLowerCase())
            );

            const bonusScore = Math.min(
                (bonusFound.length / criteria.optional.length) * maxScore * 0.3,
                maxScore * 0.3
            );
            score += bonusScore;

            if (bonusFound.length > 0) {
                feedback += `Conceitos extras incluídos: ${bonusFound.join(', ')}. `;
            }
        }

        // 4. Limita score entre 0 e maxScore
        score = Math.max(0, Math.min(score, maxScore));

        // 5. Define se está correto (60% = aprovado)
        const isCorrect = score >= maxScore * 0.6;

        // 6. Feedback final
        if (!feedback) {
            feedback = `Resposta adequada. ${keywordsFound.length}/${criteria.required.length} conceitos principais presentes.`;
        }

        // Marca para revisão humana se score muito baixo
        const needsReview = keywordsFound.length < criteria.required.length * 0.5;

        return {
            ...answer,
            isCorrect,
            scoreObtained: Math.round(score * 10) / 10,
            essayFeedback: feedback.trim(),
            gradingMethod: 'OFFLINE_PATTERN',
            needsHumanReview: needsReview
        };
    }

    /**
     * Extrai critérios de correção do gabarito
     * 
     * Formato esperado no correctAnswerJustification:
     * ```
     * REQUIRED: fotossíntese, clorofila, luz solar
     * OPTIONAL: CO2, oxigênio, glicose
     * MINLINES: 3
     * ```
     */
    private static extractCriteria(justification: string): GradingCriteria {
        const requiredMatch = justification.match(/REQUIRED:\s*(.+)/im);
        const optionalMatch = justification.match(/OPTIONAL:\s*(.+)/im);
        const minLinesMatch = justification.match(/MINLINES:\s*(\d+)/im);

        return {
            required: requiredMatch
                ? requiredMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0)
                : [],
            optional: optionalMatch
                ? optionalMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0)
                : [],
            minLines: minLinesMatch ? parseInt(minLinesMatch[1]) : undefined
        };
    }

    /**
     * Busca item por ID (mock - deve ser substituído por chamada real)
     * TODO: Integrar com examService ou store
     */
    private static async getItemById(itemId: string): Promise<Item> {
        // Implementação temporária - deve buscar do store ou Supabase
        // Por enquanto, assume que os items já estão no exam.items
        const { supabase } = await import('../supabaseClient');

        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error || !data) {
            throw new Error(`Item não encontrado: ${itemId}`);
        }

        return data as Item;
    }
}
