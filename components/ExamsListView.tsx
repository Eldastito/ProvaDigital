
import React from 'react';
import { Plus, MoreHorizontal, Clock, FileText, Printer, ClipboardCheck, Globe, School, Trash2 } from 'lucide-react';
import { AppState, ExamStatus, Exam, School as SchoolType } from '../types';
import { Badge } from './ui/Badge';
import { useAppStore } from '../store/useAppStore'; 
import { useQuery, useMutation } from '@tanstack/react-query'; 
import { fetchExams, fetchSchools, deleteExam } from '../services/supabaseClient';
import { usePermissions } from '../hooks/usePermissions';

export const ExamsListView = ({ onNew, onPrint, onGrade }: { state: AppState, onNew: () => void, onPrint: (id: string) => void, onGrade: (id: string) => void }) => {
    const { currentUser } = useAppStore();
    const { canCreate, canDelete } = usePermissions();
    const userTenantId = currentUser?.tenantId;

    const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams });
    const { data: schools } = useQuery<SchoolType[]>({ queryKey: ['schools'], queryFn: fetchSchools });

    const delExamMutation = useMutation({
        mutationFn: deleteExam,
        onSuccess: () => alert("Prova removida com sucesso.")
    });

    const filteredExams = exams?.filter(e => e.tenantId === userTenantId) || [];

    if (examsLoading) return <div className="p-8 text-center text-slate-500 font-bold">Sincronizando Banco de Provas...</div>;

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Banco de Provas</h1>
                <p className="text-slate-500 font-medium">Gestão centralizada de avaliações da rede.</p>
            </div>
            {canCreate('EXAM_MGMT') && (
                <button onClick={onNew} className="btn-premium px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg">
                    <Plus size={18} /> Nova Prova
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map(exam => {
                const schoolName = schools?.find(s => s.id === exam.schoolId)?.name || 'Escola Desconhecida';
                const isMySchool = exam.schoolId === currentUser?.schoolId;

                return (
                    <div key={exam.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <Badge color={exam.status === ExamStatus.PUBLISHED ? 'green' : 'gray'}>{exam.status}</Badge>
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                <School size={12}/> {schoolName}
                            </div>
                        </div>
                        
                        <h3 className="font-black text-xl text-slate-800 mb-2 leading-tight">{exam.title}</h3>
                        <p className="text-sm text-slate-500 mb-6 line-clamp-2 font-medium">{exam.description || 'Instruções padrão de aplicação ExamePad.'}</p>
                        
                        <div className="mt-auto space-y-4">
                            <div className="flex items-center text-xs font-bold text-slate-400 gap-6">
                                <span className="flex items-center gap-1"><Clock size={14}/> {exam.durationMinutes} MIN</span>
                                <span className="flex items-center gap-1"><FileText size={14}/> {exam.items.length} QUESTÕES</span>
                            </div>
                            
                            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <button onClick={() => onPrint(exam.id)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Imprimir"><Printer size={18} /></button>
                                    <button onClick={() => onGrade(exam.id)} className="p-2.5 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Lançar Notas"><ClipboardCheck size={18} /></button>
                                </div>
                                {canDelete('EXAM_MGMT') && (
                                    <button onClick={() => confirm("Excluir esta prova permanentemente?") && delExamMutation.mutate(exam.id)} className="p-2.5 text-slate-300 hover:text-rose-600 transition-colors" title="Excluir"><Trash2 size={18}/></button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
};
