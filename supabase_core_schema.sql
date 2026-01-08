
-- ============================================
-- CORE SCHEMA: EXAMEPAD SAAS (SECURE RLS VERSION)
-- ============================================

-- 1. HELPER FUNCTIONS FOR PERMISSIONS
-- Efficiently get the role of the current user to avoid race conditions or claim issues.
-- Note: This assumes public.users is kept in sync with auth.users triggers.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Fix: Cast auth.uid() to text to match public.users.id type (which is TEXT)
  SELECT role INTO v_role
  FROM public.users
  WHERE id = auth.uid()::text;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  teacher_id TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. USERS (Usuários do Sistema)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN', 'DIRETOR', 'SUPERVISOR', 'PROFESSOR', 'ALUNO', 'PAIS')),
  tenant_id TEXT NOT NULL, 
  school_id TEXT,
  class_ids TEXT[], -- Array of class IDs for professors/students
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

-- 6. ITEMS (Banco de Questões)
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  school_id TEXT,
  owner_id TEXT REFERENCES public.users(id), -- Quem criou
  statement TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  difficulty TEXT,
  alternatives JSONB DEFAULT '[]'::jsonb,
  correct_justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. EXAMS (Provas)
CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  school_id TEXT,
  creator_id TEXT REFERENCES public.users(id),
  subject TEXT,
  status TEXT,
  items_config JSONB DEFAULT '[]'::jsonb,
  class_ids TEXT[] DEFAULT '{}',
  scheduled_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. EXAM RESULTS (Resultados)
CREATE TABLE IF NOT EXISTS public.exam_results (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES public.exams(id),
  student_id TEXT NOT NULL, -- references students(id) OR users(id) depending on architecture (users usually)
  answers JSONB DEFAULT '[]'::jsonb,
  total_score NUMERIC DEFAULT 0,
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  violation_count INTEGER DEFAULT 0
);

-- 9. USER PROFILES (Gamification)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  owl_coins INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  inventory TEXT[] DEFAULT '{}',
  academic_achievements JSONB DEFAULT '[]'::jsonb,
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
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (STRICT MODE)
-- ============================================

-- -------- TENANTS --------
-- Read: Authenticated users can read valid tenants (for login context)
DROP POLICY IF EXISTS "Read tenants" ON public.tenants;
CREATE POLICY "Read tenants" ON public.tenants FOR SELECT USING (auth.role() = 'authenticated');
-- Write: ONLY SUPER_ADMIN (Manual DB admin usually, but let's allow State Admins if needed)
-- For this MVP, tenants are usually created manually or by superadmin script. NO PUBLIC WRITE.

-- -------- SCHOOLS --------
-- Read: Auth users
DROP POLICY IF EXISTS "Read schools" ON public.schools;
CREATE POLICY "Read schools" ON public.schools FOR SELECT USING (auth.role() = 'authenticated');
-- Write: Tenant/State Admins
DROP POLICY IF EXISTS "Manage schools" ON public.schools;
CREATE POLICY "Manage schools" ON public.schools FOR ALL USING (
  public.get_current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN')
);

-- -------- CLASSES --------
-- Read: Auth users
DROP POLICY IF EXISTS "Read classes" ON public.classes;
CREATE POLICY "Read classes" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
-- Write: School Managers & Admins
DROP POLICY IF EXISTS "Manage classes" ON public.classes;
CREATE POLICY "Manage classes" ON public.classes FOR ALL USING (
  public.get_current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN', 'DIRETOR', 'SUPERVISOR')
);

-- -------- USERS --------
-- Read: Auth users can read other users in their tenant context (simplified for now to avoid 'friends' table need)
DROP POLICY IF EXISTS "Read users" ON public.users;
CREATE POLICY "Read users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');

-- Update: Users can update their own non-sensitive data? Ideally only profile.
-- IMPORTANT: We separate `public.users` (Critical Auth Data) from `public.user_profiles` (Bio, Avatar).
-- `public.users` creation should be handled by trigger on auth.users OR by Admin.
-- For the user request "Users cannot save data", we allow INSERT if ID matches (Self-Registration) OR Admin.
DROP POLICY IF EXISTS "Self register" ON public.users;
CREATE POLICY "Self register" ON public.users FOR INSERT WITH CHECK (
  -- Fix: Cast auth.uid() to text
  auth.uid()::text = id OR public.get_current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN')
);
DROP POLICY IF EXISTS "Self update" ON public.users;
CREATE POLICY "Self update" ON public.users FOR UPDATE USING (auth.uid()::text = id);

-- -------- ITEMS (Questions) --------
-- Read: All authenticated (shared bank)
DROP POLICY IF EXISTS "Read items" ON public.items;
CREATE POLICY "Read items" ON public.items FOR SELECT USING (auth.role() = 'authenticated');
-- Write: Professors & Admins
DROP POLICY IF EXISTS "Manage items" ON public.items;
CREATE POLICY "Manage items" ON public.items FOR ALL USING (
  public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
);

-- -------- EXAMS --------
-- Read: All auth (Alunos precisam ver a prova para responder)
DROP POLICY IF EXISTS "Read exams" ON public.exams;
CREATE POLICY "Read exams" ON public.exams FOR SELECT USING (auth.role() = 'authenticated');
-- Write: Professors & Admins (Fixes "Cannot Save Exam")
DROP POLICY IF EXISTS "Manage exams" ON public.exams;
CREATE POLICY "Manage exams" ON public.exams FOR ALL USING (
  -- Check if user is creator is managed by app logic, but RLS allows role write
  public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
);

-- -------- EXAM RESULTS (CRITICAL) --------
-- Read: Students see OWN results. Profs/Admins see ALL results.
DROP POLICY IF EXISTS "Read results" ON public.exam_results;
CREATE POLICY "Read results" ON public.exam_results FOR SELECT USING (
  auth.uid()::text = student_id OR -- Own result
  public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN') -- Staff
);

-- Write: 
-- 1. Students can INSERT their own result (Submission)
-- 2. Professors can UPDATE (Correction)
DROP POLICY IF EXISTS "Student submit" ON public.exam_results;
CREATE POLICY "Student submit" ON public.exam_results FOR INSERT WITH CHECK (
  auth.uid()::text = student_id
);
DROP POLICY IF EXISTS "Professor grade" ON public.exam_results;
CREATE POLICY "Professor grade" ON public.exam_results FOR UPDATE USING (
  public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
);

-- -------- USER PROFILES --------
-- Read: All
DROP POLICY IF EXISTS "Read profiles" ON public.user_profiles;
CREATE POLICY "Read profiles" ON public.user_profiles FOR SELECT USING (auth.role() = 'authenticated');
-- Write: Self
DROP POLICY IF EXISTS "Manage own profile" ON public.user_profiles;
CREATE POLICY "Manage own profile" ON public.user_profiles FOR ALL USING (auth.uid()::text = user_id);

-- NOTE: This schema assumes 'public.users' is populated via Trigger from 'auth.users' setup, 
-- OR that the client inserts into public.users immediately after SignUp. 
-- The 'Self register' policy above enables the client-side insert approach if triggers are not set up.
