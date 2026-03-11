-- Módulo de Chat Multiprofil - Migração SQL
-- Este script cria as tabelas necessárias para o sistema de chat em tempo real.

-- 1. Tabela de Salas (Rooms)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT, -- Nulo para conversas privadas 1:1
    type TEXT DEFAULT 'PRIVATE', -- 'PRIVATE' ou 'GROUP'
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Participantes (Participants)
CREATE TABLE IF NOT EXISTS public.chat_participants (
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (room_id, user_id)
);

-- 3. Tabela de Mensagens (Messages)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'TEXT',
    attachment_json JSONB, -- Espaço para futuras expansões (imagens, PDFs)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_read BOOLEAN DEFAULT false
);

-- 4. Segurança de Nível de Linha (RLS)
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Política para chat_rooms: Usuários só veem salas em que participam
CREATE POLICY room_access ON public.chat_rooms
    FOR ALL
    TO authenticated
    USING (
        id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
    );

-- Política para chat_participants: Usuários só veem participantes das suas salas
CREATE POLICY participant_access ON public.chat_participants
    FOR ALL
    TO authenticated
    USING (
        room_id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
    );

-- Política para chat_messages: Usuários só leem/enviam mensagens em suas salas
CREATE POLICY message_access ON public.chat_messages
    FOR ALL
    TO authenticated
    USING (
        room_id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
    )
    WITH CHECK (
        room_id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid()) AND
        sender_id = auth.uid()
    );

-- 5. Habilitar Tempo Real (Realtime)
-- Nota: Certifique-se de que a publicação 'supabase_realtime' existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
END $$;
