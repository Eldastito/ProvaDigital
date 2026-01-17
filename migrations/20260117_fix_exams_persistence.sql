-- REPAIR (ULTIMATE): Fix Missing Columns in public.exams
-- Use this if you are getting "Could not find column X in schema cache"

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS creator_id TEXT;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS items_config JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS class_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'SOMATIVO';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS target_question_count INTEGER DEFAULT 0;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS max_score NUMERIC DEFAULT 10.0;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS shuffle_items BOOLEAN DEFAULT TRUE;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Optional: Add Foreign Key for creator_id to ensure integrity
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exams_creator_id_fkey') THEN
        ALTER TABLE public.exams ADD CONSTRAINT exams_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);
    END IF;
END $$;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload_schema';
