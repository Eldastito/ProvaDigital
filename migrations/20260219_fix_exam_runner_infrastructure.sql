-- Migration: Fix Online Exam Runner Infrastructure
-- Date: 2026-02-19
-- Description: Restaura tabelas, RLS e colunas perdidas após migração de UUID.

BEGIN;

-- 1. Recriar tabela de eventos de tentativa de prova (Audit Log / Anti-Fraud)
CREATE TABLE IF NOT EXISTS public.exam_attempt_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- focus_lost | focus_gained | screenshot | devtools_open | copy_paste
    severity TEXT DEFAULT 'warning', -- info | warning | critical
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Adicionar coluna event_id em exam_attempts (Vínculo com Command Center)
-- Permite que o professor monitore tentativas vinculadas a um evento ao vivo específico
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exam_attempts' AND column_name='event_id') THEN
        ALTER TABLE public.exam_attempts ADD COLUMN event_id UUID REFERENCES public.exam_events(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Habilitar RLS
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempt_events ENABLE ROW LEVEL SECURITY;

-- 4. Restaurar Policies para exam_attempts
DROP POLICY IF EXISTS "Students can view own attempts" ON public.exam_attempts;
CREATE POLICY "Students can view own attempts"
    ON public.exam_attempts FOR SELECT
    USING (student_id = auth.uid()::text OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Students can start own attempts" ON public.exam_attempts;
CREATE POLICY "Students can start own attempts"
    ON public.exam_attempts FOR INSERT
    WITH CHECK (student_id = auth.uid()::text OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Students can update own attempts" ON public.exam_attempts;
CREATE POLICY "Students can update own attempts"
    ON public.exam_attempts FOR UPDATE
    USING (student_id = auth.uid()::text OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Professors can view all attempts" ON public.exam_attempts;
CREATE POLICY "Professors can view all attempts"
    ON public.exam_attempts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN')
    ));

-- 5. Restaurar Policies para exam_attempt_events
DROP POLICY IF EXISTS "Students can log own events" ON public.exam_attempt_events;
CREATE POLICY "Students can log own events"
    ON public.exam_attempt_events FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.exam_attempts
        WHERE exam_attempts.id = exam_attempt_events.attempt_id
        AND exam_attempts.student_id = auth.uid()::text
    ));

DROP POLICY IF EXISTS "Professors can view events" ON public.exam_attempt_events;
CREATE POLICY "Professors can view events"
    ON public.exam_attempt_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN')
    ));

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_exam_attempt_events_attempt_id ON public.exam_attempt_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_event_id ON public.exam_attempts(event_id);

COMMIT;
