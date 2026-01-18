-- Enable DELETE/UPDATE access for all users on EXAMS (Critical for Demo Admin)
DROP POLICY IF EXISTS "Enable all access for all users" ON exams;
CREATE POLICY "Enable all access for all users" ON exams
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable DELETE/UPDATE access for all users on ITEMS (To allow cleaning up questions)
DROP POLICY IF EXISTS "Enable all access for all users" ON items;
CREATE POLICY "Enable all access for all users" ON items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Ensure replication role isn't blocked (Standard safety)
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
