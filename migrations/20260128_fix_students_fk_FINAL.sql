-- SOLUÇÃO DEFINITIVA: Remover constraint e permitir NULL
-- Execute este SQL no Supabase SQL Editor

BEGIN;

-- 1. Dropar a constraint FK problemática
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_class_id_fkey;

-- 2. Garantir que class_id aceita NULL
ALTER TABLE students 
ALTER COLUMN class_id DROP NOT NULL;

-- 3. NÃO recriar a constraint FK
-- Isso permite que students existam sem class_id (para Live Demo)

-- 4. Criar índice para performance (opcional mas recomendado)
CREATE INDEX IF NOT EXISTS idx_students_class_id 
ON students(class_id) 
WHERE class_id IS NOT NULL;

-- 5. Atualizar policy de INSERT para permitir estudantes temporários
DROP POLICY IF EXISTS "Allow temporary student creation" ON students;
CREATE POLICY "Allow temporary student creation" ON students
FOR INSERT WITH CHECK (
  -- Permite inserção se for temporário (sem autenticação necessária)
  is_temporary = true 
  OR
  -- Ou se for usuário autenticado com permissão
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text
      AND role IN ('ADMIN', 'PROFESSOR', 'COORDINATOR')
    )
  )
);

-- 6. Policy de SELECT
DROP POLICY IF EXISTS "Students can view own data" ON students;
CREATE POLICY "Students can view own data" ON students
FOR SELECT USING (
  id = auth.uid()::text 
  OR is_temporary = true
);

-- 7. Policy de UPDATE (apenas próprio registro)
DROP POLICY IF EXISTS "Students can update own data" ON students;
CREATE POLICY "Students can update own data" ON students
FOR UPDATE USING (
  id = auth.uid()::text
);

-- 8. Policy de DELETE (apenas admins ou próprio registro temporário)
DROP POLICY IF EXISTS "Students can delete own temporary data" ON students;
CREATE POLICY "Students can delete own temporary data" ON students
FOR DELETE USING (
  (id = auth.uid()::text AND is_temporary = true)
  OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text
    AND role IN ('ADMIN', 'COORDINATOR')
  )
);

COMMIT;

-- TESTE: Tentar inserir estudante temporário sem class_id
-- INSERT INTO students (id, name, class_id, is_temporary, expires_at)
-- VALUES ('test-temp-student', 'Test Student', NULL, true, NOW() + INTERVAL '1 day');

-- Se der sucesso, o Live Demo deve funcionar!
