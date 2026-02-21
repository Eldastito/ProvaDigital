import { supabase } from './supabaseClient';
import { generateDocEmbedding } from './geminiService';

/**
 * Serviço Temporário/Administrativo para testar e popular a Base de Conhecimento RAG.
 * Na versão final, isso será acionado por um Form de Upload de PDF pelo Diretor.
 */
export const ragSeederService = {

    /**
     * Fatiamento básico do texto (Chunking). 
     * Na vida real isso usaria LangChain ou quebras semânticas reais.
     */
    chunkText: (text: string, maxParagraphs: number = 2): string[] => {
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 20); // Ignora quebras vazias
        const chunks: string[] = [];

        for (let i = 0; i < paragraphs.length; i += maxParagraphs) {
            chunks.push(paragraphs.slice(i, i + maxParagraphs).join('\n\n'));
        }

        return chunks;
    },

    /**
     * Processa um documento enorme, fatia, gera vetor matemáticos e salva no Supabase.
     */
    seedDocumentToVault: async (tenantId: string, title: string, fullText: string) => {
        try {
            console.log(`📚 Iniciando indexação RAG para: "${title}" no tenant: ${tenantId}`);

            // 1. Fatiar o texto
            const chunks = ragSeederService.chunkText(fullText);
            console.log(`✂️ Documento fatiado em ${chunks.length} blocos.`);

            let successCount = 0;

            // 2. Processar cada bloco
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];

                // Pede pro Google transformar o texto em Matemática (Vetor)
                const embedding = await generateDocEmbedding(chunk);

                if (!embedding) {
                    console.error(`❌ Falha ao gerar embedding para o bloco ${i}. Ignorando.`);
                    continue;
                }

                // 3. Salva no banco de dados
                const { error } = await supabase.from('knowledge_base').insert({
                    tenant_id: tenantId,
                    title: title,
                    chunk_index: i,
                    content: chunk,
                    embedding: embedding, // Isso entra na coluna VECTOR(768) do pgvector
                    metadata: { source: 'simulated_seeder', is_active: true }
                });

                if (error) {
                    console.error(`❌ Erro no banco de dados ao salvar bloco ${i}:`, error.message);
                } else {
                    successCount++;
                }
            }

            console.log(`✅ Indexação concluída! ${successCount}/${chunks.length} blocos salvos com sucesso.`);
            return true;

        } catch (err) {
            console.error('🔥 Erro Crítico no Seeder RAG:', err);
            return false;
        }
    },

    /**
     * Função Atalho para testar a Alucinação:
     * Dispara um regimento falso absurdo para provar que a IA vai segui-lo cegamente.
     */
    runHallucinationTestMock: async (tenantId: string = 'SYSTEM') => {
        const fakeTitle = "Regimento Interno do Planeta Tatooine";
        const fakeDocument = `
No Colégio Intergalático de Tatooine, as regras são muito diferentes das escolas na Terra.
Por causa do calor dos dois sóis, os alunos não podem usar uniforme azul. O uniforme oficial e obrigatório para todos os estudantes é a Túnica Laranja e o uso de chapéus de palha gigantes na sala de aula.

Caso um aluno tire nota baixa em Matemática ou Ciências Astronômicas, a punição disciplinar exigida pela Direção é que o aluno limpe os condutores de energia da espaçonave principal por dois dias consecutivos, sem direito a intervalo.

A escola não serve almoço comum. O lanche escolar servido no refeitório todas as quartas-feiras é porção de carne rústica de Bantha com suco azul alienígena. Se um estudante trouxer lanche de outro planeta, o inspetor escolar irá confiscar.

O Professor Mestre Jedi Yoda (quando presente) só aceita as respostas de provas se estiverem escritas de trás pra frente.
`;

        return await ragSeederService.seedDocumentToVault(tenantId, fakeTitle, fakeDocument);
    }
};
