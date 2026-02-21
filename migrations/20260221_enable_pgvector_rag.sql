-- ==============================================================================
-- MIGRATION: 20260221_enable_pgvector_rag.sql
-- DESCRIÇÃO: Ativa a extensão pgvector e cria o Repositório RAG do ExamePad
-- ==============================================================================

-- 1. Ativar a extensão de vetor matemáticos do PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Criar a Tabela do Cofre de Conhecimento (Knowledge Base RAG)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    title TEXT NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    embedding VECTOR(768), -- O modelo text-embedding-004 do Google usa 768 dimensões
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar a Função Principal de Busca Semântica (RPC)
-- Esta função será chamada pelo TypeScript para encontrar os textos mais relevantes
CREATE OR REPLACE FUNCTION public.match_knowledge(
    query_embedding VECTOR(768),
    match_threshold FLOAT,
    match_count INT,
    filter_tenant TEXT
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.content,
        kb.metadata,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM public.knowledge_base kb
    WHERE kb.tenant_id = filter_tenant
      AND 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 4. Otimização de Busca Vetorial (Índice HNSW para performance em alta escala)
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx 
ON public.knowledge_base 
USING hnsw (embedding vector_cosine_ops);

-- 5. Segurança do Tenant (RLS)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select knowledge to same tenant"
    ON public.knowledge_base FOR SELECT
    USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id' OR tenant_id = 'SYSTEM');

CREATE POLICY "Allow insert knowledge to tenant admin"
    ON public.knowledge_base FOR INSERT
    WITH CHECK (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id' OR tenant_id = 'SYSTEM');

CREATE POLICY "Allow delete knowledge to tenant admin"
    ON public.knowledge_base FOR DELETE
    USING (tenant_id = current_setting('request.jwt.claims', true)::json->>'tenant_id' OR tenant_id = 'SYSTEM');

-- NOTA: O modelo Gemini (text-embedding-004) exige 768 dimensões para os vetores.
-- Atualizar o schema cache
NOTIFY pgrst, 'reload schema';

DO $$ BEGIN RAISE NOTICE 'RAG Infrastructure with pgvector applied successfully.'; END $$;
