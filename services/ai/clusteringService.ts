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

// --- TF-IDF & CLUSTERING UTILS ---

/**
 * Tokeniza e limpa o texto (removes stopwords simples e pontuação)
 */
const tokenize = (text: string): string[] => {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2); // Ignora palavras muito curtas
};

/**
 * Calcula a similaridade de cosseno entre dois vetores
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
};


/**
 * Serviço de Clusterização de Respostas (TF-IDF Real).
 * Executa agrupamento baseado em similaridade de texto no navegador.
 */
export const ClusteringService = {

    /**
     * Agrupa respostas dissertativas semelhantes.
     */
    clusterAnswers: async (answers: StudentAnswer[]): Promise<AnswerCluster[]> => {
        // Filtrar apenas respostas com texto válido
        const validAnswers = answers.filter(a => a.text && a.text.trim().length > 0);

        if (validAnswers.length === 0) return [];

        // 1. Construir Vocabulário (Corpus)
        const docs = validAnswers.map(a => tokenize(a.text!));
        const vocabulary = Array.from(new Set(docs.flat())).sort();

        if (vocabulary.length < 5) return []; // Corpus muito pequeno

        // 2. Calcular vetores TF-IDF
        const vectors: number[][] = docs.map(doc => {
            return vocabulary.map(term => {
                // TF: Term Frequency
                const tf = doc.filter(t => t === term).length / doc.length;

                // IDF: Inverse Document Frequency
                const docsWithTerm = docs.filter(d => d.includes(term)).length;
                const idf = Math.log(docs.length / (1 + docsWithTerm));

                return tf * idf;
            });
        });

        // 3. Clusterização Simples (Threshold-based)
        // Agrupa vetores que têm similaridade > 0.6
        const clusters: AnswerCluster[] = [];
        const processedIndices = new Set<number>();

        for (let i = 0; i < vectors.length; i++) {
            if (processedIndices.has(i)) continue;

            const currentClusterIndices = [i];
            processedIndices.add(i);

            for (let j = i + 1; j < vectors.length; j++) {
                if (processedIndices.has(j)) continue;

                const similarity = cosineSimilarity(vectors[i], vectors[j]);
                if (similarity > 0.5) { // Threshold de similaridade
                    currentClusterIndices.push(j);
                    processedIndices.add(j);
                }
            }

            // Criar cluster se tiver pelo menos 1 item (agora permitimos grupos unitários ou >1)
            // Para "Batch Grading", idealmente queremos grupos > 1, mas vamos retornar todos.
            if (currentClusterIndices.length >= 1) {
                const clusterAnswers = currentClusterIndices.map(idx => validAnswers[idx]);
                const representativeText = clusterAnswers[0].text?.substring(0, 50) + "...";

                // Tenta extrair palavras-chave do cluster para o Label
                // (Termos com maior TF-IDF médio no cluster)
                const clusterLabel = `Grupo ${clusters.length + 1}: "${representativeText}"`;

                // Calculate Average Internal Similarity
                let sumSim = 0;
                let pairCount = 0;

                if (currentClusterIndices.length > 1) {
                    for (let x = 0; x < currentClusterIndices.length; x++) {
                        for (let y = x + 1; y < currentClusterIndices.length; y++) {
                            sumSim += cosineSimilarity(
                                vectors[currentClusterIndices[x]],
                                vectors[currentClusterIndices[y]]
                            );
                            pairCount++;
                        }
                    }
                }

                const avgSim = pairCount > 0 ? sumSim / pairCount : 1.0;
                const isSuspect = pairCount > 0 && avgSim > 0.90; // > 90% similarity indicates copy-paste

                clusters.push({
                    id: uuidv4(),
                    label: clusterLabel,
                    summary: `Agrupamento de ${currentClusterIndices.length} respostas similares.`,
                    answerIds: clusterAnswers.map(a => a.itemId), // Note: Should satisfy AnswerCluster type
                    confidence: 0.85,
                    suggestedGrade: 0,
                    avgSimilarity: avgSim,
                    isPlagiarismSuspect: isSuspect
                });
            }
        }

        return clusters.sort((a, b) => b.answerIds.length - a.answerIds.length);
    }
};
