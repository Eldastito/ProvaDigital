-- Migration: Criar Prova de Demonstração (Versão Adaptativa)
-- Date: 2026-01-28
-- Esta versão usa apenas colunas que sabemos que existem

BEGIN;

-- Limpar dados antigos
DELETE FROM items WHERE id LIKE 'demo-item-%';
DELETE FROM exams WHERE id = 'demo-exam';

-- Criar 5 questões usando apenas colunas essenciais
-- Vamos usar apenas: id, type, statement, alternatives, difficulty, subject, created_at
INSERT INTO items (id, type, statement, alternatives, difficulty, subject, created_at)
VALUES 
  ('demo-item-1', 'MULTIPLE_CHOICE', 'Qual é a capital do Brasil?', 
   '[{"id":"A","text":"São Paulo","isCorrect":false},{"id":"B","text":"Rio de Janeiro","isCorrect":false},{"id":"C","text":"Brasília","isCorrect":true},{"id":"D","text":"Salvador","isCorrect":false}]'::jsonb,
   'EASY', 'Geografia', NOW()),
   
  ('demo-item-2', 'MULTIPLE_CHOICE', 'Quanto é 15 + 27?',
   '[{"id":"A","text":"32","isCorrect":false},{"id":"B","text":"42","isCorrect":true},{"id":"C","text":"52","isCorrect":false},{"id":"D","text":"62","isCorrect":false}]'::jsonb,
   'EASY', 'Matemática', NOW()),
   
  ('demo-item-3', 'MULTIPLE_CHOICE', 'Qual é o planeta mais próximo do Sol?',
   '[{"id":"A","text":"Terra","isCorrect":false},{"id":"B","text":"Vênus","isCorrect":false},{"id":"C","text":"Mercúrio","isCorrect":true},{"id":"D","text":"Marte","isCorrect":false}]'::jsonb,
   'MEDIUM', 'Ciências', NOW()),
   
  ('demo-item-4', 'MULTIPLE_CHOICE', 'Em que ano foi proclamada a Independência do Brasil?',
   '[{"id":"A","text":"1500","isCorrect":false},{"id":"B","text":"1822","isCorrect":true},{"id":"C","text":"1889","isCorrect":false},{"id":"D","text":"1922","isCorrect":false}]'::jsonb,
   'MEDIUM', 'História', NOW()),
   
  ('demo-item-5', 'MULTIPLE_CHOICE', 'Qual é o plural de "cidadão"?',
   '[{"id":"A","text":"cidadões","isCorrect":false},{"id":"B","text":"cidadãos","isCorrect":true},{"id":"C","text":"cidadães","isCorrect":false},{"id":"D","text":"cidadans","isCorrect":false}]'::jsonb,
   'EASY', 'Português', NOW());

-- Criar prova de demonstração
INSERT INTO exams (id, title, description, item_ids, duration_minutes, status, created_by, created_at, updated_at)
VALUES (
  'demo-exam',
  'Prova de Demonstração - Conhecimentos Gerais',
  'Prova de exemplo com 5 questões de múltipla escolha.',
  ARRAY['demo-item-1', 'demo-item-2', 'demo-item-3', 'demo-item-4', 'demo-item-5'],
  30,
  'ACTIVE',
  'system',
  NOW(),
  NOW()
);

-- Criar turma demo se não existir
INSERT INTO classes (id, name, created_at)
VALUES ('demo-class', 'Turma Demo', NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verificação
SELECT 'Prova criada:' as status, id, title FROM exams WHERE id = 'demo-exam'
UNION ALL
SELECT 'Questões criadas:', id, LEFT(statement, 50) FROM items WHERE id LIKE 'demo-item-%';
