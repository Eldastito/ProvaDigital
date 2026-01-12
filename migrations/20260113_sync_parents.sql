-- Migration: Parent-Student Linking
-- Description: Automatically populates children_ids for parent users by matching surnames within the same school.
-- Date: 2026-01-13

DO $$
DECLARE
    parent_record RECORD;
    student_ids UUID[];
    last_name TEXT;
BEGIN
    -- Loop through all users with role 'PAIS'
    FOR parent_record IN 
        SELECT id, name, school_id 
        FROM public.users 
        WHERE role = 'PAIS'
    LOOP
        -- Get the last name of the parent (simplified logic: last word of the name)
        last_name := split_part(parent_record.name, ' ', array_length(string_to_array(parent_record.name, ' '), 1));
        
        -- Search for students in the same school with the same last name
        -- Note: We use array_agg to get all matches if there are siblings
        SELECT array_agg(id) 
        INTO student_ids
        FROM public.students
        WHERE school_id = parent_record.school_id
        AND name ILIKE '%' || last_name || '%';

        -- Update the user record if matches were found
        IF student_ids IS NOT NULL THEN
            UPDATE public.users
            SET children_ids = student_ids::text[]
            WHERE id = parent_record.id;
            
            RAISE NOTICE 'Linked Parent % (%) to Students %', parent_record.name, parent_record.id, student_ids;
        END IF;
    END LOOP;
END $$;
