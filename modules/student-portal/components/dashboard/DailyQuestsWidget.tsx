import React from 'react';
import { Target, Check, Star } from 'lucide-react';

export const DailyQuestsWidget: React.FC = () => {
    // --- MOCK DAILY QUESTS ---
    const dailyQuests = [
        { id: 1, title: 'Foco Total', desc: 'Complete 1 pomodoro de 25m', xp: 50, done: false },
        { id: 2, title: 'Mestre dos Simulados', desc: 'Acerte 80% em um simulado', xp: 100, done: true },
        { id: 3, title: 'Presença Diária', desc: 'Faça login no portal', xp: 10, done: true },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={100} /></div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
                <Target size={20} className="text-brand-primary" /> Missões Diárias
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {dailyQuests.map(q => (
                    <div key={q.id} className={'p-3 rounded-lg border flex items-center gap-3 ' + (q.done ? 'bg-emerald-50 border-emerald-200 opacity-80' : 'bg-white border-slate-200') + ' '}>
                        <div className={'w-8 h-8 rounded-full flex items-center justify-center ' + (q.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400') + ' '}>
                            {q.done ? <Check size={16} /> : <Star size={16} />}
                        </div>
                        <div>
                            <div className={'text-sm font-bold ' + (q.done ? 'text-emerald-800 line-through' : 'text-slate-700') + ' '}>{q.title}</div>
                            <div className="text-xs text-slate-500">{q.desc}</div>
                            {!q.done && <div className="text-[10px] font-bold text-amber-600 mt-1">+{q.xp} XP</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
