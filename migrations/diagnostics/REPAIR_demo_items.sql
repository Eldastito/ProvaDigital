-- REPAIR SCRIPT: Corrigir itens da prova Demo que estão sem alternativas
-- O problema é que a coluna alternatives está NULL, causando falha no frontend

WITH target_exam AS (
    SELECT items_config 
    FROM exams 
    WHERE id = '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90'
),
target_items AS (
    SELECT jsonb_array_elements(items_config)->>'itemId' as item_id
    FROM target_exam
)
UPDATE items
SET 
  alternatives = '[
    {"id": "a", "text": "Alternativa A (Correta)", "isCorrect": true},
    {"id": "b", "text": "Alternativa B", "isCorrect": false},
    {"id": "c", "text": "Alternativa C", "isCorrect": false},
    {"id": "d", "text": "Alternativa D", "isCorrect": false}
  ]'::jsonb,
  correct_answer = 'a' -- Se houver coluna legada
WHERE id IN (SELECT item_id FROM target_items)
AND (alternatives IS NULL OR jsonb_array_length(alternatives) = 0);

-- Verificar se corrigiu
SELECT id, alternatives FROM items 
WHERE id IN (
    SELECT jsonb_array_elements(items_config)->>'itemId' 
    FROM exams 
    WHERE id = '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90'
);
