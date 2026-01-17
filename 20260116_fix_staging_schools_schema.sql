-- FIX: Add missing 'resources' column to schools table
-- This fixes the error 'Could not find the resources column of schools' in Staging/Production

ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '{}'::jsonb;

-- Optional: Comment on column
COMMENT ON COLUMN public.schools.resources IS 'Stores infrastructure flags: {internet: true, lab: false, ...}';
