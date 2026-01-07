-- Create Tables for Risk Management System

-- 1. Risk Alerts
CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    student_name TEXT NOT NULL,
    school_id UUID NOT NULL,
    class_id UUID NOT NULL,
    risk_level TEXT NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
    risk_score NUMERIC NOT NULL,
    factors JSONB NOT NULL DEFAULT '[]', -- Array of detection factors
    interventions JSONB NOT NULL DEFAULT '[]', -- Array of suggested interventions
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'RESOLVED', 'IGNORED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    notes TEXT
);

-- 2. Interventions (Actions taken)
CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES risk_alerts(id),
    action TEXT NOT NULL,
    description TEXT,
    responsible_id UUID,
    responsible_name TEXT,
    target TEXT NOT NULL, -- 'PARENT', 'TEACHER', 'COORDINATOR', etc.
    priority TEXT NOT NULL, -- 'URGENT', 'HIGH', etc.
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notifications (In-App)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Recipient
    type TEXT NOT NULL, -- 'RISK_ALERT', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Context data (e.g. { alertId: ... })
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies (Optional - Basic Security)
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users (Adjust as strictly needed)
CREATE POLICY "Enable all access for authenticated users" ON risk_alerts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON interventions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON notifications FOR ALL USING (auth.role() = 'authenticated');
