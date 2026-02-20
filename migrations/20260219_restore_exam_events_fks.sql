-- Migration: Restore exam_events foreign keys
-- Date: 2026-02-19
-- Description: Restaura chaves estrangeiras perdidas durante a migração nuclear de UUIDs.

BEGIN;

-- 1. Limpeza de órfãos (Prevenção de erro de integridade)
-- Remove eventos que apontam para provas ou turmas que não existem (se houver)
DELETE FROM public.exam_events 
WHERE exam_id IS NOT NULL AND exam_id NOT IN (SELECT id FROM public.exams);

DELETE FROM public.exam_events 
WHERE class_id IS NOT NULL AND class_id NOT IN (SELECT id FROM public.classes);

-- 2. Restaurar chaves estrangeiras
ALTER TABLE public.exam_events
    DROP CONSTRAINT IF EXISTS exam_events_exam_id_fkey,
    ADD CONSTRAINT exam_events_exam_id_fkey 
    FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;

ALTER TABLE public.exam_events
    DROP CONSTRAINT IF EXISTS exam_events_class_id_fkey,
    ADD CONSTRAINT exam_events_class_id_fkey 
    FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.exam_events
    DROP CONSTRAINT IF EXISTS exam_events_created_by_fkey,
    ADD CONSTRAINT exam_events_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Garantir índices
CREATE INDEX IF NOT EXISTS idx_exam_events_exam_id ON public.exam_events(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_events_class_id ON public.exam_events(class_id);

COMMIT;
