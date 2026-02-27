import { AIInsight } from '../utils/saasCalculators';
import { searchKnowledgeBase } from './geminiService';

/**
 * Strategic Advisor Skill
 * Generates high-level management insights by crossing financial and pedagogical KPIs.
 */
export const getStrategicInsights = async (tenantId: string): Promise<AIInsight[]> => {
    // RAG Phase: Fetch strategic planning rules or budget constraints
    const ragContext = await searchKnowledgeBase("planejamento estratégico metas educacionais orçamento prefeitura", tenantId, 2);

    // In a real scenario, this would fetch data from DB
    // Here we provide high-value strategic mock data for demonstration

    const insights: AIInsight[] = [
        {
            id: 'strat-1',
            type: 'critical',
            title: 'ROI Pedagógico em Risco',
            message: 'A escola "Machado de Assis" possui o maior custo por aluno (R$ 450/mês) mas apresenta o menor IDG (Índice de Desempenho Global) da rede (5.2).',
            impact: 'Alto',
            action: 'Auditar Alocação',
            targetPath: '/admin/schools/roi'
        },
        {
            id: 'strat-2',
            type: 'opportunity',
            title: 'Otimização de Licenças',
            message: 'Detectamos 15% de licenças subutilizadas no turno da noite. Converter para modelo "Pay-per-Exam" pode economizar R$ 12k/trimestre.',
            impact: 'Médio',
            action: 'Ajustar Contrato',
            targetPath: '/admin/billing'
        },
        {
            id: 'strat-3',
            type: 'info',
            title: 'Preditivo de Evasão',
            message: 'A Skill de IA identificou um padrão de queda de 20% no engajamento na Turma 8B. Risco de evasão aumentou para 12%.',
            impact: 'Urgente',
            action: 'Ver Detalhes',
            targetPath: '/admin/analytics/risk'
        }
    ];

    if (ragContext) {
        insights.push({
            id: 'strat-rag',
            type: 'info',
            title: 'Diretriz de Planejamento',
            message: 'Detectamos alinhamento parcial com as metas de economia indexadas no Knowledge Vault.',
            impact: 'Médio',
            action: 'Ver Documento',
            targetPath: '/admin/docs'
        });
    }

    return insights;
};
