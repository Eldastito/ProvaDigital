-- Migration: Enable Cascade Delete for Exams
-- Purpose: Allow deleting an exam to automatically delete all related versions, attempts, and results.

-- 1. Exam Versions linked to Exams
ALTER TABLE exam_versions 
DROP CONSTRAINT IF EXISTS exam_versions_exam_id_fkey;

ALTER TABLE exam_versions 
ADD CONSTRAINT exam_versions_exam_id_fkey 
FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

-- 2. Exam Results linked to Exams
ALTER TABLE exam_results 
DROP CONSTRAINT IF EXISTS exam_results_exam_id_fkey;

ALTER TABLE exam_results 
ADD CONSTRAINT exam_results_exam_id_fkey 
FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

-- 3. Exam Attempts linked to Exam Versions (Indirect link to Exam)
ALTER TABLE exam_attempts 
DROP CONSTRAINT IF EXISTS exam_attempts_exam_version_id_fkey;

ALTER TABLE exam_attempts 
ADD CONSTRAINT exam_attempts_exam_version_id_fkey 
FOREIGN KEY (exam_version_id) REFERENCES exam_versions(id) ON DELETE CASCADE;

-- 4. Exam Allocations/Registrations (if separate table)
-- Checking code: 'event_participants' is for gamified. 'registrations' state exists but stored where?
-- useAppStore: updateExamAllocation updates 'exams' class_ids array. So no separate table likely, or purely local logic?
-- If there is a 'exam_registrations' table, add it.
-- Based on previous files, 'exam_registrations' might exist. Adding safety check.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_registrations') THEN
        ALTER TABLE exam_registrations DROP CONSTRAINT IF EXISTS exam_registrations_exam_id_fkey;
        ALTER TABLE exam_registrations ADD CONSTRAINT exam_registrations_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
    END IF;
END $$;
