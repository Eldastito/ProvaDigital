-- ============================================
-- SCHEMA PARA SISTEMA DE ALERTAS DE RISCO
-- Compatível com IDs do tipo TEXT (atual)
-- ============================================

-- 1. Garante que a tabela public.users tenha a coluna children_ids (necessária para Pais)
-- ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS children_ids TEXT[] DEFAULT '{}'; -- Bloqueado pelo Supabase
CREATE TABLE IF NOT EXISTS public.users (id TEXT PRIMARY KEY REFERENCES auth.users(id)); -- Garante que a tabela existe
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS children_ids TEXT[] DEFAULT '{}';

-- 2. Tabela de Alertas de Risco
CREATE TABLE IF NOT EXISTS risk_alerts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  school_id TEXT,
  class_id TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  interventions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'IGNORED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  notes TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_risk_alerts_student ON risk_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON risk_alerts(status);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_level ON risk_alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_created ON risk_alerts(created_at DESC);

-- 2. Tabela de Intervenções Realizadas
CREATE TABLE IF NOT EXISTS interventions (
  id TEXT PRIMARY KEY,
  alert_id TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  responsible_id TEXT NOT NULL,
  responsible_name TEXT,
  target TEXT NOT NULL CHECK (target IN ('PARENT', 'TEACHER', 'COORDINATOR', 'PSYCHOLOGIST', 'STUDENT')),
  priority TEXT NOT NULL CHECK (priority IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),
  scheduled_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_interventions_alert ON interventions(alert_id);
CREATE INDEX IF NOT EXISTS idx_interventions_responsible ON interventions(responsible_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_scheduled ON interventions(scheduled_date);

-- 3. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('RISK_ALERT', 'INTERVENTION_DUE', 'INTERVENTION_COMPLETED', 'SYSTEM')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 4. Tabela de Histórico de Scores (para tracking de evolução)
CREATE TABLE IF NOT EXISTS risk_score_history (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_risk_history_student ON risk_score_history(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_history_measured ON risk_score_history(measured_at DESC);

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_score_history ENABLE ROW LEVEL SECURITY;

-- Política: Coordenadores e Diretores veem alertas da sua escola
CREATE POLICY "Coordenadores veem alertas da escola" ON risk_alerts
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()::text
    )
  );

-- Política: Pais veem apenas alertas dos seus filhos
CREATE POLICY "Pais veem alertas dos filhos" ON risk_alerts
  FOR SELECT
  USING (
    student_id IN (
      SELECT unnest(children_ids) FROM users WHERE id = auth.uid()::text
    )
  );

-- Política: Usuários veem suas próprias notificações
CREATE POLICY "Usuários veem suas notificações" ON notifications
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Política: Usuários podem marcar suas notificações como lidas
CREATE POLICY "Usuários atualizam suas notificações" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid()::text);

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para limpar notificações antigas (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE read = TRUE
    AND read_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Função para obter contagem de alertas ativos por escola
CREATE OR REPLACE FUNCTION get_active_alerts_count(p_school_id TEXT)
RETURNS TABLE(
  high_count BIGINT,
  medium_count BIGINT,
  low_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE risk_level = 'HIGH') as high_count,
    COUNT(*) FILTER (WHERE risk_level = 'MEDIUM') as medium_count,
    COUNT(*) FILTER (WHERE risk_level = 'LOW') as low_count,
    COUNT(*) as total_count
  FROM risk_alerts
  WHERE school_id = p_school_id
    AND status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- ============================================

-- INSERT INTO risk_alerts (id, student_id, school_id, risk_level, risk_score, factors, status)
-- VALUES (
--   'alert-001',
--   'student-123',
--   'school-001',
--   'HIGH',
--   85,
--   '[{"name": "Baixa Frequência", "severity": "HIGH", "value": "65%"}]'::jsonb,
--   'ACTIVE'
-- );

COMMIT;
