
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageSquare, Send, User as UserIcon, ShieldCheck, GraduationCap, Search } from 'lucide-react';
import { AppState, User, ChatMessage, UserRole, ChatGroup, Student } from '../../types';
import { uuidv4 } from '../../utils/helpers';
import { useAppStore } from '../../store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { fetchMessages, fetchUsers, fetchStudents } from '../../services/supabaseClient';

interface CommunicationViewProps {
    state: AppState;
    user: User;
    onUpdateMessages?: (msg: ChatMessage) => void;
    onUpdateGroups?: (groups: ChatGroup[]) => void;
    onUpdateUser?: (user: User) => void;
}

export const CommunicationView = ({ state, user, onUpdateMessages }: CommunicationViewProps) => {
    const { data: allMessages, isLoading: messagesLoading } = useQuery<ChatMessage[]>({ queryKey: ['messages'], queryFn: fetchMessages, initialData: [] });
    const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({ queryKey: ['users'], queryFn: fetchUsers, initialData: [] });
    const { data: allStudents, isLoading: studentsLoading } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });

    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    
    const { selectedChildId } = useAppStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => { 
        if (allMessages) setLocalMessages(allMessages); 
    }, [allMessages]); 

    // Lógica de Contatos: Pais só falam com o staff da escola do filho selecionado
    const contacts = useMemo(() => {
        let direct: User[] = [];

        if (user.role === UserRole.PAIS) {
            const targetStudentId = selectedChildId || user.childrenIds?.[0];
            const student = allStudents?.find(s => s.id === targetStudentId);
            
            if (student) {
                direct = allUsers?.filter(u => 
                    (u.schoolId === student.schoolId && (u.role === UserRole.DIRETOR || u.role === UserRole.SUPERVISOR)) ||
                    (u.role === UserRole.PROFESSOR && u.classIds?.includes(student.classId))
                ) || [];
            }
        } else if (user.role === UserRole.ALUNO) {
            const studentRecord = allStudents?.find(s => s.id === user.id) || allStudents?.[0];
            if (studentRecord) {
                 direct = allUsers?.filter(u => 
                    (u.schoolId === studentRecord.schoolId && (u.role === UserRole.DIRETOR || u.role === UserRole.SUPERVISOR)) ||
                    (u.role === UserRole.PROFESSOR && u.classIds?.includes(studentRecord.classId))
                ) || [];
            }
        } else {
            direct = allUsers?.filter(u => u.id !== user.id && u.schoolId === user.schoolId) || [];
        }

        return { direct };
    }, [allUsers, user, selectedChildId, allStudents]);

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
        if (onUpdateMessages) onUpdateMessages(newMessage);
        setInputText('');
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeMessages]);

    if (messagesLoading || usersLoading || studentsLoading) {
        return <div className="p-8 text-center text-slate-500">Conectando ao canal de mensagens...</div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-in fade-in">
             <div className="flex gap-6 border-b border-slate-200 flex-shrink-0 justify-between items-center pb-6">
                <div>
                    <h1 className="text-3xl font-black text-brand-dark tracking-tighter uppercase italic flex items-center gap-3">
                        <MessageSquare className="text-brand-secondary" size={32}/> Comunicação Oficial
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Chat direto com a coordenação e corpo docente.</p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden flex">
                <div className="w-1/3 border-r border-slate-50 flex flex-col bg-slate-50/30">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contatos na Escola</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                <input className="w-full bg-white border border-slate-200 rounded-xl p-2.5 pl-10 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all" placeholder="Buscar staff..."/>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {contacts.direct.map(u => (
                            <div 
                                key={u.id} 
                                onClick={()=>setSelectedContactId(u.id)} 
                                className={`p-5 hover:bg-white cursor-pointer border-b border-slate-50 flex items-center gap-4 transition-all ${selectedContactId===u.id?'bg-white border-l-4 border-l-brand-primary shadow-sm':''}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-sm ${u.role === UserRole.PROFESSOR ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {u.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-slate-800 text-sm truncate">{u.name}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {u.role === UserRole.PROFESSOR ? <GraduationCap size={12} className="text-slate-400"/> : <ShieldCheck size={12} className="text-slate-400"/>}
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{u.role.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                            ))}
                            {contacts.direct.length === 0 && (
                                <div className="p-10 text-center flex flex-col items-center opacity-40">
                                    <UserIcon size={40} className="mb-2 text-slate-300"/>
                                    <p className="text-[10px] font-black uppercase text-slate-400">Nenhum contato ativo.</p>
                                </div>
                            )}
                        </div>
                </div>

                <div className="flex-1 flex flex-col bg-slate-50/20 relative">
                    {selectedContactId ? (
                        <>
                            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center z-10 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-brand-primary">
                                        {contacts.direct.find(c=>c.id===selectedContactId)?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 text-sm">{contacts.direct.find(c=>c.id===selectedContactId)?.name}</div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Disponível</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
                                {activeMessages.map(msg => (
                                    <div key={msg.id} className={`flex flex-col ${msg.senderId===user.id?'items-end':'items-start'}`}>
                                        <div className={`max-w-[70%] p-5 rounded-[1.5rem] text-sm font-medium shadow-xl transition-transform hover:scale-[1.01] ${msg.senderId===user.id?'bg-brand-primary text-white rounded-tr-none shadow-indigo-600/10':'bg-white border border-slate-50 text-slate-800 rounded-tl-none shadow-slate-200/50'}`}>
                                            <p className="leading-relaxed">{msg.content}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-300 mt-2 uppercase tracking-tighter">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                ))}
                                {activeMessages.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 h-full">
                                        <MessageSquare size={64} className="mb-4 text-slate-200"/>
                                        <p className="font-black uppercase tracking-widest text-[10px] text-slate-400 italic">Inicie o diálogo institucional...</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-white border-t border-slate-100">
                                <div className="flex gap-4 items-end bg-slate-50 p-2 rounded-[2rem] border border-slate-100 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                                    <textarea 
                                        className="flex-1 bg-transparent border-none p-4 text-sm font-medium text-slate-700 outline-none resize-none h-14 custom-scrollbar" 
                                        value={inputText} 
                                        onChange={e=>setInputText(e.target.value)} 
                                        placeholder="Escreva sua mensagem oficial..."
                                        onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                                    />
                                    <button onClick={handleSendMessage} className="bg-brand-primary text-white p-4 rounded-full hover:bg-brand-dark transition-all shadow-lg hover:scale-110 active:scale-95"><Send size={20}/></button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                            <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                                <MessageSquare size={48} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Central de Atendimento</h3>
                            <p className="text-slate-500 text-sm max-w-xs font-medium leading-relaxed italic">Selecione um profissional na lista para iniciar um atendimento seguro e registrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
