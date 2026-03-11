import React from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { User } from '../../types';

interface ChatRoomListProps {
    contacts: User[];
    selectedContactId: string | null;
    onSelectContact: (id: string) => void;
    unreadCounts: Record<string, number>;
}

export const ChatRoomList = ({ contacts, selectedContactId, onSelectContact, unreadCounts }: ChatRoomListProps) => {
    return (
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-white">
            <div className="p-4 border-b bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Suas Conversas</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm" 
                        placeholder="Buscar contatos..." 
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {contacts.map(u => {
                    const isSelected = selectedContactId === u.id;
                    const unread = unreadCounts[u.id] || 0;

                    return (
                        <div
                            key={u.id}
                            onClick={() => onSelectContact(u.id)}
                            className={`p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex items-center gap-3 transition-colors relative group ${isSelected ? 'bg-sky-50 shadow-inner' : ''}`}
                        >
                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>}
                            
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-lg font-black text-slate-500 shadow-sm group-hover:scale-105 transition-transform">
                                {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    u.name.charAt(0)
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-sm text-slate-800 truncate">{u.name}</div>
                                    {unread > 0 && (
                                        <span className="bg-brand-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                                            {unread}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1 opacity-70">
                                    {u.role.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {contacts.length === 0 && (
                    <div className="p-12 text-center">
                        <UserIcon size={40} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-sm text-slate-400 font-medium">Nenhum contato autorizado encontrado para o seu vínculo.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
