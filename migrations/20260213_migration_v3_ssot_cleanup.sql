-- MIGRATION V3.5: UNIFIED IDENTITY (SSOT) - HYPER-COMPATIBLE
-- Consolida dados da tabela legada 'students' para a tabela 'users'
-- Esta versão separa estruturalmente DDL (Schema) de DML (Dados) para evitar erros de parser do Supabase.

-- ==========================================
-- 1. REPARO DO SCHEMA (DDL)
-- ==========================================

-- Garantir que a tabela users existe e tem as colunas básicas
-- Usamos 'IF NOT EXISTS' para segurança total

-- Padronizar campo de Nome (Renomear full_name para name se necessário)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE public.users RENAME COLUMN full_name TO name;
    END IF;
END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS class_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ALUNO';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 't1';

-- ==========================================
-- 2. MIGRAÇÃO DE DADOS (DML)
-- ==========================================
-- Usamos um bloco anônimo com EXECUTE para que o parser ignore as colunas novas até a execução.

DO $$
DECLARE
    has_created_at_in_students BOOLEAN;
BEGIN
    -- Verificar se students tem created_at para copiar a data original
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'created_at') 
    INTO has_created_at_in_students;

    -- Inserir alunos novos (que só existem em 'students')
    -- O EXECUTE garante que o parser não cheque a existência de created_at no momento da compilação do bloco
    EXECUTE 'INSERT INTO public.users (id, name, role, tenant_id, school_id, class_ids, registration_number, status, created_at) ' ||
            'SELECT s.id, s.name, ''ALUNO'', s.tenant_id, s.school_id, ARRAY[s.class_id], s.registration_number, ''ACTIVE'', ' ||
            CASE WHEN has_created_at_in_students THEN 's.created_at ' ELSE 'NOW() ' END ||
            'FROM students s LEFT JOIN public.users u ON s.id = u.id WHERE u.id IS NULL';

    -- Atualizar registros existentes que vieram da tabela students mas estão sem dados de matrícula
    EXECUTE 'UPDATE public.users u SET registration_number = s.registration_number, school_id = s.school_id, class_ids = ARRAY[s.class_id] ' ||
            'FROM students s WHERE u.id = s.id AND (u.registration_number IS NULL OR u.school_id IS NULL)';

    -- Backfill de segurança para campos obrigatórios
    UPDATE public.users SET role = 'ALUNO' WHERE role IS NULL;
    UPDATE public.users SET tenant_id = 't1' WHERE tenant_id IS NULL;

    RAISE NOTICE 'Migração SSOT concluída com sucesso (Schema e Dados).';
END $$;
