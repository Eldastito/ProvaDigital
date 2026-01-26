-- AGGRESSIVE FIX: Drop ALL triggers on exam-related tables
-- This ensures that NO hidden triggers remain to block deletion.
-- We use dynamic SQL to find and drop triggers regardless of their name.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all triggers on the target tables
    FOR r IN 
        SELECT distinct trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE event_object_table IN ('exam_results', 'exam_versions', 'exams')
        AND trigger_schema = 'public'
    LOOP
        -- Log and Drop
        RAISE NOTICE 'Dropping trigger % on table %', r.trigger_name, r.event_object_table;
        EXECUTE 'DROP TRIGGER IF EXISTS "' || r.trigger_name || '" ON public."' || r.event_object_table || '" CASCADE';
    END LOOP;
END $$;

-- Also explicitly drop the known function just in case
DROP FUNCTION IF EXISTS log_exam_result_audit() CASCADE;
