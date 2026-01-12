-- Migration: Item Bank Hardening (Accessibility & Multimedia)
-- Date: 2026-01-11

DO $$
BEGIN
    -- 1. Add is_accessible column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='is_accessible') THEN
        ALTER TABLE public.items ADD COLUMN is_accessible BOOLEAN DEFAULT FALSE;
    END IF;

    -- 2. Add accessibility_instructions column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='accessibility_instructions') THEN
        ALTER TABLE public.items ADD COLUMN accessibility_instructions TEXT;
    END IF;

    -- 3. Add multimedia column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='multimedia') THEN
        ALTER TABLE public.items ADD COLUMN multimedia JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Update existing items to have a default lifecycle_status if missing (should already be covered but for safety)
UPDATE public.items SET lifecycle_status = 'APPROVED' WHERE lifecycle_status IS NULL;
