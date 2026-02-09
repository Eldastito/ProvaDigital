-- Migration: Create exam_events table for Live Monitoring
-- Date: 2026-02-09

CREATE TABLE IF NOT EXISTS public.exam_events (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    exam_id TEXT REFERENCES public.exams(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    duration INTEGER DEFAULT 60, -- em minutos
    meta_info JSONB DEFAULT '{}'::jsonb
);

-- RLS Policies
ALTER TABLE public.exam_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON public.exam_events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow administrators full access" ON public.exam_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('SYSTEM_ADMIN', 'SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN', 'DIRETOR', 'SUPERVISOR')
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_exam_events_status ON public.exam_events(status);
CREATE INDEX IF NOT EXISTS idx_exam_events_class ON public.exam_events(class_id);
