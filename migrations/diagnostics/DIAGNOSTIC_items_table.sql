-- DIAGNÓSTICO: Verificar estrutura da tabela items
-- Execute este SQL no Supabase para ver as colunas reais

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'items'
ORDER BY ordinal_position;
