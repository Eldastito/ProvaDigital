-- Migration: 20260203_fix_pki_rls
-- Description: Corrects RLS policies for exam_secure_keys and exam_server_keys to use creator_id instead of owner_id.

-- 1. Fix exam_secure_keys
DROP POLICY IF EXISTS "Professors can insert secure keys" ON public.exam_secure_keys;
CREATE POLICY "Professors can insert secure keys" 
ON public.exam_secure_keys FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exams e 
        WHERE e.id = exam_id AND e.creator_id = auth.uid()::text
    ) OR 
    auth.role() = 'service_role'
);

-- 2. Fix exam_server_keys
DROP POLICY IF EXISTS "Professors can insert server keys" ON public.exam_server_keys;
CREATE POLICY "Professors can insert server keys" 
ON public.exam_server_keys FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exams e 
        WHERE e.id = (exam_id::text) AND e.creator_id = auth.uid()::text
    )
);

-- Note: exam_server_keys uses UUID for exam_id in its definition but exams uses TEXT.
-- Making sure cast is handled if needed.
