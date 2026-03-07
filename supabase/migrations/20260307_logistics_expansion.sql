-- Migration: Expand exam_events and create classroom_kits
-- Date: 2026-03-07

-- Expand exam_events to include full logistics lifecycle
ALTER TABLE public.exam_events 
    DROP CONSTRAINT IF EXISTS exam_events_status_check;

ALTER TABLE public.exam_events 
    ADD COLUMN IF NOT EXISTS scheduled_exam_id TEXT,
    ADD COLUMN IF NOT EXISTS school_id TEXT,
    ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 't1',
    ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- Garantir que o status aceite novos valores do ciclo de vida
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_events_status_check') THEN
        ALTER TABLE public.exam_events DROP CONSTRAINT exam_events_status_check;
    END IF;
END $$;

ALTER TABLE public.exam_events 
    ADD CONSTRAINT exam_events_status_check 
    CHECK (status IN (
        'PLANNED', 
        'PREPARING', 
        'READY', 
        'IN_TRANSIT', 
        'AT_SCHOOL', 
        'IN_PROGRESS', 
        'COMPLETED', 
        'DADOS_COLETADOS', 
        'SYNCED', 
        'ARCHIVED'
    ));

-- Create classroom_kits for room-level control
CREATE TABLE IF NOT EXISTS public.classroom_kits (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    event_id TEXT REFERENCES public.exam_events(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL,
    professor_id TEXT,
    tablet_ids TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'PREPARING' CHECK (status IN ('PREPARING', 'DISTRIBUTED', 'COLLECTED', 'SYNCED')),
    security_payload JSONB DEFAULT '{}'::jsonb, -- Contém as chaves encriptadas dos alunos
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- RLS for classroom_kits
ALTER TABLE public.classroom_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read kits" ON public.classroom_kits
    FOR SELECT USING (auth.role() = 'authenticated');

-- Indices
CREATE INDEX IF NOT EXISTS idx_classroom_kits_event ON public.classroom_kits(event_id);
CREATE INDEX IF NOT EXISTS idx_classroom_kits_class ON public.classroom_kits(class_id);
CREATE INDEX IF NOT EXISTS idx_classroom_kits_status ON public.classroom_kits(status);

-- Table for long-term tablet inventory persistence
CREATE TABLE IF NOT EXISTS public.tablets (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    serial_number TEXT UNIQUE NOT NULL,
    model TEXT,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'IN_USE', 'CHARGING', 'MAINTENANCE')),
    role TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (role IN ('ROUTER', 'PROFESSOR', 'COORDINATOR', 'STUDENT', 'AVAILABLE')),
    battery_level INTEGER DEFAULT 100,
    current_event_id TEXT,
    assigned_school_id TEXT,
    last_used TIMESTAMP WITH TIME ZONE,
    total_usage_count INTEGER DEFAULT 0,
    needs_maintenance BOOLEAN DEFAULT false,
    maintenance_reason TEXT,
    meta_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- RLS for tablets
ALTER TABLE public.tablets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read tablets" ON public.tablets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access to tablets" ON public.tablets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()::text
            AND users.role IN ('SYSTEM_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN', 'DIRETOR', 'SUPERVISOR')
        )
    );

-- Index for tablet serials
CREATE INDEX IF NOT EXISTS idx_tablets_serial ON public.tablets(serial_number);
CREATE INDEX IF NOT EXISTS idx_tablets_status ON public.tablets(status);
