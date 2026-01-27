/**
 * SPRINT 0 - Migrations MÍNIMAS (APENAS NOVAS TABELAS)
 * Execute este script no SQL Editor do Supabase
 */

-- ============================================
-- TABELA 1: exam_schedules
-- ============================================

CREATE TABLE IF NOT EXISTS exam_schedules (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  class_ids TEXT[] NOT NULL DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  mode TEXT NOT NULL DEFAULT 'ONLINE',
  config JSONB NOT NULL DEFAULT '{
    "proctoring": true,
    "shuffle": true,
    "timeLimit": 60,
    "allowReview": false
  }'::jsonb,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  tenant_id TEXT DEFAULT 't1'
);

-- Índices para exam_schedules
CREATE INDEX IF NOT EXISTS idx_exam_schedules_scheduled_for ON exam_schedules(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_status ON exam_schedules(status);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_class_ids ON exam_schedules USING GIN(class_ids);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_id ON exam_schedules(exam_id);

-- RLS para exam_schedules
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_schedules_select_policy ON exam_schedules;
CREATE POLICY exam_schedules_select_policy ON exam_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS exam_schedules_insert_policy ON exam_schedules;
CREATE POLICY exam_schedules_insert_policy ON exam_schedules FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS exam_schedules_update_policy ON exam_schedules;
CREATE POLICY exam_schedules_update_policy ON exam_schedules FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS exam_schedules_delete_policy ON exam_schedules;
CREATE POLICY exam_schedules_delete_policy ON exam_schedules FOR DELETE USING (true);

-- ============================================
-- TABELA 2: broadcast_messages
-- ============================================

CREATE TABLE IF NOT EXISTS broadcast_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO',
  sent_by TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  tenant_id TEXT DEFAULT 't1'
);

-- Índices para broadcast_messages
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_session ON broadcast_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_sent_at ON broadcast_messages(sent_at DESC);

-- RLS para broadcast_messages
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS broadcast_messages_select_policy ON broadcast_messages;
CREATE POLICY broadcast_messages_select_policy ON broadcast_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS broadcast_messages_insert_policy ON broadcast_messages;
CREATE POLICY broadcast_messages_insert_policy ON broadcast_messages FOR INSERT WITH CHECK (true);

-- ============================================
-- SUCESSO!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════╗';
  RAISE NOTICE '║                                           ║';
  RAISE NOTICE '║  ✅ SPRINT 0 MIGRATIONS CONCLUÍDAS! 🎉   ║';
  RAISE NOTICE '║                                           ║';
  RAISE NOTICE '╚═══════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tabelas criadas:';
  RAISE NOTICE '   ✓ exam_schedules (agendamentos)';
  RAISE NOTICE '   ✓ broadcast_messages (mensagens)';
  RAISE NOTICE '';
  RAISE NOTICE '� RLS policies aplicadas';
  RAISE NOTICE '📈 Índices de performance criados';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Próximo passo:';
  RAISE NOTICE '   1. Acesse: http://localhost:5173/agendamento';
  RAISE NOTICE '   2. Acesse: http://localhost:5173/central-comando';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora você pode usar o Sprint 0! 🚀';
  RAISE NOTICE '';
END $$;
