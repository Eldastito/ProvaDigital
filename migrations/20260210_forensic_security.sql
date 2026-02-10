-- Migração: Segurança, Integridade Forense e Cadeia de Custódia (Fase IV)
-- Data: 2026-02-10

-- 1. Integridade de Resultados
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS digital_signature TEXT;
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS signature_version TEXT DEFAULT 'v1';
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 2. Trilha Forense Imutável (Caixa-Preta)
CREATE TABLE IF NOT EXISTS forensic_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    entity_type TEXT,
    entity_id UUID,
    actor_id UUID REFERENCES auth.users(id),
    client_context JSONB, -- IP, User-Agent, etc.
    payload_hash TEXT NOT NULL, -- Integridade do payload
    previous_log_hash TEXT, -- Encadeamento (Hash-chaining básico)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Políticas de Imutabilidade (PostgreSQL Trigger)
-- Impede que logs forenses sejam deletados ou alterados (WORM - Write Once Read Many)
CREATE OR REPLACE FUNCTION protect_forensic_logs()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Operação não permitida em forensic_logs (Tabela Imutável)';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_forensic_logs ON forensic_logs;
CREATE TRIGGER trg_immutable_forensic_logs
BEFORE UPDATE OR DELETE ON forensic_logs
FOR EACH ROW EXECUTE FUNCTION protect_forensic_logs();

-- 4. Comentários para Auditoria
COMMENT ON TABLE forensic_logs IS 'Trilha forense imutável para auditoria de segurança (Plano 2031)';
COMMENT ON COLUMN exam_results.digital_signature IS 'Hash de assinatura que garante a integridade da evidência de aprendizagem';
