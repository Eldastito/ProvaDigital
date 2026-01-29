
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageSquare, Send, User as UserIcon } from 'lucide-react';
import { AppState, User, ChatMessage, UserRole, ChatGroup } from '../../types';
import { uuidv4 } from '../../utils/helpers';
import { useAppStore } from '../../store/useAppStore';

interface CommunicationViewProps {
    state: AppState;
    user: User;
    onUpdateMessages?: (msgs: ChatMessage[]) => void;
    onUpdateGroups?: (groups: ChatGroup[]) => void;
    onUpdateUser?: (user: User) => void;
}

export const CommunicationView = () => {
    const state = useAppStore();
    const { currentUser: user, updateMessages: onUpdateMessages } = state;
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>(state.messages);

    const { selectedChildId } = useAppStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setLocalMessages(state.messages); }, [state.messages]);

    // Contact Logic (Restricted for Parents and Students)
    const contacts = useMemo(() => {
        let direct: any[] = [];

        if (user.role === UserRole.PAIS) {
            // Pais veem: Diretores, Coordenadores, e Professores do filho selecionado
            const targetStudentId = selectedChildId || user.childrenIds?.[0];
            const student = state.students.find(s => s.id === targetStudentId);

            if (student) {
                direct = state.users.filter(u =>
                    // Diretor/Coord da escola do filho
                    (u.schoolId === student.schoolId && (u.role === UserRole.DIRETOR || u.role === UserRole.SUPERVISOR)) ||
                    // Professores da turma do filho
                    (u.role === UserRole.PROFESSOR && u.classIds?.includes(student.classId))
                );
            }
        } else if (user.role === UserRole.ALUNO) {
            // Alunos veem: Diretores, Coordenadores, e Professores da sua própria turma
            const studentRecord = state.students.find(s => s.id === user.id) || state.students[0]; // Fallback safe

            if (studentRecord) {
                direct = state.users.filter(u =>
                    (u.schoolId === studentRecord.schoolId && (u.role === UserRole.DIRETOR || u.role === UserRole.SUPERVISOR)) ||
                    (u.role === UserRole.PROFESSOR && u.classIds?.includes(studentRecord.classId))
                );
            }
        } else {
            // Staff vê outros staff da mesma escola
            direct = state.users.filter(u => u.id !== user.id && u.schoolId === user.schoolId);
        }

        return { direct };
    }, [state.users, user, selectedChildId]);

    const activeMessages = localMessages.filter(m => {
        return (m.senderId === user.id && m.recipientId === selectedContactId) || (m.senderId === selectedContactId && m.recipientId === user.id);
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const handleSendMessage = () => {
        if (!inputText.trim() || !selectedContactId) return;
        const newMessage: ChatMessage = {
            id: uuidv4(),
            senderId: user.id,
            recipientId: selectedContactId,
            content: inputText,
            timestamp: new Date().toISOString(),
            isRead: false
        };
        const newMsgs = [...localMessages, newMessage];
        setLocalMessages(newMsgs);
        if (onUpdateMessages) onUpdateMessages(newMsgs);
        setInputText('');
    };

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeMessages]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col">
            <div className="flex gap-6 border-b border-slate-200 flex-shrink-0 justify-between items-center pb-4">
                <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                    <MessageSquare className="text-brand-secondary" /> Mensagens Diretas
                </h1>
            </div>

            {/* CHAT VIEW ONLY */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
                <div className="w-1/3 border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b bg-slate-50">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Seus Contatos</h3>
                        <input className="w-full border rounded-lg p-2 text-sm" placeholder="Buscar..." />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {contacts.direct.map(u => (
                            <div
                                key={u.id}
                                onClick={() => setSelectedContactId(u.id)}
                                className={`p-4 hover:bg-slate-50 cursor-pointer border-b flex items-center gap-3 ${selectedContactId === u.id ? 'bg-sky-50 border-l-4 border-l-brand-primary' : ''}`}
                            >
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">{u.name.charAt(0)}</div>
                                <div>
                                    <div className="font-bold text-sm text-slate-800">{u.name}</div>
                                    <div className="text-xs text-slate-500 capitalize">{u.role.toLowerCase().replace('_', ' ')}</div>
                                </div>
                            </div>
                        ))}
                        {contacts.direct.length === 0 && (
                            <div className="p-6 text-center text-slate-400 text-sm">
                                Nenhum contato disponível no momento.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-slate-50/50">
                    {selectedContactId ? (
                        <>
                            <div className="p-4 bg-white border-b font-bold text-slate-800 flex items-center gap-2 shadow-sm">
                                <UserIcon size={18} /> Chat com {contacts.direct.find(c => c.id === selectedContactId)?.name}
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                                {activeMessages.map(msg => (
                                    <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-xl text-sm shadow-sm ${msg.senderId === user.id ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}>
                                            <p>{msg.content}</p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                                {activeMessages.length === 0 && (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                                        Inicie a conversa...
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
                                <textarea
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none resize-none h-12"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                />
                                <button onClick={handleSendMessage} className="bg-brand-primary text-white p-3 rounded-xl hover:bg-brand-dark transition"><Send size={20} /></button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <MessageSquare size={48} className="opacity-20 mb-4" />
                            <p>Selecione um contato para iniciar uma conversa.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
