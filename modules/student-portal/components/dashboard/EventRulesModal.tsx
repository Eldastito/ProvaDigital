import React from 'react';
import { Trophy, AlertTriangle } from 'lucide-react';
import { GamifiedEvent } from '../../../../types';

interface EventRulesModalProps {
    isOpen: boolean;
    eventId: string | null;
    availableEvents: GamifiedEvent[];
    onClose: () => void;
    onAccept: (eventId: string) => void;
}

export const EventRulesModal: React.FC<EventRulesModalProps> = ({
    isOpen,
    eventId,
    availableEvents,
    onClose,
    onAccept
}) => {
    if (!isOpen || !eventId) return null;

    const event = availableEvents.find(e => e.id === eventId);
    if (!event) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-purple-200">
                <div className="bg-purple-900 p-6 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Trophy size={24} className="text-yellow-400" /> Regras do Evento</h2>
                </div>
                <div className="p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-2">{event.title}</h3>
                    <p className="text-sm text-slate-600 mb-4 italic">{event.description}</p>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed font-medium mb-6">
                        {event.rules}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded mb-6 border border-amber-100">
                        <AlertTriangle size={14} /> Ao aceitar, você se compromete a participar no dia do evento.
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-3 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                        <button onClick={() => onAccept(eventId)} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700">Aceitar & Inscrever</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
