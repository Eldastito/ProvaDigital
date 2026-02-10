-- Migração: Acessibilidade e Inclusão 360° (Fase V)
-- Data: 2026-02-10

-- 1. Expansão de Metadados de Itens
ALTER TABLE items ADD COLUMN IF NOT EXISTS accessibility_metadata JSONB DEFAULT '{}';
ALTER TABLE items ADD COLUMN IF NOT EXISTS has_libras BOOLEAN DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS has_audio_description BOOLEAN DEFAULT false;

-- 2. Índices para busca de itens inclusivos
CREATE INDEX IF NOT EXISTS idx_items_has_libras ON items(has_libras) WHERE has_libras = true;
CREATE INDEX IF NOT EXISTS idx_items_accessibility_metadata ON items USING gin(accessibility_metadata);

-- 3. Comentários
COMMENT ON COLUMN items.accessibility_metadata IS 'Metadados WCAG, alt-text e configurações de acessibilidade granular';
COMMENT ON COLUMN items.has_libras IS 'Flag de disponibilidade de tradução para Libras';
COMMENT ON COLUMN items.has_audio_description IS 'Flag de disponibilidade de áudio-descrição para cegos';
