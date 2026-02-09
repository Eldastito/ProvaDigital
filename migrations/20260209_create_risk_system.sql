-- Migration: Create Risk Management Infrastructure
-- Tables: risk_alerts, interventions, notifications
-- Date: 2026-02-09

-- 1. RISK ALERTS
CREATE TABLE IF NOT EXISTS public.risk_alerts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    school_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    factors JSONB DEFAULT '[]'::jsonb,
    interventions JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'IGNORED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    notes TEXT
);

-- 2. INTERVENTIONS
CREATE TABLE IF NOT EXISTS public.interventions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    alert_id TEXT REFERENCES public.risk_alerts(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    responsible_id TEXT,
    responsible_name TEXT,
    target TEXT NOT NULL, -- PARENT, TEACHER, etc
    priority TEXT NOT NULL, -- URGENT, HIGH, etc
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT NOT NULL, -- ID do Coordenador, Diretor ou Pai
    type TEXT NOT NULL, -- RISK_ALERT, etc
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS POLICIES
ALTER TABLE public.risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated access (simplified for MVP, can be refined based on roles)
CREATE POLICY "Allow authenticated read/write risk_alerts" ON public.risk_alerts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read/write interventions" ON public.interventions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read/write notifications" ON public.notifications
    FOR ALL USING (auth.role() = 'authenticated');

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_risk_alerts_school ON public.risk_alerts(school_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON public.risk_alerts(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE (read = false);
