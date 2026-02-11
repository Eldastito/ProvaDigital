import { Item } from '../types';

/**
 * Modo de adaptação para provas offline
 */
export type AdaptiveMode = 'LOCAL' | 'HYBRID' | 'PRECOMPUTED';

/**
 * Configuração de prova adaptativa offline
 */
export interface OfflineAdaptiveConfig {
    mode: AdaptiveMode;
    targetQuestions: number; // Número de questões que o aluno responderá
    precomputedPath?: string[]; // IDs das questões (para modo pré-computado)
    stopCriterion?: {
        type: 'FIXED_COUNT' | 'SE_THRESHOLD' | 'TIME_LIMIT';
        value: number;
    };
}

/**
 * Motor de adaptação TRI para uso offline
 * Implementa algoritmo simplificado de CAT (Computerized Adaptive Testing)
 */
export class OfflineAdaptiveEngine {
    private theta: number = 0; // Habilidade estimada do aluno
    private se: number = 2.0; // Erro padrão inicial
    private itemsUsed: Set<string> = new Set();
    private responses: Array<{ itemId: string; correct: boolean; difficulty: number }> = [];

    constructor(initialTheta: number = 0) {
        this.theta = initialTheta;
    }

    /**
     * Seleciona próxima questão baseada em TRI
     * Usa critério de Máxima Informação
     */
    selectNextItem(pool: Item[]): Item | null {
        // Filtrar itens não usados
        const available = pool.filter(item => !this.itemsUsed.has(item.id));

        if (available.length === 0) return null;

        // Selecionar item com máxima informação no theta atual
        let bestItem = available[0];
        let maxInfo = this.itemInformation(bestItem, this.theta);

        for (const item of available) {
            const info = this.itemInformation(item, this.theta);
            if (info > maxInfo) {
                maxInfo = info;
                bestItem = item;
            }
        }

        this.itemsUsed.add(bestItem.id);
        return bestItem;
    }

    /**
     * Atualiza estimativa de habilidade após resposta
     * Usa método EAP (Expected A Posteriori) simplificado
     */
    updateTheta(correct: boolean, item: Item): void {
        const difficulty = item.triParams?.difficulty || 0;
        const discrimination = item.triParams?.discrimination || 1;

        // Registrar resposta
        this.responses.push({
            itemId: item.id,
            correct,
            difficulty
        });

        // Atualização simplificada usando Newton-Raphson
        const maxIterations = 10;
        const tolerance = 0.001;

        for (let i = 0; i < maxIterations; i++) {
            const { likelihood, derivative } = this.calculateLikelihood(this.theta);

            if (Math.abs(derivative) < tolerance) break;

            const adjustment = likelihood / derivative;
            this.theta -= adjustment;

            // Limitar theta entre -3 e +3
            this.theta = Math.max(-3, Math.min(3, this.theta));
        }

        // Atualizar erro padrão
        this.updateStandardError();
    }

    /**
     * Calcula informação do item no theta atual
     */
    private itemInformation(item: Item, theta: number): number {
        const b = item.triParams?.difficulty || 0;
        const a = item.triParams?.discrimination || 1;
        const p = this.probability(theta, a, b);

        // Informação de Fisher
        return a * a * p * (1 - p);
    }

    /**
     * Calcula probabilidade de acerto usando modelo 3PL simplificado
     */
    private probability(theta: number, a: number, b: number, c: number = 0.25): number {
        // Modelo 3PL: P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))
        return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
    }

    /**
     * Calcula likelihood e sua derivada
     */
    private calculateLikelihood(theta: number): { likelihood: number; derivative: number } {
        let likelihood = 0;
        let derivative = 0;

        for (const response of this.responses) {
            const item = { triParams: { difficulty: response.difficulty, discrimination: 1 } };
            const p = this.probability(theta, 1, response.difficulty);

            if (response.correct) {
                likelihood += Math.log(p);
                derivative += (1 - p);
            } else {
                likelihood += Math.log(1 - p);
                derivative -= p;
            }
        }

        return { likelihood, derivative };
    }

    /**
     * Atualiza erro padrão da estimativa
     */
    private updateStandardError(): void {
        let information = 0;

        for (const response of this.responses) {
            const p = this.probability(this.theta, 1, response.difficulty);
            information += p * (1 - p);
        }

        this.se = information > 0 ? 1 / Math.sqrt(information) : 2.0;
    }

    /**
     * Verifica se deve parar o teste
     */
    shouldStop(config: OfflineAdaptiveConfig): boolean {
        const criterion = config.stopCriterion || { type: 'FIXED_COUNT', value: config.targetQuestions };

        switch (criterion.type) {
            case 'FIXED_COUNT':
                return this.responses.length >= criterion.value;

            case 'SE_THRESHOLD':
                // Parar quando erro padrão for menor que threshold
                return this.se < criterion.value;

            case 'TIME_LIMIT':
                // Implementar se necessário
                return false;

            default:
                return this.responses.length >= config.targetQuestions;
        }
    }

