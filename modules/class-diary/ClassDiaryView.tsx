import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
    Calendar,
    Users,
    CheckCircle,
    XCircle,
    FileText,
    Clock,
    ChevronDown,
    ChevronUp,
    Save,
    AlertCircle,
    Edit3,
    Trash2,
    Brain,
    ClipboardCheck
} from 'lucide-react';
import { uuidv4 } from '../../utils/helpers';
import { DiaryEntry } from '../../types';

interface AttendanceRecord {
    id: string;
    studentId: string;
    classId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED';
    justification?: string;
    recordedBy: string;
    recordedAt: string;
}

interface ClassNote {
    id: string;
    classId: string;
    date: string;
    subject: string;
    content: string;
    observations: string;
    teacherId: string;
    createdAt: string;
}

interface Occurrence {
    id: string;
    label: string;
    category: 'PEDAGOGICAL' | 'BEHAVIORAL' | 'HEALTH_NEURO';
    icon: string;
}

const QUICK_OCCURRENCES: Occurrence[] = [
    { id: 'diff_comprehension', label: 'Dificuldade de Compreensão', category: 'PEDAGOGICAL', icon: '🧠' },
    { id: 'active_participation', label: 'Participação Ativa', category: 'PEDAGOGICAL', icon: '⭐' },
    { id: 'no_material', label: 'Falta de Material', category: 'PEDAGOGICAL', icon: '🎒' },
    { id: 'high_distraction', label: 'Dispersão Excessiva', category: 'BEHAVIORAL', icon: '🌀' },
    { id: 'conflict', label: 'Conflito com Colega', category: 'BEHAVIORAL', icon: '🤝' },
    { id: 'sensory_sensitivity', label: 'Sensibilidade Sensorial', category: 'HEALTH_NEURO', icon: '👂' },
    { id: 'social_interaction', label: 'Dificuldade Social', category: 'HEALTH_NEURO', icon: '👤' },
    { id: 'hyperfocus', label: 'Hiper-foco', category: 'HEALTH_NEURO', icon: '🎯' },
];

