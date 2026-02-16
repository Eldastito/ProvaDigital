-- ==============================================================================
-- MIGRATION: GLOBAL UUID UNIFICATION (20260216)
-- Descrição: Converte todas as PKs e FKs do formato TEXT para UUID.
-- ==============================================================================

BEGIN;

-- 0. Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FUNÇÃO AUXILIAR: Tentativa de conversão segura para UUID
CREATE OR REPLACE FUNCTION try_cast_uuid(p_val TEXT) 
RETURNS UUID AS $$
BEGIN
  RETURN p_val::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. TABELA DE MAPEAMENTO DE MOCKS (Para não perder integridade de dados antigos)
-- Se o ID não for um UUID válido (ex: 'sim_item_1'), geraremos um novo e guardaremos aqui.
CREATE TEMP TABLE id_conversion_map (
    old_id TEXT PRIMARY KEY,
    new_id UUID
);

-- ==============================================================================
-- ETAPA A: PREPARAÇÃO DE TABELAS PRINCIPAIS
-- ==============================================================================

-- Remover constraints que impedem alteração de tipo (ajustar nomes conforme seu banco real)
-- Nota: O PostgreSQL exige que as FKs sejam removidas antes de alterar o tipo da PK.

ALTER TABLE IF EXISTS public.item_versions DROP CONSTRAINT IF EXISTS item_versions_item_id_fkey;
ALTER TABLE IF EXISTS public.items DROP CONSTRAINT IF EXISTS items_current_version_id_fkey;
ALTER TABLE IF EXISTS public.exam_items DROP CONSTRAINT IF EXISTS exam_items_item_id_fkey;
ALTER TABLE IF EXISTS public.exam_items DROP CONSTRAINT IF EXISTS exam_items_exam_id_fkey;
ALTER TABLE IF EXISTS public.exams DROP CONSTRAINT IF EXISTS exams_id_fkey;
ALTER TABLE IF EXISTS public.exam_versions DROP CONSTRAINT IF EXISTS exam_versions_exam_id_fkey;
ALTER TABLE IF EXISTS public.marketplace_interactions DROP CONSTRAINT IF EXISTS marketplace_interactions_item_id_fkey;

-- ==============================================================================
-- ETAPA B: CONVERSÃO DA TABELA ITEMS
-- ==============================================================================

-- B1. Criar mapeamento para IDs que não são UUIDs
INSERT INTO id_conversion_map (old_id, new_id)
SELECT id, uuid_generate_v4()
FROM public.items
WHERE try_cast_uuid(id) IS NULL;

-- B2. Alterar IDs na tabela de Itens
-- Se for UUID válido, converte. Se não, pega do mapa.
UPDATE public.items 
SET id = (COALESCE(try_cast_uuid(id)::text, (SELECT new_id FROM id_conversion_map WHERE old_id = items.id)::text));

-- B3. Alterar tipo da coluna de fato
ALTER TABLE public.items 
ALTER COLUMN id TYPE UUID USING id::UUID;

-- ==============================================================================
-- ETAPA C: CONVERSÃO DA TABELA EXAMS
-- ==============================================================================

-- C1. Mapeamento
INSERT INTO id_conversion_map (old_id, new_id)
SELECT id, uuid_generate_v4()
FROM public.exams
WHERE try_cast_uuid(id) IS NULL
ON CONFLICT (old_id) DO NOTHING;

-- C2. Update IDs
UPDATE public.exams 
SET id = (COALESCE(try_cast_uuid(id)::text, (SELECT new_id FROM id_conversion_map WHERE old_id = exams.id)::text));

-- C3. Alter Type
ALTER TABLE public.exams 
ALTER COLUMN id TYPE UUID USING id::UUID;

-- ==============================================================================
-- ETAPA D: ATUALIZAÇÃO DE CHAVES ESTRANGEIRAS EM OUTRAS TABELAS
-- ==============================================================================

-- Item Versions
UPDATE public.item_versions 
SET item_id = (COALESCE(try_cast_uuid(item_id)::text, (SELECT new_id FROM id_conversion_map WHERE old_id = item_versions.item_id)::text));
ALTER TABLE public.item_versions ALTER COLUMN item_id TYPE UUID USING item_id::UUID;

-- Marketplace Interactions
UPDATE public.marketplace_interactions 
SET item_id = (COALESCE(try_cast_uuid(item_id)::text, (SELECT new_id FROM id_conversion_map WHERE old_id = marketplace_interactions.item_id)::text));
ALTER TABLE public.marketplace_interactions ALTER COLUMN item_id TYPE UUID USING item_id::UUID;

-- Exam Versions
UPDATE public.exam_versions 
SET exam_id = (COALESCE(try_cast_uuid(exam_id)::text, (SELECT new_id FROM id_conversion_map WHERE old_id = exam_versions.exam_id)::text));
ALTER TABLE public.exam_versions ALTER COLUMN exam_id TYPE UUID USING exam_id::UUID;

-- ==============================================================================
-- ETAPA E: RESTAURAR CONSTRAINTS E LIMPEZA
-- ==============================================================================

ALTER TABLE public.item_versions ADD CONSTRAINT item_versions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;
ALTER TABLE public.exams ADD CONSTRAINT exams_current_version_id_fkey FOREIGN KEY (current_version_id) REFERENCES public.item_versions(id); -- Se for UUID
ALTER TABLE public.exam_versions ADD CONSTRAINT exam_versions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;
ALTER TABLE public.marketplace_interactions ADD CONSTRAINT marketplace_interactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;

-- Atualizar colunas current_version_id no items se necessário
ALTER TABLE public.items ALTER COLUMN current_version_id TYPE UUID USING current_version_id::UUID;

DROP TABLE id_conversion_map;
DROP FUNCTION try_cast_uuid;

COMMIT;
