-- DIAGNÓSTICO COMPLETO: Estrutura da tabela items
-- Execute este SQL no Supabase e me mostre TODO o resultado

-- 1. Ver todas as colunas da tabela items
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'items'
ORDER BY ordinal_position;

-- 2. Ver um exemplo de registro existente (se houver)
SELECT * FROM items LIMIT 1;

-- 3. Ver estrutura do JSONB alternatives (se existir)
SELECT 
    id,
    statement,
    alternatives,
    jsonb_typeof(alternatives) as alternatives_type
FROM items 
WHERE alternatives IS NOT NULL
LIMIT 1;
