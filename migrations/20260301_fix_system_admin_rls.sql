-- Migração: Correção de RLS para o papel SYSTEM_ADMIN
-- Data: 2026-03-01
-- Descrição: Permite que usuários com a role SYSTEM_ADMIN gerenciem exames, itens, resultados, alertas e intervenções.

-- Atualizar política de gerenciamento de exames para incluir SYSTEM_ADMIN
DROP POLICY IF EXISTS "Manage exams" ON public.exams;
CREATE POLICY "Manage exams" ON public.exams
AS PERMISSIVE FOR ALL
TO public
USING (get_current_user_role() = ANY (ARRAY['PROFESSOR'::text, 'SUPERVISOR'::text, 'DIRETOR'::text, 'TENANT_ADMIN'::text, 'STATE_ADMIN'::text, 'SUPER_ADMIN'::text, 'SYSTEM_ADMIN'::text]));

-- Atualizar política de gerenciamento de itens para incluir SYSTEM_ADMIN
DROP POLICY IF EXISTS "Manage items" ON public.items;
CREATE POLICY "Manage items" ON public.items
AS PERMISSIVE FOR ALL
TO public
USING (get_current_user_role() = ANY (ARRAY['PROFESSOR'::text, 'SUPERVISOR'::text, 'DIRETOR'::text, 'TENANT_ADMIN'::text, 'STATE_ADMIN'::text, 'SUPER_ADMIN'::text, 'SYSTEM_ADMIN'::text]));

-- Garantir que SYSTEM_ADMIN também possa ler exames
DROP POLICY IF EXISTS "Read exams" ON public.exams;
CREATE POLICY "Read exams" ON public.exams
AS PERMISSIVE FOR SELECT
TO public
USING (
  (tenant_id = get_current_tenant_id()) OR 
  (school_id = get_current_tenant_id()) OR 
  (get_current_user_role() = ANY (ARRAY['SUPER_ADMIN'::text, 'STATE_ADMIN'::text, 'SYSTEM_ADMIN'::text, 'MASTER_SAAS'::text])) OR 
  ((tenant_id IS NULL) AND (school_id IS NULL) AND (get_current_user_role() = ANY (ARRAY['PROFESSOR'::text, 'SUPERVISOR'::text, 'DIRETOR'::text, 'TENANT_ADMIN'::text])))
);

-- Atualizar políticas de escrita para SYSTEM_ADMIN em outras tabelas críticas
DROP POLICY IF EXISTS "Professor grade" ON public.exam_results;
CREATE POLICY "Professor grade" ON public.exam_results
AS PERMISSIVE FOR ALL
TO public
USING (get_current_user_role() = ANY (ARRAY['PROFESSOR'::text, 'SUPERVISOR'::text, 'DIRETOR'::text, 'TENANT_ADMIN'::text, 'STATE_ADMIN'::text, 'SUPER_ADMIN'::text, 'SYSTEM_ADMIN'::text]));

DROP POLICY IF EXISTS "Manage risk_alerts" ON public.risk_alerts;
CREATE POLICY "Manage risk_alerts" ON public.risk_alerts
AS PERMISSIVE FOR ALL
TO public
USING (get_current_user_role() = ANY (ARRAY['PROFESSOR'::text, 'SUPERVISOR'::text, 'DIRETOR'::text, 'TENANT_ADMIN'::text, 'STATE_ADMIN'::text, 'SUPER_ADMIN'::text, 'SYSTEM_ADMIN'::text]));

DROP POLICY IF EXISTS "Manage interventions" ON public.interventions;
CREATE POLICY "Manage interventions" ON public.interventions
AS PERMISSIVE FOR ALL
TO public
USING (get_current_user_role() = ANY (ARRAY['PROFESSOR'::text, 'SUPERVISOR'::text, 'DIRETOR'::text, 'TENANT_ADMIN'::text, 'STATE_ADMIN'::text, 'SUPER_ADMIN'::text, 'SYSTEM_ADMIN'::text]));
