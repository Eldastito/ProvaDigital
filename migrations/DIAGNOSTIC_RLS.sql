-- DIAGNOSTIC QUERY
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('exam_attempts', 'exam_attempt_events')
AND table_schema = 'public';

SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename IN ('exam_attempts', 'exam_attempt_events');