    /**
     * Retorna estatísticas atuais
     */
    getStats(): {
        theta: number;
        se: number;
        questionsAnswered: number;
        correctCount: number;
        accuracy: number;
    } {
        const correctCount = this.responses.filter(r => r.correct).length;

        return {
            theta: this.theta,
            se: this.se,
            questionsAnswered: this.responses.length,
            correctCount,
            accuracy: this.responses.length > 0 ? correctCount / this.responses.length : 0
        };
    }

    /**
     * Serializa estado para salvar
     */
    serialize(): string {
        return JSON.stringify({
            theta: this.theta,
            se: this.se,
            itemsUsed: Array.from(this.itemsUsed),
            responses: this.responses
        });
    }

    /**
     * Restaura estado salvo
     */
    static deserialize(data: string): OfflineAdaptiveEngine {
        const state = JSON.parse(data);
        const engine = new OfflineAdaptiveEngine(state.theta);
        engine.se = state.se;
        engine.itemsUsed = new Set(state.itemsUsed);
        engine.responses = state.responses;
        return engine;
    }
}

/**
 * Gera caminho pré-computado para modo offline
 */
export function generatePrecomputedPath(
    itemPool: Item[],
    targetQuestions: number = 25
): string[] {
    // Ordenar questões por dificuldade TRI
    const sorted = [...itemPool].sort((a, b) => {
        const diffA = a.triParams?.difficulty || 0;
        const diffB = b.triParams?.difficulty || 0;
        return diffA - diffB;
    });

    // Selecionar distribuição balanceada
    const path: string[] = [];
    const step = Math.max(1, Math.floor(sorted.length / targetQuestions));

    for (let i = 0; i < targetQuestions && i * step < sorted.length; i++) {
        const index = i * step;
        if (sorted[index]) {
            path.push(sorted[index].id);
        }
    }

    // Se não conseguiu preencher, adicionar questões aleatórias
    while (path.length < targetQuestions && path.length < sorted.length) {
        const remaining = sorted.filter(item => !path.includes(item.id));
        if (remaining.length > 0) {
            const random = remaining[Math.floor(Math.random() * remaining.length)];
            path.push(random.id);
        } else {
            break;
        }
    }

    return path;
}

/**
 * Detecta capacidade do dispositivo para adaptação local
 */
export function detectDeviceCapability(): {
    supportsLocal: boolean;
    recommendedMode: AdaptiveMode;
    reason: string;
} {
    // Verificar se está em navegador
    if (typeof window === 'undefined') {
        return {
            supportsLocal: false,
            recommendedMode: 'PRECOMPUTED',
            reason: 'Ambiente servidor'
        };
    }

    // Verificar memória disponível (se API disponível)
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency || 1;

    // Critérios para suportar adaptação local:
    // - Pelo menos 4GB RAM (ou desconhecido)
    // - Pelo menos 2 cores
    const hasEnoughMemory = !memory || memory >= 4;
    const hasEnoughCores = cores >= 2;

    if (hasEnoughMemory && hasEnoughCores) {
        return {
            supportsLocal: true,
            recommendedMode: 'LOCAL',
            reason: `Dispositivo capaz (${cores} cores, ${memory || '?'}GB RAM)`
        };
    } else {
        return {
            supportsLocal: false,
            recommendedMode: 'HYBRID',
            reason: `Dispositivo limitado (${cores} cores, ${memory || '?'}GB RAM)`
        };
    }
}

/**
 * Prepara configuração adaptativa para offline
 */
export function prepareOfflineAdaptiveConfig(
    itemPool: Item[],
    preferredMode: AdaptiveMode,
    targetQuestions: number = 25
): OfflineAdaptiveConfig {
    const deviceCapability = detectDeviceCapability();

    // Determinar modo final
    let finalMode = preferredMode;

    if (preferredMode === 'HYBRID') {
        // Modo híbrido: usar local se possível, senão pré-computado
        finalMode = deviceCapability.supportsLocal ? 'LOCAL' : 'PRECOMPUTED';
    }

    const config: OfflineAdaptiveConfig = {
        mode: finalMode,
        targetQuestions,
        stopCriterion: {
            type: 'FIXED_COUNT',
            value: targetQuestions
        }
    };

    // Se for pré-computado, gerar caminho
    if (finalMode === 'PRECOMPUTED') {
        config.precomputedPath = generatePrecomputedPath(itemPool, targetQuestions);
    }

    return config;
}
