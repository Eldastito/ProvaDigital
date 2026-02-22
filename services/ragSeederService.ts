import { supabase } from './supabaseClient';
import { generateDocEmbedding } from './geminiService';

/** Represents a document in the knowledge vault (for the UI listing) */
export interface KnowledgeDoc {
    title: string;
    chunkCount: number;
    updatedAt: string | null;
}

export const ragSeederService = {

    /**
     * Splits text into semantic chunks.
     */
    chunkText: (text: string, maxParagraphs: number = 2): string[] => {
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 20);
        const chunks: string[] = [];
        for (let i = 0; i < paragraphs.length; i += maxParagraphs) {
            chunks.push(paragraphs.slice(i, i + maxParagraphs).join('\n\n'));
        }
        // If no paragraph breaks, split by ~500 chars
        if (chunks.length === 0 && text.trim().length > 0) {
            for (let i = 0; i < text.length; i += 500) {
                chunks.push(text.slice(i, i + 500));
            }
        }
        return chunks;
    },

    /**
     * Generic: chunk, embed, and save any text document to the knowledge vault.
     */
    seedFromText: async (tenantId: string, title: string, fullText: string): Promise<boolean> => {
        try {
            console.log(`📚 Indexando RAG: "${title}" [tenant: ${tenantId}]`);
            const chunks = ragSeederService.chunkText(fullText);
            console.log(`✂️ ${chunks.length} blocos gerados.`);
            let successCount = 0;

            for (let i = 0; i < chunks.length; i++) {
                const embedding = await generateDocEmbedding(chunks[i]);
                if (!embedding) {
                    console.error(`❌ Embedding falhou no bloco ${i}`);
                    continue;
                }
                const { error } = await supabase.from('knowledge_base').insert({
                    tenant_id: tenantId,
                    title,
                    chunk_index: i,
                    content: chunks[i],
                    embedding,
                    metadata: { source: 'knowledge_vault', is_active: true }
                });
                if (error) {
                    console.error(`❌ DB error em bloco ${i}:`, error.message);
                } else {
                    successCount++;
                }
            }
            console.log(`✅ ${successCount}/${chunks.length} blocos salvos.`);
            return successCount > 0;
        } catch (err) {
            console.error('🔥 Erro crítico no RAG seeder:', err);
            return false;
        }
    },

    /**
     * Alias kept for backward compatibility with the test button.
     */
    seedDocumentToVault: async (tenantId: string, title: string, fullText: string): Promise<boolean> => {
        return ragSeederService.seedFromText(tenantId, title, fullText);
    },

    /**
     * Lists all unique documents in the knowledge vault for a given tenant.
     */
    listDocuments: async (tenantId: string): Promise<KnowledgeDoc[]> => {
        try {
            const { data, error } = await supabase
                .from('knowledge_base')
                .select('title, chunk_index, updated_at')
                .eq('tenant_id', tenantId)
                .order('title');

            if (error || !data) return [];

            // Group by title
            const map = new Map<string, { count: number; updatedAt: string | null }>();
            for (const row of data) {
                const existing = map.get(row.title);
                if (existing) {
                    existing.count++;
                } else {
                    map.set(row.title, { count: 1, updatedAt: row.updated_at || null });
                }
            }

            return Array.from(map.entries()).map(([title, { count, updatedAt }]) => ({
                title,
                chunkCount: count,
                updatedAt
            }));
        } catch (err) {
            console.error('Erro ao listar documentos RAG:', err);
            return [];
        }
    },

    /**
     * Deletes all chunks for a given document title in the tenant.
     */
    deleteDocument: async (tenantId: string, title: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('knowledge_base')
                .delete()
                .eq('tenant_id', tenantId)
                .eq('title', title);
            if (error) {
                console.error('Erro ao deletar documento RAG:', error.message);
                return false;
            }
            console.log(`🗑️ Documento "${title}" removido do Cofre.`);
            return true;
        } catch (err) {
            console.error('Erro crítico ao deletar documento RAG:', err);
            return false;
        }
    },

    /**
     * Dev/Demo only: seeds a fictional hallucination test document.
     */
    runHallucinationTestMock: async (tenantId: string = 'SYSTEM'): Promise<boolean> => {
        const fakeTitle = "Regimento Interno do Planeta Tatooine";
        const fakeDocument = `
No Colégio Intergalático de Tatooine, as regras são muito diferentes das escolas na Terra.
Por causa do calor dos dois sóis, os alunos não podem usar uniforme azul. O uniforme oficial e obrigatório para todos os estudantes é a Túnica Laranja e o uso de chapéus de palha gigantes na sala de aula.

Caso um aluno tire nota baixa em Matemática ou Ciências Astronômicas, a punição disciplinar exigida pela Direção é que o aluno limpe os condutores de energia da espaçonave principal por dois dias consecutivos, sem direito a intervalo.

A escola não serve almoço comum. O lanche escolar servido no refeitório todas as quartas-feiras é porção de carne rústica de Bantha com suco azul alienígena. Se um estudante trouxer lanche de outro planeta, o inspetor escolar irá confiscar.

O Professor Mestre Jedi Yoda (quando presente) só aceita as respostas de provas se estiverem escritas de trás pra frente.
`;
        return await ragSeederService.seedFromText(tenantId, fakeTitle, fakeDocument);
    }
};
