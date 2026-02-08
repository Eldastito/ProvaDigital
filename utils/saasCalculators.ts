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
    margemEbitda: number; // EBITDA / Receita
    ebitdaReal: number;   // Lucro operacional antes de impostos
    margemLíquida: number; // Lucro líquido / Receita
    margemContribuição: number; // (Receita - Custos Variáveis) / Receita
    breakEvenAlunos: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    paybackMonths: number;
    lucratividade: number; // Lucro / Faturamento
    rentabilidade: number; // Lucro / Investimento Hardware
    roi: number;           // Retorno sobre investimento total
    sugestõesPreço: {
        mínimo: number;
        ideal: number;
        folgado: number;
    };
}

export interface SalesMarketingResult {
    ticketMédio: number;
    taxaConversão: number;
    marketShare: number;
}

export interface CustomerResult {
    nps: number;
    índiceRecompra: number;
    churnRate: number;
}

export interface HRResult {
    turnover: number;
    absenteísmo: number;
    roiTreinamento: number;
}

export interface OpsLogisticsResult extends LogisticsResult {
    otd: number; // On-Time Delivery %
    índiceRuptura: number;
    taxaRefugo: number;
}

/**
 * Calcula a logística de tablets baseada no cenário de reuso e maior turma.
 */
export const calculateLogistics = (
    maiorTurma: number,
    totalAlunos: number,
    diasSemana: number = 5,
    turmasPorDia: number = 6,
    otdAlvo: number = 98,
    rupturaAlvo: number = 2,
    refugoAlvo: number = 1
): OpsLogisticsResult => {
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
        configuraçãoSuporte: suporte,
        otd: otdAlvo,
        índiceRuptura: rupturaAlvo,
        taxaRefugo: refugoAlvo
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
    totalAlunosAlvo: number,
    taxaConversão: number = 10,
    npsAlvo: number = 75,
    turnoverAlvo: number = 5,
    ticketMédioManual?: number
): {
    financial: FinancialResult;
    marketing: SalesMarketingResult;
    customers: CustomerResult;
    hr: HRResult;
} => {
    // 1. Receita e Preço
    // Se não houver ticket médio manual, calculamos o "Ideal" para as métricas base
    const custoUnitárioBase = (custosFixos / totalAlunosAlvo + custosVariáveisPorAluno) / (1 - (impostosPercentual / 100));
    const ticketMédio = ticketMédioManual || custoUnitárioBase * 1.4;
    const receitaTotal = ticketMédio * totalAlunosAlvo;

    // 2. Custos e Impostos
    const custosVariáveisTotais = custosVariáveisPorAluno * totalAlunosAlvo;
    const opexTotal = custosFixos + custosVariáveisTotais;
    const impostosTotais = receitaTotal * (impostosPercentual / 100);

    // 3. Lucro e Margens
    const ebitdaReal = receitaTotal - opexTotal - impostosTotais;
    const lucroLíquido = ebitdaReal; // Simplificado (sem depreciação/juros no simulador)
    const margemEbitda = (ebitdaReal / receitaTotal) * 100;
    const margemLíquida = (lucroLíquido / receitaTotal) * 100;
    const margemContribuição = ((receitaTotal - custosVariáveisTotais - impostosTotais) / receitaTotal) * 100;

    // 4. ROI e Investimento
    const roi = (lucroLíquido / (investimentoHardware + cacGlobal)) * 100;
    const rentabilidade = (lucroLíquido / investimentoHardware) * 100;
    const lucratividade = (lucroLíquido / receitaTotal) * 100;

    // 5. SaaS KPIs
    const ltv = ticketMédio / (churnMensal / 100);
    const ltvCacRatio = ltv / cacGlobal;
    const paybackMonths = cacGlobal / (ticketMédio - custosVariáveisPorAluno);

    return {
        financial: {
            opexTotal,
            impostosTotais,
            ebitdaReal,
            margemEbitda,
            margemLíquida,
            margemContribuição,
            breakEvenAlunos: Math.ceil(custosFixos / (ticketMédio - custosVariáveisPorAluno)),
            cac: cacGlobal,
            ltv,
            ltvCacRatio,
            paybackMonths,
            lucratividade,
            rentabilidade,
            roi,
            sugestõesPreço: {
                mínimo: custoUnitárioBase * 1.05,
                ideal: custoUnitárioBase * 1.4,
                folgado: custoUnitárioBase * 1.8
            }
        },
        marketing: {
            ticketMédio,
            taxaConversão,
            marketShare: (totalAlunosAlvo / 10000000) * 100 // Ex: share sobre 10M de alunos no Brasil
        },
        customers: {
            nps: npsAlvo,
            índiceRecompra: 100 - churnMensal,
            churnRate: churnMensal
        },
        hr: {
            turnover: turnoverAlvo,
            absenteísmo: 2, // Default 2%
            roiTreinamento: 150 // Default 150%
        }
    };
};
