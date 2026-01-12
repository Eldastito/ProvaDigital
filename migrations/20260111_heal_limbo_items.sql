-- HEAL LIMBO ITEMS: Recuperação de Questões Órfãs
-- Este script associa itens que estão sem owner_id ao criador do seu lote
-- Isso os torna visíveis novamente via RLS.

DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- 1. Atualiza itens associando o owner_id baseado no creator_id do lote
    UPDATE public.items i
    SET owner_id = b.creator_id
    FROM public.item_generation_batches b
    WHERE i.generation_batch_id = b.id
      AND (i.owner_id IS NULL OR i.owner_id = '');

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Itens recuperados e associados: %', updated_count;

    -- 2. Garante que itens DRAFT antigos tenham pelo menos um owner_id se o lote existir
    -- (Opcional: se o lote não tiver creator_id, podemos atribuir a um admin específico se necessário)
END $$;
