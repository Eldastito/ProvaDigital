-- ==============================================================================
-- REPAIR MIGRATION: RISK SYSTEM INTEGRITY (20260218)
-- Descrição: Restaura as Foreign Keys e as RLS Policies do sistema de risco
--            que foram perdidas durante a migração nuclear de UUIDs.
-- ==============================================================================

BEGIN;

-- 1. FUNÇÃO AUXILIAR (Garante que podemos testar UUIDs com segurança)
CREATE OR REPLACE FUNCTION try_cast_uuid(p_val TEXT) RETURNS UUID AS $$
BEGIN RETURN p_val::UUID; EXCEPTION WHEN OTHERS THEN RETURN NULL; END; $$ LANGUAGE plpgsql;

-- 2. LIMPEZA DE DADOS ÓRFÃOS (Evita erro 23503)
-- Adicionado ::text para garantir que a função seja chamada corretamente independente do tipo atual da coluna
DELETE FROM public.risk_alerts 
WHERE try_cast_uuid(student_id::text) IS NULL 
   OR try_cast_uuid(student_id::text) NOT IN (SELECT id FROM public.students);

DELETE FROM public.interventions 
WHERE try_cast_uuid(alert_id::text) IS NULL 
   OR try_cast_uuid(alert_id::text) NOT IN (SELECT id FROM public.risk_alerts);

-- 3. ALINHAMENTO DE TIPOS (Garante que tudo é UUID de fato antes das FKs)
ALTER TABLE public.risk_alerts 
    ALTER COLUMN id TYPE UUID USING try_cast_uuid(id::text),
    ALTER COLUMN student_id TYPE UUID USING try_cast_uuid(student_id::text);

ALTER TABLE public.interventions 
    ALTER COLUMN id TYPE UUID USING try_cast_uuid(id::text),
    ALTER COLUMN alert_id TYPE UUID USING try_cast_uuid(alert_id::text);

-- 4. RESTAURAR FOREIGN KEYS
ALTER TABLE public.interventions 
    DROP CONSTRAINT IF EXISTS interventions_alert_id_fkey,
    ADD CONSTRAINT interventions_alert_id_fkey 
    FOREIGN KEY (alert_id) REFERENCES public.risk_alerts(id) ON DELETE CASCADE;

ALTER TABLE public.risk_alerts 
    DROP CONSTRAINT IF EXISTS risk_alerts_student_id_fkey,
    ADD CONSTRAINT risk_alerts_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- 2. RESTAURAR RLS POLICIES (Garantir segurança após a limpeza nuclear)
ALTER TABLE public.risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (limpeza preventiva)
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('risk_alerts', 'interventions')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END; $$ LANGUAGE plpgsql;

-- Criar novas políticas baseadas em Roles
CREATE POLICY "Manage risk_alerts" ON public.risk_alerts 
FOR ALL USING (
    public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
);

CREATE POLICY "Manage interventions" ON public.interventions 
FOR ALL USING (
    public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
);

-- 3. FORÇAR ATUALIZAÇÃO DO CACHE DO POSTGREST
NOTIFY pgrst, 'reload schema';

COMMIT;

-- VERIFICAÇÃO: Se este script rodar com sucesso, o erro PGRST200 deve desaparecer.
