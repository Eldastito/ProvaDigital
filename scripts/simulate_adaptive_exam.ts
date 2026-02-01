
import { CATEngine, ItemResponse } from '../services/grading/catEngine';
import { Item, QuestionType, DifficultyLevel, ItemOrigin, ItemLifecycleStatus } from '../types';

// ==========================================
// CONFIGURAÇÃO DA SIMULAÇÃO
// ==========================================
const SIMULATION_CONFIG = {
    trueTheta: 2.0, // Aluno Muito Bom (Avançado)
    examLength: 20, // Tamanho da prova
    bankSize: 100   // Tamanho do banco de questões
};

// ==========================================
// 1. GERAR BANCO DE ITENS (Mock)
// ==========================================
console.log(`\n📚 Gerando banco de ${SIMULATION_CONFIG.bankSize} itens calibrados...`);
const mockItemBank: Item[] = Array.from({ length: SIMULATION_CONFIG.bankSize }).map((_, i) => {
    // Distribuição Normal de Dificuldade (-3 a +3)
    const difficulty = (Math.random() * 6) - 3;
    // Discriminação (0.5 a 2.5)
    const discrimination = 0.5 + Math.random() * 2.0;

    return {
        id: `item-${i + 1}`,
        statement: `Questão Simulada ${i + 1}`,
        type: QuestionType.MULTIPLE_CHOICE,
        alternatives: [],
        correctAnswerJustification: '',
        difficulty: DifficultyLevel.MEDIUM,
        score: 1,
        origin: ItemOrigin.MANUAL,
        tags: [],
        usageCount: 0,
        tenantId: 'sim-tenant',
        ownerId: 'sim-owner',
        knowlegeArea: 'Geral',
        subject: 'Simulação',
        createdAt: new Date().toISOString(),
        triParams: {
            difficulty,
            discrimination,
            guessing: 0.2 // Padrão 5 alternativas
        }
    } as any;
});
console.log("✅ Banco gerado com sucesso.\n");

// ==========================================
// 2. MOTOR DE SIMULAÇÃO (Aluno Virtual)
// ==========================================
const simulateStudentResponse = (studentTheta: number, item: Item): boolean => {
    const { discrimination: a, difficulty: b, guessing: c } = item.triParams!;
    // Probabilidade Real de Acerto
    const prob = CATEngine.calculateProbability(studentTheta, a, b, c);
    // Sorteio
    return Math.random() < prob;
};

// ==========================================
// 3. EXECUÇÃO DA PROVA
// ==========================================
async function runExam() {
    let currentEstimatedTheta = 0; // Começa no médio (0)
    const responses: ItemResponse[] = [];
    const usedIds: string[] = [];

    console.log(`🎓 INICIANDO PROVA ADAPTATIVA`);
    console.log(`👤 Perfil do Aluno (Theta Real): ${SIMULATION_CONFIG.trueTheta.toFixed(2)}`);
    console.log(`🏁 Estimativa Inicial do Sistema: ${currentEstimatedTheta.toFixed(2)}\n`);

    console.log(`| Q# | Dificuldade (b) | Discrim. (a) | Prob. Acerto | Resposta | Novo Theta Estimado | Erro Padrão (SEE) |`);
    console.log(`|----|-----------------|--------------|--------------|----------|---------------------|-------------------|`);

    for (let i = 1; i <= SIMULATION_CONFIG.examLength; i++) {
        // A. Selecionar Item
        const item = CATEngine.selectNextItem(currentEstimatedTheta, mockItemBank, usedIds);

        if (!item) {
            console.log("⚠️ Banco de itens esgotado!");
            break;
        }

        usedIds.push(item.id);

        // B. Aluno Responde
        const probabilityOfCorrect = CATEngine.calculateProbability(SIMULATION_CONFIG.trueTheta, item.triParams!.discrimination, item.triParams!.difficulty, item.triParams!.guessing);
        const isCorrect = simulateStudentResponse(SIMULATION_CONFIG.trueTheta, item);

        // C. Atualizar Histórico
        const responseEntry: ItemResponse = {
            itemId: item.id,
            isCorrect,
            discrimination: item.triParams!.discrimination,
            difficulty: item.triParams!.difficulty,
            guessing: item.triParams!.guessing
        };
        responses.push(responseEntry);

        // D. Recalcular Theta (O CÉREBRO DO SISTEMA)
        const newTheta = CATEngine.estimateTheta(responses, currentEstimatedTheta);
        const see = CATEngine.calculateStandardError(newTheta, responses);

        // Log Formatado
        const qNum = i.toString().padStart(2, '0');
        const diff = item.triParams!.difficulty.toFixed(2).padStart(6);
        const disc = item.triParams!.discrimination.toFixed(2).padStart(5);
        const prob = (probabilityOfCorrect * 100).toFixed(0).padStart(3) + '%';
        const res = isCorrect ? '✅ ACERTO' : '❌ ERRO  ';
        const thetaStr = newTheta.toFixed(3).padStart(6);
        const seeStr = see.toFixed(3);

        console.log(`| ${qNum} | ${diff}          | ${disc}        | ${prob}      | ${res} | ${thetaStr}              | ${seeStr}             |`);

        currentEstimatedTheta = newTheta;

        // E. Critério de Parada por Precisão (Opcional na simulação, mas bom mostrar)
        if (see < 0.3 && i >= 10) {
            console.log(`\n🎯 PRECISÃO ALCANÇADA (SEE < 0.3). Encerrando prova antecipadamente na questão ${i}.`);
            break;
        }
    }

    console.log(`\n==========================================`);
    console.log(`📊 RESULTADO FINAL`);
    console.log(`------------------------------------------`);
    console.log(`Real Theta (Habilidade Verdadeira): ${SIMULATION_CONFIG.trueTheta}`);
    console.log(`Final Theta (Habilidade Estimada) : ${currentEstimatedTheta.toFixed(3)}`);
    console.log(`Diferença (Erro de Estimação)     : ${Math.abs(SIMULATION_CONFIG.trueTheta - currentEstimatedTheta).toFixed(3)}`);
    console.log(`Questões Realizadas               : ${responses.length}`);
    console.log(`==========================================\n`);
}

runExam();
