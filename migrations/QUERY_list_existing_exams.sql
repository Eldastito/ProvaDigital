-- QUERY SIMPLES: Listar provas existentes (sem assumir colunas)
-- Execute este SQL no Supabase

-- Ver todas as colunas da tabela exams primeiro
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'exams'
ORDER BY ordinal_position;

-- Depois, listar as provas (ajuste conforme as colunas que existem)
SELECT * FROM exams LIMIT 5;