export const ClassDiaryView = () => {
    const { currentUser, students, classes, addDiaryEntries } = useAppStore();
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Map<string, AttendanceRecord['status']>>(new Map());
    const [studentOccurrences, setStudentOccurrences] = useState<Map<string, string[]>>(new Map());
    const [classNote, setClassNote] = useState({ content: '', observations: '' });
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Filtrar turmas do professor
    const teacherClasses = useMemo(() => {
        if (!currentUser) return [];
        return classes.filter(c => c.schoolId === currentUser.schoolId);
    }, [currentUser, classes]);

    // Alunos da turma selecionada
    const classStudents = useMemo(() => {
        if (!selectedClass) return [];
        return students
            .filter(s => s.classId === selectedClass)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedClass, students]);

    // Estatísticas de presença
    const stats = useMemo(() => {
        const total = classStudents.length;
        const present = Array.from(attendance.values()).filter(s => s === 'PRESENT').length;
        const absent = Array.from(attendance.values()).filter(s => s === 'ABSENT').length;
        const justified = Array.from(attendance.values()).filter(s => s === 'JUSTIFIED').length;
        const pending = total - (present + absent + justified);

        return { total, present, absent, justified, pending };
    }, [classStudents, attendance]);

    const handleAttendanceToggle = (studentId: string) => {
        const current = attendance.get(studentId);
        let next: AttendanceRecord['status'];

        if (!current) next = 'PRESENT';
        else if (current === 'PRESENT') next = 'ABSENT';
        else if (current === 'ABSENT') next = 'JUSTIFIED';
        else next = 'PRESENT';

        const newAttendance = new Map(attendance);
        newAttendance.set(studentId, next);
        setAttendance(newAttendance);
    };

    const handleOccurrenceToggle = (studentId: string, occurrenceId: string) => {
        const current = studentOccurrences.get(studentId) || [];
        const next = current.includes(occurrenceId)
            ? current.filter(id => id !== occurrenceId)
            : [...current, occurrenceId];

        const newOccurrences = new Map(studentOccurrences);
        newOccurrences.set(studentId, next);
        setStudentOccurrences(newOccurrences);
    };

    const handleSave = async () => {
        if (!selectedClass || !currentUser) {
            alert('Selecione uma turma primeiro.');
            return;
        }

        if (stats.pending > 0) {
            const confirm = window.confirm(
                `Ainda há ${stats.pending} aluno(s) sem registro de presença. Deseja salvar mesmo assim?`
            );
            if (!confirm) return;
        }

        setIsSaving(true);

        // Simular salvamento (em produção, salvar no Supabase)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Preparar entradas para o store global
        const newEntries: DiaryEntry[] = classStudents.map(student => ({
            id: uuidv4(),
            studentId: student.id,
            classId: selectedClass,
            date: selectedDate,
            attendance: attendance.get(student.id) || 'PRESENT',
            occurrences: studentOccurrences.get(student.id) || [],
            teacherId: currentUser.id
        }));

        await addDiaryEntries(newEntries);

        console.log('Salvando chamada:', {
            classId: selectedClass,
            date: selectedDate,
            entries: newEntries,
            classNote,
            teacherId: currentUser.id
        });

        alert(`✅ Chamada e Ocorrências salvas com sucesso!\n\nOs dados qualitativos foram enviados para análise de rede (MEC/Secretaria).`);

        setIsSaving(false);
    };

    const getStatusColor = (status?: AttendanceRecord['status']) => {
        if (!status) return 'bg-gray-50 border-gray-200';
        if (status === 'PRESENT') return 'bg-green-50 border-green-300';
        if (status === 'ABSENT') return 'bg-red-50 border-red-300';
        return 'bg-yellow-50 border-yellow-300';
    };

    const getStatusIcon = (status?: AttendanceRecord['status']) => {
        if (!status) return <AlertCircle size={20} className="text-gray-400" />;
        if (status === 'PRESENT') return <CheckCircle size={20} className="text-green-600" />;
        if (status === 'ABSENT') return <XCircle size={20} className="text-red-600" />;
        return <FileText size={20} className="text-yellow-600" />;
    };

    const getStatusLabel = (status?: AttendanceRecord['status']) => {
        if (!status) return 'Não registrado';
        if (status === 'PRESENT') return 'Presente';
        if (status === 'ABSENT') return 'Falta';
        return 'Justificada';
    };

    if (!currentUser) return null;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2 flex items-center gap-3">
                    <Calendar className="text-brand-primary" size={32} />
                    Diário de Classe
                </h1>
                <p className="text-slate-600">
                    Registro de presença e anotações de aula
                </p>
            </div>

            {/* Seleção de Turma e Data */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Turma
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                                setAttendance(new Map());
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        >
                            <option value="">Selecione uma turma...</option>
                            {teacherClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name} - {cls.series}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Data
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {selectedClass && (
                <>
                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <StatCard
                            label="Total"
                            value={stats.total}
                            icon={Users}
                            color="blue"
                        />
                        <StatCard
                            label="Presentes"
                            value={stats.present}
                            icon={CheckCircle}
                            color="green"
                        />
                        <StatCard
                            label="Faltas"
                            value={stats.absent}
                            icon={XCircle}
                            color="red"
                        />
                        <StatCard
                            label="Justificadas"
                            value={stats.justified}
                            icon={FileText}
                            color="yellow"
                        />
                        <StatCard
                            label="Pendentes"
                            value={stats.pending}
                            icon={AlertCircle}
                            color="gray"
                            alert={stats.pending > 0}
                        />
                    </div>

                    {/* Lista de Alunos */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-800">Chamada</h2>
                            <p className="text-sm text-slate-600 mt-1">
                                Clique no aluno para alternar: Presente → Falta → Justificada
                            </p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {classStudents.map(student => {
                                const status = attendance.get(student.id);
                                const occurrences = studentOccurrences.get(student.id) || [];
                                const isExpanded = expandedStudent === student.id;

                                // Simulação do Pipeline de Alerta (Se tiver ocorrências neuro, mostra ícone)
                                const hasNeuroAlert = occurrences.some(id =>
                                    QUICK_OCCURRENCES.find(o => o.id === id)?.category === 'HEALTH_NEURO'
                                );

                                return (
                                    <div key={student.id} className="border-l-4 transition-all" style={{ borderLeftColor: status === 'PRESENT' ? '#10b981' : status === 'ABSENT' ? '#ef4444' : status === 'JUSTIFIED' ? '#f59e0b' : '#cbd5e1' }}>
                                        <div
                                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${isExpanded ? 'bg-slate-50' : ''}`}
                                            onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div onClick={(e) => { e.stopPropagation(); handleAttendanceToggle(student.id); }}>
                                                    {getStatusIcon(status)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                                        {student.name}
                                                        {hasNeuroAlert && (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded-full animate-pulse font-black">
                                                                <Brain size={10} /> SINAL DE ALERTA
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-slate-500">
                                                        {getStatusLabel(status)} {occurrences.length > 0 && `• ${occurrences.length} ocorrências`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-4 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* Categorias de Ocorrências */}
                                                    {(['PEDAGOGICAL', 'BEHAVIORAL', 'HEALTH_NEURO'] as const).map(category => (
                                                        <div key={category}>
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                                {category === 'PEDAGOGICAL' ? '📚 Pedagógico' : category === 'BEHAVIORAL' ? '🤝 Comportamental' : '🧠 Neuro/PCD'}
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {QUICK_OCCURRENCES.filter(o => o.category === category).map(occ => (
                                                                    <button
                                                                        key={occ.id}
                                                                        onClick={() => handleOccurrenceToggle(student.id, occ.id)}
                                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${occurrences.includes(occ.id)
                                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                                                            }`}
                                                                    >
                                                                        <span>{occ.icon}</span>
                                                                        {occ.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {hasNeuroAlert && (
                                                    <div className="mt-6 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-rose-100 text-rose-600 rounded-full">
                                                                <Brain size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-rose-900">IA Insight: Padrão Identificado</p>
                                                                <p className="text-[10px] text-rose-700">Sinais indicam possível necessidade de rastreio neuropsicológico.</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="px-4 py-1.5 bg-rose-600 text-white text-[10px] font-black rounded-lg hover:bg-rose-700 transition"
                                                            onClick={() => alert('Encaminhando para módulo de Neuro-Screening...')}
                                                        >
                                                            INICIAR TRIAGEM
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Registro de Aula */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Edit3 size={20} />
                            Registro da Aula
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Conteúdo Ministrado
                                </label>
                                <textarea
                                    value={classNote.content}
                                    onChange={(e) => setClassNote({ ...classNote, content: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                                    rows={4}
                                    placeholder="Descreva o conteúdo trabalhado nesta aula..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Observações Gerais
                                </label>
                                <textarea
                                    value={classNote.observations}
                                    onChange={(e) => setClassNote({ ...classNote, observations: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                                    rows={3}
                                    placeholder="Anotações sobre a turma, comportamento, dificuldades observadas..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botão Salvar */}
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={() => {
                                setAttendance(new Map());
                                setClassNote({ content: '', observations: '' });
                            }}
                            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                        >
                            Limpar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || stats.total === 0}
                            className="flex items-center gap-2 px-8 py-3 bg-brand-primary hover:bg-brand-dark text-white rounded-lg font-bold shadow-lg transition disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Salvar Chamada
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {!selectedClass && (
                <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
                    <Calendar size={64} className="mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        Selecione uma turma para começar
                    </h3>
                    <p className="text-slate-500">
                        Escolha a turma e a data para registrar a chamada
                    </p>
                </div>
            )}
        </div>
    );
};

// Componente de Card de Estatística
const StatCard = ({ label, value, icon: Icon, color, alert }: any) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        gray: 'bg-gray-50 text-gray-600 border-gray-200',
    };

    return (
        <div className={`p-4 rounded-xl border-2 ${alert ? 'animate-pulse' : ''} ${colorClasses[color as keyof typeof colorClasses]}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium opacity-80">{label}</span>
                <Icon size={16} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
};
