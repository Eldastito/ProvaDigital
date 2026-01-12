-- PHASE 4: RESULTS & ACCESSIBILITY MIGRATION

-- 1. Extend Users table for Accessibility Profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'special_needs') THEN
        ALTER TABLE public.users ADD COLUMN special_needs TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 2. Extend Exam Results for AI Feedback & Pedagogical Tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_results' AND column_name = 'pedagogical_feedback') THEN
        ALTER TABLE public.exam_results ADD COLUMN pedagogical_feedback TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_results' AND column_name = 'auto_grade_log') THEN
        ALTER TABLE public.exam_results ADD COLUMN auto_grade_log JSONB DEFAULT '{}';
    END IF;
END $$;

-- 3. Extend Exam Variants for UI/Rule Overrides
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_variants' AND column_name = 'accessibility_rules') THEN
        ALTER TABLE public.exam_variants ADD COLUMN accessibility_rules JSONB DEFAULT '{}';
    END IF;
END $$;

-- 4. RLS Re-validation (Ensure users can see their own special needs/feedback)
-- Note: users table usually has broad RLS for authentication, but let's be explicit if needed.
-- pedagogical_feedback is sensitive, but usually viewed by the student or teacher.

COMMENT ON COLUMN public.users.special_needs IS 'Array of condition codes (TEA, TDAH, DISLEXIA, etc) for accessibility matching.';
COMMENT ON COLUMN public.exam_results.pedagogical_feedback IS 'AI-generated pedagogical tips and justifications for the student performance.';
