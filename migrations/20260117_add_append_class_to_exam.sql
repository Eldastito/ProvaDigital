-- Function: append_class_to_exam
-- Description: Appends a class ID to the class_ids array of an exam if it's not already there.
-- Usage: Used by Live Demo Lobby to link a new demo session to an existing exam.

CREATE OR REPLACE FUNCTION append_class_to_exam(p_exam_id UUID, p_class_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE exams
    SET class_ids = array_append(class_ids, p_class_id)
    WHERE id = p_exam_id
    AND NOT (class_ids @> ARRAY[p_class_id]); -- Só adiciona se não existir
END;
$$ LANGUAGE plpgsql;
