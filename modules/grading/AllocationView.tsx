
import React, { useState, useMemo } from 'react';
import { Users, Download, Check } from 'lucide-react';
import { AppState, Exam, SchoolClass, ExamStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';

import { useSafeAppStore } from '../../store/useAppStore';

export const AllocationView = () => {
    const state = useSafeAppStore();
    const { updateExamAllocation } = state;
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const { currentUser } = state;
    const userSchoolId = currentUser?.schoolId;

    // Filtros de Escola - Allow ACTIVE or DRAFT for allocation, or legacy PUBLISHED
    const visibleExams = state.exams.filter(e => (!userSchoolId || e.schoolId === userSchoolId) && (e.status === ExamStatus.ACTIVE || (e.status as any) === 'PUBLISHED' || e.status === ExamStatus.DRAFT));
    const visibleClasses = state.classes.filter(c => !userSchoolId || c.schoolId === userSchoolId);

    const selectedExam = state.exams.find(e => e.id === selectedExamId);
    const allocatedClasses = selectedExam ? selectedExam.classIds : [];

    const registrations = useMemo(() => {
        return state.registrations.filter(r => r.examId === selectedExamId);
    }, [state.registrations, selectedExamId]);

    const toggleClass = (classId: string) => {
        if (!selectedExam) return;
        const current = selectedExam.classIds;
        const updated = current.includes(classId)
            ? current.filter(id => id !== classId)
            : [...current, classId];

        updateExamAllocation(selectedExam.id, updated);
    };

    const handleExport = () => {
        if (!selectedExam) return;
        const exportData = {
            exam: selectedExam,
            students: registrations.map(r => {
                const st = state.students.find(s => s.id === r.studentId);
                const cl = state.classes.find(c => c.id === r.classId);
                return {
                    studentId: st?.id,
                    studentName: st?.name,
                    registrationNumber: st?.registrationNumber,
                    className: cl?.name,
                    status: r.status
                };
            })
        };
        console.log("Exporting JSON for Tablets:", exportData);
        alert("Arquivo de alocação gerado! Verifique o console para o JSON.");
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                Alocação de Alunos
                {userSchoolId && <span className="text-sm font-normal bg-slate-100 px-3 py-1 rounded-full text-slate-500">{state.schools.find(s => s.id === userSchoolId)?.name}</span>}
            </h1>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Selecione uma Prova Publicada</label>
                    <select
                        className="w-full max-w-md border rounded-lg p-2 text-sm"
                        value={selectedExamId}
                        onChange={e => setSelectedExamId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {visibleExams.map(e => (
                            <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                    </select>
                </div>

                {selectedExam && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Users size={18} /> Turmas Disponíveis</h3>
                            <div className="space-y-2">
                                {visibleClasses.map(cls => {
                                    const isSelected = allocatedClasses.includes(cls.id);
                                    return (
                                        <div
                                            key={cls.id}
                                            onClick={() => toggleClass(cls.id)}
                                            className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition ${isSelected ? 'bg-sky-100 border-brand-primary' : 'bg-white border-slate-200 hover:bg-slate-100'}`}
                                        >
                                            <div>
                                                <div className="font-medium text-sm">{cls.name}</div>
                                                <div className="text-xs text-slate-500">{cls.series} • {cls.shift}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'border-slate-300'}`}>
                                                {isSelected && <Check size={12} />}
                                            </div>
                                        </div>
                                    );
                                })}
                                {visibleClasses.length === 0 && <div className="text-slate-400 text-sm">Nenhuma turma encontrada.</div>}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800">Alunos Inscritos ({registrations.length})</h3>
                                <button onClick={handleExport} className="text-brand-primary text-sm font-medium hover:bg-sky-50 px-3 py-1 rounded-lg flex items-center gap-2 transition">
                                    <Download size={16} /> Exportar JSON
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                                        <tr>
                                            <th className="px-4 py-3">Matrícula</th>
                                            <th className="px-4 py-3">Nome</th>
                                            <th className="px-4 py-3">Turma</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {registrations.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Nenhum aluno alocado. Selecione turmas à esquerda.</td>
                                            </tr>
                                        ) : (
                                            registrations.map(reg => {
                                                const st = state.students.find(s => s.id === reg.studentId);
                                                const cl = state.classes.find(c => c.id === reg.classId);
                                                return (
                                                    <tr key={reg.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-mono text-slate-500">{st?.registrationNumber}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-900">{st?.name}</td>
                                                        <td className="px-4 py-3 text-slate-600">{cl?.name}</td>
                                                        <td className="px-4 py-3"><Badge color="blue">{reg.status}</Badge></td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
