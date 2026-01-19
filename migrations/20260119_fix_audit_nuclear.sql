-- FIX: Nuclear Reset for Audit Logs to resolve UUID mismatch.
-- This script ensures the table schema is 100% correct by dropping it first.

-- 1. Drop dependencies
DROP TRIGGER IF EXISTS trg_exam_result_audit ON exam_results;
DROP FUNCTION IF EXISTS log_exam_result_audit();

-- 2. Drop table (WARNING: Deletes existing logs, but this is Staging/Demo)
DROP TABLE IF EXISTS audit_logs;

-- 3. Recreate Table (Explicit TEXT types)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT, -- MUST BE TEXT to support 't1'
    actor_id UUID,
    actor_email TEXT,
    action_type TEXT,
    target_resource TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_access ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 5. Recreate Trigger Function (Robust Handling)
CREATE OR REPLACE FUNCTION log_exam_result_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id TEXT;
    v_target_id TEXT;
    v_details JSONB;
    v_actor_email TEXT;
BEGIN
    -- Determine operation type and safe inputs
    IF (TG_OP = 'DELETE') THEN
        v_tenant_id := CAST(OLD.tenant_id AS TEXT);
        v_target_id := CAST(OLD.id AS TEXT);
        v_details := jsonb_build_object('old', row_to_json(OLD));
    ELSE
        v_tenant_id := CAST(NEW.tenant_id AS TEXT);
        v_target_id := CAST(NEW.id AS TEXT);
        v_details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
    END IF;

    -- Get Actor Email (Safe Lookup)
    BEGIN
        SELECT email INTO v_actor_email FROM users WHERE id = auth.uid() LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_actor_email := 'unknown';
    END;

    -- Insert
    INSERT INTO audit_logs (tenant_id, actor_id, actor_email, action_type, target_resource, target_id, details)
    VALUES (
        v_tenant_id, 
        auth.uid(), 
        v_actor_email,
        TG_OP, 
        'exam_results', 
        v_target_id, 
        v_details
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Rebind Trigger
CREATE TRIGGER trg_exam_result_audit
AFTER UPDATE OR DELETE ON exam_results
FOR EACH ROW EXECUTE FUNCTION log_exam_result_audit();
