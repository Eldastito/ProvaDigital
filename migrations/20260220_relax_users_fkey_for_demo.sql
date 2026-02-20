-- ==============================================================================
-- MIGRATION: RELAX USERS FKEY FOR DEMO E SAAS (20260220)
-- Descrição: Remove a obrigatoriedade do usuário existir na tabela auth.users.
-- Isso permite o cadastro 100% livre (orgânico) pelo Gestão SAAS na aba Rede.
-- ==============================================================================

BEGIN;

-- 1. Remover a restrição da chave estrangeira que liga public.users a auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

COMMIT;
