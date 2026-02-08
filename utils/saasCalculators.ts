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

export interface CostDetail {
    label: string;
    value: number;
    category: 'fixo' | 'variável' | 'patrimônio' | 'fiscal' | 'infra' | 'pessoas';
}

export interface Collaborator {
    id: string;
    cargo: string;
    salario: number;
    quantidade: number;
    beneficios: number;
}

export interface Infrastructure {
    luz: number;
    agua: number;
    internet: number;
    manutencao: number;
    seguros: number;
}

export interface SchoolProfile {
    id: string;
    nome: string;
    totalAlunos: number;
    turmas: number;
    mediaAlunosTurma: number;
}

export interface Vehicle {
    valor: number;
    tipo: 'aquisicao' | 'aluguel' | 'assinatura';
    seguro: number;
    manutencao: number;
}

export interface FinancialResult {
    opexTotal: number;
    impostosTotais: number;
    margemEbitda: number;
    ebitdaReal: number;
    margemLíquida: number;
    margemContribuição: number;
    breakEvenAlunos: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    paybackMonths: number;
    lucratividade: number;
    rentabilidade: number;
    roi: number;
    custosDetalhados: CostDetail[];
    patrimônioTotal: number;
    sugestõesPreço: {
        mínimo: number;
        ideal: number;
        folgado: number;
    };
    // Métricas Profissionais (C-Level)
    ruleOf40: number;
    magicNumber: number;
    burnMultiple: number;
    depreciaçãoMensal: number;
    valuationEstimado: number;
    capitalGiroNecessário: number;
    margemBrutaSaaS: number;
    taxaUtilizaçãoAtivos: number;
    // Detalhamento para Proposta
    combustívelFrequência: {
        diário: number;
        semanal: number;
        quinzenal: number;
        mensal: number;
    };
}

/**
 * Calcula KPIs de negócio e Raio-X Financeiro Detalhado.
 */
