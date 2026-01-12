-- HEAL LIMBO ITEMS: Recuperação de Questões Órfãs e Ajuste de Permissões
-- Este script resolve a invisibilidade de rascunhos para administradores.

-- 1. Atualizar RLS de Items para permitir que ADM vejam DRAFT
DROP POLICY IF EXISTS "Read items refined" ON public.items;
CREATE POLICY "Read items refined" ON public.items 
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      lifecycle_status != 'DRAFT' OR 
      owner_id = auth.uid()::text OR
      (SELECT role FROM public.users WHERE id = auth.uid()::text) IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN')
    )
  );

-- 2. Atualizar RPC de Aprovação em Lote para permitir ADM
CREATE OR REPLACE FUNCTION public.approve_all_items_in_batch(p_batch_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.items
  SET lifecycle_status = 'APPROVED'
  WHERE generation_batch_id = p_batch_id
    AND (
      owner_id = auth.uid()::text OR
      (SELECT role FROM public.users WHERE id = auth.uid()::text) IN ('SUPER_ADMIN', 'STATE_ADMIN', 'TENANT_ADMIN')
    )
    AND lifecycle_status = 'DRAFT';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Resgatar questões órfãs (Data Healing)
DO $$
DECLARE
    rescued_count INTEGER;
BEGIN
    UPDATE public.items i
    SET owner_id = b.creator_id
    FROM public.item_generation_batches b
    WHERE i.generation_batch_id = b.id
      AND (i.owner_id IS NULL OR i.owner_id = '');

    GET DIAGNOSTICS rescued_count = ROW_COUNT;
    RAISE NOTICE 'Itens recuperados e associados: %', rescued_count;
END $$;
