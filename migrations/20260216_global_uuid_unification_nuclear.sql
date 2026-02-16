-- ==============================================================================
-- MIGRATION: GLOBAL UUID UNIFICATION ULTIMATE NUCLEAR (20260216) - VERSÃO 6
-- Descrição: Converte TODAS as PKs e FKs do formato TEXT para UUID em uma única transação.
-- Esta versão é a DEFINITIVA: 
-- 1. Limpeza dinâmica de dependências (Views, MViews, RLS, FKs) protegendo extensões.
-- 2. Mapeamento exaustivo de TODAS as tabelas do sistema (~36 tabelas).
-- 3. Remoção de registros órfãos para evitar violação de integridade.
-- 4. Restauração das Views de Risco e Desempenho.
-- ==============================================================================

BEGIN;

-- 1. DESATIVAR GATILHOS
SET session_replication_role = 'replica';

-- 2. Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. FUNÇÕES AUXILIARES DE LIMPEZA (Blindadas contra extensões)
CREATE OR REPLACE FUNCTION try_cast_uuid(p_val TEXT) RETURNS UUID AS $$
BEGIN RETURN p_val::UUID; EXCEPTION WHEN OTHERS THEN RETURN NULL; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION drop_all_policies_public() RETURNS VOID AS $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION drop_all_views_public() RETURNS VOID AS $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT v.viewname FROM pg_views v
        JOIN pg_class c ON v.viewname = c.relname
        JOIN pg_namespace n ON c.relnamespace = n.oid
        LEFT JOIN pg_depend d ON d.objid = c.oid AND d.deptype = 'e'
        WHERE v.schemaname = 'public' AND n.nspname = 'public' AND d.objid IS NULL
    ) LOOP EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE'; END LOOP;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION drop_all_mviews_public() RETURNS VOID AS $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT m.matviewname FROM pg_matviews m
        JOIN pg_class c ON m.matviewname = c.relname
        JOIN pg_namespace n ON c.relnamespace = n.oid
        LEFT JOIN pg_depend d ON d.objid = c.oid AND d.deptype = 'e'
        WHERE m.schemaname = 'public' AND n.nspname = 'public' AND d.objid IS NULL
    ) LOOP EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.' || quote_ident(r.matviewname) || ' CASCADE'; END LOOP;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION drop_all_fks_public() RETURNS VOID AS $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT conname, relname FROM pg_constraint c
        JOIN pg_class cl ON c.conrelid = cl.oid
        JOIN pg_namespace n ON cl.relnamespace = n.oid
        LEFT JOIN pg_depend d ON d.objid = cl.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public' AND c.contype = 'f' AND d.objid IS NULL
    ) LOOP EXECUTE 'ALTER TABLE public.' || quote_ident(r.relname) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname); END LOOP;
END; $$ LANGUAGE plpgsql;

-- 4. LIMPEZA INICIAL DE DEPENDÊNCIAS
SELECT drop_all_views_public();
SELECT drop_all_mviews_public();
SELECT drop_all_policies_public();
SELECT drop_all_fks_public();

-- 5. TABELA DE MAPEAMENTO
CREATE TEMP TABLE id_conversion_map (old_id TEXT PRIMARY KEY, new_id UUID);

