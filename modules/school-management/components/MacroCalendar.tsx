import React, { useState } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { InstitutionalEvent, InstitutionalEventType } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { Calendar as CalendarIcon, Plus, Trash2, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { holidayService } from '../../../services/holidayService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '../../../components/ui/Toast';

export const MacroCalendar = () => {
    const { currentUser, institutionalEvents, addInstitutionalEvent, deleteInstitutionalEvent, exams, updateResults } = useAppStore(); // updateResults is a placeholder for updating exams, actually we need updateExam in useAppStore but let's see.
    const [showForm, setShowForm] = useState(false);
    const toast = useToast();
    const [title, setTitle] = useState('');
    const [type, setType] = useState<InstitutionalEventType>(InstitutionalEventType.HOLIDAY);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [examsStartDate, setExamsStartDate] = useState('');
    const [examsEndDate, setExamsEndDate] = useState('');
    const [blocksScheduling, setBlocksScheduling] = useState(true);

    const schoolId = currentUser?.schoolId;
    const schoolEvents = institutionalEvents.filter(e => e.schoolId === schoolId);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId || !currentUser.id || !startDate) return;

        const newEvent: Omit<InstitutionalEvent, 'createdAt'> = {
            id: uuidv4(),
            tenantId: currentUser.tenantId,
            schoolId: schoolId,
            title,
            type,
            startDate,
            endDate: endDate || undefined,
            examsStartDate: examsStartDate || undefined,
            examsEndDate: examsEndDate || undefined,
            blocksScheduling,
            createdBy: currentUser.id
        };

        // --- LÓGICA DO PONTO FACULTATIVO/FERIADO (REATIVA) ---
        if (blocksScheduling) {
            // Verifica se há conflito com provas já marcadas para essa data (considerando range)
            const conflictingExams = exams.filter(ex => {
                if (ex.schoolId !== schoolId || ex.status === 'COMPLETED' || ex.status === 'PUBLISHED') return false;
                const examDate = ex.scheduledDate;
                if (!examDate) return false;

                const start = startDate;
                const end = endDate || startDate;
                return examDate >= start && examDate <= end;
            });

            if (conflictingExams.length > 0) {
                const rangeLabel = endDate ? `entre ${format(parseISO(startDate), 'dd/MM')} e ${format(parseISO(endDate), 'dd/MM/yyyy')}` : `no dia ${format(parseISO(startDate), 'dd/MM/yyyy')}`;
                const confirmMsg = `ALERTA: Existem ${conflictingExams.length} prova(s) já agendada(s) ${rangeLabel}. \n\nCriar este evento bloqueante irá INVALIDAR essas datas e obrigará os professores a reagendarem. Confirmar?`;
                if (!window.confirm(confirmMsg)) {
                    return; // Aborta
                }

                // Se confirmar, disparar atualização no BD/Store mock mudando o status para PENDING_RESCHEDULE
                // Como não temos um updateExam explícito simulado fácil no Store, vamos invocar o setter se ele existir
                const { updateExam } = useAppStore.getState();
                if (updateExam) {
                    conflictingExams.forEach(conflict => {
                        updateExam({ ...conflict, status: 'PENDING_RESCHEDULE' as any }); // Cast temporário
                    });
                } else {
                    console.warn("Função updateExam não encontrada no Store para invalidar provas. Conflito será resolvido localmente no front.");
                    // Tentativa direta no state se permitido
                    useAppStore.setState(state => ({
                        exams: state.exams.map(ex => conflictingExams.find(c => c.id === ex.id) ? { ...ex, status: 'PENDING_RESCHEDULE' as any } : ex)
                    }));
                }
            }
        }

        await addInstitutionalEvent(newEvent);
        setShowForm(false);
        setTitle('');
        setStartDate('');
        setEndDate('');
        setExamsStartDate('');
        setExamsEndDate('');
    };

    if (!schoolId) {
        return <div className="p-8 text-center text-slate-500">Nenhuma escola vinculada.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CalendarIcon className="text-brand-primary" /> Calendário Macro Institucional
                    </h3>
                    <p className="text-sm text-slate-500">Gerencie Feriados, Recessos e Pontos Facultativos.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (!schoolId || !currentUser) return;
                            const year = new Date().getFullYear();
                            const officialHolidays = holidayService.getNationalHolidays(year);
                            const nextYearOfficialHolidays = holidayService.getNationalHolidays(year + 1);

                            const allOfficial = [...officialHolidays, ...nextYearOfficialHolidays];

                            // Filtrar apenas os que não existem ainda para essa escola
                            const existingDates = schoolEvents.map(e => e.startDate);
                            const newHolidays = allOfficial.filter(h => !existingDates.includes(h.date));

                            if (newHolidays.length === 0) {
                                toast.info("Todos os feriados oficiais já estão no seu calendário.");
                                return;
                            }

                            if (window.confirm(`Deseja importar ${newHolidays.length} feriados oficiais para ${year}/${year + 1}? Isso automatizará o bloqueio de agendamentos nessas datas.`)) {
                                const eventsToCreate = holidayService.mapHolidaysToInstitutionalEvents(
                                    newHolidays,
                                    currentUser.tenantId,
                                    schoolId,
                                    currentUser.id
                                );

                                for (const evt of eventsToCreate) {
                                    await addInstitutionalEvent(evt);
                                }
                                toast.info(`${newHolidays.length} feriados importados com sucesso!`);
                            }
                        }}
                        className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                        <Sparkles size={18} /> Puxar Feriados Oficiais
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-brand-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-primary/90 transition-colors"
                    >
                        <Plus size={18} /> Novo Evento
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleCreateEvent} className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <h4 className="font-bold text-slate-700 mb-4">Adicionar Data Institucional</h4>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título do Evento</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Feriado Municipal, Ponto Facultativo..."
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value as InstitutionalEventType)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
                        >
                            <option value={InstitutionalEventType.HOLIDAY}>Feriado Nacional/Estadual</option>
                            <option value={InstitutionalEventType.OPTIONAL_HOLIDAY}>Ponto Facultativo (Surpresa)</option>
                            <option value={InstitutionalEventType.RECESS}>Recesso Escolar</option>
                            <option value={InstitutionalEventType.SIMULATION}>Simulado Global</option>
                            <option value={InstitutionalEventType.MEETING}>Reunião Pedagógica</option>
                            <option value={InstitutionalEventType.OTHER}>Outros</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Inicial</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Final (Opcional)</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                min={startDate}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-indigo-500 uppercase mb-1">Início das Provas (Opcional)</label>
                            <input
                                type="date"
                                value={examsStartDate}
                                onChange={e => setExamsStartDate(e.target.value)}
                                className="w-full border border-indigo-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-indigo-50/30"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-indigo-500 uppercase mb-1">Data Limite das Provas (Opcional)</label>
                            <input
                                type="date"
                                value={examsEndDate}
                                onChange={e => setExamsEndDate(e.target.value)}
                                min={examsStartDate}
                                className="w-full border border-indigo-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-indigo-50/30"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col justify-center mt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={blocksScheduling}
                                onChange={e => setBlocksScheduling(e.target.checked)}
                                className="w-4 h-4 text-brand-primary focus:ring-brand-primary border-slate-300 rounded"
                            />
                            <span className="text-sm font-bold text-slate-700">Bloquear agendamento neste dia</span>
                        </label>
                        <p className="text-xs text-slate-500 ml-6 mt-1">
                            Se marcado, professores não poderão agendar provas e as projas já agendadas serão canceladas (Pendente Reagendamento).
                        </p>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700">Salvar Evento Global</button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Data</th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Evento</th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Tipo</th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center">Status Regra</th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {schoolEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(evt => (
                            <tr key={evt.id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span>{format(parseISO(evt.startDate), "dd 'de' MMM", { locale: ptBR })}</span>
                                        {evt.endDate && evt.endDate !== evt.startDate && (
                                            <span className="text-[10px] text-slate-400 font-normal">até {format(parseISO(evt.endDate), "dd/MM/yy", { locale: ptBR })}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-slate-800 font-medium">
                                    <div className="flex flex-col">
                                        <span>{evt.title}</span>
                                        {(evt.examsStartDate || evt.examsEndDate) && (
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 w-fit px-1.5 py-0.5 rounded border border-indigo-100">
                                                <Sparkles size={10} />
                                                <span>Provas: {evt.examsStartDate ? format(parseISO(evt.examsStartDate), "dd/MM") : '?'} - {evt.examsEndDate ? format(parseISO(evt.examsEndDate), "dd/MM") : '?'}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${evt.type === 'FERIADO_PONTO_FACULTATIVO' ? 'bg-amber-100 text-amber-800' :
                                        evt.type === 'FERIADO' ? 'bg-emerald-100 text-emerald-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {evt.type.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    {evt.blocksScheduling ? (
                                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded border border-rose-100">
                                            <AlertTriangle size={12} /> Bloqueia Agendamento
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-500 font-bold text-xs">
                                            <Info size={12} /> Informativo
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Remover este evento?")) deleteInstitutionalEvent(evt.id);
                                        }}
                                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                        title="Remover Evento"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {schoolEvents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500">
                                    Nenhum evento macro cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
