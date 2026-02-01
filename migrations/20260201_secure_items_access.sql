-- ==============================================================================
-- MIGRATION: 20260201_secure_items_access.sql
-- Description: Bloqueio de Segurança Final
-- 1. Revoga leitura pública da tabela 'items'
-- 2. Cria RPC segura para retornar questões da prova SEM gabarito/TRI
-- Severity: CRITICAL
-- ==============================================================================

-- 1. REVOKING DIRECT ACCESS TO ITEMS
-- Anteriormente: Auth users podiam ler tudo (incluindo isCorrect, triParams)
DROP POLICY IF EXISTS "Read items" ON public.items;

-- Nova Política: Apenas Professores/Staff podem ler a tabela bruta (para edição/correção)
CREATE POLICY "Strict read items" 
ON public.items FOR SELECT 
USING (
    public.get_current_user_role() IN ('PROFESSOR', 'SUPERVISOR', 'DIRETOR', 'TENANT_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN')
    OR
    owner_id = auth.uid()::text -- Quem criou sempre vê
);

-- 2. SECURE RPC FOR EXAM TAKING
-- Esta função será usada pelo StudentApp. Ela "higieniza" os dados.
CREATE OR REPLACE FUNCTION public.get_secure_exam_content(p_exam_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Roda como Admin para poder ler a tabela 'items' bloqueada acima
AS $$
DECLARE
    v_exam RECORD;
    v_item_ids TEXT[];
    v_items JSONB;
BEGIN
    -- 2.1 Verificar se prova existe e está publicada
    SELECT * INTO v_exam 
    FROM public.exams 
    WHERE id = p_exam_id::text
    AND status = 'PUBLISHED'; -- ou PUBLICADA dependendo do enum
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prova não disponível ou inválida.';
    END IF;

    -- 2.2 Extrair IDs das questões
    -- Lógica robusta para suportar list de strings ou array de objetos
    SELECT ARRAY(
        SELECT 
            CASE 
                WHEN jsonb_typeof(item) = 'object' THEN item->>'itemId'
                ELSE item::text
            END
        FROM jsonb_array_elements(v_exam.items_config) as item
    ) INTO v_item_ids;

    -- Fallback para coluna antiga se items_config falhar
    IF array_length(v_item_ids, 1) IS NULL THEN
        SELECT item_ids INTO v_item_ids FROM public.exams WHERE id = p_exam_id::text;
    END IF;

    -- 2.3 Buscar Questões Sanitizadas
    -- Retorna apenas o necessário para RENDERIZAR a questão.
    -- REMOVE: tri_params, correct_justification, bncc_code
    -- LIMPA: alternatives (remove isCorrect)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', i.id,
            'statement', i.statement,
            'type', i.type,
            'subject', i.subject,
            'difficulty', i.difficulty, -- Pode mostrar nível (Fácil/Médio) sem expor 'b' exato
            'multimedia', i.multimedia,
            'alternatives', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', a->>'id',
                        'text', a->>'text'
                        -- remove 'isCorrect'
                    )
                )
                FROM jsonb_array_elements(i.alternatives) as a
            )
        )
    ) INTO v_items
    FROM public.items i
    WHERE i.id = ANY(v_item_ids);

    RETURN v_items;
END;
$$;
