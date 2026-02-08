export interface LogisticsResult {
    tabletsNecessários: number;
    reservaTécnica: number;
    totalTablets: number;
    malasTransporte: number;
    configuraçãoSuporte: {
        professor: number;
        mesh: number;
        coordenação: number;
    };
}

export interface FinancialResult {
    opexTotal: number;
    impostosTotais: number;
    margemEbitda: number;
    breakEvenAlunos: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    paybackMonths: number;
    sugestõesPreço: {
        mínimo: number;
        ideal: number;
        folgado: number;
    };
}

/**
 * Calcula a logística de tablets baseada no cenário de reuso e maior turma.
 */
export const calculateLogistics = (
    maiorTurma: number,
    totalAlunos: number,
    diasSemana: number = 5,
    turmasPorDia: number = 6
): LogisticsResult => {
    // A necessidade é definida pela maior turma (ponto de referência)
    const tabletsBase = maiorTurma;

    // Reserva técnica de 10%
    const reservaTécnica = Math.ceil(tabletsBase * 0.1);

    // Hardware fixo por escola/cenário
    const suporte = {
        professor: 1,
        mesh: 1,
        coordenação: 1
    };

    const totalTablets = tabletsBase + reservaTécnica + suporte.professor + suporte.mesh + suporte.coordenação;

    // Cada mala comporta 20 unidades
    const malasTransporte = Math.ceil(totalTablets / 20);

    return {
        tabletsNecessários: tabletsBase,
        reservaTécnica,
        totalTablets,
        malasTransporte,
        configuraçãoSuporte: suporte
    };
};

/**
 * Calcula KPIs de negócio e sugestões de preço.
 */
export const calculateBusinessMetrics = (
    custosFixos: number, // Aluguel, salários, infra
    custosVariáveisPorAluno: number, // Token IA, suporte pro-rata
    investimentoHardware: number,
    impostosPercentual: number, // Soma de Fed/Est/Mun
    cacGlobal: number,
    churnMensal: number,
    totalAlunosAlvo: number
): FinancialResult => {
    const opexTotal = custosFixos + (custosVariáveisPorAluno * totalAlunosAlvo);
    const impostosTotais = opexTotal * (impostosPercentual / 100);

    // LTV Calculation (simplificado)
    // Assumindo um ARPU (receita média) base para o cálculo de indicadores
    const hypotheticalArpu = (opexTotal / totalAlunosAlvo) * 1.5;
    const ltv = hypotheticalArpu / (churnMensal / 100);
    const ltvCacRatio = ltv / cacGlobal;
    const paybackMonths = cacGlobal / (hypotheticalArpu - custosVariáveisPorAluno);

    // Sugestões de Preço
    const custoUnitárioBase = (opexTotal / totalAlunosAlvo) / (1 - (impostosPercentual / 100));

    return {
        opexTotal,
        impostosTotais,
        margemEbitda: 30, // Placeholder%
        breakEvenAlunos: Math.ceil(custosFixos / (hypotheticalArpu - custosVariáveisPorAluno)),
        cac: cacGlobal,
        ltv,
        ltvCacRatio,
        paybackMonths,
        sugestõesPreço: {
            mínimo: custoUnitárioBase * 1.05, // 5% margem segurança
            ideal: custoUnitárioBase * 1.4,   // 40% margem
            folgado: custoUnitárioBase * 1.8  // 80% margem
        }
    };
};
