import { StudentAnswer } from '../../types';
import { uuidv4 } from '../../utils/helpers';

export interface AnswerCluster {
    id: string;
    label: string;
    summary: string;
    answerIds: string[];
    suggestedGrade?: number;
    confidence: number;
    gradeReasoning?: string;
}

/**
 * Serviço de Clusterização de Respostas (Mock de IA).
 * Em produção, isso chamaria uma API Python (ex: scikit-learn/BERT) ou Gemini API.
 */
export const ClusteringService = {

    /**
     * Agrupa respostas dissertativas semelhantes.
     */
    clusterAnswers: async (answers: StudentAnswer[]): Promise<AnswerCluster[]> => {
        // Simulating API Latency
        await new Promise(resolve => setTimeout(resolve, 1500));

        const clusters: AnswerCluster[] = [];
        const answersToProcess = [...answers];

        // MOCK LOGIC: Agrupar por palavras-chave simples
        // Cenário: Pergunta sobre "Função das Mitocôndrias"

        // Cluster 1: Resposta Correta (Energia/ATP)
        const correctIds = answersToProcess
            .filter(a => a.text && (a.text.toLowerCase().includes('energia') || a.text.toLowerCase().includes('atp')))
            .map(a => a.itemId); // Note: StudentAnswer usually tracks itemId, we need a unique answer ID or studentId mapping.
        // For this mock, assuming one answer per student per item.

        if (correctIds.length > 0) {
            clusters.push({
                id: uuidv4(),
                label: 'Resposta Correta: Produção de Energia',
                summary: 'Alunos que mencionaram "energia" ou "ATP" corretamente.',
                answerIds: correctIds, // In real app, this would be answer instances IDs
                suggestedGrade: 10,
                confidence: 0.92,
                gradeReasoning: 'Contém as palavras-chave essenciais definidoras da função.'
            });
        }

        // Cluster 2: Resposta Parcial (Respiração)
        const partialIds = answersToProcess
            .filter(a => a.text && a.text.toLowerCase().includes('respiração') && !a.text.toLowerCase().includes('atp'))
            .map(a => a.itemId);

        if (partialIds.length > 0) {
            clusters.push({
                id: uuidv4(),
                label: 'Resposta Parcial: Respiração Celular',
                summary: 'Mencionaram o processo, mas não o produto final (ATP).',
                answerIds: partialIds,
                suggestedGrade: 7.5,
                confidence: 0.78,
                gradeReasoning: 'Conceito correto, mas incompleto.'
            });
        }

        // Cluster 3: Conceito Errado (Fotossíntese)
        const wrongIds = answersToProcess
            .filter(a => a.text && a.text.toLowerCase().includes('fotossíntese'))
            .map(a => a.itemId);

        if (wrongIds.length > 0) {
            clusters.push({
                id: uuidv4(),
                label: 'Conceito Errado: Confusão com Cloroplastos',
                summary: 'Alunos confundiram mitocôndria com cloroplasto.',
                answerIds: wrongIds,
                suggestedGrade: 2,
                confidence: 0.95,
                gradeReasoning: 'Erro conceitual grave.'
            });
        }

        // Fallback: Outros
        // ...

        // Se não tiver dados suficientes para o mock funcionar (ex: textos aleatórios), retorna um cluster genérico
        if (clusters.length === 0) {
            return [
                {
                    id: uuidv4(),
                    label: 'Respostas Genéricas',
                    summary: 'Grupo de respostas variadas sem padrão claro identificado.',
                    answerIds: answers.map(a => a.itemId),
                    confidence: 0.5
                }
            ];
        }

        return clusters;
    }
};
