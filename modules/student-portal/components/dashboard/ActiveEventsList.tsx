import React from 'react';
import { Award } from 'lucide-react';
import { GamifiedEvent } from '../../../../types';

interface ActiveEventsListProps {
    events: GamifiedEvent[];
}

export const ActiveEventsList: React.FC<ActiveEventsListProps> = ({ events }) => {
    if (events.length === 0) return null;

    return (
        <div className="bg-white border-l-4 border-amber-500 p-4 rounded-xl shadow-sm mb-6 flex items-center justify-between">
            <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2"><Award className="text-amber-500" /> Suas Competições</h4>
                <p className="text-sm text-slate-500">Você está inscrito em {events.length} evento(s). Prepare-se!</p>
            </div>
            <div className="flex gap-2">
                {events.map(e => (
                    <span key={e.id} className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">
                        {e.title}
                    </span>
                ))}
            </div>
        </div>
    );
};
