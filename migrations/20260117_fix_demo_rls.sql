-- Enable read access to exams and items for everyone (for Live Demo/Public Exams)
-- This is critical for the "Guest" users in the Student App to fetch questions.

-- 1. Policies for EXAMS
DROP POLICY IF EXISTS "Enable read access for all users" ON exams;
CREATE POLICY "Enable read access for all users" ON exams
    FOR SELECT
    USING (true); -- Simply allow all reads for now to unblock Demo. In prod, strict to 'published' status.

-- 2. Policies for ITEMS
DROP POLICY IF EXISTS "Enable read access for all users" ON items;
CREATE POLICY "Enable read access for all users" ON items
    FOR SELECT
    USING (true);

-- 3. Policies for EXAM_RESULTS (Ensure students can insert their results)
DROP POLICY IF EXISTS "Enable insert for all users" ON exam_results;
CREATE POLICY "Enable insert for all users" ON exam_results
    FOR INSERT
    WITH CHECK (true);

-- 4. Policies for STUDENTS (Ensure they can register)
DROP POLICY IF EXISTS "Enable insert for all users" ON students;
CREATE POLICY "Enable insert for all users" ON students
    FOR INSERT
    WITH CHECK (true);
