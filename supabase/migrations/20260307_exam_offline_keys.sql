-- Create table for storing offline exam encryption keys securely
CREATE TABLE IF NOT EXISTS public.exam_offline_keys (
    exam_id TEXT PRIMARY KEY REFERENCES public.exams(id) ON DELETE CASCADE,
    key_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- RLS Configuration
ALTER TABLE public.exam_offline_keys ENABLE ROW LEVEL SECURITY;

-- 1. System/Admin Full Access
CREATE POLICY "Admin full access exam_offline_keys" ON public.exam_offline_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'DIRETOR', 'SUPERVISOR')
        )
    );

-- 2. Coordinator Access: Can SELECT only the keys for exams in their tenant/school
CREATE POLICY "Coordinator read exam_offline_keys" ON public.exam_offline_keys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.exams e ON e.id = exam_offline_keys.exam_id
            WHERE u.id = auth.uid()::text
            AND u.role = 'COOR_PEDAGOGICO'
            AND u.tenant_id = e.tenant_id
        )
    );

-- Note: PROFESSOR and ALUNO intentionally do NOT have access.
-- The key must be passed via QR/Mesh offline.

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exam_offline_keys_created_at ON public.exam_offline_keys(created_at);
