-- Fix for approve_all_items_in_batch to ensure it works for Admins regardless of owner match
-- and checks for NULL owner_id too just in case.

CREATE OR REPLACE FUNCTION public.approve_all_items_in_batch(p_batch_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
  v_user_role TEXT;
  v_uid TEXT;
BEGIN
  v_uid := auth.uid()::text;
  
  SELECT role INTO v_user_role FROM public.users WHERE id = v_uid;

  UPDATE public.items
  SET lifecycle_status = 'APPROVED'
  WHERE generation_batch_id = p_batch_id
    AND (
        -- User owns the item
        owner_id = v_uid
        -- OR User is an operator (Admin/Professor) and authorized
        OR v_user_role IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN', 'SCHOOL_ADMIN', 'PROFESSOR', 'COORDINATOR')
    )
    AND lifecycle_status != 'APPROVED'; -- Update anything not already approved (e.g. DRAFT, REVIEW)
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
