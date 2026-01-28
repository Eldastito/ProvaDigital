-- Migration: Fix students table to allow temporary students (Live Demo)
-- Date: 2026-01-28
-- Issue: Foreign key constraint blocks Live Demo students from joining

-- PROBLEMA:
-- Quando alunos tentam entrar via Live Demo, o sistema tenta criar um registro
-- em 'students' com um class_id que não existe em 'classes', causando erro:
-- "violates foreign key constraint students_class_id_fkey"

-- SOLUÇÃO:
-- Tornar class_id NULLABLE para permitir estudantes temporários do Live Demo

BEGIN;

-- 1. Tornar class_id nullable
ALTER TABLE public.students 
ALTER COLUMN class_id DROP NOT NULL;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN public.students.class_id IS 
'ID da turma. NULL para estudantes temporários (Live Demo, testes, etc).';

-- 3. Adicionar flag para identificar estudantes temporários
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.students.is_temporary IS 
'TRUE para estudantes temporários (Live Demo). Esses registros podem ser limpos automaticamente.';

-- 4. Adicionar timestamp de expiração para limpeza automática
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.students.expires_at IS 
'Data/hora de expiração para estudantes temporários. NULL = permanente.';

-- 5. Criar índice para facilitar limpeza de temporários
CREATE INDEX IF NOT EXISTS idx_students_temporary_expires 
ON public.students(is_temporary, expires_at) 
WHERE is_temporary = true;

-- 6. Atualizar RLS policy para considerar estudantes temporários
DROP POLICY IF EXISTS "Students can view own data" ON students;
CREATE POLICY "Students can view own data" ON students
FOR SELECT USING (
  id = auth.uid()::text  -- Cast UUID para TEXT
  OR is_temporary = true  -- Permite acesso a estudantes temporários
);

-- 7. Policy para inserção de estudantes temporários
DROP POLICY IF EXISTS "Allow temporary student creation" ON students;
CREATE POLICY "Allow temporary student creation" ON students
FOR INSERT WITH CHECK (
  is_temporary = true 
  OR (
    -- Estudantes permanentes só podem ser criados por admins/professores
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text  -- Cast UUID para TEXT
      AND role IN ('ADMIN', 'PROFESSOR', 'COORDINATOR')
    )
  )
);

-- 8. Criar função para limpeza automática de estudantes temporários expirados
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_students()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM students
  WHERE is_temporary = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_temporary_students() IS 
'Remove estudantes temporários expirados. Retorna o número de registros deletados.';

-- 9. Atualizar estudantes existentes sem class_id para serem temporários
UPDATE students 
SET is_temporary = true,
    expires_at = NOW() + INTERVAL '7 days'
WHERE class_id IS NULL 
  AND is_temporary IS NULL;

COMMIT;

-- NOTAS:
-- - Estudantes temporários devem ter expires_at definido (ex: 24h após criação)
-- - A função cleanup_expired_temporary_students() pode ser chamada via cron job
-- - Estudantes permanentes DEVEM ter class_id preenchido
