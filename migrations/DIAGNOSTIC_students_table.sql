-- DIAGNÓSTICO: Verificar estado atual da tabela students
-- Execute este SQL no Supabase SQL Editor para diagnosticar o problema

-- 1. Verificar estrutura da tabela students
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- 2. Verificar constraints existentes
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
    END AS constraint_description
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'students';

-- 3. Verificar se class_id é nullable
SELECT 
    attname AS column_name,
    attnotnull AS is_not_null
FROM pg_attribute
WHERE attrelid = 'students'::regclass
AND attname = 'class_id';

-- 4. Verificar se há colunas is_temporary e expires_at
SELECT 
    column_name
FROM information_schema.columns 
WHERE table_name = 'students'
AND column_name IN ('is_temporary', 'expires_at');
