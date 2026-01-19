-- FIX: Force tenant_id to TEXT explicitly
-- Run this if the "Nuclear" script failed or if you prefer to modify the existing table.

-- 1. Disable RLS temporarily to avoid policy checks during alter (optional but safe)
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. Alter column type to TEXT (This allows 't1' values)
ALTER TABLE audit_logs ALTER COLUMN tenant_id TYPE TEXT USING tenant_id::text;

-- 3. Update Trigger Function ensuring it handles the text type
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

    SELECT email INTO v_actor_email FROM users WHERE id = auth.uid() LIMIT 1;
    IF v_actor_email IS NULL THEN v_actor_email := 'unknown'; END IF;

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

-- 4. Re-enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Drop triggers/policies if they are somehow duplicated or broken, and recreate
DROP TRIGGER IF EXISTS trg_exam_result_audit ON exam_results;
CREATE TRIGGER trg_exam_result_audit
AFTER UPDATE OR DELETE ON exam_results
FOR EACH ROW EXECUTE FUNCTION log_exam_result_audit();
