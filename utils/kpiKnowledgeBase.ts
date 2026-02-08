export interface KPIDefinition {
    id: string;
    label: string;
    description: string;
    whyItMatters: string;
    howToImprove: string[];
}

export const KPI_KNOWLEDGE_BASE: Record<string, KPIDefinition> = {
    // 1. Logística & Ops
    'tablets': {
        id: 'tablets',
        label: 'Necessidade de Tablets',
        description: 'Quantidade mínima de dispositivos para cobrir a maior turma agendada no período.',
        whyItMatters: 'O modelo SaaS se baseia no reuso. Não precisamos de 1 tablet por aluno da rede, mas sim 1 por aluno da maior turma simultânea.',
        howToImprove: ['Otimizar o escalonamento de provas', 'Reduzir o tamanho das turmas físicas']
    },
    'otd': {
        id: 'otd',
        label: 'OTD (On-Time Delivery)',
        description: 'Percentual de malas de provas que chegam às escolas antes do horário do exame.',
        whyItMatters: 'Garante a confiança da Secretaria e evita o cancelamento de aplicações de prova por falha logística.',
        howToImprove: ['Descentralizar centros de distribuição', 'Melhorar rastreamento em tempo real']
    },
    'refugo': {
        id: 'refugo',
        label: 'Taxa de Refugo/Danos',
        description: 'Percentual de hardware que volta danificado ou é perdido por mês.',
        whyItMatters: 'Hardware danificado é "CAPEX queimado". Impacta diretamente o lucro líquido.',
        howToImprove: ['Investir em cases antichoque premium', 'Treinar coordenadores de polo']
    },

    // 2. Financeiro
    'ebitda': {
        id: 'ebitda',
        label: 'EBITDA (Lucro Operacional)',
        description: 'Earnings Before Interest, Taxes, Depreciation, and Amortization.',
        whyItMatters: 'Mostra o quanto o negócio gera de caixa apenas com sua operação, sem contar impostos e investimentos.',
        howToImprove: ['Aumentar o Ticket Médio (ARPU)', 'Reduzir custos fixos operacionais']
    },
    'ltv-cac': {
        id: 'ltv-cac',
        label: 'Saúde LTV/CAC',
        description: 'Relação entre o valor que o cliente traz (LTV) e o custo para conquistá-lo (CAC).',
        whyItMatters: 'O benchmark ideal é > 3x. Se for menor, você gasta quase tudo o que ganha apenas para repor clientes.',
        howToImprove: ['Aumentar a retenção (reduzir Churn)', 'Otimizar investimentos em marketing']
    },
    'payback': {
        id: 'payback',
        label: 'CAC Payback',
        description: 'Tempo necessário para recuperar o dinheiro gasto para adquirir um cliente.',
        whyItMatters: 'SaaS com payback longo (> 12 meses) exigem muito capital de giro. Payback curto acelera o crescimento.',
        howToImprove: ['Cobrar taxas de setup', 'Focar em planos anuais antecipados']
    }
};
