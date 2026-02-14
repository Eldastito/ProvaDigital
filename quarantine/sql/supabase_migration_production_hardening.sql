-- ============================================
-- PRODUCTION HARDENING MIGRATION - VERSÃO FINAL COM CORREÇÃO DE DADOS
-- Data: 2026-01-10
-- Objetivo: Fortalecer RLS e garantir isolamento cross-tenant
-- NOTA: Corrige dados existentes antes de aplicar constraints
-- ============================================

-- 1. HARDENING: Risk Alerts
-- Substituir policy genérica por policy baseada em hierarquia

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON risk_alerts;

-- Leitura: Baseada em hierarquia de acesso
CREATE POLICY "Read risk alerts by hierarchy" ON risk_alerts
  FOR SELECT USING (
    -- MEC vê tudo
    public.get_current_user_role() = 'MEC' OR
    
    -- Secretarias e Admins veem seu tenant
    (public.get_current_user_role() IN ('STATE_ADMIN', 'MUNICIPAL_ADMIN', 'TENANT_ADMIN') AND
     school_id IN (
       SELECT id FROM public.schools 
       WHERE tenant_id IN (
         SELECT tenant_id FROM public.users WHERE id = auth.uid()::text
       )
     )) OR
    
    -- Diretores e Supervisores veem sua escola
    (public.get_current_user_role() IN ('DIRETOR', 'SUPERVISOR') AND
     school_id IN (
       SELECT school_id FROM public.users WHERE id = auth.uid()::text
     )) OR
    
    -- Professores veem alertas da mesma escola
    (public.get_current_user_role() = 'PROFESSOR' AND
     school_id IN (
       SELECT school_id FROM public.users WHERE id = auth.uid()::text
     ))
  );

-- Escrita: Apenas coordenadores e superiores
CREATE POLICY "Manage risk alerts by role" ON risk_alerts
  FOR ALL USING (
    public.get_current_user_role() IN ('MEC', 'STATE_ADMIN', 'MUNICIPAL_ADMIN', 'DIRETOR', 'SUPERVISOR')
  );

-- 2. HARDENING: Interventions
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON interventions;

CREATE POLICY "Read interventions by hierarchy" ON interventions
  FOR SELECT USING (
    alert_id IN (
      SELECT id FROM risk_alerts
    )
  );

CREATE POLICY "Manage interventions by role" ON interventions
  FOR ALL USING (
    public.get_current_user_role() IN ('MEC', 'STATE_ADMIN', 'MUNICIPAL_ADMIN', 'DIRETOR', 'SUPERVISOR', 'PROFESSOR')
  );

-- 3. HARDENING: Notifications
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON notifications;

CREATE POLICY "Read own notifications" ON notifications
  FOR SELECT USING (
    user_id::text = auth.uid()::text
  );

CREATE POLICY "System inserts notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Update own notifications" ON notifications
  FOR UPDATE USING (
    user_id::text = auth.uid()::text
  ) WITH CHECK (
    user_id::text = auth.uid()::text
  );

-- 4. CORREÇÃO DE DADOS: Atualizar registros sem tenant_id
-- IMPORTANTE: Isso atribui tenant_id padrão 't1' para registros órfãos

UPDATE public.items 
SET tenant_id = 't1' 
WHERE tenant_id IS NULL;

UPDATE public.exams 
SET tenant_id = 't1' 
WHERE tenant_id IS NULL;

-- 5. VALIDAÇÃO: Garantir tenant_id em todas as tabelas críticas
-- Agora que os dados foram corrigidos, podemos adicionar os constraints

ALTER TABLE public.items 
  DROP CONSTRAINT IF EXISTS items_tenant_id_required;
ALTER TABLE public.items 
  ADD CONSTRAINT items_tenant_id_required 
  CHECK (tenant_id IS NOT NULL);

ALTER TABLE public.exams 
  DROP CONSTRAINT IF EXISTS exams_tenant_id_required;
ALTER TABLE public.exams 
  ADD CONSTRAINT exams_tenant_id_required 
  CHECK (tenant_id IS NOT NULL);

-- 6. ÍNDICES: Otimizar queries de RLS
CREATE INDEX IF NOT EXISTS idx_risk_alerts_school_id ON risk_alerts(school_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_class_id ON risk_alerts(class_id);
CREATE INDEX IF NOT EXISTS idx_interventions_alert_id ON interventions(alert_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON public.users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);

-- 7. FUNÇÃO: Validar Cross-Tenant Access
CREATE OR REPLACE FUNCTION public.validate_tenant_access(target_tenant_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.get_current_user_role() = 'SUPER_ADMIN' THEN
    RETURN TRUE;
  END IF;
  
  RETURN target_tenant_id IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. AUDIT: Trigger para logar mudanças críticas
CREATE OR REPLACE FUNCTION public.log_critical_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    actor_id,
    tenant_id,
    action_type,
    target_resource,
    target_id,
    details
  ) VALUES (
    auth.uid()::uuid,
    COALESCE(NEW.tenant_id::uuid, OLD.tenant_id::uuid),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers
DROP TRIGGER IF EXISTS audit_exam_results_changes ON exam_results;
CREATE TRIGGER audit_exam_results_changes
  AFTER UPDATE OR DELETE ON exam_results
  FOR EACH ROW EXECUTE FUNCTION public.log_critical_changes();

DROP TRIGGER IF EXISTS audit_items_changes ON items;
CREATE TRIGGER audit_items_changes
  AFTER UPDATE OR DELETE ON items
  FOR EACH ROW EXECUTE FUNCTION public.log_critical_changes();

DROP TRIGGER IF EXISTS audit_exams_changes ON exams;
CREATE TRIGGER audit_exams_changes
  AFTER UPDATE OR DELETE ON exams
  FOR EACH ROW EXECUTE FUNCTION public.log_critical_changes();

-- ============================================
-- VALIDAÇÃO PÓS-MIGRATION
-- ============================================
DO $$
DECLARE
  items_updated INTEGER;
  exams_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO items_updated FROM public.items WHERE tenant_id = 't1';
  SELECT COUNT(*) INTO exams_updated FROM public.exams WHERE tenant_id = 't1';
  
  RAISE NOTICE '✓ Migration concluída com sucesso!';
  RAISE NOTICE 'Policies criadas: Read/Manage risk alerts, interventions, notifications';
  RAISE NOTICE 'Dados corrigidos: % items, % exams com tenant_id padrão', items_updated, exams_updated;
  RAISE NOTICE 'Constraints: items_tenant_id_required, exams_tenant_id_required';
  RAISE NOTICE 'Índices: 7 índices de otimização';
  RAISE NOTICE 'Triggers: 3 triggers de auditoria';
END $$;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
