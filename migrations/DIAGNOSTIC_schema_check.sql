SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name IN ('items', 'exams', 'exam_schedules', 'students', 'schools', 'school_classes', 'users')
ORDER BY 
    table_name, ordinal_position;
