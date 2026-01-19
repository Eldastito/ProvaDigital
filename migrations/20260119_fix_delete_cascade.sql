-- Migration: Enable Cascade Delete for Exams (Safe Mode)
-- Purpose: Allow deleting an exam to automatically delete all related versions, attempts, and results.
-- Note: This script checks if tables exist before applying changes to prevent errors.

-- 1. Exam Versions linked to Exams
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_versions') THEN
        ALTER TABLE exam_versions 
        DROP CONSTRAINT IF EXISTS exam_versions_exam_id_fkey;

        ALTER TABLE exam_versions 
        ADD CONSTRAINT exam_versions_exam_id_fkey 
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Exam Results linked to Exams
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_results') THEN
        ALTER TABLE exam_results 
        DROP CONSTRAINT IF EXISTS exam_results_exam_id_fkey;

        ALTER TABLE exam_results 
        ADD CONSTRAINT exam_results_exam_id_fkey 
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Exam Attempts linked to Exam Versions (Indirect link to Exam)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_attempts') THEN
        ALTER TABLE exam_attempts 
        DROP CONSTRAINT IF EXISTS exam_attempts_exam_version_id_fkey;

        ALTER TABLE exam_attempts 
        ADD CONSTRAINT exam_attempts_exam_version_id_fkey 
        FOREIGN KEY (exam_version_id) REFERENCES exam_versions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Exam Allocations/Registrations (if separate table)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_registrations') THEN
        ALTER TABLE exam_registrations DROP CONSTRAINT IF EXISTS exam_registrations_exam_id_fkey;
        ALTER TABLE exam_registrations ADD CONSTRAINT exam_registrations_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
    END IF;
END $$;
