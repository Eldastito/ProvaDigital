-- Migration: 20260114_server_grading_keys
-- Description: Stores the unencrypted (or symmetrically encrypted) session keys for the Server to perform grading.
-- Security: Table is strictly locked down. Only Service Role can read.

CREATE TABLE IF NOT EXISTS public.exam_server_keys (
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE PRIMARY KEY,
    session_key_json JSONB NOT NULL, -- The exported AES-GCM JWK
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exam_server_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Professors (Exam Owners) can INSERT keys when sealing
CREATE POLICY "Professors can insert server keys" 
ON public.exam_server_keys FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exams e 
        WHERE e.id = exam_id AND e.owner_id = auth.uid()
    )
);

-- Policy: NO ONE can select (except Service Role, which bypasses RLS)
-- Explicitly creating a deny-all for public/authenticated users just to be safe, 
-- though enabling RLS without a Select policy achieves this.
-- We do NOT add a SELECT policy for 'authenticated' or 'anon'.

-- Policy: Service Role has full access (Implicit in Supabase, but good to document design intent)
