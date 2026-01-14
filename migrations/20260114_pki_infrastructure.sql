-- Migration: 20260114_pki_infrastructure
-- Description: Adds tables for Public Key Infrastructure (Identity Keys & Encrypted Session Keys)

-- 1. User Public Keys (Identity)
-- Stores the RSA-OAEP Public Key for each user. Private key stays in browser IndexedDB.
CREATE TABLE IF NOT EXISTS public.user_public_keys (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    public_key_json JSONB NOT NULL, -- The exported JWK of the public key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_public_keys ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read public keys (needed for encryption)
CREATE POLICY "Public keys are visible to everyone" 
ON public.user_public_keys FOR SELECT 
USING (true);

-- Users can only insert/update their own key
CREATE POLICY "Users can manage their own public key" 
ON public.user_public_keys FOR ALL 
USING (auth.uid() = user_id);


-- 2. Exam Secure Keys (Digital Envelopes)
-- Stores the AES Session Key encrypted with the Student's Public Key.
CREATE TABLE IF NOT EXISTS public.exam_secure_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- The Wrapped AES Key (Encrypted with RSA-OAEP)
    wrapped_key TEXT NOT NULL, -- Base64 encoded
    
    -- Metadata
    key_fingerprint TEXT, -- Optional: hash of the key verify integrity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(exam_id, student_id)
);

-- Enable RLS
ALTER TABLE public.exam_secure_keys ENABLE ROW LEVEL SECURITY;

-- Policies
-- Professors (allocators) can insert keys
CREATE POLICY "Professors can insert secure keys" 
ON public.exam_secure_keys FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exams e 
        WHERE e.id = exam_id AND e.owner_id = auth.uid()
    ) OR 
    auth.role() = 'service_role' -- Fallback
);

-- Students can select ONLY their own keys
CREATE POLICY "Students can read their own secure keys" 
ON public.exam_secure_keys FOR SELECT 
USING (auth.uid() = student_id);
