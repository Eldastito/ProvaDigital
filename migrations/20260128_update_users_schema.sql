/**
 * Migration: Atualização da tabela de usuários (profiles)
 * Sprint 3: Gestão de Usuários
 */

-- Garantir que a tabela existe (geralmente é 'users' ou 'profiles' no public schema)
-- Assumindo 'public.users' baseada no código do store
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'ALUNO',
  tenant_id TEXT DEFAULT 't1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas novas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'ACTIVE'; -- 'ACTIVE' | 'BLOCKED'
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
        ALTER TABLE public.users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Atualizar Policies para permitir gestão
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem fazer tudo
DROP POLICY IF EXISTS users_admin_policy ON public.users;
CREATE POLICY users_admin_policy ON public.users
  USING (true)
  WITH CHECK (true);
