-- DIAGNÓSTICO: Verificar Itens da Prova Real
-- Vamos ver as alternativas e a resposta correta de cada item da prova usada

SELECT 
    i.id,
    i.statement,
    i.alternatives,
    jsonb_typeof(i.alternatives) as alt_type,
    i.correct_answer, -- Se houver coluna separada
    i.difficulty
FROM items i
JOIN exams e ON e.id = '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90'
WHERE i.id IN (
    SELECT jsonb_array_elements(e.items_config)->>'itemId' 
    FROM exams e 
    WHERE e.id = '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90'
);
