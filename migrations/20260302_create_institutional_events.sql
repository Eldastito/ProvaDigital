-- Migration: Create institutional_events table
-- Description: Standardizes macro institutional events with date range support and Supabase persistence.

CREATE TABLE IF NOT EXISTS public.institutional_events (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    school_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    blocks_scheduling BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL
);

-- RLS
ALTER TABLE public.institutional_events ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS institutional_events_select_policy ON public.institutional_events;
CREATE POLICY institutional_events_select_policy ON public.institutional_events
    FOR SELECT USING (true); -- Accessible to all for now as per project pattern

DROP POLICY IF EXISTS institutional_events_insert_policy ON public.institutional_events;
CREATE POLICY institutional_events_insert_policy ON public.institutional_events
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS institutional_events_update_policy ON public.institutional_events;
CREATE POLICY institutional_events_update_policy ON public.institutional_events
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS institutional_events_delete_policy ON public.institutional_events;
CREATE POLICY institutional_events_delete_policy ON public.institutional_events
    FOR DELETE USING (true);

-- Comments
COMMENT ON TABLE public.institutional_events IS 'Macro institutional events (holidays, recesses, meetings)';
