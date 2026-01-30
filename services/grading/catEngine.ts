import { Item } from '../../types';

/**
 * Interface para representar a resposta e o parâmetro do item usado.
 * Necessária para o cálculo da verossimilhança.
 */
export interface ItemResponse {
    itemId: string;
    isCorrect: boolean;
    discrimination: number; // Parâmetro 'a'
    difficulty: number;     // Parâmetro 'b'
    guessing: number;       // Parâmetro 'c'
}

export class CATEngine {

    /**
     * Probabilidade de Acerto (Modelo Logístico de 3 Parâmetros - 3PL)
     * 
     * P(theta) = c + (1 - c) / (1 + e^(-a * (theta - b)))
     * 
     * @param theta Habilidade estimada do aluno (escala padronizada, geralmente -3 a +3)
     * @param a Discriminação (capacidade do item de distinguir quem sabe de quem não sabe)
     * @param b Dificuldade (nível de habilidade onde a chance de acerto é (1+c)/2)
     * @param c Acerto ao acaso (chute)
     */
    static calculateProbability(theta: number, a: number, b: number, c: number): number {
        // Evita overflow na exponencial
        const z = -a * (theta - b);
        let denominator = 1 + Math.exp(z);

        // Proteção contra valores extremos (overflow/underflow)
        if (Math.abs(z) > 100) {
            denominator = z < 0 ? 1 : Number.MAX_VALUE;
        }

        return c + (1 - c) / denominator;
    }

    /**
     * Informação de Fisher
     * Mede o quanto um item contribui para reduzir a incerteza sobre o theta estimado.
     * Usado para SELEÇÃO DO PRÓXIMO ITEM.
     * 
     * I(theta) = (P'(theta))^2 / (P(theta) * Q(theta))
     * No modelo 3PL simplificado:
     * I(theta) = a^2 * ((Q/P) * ((P-c)/(1-c))^2)
     */
    static calculateItemInformation(theta: number, item: Item): number {
        if (!item.triParams) return 0.01; // Retorno mínimo para itens sem parâmetros calibrados

        const { difficulty: b, discrimination: a, guessing: c } = item.triParams;

        const P = this.calculateProbability(theta, a, b, c);
        const Q = 1 - P;

        // Evita divisão por zero
        if (P <= c || P >= 1) return 0.001;

        const term1 = (P - c) / (1 - c);
        const info = (Math.pow(a, 2) * Q / P) * Math.pow(term1, 2);

        return info;
    }

    /**
     * Estima o Theta do aluno (Proficiência) usando MLE (Maximum Likelihood Estimation)
     * Método iterativo de Newton-Raphson para encontrar o máximo da função de verossimilhança.
     * 
     * @param responses Histórico de respostas do aluno na sessão atual
     * @param currentTheta Estimativa atual (para iniciar a iteração)
     */
    static estimateTheta(responses: ItemResponse[], currentTheta: number = 0): number {
        if (responses.length === 0) return 0;

        let theta = currentTheta;
        const tolerance = 0.01;
        const maxIter = 10; // Mantém baixo para performance em tempo real

        for (let i = 0; i < maxIter; i++) {
            let numerator = 0;   // Primeira derivada da Log-Likelihood
            let denominator = 0; // Segunda derivada (Informação total negativa)

            for (const r of responses) {
                const { discrimination: a, difficulty: b, guessing: c } = r;
                const P = this.calculateProbability(theta, a, b, c);
                const Q = 1 - P;

                // Se P for muito próximo de c ou 1, os termos explodem, ignorar contribuição instável
                if (P <= c + 0.0001 || P >= 0.9999) continue;

                const factor = (P - c) / (1 - c); // Termo comum

                // Derivada primeira (Score Function)
                // U(theta) = soma( a * (u_i - P) * (P - c) / (P * (1-c)) )
                // Simplificado: a * (u - P) * (1 / (1-c)) * ((1-c)/P * (P-c)/(1-c)) ...
                // Forma padrão 3PL:
                const u = r.isCorrect ? 1 : 0;
                numerator += (a * (u - P) * factor) / P;

                // Derivada segunda (Informação de Fisher negativa)
                // Info = a^2 * (Q/P) * factor^2
                const info = (Math.pow(a, 2) * Q / P) * Math.pow(factor, 2);
                denominator += info;
            }

            // Se denominador muito pequeno (informação zero), para pra não dividir por zero
            if (denominator < 0.001) break;

            const change = numerator / denominator;
            theta = theta + change;

            // Clamp theta para manter sanidade (-4 a +4)
            theta = Math.max(-4, Math.min(4, theta));

            if (Math.abs(change) < tolerance) break;
        }

        return theta;
    }

    /**
     * Seleciona o melhor próximo item do banco para o theta estimado atual.
     * Estratégia: Máxima Informação
     */
    static selectNextItem(currentTheta: number, itemBank: Item[], usedItemIds: string[]): Item | null {
        const availableItems = itemBank.filter(i =>
            !usedItemIds.includes(i.id) &&
            i.triParams // Só aceita itens calibrados
        );

        if (availableItems.length === 0) return null;

        // Adiciona um pouco de aleatoriedade (Exposure Control) para não repetir sempre as mesmas questões
        // Seleciona os top 3 melhores e escolhe um aleatório entre eles
        const rankedItems = availableItems.sort((a, b) => {
            const infoA = this.calculateItemInformation(currentTheta, a);
            const infoB = this.calculateItemInformation(currentTheta, b);
            return infoB - infoA; // Decrescente
        });

        const topCanditates = rankedItems.slice(0, 3);
        const randomIndex = Math.floor(Math.random() * topCanditates.length);

        return topCanditates[randomIndex];
    }

    /**
     * Calcula o Erro Padrão de Estimativa (Standard Error of Estimation - SEE)
     * SEE = 1 / sqrt(InfoTotal)
     * Usado para critério de parada da prova.
     */
    static calculateStandardError(theta: number, responses: ItemResponse[]): number {
        let totalInfo = 0;

        // Reconstrói "items" a partir das responses apenas para cálculo da informação
        // Em um cenário real, talvez fosse melhor passar os objetos Items completos
        for (const r of responses) {
            const mockItem: any = {
                triParams: {
                    discrimination: r.discrimination,
                    difficulty: r.difficulty,
                    guessing: r.guessing
                }
            };
            totalInfo += this.calculateItemInformation(theta, mockItem);
        }

        if (totalInfo <= 0.0001) return 999; // Incerteza máxima

        return 1 / Math.sqrt(totalInfo);
    }
}
