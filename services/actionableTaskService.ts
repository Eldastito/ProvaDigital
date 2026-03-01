import { ActionableTask } from '../store/slices/taskSlice';
import { AIInsight } from '../utils/saasCalculators';
import { SkillInsight } from './PredictivePedagogicalService';

/**
 * Converte um insight estratégico em uma tarefa acionável.
 */
export const mapStrategicInsightToTask = (insight: AIInsight): Omit<ActionableTask, 'id' | 'createdAt' | 'status'> => {
    return {
        title: insight.title,
        description: insight.message,
        type: 'STRATEGIC',
        priority: insight.impact === 'Urgente' ? 'URGENT' : (insight.impact === 'Alto' ? 'HIGH' : 'MEDIUM'),
        actionLabel: insight.action,
        actionRoute: insight.targetPath,
        metadata: { originalId: insight.id }
    };
};

/**
 * Converte um insight pedagógico em uma tarefa acionável.
 */
export const mapPedagogicalInsightToTask = (insight: SkillInsight, examId?: string): Omit<ActionableTask, 'id' | 'createdAt' | 'status'> => {
    return {
        title: insight.title,
        description: insight.message,
        type: 'PEDAGOGICAL',
        priority: insight.type === 'DANGER' ? 'HIGH' : (insight.type === 'WARNING' ? 'MEDIUM' : 'LOW'),
        actionLabel: insight.actionLabel || 'Resolver',
        actionRoute: examId ? `/exams/edit/${examId}` : undefined,
        metadata: { actionType: insight.actionType }
    };
};
