import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Sparkles, MessageCircle } from 'lucide-react';

export const FloatingOwlHelp = () => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tooltip / Hint */}
            {isHovered && (
                <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300 border border-slate-700">
                    Posso ajudar? 🦉
                </div>
            )}

            {/* The Floating Button */}
            <button
                onClick={() => navigate('/aluno/tutor')}
                className={`
                    group relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500
                    ${isHovered
                        ? 'bg-emerald-500 scale-110 rotate-3 shadow-[0_20px_40px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
                    }
                `}
            >
                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-emerald-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

                {/* Icon Container */}
                <div className="relative transform group-hover:scale-110 transition-transform duration-500">
                    <Bot
                        size={28}
                        className={`transition-colors duration-500 ${isHovered ? 'text-white' : 'text-emerald-400'}`}
                        strokeWidth={2}
                    />

                    {/* Pulsing Dot */}
                    {!isHovered && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
                    )}
                </div>

                {/* Sparkles on Hover */}
                {isHovered && (
                    <div className="absolute -top-2 -left-2 text-yellow-400 animate-bounce">
                        <Sparkles size={16} />
                    </div>
                )}
            </button>
        </div>
    );
};
