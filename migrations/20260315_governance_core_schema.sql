-- ==============================================================================
-- GOVERNANCE CORE SCHEMA: DRAFT OFICIAL (FASE 2 - SHADOW MODE)
-- Descrição: Implementação das tabelas centrais conforme o Contrato Canônico.
-- ==============================================================================

BEGIN;

-- 1. TIPOS CANÔNICOS
DO $$ BEGIN
    CREATE TYPE organization_type AS ENUM (
        'saas_platform', 'exam_pad_operations', 'mec', 
        'state_secretariat', 'municipal_secretariat', 
        'private_group', 'school'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE scope_type AS ENUM ('GLOBAL', 'ORG', 'UNIT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABELAS CENTRAIS

-- Roles (Templates de Papéis)
CREATE TABLE IF NOT EXISTS public.roles (
    id text PRIMARY KEY, -- ex: 'platform_owner', 'teacher'
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Organizations (Hierarquia SSOT via parent_id)
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES public.organizations(id), -- SSOT da Hierarquia
    name text NOT NULL,
    type organization_type NOT NULL,
    classification text, -- ex: 'PUBLIC', 'PRIVATE'
    external_id text, -- Mapeamento para tenant_id legado
    status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
    created_at timestamp with time zone DEFAULT now()
);

-- User Memberships (Vínculos Ativos)
CREATE TABLE IF NOT EXISTS public.user_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id),
    organization_id uuid REFERENCES public.organizations(id),
    role_id text REFERENCES public.roles(id),
    scope_type scope_type NOT NULL,
    scope_ref_id uuid, -- ID da Org ou Escola de escopo
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, organization_id, role_id, scope_ref_id)
);

-- Permission Policies (Motor de Precedência)
CREATE TABLE IF NOT EXISTS public.permission_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type text NOT NULL CHECK (subject_type IN ('ROLE', 'MEMBERSHIP', 'ORGANIZATION')),
    subject_id text NOT NULL, -- ID da role, membership ou org
    resource text NOT NULL,
    action text NOT NULL,
    effect text DEFAULT 'ALLOW' CHECK (effect IN ('ALLOW', 'DENY')),
    priority integer DEFAULT 0,
    conditions jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. AUDITORIA DE SHADOW MODE (Exigência 6)
CREATE TABLE IF NOT EXISTS public.governance_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    membership_id uuid,
    organization_id uuid,
    resource text,
    action text,
    surface text, -- 'API', 'UI', 'HOOK'
    legacy_decision boolean,
    core_decision boolean,
    decision_source text, -- 'ROLE_POLICY', 'MEMBERSHIP_OVERRIDE', etc.
    legacy_reason text,
    core_reason text,
    context jsonb,
    is_divergent boolean GENERATED ALWAYS AS (legacy_decision <> core_decision) STORED,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_subject ON public.permission_policies(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_audit_divergence ON public.governance_audit(is_divergent) WHERE is_divergent = true;

-- 5. DATA INICIAL (Seed de Roles)
INSERT INTO public.roles (id, name, description) VALUES
('platform_owner', 'Dono da Plataforma', 'Acesso total global'),
('platform_admin', 'Admin de Operações', 'Gestão técnica da infraestrutura'),
('mec_superadmin', 'MEC Admin', 'Gestão federal'),
('state_secretariat_admin', 'Secretário Estadual', 'Gestão regional estadual'),
('municipal_secretariat_admin', 'Secretário Municipal', 'Gestão regional municipal'),
('school_manager', 'Gestor Escolar', 'Acesso total à unidade'),
('teacher', 'Professor', 'Gestão de turmas e exames'),
('student', 'Aluno', 'Acesso ao conteúdo educativo'),
ON CONFLICT (id) DO NOTHING;

COMMIT;
