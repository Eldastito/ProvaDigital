-- REPARO: Adição de subject_ids para Professores
-- Adiciona suporte para disciplinas associadas aos professores na tabela unificada de usuários.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subject_ids TEXT[] DEFAULT '{}';

-- Recarregar o cache do schema para a API reconhecer a nova coluna imediatamente
NOTIFY pgrst, 'reload schema';

DO $$ BEGIN RAISE NOTICE 'Coluna subject_ids adicionada e cache recarregado.'; END $$;
