-- Create arcade_games table
CREATE TABLE IF NOT EXISTS public.arcade_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Geral',
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tenant_id TEXT REFERENCES public.tenants(id),
    school_id TEXT REFERENCES public.schools(id) -- Optional: specific to a school?
);

-- RLS
ALTER TABLE public.arcade_games ENABLE ROW LEVEL SECURITY;

-- Read: Authenticated users (Students, Professors, Admins)
CREATE POLICY "Read arcade games" ON public.arcade_games
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Write: Admins only (Tenant Admin, Super Admin, School Admin)
CREATE POLICY "Manage arcade games" ON public.arcade_games
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN', 'SCHOOL_ADMIN', 'DIRECTOR')
        )
    );
