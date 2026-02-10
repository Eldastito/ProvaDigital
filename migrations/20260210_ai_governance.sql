-- Migração: Governança de IA e Model Risk Management (Fase VI)
-- Data: 2026-02-10

-- 1. Rastreabilidade de Origem e IA nos Itens
ALTER TABLE items ADD COLUMN IF NOT EXISTS ai_model_id TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS ai_prompt_version TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS ai_generation_settings JSONB DEFAULT '{}';
ALTER TABLE items ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id);
ALTER TABLE items ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 2. Tabela de Logs de Governança de IA (Auditoria de Custo e Risco)
CREATE TABLE IF NOT EXISTS ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT REFERENCES items(id),
    prompt_text TEXT NOT NULL,
    response_raw JSONB,
    token_usage_prompt INTEGER,
    token_usage_completion INTEGER,
    latency_ms INTEGER,
    model_id TEXT NOT NULL,
    prompt_version TEXT,
    actor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para Auditoria
CREATE INDEX IF NOT EXISTS idx_items_ai_model ON items(ai_model_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_item_id ON ai_generation_logs(item_id);

-- 4. Comentários
COMMENT ON TABLE ai_generation_logs IS 'Logs detalhados de geração via IA para auditoria financeira e de viés (Plano 2031)';
COMMENT ON COLUMN items.ai_prompt_version IS 'Versão do prompt utilizada para gerar este item (Model Risk Management)';
COMMENT ON COLUMN items.reviewer_id IS 'ID do especialista humano que validou a qualidade do item gerado por IA';
