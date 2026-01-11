-- ============================================
-- AI FLOW ENHANCEMENT: BATCHES & VARIANTS
-- Data: 2026-01-11
-- ============================================

-- 1. Lifecycle Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_lifecycle_status') THEN
        CREATE TYPE item_lifecycle_status AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'ARCHIVED');
    END IF;
END $$;

-- 2. Item Generation Batches
CREATE TABLE IF NOT EXISTS public.item_generation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT REFERENCES public.users(id),
  tenant_id TEXT NOT NULL,
  prompt_context TEXT,
  total_requested INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update public.items
-- Check if columns exist before adding
DO $$
BEGIN
    -- Ensure owner_id exists (critical for RLS)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='owner_id') THEN
        ALTER TABLE public.items ADD COLUMN owner_id TEXT REFERENCES public.users(id);
    END IF;

    -- Add AI related columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='generation_batch_id') THEN
        ALTER TABLE public.items ADD COLUMN generation_batch_id UUID REFERENCES public.item_generation_batches(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='lifecycle_status') THEN
        -- Add individual columns if needed
        ALTER TABLE public.items ADD COLUMN lifecycle_status item_lifecycle_status DEFAULT 'APPROVED';
    END IF;
END $$;

-- 4. Exam Versions & Review
CREATE TABLE IF NOT EXISTS public.exam_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id TEXT REFERENCES public.exams(id),
  version_number INTEGER NOT NULL,
  items_snapshot JSONB, 
  review_summary JSONB, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Exam Variants (Accessibility)
CREATE TABLE IF NOT EXISTS public.exam_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_version_id UUID REFERENCES public.exam_versions(id),
  condition_code TEXT, 
  adapted_items JSONB, 
  delivery_logic_log TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RLS FOR BATCHES
ALTER TABLE public.item_generation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own batches"
  ON public.item_generation_batches
  FOR ALL USING (
    creator_id = auth.uid()::text OR 
    (SELECT role FROM public.users WHERE id = auth.uid()::text) IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN')
  );

-- 7. REFINED ITEMS RLS (Draft Protection)
DROP POLICY IF EXISTS "Read items" ON public.items;
DROP POLICY IF EXISTS "Read items refined" ON public.items;
CREATE POLICY "Read items refined" ON public.items 
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      lifecycle_status != 'DRAFT' OR 
      owner_id = auth.uid()::text
    )
  );

-- 8. RLS FOR VERSIONS & VARIANTS
ALTER TABLE public.exam_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read versions/variants" ON public.exam_versions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read variants" ON public.exam_variants FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Manage versions/variants" 
  ON public.exam_versions FOR ALL 
  USING ( (SELECT role FROM public.users WHERE id = auth.uid()::text) IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN') );

CREATE POLICY "Manage variants" 
  ON public.exam_variants FOR ALL 
  USING ( (SELECT role FROM public.users WHERE id = auth.uid()::text) IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN') );
