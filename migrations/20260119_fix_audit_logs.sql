-- Fix: Create Audit Logs table (Required for triggers)
-- Reference: Phase 5 Migration

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT, -- Made nullable temporarily just in case
    actor_id UUID,
    actor_email TEXT,
    action_type TEXT NOT NULL,
    target_resource TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy (Simplified for immediate fix)
DROP POLICY IF EXISTS audit_logs_access ON audit_logs;
CREATE POLICY audit_logs_access ON audit_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