export const calculateBusinessMetrics = (
    colaboradores: Collaborator[],
    infra: Infrastructure,
    veiculo: Vehicle,
    patrimônioExtra: {
        computadores: number;
        infraestrutura: number;
    },
    custosVariáveis: {
        combustívelMensal: number;
        outrosPorAluno: number;
    },
    fiscal: {
        iss: number;
        pisCofins: number;
        encargosFolha: number;
    },
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
    // Defensive Check: Ensure colaboradores is an array
    const validColaboradores = Array.isArray(colaboradores) ? colaboradores : [];

    // 1. Consolidação de Folha e Pessoas
    const folhaBase = validColaboradores.reduce((acc, c) => acc + (c.salario * c.quantidade), 0);
    const beneficiosTotal = validColaboradores.reduce((acc, c) => acc + (c.beneficios * c.quantidade), 0);
    const encargosFolhaTotal = folhaBase * (fiscal.encargosFolha / 100);
    const custoPessoasTotal = folhaBase + encargosFolhaTotal + beneficiosTotal;

    // 2. Consolidação de Infraestrutura (OpEx Fixo)
    const custoInfraMensal = infra.luz + infra.agua + infra.internet + infra.manutencao + infra.seguros;

    // Tratamento do Veículo (OpEx se aluguel/assinatura)
    const custoVeiculoOpEx = veiculo.tipo !== 'aquisicao' ? veiculo.valor : 0;
    const custoVeiculoFixo = veiculo.seguro + veiculo.manutencao + custoVeiculoOpEx;

    const custoFixoTotal = custoPessoasTotal + custoInfraMensal + custoVeiculoFixo;

    // 3. Consolidação de Custos Variáveis (por aluno)
    const custoVariávelTotal = custosVariáveis.combustívelMensal + (custosVariáveis.outrosPorAluno * totalAlunosAlvo);
    const custoVariávelUnitário = totalAlunosAlvo > 0 ? custoVariávelTotal / totalAlunosAlvo : 0;

    // 4. Consolidação de Patrimônio (CapEx)
    // Tablets são calculados separadamente por necessidade real, mas aqui recebemos o valor total investido
    const valorTabletsTotal = 85000; // Mock ou derivado de SchoolProfile no futuro
    const valorVeiculoCapEx = veiculo.tipo === 'aquisicao' ? veiculo.valor : 0;
    const patrimônioTotal = valorTabletsTotal + valorVeiculoCapEx + patrimônioExtra.computadores + patrimônioExtra.infraestrutura;

    // 5. Receita e Preço de Proposta
    const impostosFaturamentoPercentual = fiscal.iss + fiscal.pisCofins;
    const custoUnitárioBase = totalAlunosAlvo > 0
        ? (custoFixoTotal / totalAlunosAlvo + custoVariávelUnitário) / (1 - (impostosFaturamentoPercentual / 100))
        : 0;

    const ticketMédio = ticketMédioManual || custoUnitárioBase * 1.4;
    const receitaTotal = ticketMédio * totalAlunosAlvo;

    // 6. Impostos e Lucro
    const impostosFaturamentoTotal = receitaTotal * (impostosFaturamentoPercentual / 100);
    const opexTotal = custoFixoTotal + custoVariávelTotal;

    const depreciaçãoMensal = patrimônioTotal / 36;
    const ebitdaReal = receitaTotal - opexTotal - impostosFaturamentoTotal;
    const lucroLíquido = ebitdaReal - depreciaçãoMensal;

    // 7. Margens e KPIs
    const margemEbitda = receitaTotal > 0 ? (ebitdaReal / receitaTotal) * 100 : 0;
    const margemLíquida = receitaTotal > 0 ? (lucroLíquido / receitaTotal) * 100 : 0;
    const margemContribuição = receitaTotal > 0 ? ((receitaTotal - custoVariávelTotal - impostosFaturamentoTotal) / receitaTotal) * 100 : 0;

    const roi = (lucroLíquido / (patrimônioTotal + cacGlobal)) * 100;
    const rentabilidade = (lucroLíquido / patrimônioTotal) * 100;

    const ltv = ticketMédio / (churnMensal / 100);
    const ltvCacRatio = ltv / cacGlobal;
    const paybackMonths = totalAlunosAlvo > 0 ? (cacGlobal + (patrimônioTotal / totalAlunosAlvo)) / (ticketMédio - custoVariávelUnitário) : 0;

    // 8. Métricas C-Level
    const crescimentoMensalProjetado = 15;
    const ruleOf40 = margemEbitda + (crescimentoMensalProjetado * 4);
    const netNewARR = (receitaTotal * 0.15) * 12;
    const smSpend = cacGlobal * (totalAlunosAlvo * 0.05);
    const magicNumber = smSpend > 0 ? netNewARR / smSpend : 0;
    const valuationEstimado = (receitaTotal * 12) * 5;
    const capitalGiroNecessário = opexTotal * 3;

    // 9. Quebra para Raio-X (DRE)
    const custosDetalhados: CostDetail[] = [
        { label: 'Pessoas (Folha + Encargos)', value: custoPessoasTotal, category: 'pessoas' },
        { label: 'Infraestrutura (Sede)', value: custoInfraMensal, category: 'infra' },
        { label: 'Veículo (Operação)', value: custoVeiculoFixo, category: 'variável' },
        { label: 'Cloud & SaaS', value: 800, category: 'fixo' }, // Mock para agora
        { label: 'Combustível', value: custosVariáveis.combustívelMensal, category: 'variável' },
        { label: 'Impostos (ISS/PIS)', value: impostosFaturamentoTotal, category: 'fiscal' },
        { label: 'Patrimônio (Total Ativos)', value: patrimônioTotal, category: 'patrimônio' }
    ];

    return {
        financial: {
            opexTotal,
            impostosTotais: impostosFaturamentoTotal + encargosFolhaTotal,
            ebitdaReal,
            margemEbitda,
            margemLíquida,
            margemContribuição,
            breakEvenAlunos: Math.ceil(custoFixoTotal / (ticketMédio - custoVariávelUnitário)),
            cac: cacGlobal,
            ltv,
            ltvCacRatio,
            paybackMonths,
            lucratividade: margemLíquida,
            rentabilidade,
            roi,
            custosDetalhados,
            patrimônioTotal,
            sugestõesPreço: {
                mínimo: custoUnitárioBase * 1.05,
                ideal: custoUnitárioBase * 1.4,
                folgado: custoUnitárioBase * 1.8
            },
            ruleOf40,
            magicNumber,
            burnMultiple: ebitdaReal < 0 ? Math.abs(ebitdaReal) / (netNewARR / 12) : 0,
            depreciaçãoMensal,
            valuationEstimado,
            capitalGiroNecessário,
            margemBrutaSaaS: 85,
            taxaUtilizaçãoAtivos: 92,
            combustívelFrequência: {
                diário: custosVariáveis.combustívelMensal / 30,
                semanal: custosVariáveis.combustívelMensal / 4,
                quinzenal: custosVariáveis.combustívelMensal / 2,
                mensal: custosVariáveis.combustívelMensal
            }
        },
        marketing: {
            ticketMédio,
            taxaConversão,
            marketShare: (totalAlunosAlvo / 10000000) * 100
        },
        customers: {
            nps: npsAlvo,
            índiceRecompra: 100 - churnMensal,
            churnRate: churnMensal
        },
        hr: {
            turnover: turnoverAlvo,
            absenteísmo: 0,
            roiTreinamento: 0
        }
    };
};

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
