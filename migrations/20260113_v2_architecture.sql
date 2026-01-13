-- ==============================================================================
-- MIGRATION: V2 SYSTEM EVOLUTION (IDEMPOTENT FIX)
-- Features: Item Versioning, Exam Variants/Overrides, Text Assets, Blueprints
-- Date: 2026-01-13
-- ==============================================================================

-- 1. ITEM VERSIONS (For Immutability & History)
CREATE TABLE IF NOT EXISTS public.item_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT NOT NULL REFERENCES public.items(id), 
    version_number INTEGER NOT NULL,
    
    -- Snapshot Data
    statement TEXT,
    alternatives JSONB DEFAULT '[]'::jsonb,
    correct_justification TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store difficulty, BNCC, knowledge_area here
    
    change_reason TEXT,
    changed_by TEXT, -- Stores user ID as TEXT to match public.users(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(item_id, version_number)
);

-- RLS for item_versions
ALTER TABLE public.item_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read item_versions" ON public.item_versions;
CREATE POLICY "Read item_versions" ON public.item_versions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Create item_versions" ON public.item_versions;
CREATE POLICY "Create item_versions" ON public.item_versions
    FOR INSERT WITH CHECK (
        public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
    );

-- Add current_version_id to items
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS current_version_id UUID REFERENCES public.item_versions(id);


-- 2. EXAM VARIANTS (For PCD / Neuro Adaptations)
CREATE TABLE IF NOT EXISTS public.exam_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id TEXT NOT NULL REFERENCES public.exams(id),
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    accessibility_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for exam_variants
ALTER TABLE public.exam_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read exam_variants" ON public.exam_variants;
CREATE POLICY "Read exam_variants" ON public.exam_variants
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Manage exam_variants" ON public.exam_variants;
CREATE POLICY "Manage exam_variants" ON public.exam_variants
    FOR ALL USING (
        public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
    );


-- 3. EXAM VARIANT OVERRIDES (The Content Patch)
CREATE TABLE IF NOT EXISTS public.exam_variant_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.exam_variants(id),
    item_version_id UUID NOT NULL REFERENCES public.item_versions(id),
    
    override_payload JSONB NOT NULL,
    rationale TEXT,
    status TEXT DEFAULT 'DRAFT',
    
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- RLS for exam_variant_overrides
ALTER TABLE public.exam_variant_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read overrides" ON public.exam_variant_overrides;
CREATE POLICY "Read overrides" ON public.exam_variant_overrides
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Manage overrides" ON public.exam_variant_overrides;
CREATE POLICY "Manage overrides" ON public.exam_variant_overrides
    FOR ALL USING (
        public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
    );


-- 4. TEXT ASSETS (For Interpretation Questions)
CREATE TABLE IF NOT EXISTS public.text_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT,
    source_url TEXT,
    source_reference TEXT,
    author TEXT,
    publication_year INTEGER,
    rights_status TEXT CHECK (rights_status IN ('PUBLIC_DOMAIN', 'LICENSED', 'USER_OWNED', 'FAIR_USE', 'UNKNOWN')),
    
    owner_id TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for text_assets
ALTER TABLE public.text_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read text_assets" ON public.text_assets;
CREATE POLICY "Read text_assets" ON public.text_assets
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Manage text_assets" ON public.text_assets;
CREATE POLICY "Manage text_assets" ON public.text_assets
    FOR ALL USING (
        auth.uid()::text = owner_id OR
        public.get_current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN')
    );


-- 5. CONTENT BLUEPRINTS (For Syllabus Extraction)
CREATE TABLE public.content_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_content TEXT, 
    extracted_topics JSONB,
    generation_status TEXT,
    created_by TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for content_blueprints
ALTER TABLE public.content_blueprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own blueprints" ON public.content_blueprints;
CREATE POLICY "Read own blueprints" ON public.content_blueprints
    FOR SELECT USING (auth.uid()::text = created_by);

DROP POLICY IF EXISTS "Create blueprints" ON public.content_blueprints;
CREATE POLICY "Create blueprints" ON public.content_blueprints
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
