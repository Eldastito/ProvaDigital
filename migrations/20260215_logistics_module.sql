-- Migração: Módulo de Logística & Custódia
-- Data: 2026-02-15

-- 1. Cadastro de Ativos (Tablets)
CREATE TABLE IF NOT EXISTS public.logistics_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number TEXT UNIQUE NOT NULL,
    qr_id TEXT UNIQUE NOT NULL,
    model TEXT DEFAULT 'Tablet ExamPad V1',
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'IN_TRANSIT', 'IN_USE', 'MAINTENANCE', 'LOST')),
    last_battery_level INTEGER DEFAULT 100,
    last_sync_at TIMESTAMPTZ,
    school_id UUID REFERENCES public.schools(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Cadastro de Malas (Containers)
CREATE TABLE IF NOT EXISTS public.logistics_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT UNIQUE NOT NULL,
    capacity INTEGER DEFAULT 30,
    status TEXT DEFAULT 'IN_STOCK' CHECK (status IN ('IN_STOCK', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'RETURNING')),
    current_school_id UUID REFERENCES public.schools(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Cadastro de Lacres
CREATE TABLE IF NOT EXISTS public.logistics_seals (
    id TEXT PRIMARY KEY, -- O ID é o número impresso no lacre físico
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'APPLIED', 'BROKEN', 'DISCARDED')),
    applied_at TIMESTAMPTZ,
    applied_by UUID REFERENCES auth.users(id),
    broken_at TIMESTAMPTZ,
    broken_by UUID REFERENCES auth.users(id),
    case_id UUID REFERENCES public.logistics_cases(id)
);

-- 4. Eventos de Custódia (Transferência de Posse)
CREATE TABLE IF NOT EXISTS public.custody_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES auth.users(id),
    to_user_id UUID REFERENCES auth.users(id),
    case_id UUID REFERENCES public.logistics_cases(id),
    seal_id TEXT REFERENCES public.logistics_seals(id),
    type TEXT NOT NULL CHECK (type IN ('OUT_FROM_BASE', 'DELIVERY_TO_SCHOOL', 'COLLECTION_FROM_SCHOOL', 'IN_TO_BASE')),
    expected_quantity INTEGER NOT NULL,
    confirmed_quantity INTEGER NOT NULL,
    seal_status TEXT NOT NULL CHECK (seal_status IN ('INTACT', 'BROKEN_ACCIDENT', 'BROKEN_SUSPICIOUS')),
    notes TEXT,
    evidence_urls TEXT[], -- URLs de fotos em caso de divergência
    location_point GEOGRAPHY(POINT), -- Localização GPS da transferência
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Relação Mala <-> Tablets (O que está dentro da mala agora)
CREATE TABLE IF NOT EXISTS public.case_contents (
    case_id UUID REFERENCES public.logistics_cases(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.logistics_assets(id) ON DELETE CASCADE,
    PRIMARY KEY (case_id, asset_id)
);

-- 6. Incidentes Logísticos
CREATE TABLE IF NOT EXISTS public.logistics_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES public.custody_transfers(id),
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.logistics_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_seals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_incidents ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso conforme solicitado (Master SAAS tem acesso total)
-- Exemplo para logistics_assets
CREATE POLICY "Master SAAS total access" ON public.logistics_assets
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'MASTER_SAAS'));
