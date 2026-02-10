import { Item, LiteracyDomain } from '../types';

export const CalibrationService = {
    /**
     * Simula a calibração de itens usando um motor TRI.
     * Na vida real, isso enviaria dados de respostas para um backend Python/R.
     */
    calibrateItems: async (items: Item[]): Promise<Item[]> => {
        // Simulando delay de processamento estatístico
        await new Promise(resolve => setTimeout(resolve, 1500));

        return items.map(item => {
            if (!item.triParams) return item;

            // Simulando um ajuste fino baseado em "dados reais"
            // Variamos levemente os parâmetros originais
            const noise = () => (Math.random() - 0.5) * 0.1;

            return {
                ...item,
                triParams: {
                    ...item.triParams,
                    difficulty: Number((item.triParams.difficulty + noise()).toFixed(3)),
                    discrimination: Number((item.triParams.discrimination + noise()).toFixed(3)),
                    guessing: Number((item.triParams.guessing + (noise() * 0.1)).toFixed(3)),
                    calibrationStatus: 'DATA_CALIBRATED',
                    calibrationMetadata: {
                        sampleSize: Math.floor(Math.random() * 5000) + 1200,
                        standardError: Number((Math.random() * 0.05).toFixed(4)),
                        lastCalibratedAt: new Date().toISOString()
                    }
                }
            };
        });
    },

    /**
     * Detecta anomalias psicométricas (itens que não seguem a curva esperada)
     */
    detectAnomalies: (items: Item[]): Item[] => {
        return items.filter(item => {
            if (!item.triParams) return false;

            // Critério fictício de anomalia: discriminação muito baixa ou erro padrão alto
            const isAnomaly =
                item.triParams.discrimination < 0.3 ||
                (item.triParams.calibrationMetadata?.standardError || 0) > 0.1;

            return isAnomaly;
        });
    },

    /**
     * Gera os pontos para desenhar a Curva Característica do Item (ICC)
     */
    getICCPoints: (difficulty: number, discrimination: number, guessing: number) => {
        const points = [];
        // theta varia de -4 a 4
        for (let theta = -4; theta <= 4; theta += 0.2) {
            // Fórmula do Modelo de 3 Parâmetros (3PL)
            // P(theta) = c + (1 - c) * (1 / (1 + exp(-a * (theta - b))))
            const exponent = -discrimination * (theta - difficulty);
            const probability = guessing + (1 - guessing) * (1 / (1 + Math.exp(exponent)));

            points.push({ theta, probability });
        }
        return points;
    }
};
