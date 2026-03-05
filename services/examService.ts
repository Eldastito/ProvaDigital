import { Item, DifficultyLevel, QuestionType } from '../types';

export interface ExamCriteria {
    subject: string;
    targetCount: number;
    difficultyDistribution: {
        [key in DifficultyLevel]: number; // Percentual (0-100)
    };
    bnccCodes?: string[];
    preferredTypes?: QuestionType[];
    grade?: string;
    knowledgeArea?: string;
    contentDescription?: string;
    className?: string;
}

export interface SelectionResult {
    selectedItems: Item[];
    missingCount: number;
    distributionActual: {
        [key in DifficultyLevel]: number;
    };
    unmetBnccCodes: string[];
}

/**
 * Algoritmo de Seleção Inteligente de Itens
 */
export const smartSelectItems = (criteria: ExamCriteria, pool: Item[]): SelectionResult => {
    // 1. Filtrar por disciplina (Opcional se vazio)
    let filteredPool = pool.filter(i => i !== null && i !== undefined);

    const targetSubject = (criteria?.subject || "").toString().toLowerCase().trim();

    if (targetSubject !== "") {
        filteredPool = filteredPool.filter(item => {
            const itemSubject = (item?.subject || "").toString().toLowerCase().trim();
            return itemSubject === targetSubject;
        });
    }

    // 2. Se houver filtros de tipo preferido
    if (criteria.preferredTypes && criteria.preferredTypes.length > 0) {
        filteredPool = filteredPool.filter(item => criteria.preferredTypes?.includes(item.type));
    }

    const selectedIds = new Set<string>();
    const selectedItems: Item[] = [];
    const unmetBnccCodes = criteria.bnccCodes ? [...criteria.bnccCodes] : [];

    // 3. Agrupar por dificuldade
    const itemsByDifficulty: Record<DifficultyLevel, Item[]> = {
        [DifficultyLevel.EASY]: filteredPool.filter(i => i.difficulty === DifficultyLevel.EASY),
        [DifficultyLevel.MEDIUM]: filteredPool.filter(i => i.difficulty === DifficultyLevel.MEDIUM),
        [DifficultyLevel.HARD]: filteredPool.filter(i => i.difficulty === DifficultyLevel.HARD),
    };

    // 4. Calcular metas por dificuldade
    Object.keys(criteria.difficultyDistribution).forEach((diff) => {
        const level = diff as DifficultyLevel;
        const percentage = criteria.difficultyDistribution[level];
        const targetForLevel = Math.round((percentage / 100) * criteria.targetCount);

        // Tentar preencher com itens que atendam BNCC primeiro
        const availableInLevel = [...itemsByDifficulty[level]];

        // Shuffle para evitar pegar sempre as mesmas
        availableInLevel.sort(() => Math.random() - 0.5);

        let countInLevel = 0;

        // Passada 1: Prioridade BNCC
        if (criteria.bnccCodes && criteria.bnccCodes.length > 0) {
            for (const item of availableInLevel) {
                if (countInLevel >= targetForLevel) break;
                if (item.bnccCode && criteria.bnccCodes.includes(item.bnccCode)) {
                    selectedItems.push(item);
                    selectedIds.add(item.id);
                    countInLevel++;

                    // Remover do unmet se presente
                    const idx = unmetBnccCodes.indexOf(item.bnccCode);
                    if (idx > -1) unmetBnccCodes.splice(idx, 1);
                }
            }
        }

        // Passada 2: Preencher o restante do nível
        for (const item of availableInLevel) {
            if (countInLevel >= targetForLevel) break;
            if (!selectedIds.has(item.id)) {
                selectedItems.push(item);
                selectedIds.add(item.id);
                countInLevel++;
            }
        }
    });

    // 5. Se ainda faltar itens para a meta total (por arredondamento ou falta no banco)
    if (selectedItems.length < criteria.targetCount) {
        const remainingPool = filteredPool.filter(i => !selectedIds.has(i.id));
        remainingPool.sort(() => Math.random() - 0.5);

        while (selectedItems.length < criteria.targetCount && remainingPool.length > 0) {
            const item = remainingPool.pop()!;
            selectedItems.push(item);
            selectedIds.add(item.id);
        }
    }

    // 6. Calcular diagnóstico final
    const distributionActual = {
        [DifficultyLevel.EASY]: 0,
        [DifficultyLevel.MEDIUM]: 0,
        [DifficultyLevel.HARD]: 0,
    };

    selectedItems.forEach(item => {
        distributionActual[item.difficulty]++;
    });

    return {
        selectedItems,
        missingCount: criteria.targetCount - selectedItems.length,
        distributionActual,
        unmetBnccCodes
    };
};

/**
 * Calcula o equilíbrio de uma prova existente
 */
export const calculateExamBalance = (items: Item[]) => {
    const total = items.length;
    if (total === 0) return null;

    const diffs = {
        [DifficultyLevel.EASY]: items.filter(i => i.difficulty === DifficultyLevel.EASY).length,
        [DifficultyLevel.MEDIUM]: items.filter(i => i.difficulty === DifficultyLevel.MEDIUM).length,
        [DifficultyLevel.HARD]: items.filter(i => i.difficulty === DifficultyLevel.HARD).length,
    };

    const types = items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        difficultyPercentages: {
            easy: Math.round((diffs[DifficultyLevel.EASY] / total) * 100),
            medium: Math.round((diffs[DifficultyLevel.MEDIUM] / total) * 100),
            hard: Math.round((diffs[DifficultyLevel.HARD] / total) * 100),
        },
        typeBreakdown: types,
        totalItems: total
    };
};
