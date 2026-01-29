import React from 'react';
import { Sparkles, Calendar, Coins, Check, Trophy } from 'lucide-react';
import { GamifiedEvent } from '../../../../types';

interface EventInvitationsProps {
    events: GamifiedEvent[];
    onAccept: (eventId: string) => void;
}

export const EventInvitations: React.FC<EventInvitationsProps> = ({ events, onAccept }) => {
    if (events.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg mb-6 relative overflow-hidden animate-in slide-in-from-top-4">
            <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles className="text-yellow-400" /> Convites Especiais ({events.length})</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {events.map(evt => (
                        <div key={evt.id} className="min-w-[280px] bg-white/10 border border-white/20 p-4 rounded-lg hover:bg-white/20 transition">
                            <div className="text-xs font-bold text-purple-200 uppercase mb-1">{evt.type.replace('_', ' ')}</div>
                            <h4 className="font-bold text-lg leading-tight mb-2">{evt.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-purple-100 mb-3">
                                <Calendar size={12} /> {new Date(evt.eventDate).toLocaleDateString()}
                                <span className="opacity-50">|</span>
                                <Coins size={12} className="text-yellow-400" /> Prémio: {evt.rewardCoins}
                            </div>
                            <button
                                onClick={() => onAccept(evt.id)}
                                className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold shadow-sm border border-indigo-200 hover:bg-indigo-50 transition flex items-center gap-2"
                            >
                                <Check size={16} /> Aceitar Convite
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <Trophy size={150} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
        </div>
    );
};
