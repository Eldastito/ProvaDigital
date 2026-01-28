-- Migration: Remove Permissive RLS Policies (Security Critical) - VERSÃO SEGURA
-- Date: 2026-01-28
-- Issue: Multiple tables have USING (true) policies allowing unrestricted access

-- ESTRATÉGIA: Remover políticas permissivas e deixar tabelas sem acesso
-- Isso é mais seguro do que tentar adivinhar a estrutura das tabelas
-- As aplicações que precisarem de acesso devem criar policies específicas depois

BEGIN;

-- ============================================================================
-- REMOVER POLÍTICAS PERMISSIVAS (USING true)
-- ============================================================================

-- 1. EXAM_SCHEDULES
DROP POLICY IF EXISTS exam_schedules_select_policy ON exam_schedules;
DROP POLICY IF EXISTS exam_schedules_insert_policy ON exam_schedules;
DROP POLICY IF EXISTS exam_schedules_update_policy ON exam_schedules;
DROP POLICY IF EXISTS exam_schedules_delete_policy ON exam_schedules;

-- 2. BROADCAST_MESSAGES
DROP POLICY IF EXISTS broadcast_messages_select_policy ON broadcast_messages;
DROP POLICY IF EXISTS broadcast_messages_insert_policy ON broadcast_messages;

-- 3. EXAMS
DROP POLICY IF EXISTS "Enable all access for all users" ON exams;

-- 4. ITEMS
DROP POLICY IF EXISTS "Enable all access for all users" ON items;

-- 5. LIVE_QUIZ_SESSIONS
DROP POLICY IF EXISTS "Enable all access for live quiz sessions" ON live_quiz_sessions;

-- 6. LIVE_QUIZ_RESULTS
DROP POLICY IF EXISTS "Enable all access for live quiz results" ON live_quiz_results;

-- ============================================================================
-- CRIAR POLÍTICAS TEMPORÁRIAS PERMISSIVAS (APENAS PARA NÃO QUEBRAR A APP)
-- ============================================================================
-- IMPORTANTE: Estas políticas devem ser substituídas por políticas mais
-- restritivas assim que a estrutura das tabelas for documentada

-- EXAM_SCHEDULES - Temporariamente permissivo
CREATE POLICY exam_schedules_temp_policy ON exam_schedules
FOR ALL USING (auth.uid() IS NOT NULL);

-- BROADCAST_MESSAGES - Temporariamente permissivo
CREATE POLICY broadcast_messages_temp_policy ON broadcast_messages
FOR ALL USING (auth.uid() IS NOT NULL);

-- EXAMS - Temporariamente permissivo
CREATE POLICY exams_temp_policy ON exams
FOR ALL USING (auth.uid() IS NOT NULL);

-- ITEMS - Temporariamente permissivo
CREATE POLICY items_temp_policy ON items
FOR ALL USING (auth.uid() IS NOT NULL);

-- LIVE_QUIZ_SESSIONS - Temporariamente permissivo
CREATE POLICY live_quiz_sessions_temp_policy ON live_quiz_sessions
FOR ALL USING (auth.uid() IS NOT NULL);

-- LIVE_QUIZ_RESULTS - Temporariamente permissivo
CREATE POLICY live_quiz_results_temp_policy ON live_quiz_results
FOR ALL USING (auth.uid() IS NOT NULL);

COMMIT;

-- ============================================================================
-- PRÓXIMOS PASSOS (MANUAL)
-- ============================================================================

-- 1. Verificar estrutura das tabelas:
--    SELECT column_name, data_type 
--    FROM information_schema.columns 
--    WHERE table_name = 'exams';

-- 2. Criar políticas específicas baseadas nas colunas reais

-- 3. Substituir as políticas temporárias acima por políticas restritivas

-- NOTA: Por enquanto, a segurança está em:
-- - Requer autenticação (auth.uid() IS NOT NULL)
-- - Melhor que USING (true) que permitia acesso anônimo
-- - Mas ainda não tem isolamento por escola/professor/aluno
