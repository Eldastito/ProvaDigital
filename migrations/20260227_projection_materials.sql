-- 20260227_projection_materials.sql
-- Create table for storing Projection Lab media materials

CREATE TABLE IF NOT EXISTS public.projection_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('3D_MODEL', 'VIDEO', 'DOCUMENT', 'MIND_MAP')),
    category TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projection_materials ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view projection materials in their school"
    ON public.projection_materials FOR SELECT
    USING (school_id IN (
        SELECT school_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Professors can insert projection materials into their school"
    ON public.projection_materials FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Professors can update their own projection materials"
    ON public.projection_materials FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Professors can delete their own projection materials"
    ON public.projection_materials FOR DELETE
    USING (auth.uid() = owner_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projection_materials_school ON public.projection_materials(school_id);
CREATE INDEX IF NOT EXISTS idx_projection_materials_owner ON public.projection_materials(owner_id);
