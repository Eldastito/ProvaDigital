-- LISTAR ITENS RECENTES (Para pegar os IDs manualmente)
-- Já que o join automático falhou, vamos pegar os IDs no olho

SELECT id, statement, alternatives, created_at 
FROM items 
WHERE statement IS NOT NULL 
AND (alternatives IS NULL OR jsonb_array_length(alternatives) = 0)
ORDER BY created_at DESC 
LIMIT 50;
