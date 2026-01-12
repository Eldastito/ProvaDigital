-- Phase 3: Application & Anti-Fraud
-- Date: 2026-01-12

-- 1. Add scheduling columns to exam_versions
ALTER TABLE public.exam_versions 
ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;

-- 2. Create table for exam attempts (student sessions)
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_version_id UUID NOT NULL REFERENCES public.exam_versions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    status TEXT DEFAULT 'started', -- started | submitted | flagged | timed_out
    started_at TIMESTAMPTZ DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    last_ping_at TIMESTAMPTZ DEFAULT now(),
    violation_count INTEGER DEFAULT 0,
    ip_address TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Create table for anti-fraud events
CREATE TABLE IF NOT EXISTS public.exam_attempt_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- focus_lost | focus_gained | screenshot | devtools_open | copy_paste
    severity TEXT DEFAULT 'warning', -- info | warning | critical
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS for exam_attempts
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own attempts" ON public.exam_attempts;
CREATE POLICY "Students can view own attempts"
    ON public.exam_attempts
    FOR SELECT
    USING (student_id = auth.uid()::text OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Students can start own attempts" ON public.exam_attempts;
CREATE POLICY "Students can start own attempts"
    ON public.exam_attempts
    FOR INSERT
    WITH CHECK (student_id = auth.uid()::text OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Students can update own attempts" ON public.exam_attempts;
CREATE POLICY "Students can update own attempts"
    ON public.exam_attempts
    FOR UPDATE
    USING (student_id = auth.uid()::text OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Teachers can view attempts for their exams" ON public.exam_attempts;
CREATE POLICY "Teachers can view attempts for their exams"
    ON public.exam_attempts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_versions
            JOIN public.exams ON exams.id = exam_versions.exam_id
            WHERE exam_versions.id = exam_attempts.exam_version_id
            AND (exams.creator_id = auth.uid()::text OR auth.role() = 'authenticated')
        )
    );

-- 5. RLS for exam_attempt_events
ALTER TABLE public.exam_attempt_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can log own events" ON public.exam_attempt_events;
CREATE POLICY "Students can log own events"
    ON public.exam_attempt_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exam_attempts
            WHERE exam_attempts.id = exam_attempt_events.attempt_id
            AND (exam_attempts.student_id = auth.uid()::text OR auth.role() = 'service_role')
        )
    );

DROP POLICY IF EXISTS "Teachers can view events for their exams" ON public.exam_attempt_events;
CREATE POLICY "Teachers can view events for their exams"
    ON public.exam_attempt_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_attempts
            JOIN public.exam_versions ON exam_versions.id = exam_attempts.exam_version_id
            JOIN public.exams ON exams.id = exam_versions.exam_id
            WHERE exam_attempts.id = exam_attempt_events.attempt_id
            AND (exams.creator_id = auth.uid()::text OR auth.role() = 'authenticated')
        )
    );

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_exam_attempts_version_id ON public.exam_attempts(exam_version_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempt_events_attempt_id ON public.exam_attempt_events(attempt_id);

-- 7. RPCs
CREATE OR REPLACE FUNCTION public.increment_violation_count(attempt_id_input UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.exam_attempts
    SET violation_count = violation_count + 1
    WHERE id = attempt_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
