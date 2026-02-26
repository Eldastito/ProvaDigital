-- DIAGNOSTICO INFALÍVEL: Ver dados brutos
-- Execute no Supabase para ver o que realmente está lá

-- 1. Ver o JSON de configuração da prova (items_config)
SELECT items_config 
FROM exams 
WHERE id = '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90';

-- 2. Ver 1 item qualquer da tabela items para ver o nome das colunas
SELECT * FROM items LIMIT 1;
