-- Tabela de Auditoria (Imutável)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL, -- Quem fez (User ID)
    actor_email TEXT, -- Snapshot do email (caso user seja deletado)
    school_id UUID, -- Contexto da escola
    tenant_id UUID NOT NULL, -- Contexto do Tenant
    action_type TEXT NOT NULL, -- LOGIN, UPDATE_GRADE, DELETE_USER, EXPORT_DATA
    target_resource TEXT NOT NULL, -- 'exam_submissions', 'users', 'settings'
    target_id TEXT, -- ID do objeto afetado
    details JSONB, -- { old_value: '5.0', new_value: '8.0', reason: 'Erro de digitação' }
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para busca rápida por escola ou ator
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_school ON audit_logs(school_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS: Apenas Super Admin e Tenant Admin podem ver logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin vê tudo" 
    ON audit_logs FOR SELECT 
    USING ( auth.jwt() ->> 'role' = 'SUPER_ADMIN' );

CREATE POLICY "Tenant Admin vê seu tenant" 
    ON audit_logs FOR SELECT 
    USING ( 
        auth.jwt() ->> 'role' = 'TENANT_ADMIN' AND 
        tenant_id::text = (auth.jwt() ->> 'tenant_id')
    );

-- Ninguém pode alterar ou deletar logs (Append Only)
CREATE POLICY "Ninguém altera logs" 
    ON audit_logs FOR UPDATE 
    USING ( false );

CREATE POLICY "Ninguém deleta logs" 
    ON audit_logs FOR DELETE 
    USING ( false );

-- Insert aberto para sistema (via service role ou funções seguras)
CREATE POLICY "Sistema insere logs" 
    ON audit_logs FOR INSERT 
    WITH CHECK ( true );
