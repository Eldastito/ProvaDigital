-- REPAIR MANUAL: Corrigir itens (Versão Corrigida)
-- Removido update de correct_answer que não existe na tabela

UPDATE items
SET 
  alternatives = '[
    {"id": "a", "text": "Alternativa A (Correta)", "isCorrect": true},
    {"id": "b", "text": "Alternativa B", "isCorrect": false},
    {"id": "c", "text": "Alternativa C", "isCorrect": false},
    {"id": "d", "text": "Alternativa D", "isCorrect": false}
  ]'::jsonb
WHERE id IN (
  'test item 1768051938190 c52u4sdyf',
  'test item 1768051938172 0akbok820',
  'test-item-no-tenant'
);

-- Verificar se corrigiu
SELECT id, jsonb_array_length(alternatives) as alt_count
FROM items
WHERE id IN (
  'test item 1768051938190 c52u4sdyf',
  'test item 1768051938172 0akbok820',
  'test-item-no-tenant'
);
