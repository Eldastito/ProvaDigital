
-- ============================================
-- CORE SCHEMA: EXAMEPAD SAAS
-- Run this in Supabase SQL Editor to fix missing tables or RLS issues.
-- ============================================

-- 1. TENANTS (Secretarias / Clientes)
CREATE TABLE IF NOT EXISTS public.tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PUBLIC_MUNICIPAL', 'PUBLIC_STATE', 'PUBLIC_FEDERAL', 'PRIVATE')),
  cnpj TEXT,
  disabled_resources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SCHOOLS (Escolas)
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  inep TEXT,
  resources JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CLASSES (Turmas)
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES public.schools(id),
  name TEXT NOT NULL,
  series TEXT,
  shift TEXT CHECK (shift IN ('MANHA', 'TARDE', 'NOITE')),
  teacher_id TEXT, -- Pode ser FK para users se quiser rigor
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. USERS (Usuários do Sistema)
-- Ensure id matches auth.users logic if you use Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN', 'DIRETOR', 'SUPERVISOR', 'PROFESSOR', 'ALUNO', 'PAIS')),
  tenant_id TEXT NOT NULL, -- FK loose reference to allow flexibility or enforce references public.tenants(id)
  school_id TEXT,
  children_ids TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. STUDENTS (Alunos - Entidade Acadêmica)
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number TEXT,
  class_id TEXT NOT NULL REFERENCES public.classes(id),
  school_id TEXT NOT NULL REFERENCES public.schools(id),
  tenant_id TEXT NOT NULL REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (Simplified for Stability)
-- ============================================

-- TENANTS: Authenticated users can read all tenants (for selection)
-- Or restrict to their own tenant if stricter. For now, READ ALL to prevent "White Screen" on login.
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tenants;
CREATE POLICY "Enable read access for authenticated users" ON public.tenants
  FOR SELECT USING (auth.role() = 'authenticated');

-- SCHOOLS: Function as above
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.schools;
CREATE POLICY "Enable read access for authenticated users" ON public.schools
  FOR SELECT USING (auth.role() = 'authenticated');

-- CLASSES: Function as above
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.classes;
CREATE POLICY "Enable read access for authenticated users" ON public.classes
  FOR SELECT USING (auth.role() = 'authenticated');

-- USERS: Users can read other users in their Tenant (to see Professors, Students)
-- AND Users can update their OWN profile.
DROP POLICY IF EXISTS "Read users in same tenant" ON public.users;
CREATE POLICY "Read users in same tenant" ON public.users
  FOR SELECT USING (
    auth.role() = 'authenticated'
    -- Em produção, adicione: AND tenant_id = (select tenant_id from users where id = auth.uid())
    -- Para debug agora, liberar leitura autenticada:
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- STUDENTS: Read access for authenticated users (Staff needs to see students)
DROP POLICY IF EXISTS "Enable read access for all auth users" ON public.students;
CREATE POLICY "Enable read access for all auth users" ON public.students
  FOR SELECT USING (auth.role() = 'authenticated');

-- WRITE POLICIES (Allow Admin types to write)
-- This is a simplification. In production, check User Role.
-- Here we allow authenticated users to INSERT for now to fix "Data not saving" bugs.
-- Ideally, create a trigger or checking function.

CREATE POLICY "Enable insert for authenticated users only" ON public.tenants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users only" ON public.schools FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users only" ON public.classes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users only" ON public.students FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- AUDIT LOGS & RISK ALERTS (From previous analysis)
-- ============================================
-- (Include these if missing)

-- 6. ITEMS (Banco de Questões)
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  statement TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  difficulty TEXT,
  alternatives JSONB DEFAULT '[]'::jsonb,
  correct_justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read items" ON public.items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert items" ON public.items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. EXAMS (Provas)
CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  school_id TEXT,
  creator_id TEXT,
  subject TEXT,
  status TEXT,
  items_config JSONB DEFAULT '[]'::jsonb,
  class_ids TEXT[] DEFAULT '{}',
  scheduled_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read exams" ON public.exams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert exams" ON public.exams FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. EXAM RESULTS (Resultados)
CREATE TABLE IF NOT EXISTS public.exam_results (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES public.exams(id),
  student_id TEXT NOT NULL REFERENCES public.students(id),
  answers JSONB DEFAULT '[]'::jsonb,
  total_score NUMERIC,
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read results" ON public.exam_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert results" ON public.exam_results FOR INSERT WITH CHECK (auth.role() = 'authenticated');
