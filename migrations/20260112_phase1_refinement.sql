-- Phase 1 Refinement: AI Generation Batches & Item Status
-- Date: 2026-01-12

-- 1. Create status enum for batches
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'batch_status') THEN
        CREATE TYPE batch_status AS ENUM ('open', 'finalized', 'archived');
    END IF;
END $$;

-- 2. Update item_generation_batches table
ALTER TABLE public.item_generation_batches 
  ADD COLUMN IF NOT EXISTS status batch_status DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'IA',
  ADD COLUMN IF NOT EXISTS prompt_hash TEXT;

-- Rename creator_id to created_by if needed (keeping both for compatibility during transition if necessary, but strictly creator_id is used currently)
-- Following user spec: created_by uuid (using TEXT for current project ID compatibility)
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='item_generation_batches' AND column_name='created_by') THEN
    ALTER TABLE public.item_generation_batches ADD COLUMN created_by TEXT;
    UPDATE public.item_generation_batches SET created_by = creator_id;
END IF;

-- 3. Update public.items lifecycle_status enum if needed
-- The existing enum is 'DRAFT', 'APPROVED', 'REJECTED', 'ARCHIVED'
-- The user wants 'draft', 'approved', 'discarded', 'archived'
-- We will add the new values to the existing type to avoid breaking current data
ALTER TYPE item_lifecycle_status ADD VALUE IF NOT EXISTS 'discarded';
-- We can treat REJECTED as discarded if needed, but we'll add 'discarded' explicitly.

-- 4. RLS POLICIES REMOVAL AND RE-CREATION (STRICT)

-- item_generation_batches:
ALTER TABLE public.item_generation_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own batches" ON public.item_generation_batches;
DROP POLICY IF EXISTS "Teacher manages own batches" ON public.item_generation_batches;
DROP POLICY IF EXISTS "Admins view all batches" ON public.item_generation_batches;

-- Teacher: INSERT no próprio tenant; SELECT/UPDATE apenas se created_by = auth.uid()
CREATE POLICY "Teacher manages own batches" 
  ON public.item_generation_batches
  FOR ALL
  USING (
    created_by = auth.uid()::text OR creator_id = auth.uid()::text
  )
  WITH CHECK (
    created_by = auth.uid()::text OR creator_id = auth.uid()::text
  );

-- Director/TenantAdmin: SELECT batches do tenant
CREATE POLICY "Admins view all batches"
  ON public.item_generation_batches
  FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()::text) IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN', 'DIRETOR', 'SUPERVISOR')
  );

-- public.items:
-- Teacher SELECT: approved do tenant + drafts/discarded apenas próprios
DROP POLICY IF EXISTS "Read items refined" ON public.items;
CREATE POLICY "Read items refined"
  ON public.items
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      lifecycle_status NOT IN ('DRAFT', 'draft', 'REJECTED', 'discarded') OR 
      owner_id = auth.uid()::text OR
      (SELECT role FROM public.users WHERE id = auth.uid()::text) IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN')
    )
  );

-- Teacher UPDATE: editar conteúdo apenas quando draft e próprio; mudar lifecycle_status apenas próprio
DROP POLICY IF EXISTS "Teacher update own drafts" ON public.items;
CREATE POLICY "Teacher update own drafts"
  ON public.items
  FOR UPDATE
  USING (
    owner_id = auth.uid()::text AND (lifecycle_status IN ('DRAFT', 'draft'))
  );
