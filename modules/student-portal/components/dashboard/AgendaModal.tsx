import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface AgendaEvent {
    type: string;
    title: string;
    date: string;
}

interface AgendaModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMonth: Date;
    onChangeMonth: (delta: number) => void;
    daysInMonth: number;
    firstDayOfMonth: number;
    getEventsForDay: (day: number) => AgendaEvent[];
    getAllMonthEvents: () => (AgendaEvent & { day: number })[];
}

export const AgendaModal: React.FC<AgendaModalProps> = ({
    isOpen,
    onClose,
    currentMonth,
    onChangeMonth,
    daysInMonth,
    firstDayOfMonth,
    getEventsForDay,
    getAllMonthEvents
}) => {
    if (!isOpen) return null;

    const getEventColor = (type: string) => {
        switch (type) {
            case 'PROVA': return 'bg-rose-500 border-rose-600 text-white';
            case 'TRABALHO': return 'bg-blue-500 border-blue-600 text-white';
            case 'EVENTO': return 'bg-emerald-500 border-emerald-600 text-white';
            case 'FERIADO': return 'bg-rose-200 border-rose-600 text-rose-800';
            case 'COMPETICAO': return 'bg-amber-500 border-amber-600 text-white';
            default: return 'bg-slate-400 border-slate-500 text-white';
        }
    };

    const getEventLabel = (type: string) => {
        switch (type) {
            case 'PROVA': return 'Prova/Avaliação';
            case 'TRABALHO': return 'Trabalho/Pesquisa';
            case 'EVENTO': return 'Evento Escolar';
            case 'FERIADO': return 'Feriado/Bloqueio';
            case 'COMPETICAO': return 'Competição';
            default: return 'Comunicado Geral';
        }
    };

    const allMonthEvents = getAllMonthEvents();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col border-2 border-brand-primary relative overflow-hidden">
                <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-brand-primary" /> Agenda Escolar</h2>
                    <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Calendar Sidebar */}
                    <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => onChangeMonth(-1)} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft size={20} /></button>
                            <span className="font-bold text-lg">{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => onChangeMonth(1)} className="p-1 hover:bg-slate-200 rounded"><ChevronRight size={20} /></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-bold text-slate-400">
                            <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-sm">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={'empty-' + i} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const events = getEventsForDay(day);
                                const hasEvent = events.length > 0;
                                return (
                                    <div key={day} className={'h-10 flex flex-col items-center justify-center rounded-lg relative ' + (hasEvent ? 'bg-white border border-slate-200 font-bold shadow-sm' : 'text-slate-400') + ' '}>
                                        {day}
                                        {hasEvent && (
                                            <div className="flex gap-0.5 mt-1">
                                                {events.slice(0, 3).map((e, idx) => (
                                                    <div key={idx} className={'w-1.5 h-1.5 rounded-full ' + (getEventColor(e.type).split(' ')[0]) + ' '}></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 border-t pt-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Legenda de Atividades</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Prova / Avaliação</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Trabalho / Pesquisa</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Evento Escolar</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-200 border border-rose-600"></div> Feriado / Bloqueio</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Competição</div>
                            </div>
                        </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 p-8 overflow-y-auto bg-white">
                        <h3 className="font-bold text-slate-800 text-lg mb-6">Eventos do Mês</h3>
                        <div className="space-y-4">
                            {allMonthEvents.map((ev, i) => {
                                const colorClass = getEventColor(ev.type);
                                const isSpecial = ev.type === 'FERIADO';
                                return (
                                    <div key={i} className={`p-4 rounded-xl border-l-4 flex gap-4 shadow-sm ${isSpecial ? colorClass : 'bg-slate-50 ' + colorClass.split(' ')[1]}`}>
                                        <div className="flex flex-col items-center justify-center px-4 border-r border-slate-200 min-w-[70px]">
                                            <span className={`text-2xl font-black ${isSpecial ? 'text-rose-900' : 'text-slate-700'}`}>{new Date(ev.date || '').getDate()}</span>
                                            <span className={`text-xs uppercase font-bold ${isSpecial ? 'text-rose-600' : 'text-slate-400'}`}>{new Date(ev.date || '').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={'text-[10px] font-bold px-2 py-0.5 rounded text-white ' + (getEventColor(ev.type).split(' ')[0]) + ' '}>
                                                    {getEventLabel(ev.type)}
                                                </span>
                                            </div>
                                            <div className={`font-bold text-lg ${isSpecial ? 'text-rose-900' : 'text-slate-800'}`}>{ev.title}</div>
                                            <div className={`text-xs mt-1 ${isSpecial ? 'text-rose-700' : 'text-slate-500'}`}>Clique para ver detalhes (se disponível).</div>
                                        </div>
                                    </div>
                                );
                            })}
                            {allMonthEvents.length === 0 && (
                                <div className="text-center py-20 text-slate-400">
                                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Nenhum evento agendado para este mês.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
