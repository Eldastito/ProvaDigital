/**
 * Exam Scheduler Component
 * 
 * Interface principal para agendamento de provas.
 * Sprint 0 - Parte 1
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Save, AlertTriangle, Check, Clock, Users, Wifi, WifiOff, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CalendarView } from '../../components/Calendar/CalendarView';
import { schedulingService, ScheduledExam, Conflict } from '../../services/schedulingService';
import { useSafeAppStore } from '../../store/useAppStore';
import { AdaptiveModeSelector } from './components/AdaptiveModeSelector';
import { AdaptiveMode, detectDeviceCapability } from '../../services/offlineAdaptiveEngine';
import type { Exam } from '../../types';

interface ExamSchedulerProps {
    onClose?: () => void;
}

export const ExamScheduler: React.FC<ExamSchedulerProps> = ({ onClose }) => {
    const store = useSafeAppStore();
    const navigate = useNavigate();

    // Estados
    const [schedules, setSchedules] = useState<ScheduledExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ScheduledExam | null>(null);
    const [conflicts, setConflicts] = useState<Conflict[]>([]);

    // Form estados
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [mode, setMode] = useState<'ONLINE' | 'OFFLINE' | 'HYBRID'>('ONLINE');
    const [adaptiveMode, setAdaptiveMode] = useState<AdaptiveMode>('LOCAL');
    const [proctoring, setProctoring] = useState(true);
    const [shuffle, setShuffle] = useState(true);
    const [allowReview, setAllowReview] = useState(false);
    const [deviceCapability] = useState(detectDeviceCapability());

    // Carregar agendamentos
    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const data = await schedulingService.getSchedules();
            setSchedules(data);
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handler para criar novo agendamento
    const handleNew = () => {
        resetForm();
        setShowForm(true);
    };

    // Handler para editar agendamento
    const handleEdit = (schedule: ScheduledExam) => {
        setEditingSchedule(schedule);
        setSelectedExamId(schedule.examId);
        setSelectedClassIds(schedule.classIds);

        const date = schedule.scheduledFor.toISOString().split('T')[0];
        const time = schedule.scheduledFor.toTimeString().slice(0, 5);

        setScheduledDate(date);
        setScheduledTime(time);
        setDuration(schedule.duration);
        setMode(schedule.mode);
        setProctoring(schedule.config.proctoring);
        setShuffle(schedule.config.shuffle);
        setAllowReview(schedule.config.allowReview);
        setShowForm(true);
    };

    // Handler para deletar agendamento
    const handleDelete = async (scheduleId: string) => {
        if (!confirm('Tem certeza que deseja deletar este agendamento?')) return;

        try {
            await schedulingService.deleteSchedule(scheduleId);
            await loadSchedules();
        } catch (error) {
            console.error('Erro ao deletar:', error);
            alert('Erro ao deletar agendamento');
        }
    };

    // Handler para cancelar agendamento
    const handleCancel = async (scheduleId: string) => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        try {
            await schedulingService.cancelSchedule(scheduleId);
            await loadSchedules();
        } catch (error) {
            console.error('Erro ao cancelar:', error);
            alert('Erro ao cancelar agendamento');
        }
    };

    // Handler para salvar (create/update)
    const handleSave = async () => {
        // Validações
        if (!selectedExamId) {
            alert('Selecione uma prova');
            return;
        }

        if (selectedClassIds.length === 0) {
            alert('Selecione pelo menos uma turma');
            return;
        }

        if (!scheduledDate || !scheduledTime) {
            alert('Informe data e hora');
            return;
        }

        try {
            const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);

            // Buscar título da prova
            const selectedExam = store.exams?.find(e => e.id === selectedExamId);
            if (!selectedExam) {
                alert('Prova não encontrada');
                return;
            }

            const scheduleData = {
                examId: selectedExamId,
                examTitle: selectedExam.title,
                classIds: selectedClassIds,
                scheduledFor,
                duration,
                mode,
                config: {
                    proctoring,
                    shuffle,
                    timeLimit: duration,
                    allowReview,
                    adaptiveMode: selectedExam?.model === 'ADAPTADO' ? adaptiveMode : undefined
                },
                status: 'SCHEDULED' as const,
                createdBy: 'current-user' // TODO: pegar do auth
            };

            if (editingSchedule) {
                // Update
                await schedulingService.updateSchedule(editingSchedule.id, scheduleData);
            } else {
                // Create
                await schedulingService.createSchedule(scheduleData);
            }

            setShowForm(false);
            resetForm();
            await loadSchedules();
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert(error.message || 'Erro ao salvar agendamento');
        }
    };

    // Reset form
    const resetForm = () => {
        setEditingSchedule(null);
        setSelectedExamId('');
        setSelectedClassIds([]);
        setScheduledDate('');
        setScheduledTime('');
        setDuration(60);
        setMode('ONLINE');
        setProctoring(true);
        setShuffle(true);
        setAllowReview(false);
        setAdaptiveMode('LOCAL');
        setConflicts([]);
    };

    // Verificar conflitos ao mudar data/turma
    useEffect(() => {
        if (selectedClassIds.length > 0 && scheduledDate && scheduledTime) {
            checkConflicts();
        }
    }, [selectedClassIds, scheduledDate, scheduledTime, duration]);

    const checkConflicts = async () => {
        const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
        const foundConflicts = await schedulingService.checkConflicts(
            selectedClassIds,
            scheduledFor,
            duration
        );
        setConflicts(foundConflicts);
    };

    // Handler de seleção no calendário
    const handleCalendarSelect = (schedule: ScheduledExam) => {
        handleEdit(schedule);
    };

    // Handler de seleção de slot vazio
    const handleSlotSelect = (slotInfo: { start: Date; end: Date }) => {
        const date = slotInfo.start.toISOString().split('T')[0];
        const time = slotInfo.start.toTimeString().slice(0, 5);

        setScheduledDate(date);
        setScheduledTime(time);
        setShowForm(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Carregando agendamentos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Calendar className="text-blue-600" size={32} />
                            Agendamento de Provas
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Gerencie os agendamentos de provas para suas turmas
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleNew}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-semibold shadow-lg shadow-blue-200"
                        >
                            <Plus size={20} />
                            Novo Agendamento
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition font-semibold"
                            >
                                Fechar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="max-w-7xl mx-auto mb-6 grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total Agendadas</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {schedules.filter(s => s.status === 'SCHEDULED').length}
                            </p>
                        </div>
                        <Calendar className="text-blue-600" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Ativas Agora</p>
                            <p className="text-2xl font-bold text-green-600">
                                {schedules.filter(s => s.status === 'ACTIVE').length}
                            </p>
                        </div>
                        <Clock className="text-green-600" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Completadas</p>
                            <p className="text-2xl font-bold text-slate-600">
                                {schedules.filter(s => s.status === 'COMPLETED').length}
                            </p>
                        </div>
                        <Check className="text-slate-600" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Canceladas</p>
                            <p className="text-2xl font-bold text-red-600">
                                {schedules.filter(s => s.status === 'CANCELLED').length}
                            </p>
                        </div>
                        <X className="text-red-600" size={32} />
                    </div>
                </div>
            </div>

            {/* Calendário */}
            <div className="max-w-7xl mx-auto mb-6">
                <CalendarView
                    schedules={schedules}
                    onSelectEvent={handleCalendarSelect}
                    onSelectSlot={handleSlotSelect}
                />
            </div>

            {/* Lista de Agendamentos Próximos */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Próximos Agendamentos</h2>

                    {schedules.filter(s => s.status === 'SCHEDULED').length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum agendamento próximo</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {schedules
                                .filter(s => s.status === 'SCHEDULED')
                                .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
                                .slice(0, 10)
                                .map(schedule => (
                                    <div
                                        key={schedule.id}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900">{schedule.examTitle}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {schedule.scheduledFor.toLocaleDateString('pt-BR')}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {schedule.scheduledFor.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users size={14} />
                                                    {schedule.classIds.length} turma(s)
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {schedule.mode === 'ONLINE' ? <Wifi size={14} /> : <WifiOff size={14} />}
                                                    {schedule.mode}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(schedule)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleCancel(schedule.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Cancelar"
                                            >
                                                <X size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(schedule.id)}
                                                className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                                                title="Deletar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Formulário */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header do modal */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-6">
                            {/* Conflitos */}
                            {conflicts.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                                        <div>
                                            <h4 className="font-semibold text-red-900 mb-2">Conflitos Detectados</h4>
                                            <ul className="space-y-1 text-sm text-red-700">
                                                {conflicts.map((conflict, idx) => (
                                                    <li key={idx}>• {conflict.message}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Seleção de Prova com Recomendação Inteligente */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Prova *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onClose) onClose();
                                            navigate('/exams/new');
                                        }}
                                        className="text-sm text-brand-secondary font-medium hover:text-brand-primary flex items-center gap-1 transition"
                                    >
                                        <Plus size={14} /> Nova Prova
                                    </button>
                                </div>
                                <select
                                    value={selectedExamId}
                                    onChange={(e) => setSelectedExamId(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Selecione uma prova</option>
                                    {(() => {
                                        const mySubjects = store.currentUser?.subjectIds || [];
                                        const recommendedExams = store.exams?.filter(e => mySubjects.includes(e.subject)) || [];
                                        const otherExams = store.exams?.filter(e => !mySubjects.includes(e.subject)) || [];

                                        return (
                                            <>
                                                {recommendedExams.length > 0 && (
                                                    <optgroup label="✨ Minhas Disciplinas">
                                                        {recommendedExams.map(exam => (
                                                            <option key={exam.id} value={exam.id}>
                                                                {exam.title}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                                {otherExams.length > 0 && (
                                                    <optgroup label={recommendedExams.length > 0 ? "Outras Disciplinas" : "Banco de Provas"}>
                                                        {otherExams.map(exam => (
                                                            <option key={exam.id} value={exam.id}>
                                                                {exam.title} ({exam.subject})
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                            </>
                                        );
                                    })()}
                                </select>
                                {store.exams?.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                        <AlertTriangle size={12} /> Nenhuma prova existente. Crie uma nova prova primeiro!
                                    </p>
                                )}
                            </div>

                            {/* Seleção de Turmas */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Turmas * (Ctrl+Click para múltipla seleção)
                                </label>
                                <select
                                    multiple
                                    value={selectedClassIds}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                        setSelectedClassIds(selected);
                                    }}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                                    required
                                >
                                    {store.classes?.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    {selectedClassIds.length} turma(s) selecionada(s)
                                </p>
                            </div>

                            {/* Data e Hora */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Data *
                                    </label>
                                    <input
                                        type="date"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Hora *
                                    </label>
                                    <input
                                        type="time"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Duração */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Duração (minutos) *
                                </label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    min={5}
                                    max={480}
                                    step={5}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Modo de Aplicação */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Modo de Aplicação *
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMode('ONLINE')}
                                        className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${mode === 'ONLINE'
                                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <Wifi size={24} />
                                        <span className="font-semibold text-sm">Online</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('OFFLINE')}
                                        className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${mode === 'OFFLINE'
                                            ? 'border-amber-600 bg-amber-50 text-amber-900'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <WifiOff size={24} />
                                        <span className="font-semibold text-sm">Offline</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('HYBRID')}
                                        className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${mode === 'HYBRID'
                                            ? 'border-violet-600 bg-violet-50 text-violet-900'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <Wifi size={24} className="opacity-50" />
                                        <span className="font-semibold text-sm">Híbrido</span>
                                    </button>
                                </div>
                            </div>

                            {/* Modo Adaptativo (se prova for adaptativa) */}
                            {selectedExamId && store.exams?.find(e => e.id === selectedExamId)?.model === 'ADAPTADO' && (
                                <div className="border-t border-slate-200 pt-6">
                                    <AdaptiveModeSelector
                                        selectedMode={adaptiveMode}
                                        onModeChange={setAdaptiveMode}
                                        deviceCapability={deviceCapability}
                                    />
                                </div>
                            )}

                            {/* Configurações */}
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="font-semibold text-slate-900 mb-4">Configurações da Prova</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={proctoring}
                                            onChange={(e) => setProctoring(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700">Ativar proctoring (monitoramento facial)</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={shuffle}
                                            onChange={(e) => setShuffle(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700">Embaralhar questões</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allowReview}
                                            onChange={(e) => setAllowReview(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700">Permitir revisão após finalizar</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer do modal */}
                        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={conflicts.length > 0}
                                className={`px-6 py-3 rounded-xl transition font-semibold flex items-center gap-2 ${conflicts.length > 0
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                    }`}
                            >
                                <Save size={20} />
                                {editingSchedule ? 'Atualizar' : 'Criar'} Agendamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamScheduler;
