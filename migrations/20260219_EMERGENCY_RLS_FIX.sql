-- Migration: EMERGENCY PROCTORING REPAIR (v2 - Fixed Types)
-- Date: 2026-02-19
-- Description: Fixes 403 Forbidden on security event logging by ensuring correct UUID comparisons.

BEGIN;

-- 1. Políticas para exam_attempts
-- Garantir que as políticas antigas sejam removidas primeiro
DROP POLICY IF EXISTS "Allow students and professors to start attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Students can start own attempts" ON public.exam_attempts;

CREATE POLICY "Allow students and professors to start attempts" 
ON public.exam_attempts FOR INSERT 
WITH CHECK (
    student_id::uuid = auth.uid() 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS "Allow students and professors to update attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Students can update own attempts" ON public.exam_attempts;

CREATE POLICY "Allow students and professors to update attempts" 
ON public.exam_attempts FOR UPDATE 
USING (
    student_id::uuid = auth.uid() 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS "Allow students and professors to select attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Students can view own attempts" ON public.exam_attempts;

CREATE POLICY "Allow students and professors to select attempts" 
ON public.exam_attempts FOR SELECT
USING (
    student_id::uuid = auth.uid() 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
);

-- 2. Políticas para exam_attempt_events
DROP POLICY IF EXISTS "Allow students and professors to log events" ON public.exam_attempt_events;
DROP POLICY IF EXISTS "Students can log own events" ON public.exam_attempt_events;

CREATE POLICY "Allow students and professors to log events" 
ON public.exam_attempt_events FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exam_attempts
        WHERE exam_attempts.id = exam_attempt_events.attempt_id
        AND (
            exam_attempts.student_id::uuid = auth.uid() 
            OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
        )
    )
);

DROP POLICY IF EXISTS "Allow students and professors to select events" ON public.exam_attempt_events;
CREATE POLICY "Allow students and professors to select events" 
ON public.exam_attempt_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.exam_attempts
        WHERE exam_attempts.id = exam_attempt_events.attempt_id
        AND (
            exam_attempts.student_id::uuid = auth.uid() 
            OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('PROFESSOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN')
        )
    )
);

COMMIT;
