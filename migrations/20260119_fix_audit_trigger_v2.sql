-- Fix: Make audit trigger handle DELETE operations correctly and safe casting
-- The previous function likely used NEW on DELETE (which is NULL) causing issues, or implicit casting of 't1' to UUID.

CREATE OR REPLACE FUNCTION log_exam_result_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id TEXT;
    v_target_id TEXT;
    v_details JSONB;
    v_actor_email TEXT;
BEGIN
    -- Handle DELETE vs UPDATE
    IF (TG_OP = 'DELETE') THEN
        v_tenant_id := OLD.tenant_id::text;
        v_target_id := OLD.id::text;
        v_details := jsonb_build_object('old', row_to_json(OLD));
    ELSE
        v_tenant_id := NEW.tenant_id::text;
        v_target_id := NEW.id::text;
        v_details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
    END IF;

    -- Fetch actor email safely
    SELECT email INTO v_actor_email FROM users WHERE id = auth.uid() LIMIT 1;

    -- Insert into audit_logs (ensuring tenant_id is Text)
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

-- Recreate trigger to ensure it binds to the updated function
DROP TRIGGER IF EXISTS trg_exam_result_audit ON exam_results;
CREATE TRIGGER trg_exam_result_audit
AFTER UPDATE OR DELETE ON exam_results
FOR EACH ROW EXECUTE FUNCTION log_exam_result_audit();
