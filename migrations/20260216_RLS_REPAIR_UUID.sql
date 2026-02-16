-- ==============================================================================
-- REPAIR MIGRATION: RLS RESTORATION & UUID ALIGNMENT (20260216)
-- Descrição: Restaura todas as RLS policies removidas pela migração nuclear e
--            adapta as comparações para o novo formato UUID.
-- ==============================================================================

BEGIN;

-- 1. ATUALIZAR FUNÇÃO DE PERMISSÕES PARA UUID
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.users
  WHERE id = auth.uid(); -- Removido ::text (id agora é UUID)
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. LIMPEZA DE POLICIES RESIDUAIS (Garantir estado limpo)
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END; $$ LANGUAGE plpgsql;

-- 3. RESTAURAR POLICIES - TABELA: tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read tenants" ON public.tenants FOR SELECT USING (auth.role() = 'authenticated');

-- 4. RESTAURAR POLICIES - TABELA: schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read schools" ON public.schools FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage schools" ON public.schools FOR ALL USING (
  public.get_current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN')
);

-- 5. RESTAURAR POLICIES - TABELA: classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read classes" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage classes" ON public.classes FOR ALL USING (
  public.get_current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN', 'DIRETOR', 'SUPERVISOR')
);

-- 6. RESTAURAR POLICIES - TABELA: users (CRÍTICO PARA LOGIN)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Self register" ON public.users FOR INSERT WITH CHECK (
  auth.uid() = id OR public.get_current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN')
);
CREATE POLICY "Self update" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users admin manage" ON public.users FOR ALL USING (
  public.get_current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN')
);

-- 7. RESTAURAR POLICIES - TABELA: students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read students" ON public.students FOR SELECT USING (auth.role() = 'authenticated');

-- 8. RESTAURAR POLICIES - TABELA: items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read items" ON public.items FOR SELECT USING (auth.role() = 'authenticated' OR is_public = true);
CREATE POLICY "Manage items" ON public.items FOR ALL USING (
  public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
);

-- 9. RESTAURAR POLICIES - TABELA: exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read exams" ON public.exams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage exams" ON public.exams FOR ALL USING (
  public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
);

-- 10. RESTAURAR POLICIES - TABELA: exam_results
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read results" ON public.exam_results FOR SELECT USING (
  auth.uid() = student_id OR 
  public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
);
CREATE POLICY "Student submit" ON public.exam_results FOR INSERT WITH CHECK (
  auth.uid() = student_id
);
CREATE POLICY "Professor grade" ON public.exam_results FOR UPDATE USING (
  public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
);

-- 11. RESTAURAR POLICIES - TABELA: user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read profiles" ON public.user_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage own profile" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);

-- 12. RESTAURAR POLICIES - TABELA: marketplace_interactions
ALTER TABLE public.marketplace_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create interactions" ON public.marketplace_interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view interactions" ON public.marketplace_interactions FOR SELECT TO authenticated USING (true);

COMMIT;
