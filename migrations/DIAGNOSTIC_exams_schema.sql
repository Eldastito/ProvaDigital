-- DIAGNOSTIC: Check Exams table structure and policies
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'exams';

-- Check Policies
SELECT * FROM pg_policies WHERE tablename = 'exams';
