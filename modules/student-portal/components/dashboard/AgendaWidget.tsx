import React from 'react';
import { Calendar } from 'lucide-react';

interface AgendaEvent {
    type: string;
    title: string;
    date: string;
}

interface AgendaWidgetProps {
    monthEvents: AgendaEvent[];
    onExpand: () => void;
}

export const AgendaWidget: React.FC<AgendaWidgetProps> = ({ monthEvents, onExpand }) => {

    const getEventColor = (type: string) => {
        switch (type) {
            case 'PROVA': return 'bg-rose-500 border-rose-600 text-white';
            case 'TRABALHO': return 'bg-blue-500 border-blue-600 text-white';
            case 'EVENTO': return 'bg-emerald-500 border-emerald-600 text-white';
            case 'COMPETICAO': return 'bg-amber-500 border-amber-600 text-white';
            default: return 'bg-slate-400 border-slate-500 text-white';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={18} /> Agenda Rápida</h3>
                <button onClick={onExpand} className="text-xs text-brand-primary hover:underline">Expandir</button>
            </div>
            <div className="space-y-2">
                {monthEvents.slice(0, 3).map((ev, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded transition">
                        <div className={'w-2 h-8 rounded-full ' + (getEventColor(ev.type).split(' ')[0]) + ' '}></div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase">{new Date(ev.date || '').toLocaleDateString()}</div>
                            <div className="text-sm font-bold text-slate-800 line-clamp-1">{ev.title}</div>
                        </div>
                    </div>
                ))}
                {monthEvents.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sem eventos próximos.</p>}
            </div>
        </div>
    );
};
