import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { UserRole, ExamStatus } from '../../types';
import { Clock, CheckCircle2, AlertCircle, AlertTriangle, Calendar, Search, Filter } from 'lucide-react';
import { isAfter, parseISO, differenceInDays } from 'date-fns';

export const PedagogicalTrackingView = () => {
    const state = useAppStore();
    const { currentUser, users, exams, classes } = state;
    const schoolId = currentUser?.schoolId;

    // Lógica para montar o status de cada professor
    const professorStats = useMemo(() => {
        if (!schoolId) return [];

        const schoolTeachers = users.filter(u => u.schoolId === schoolId && u.role === UserRole.PROFESSOR);
        const schoolClasses = classes.filter(c => c.schoolId === schoolId);

        return schoolTeachers.map(teacher => {
            // Pegar todas as provas (DRAFT, SCHEDULED, ACTIVE, etc) criadas por este professor
            const teacherExams = exams.filter(e => e.creatorId === teacher.id && e.schoolId === schoolId);

            let pendingCount = 0;
            let criticalCount = 0; // Atrasados / Perdeu o prazo (menos de 7 dias)
            let confirmedCount = 0;

            const now = new Date();

            teacherExams.forEach(exam => {
                if (exam.status === ExamStatus.DRAFT && exam.scheduledDate) {
                    const scheduledDate = parseISO(exam.scheduledDate);
                    const daysUntil = differenceInDays(scheduledDate, now);

                    if (daysUntil < 7) {
                        criticalCount++; // Passou da data limite de montagem (7 dias antes)
                    } else if (daysUntil <= 15) {
                        pendingCount++; // Entrou na janela de aviso (15 dias)
                    } else {
                        pendingCount++; // Agendado mas ainda não anexou a prova
                    }
                } else if (exam.status === ExamStatus.ACTIVE || exam.status === ExamStatus.PUBLISHED || exam.status === ExamStatus.COMPLETED) {
                    confirmedCount++; // Prova pronta/aplicada
                }
            });

            return {
                id: teacher.id,
                name: teacher.name,
                subjectIds: teacher.subjectIds || [],
                totalExams: teacherExams.length,
                pendingCount,
                criticalCount,
                confirmedCount,
                exams: teacherExams,
            };
        }).sort((a, b) => b.criticalCount - a.criticalCount || b.pendingCount - a.pendingCount);
    }, [schoolId, users, exams, classes]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Clock className="text-brand-primary" /> Acompanhamento de Prazos Logísticos
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Monitore a entrega de avaliações dos professores (Prazo limite: 7 dias antes do evento).
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-slate-50">
                                <th className="py-4 px-4 font-bold">Professor</th>
                                <th className="py-4 px-4 font-bold">Provas Agendadas</th>
                                <th className="py-4 px-4 font-bold">Pronto / Entregue</th>
                                <th className="py-4 px-4 font-bold">Pendente Montagem</th>
                                <th className="py-4 px-4 font-bold">Status Logístico</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {professorStats.map((stats) => {
                                const hasCritical = stats.criticalCount > 0;
                                const hasPending = stats.pendingCount > 0;

                                return (
                                    <tr key={stats.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-800">{stats.name}</div>
                                            <div className="text-xs text-slate-500">{stats.subjectIds.join(', ') || 'Disciplinas não informadas'}</div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="font-medium text-slate-700">{stats.totalExams}</div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-bold text-xs">
                                                <CheckCircle2 size={14} /> {stats.confirmedCount}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            {stats.pendingCount > 0 ? (
                                                <div className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded font-bold text-xs">
                                                    <Clock size={14} /> {stats.pendingCount}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            {hasCritical ? (
                                                <div className="inline-flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                                    <AlertTriangle size={14} className="animate-pulse" />
                                                    {stats.criticalCount} Prazo(s) Perdido(s)
                                                </div>
                                            ) : hasPending ? (
                                                <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                    <AlertCircle size={14} />
                                                    No Prazo (Atenção)
                                                </div>
                                            ) : stats.totalExams > 0 ? (
                                                <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                    <CheckCircle2 size={14} />
                                                    Tudo Entregue
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 font-medium">Sem agendamentos</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {professorStats.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-500">
                                        Nenhum professor encontrado na base desta escola.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
