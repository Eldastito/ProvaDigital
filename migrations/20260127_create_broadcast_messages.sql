/**
 * Migration: Criação da tabela broadcast_messages
 * Sprint 0 - Parte 2: Central de Comando
 */

-- Criar tabela de mensagens broadcast
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO', -- 'INFO' | 'WARNING' | 'ALERT'
  sent_by TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  tenant_id TEXT DEFAULT 't1'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_session ON broadcast_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_sent_at ON broadcast_messages(sent_at DESC);

-- Row Level Security (RLS)
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler mensagens (demo/dev)
CREATE POLICY broadcast_messages_select_policy ON broadcast_messages
  FOR SELECT
  USING (true);

-- Policy: Todos podem inserir mensagens (demo/dev)
CREATE POLICY broadcast_messages_insert_policy ON broadcast_messages
  FOR INSERT
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE broadcast_messages IS 'Mensagens broadcast enviadas durante provas';
COMMENT ON COLUMN broadcast_messages.id IS 'ID único da mensagem';
COMMENT ON COLUMN broadcast_messages.session_id IS 'ID da sessão/evento';
COMMENT ON COLUMN broadcast_messages.message IS 'Texto da mensagem';
COMMENT ON COLUMN broadcast_messages.type IS 'Tipo da mensagem (INFO/WARNING/ALERT)';
COMMENT ON COLUMN broadcast_messages.sent_by IS 'ID do usuário que enviou';
COMMENT ON COLUMN broadcast_messages.sent_at IS 'Data e hora de envio';
