-- EXPANSÃO DE PRONTUÁRIO: Dados Detalhados de Alunos e Responsáveis
-- Prepara o banco para suporte a vínculo automático e prontuário completo.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS responsible_email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS responsible_phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_complement TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_neighborhood TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_zip TEXT;

-- Recarregar o cache do schema
NOTIFY pgrst, 'reload schema';

DO $$ BEGIN RAISE NOTICE 'Colunas de prontuário estendido adicionadas.'; END $$;
