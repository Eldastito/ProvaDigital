-- SOLUÇÃO ALTERNATIVA: Remover constraint FK temporariamente
-- Execute este SQL no Supabase se a migration anterior não funcionou

BEGIN;

-- 1. Verificar nome exato da constraint
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'students'
    AND con.contype = 'f'
    AND con.conname LIKE '%class_id%';
    
    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Constraint encontrada: %', constraint_name;
        EXECUTE format('ALTER TABLE students DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- 2. Tornar class_id nullable
ALTER TABLE students 
ALTER COLUMN class_id DROP NOT NULL;

-- 3. Adicionar colunas se não existirem
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 4. Recriar constraint como NULLABLE (permite NULL)
ALTER TABLE students
ADD CONSTRAINT students_class_id_fkey 
FOREIGN KEY (class_id) 
REFERENCES classes(id) 
ON DELETE SET NULL;  -- Se classe for deletada, seta NULL ao invés de bloquear

-- 5. Atualizar RLS policies
DROP POLICY IF EXISTS "Students can view own data" ON students;
CREATE POLICY "Students can view own data" ON students
FOR SELECT USING (
  id = auth.uid()::text 
  OR is_temporary = true
);

DROP POLICY IF EXISTS "Allow temporary student creation" ON students;
CREATE POLICY "Allow temporary student creation" ON students
FOR INSERT WITH CHECK (
  is_temporary = true 
  OR (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text
      AND role IN ('ADMIN', 'PROFESSOR', 'COORDINATOR')
    )
  )
);

COMMIT;

-- Teste se funcionou:
-- INSERT INTO students (id, name, class_id, is_temporary, expires_at)
-- VALUES ('test-student-123', 'Test Student', NULL, true, NOW() + INTERVAL '1 day');
