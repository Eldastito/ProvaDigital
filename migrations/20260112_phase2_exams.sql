-- Phase 2: Exam Versioning, Weighting and Accessibility Variants
-- Date: 2026-01-12

-- 1. Create table for exam versions
CREATE TABLE IF NOT EXISTS public.exam_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id TEXT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {item_id, weight, position}
    grading_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- {totals_by_discipline: {}, total_score: 0}
    cover_config JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {title, instructions, security_notices}
    status TEXT DEFAULT 'draft',                      -- draft | published | archived
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create table for accessibility variants (Phase 4 inclusion)
CREATE TABLE IF NOT EXISTS public.exam_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_version_id UUID NOT NULL REFERENCES public.exam_versions(id) ON DELETE CASCADE,
    condition_code TEXT NOT NULL,                      -- TEA | TDAH | DIFIC_APRENDIZAGEM | ...
    variant_rules_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb, -- Specific adaptations (e.g. simplified text)
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Policies for exam_versions
ALTER TABLE public.exam_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher manages own exam versions" ON public.exam_versions;
CREATE POLICY "Teacher manages own exam versions"
    ON public.exam_versions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.exams 
            WHERE exams.id = exam_versions.exam_id 
            AND (exams.creator_id = auth.uid()::text OR auth.role() = 'authenticated')
        )
    );

-- 4. RLS Policies for exam_variants
ALTER TABLE public.exam_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher manages own variants" ON public.exam_variants;
CREATE POLICY "Teacher manages own variants"
    ON public.exam_variants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_versions
            JOIN public.exams ON exams.id = exam_versions.exam_id
            WHERE exam_versions.id = exam_variants.exam_version_id
            AND (exams.creator_id = auth.uid()::text OR auth.role() = 'authenticated')
        )
    );

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_versions_exam_id ON public.exam_versions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_variants_version_id ON public.exam_variants(exam_version_id);
