// Adicionar ao arquivo geminiService.ts

import { MaterialSource } from '../modules/builder/components/MaterialUploader';
import { processFile } from './fileProcessing';

/**
 * Gera questões a partir de material enviado (PDF, DOCX, imagem, etc.)
 */
export async function generateFromMaterial(
    material: MaterialSource,
    config: {
        quantity: number;
        subject: string;
        type: QuestionType;
        difficulty: DifficultyLevel;
        topic?: string;
        bnccCodes?: string[];
    }
): Promise<any> {
    try {
        // Processar arquivo para extrair texto
        const { extractedText, totalPages } = await processFile(material);

        // Criar prompt específico para geração a partir de material
        const materialPrompt = `
FONTE DO MATERIAL:
- Arquivo: ${material.fileName}
- Tipo: ${material.type.toUpperCase()}
${totalPages ? `- Total de Páginas: ${totalPages}` : ''}
${material.pageRange ? `- Páginas Selecionadas: ${material.pageRange.start} a ${material.pageRange.end}` : ''}

CONTEÚDO EXTRAÍDO:
${extractedText.substring(0, 12000)}

IMPORTANTE: 
- Use APENAS o conteúdo acima como base para as questões
- Cite trechos específicos do material quando relevante
- NÃO invente informações que não estejam no material
- Se o material for insuficiente, indique isso na justificativa

${config.topic ? `TEMA ESPECÍFICO: ${config.topic}` : ''}
${config.bnccCodes && config.bnccCodes.length > 0 ? `CÓDIGOS BNCC: ${config.bnccCodes.join(', ')}` : ''}
        `.trim();

        // Usar a função existente de geração, mas com o contexto do material
        const result = await generateQuestionsFromText(
            config.quantity,
            config.subject,
            config.type,
            config.difficulty,
            materialPrompt
        );

        // Adicionar metadados de fonte ao resultado
        if (result.questions) {
            result.questions = result.questions.map((q: any) => ({
                ...q,
                metadata: {
                    source: {
                        type: material.type,
                        fileName: material.fileName,
                        uploadedAt: material.uploadedAt,
                        pageRange: material.pageRange,
                        extractedContext: extractedText.substring(0, 500) + '...'
                    },
                    generatedAt: new Date(),
                    aiModel: DEFAULT_MODEL,
                    promptVersion: PROMPT_VERSION
                }
            }));
        }

        return result;
    } catch (error) {
        console.error('Erro ao gerar questões do material:', error);
        throw new Error('Erro ao gerar questões a partir do material enviado');
    }
}
