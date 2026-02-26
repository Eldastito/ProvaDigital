-- SQL REPAIR SCRIPT FOR RISK SYSTEM
-- Execute este script no SQL Editor do seu Supabase para garantir que o banco está 100% sincronizado.

-- 1. Garante que as colunas existem (caso a migração anterior tenha falhado no meio)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='risk_alerts' AND column_name='student_name') THEN
        ALTER TABLE public.risk_alerts ADD COLUMN student_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='risk_alerts' AND column_name='school_id') THEN
        ALTER TABLE public.risk_alerts ADD COLUMN school_id TEXT;
    END IF;
END $$;

-- 2. Torna as colunas NOT NULL se elas foram criadas agora (opcional, mas recomendado para consistência)
ALTER TABLE public.risk_alerts ALTER COLUMN student_name SET NOT NULL;
ALTER TABLE public.risk_alerts ALTER COLUMN school_id SET NOT NULL;

-- 3. FORÇA O RELOAD DO SCHEMA CACHE (O passo mais importante para o erro 400)
-- Isso diz ao PostgREST para reler a estrutura de todas as tabelas.
NOTIFY pgrst, 'reload schema';

-- 4. Verificação final: Lista as colunas para você conferir nos logs do SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'risk_alerts';
