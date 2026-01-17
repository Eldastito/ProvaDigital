-- MIGRATION: Fix Exams Persistence
-- Date: 2026-01-17
-- Description: Adds missing columns to public.exams table to match application state.

ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'SOMATIVO',
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS target_question_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score NUMERIC DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS shuffle_items BOOLEAN DEFAULT TRUE;

-- Update RLS if necessary (it should be fine since it allows ALL for certain roles)
-- But ensuring clear understanding:
COMMENT ON COLUMN public.exams.model IS 'SOMATIVO | ADAPTADO';
COMMENT ON COLUMN public.exams.shuffle_items IS 'True if questions should be shuffled for students';
