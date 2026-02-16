-- Migration: Marketplace Schema (20260216)
-- Descrição: Adiciona suporte para compartilhamento de questões na rede (Marketplace).

-- 1. Alterar tabela `items` para suportar metadados de marketplace
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS downloads_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS author_name TEXT; -- Denormalização para performance

-- Index para busca rápida de itens públicos
CREATE INDEX IF NOT EXISTS idx_items_is_public ON public.items(is_public);
CREATE INDEX IF NOT EXISTS idx_items_knowledge_area ON public.items(knowledge_area);
CREATE INDEX IF NOT EXISTS idx_items_subject ON public.items(subject);

-- 2. Tabela de Interações (Downloads/Likes/Ratings)
CREATE TABLE IF NOT EXISTS public.marketplace_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('DOWNLOAD', 'LIKE', 'RATING', 'VIEW')),
    rating_value INTEGER CHECK (rating_value BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para agilização de contagem
CREATE INDEX IF NOT EXISTS idx_marketplace_interactions_item_id ON public.marketplace_interactions(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_interactions_type ON public.marketplace_interactions(type);

-- 3. RLS Policies
-- Permitir leitura de itens PÚBLICOS por QUALQUER usuário autenticado
-- (A policy existente provavelmente restringe por tenant_id ou owner_id. Precisamos adicionar OR is_public = true)

-- Nota: Como alterar policies existentes pode ser complexo sem ver a definição original, 
-- vamos criar uma policy específica para leitura pública que se soma às existentes (Supabase usa OR por padrão entre policies permissivas).

CREATE POLICY "Items Public Read Access" ON public.items
    FOR SELECT
    TO authenticated
    USING (is_public = true);

-- Policies para marketplace_interactions
ALTER TABLE public.marketplace_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create interactions" ON public.marketplace_interactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view interactions" ON public.marketplace_interactions
    FOR SELECT
    TO authenticated
    USING (true); -- Permitir ver likes/downloads (ou restringir se necessário)

-- 4. Funções e Triggers para contadores atômicos
-- Incremento de downloads
CREATE OR REPLACE FUNCTION increment_downloads(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.items
    SET downloads_count = downloads_count + 1
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualização automática de média de avaliação
CREATE OR REPLACE FUNCTION update_item_rating_avg()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.type = 'RATING' AND NEW.rating_value IS NOT NULL THEN
        UPDATE public.items
        SET rating_avg = (
            SELECT AVG(rating_value)::DECIMAL(3,2)
            FROM public.marketplace_interactions
            WHERE item_id = NEW.item_id AND type = 'RATING'
        )
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_item_rating ON public.marketplace_interactions;
CREATE TRIGGER trigger_update_item_rating
AFTER INSERT OR UPDATE ON public.marketplace_interactions
FOR EACH ROW EXECUTE FUNCTION update_item_rating_avg();
