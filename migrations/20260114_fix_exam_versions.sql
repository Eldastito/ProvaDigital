-- Fix for "Could not find the 'cover_config' column" error
-- Adding missing JSONB columns to exam_versions table

ALTER TABLE exam_versions 
ADD COLUMN IF NOT EXISTS cover_config JSONB DEFAULT '{}'::jsonb;

ALTER TABLE exam_versions 
ADD COLUMN IF NOT EXISTS grading_config JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS allows insert on these columns (usually covered by generic INSERT policy, but good to verify)
-- Re-applying comments to force schema cache refresh if needed
COMMENT ON COLUMN exam_versions.cover_config IS 'Configuration for the exam cover page (instructions, title override)';
COMMENT ON COLUMN exam_versions.grading_config IS 'Configuration for grading weights and logic';
