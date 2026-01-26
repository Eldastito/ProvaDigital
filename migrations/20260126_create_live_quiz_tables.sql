-- Migration: Create Live Quiz Tables
-- Date: 2026-01-26
-- Purpose: Separate Live Interactive Quiz from formal exams

-- 1. Create live_quiz_sessions table
CREATE TABLE IF NOT EXISTS live_quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    title TEXT DEFAULT 'Quiz Interativo - Ao Vivo',
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Session Config
    class_name TEXT NOT NULL,
    max_participants INTEGER DEFAULT 50,
    session_code TEXT UNIQUE NOT NULL,
    
    -- Quiz Content
    item_ids TEXT[] DEFAULT '{}',
    shuffle_questions BOOLEAN DEFAULT true,
    
    -- Session State
    status TEXT DEFAULT 'WAITING', -- WAITING | ACTIVE | FINISHED
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    
    -- Participants (stored as JSONB for flexibility)
    participants JSONB DEFAULT '[]',
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- 2. Create live_quiz_results table
CREATE TABLE IF NOT EXISTS live_quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES live_quiz_sessions(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    participant_id TEXT,
    
    score INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ DEFAULT now(),
    
    -- Anti-Fraud
    violations JSONB DEFAULT '[]',
    
    UNIQUE(session_id, participant_name)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_quiz_tenant ON live_quiz_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_code ON live_quiz_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_live_quiz_status ON live_quiz_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_quiz_creator ON live_quiz_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_results_session ON live_quiz_results(session_id);

-- 4. Enable RLS
ALTER TABLE live_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_quiz_results ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for live_quiz_sessions
DROP POLICY IF EXISTS "Enable all access for live quiz sessions" ON live_quiz_sessions;
CREATE POLICY "Enable all access for live quiz sessions" ON live_quiz_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. RLS Policies for live_quiz_results
DROP POLICY IF EXISTS "Enable all access for live quiz results" ON live_quiz_results;
CREATE POLICY "Enable all access for live quiz results" ON live_quiz_results
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. Migrate existing quiz sessions from exams table
-- This finds exams that look like live quizzes and moves them
INSERT INTO live_quiz_sessions (
    id, tenant_id, creator_id, title, class_name,
    item_ids, status, created_at, session_code
)
SELECT 
    id, 
    tenant_id, 
    creator_id, 
    title,
    COALESCE('Turma Demo - ' || subject, 'Turma Demo') as class_name,
    CASE 
        WHEN items_config IS NOT NULL THEN items_config::text[]
        ELSE '{}'::text[]
    END as item_ids,
    CASE status::text
        WHEN 'ACTIVE' THEN 'ACTIVE'
        WHEN 'COMPLETED' THEN 'FINISHED'
        ELSE 'WAITING'
    END as status,
    created_at,
    SUBSTRING(id::text, 1, 8) as session_code -- Generate code from ID
FROM exams
WHERE (title ILIKE '%Quiz Interativo%' OR title ILIKE '%Ao Vivo%')
ON CONFLICT (id) DO NOTHING;

-- 8. Clean up migrated exams
-- Comment this out if you want to review migration first
-- DELETE FROM exams WHERE (title ILIKE '%Quiz Interativo%' OR title ILIKE '%Ao Vivo%');
