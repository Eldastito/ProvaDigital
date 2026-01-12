-- Phase 5: Administration & BI Hardening

-- 1. Ensure Audit Logs table exists with Tenant isolation
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    actor_email TEXT,
    action_type TEXT NOT NULL, -- 'LOGIN', 'LOGOUT', 'UPDATE_GRADE', 'DELETE_ITEM', 'FEATURE_TOGGLE', etc.
    target_resource TEXT,      -- 'exam_results', 'items', 'users'
    target_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Tenant Admins and Super Admins can view audit logs
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE tenant_id = audit_logs.tenant_id 
            AND role IN ('TENANT_ADMIN', 'SUPER_ADMIN')
        )
    );

-- 2. Add Features (Capabilities) toggle to Tenants
-- If tenant_id 't1' is our default, let's ensure it has the field
ALTER TABLE IF EXISTS tenants ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{
    "ai_audit": true,
    "neuro_screening": true,
    "tablet_mode": true,
    "offline_sync": false,
    "bi_advanced": true
}';

-- 3. Automating Audit for Critical Tables (Example: Exam Results)
-- Function to log changes
CREATE OR REPLACE FUNCTION log_exam_result_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (tenant_id, actor_id, actor_email, action_type, target_resource, target_id, details)
    VALUES (
        NEW.tenant_id, 
        auth.uid(), 
        (SELECT email FROM users WHERE id = auth.uid() LIMIT 1),
        TG_OP, 
        'exam_results', 
        NEW.id::text, 
        jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Exam Results update
DROP TRIGGER IF EXISTS trg_exam_result_audit ON exam_results;
CREATE TRIGGER trg_exam_result_audit
AFTER UPDATE OR DELETE ON exam_results
FOR EACH ROW EXECUTE FUNCTION log_exam_result_audit();

-- 4. View for BI Aggregation (Score Trends)
CREATE OR REPLACE VIEW school_performance_trends AS
SELECT 
    v.tenant_id,
    e.school_id,
    s.name as school_name,
    v.subject,
    AVG(r.total_score) as avg_score,
    COUNT(r.id) as total_attempts,
    DATE_TRUNC('month', r.created_at) as trend_month
FROM exam_results r
JOIN exams e ON r.exam_id = e.id
JOIN schools s ON e.school_id = s.id
JOIN exam_versions v ON e.id = v.exam_id -- Assuming versions are tracked
GROUP BY 1, 2, 3, 4, 7;
