
-- ============================================
-- FEATURE FLAGS SCHEMA
-- ============================================

CREATE TABLE IF NOT EXISTS public.tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL, -- e.g., 'AI_TUTOR', 'GAMIFICATION', 'TABLET_KIOSK'
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb, -- Extra config, e.g., { "max_daily_tokens": 100 }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, feature_key)
);

ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Read: Authenticated users can read valid features for THEIR tenant
CREATE POLICY "Read tenant features" ON public.tenant_features
  FOR SELECT USING (
    -- User can only see features for their own tenant
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()::text
    )
  );

-- Write: Super Admin Only (or specific management role)
CREATE POLICY "Manage tenant features" ON public.tenant_features
  FOR ALL USING (
    public.get_current_user_role() IN ('SUPER_ADMIN', 'STATE_ADMIN')
  );

-- INDEX for fast lookups
CREATE INDEX idx_tenant_features_lookup ON public.tenant_features(tenant_id, feature_key);
