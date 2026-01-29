import React from 'react';
import { Calendar } from 'lucide-react';
import { Announcement } from '../../../../types';

interface AnnouncementsWidgetProps {
    announcements: Announcement[];
}

export const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({ announcements }) => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar size={18} /> Mural da Escola</h3>
            <div className="space-y-4">
                {announcements.map(ann => (
                    <div key={ann.id} className={'p-3 rounded-lg border-l-4 ' + (ann.type === 'URGENTE' ? 'border-rose-500 bg-rose-50' : 'border-brand-secondary bg-slate-50') + ' '}>
                        <div className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
                            <span>{ann.type}</span>
                            <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="font-bold text-slate-800 text-sm mb-1">{ann.title}</div>
                        <p className="text-xs text-slate-600 line-clamp-3">{ann.content}</p>
                    </div>
                ))}
                {announcements.length === 0 && <p className="text-slate-400 text-sm">Nenhum aviso.</p>}
            </div>
        </div>
    );
};
