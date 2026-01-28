-- VERIFICATION SCRIPT: Verificar se itens foram corrigidos
-- Vamos checar se a coluna alternatives tem dados válidos

SELECT 
    id, 
    left(statement, 30) as statement_prefix,
    jsonb_typeof(alternatives) as alt_type, 
    jsonb_array_length(alternatives) as alt_count,
    correct_answer
FROM items 
WHERE id IN (
    SELECT jsonb_array_elements(items_config)->>'itemId' 
    FROM exams 
    WHERE id = '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90'
);
