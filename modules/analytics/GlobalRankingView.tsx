
import React, { useState } from 'react';
import { Award, Trophy, Users, School, MapPin, ChevronRight, X, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AppState, UserRole } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';

interface GlobalRankingViewProps {
    state: AppState;
    onClose: () => void;
}

export const GlobalRankingView = ({ state, onClose }: GlobalRankingViewProps) => {
    const analytics = new AnalyticsService();
    const { currentUser } = state;

    // Filtros
    const [selectedSchool, setSelectedSchool] = useState<string>(currentUser?.schoolId || 'ALL');
    const [selectedClass, setSelectedClass] = useState<string>('ALL');

    const isTenantAdmin = currentUser?.role === UserRole.TENANT_ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;
    const availableSchools = isTenantAdmin ? state.schools : state.schools.filter(s => s.id === currentUser?.schoolId);

    const availableClasses = state.classes.filter(c => selectedSchool === 'ALL' ? true : c.schoolId === selectedSchool);

    // Processamento de Dados
    const allStudents = state.students.filter(s => {
        if (selectedSchool !== 'ALL' && s.schoolId !== selectedSchool) return false;
        if (selectedClass !== 'ALL' && s.classId !== selectedClass) return false;
        if (!isTenantAdmin && s.schoolId !== currentUser?.schoolId) return false;
        return true;
    });

    const rankedStudents = allStudents.map(student => {
        const stats = analytics.getStudentStats(student.id);
        const school = state.schools.find(s => s.id === student.schoolId);
        const sClass = state.classes.find(c => c.id === student.classId);

        // Encontrar professores da turma
        const teachers = state.users.filter(u => u.role === UserRole.PROFESSOR && u.classIds?.includes(student.classId));

        return {
            id: student.id,
            name: student.name,
            schoolName: school?.name || 'N/A',
            className: sClass?.name || 'N/A',
            score: stats?.idgScore || 0, // Utilizando IDG (Índice de Desempenho Global)
            teachers: teachers.map(t => t.name).join(', ')
        };
    }).sort((a, b) => b.score - a.score); // Maior nota primeiro

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-slate-200">

                {/* Header */}
                <div className="p-6 bg-[#0f1d2e] text-white rounded-t-2xl flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Trophy className="text-yellow-400" size={32} /> Ranking Acadêmico
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Visualização consolidada de desempenho de alunos (IDG - Índice Global).</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={24} /></button>
                </div>

                {/* Filters */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase">
                        <Filter size={16} /> Filtros:
                    </div>

                    {isTenantAdmin && (
                        <select
                            className="border rounded-lg p-2 text-sm bg-white min-w-[200px]"
                            value={selectedSchool}
                            onChange={(e) => { setSelectedSchool(e.target.value); setSelectedClass('ALL'); }}
                        >
                            <option value="ALL">Todas as Escolas (Rede)</option>
                            {availableSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}

                    <select
                        className="border rounded-lg p-2 text-sm bg-white min-w-[150px]"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="ALL">Todas as Turmas</option>
                        {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.series}</option>)}
                    </select>

                    <div className="ml-auto text-sm text-slate-500">
                        Exibindo <strong>{rankedStudents.length}</strong> alunos
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 text-center w-16">Pos.</th>
                                <th className="p-4">Aluno</th>
                                <th className="p-4">IDG (Nota Global)</th>
                                <th className="p-4">vs Média Rede</th>
                                <th className="p-4">Escola / Turma</th>
                                <th className="p-4">Professores Responsáveis</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rankedStudents.map((student, idx) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition group">
                                    <td className="p-4 text-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mx-auto ${idx === 0 ? 'bg-yellow-400 text-white shadow-md scale-110' :
                                            idx === 1 ? 'bg-slate-400 text-white' :
                                                idx === 2 ? 'bg-amber-600 text-white' :
                                                    'bg-slate-100 text-slate-500'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800 text-sm">{student.name}</td>
                                    <td className="p-4">
                                        <span className={`font-black text-lg ${student.score >= 8 ? 'text-emerald-600' : student.score >= 6 ? 'text-blue-600' : 'text-rose-600'}`}>
                                            {student.score.toFixed(1)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block">max 10+</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1">
                                            {student.score > 6.8 ? (
                                                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full">
                                                    <ArrowUpRight size={12} /> +{(student.score - 6.8).toFixed(1)}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded-full">
                                                    <ArrowDownRight size={12} /> {(student.score - 6.8).toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-xs font-bold text-slate-700">{student.schoolName}</div>
                                        <div className="text-xs text-slate-500">{student.className}</div>
                                    </td>
                                    <td className="p-4 text-xs text-slate-600 max-w-xs truncate" title={student.teachers}>
                                        {student.teachers || <span className="text-slate-300 italic">Não atribuído</span>}
                                    </td>
                                </tr>
                            ))}
                            {rankedStudents.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        Nenhum dado encontrado para os filtros selecionados.
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
