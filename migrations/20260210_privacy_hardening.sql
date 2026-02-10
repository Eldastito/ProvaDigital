-- Migração: Fortalecimento de Privacidade e Auditoria LGPD (Fase IX)

-- 1. Tabela de Logs de Acesso a Dados Sensíveis
CREATE TABLE IF NOT EXISTS privacy_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    target_user_id UUID NOT NULL,
    data_category TEXT CHECK (data_category IN ('ACADEMIC', 'PERSONAL', 'PSYCHOMETRIC')),
    reason TEXT NOT NULL,
    access_timestamp TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

-- Habilitar RLS nos logs de privacidade (apenas super_admins podem ver)
ALTER TABLE privacy_access_logs ENABLE ROW LEVEL SECURITY;

-- 2. Política de Retenção de Dados (Data Purge)
-- Função para limpar logs operacionais antigos (ex: telemetria > 180 dias)
CREATE OR REPLACE FUNCTION purge_old_telemetry()
RETURNS void AS $$
BEGIN
    DELETE FROM operational_telemetry
    WHERE created_at < NOW() - INTERVAL '180 days';
    
    INSERT INTO audit_logs (action, table_name, metadata)
    VALUES ('DATA_PURGE', 'operational_telemetry', '{"reason": "Retention Policy compliance"}');
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger/Cron Simulada (Para o exemplo, apenas a função está definida)
-- Em produção, isso seria agendado via pg_cron ou cron job externo.

COMMENT ON TABLE privacy_access_logs IS 'Trilha forense de acesso a dados pessoais sob regime LGPD.';
