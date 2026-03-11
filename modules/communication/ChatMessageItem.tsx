import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChatMessage } from '../../types';

interface ChatMessageItemProps {
    message: ChatMessage;
    isOwn: boolean;
}

export const ChatMessageItem = ({ message, isOwn }: ChatMessageItemProps) => {
    const time = format(new Date(message.timestamp), 'HH:mm', { locale: ptBR });

    return (
        <div className={`flex flex-col mb-4 ${isOwn ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div 
                className={`max-w-[85%] md:max-w-[70%] p-3.5 rounded-2xl text-sm shadow-sm transition-all relative
                ${isOwn 
                    ? 'bg-brand-primary text-white rounded-tr-none border-b-2 border-brand-dark/20' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none border-b-2 border-slate-300/10'
                }`}
            >
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <div className={`text-[10px] mt-1.5 flex items-center gap-1 opacity-70 font-medium ${isOwn ? 'text-white/80' : 'text-slate-400'}`}>
                    {time}
                    {isOwn && (
                        <svg className="w-3 h-3 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
};
