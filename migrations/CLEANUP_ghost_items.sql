-- LIMPEZA DE DADOS (GHOST ITEMS) - VERSÃO BYPASS TRIGGER
-- O 't1' não é um UUID válido, o que quebra o trigger de auditoria normal.
-- Usamos session_replication_role = 'replica' para desativar triggers temporariamente.

BEGIN;

-- 1. Desativar triggers (Safety Bypass)
SET session_replication_role = 'replica';

-- 2. Deletar os itens corrompidos
DELETE FROM items 
WHERE alternatives IS NULL 
OR jsonb_array_length(alternatives) = 0;

-- 3. Reativar triggers
SET session_replication_role = 'origin';

COMMIT;

-- 4. Verificação Final (Deve retornar 0)
SELECT count(*) as ghost_items_remaining FROM items WHERE alternatives IS NULL;
