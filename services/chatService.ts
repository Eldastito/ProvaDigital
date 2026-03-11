import { supabase } from './supabaseClient';
import { ChatMessage, User, UserRole, ChatParticipant } from '../types';

/**
 * Serviço de Chat para o ecossistema ExamePad.
 * Gerencia a comunicação em tempo real entre Professores, Alunos e Pais.
 */
export const chatService = {
    /**
     * Busca ou cria uma sala privada entre dois usuários.
     */
    getOrCreatePrivateRoom: async (userId: string, targetId: string, tenantId: string) => {
        // 1. Verificar se já existe uma sala privada entre esses dois
        const { data: existingRoom, error: fetchError } = await supabase
            .rpc('get_private_chat_room', { user_a: userId, user_b: targetId });

        if (existingRoom) return existingRoom.id;

        // 2. Se não existir, criar nova sala
        const { data: newRoom, error: roomError } = await supabase
            .from('chat_rooms')
            .insert({ tenant_id: tenantId, type: 'PRIVATE' })
            .select()
            .single();

        if (roomError) throw roomError;

        // 3. Adicionar participantes
        const { error: partError } = await supabase
            .from('chat_participants')
            .insert([
                { room_id: newRoom.id, user_id: userId },
                { room_id: newRoom.id, user_id: targetId }
            ]);

        if (partError) throw partError;

        return newRoom.id;
    },

    /**
     * Envia uma mensagem para uma sala específica.
     */
    sendMessage: async (roomId: string, senderId: string, content: string) => {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                room_id: roomId,
                sender_id: senderId,
                content: content.trim(),
                type: 'TEXT'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Carrega o histórico de mensagens de uma sala.
     */
    loadMessages: async (roomId: string, limit = 50) => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    /**
     * Inscreve-se para atualizações em tempo real de mensagens.
     */
    subscribeToMessages: (roomId: string, onNewMessage: (payload: any) => void) => {
        return supabase
            .channel(`room:${roomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `room_id=eq.${roomId}`
            }, onNewMessage)
            .subscribe();
    },

    /**
     * Filtra contatos permitidos com base no perfil e vínculos escolares.
     */
    getAuthorizedContacts: (currentUser: User, allUsers: User[], students: any[], selectedChildId?: string) => {
        if (currentUser.role === UserRole.PAIS) {
            const targetStudentId = selectedChildId || currentUser.childrenIds?.[0];
            const student = students.find(s => s.id === targetStudentId);
            if (!student) return [];

            return allUsers.filter(u =>
                (u.schoolId === student.schoolId && (u.role === UserRole.DIRETOR || u.role === UserRole.SUPERVISOR)) ||
                (u.role === UserRole.PROFESSOR && u.classIds?.includes(student.classId))
            );
        }

        if (currentUser.role === UserRole.ALUNO) {
            const studentRecord = students.find(s => s.id === currentUser.id);
            if (!studentRecord) return [];

            return allUsers.filter(u =>
                (u.schoolId === studentRecord.schoolId && (u.role === UserRole.DIRETOR || u.role === UserRole.SUPERVISOR)) ||
                (u.role === UserRole.PROFESSOR && u.classIds?.includes(studentRecord.classId))
            );
        }

        if (currentUser.role === UserRole.PROFESSOR) {
            // Professor vê: Seus alunos, pais desses alunos e outros professores da mesma escola
            return allUsers.filter(u => {
                if (u.id === currentUser.id) return false;
                if (u.schoolId !== currentUser.schoolId) return false;
                
                if (u.role === UserRole.ALUNO) {
                    return currentUser.classIds?.some(cid => u.classIds?.includes(cid));
                }
                if (u.role === UserRole.PAIS) {
                    // Verificar se o pai tem um filho na turma do professor
                    const childrensInClass = students.filter(s => 
                        u.childrenIds?.includes(s.id) && 
                        currentUser.classIds?.includes(s.classId)
                    );
                    return childrensInClass.length > 0;
                }
                return u.role === UserRole.PROFESSOR || u.role === UserRole.DIRETOR;
            });
        }

        // Staff Global/Admin vê todos na escola
        return allUsers.filter(u => u.id !== currentUser.id && u.schoolId === currentUser.schoolId);
    }
};
