-- Migration: Final Proctoring & Simulation Fix
-- Date: 2026-02-19
-- Description: Permite que professores iniciem provas (demo) e restaura contagem de violações.

BEGIN;

-- 1. Restaurar Função de Contagem de Violações (RPC)
CREATE OR REPLACE FUNCTION public.increment_violation_count(attempt_id_input UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.exam_attempts
    SET violation_count = COALESCE(violation_count, 0) + 1
    WHERE id = attempt_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar Políticas RLS para permitir Simulação por Professores
-- Tabela: exam_attempts (INSERT)
DROP POLICY IF EXISTS "Students can start own attempts" ON public.exam_attempts;
CREATE POLICY "Allow students and professors to start attempts" 
ON public.exam_attempts FOR INSERT 
WITH CHECK (
    student_id = auth.uid() 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN')
);

-- Tabela: exam_attempts (UPDATE)
DROP POLICY IF EXISTS "Students can update own attempts" ON public.exam_attempts;
CREATE POLICY "Allow students and professors to update attempts" 
ON public.exam_attempts FOR UPDATE 
USING (
    student_id = auth.uid() 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN')
);

-- Tabela: exam_attempt_events (INSERT)
DROP POLICY IF EXISTS "Students can log own events" ON public.exam_attempt_events;
CREATE POLICY "Allow students and professors to log events" 
ON public.exam_attempt_events FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exam_attempts
        WHERE exam_attempts.id = attempt_id
        AND (
            exam_attempts.student_id = auth.uid() 
            OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN')
        )
    )
);

COMMIT;