-- 6. DESCOBERTA EXAUSTIVA DE IDs LEGADOS (Dinâmica)
DO $$
DECLARE
    t RECORD;
    col RECORD;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        FOR col IN (SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND data_type = 'text') LOOP
            -- Detectar colunas que são IDs (id, _id, id_)
            IF col.column_name = 'id' OR col.column_name LIKE '%_id' OR col.column_name LIKE 'id_%' THEN
                -- Inserir todos os valores que não são UUIDs válidos no mapa de conversão
                EXECUTE format('
                    INSERT INTO id_conversion_map (old_id, new_id)
                    SELECT DISTINCT %I, uuid_generate_v4()
                    FROM public.%I
                    WHERE %I IS NOT NULL AND %I <> '''' AND try_cast_uuid(%I) IS NULL
                    ON CONFLICT (old_id) DO NOTHING',
                    col.column_name, t.tablename, col.column_name, col.column_name, col.column_name
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 7. ATUALIZAÇÃO MASSIVA DE DADOS (TEXT -> UUID String)
DO $$
DECLARE t RECORD; col RECORD;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        FOR col IN (SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND data_type = 'text') LOOP
            IF col.column_name = 'id' OR col.column_name LIKE '%_id' OR col.column_name LIKE 'id_%' THEN
                EXECUTE format('UPDATE public.%I SET %I = COALESCE(try_cast_uuid(%I)::text, (SELECT new_id FROM id_conversion_map WHERE old_id = %I)::text) WHERE %I IS NOT NULL', t.tablename, col.column_name, col.column_name, col.column_name, col.column_name);
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 8. FAXINA DE INTEGRIDADE GLOBAL (Limpeza de Órfãos)
-- Esta etapa garante que não existam referências a IDs que não existem nas tabelas pai, 
-- evitando erros de violação de chave estrangeira (FK) na restauração final.

-- 8.1. Limpar Usuários Órfãos (Relação com Auth)
DELETE FROM public.users WHERE try_cast_uuid(id) IS NULL OR try_cast_uuid(id)::TEXT NOT IN (SELECT id::TEXT FROM auth.users);

-- 8.2. Limpar Alunos Órfãos ou Inconsistentes (Relação com Turmas/Escolas)
-- Comparação via TEXT pois os tipos ainda são alterados no passo 10
UPDATE public.students SET class_id = NULL WHERE class_id IS NOT NULL AND try_cast_uuid(class_id)::TEXT NOT IN (SELECT id::TEXT FROM public.classes);
DELETE FROM public.students WHERE school_id IS NOT NULL AND try_cast_uuid(school_id)::TEXT NOT IN (SELECT id::TEXT FROM public.schools);

-- 8.3. Limpar Turmas Órfãs (Relação com Escolas)
DELETE FROM public.classes WHERE school_id IS NOT NULL AND try_cast_uuid(school_id)::TEXT NOT IN (SELECT id::TEXT FROM public.schools);

-- 8.4. Limpar Escolas órfãs de Tenants
DELETE FROM public.schools WHERE tenant_id IS NOT NULL AND try_cast_uuid(tenant_id)::TEXT NOT IN (SELECT id::TEXT FROM public.tenants);

-- 8.5. Limpar Provas e Itens (Garante que apontem para Tenants válidos)
DELETE FROM public.exams WHERE tenant_id IS NOT NULL AND try_cast_uuid(tenant_id)::TEXT NOT IN (SELECT id::TEXT FROM public.tenants);
DELETE FROM public.items WHERE tenant_id IS NOT NULL AND try_cast_uuid(tenant_id)::TEXT NOT IN (SELECT id::TEXT FROM public.tenants);

-- 8.6. Limpar Agendamentos órfãos (O erro reportado de exam_schedules)
DELETE FROM public.exam_schedules WHERE exam_id IS NOT NULL AND try_cast_uuid(exam_id)::TEXT NOT IN (SELECT id::TEXT FROM public.exams);

-- 9. REMOVER VALORES PADRÃO (DROP DEFAULT)
DO $$
DECLARE col RECORD;
BEGIN
    FOR col IN (SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND (column_name = 'id' OR column_name LIKE '%_id') AND column_default IS NOT NULL) LOOP
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', col.table_name, col.column_name);
    END LOOP;
END $$;

-- 10. ALTERAÇÃO DE TIPOS PARA UUID
DO $$
DECLARE t RECORD; col RECORD;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        FOR col IN (SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename AND data_type = 'text') LOOP
            IF col.column_name = 'id' OR col.column_name LIKE '%_id' THEN
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING try_cast_uuid(%I)', t.tablename, col.column_name, col.column_name);
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 11. RESTAURAR VALORES PADRÃO
ALTER TABLE public.tenants ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.schools ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.classes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.students ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.items ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.exams ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.exam_results ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.risk_alerts ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 12. RESTAURAR CONSTRAINTS ESSENCIAIS
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.schools ADD CONSTRAINT schools_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.classes ADD CONSTRAINT classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.exams ADD CONSTRAINT exams_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.items ADD CONSTRAINT items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 13. RE-CRIAR VIEWS
CREATE OR REPLACE VIEW public.school_performance_trends AS
SELECT 
    e.tenant_id, e.school_id, s.name as school_name, e.subject,
    AVG(r.total_score) as avg_score, COUNT(r.id) as total_attempts,
    DATE_TRUNC('month', e.created_at) as trend_month
FROM exam_results r
JOIN exams e ON r.exam_id = e.id
JOIN schools s ON e.school_id = s.id
JOIN exam_versions v ON e.id = v.exam_id
GROUP BY 1, 2, 3, 4, 7;

CREATE OR REPLACE VIEW public.student_risk_assessment AS
WITH student_stats AS (
    SELECT 
        s.id AS student_id, s.name AS student_name, s.class_id, s.school_id, s.tenant_id,
        COALESCE(AVG(er.total_score), 0) AS avg_score, COUNT(er.id) AS exam_count,
        60 + (ABS(('x' || SUBSTRING(MD5(s.id::text), 1, 8))::bit(32)::int) % 41) AS simulated_attendance
    FROM public.students s
    LEFT JOIN public.exam_results er ON er.student_id = s.id
    GROUP BY s.id, s.name, s.class_id, s.school_id, s.tenant_id
),
risk_factors AS (
    SELECT 
        student_id, student_name, class_id, school_id, tenant_id, avg_score, exam_count,
        simulated_attendance,
        CASE WHEN simulated_attendance < 75 THEN 40 WHEN simulated_attendance < 85 THEN 15 ELSE 0 END AS attendance_risk,
        CASE WHEN exam_count > 0 AND avg_score < 5.0 THEN 40 WHEN exam_count > 0 AND avg_score < 7.0 THEN 20 ELSE 0 END AS academic_risk
    FROM student_stats
)
SELECT 
    student_id, student_name, class_id, school_id, tenant_id, avg_score, exam_count, simulated_attendance,
    LEAST(attendance_risk + academic_risk, 100) AS risk_score,
    CASE WHEN (attendance_risk + academic_risk) >= 50 THEN 'HIGH' WHEN (attendance_risk + academic_risk) >= 20 THEN 'MEDIUM' ELSE 'LOW' END AS risk_level,
    COALESCE((
        SELECT jsonb_agg(factor) FROM (
            SELECT jsonb_build_object('name', 'Frequência', 'severity', 'HIGH', 'message', 'Alerta de Frequência Low') AS factor WHERE attendance_risk > 0
            UNION ALL
            SELECT jsonb_build_object('name', 'Desempenho', 'severity', 'HIGH', 'message', 'Alerta Acadêmico') AS factor WHERE academic_risk > 0
        ) factors
    ), '[]'::jsonb) AS risk_factors, NOW() AS generated_at
FROM risk_factors;

-- 14. REATIVAR SEGURANÇA E GATILHOS
SET session_replication_role = 'origin';
SELECT drop_all_policies_public();
CREATE POLICY "auth_access_items" ON public.items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_access_exams" ON public.exams FOR ALL USING (auth.role() = 'authenticated');
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- 15. LIMPEZA FINAL
DROP TABLE IF EXISTS id_conversion_map;
DROP FUNCTION IF EXISTS try_cast_uuid(TEXT);
DROP FUNCTION IF EXISTS drop_all_policies_public();
DROP FUNCTION IF EXISTS drop_all_views_public();
DROP FUNCTION IF EXISTS drop_all_mviews_public();
DROP FUNCTION IF EXISTS drop_all_fks_public();

COMMIT;
