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
    },
    // 3. C-Level & Efficiency
    'ruleOf40': {
        id: 'ruleOf40',
        label: 'Rule of 40',
        description: 'Soma da taxa de crescimento e da margem de lucro.',
        whyItMatters: 'É o "padrão ouro" de investidores. Se a soma for > 40%, o negócio está em um equilíbrio perfeito entre crescimento e rentabilidade.',
        howToImprove: ['Aumentar retenção de churn', 'Escalar sem aumentar o custo fixo proporcionalmente']
    },
    'magicNumber': {
        id: 'magicNumber',
        label: 'Magic Number',
        description: 'Eficiência de vendas: ARR novo gerado dividido pelo gasto em vendas/mkt.',
        whyItMatters: 'Se for > 0.75, seu motor de vendas está azeitado e você deve acelerar o investimento. Abaixo de 0.5, há ineficiência.',
        howToImprove: ['Melhorar taxa de conversão do funil', 'Reduzir o CAC por canal']
    },
    'valuation': {
        id: 'valuation',
        label: 'Valuation Estimado',
        description: 'Valor de mercado estimado do negócio baseado em múltiplos de receita.',
        whyItMatters: 'Ajuda a entender o valor patrimonial que você está construindo. Crucial para futuras captações ou venda.',
        howToImprove: ['Aumentar o faturamento recorrente (ARR)', 'Melhorar a margem líquida']
    }
};
