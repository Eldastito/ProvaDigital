-- FIX: Add missing 'status' column to exam_versions table
-- User encountered "Could not find the 'status' column of 'exam_versions'" error.

ALTER TABLE public.exam_versions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Validating existence of other potential missing columns based on TypeScript interface
ALTER TABLE public.exam_versions 
ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.exam_versions 
ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN public.exam_versions.status IS 'draft | published | archived';
