-- DIAGNOSTIC: Check types and functions
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('exam_attempts', 'exam_attempt_events')
AND table_schema = 'public';

-- Check RPC
SELECT 
    routine_name, 
    routine_type 
FROM information_schema.routines 
WHERE routine_name = 'increment_violation_count'
AND routine_schema = 'public';

-- Check Policies
SELECT * FROM pg_policies WHERE tablename IN ('exam_attempts', 'exam_attempt_events');
