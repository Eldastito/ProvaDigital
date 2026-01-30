import { CATEngine, ItemResponse } from './catEngine';
import { Item, QuestionType, DifficultyLevel, ItemOrigin, ItemLifecycleStatus } from '../../types';

// MOCK: Banco de Questões Calibrado
const mockItemBank: Item[] = Array.from({ length: 50 }).map((_, i) => ({
    id: `item-${i}`,
    statement: `Questão ${i}`,
    type: QuestionType.MULTIPLE_CHOICE,
    alternatives: [],
    correctAnswerJustification: '',
    difficulty: DifficultyLevel.MEDIUM,
    score: 1,
    origin: ItemOrigin.MANUAL,
    tags: [],
    usageCount: 0,
    tenantId: 'tenant-1',
    ownerId: 'owner-1',
    knowledgeArea: 'Math',
    subject: 'Algebra',
    createdAt: new Date().toISOString(),
    // Parâmetros TRI variados
    triParams: {
        // Dificuldade (b) varia de -3 (muito fácil) a +3 (muito difícil)
        difficulty: (i % 7) - 3,
        // Discriminação (a) entre 0.8 e 2.5 (bons itens)
        discrimination: 0.8 + (i % 3) * 0.5,
        // Chute (c) baixo, típico de 4 ou 5 alternativas
        guessing: 0.2
    }
}));

// Helper: Simula um aluno respondendo
// Se a probabilidade de acerto for > random, ele acerta.
const simulateResponse = (studentTrueTheta: number, item: Item): boolean => {
    const { discrimination: a, difficulty: b, guessing: c } = item.triParams!;
    const prob = CATEngine.calculateProbability(studentTrueTheta, a, b, c);
    return Math.random() < prob;
};

describe('CATEngine - Motor Adaptativo', () => {

    test('Deve calcular probabilidade corretamente (3PL)', () => {
        // Aluno com habilidade igual à dificuldade do item (theta = b)
        // Chance deve ser c + (1-c)/2 = (1+c)/2
        const p = CATEngine.calculateProbability(0, 1, 0, 0.2);
        // Esperado: 0.2 + 0.8 / 2 = 0.6
        expect(p).toBeCloseTo(0.6);
    });

    test('Deve selecionar o próximo item baseado em Máxima Informação', () => {
        const theta = 0; // Aluno médio
        const usedIds: string[] = [];

        const nextItem = CATEngine.selectNextItem(theta, mockItemBank, usedIds);

        expect(nextItem).toBeDefined();
        // Esperamos um item com dificuldade próxima de 0 (theta do aluno) e alto 'a'
        console.log(`Item selecionado para Theta 0: b=${nextItem?.triParams?.difficulty}, a=${nextItem?.triParams?.discrimination}`);

        expect(Math.abs(nextItem!.triParams!.difficulty - theta)).toBeLessThan(2);
    });

    test('SIMULAÇÃO: Prova Completa deve convergir para o Theta real do aluno', () => {
        const trueTheta = 1.5; // Aluno acima da média
        let estimatedTheta = 0; // Começa assumindo médio
        const responses: ItemResponse[] = [];
        const usedIds: string[] = [];

        console.log(`\n--- INICIANDO SIMULAÇÃO ADAPTATIVA (Theta Real: ${trueTheta}) ---`);

        // Simula prova de 15 questões
        for (let i = 1; i <= 15; i++) {
            // 1. Seleciona Item
            const item = CATEngine.selectNextItem(estimatedTheta, mockItemBank, usedIds);
            if (!item) break;

            usedIds.push(item.id);

            // 2. Aluno Responde
            const isCorrect = simulateResponse(trueTheta, item);

            // 3. Registra Resposta
            responses.push({
                itemId: item.id,
                isCorrect,
                discrimination: item.triParams!.discrimination,
                difficulty: item.triParams!.difficulty,
                guessing: item.triParams!.guessing
            });

            // 4. Re-estima Theta
            const prevTheta = estimatedTheta;
            estimatedTheta = CATEngine.estimateTheta(responses, prevTheta);
            const see = CATEngine.calculateStandardError(estimatedTheta, responses);

            console.log(`Q${i} [Dif: ${item.triParams!.difficulty.toFixed(2)}] | Acertou: ${isCorrect ? 'SIM' : 'NÃO'} | Novo Theta: ${estimatedTheta.toFixed(3)} (Err: ${see.toFixed(3)})`);
        }

        // Verifica se a estimativa final está próxima do real (margem de erro ~0.5 é aceitável para 15 itens)
        expect(Math.abs(estimatedTheta - trueTheta)).toBeLessThan(1.0);
    });
});
