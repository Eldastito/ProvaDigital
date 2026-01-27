/**
 * Migration: Criação da tabela exam_schedules
 * Sprint 0 - Parte 1: Sistema de Agendamento
 */

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS exam_schedules (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  class_ids TEXT[] NOT NULL DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- minutos
  mode TEXT NOT NULL DEFAULT 'ONLINE', -- 'ONLINE' | 'OFFLINE' | 'HYBRID'
  config JSONB NOT NULL DEFAULT '{
    "proctoring": true,
    "shuffle": true,
    "timeLimit": 60,
    "allowReview": false
  }'::jsonb,
  status TEXT NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  tenant_id TEXT DEFAULT 't1'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_exam_schedules_scheduled_for ON exam_schedules(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_status ON exam_schedules(status);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_class_ids ON exam_schedules USING GIN(class_ids);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_id ON exam_schedules(exam_id);

-- Row Level Security (RLS)
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler agendamentos (demo/dev)
CREATE POLICY exam_schedules_select_policy ON exam_schedules
  FOR SELECT
  USING (true);

-- Policy: Todos podem inserir agendamentos (demo/dev)
CREATE POLICY exam_schedules_insert_policy ON exam_schedules
  FOR INSERT
  WITH CHECK (true);

-- Policy: Todos podem atualizar agendamentos (demo/dev)
CREATE POLICY exam_schedules_update_policy ON exam_schedules
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Todos podem deletar agendamentos (demo/dev)
CREATE POLICY exam_schedules_delete_policy ON exam_schedules
  FOR DELETE
  USING (true);

-- Comentários
COMMENT ON TABLE exam_schedules IS 'Agendamento de provas para turmas';
COMMENT ON COLUMN exam_schedules.id IS 'ID único do agendamento';
COMMENT ON COLUMN exam_schedules.exam_id IS 'ID da prova agendada';
COMMENT ON COLUMN exam_schedules.exam_title IS 'Título da prova (cache)';
COMMENT ON COLUMN exam_schedules.class_ids IS 'Array de IDs das turmas';
COMMENT ON COLUMN exam_schedules.scheduled_for IS 'Data e hora agendadas';
COMMENT ON COLUMN exam_schedules.duration IS 'Duração em minutos';
COMMENT ON COLUMN exam_schedules.mode IS 'Modo de aplicação (ONLINE/OFFLINE/HYBRID)';
COMMENT ON COLUMN exam_schedules.config IS 'Configurações da prova (JSON)';
COMMENT ON COLUMN exam_schedules.status IS 'Status do agendamento';
COMMENT ON COLUMN exam_schedules.created_by IS 'ID do usuário que criou';
COMMENT ON COLUMN exam_schedules.created_at IS 'Data de criação';
COMMENT ON COLUMN exam_schedules.updated_at IS 'Data da última atualização';
