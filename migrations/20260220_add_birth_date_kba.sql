-- ==============================================================================
-- MIGRATION: ADD BIRTH DATE TO STUDENTS AND USERS (20260220_birth_date.sql)
-- Descrição: Adiciona "birth_date" para validação KBA em fluxos de Resgate (Claim).
-- ==============================================================================

BEGIN;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMIT;
