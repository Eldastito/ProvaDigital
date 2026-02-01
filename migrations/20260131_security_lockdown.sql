-- ==============================================================================
-- MIGRATION: 20260131_security_lockdown.sql
-- Description: Auditoria de Segurança - Remove políticas permissivas e bloqueia acesso público
-- Severity: HIGH
-- ==============================================================================

-- 1. REVOKING PERMISSIVE ACCESS ON AUDIT LOGS
-- Anteriormente: USING (true) -> Permitiria que qualquer usuário visse logs de todos
DROP POLICY IF EXISTS "audit_logs_access" ON audit_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON audit_logs;

-- Nova Política: Apenas usuários autenticados veem SEUS PRÓPRIOS logs (se tiver tenant_id = user_id)
-- OU Admins/Staff autorizados (Exemplo simplificado para MVP)
CREATE POLICY "Strict access for audit logs" 
ON audit_logs FOR SELECT 
USING (
    -- Só vê logs do sistema se for STAFF
    (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN')))
);

-- 2. LOCKING DOWN EXAM SCHEDULES
-- Anteriormente: USING (true)
DROP POLICY IF EXISTS "exam_schedules_select_policy" ON exam_schedules;
DROP POLICY IF EXISTS "exam_schedules_update_policy" ON exam_schedules;
DROP POLICY IF EXISTS "exam_schedules_delete_policy" ON exam_schedules;

CREATE POLICY "Enable read for authenticated only" 
ON exam_schedules FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write for Staff only" 
ON exam_schedules FOR ALL 
USING (
    auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role IN ('PROFESSOR', 'DIRETOR', 'COORDENADOR', 'ADMIN'))
);

-- 3. AUDIT TRAIL
INSERT INTO public.audit_logs (
    id, tenant_id, action_type, details, created_at
) VALUES (
    gen_random_uuid(), 
    'system', 
    'SECURITY_LOCKDOWN', 
    '{"migration": "20260131_security_lockdown.sql", "status": "ENFORCED", "reason": "PenTest Findings"}'::jsonb, 
    NOW()
);
