-- Migração: Governança Psicométrica Avançada (Equating & Comitê)
-- Data: 2026-02-10

-- 1. Evolução da Tabela Items
ALTER TABLE items ADD COLUMN IF NOT EXISTS scale_version TEXT DEFAULT 'v1';
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_anchor BOOLEAN DEFAULT false;

-- 2. Evolução da Tabela Item Pools
-- Primeiro criamos a tabela se não existir
CREATE TABLE IF NOT EXISTS item_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Primeiro criamos o tipo se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pool_status') THEN
        CREATE TYPE pool_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'ARCHIVED');
    END IF;
END $$;

ALTER TABLE item_pools ADD COLUMN IF NOT EXISTS status pool_status DEFAULT 'DRAFT';
ALTER TABLE item_pools ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';
ALTER TABLE item_pools ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0;

-- 3. Índices para performance em sessões adaptativas
CREATE INDEX IF NOT EXISTS idx_items_scale_version ON items(scale_version);
CREATE INDEX IF NOT EXISTS idx_items_is_anchor ON items(is_anchor) WHERE is_anchor = true;

COMMENT ON COLUMN items.scale_version IS 'Versão da escala de parâmetros TRI (suporte a Equating)';
COMMENT ON COLUMN items.is_anchor IS 'Define se o item é usado como âncora para vinculação de escalas';
COMMENT ON COLUMN item_pools.status IS 'Status de governança: apenas APPROVED pode ser usado em produção';
