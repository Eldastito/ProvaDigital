/**
 * Calendar View Component
 * 
 * Calendário interativo para visualizar agendamentos de provas.
 * Sprint 0 - Parte 1
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Event, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ScheduledExam } from '../../services/schedulingService';
import { Calendar as CalendarIcon, Clock, Users, Wifi, WifiOff } from 'lucide-react';

// Configurar localização pt-BR
const locales = {
    'pt-BR': ptBR
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales
});

// Event personalizado para react-big-calendar
interface CalendarEvent extends Event {
    resource: ScheduledExam;
}

interface CalendarViewProps {
    schedules: ScheduledExam[];
    onSelectEvent?: (schedule: ScheduledExam) => void;
    onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
    onNavigate?: (date: Date) => void;
    onView?: (view: View) => void;
    selectedDate?: Date;
    view?: View;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    schedules,
    onSelectEvent,
    onSelectSlot,
    onNavigate,
    onView,
    selectedDate = new Date(),
    view = 'month'
}) => {
    const [currentView, setCurrentView] = useState<View>(view);

    // Converter schedules para eventos do calendário
    const events = useMemo((): CalendarEvent[] => {
        return schedules.map(schedule => ({
            title: schedule.examTitle,
            start: schedule.scheduledFor,
            end: new Date(schedule.scheduledFor.getTime() + schedule.duration * 60000),
            resource: schedule
        }));
    }, [schedules]);

    // Handler de seleção de evento
    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        if (onSelectEvent) {
            onSelectEvent(event.resource);
        }
    }, [onSelectEvent]);

    // Handler de seleção de slot
    const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
        if (onSelectSlot) {
            onSelectSlot(slotInfo);
        }
    }, [onSelectSlot]);

    // Handler de mudança de view
    const handleViewChange = useCallback((newView: View) => {
        setCurrentView(newView);
        if (onView) {
            onView(newView);
        }
    }, [onView]);

    // Estilização customizada dos eventos
    const eventStyleGetter = useCallback((event: CalendarEvent) => {
        const schedule = event.resource;

        let backgroundColor = '#3b82f6'; // blue-500 (default)
        let borderColor = '#2563eb'; // blue-600

        // Cores por status
        if (schedule.status === 'ACTIVE') {
            backgroundColor = '#10b981'; // green-500
            borderColor = '#059669'; // green-600
        } else if (schedule.status === 'COMPLETED') {
            backgroundColor = '#6b7280'; // gray-500
            borderColor = '#4b5563'; // gray-600
        } else if (schedule.status === 'CANCELLED') {
            backgroundColor = '#ef4444'; // red-500
            borderColor = '#dc2626'; // red-600
        }

        // Se for um evento institucional macro (feriado, recesso)
        if ((schedule as any).isInstitutional) {
            if ((schedule as any).status === 'CANCELLED') {
                // Bloqueia provas
                backgroundColor = '#fecdd3'; // rose-200
                borderColor = '#e11d48'; // rose-600
            } else {
                // Apenas informativo
                backgroundColor = '#e0f2fe'; // sky-200
                borderColor = '#0284c7'; // sky-600
            }
            return {
                style: {
                    backgroundColor,
                    borderColor,
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius: '6px',
                    opacity: 1,
                    color: borderColor, // Texto escuro para fundos claros
                    fontWeight: '700',
                    fontSize: '12px',
                    padding: '4px 8px'
                }
            };
        }

        // Cor diferente para modo offline
        if (schedule.mode === 'OFFLINE') {
            backgroundColor = '#f59e0b'; // amber-500
            borderColor = '#d97706'; // amber-600
        } else if (schedule.mode === 'HYBRID') {
            backgroundColor = '#8b5cf6'; // violet-500
            borderColor = '#7c3aed'; // violet-600
        }

        return {
            style: {
                backgroundColor,
                borderColor,
                borderLeft: `4px solid ${borderColor}`,
                borderRadius: '6px',
                opacity: schedule.status === 'CANCELLED' ? 0.5 : 1,
                color: 'white',
                fontWeight: '600',
                fontSize: '13px',
                padding: '4px 8px'
            }
        };
    }, []);

    // Componente customizado para evento
    const EventComponent: React.FC<{ event: CalendarEvent }> = ({ event }) => {
        const schedule = event.resource;

        const getModeIcon = () => {
            if ((schedule as any).isInstitutional) {
                return <CalendarIcon size={12} />;
            }
            if (schedule.mode === 'ONLINE') return <Wifi size={12} />;
            if (schedule.mode === 'OFFLINE') return <WifiOff size={12} />;
            return <Wifi size={12} className="opacity-50" />;
        };

        return (
            <div className="flex items-center gap-1 text-xs h-full">
                {getModeIcon()}
                <span className="truncate flex-1" title={event.title}>{event.title}</span>
                {!(schedule as any).isInstitutional && <Clock size={12} className="flex-shrink-0" />}
            </div>
        );
    };

    // Componente customizado de toolbar
    const CustomToolbar: React.FC<any> = ({ label, onNavigate, onView }) => {
        return (
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                <div className="flex gap-2">
                    <button
                        onClick={() => onNavigate('TODAY')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => onNavigate('PREV')}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium text-sm"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => onNavigate('NEXT')}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium text-sm"
                    >
                        →
                    </button>
                </div>

                <h2 className="text-xl font-bold text-slate-900">{label}</h2>

                <div className="flex gap-2">
                    <button
                        onClick={() => onView('month')}
                        className={`px-4 py-2 rounded-lg transition font-medium text-sm ${currentView === 'month'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                    >
                        Mês
                    </button>
                    <button
                        onClick={() => onView('week')}
                        className={`px-4 py-2 rounded-lg transition font-medium text-sm ${currentView === 'week'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => onView('day')}
                        className={`px-4 py-2 rounded-lg transition font-medium text-sm ${currentView === 'day'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                    >
                        Dia
                    </button>
                    <button
                        onClick={() => onView('agenda')}
                        className={`px-4 py-2 rounded-lg transition font-medium text-sm ${currentView === 'agenda'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                    >
                        Agenda
                    </button>
                </div>
            </div>
        );
    };

    // Mensagens customizadas
    const messages = {
        allDay: 'Dia inteiro',
        previous: 'Anterior',
        next: 'Próximo',
        today: 'Hoje',
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
        agenda: 'Agenda',
        date: 'Data',
        time: 'Hora',
        event: 'Evento',
        noEventsInRange: 'Não há provas agendadas neste período.',
        showMore: (total: number) => `+ ${total} mais`
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {/* Legenda */}
            <div className="mb-4 pb-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <CalendarIcon size={16} />
                    Legenda
                </h3>
                <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-slate-600">Agendada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-slate-600">Ativa</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-500 rounded"></div>
                        <span className="text-slate-600">Completa</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-slate-600">Cancelada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-500 rounded"></div>
                        <span className="text-slate-600">Modo Offline</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-violet-500 rounded"></div>
                        <span className="text-slate-600">Modo Híbrido</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-rose-200 border-l-4 border-rose-600 rounded"></div>
                        <span className="text-slate-600">Feriado/Bloqueio</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-sky-200 border-l-4 border-sky-600 rounded"></div>
                        <span className="text-slate-600">Evento Informativo</span>
                    </div>
                </div>
            </div>

            {/* Calendário */}
            <div className="calendar-container" style={{ height: '600px' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    onNavigate={onNavigate}
                    onView={handleViewChange}
                    view={currentView}
                    date={selectedDate}
                    eventPropGetter={eventStyleGetter}
                    components={{
                        event: EventComponent,
                        toolbar: CustomToolbar
                    }}
                    messages={messages}
                    selectable
                    popup
                    culture="pt-BR"
                />
            </div>

            {/* Estilos customizados */}
            <style>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }

        .calendar-container .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          background-color: #f8fafc;
        }

        .calendar-container .rbc-today {
          background-color: #eff6ff;
        }

        .calendar-container .rbc-off-range-bg {
          background-color: #f8fafc;
        }

        .calendar-container .rbc-event {
          border-radius: 6px;
          padding: 4px 8px;
        }

        .calendar-container .rbc-event:hover {
          opacity: 0.9;
          cursor: pointer;
        }

        .calendar-container .rbc-selected {
          background-color: #2563eb !important;
        }

        .calendar-container .rbc-slot-selection {
          background-color: rgba(59, 130, 246, 0.2);
        }

        .calendar-container .rbc-time-slot {
          min-height: 40px;
        }

        .calendar-container .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f1f5f9;
        }

        .calendar-container .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }
      `}</style>
        </div>
    );
};

export default CalendarView;
