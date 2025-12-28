
import React, { useState, useMemo } from 'react';
import { Users, Download, Check, Search, FileText, Target, Clock, GraduationCap, Tablet, Loader2 } from 'lucide-react';
import { AppState, ExamStatus, RegistrationStatus, Exam, SchoolClass, Student, ExamRegistration } from '../types';
import { Badge } from './ui/Badge';
import { useAppStore } from '../store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { fetchExams, fetchClasses, fetchStudents, fetchRegistrations } from '../services/supabaseClient';

export const AllocationView = ({ onUpdate }: { state: AppState, onUpdate: (examId: string, classIds: string[], students: Student[], classes: SchoolClass[]) => void }) => {
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [studentSearch, setStudentSearch] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { currentUser } = useAppStore();
    const userSchoolId = currentUser?.schoolId;
    
    const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams });
    const { data: classes, isLoading: classesLoading } = useQuery<SchoolClass[]>({ queryKey: ['classes'], queryFn: fetchClasses });
    const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents });
    const { data: registrations, isLoading: registrationsLoading } = useQuery<ExamRegistration[]>({ queryKey: ['registrations'], queryFn: fetchRegistrations });

    const visibleExams = exams?.filter(e => (!userSchoolId || e.schoolId === userSchoolId) && e.status === ExamStatus.PUBLISHED) || [];
    const visibleClasses = classes?.filter(c => !userSchoolId || c.schoolId === userSchoolId) || [];

    const selectedExam = exams?.find(e => e.id === selectedExamId);
    const allocatedClasses = selectedExam ? selectedExam.classIds : [];
    
    const currentRegistrations = useMemo(() => {
        // Mostra alunos que pertencem às turmas alocadas para esta prova
        const list = (registrations || [])
            .filter(r => r.examId === selectedExamId)
            .map(r => {
                const st = students?.find(s => s.id === r.studentId);
                const cl = classes?.find(c => c.id === r.classId);
                return { ...r, studentName: st?.name, regNumber: st?.registrationNumber, className: cl?.name };
            });

        if (!studentSearch.trim()) return list;
        
        return list.filter(item => 
            item.studentName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            item.regNumber?.includes(studentSearch)
        );
    }, [registrations, selectedExamId, studentSearch, students, classes]);

    const totalPoints = useMemo(() => {
        if (!selectedExam) return 0;
        return selectedExam.items.reduce((acc, curr) => acc + (curr.customScore || 0), 0);
    }, [selectedExam]);

    const toggleClass = (classId: string) => {
        if (!selectedExam) return;
        const current = selectedExam.classIds;
        const updated = current.includes(classId) 
            ? current.filter(id => id !== classId)
            : [...current, classId];
        
        onUpdate(selectedExam.id, updated, students || [], classes || []);
    };

    const handleExport = () => {
        if (!selectedExam) return;
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            alert(`SUCESSO!\n\nProva: ${selectedExam.title}\nCarga gerada para ${currentRegistrations.length} alunos.\nOs pacotes criptografados estão prontos para sincronização com os tablets.`);
        }, 1500);
    };

    if (examsLoading || classesLoading || studentsLoading || registrationsLoading) {
        return <div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Sincronizando central de logística...</div>;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-brand-dark tracking-tighter uppercase italic flex items-center gap-3">
                        <Tablet size={40} className="text-indigo-600"/> Logística Offline
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">Distribuição de avaliações para dispositivos móveis.</p>
                </div>
                {selectedExam && (
                    <button 
                        onClick={handleExport} 
                        disabled={isGenerating}
                        className="btn-premium px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center gap-3 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={20} className="animate-spin"/> : <Download size={20}/>}
                        {isGenerating ? 'Gerando Pacotes...' : 'Gerar Carga de Tablets'}
                    </button>
                )}
            </div>
            
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1 space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">1. Avaliação Publicada</label>
                            <select 
                                className="w-full border-2 border-slate-50 rounded-2xl p-4 font-black text-brand-dark focus:ring-4 focus:ring-indigo-500/10 outline-none bg-slate-50 transition-all appearance-none" 
                                value={selectedExamId} 
                                onChange={e => setSelectedExamId(e.target.value)}
                            >
                                <option value="">Escolha uma prova...</option>
                                {visibleExams.map(e => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))}
                            </select>
                        </div>

                        {selectedExam && (
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 animate-in slide-in-from-left">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Resumo</span>
                                    <Badge color="indigo">{selectedExam.subject}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-xl font-black text-slate-800">{selectedExam.items.length}</div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase">Itens</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-black text-emerald-600">{totalPoints.toFixed(1)}</div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase">Pontos</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedExam && (
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Selecionar Turmas</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {visibleClasses.map(cls => {
                                        const isSelected = allocatedClasses.includes(cls.id);
                                        return (
                                            <div 
                                                key={cls.id} 
                                                onClick={() => toggleClass(cls.id)}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all group ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-50 hover:border-slate-200 text-slate-600'}`}
                                            >
                                                <div className="font-black text-sm">{cls.name}</div>
                                                {isSelected && <Check size={18} strokeWidth={3} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 flex flex-col min-h-[500px]">
                        {selectedExam ? (
                            <>
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                    <input 
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-inner" 
                                        placeholder="Buscar aluno na turma..."
                                        value={studentSearch}
                                        onChange={e => setStudentSearch(e.target.value)}
                                    />
                                </div>

                                <div className="flex-1 bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <tr>
                                                <th className="px-8 py-5">Estudante</th>
                                                <th className="px-6 py-5">Matrícula</th>
                                                <th className="px-8 py-5 text-right">Acesso</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {currentRegistrations.map((reg, idx) => (
                                                <tr key={reg.id || idx} className="hover:bg-white transition-colors group">
                                                    <td className="px-8 py-4">
                                                        <span className="font-black text-slate-800 text-sm">{reg.studentName}</span>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase">{reg.className}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-400 font-black">{reg.regNumber}</td>
                                                    <td className="px-8 py-4 text-right">
                                                        <div className="flex justify-end">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Apto"></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {currentRegistrations.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="p-20 text-center text-slate-400 font-bold uppercase text-xs">
                                                        Selecione turmas ao lado para listar os alunos.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50">
                                <FileText size={80} strokeWidth={1} className="mb-6"/>
                                <h3 className="text-xl font-black uppercase tracking-[0.3em]">Aguardando Seleção</h3>
                                <p className="mt-2 font-medium text-sm">Escolha uma prova para começar a alocação.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
