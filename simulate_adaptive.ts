
import { CATEngine, ItemResponse } from './services/grading/catEngine';
import { Item, QuestionType, DifficultyLevel, ExamModel } from './types';

// 1. MOCK DE UM POOL DE ITENS CALIBRADOS (Dificuldades variadas de -2 a +2)
const itemPool: Item[] = [
    { id: 'q_easy_1', subject: 'Matemática', triParams: { difficulty: -2.0, discrimination: 1.2, guessing: 0.2 }, alternatives: [{id: 'opt1', text: 'Correct', isCorrect: true}], difficulty: DifficultyLevel.EASY } as Item,
    { id: 'q_easy_2', subject: 'Matemática', triParams: { difficulty: -1.5, discrimination: 1.0, guessing: 0.2 }, alternatives: [{id: 'opt1', text: 'Correct', isCorrect: true}], difficulty: DifficultyLevel.EASY } as Item,
    { id: 'q_med_1', subject: 'Matemática', triParams: { difficulty: 0.0, discrimination: 1.5, guessing: 0.2 }, alternatives: [{id: 'opt1', text: 'Correct', isCorrect: true}], difficulty: DifficultyLevel.MEDIUM } as Item,
    { id: 'q_med_2', subject: 'Matemática', triParams: { difficulty: 0.5, discrimination: 1.3, guessing: 0.2 }, alternatives: [{id: 'opt1', text: 'Correct', isCorrect: true}], difficulty: DifficultyLevel.MEDIUM } as Item,
    { id: 'q_hard_1', subject: 'Matemática', triParams: { difficulty: 1.5, discrimination: 1.8, guessing: 0.2 }, alternatives: [{id: 'opt1', text: 'Correct', isCorrect: true}], difficulty: DifficultyLevel.HARD } as Item,
    { id: 'q_hard_2', subject: 'Matemática', triParams: { difficulty: 2.5, discrimination: 2.0, guessing: 0.2 }, alternatives: [{id: 'opt1', text: 'Correct', isCorrect: true}], difficulty: DifficultyLevel.HARD } as Item,
];

async function simulateStudent(profile: 'STRONG' | 'WEAK') {
    console.log(`\n--- SIMULAÇÃO: ALUNO ${profile} ---`);
    let currentTheta = 0; // Habilidade inicial
    const usedItems: string[] = [];
    const responses: ItemResponse[] = [];

    for (let step = 1; step <= 4; step++) {
        // Selecionar Próximo Item
        const item = CATEngine.selectNextItem(currentTheta, itemPool, usedItems);
        if (!item) break;
        
        usedItems.push(item.id);
        
        // Simular Resposta baseada no perfil
        // Se aluno é forte, acerta quase tudo. Se fraco, erra quase tudo.
        const isCorrect = profile === 'STRONG' ? (Math.random() > 0.1) : (Math.random() > 0.8);
        
        const res: ItemResponse = {
            itemId: item.id,
            isCorrect,
            difficulty: item.triParams!.difficulty,
            discrimination: item.triParams!.discrimination,
            guessing: item.triParams!.guessing
        };
        responses.push(res);
        
        // Estimar novo Theta
        const oldTheta = currentTheta;
        currentTheta = CATEngine.estimateTheta(responses, currentTheta);
        const se = CATEngine.calculateStandardError(currentTheta, responses);

        console.log(`Passo ${step}:`);
        console.log(`  Questão: ${item.id} (Dificuldade b: ${item.triParams!.difficulty})`);
        console.log(`  Resultado: ${isCorrect ? '✅ ACERTO' : '❌ ERRO'}`);
        console.log(`  Theta: ${oldTheta.toFixed(2)} -> ${currentTheta.toFixed(2)} (Erro Padrão: ${se.toFixed(2)})`);
    }
}

async function run() {
    await simulateStudent('STRONG');
    await simulateStudent('WEAK');
}

run().catch(console.error);
