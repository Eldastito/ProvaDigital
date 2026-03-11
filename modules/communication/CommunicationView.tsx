import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, MoreVertical, ShieldCheck } from 'lucide-react';
import { useSafeAppStore } from '../../store/useAppStore';
import { chatService } from '../../services/chatService';
import { ChatMessage, User } from '../../types';
import { ChatRoomList } from './ChatRoomList';
import { ChatMessageItem } from './ChatMessageItem';

export const CommunicationView = () => {
    const { currentUser: user, users: allUsers, students, selectedChildId, tenantId } = useSafeAppStore();
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Contatos Autorizados (Vínculos Escolares)
    const authorizedContacts = React.useMemo(() => {
        if (!user) return [];
        return chatService.getAuthorizedContacts(user, allUsers, students, selectedChildId);
    }, [user, allUsers, students, selectedChildId]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const selectedContact = authorizedContacts.find(c => c.id === selectedContactId);

    // Efeito: Carregar sala e mensagens ao selecionar contato
    useEffect(() => {
        if (!selectedContactId || !user) return;

        const setupChat = async () => {
            setIsLoading(true);
            try {
                const roomId = await chatService.getOrCreatePrivateRoom(user.id, selectedContactId, tenantId || '');
                setActiveRoomId(roomId);
                
                const history = await chatService.loadMessages(roomId);
                setMessages(history);

                // Inscrição Realtime
                const subscription = chatService.subscribeToMessages(roomId, (payload) => {
                    const newMessage = payload.new as ChatMessage;
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                });

                return () => {
                    subscription.unsubscribe();
                };
            } catch (error) {
                console.error('Erro ao configurar chat:', error);
            } finally {
                setIsLoading(false);
            }
        };

        setupChat();
    }, [selectedContactId, user, tenantId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeRoomId || !user) return;
        
        const content = inputText;
        setInputText(''); // Clear input immediately for UX

        try {
            await chatService.sendMessage(activeRoomId, user.id, content);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            // Re-set input on error if needed
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Sidebar: Lista de Conversas */}
            <ChatRoomList 
                contacts={authorizedContacts}
                selectedContactId={selectedContactId}
                onSelectContact={setSelectedContactId}
                unreadCounts={{}} // Futuro: Implementar via store
            />

            {/* Área de Chat */}
            <div className="flex-1 flex flex-col bg-[#F8FAFC]">
                {selectedContact ? (
                    <>
                        {/* Header do Chat */}
                        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold">
                                    {selectedContact.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 leading-tight">{selectedContact.name}</div>
                                    <div className="text-[10px] text-brand-primary font-black uppercase flex items-center gap-1 mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        Online • {selectedContact.role.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="p-2 hover:bg-slate-50 rounded-full transition-colors cursor-help group relative">
                                    <ShieldCheck size={20} className="text-emerald-500" />
                                    <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        Mensagens criptografadas em trânsito e protegidas por RLS.
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-slate-50 rounded-full transition-colors"><MoreVertical size={20} className="text-slate-400" /></button>
                            </div>
                        </div>

                        {/* Corpo das Mensagens */}
                        <div className="flex-1 overflow-y-auto p-6 md:px-12" ref={scrollRef}>
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm font-bold text-slate-500">Sincronizando histórico...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-center mb-8">
                                        <div className="px-4 py-1.5 bg-sky-100/50 text-sky-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-200/50">
                                            Chat de Segurança Escolar Ativado
                                        </div>
                                    </div>
                                    {messages.map(msg => (
                                        <ChatMessageItem 
                                            key={msg.id} 
                                            message={msg} 
                                            isOwn={msg.sender_id === user?.id} 
                                        />
                                    ))}
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-20 opacity-30">
                                            <MessageSquare size={64} />
                                            <p className="font-medium">Nenhuma mensagem ainda. Inicie a conversa!</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Input de Mensagem */}
                        <div className="p-4 md:p-6 bg-white border-t border-slate-200">
                            <div className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all">
                                <textarea
                                    className="flex-1 bg-transparent border-none rounded-xl px-4 py-2.5 text-sm focus:ring-0 outline-none resize-none min-h-[44px] max-h-32 text-slate-800 leading-relaxed font-medium"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Digite sua mensagem privada e segura..."
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button 
                                    onClick={handleSendMessage} 
                                    disabled={!inputText.trim()}
                                    className={`p-3 rounded-xl transition-all shadow-lg ${inputText.trim() ? 'bg-brand-primary text-white hover:scale-105 active:scale-95 shadow-brand-primary/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    <Send size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center bg-white">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                            <MessageSquare size={48} className="opacity-20" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 mb-2">Seu HUB de Comunicação</h2>
                        <p className="max-w-xs text-sm font-medium leading-relaxed">Selecione um contato verificado ao lado para iniciar uma comunicação privada e pedagógica através do sistema ExamePad.</p>
                        
                        <div className="mt-12 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                <ShieldCheck className="text-emerald-500 mb-2" size={24} />
                                <div className="text-xs font-black text-slate-800">100% Privado</div>
                                <div className="text-[10px] text-slate-500 mt-1">Apenas os participantes têm acesso às mensagens.</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                <ShieldCheck className="text-brand-primary mb-2" size={24} />
                                <div className="text-xs font-black text-slate-800">Vínculos Reais</div>
                                <div className="text-[10px] text-slate-500 mt-1">Contatos filtrados por matrícula e turma escolar.</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
