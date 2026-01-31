-- ==============================================================================
-- MIGRATION: 20260131_premium_features_pack.sql
-- Description: Consolida todas as estruturas de dados necessárias para o pacote Premium 2026
-- Features: Bússola Vocacional, DALL-E (Campos de Item), Risco de Evasão
-- ==============================================================================

-- 1. VOCATIONAL COMPASS (BÚSSOLA VOCACIONAL)
-- Cria tabela para armazenar os perfis vocacionais gerados pela IA
CREATE TABLE IF NOT EXISTS student_vocational_profiles (
    student_id TEXT PRIMARY KEY, -- Um perfil por aluno
    disc_archetype TEXT,
    dominant_intelligences JSONB DEFAULT '[]'::jsonb, -- Array de strings
    career_matches JSONB DEFAULT '[]'::jsonb, -- Array de objetos CareerRecommendation
    ikigai JSONB DEFAULT '{}'::jsonb, -- Objeto IkigaiData
    purpose_statement TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies para Vocational Compass
ALTER TABLE student_vocational_profiles ENABLE ROW LEVEL SECURITY;

-- Alunos veem seu próprio perfil
CREATE POLICY "Alunos veem seu próprio perfil vocacional" 
ON student_vocational_profiles FOR SELECT 
USING (student_id = auth.uid()::text);

-- Professores/Diretores veem perfis da escola (simplificado para MVP, ajustar se necessário)
CREATE POLICY "Staff vê perfis vocacionais" 
ON student_vocational_profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND role IN ('PROFESSOR', 'DIRETOR', 'SUPERVISOR', 'SUPER_ADMIN')
  )
);


-- 2. PREMIUM ITEMS (DALL-E & LABS 3D)
-- Adiciona campos para suporte a Imagens Geradas e Simulações 3D
DO $$
BEGIN
    -- Coluna multimedia (para DALL-E, Vídeos, Áudio)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'multimedia') THEN
        ALTER TABLE items ADD COLUMN multimedia JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Coluna simulation_config (para Labs 3D / R3F)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'simulation_config') THEN
        ALTER TABLE items ADD COLUMN simulation_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;


-- 3. RISK DETECTION (MONITORAMENTO DE EVASÃO)
-- Adiciona campo de Probabilidade de Evasão na tabela de alertas existente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'risk_alerts' AND column_name = 'evasion_probability') THEN
        ALTER TABLE risk_alerts ADD COLUMN evasion_probability TEXT CHECK (evasion_probability IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA'));
    END IF;
END $$;


-- 4. LOGS DE MIGRAÇÃO
INSERT INTO public.audit_logs (
    id, tenant_id, action_type, details, created_at
) VALUES (
    gen_random_uuid(), 
    'system', 
    'MIGRATION_APPLIED', 
    '{"migration": "20260131_premium_features_pack.sql", "status": "COMPLETED"}'::jsonb, 
    NOW()
);
