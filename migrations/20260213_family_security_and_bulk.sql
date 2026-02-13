-- REPARO E SEGURANÇA: Data de Nascimento e Guardião Primário
-- Adiciona suporte para validação de vínculo familiar e hierarquia de responsabilidade.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS primary_guardian_id TEXT;

-- Recarregar o cache do schema para a API reconhecer as novas colunas
NOTIFY pgrst, 'reload schema';

DO $$ BEGIN RAISE NOTICE 'Colunas de segurança familiar adicionadas e cache recarregado.'; END $$;
