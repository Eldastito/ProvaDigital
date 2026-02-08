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
export interface AIInsight {
    id: string;
    type: 'critical' | 'opportunity' | 'info';
    title: string;
    message: string;
    impact: string;
    action: string;
    targetPath?: string; // Novo: Caminho para navegação
}

/**
 * Gera insights estratégicos baseados nos KPIs calculados.
 * Utiliza heurísticas de negócio para identificar riscos e oportunidades.
 */
export const generateAIInsights = (
    metrics: {
        financial: FinancialResult;
        marketing: SalesMarketingResult;
        customers: CustomerResult;
        hr: HRResult;
    },
    ops: OpsLogisticsResult
): AIInsight[] => {
    const insights: AIInsight[] = [];

    // 1. Insights Financeiros
    if (metrics.financial.ltvCacRatio < 3) {
        insights.push({
            id: 'ltv-cac-low',
            type: 'critical',
            title: 'Eficiência de Aquisição Baixa',
            message: `Sua relação LTV/CAC está em ${metrics.financial.ltvCacRatio.toFixed(1)}x. O benchmark ideal para SaaS é > 3.0x.`,
            impact: 'Risco de insustentabilidade a longo prazo.',
            action: 'Analisar Métricas Globais',
            targetPath: '/admin/metrics'
        });
    }

    if (metrics.financial.paybackMonths > 12) {
        insights.push({
            id: 'payback-high',
            type: 'opportunity',
            title: 'Payback Prolongado',
            message: `O tempo de recuperação do CAC é de ${metrics.financial.paybackMonths.toFixed(1)} meses.`,
            impact: 'Ciclo de caixa pressionado.',
            action: 'Otimizar Fluxo de Caixa',
            targetPath: '/admin/metrics'
        });
    }

    // 2. Insights de Operações & Logística
    if (ops.taxaRefugo > 3) {
        insights.push({
            id: 'waste-high',
            type: 'critical',
            title: 'Desperdício Operacional Elevado',
            message: `A taxa de refugo/dano está em ${ops.taxaRefugo}%, acima do limite de tolerância de 2%.`,
            impact: 'Erosão da margem líquida por perda de hardware.',
            action: 'Ver Relatório de Perdas',
            targetPath: '/admin/saas'
        });
    }

    // 3. Insights de RH (Informação)
    if (metrics.hr.turnover > 7) {
        insights.push({
            id: 'turnover-risk',
            type: 'info',
            title: 'Instabilidade de Capital Humano',
            message: `Turnover mensal de ${metrics.hr.turnover}% detectado.`,
            impact: 'Perda de conhecimento técnico e custo alto de re-treinamento.',
            action: 'Analisar Retenção',
            targetPath: '/admin/saas'
        });
    }

    // 4. Insights de Clientes (Churn & Upsell)
    if (metrics.customers.churnRate > 3) {
        insights.push({
            id: 'churn-burn',
            type: 'critical',
            title: 'Alerta de Evasão (Churn)',
            message: `A taxa de cancelamento está em ${metrics.customers.churnRate}%.`,
            impact: `Perda de R$ ${(metrics.financial.opexTotal * (metrics.customers.churnRate / 100)).toLocaleString('pt-BR')} em MRR.`,
            action: 'Gerenciar Clientes em Risco',
            targetPath: '/admin/tenants'
        });
    }

    // NOVO: Upsell Predictor (IA Preditiva)
    const criticalCapacityTenants = 2; // Mock: prefeituras perto do limite
    if (criticalCapacityTenants > 0) {
        insights.push({
            id: 'upsell-predict',
            type: 'opportunity',
            title: 'Oportunidade de Upsell Preditivo',
            message: `${criticalCapacityTenants} prefeituras atingiram 90% do limite de alunos contratados.`,
            impact: 'Potencial de expansão imediata de faturamento.',
            action: 'Enviar Proposta de Expansão',
            targetPath: '/admin/tenants'
        });
    }

    // NOVO: ROI Report (IA Justificativa de Valor)
    if (metrics.customers.nps > 80) {
        insights.push({
            id: 'roi-storytelling',
            type: 'opportunity',
            title: 'Gerador de ROI para Renovação',
            message: `NPS excepcional (${metrics.customers.nps}). A economia de papel estimada na rede é de 85%.`,
            impact: 'Facilita a renovação de contratos públicos.',
            action: 'Gerar Relatório de Impacto',
            targetPath: '/admin/metrics'
        });
    }

    return insights;
};
