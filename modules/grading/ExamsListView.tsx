
import React from 'react';
import { Plus, MoreHorizontal, Clock, FileText, Printer, ClipboardCheck, Globe, School, Activity, ShieldCheck, Layers, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppState, Exam, ExamStatus, QuestionType } from '../../types';
import { Badge } from '../../components/ui/Badge';

import { useSafeAppStore } from '../../store/useAppStore';
import { AdvancedReviewPipeline } from '../runner/features/AdvancedReviewPipeline';

export const ExamsListView = () => {
    const state = useSafeAppStore();
    const { currentUser } = state;
    const navigate = useNavigate();
    const [auditExamId, setAuditExamId] = React.useState<string | null>(null);

    const userTenantId = currentUser?.tenantId;
    const userSchoolId = currentUser?.schoolId;

    // GLOBAL ACCESS: Filter by Tenant (SaaS Level), show School Name in card
    const filteredExams = (state.exams || []).filter(e => e.tenantId === userTenantId);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* ... header unchanged ... */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                        Banco de Provas (Rede)
                    </h1>
                    <p className="text-sm text-slate-500">Visualize e reutilize provas de toda a rede de ensino.</p>
                </div>
                <button onClick={() => navigate('/exams/new')} className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                    <Plus size={18} /> Nova Prova
                </button>
            </div>

            {auditExamId && (
                <div className="mb-6 relative">
                    <button
                        onClick={() => setAuditExamId(null)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
                    >
                        Fechar
                    </button>
                    <AdvancedReviewPipeline
                        examId={auditExamId}
                        onCancel={() => setAuditExamId(null)}
                        onComplete={() => setAuditExamId(null)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExams.map(exam => {
                    const schoolName = state.schools.find(s => s.id === exam.schoolId)?.name || 'Escola Desconhecida';
                    const isMySchool = exam.schoolId === userSchoolId;

                    return (
                        <div key={exam.id} className={`bg-white p-6 rounded-xl border shadow-sm flex flex-col hover:shadow-md transition group ${isMySchool ? 'border-brand-secondary/30' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <Badge color={exam.status === ExamStatus.ACTIVE ? 'green' : exam.status === ExamStatus.COMPLETED ? 'blue' : 'gray'}>
                                    {exam.status === ExamStatus.ACTIVE ? 'EM ANDAMENTO' : exam.status === ExamStatus.COMPLETED ? 'CONCLUÍDA' : 'RASCUNHO'}
                                </Badge>
                                <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1 ${isMySchool ? 'bg-brand-light text-brand-primary' : 'bg-slate-100 text-slate-400'}`}>
                                    {isMySchool ? <School size={10} /> : <Globe size={10} />}
                                    <span className="truncate max-w-[120px]" title={schoolName}>{isMySchool ? 'Minha Escola' : schoolName}</span>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-1">{exam.title}</h3>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{exam.description || 'Sem descrição.'}</p>

                            <div className="mt-auto space-y-3">
                                <div className="flex items-center text-sm text-slate-600 gap-2">
                                    <Clock size={16} className="text-slate-400" /> {exam.durationMinutes} min
                                </div>
                                <div className="flex items-center text-sm text-slate-600 gap-2">
                                    <FileText size={16} className="text-slate-400" /> {exam.items?.length || 0} questões
                                </div>
                                <div className="pt-4 border-t flex justify-between items-center gap-2">
                                    <span className="text-xs text-slate-400 flex-1">Criada em {new Date(exam.createdAt).toLocaleDateString()}</span>

                                    <div className="flex gap-3">
                                        {/* 1. EDITAR PROVA */}
                                        <button
                                            onClick={() => navigate(`/exams/new?id=${exam.id}`)}
                                            className="text-blue-500 font-medium text-sm hover:text-blue-700 flex items-center gap-1 transition"
                                            title="Editar questões e configurações da prova"
                                        >
                                            <Edit size={18} />
                                        </button>

                                        {/* 2. IMPRIMIR - NÃO FUNCIONA */}
                                        <button
                                            onClick={() => alert('⚠️ Funcionalidade em desenvolvimento')}
                                            className="text-slate-400 font-medium text-sm hover:text-slate-500 flex items-center gap-1 transition cursor-not-allowed"
                                            title="Visualizar e imprimir prova (em desenvolvimento)"
                                        >
                                            <Printer size={18} />
                                        </button>

                                        {/* 3. AUDITORIA IA */}
                                        {(() => {
                                            const tenant = state.tenants.find(t => t.id === userTenantId);
                                            const canAudit = tenant?.features?.ai_audit !== false;
                                            return canAudit && (
                                                <button
                                                    onClick={() => setAuditExamId(exam.id)}
                                                    className="text-indigo-500 font-medium text-sm hover:text-indigo-700 flex items-center gap-1 transition"
                                                    title="Revisar qualidade pedagógica com IA"
                                                >
                                                    <ShieldCheck size={18} />
                                                </button>
                                            );
                                        })()}

                                        {/* 4. VARIANTES - Redireciona para edição */}
                                        <button
                                            onClick={() => navigate(`/exams/new?id=${exam.id}`)}
                                            className="text-amber-600 font-medium text-sm hover:text-amber-800 flex items-center gap-1 transition"
                                            title="Criar variantes da prova (abre editor)"
                                        >
                                            <Layers size={18} />
                                        </button>

                                        {/* 5. MONITOR - Condicional */}
                                        {exam.status === ExamStatus.ACTIVE && (
                                            <button
                                                onClick={() => navigate(`/monitor/${exam.id}`)}
                                                className="text-brand-primary font-medium text-sm hover:text-brand-dark flex items-center gap-1 transition"
                                                title="Monitorar alunos em tempo real (prova ativa)"
                                            >
                                                <Activity size={18} />
                                            </button>
                                        )}

                                        {/* 6. CORRIGIR - NÃO FUNCIONA */}
                                        <button
                                            onClick={() => navigate(`/exams/${exam.id}/results`)}
                                            className="text-emerald-600 font-medium text-sm hover:text-emerald-800 flex items-center gap-1 transition"
                                            title="Lançar notas e corrigir"
                                        >
                                            <ClipboardCheck size={18} />
                                        </button>


                                        {/* 7. EXCLUIR */}
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm('Tem certeza que deseja excluir esta prova?')) {
                                                    await state.deleteExam(exam.id);
                                                }
                                            }}
                                            className="text-red-500 font-medium text-sm hover:text-red-700 flex items-center gap-1 transition"
                                            title="Excluir prova permanentemente"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div >
                            </div >
                        </div >
                    );
                })}
                {
                    filteredExams.length === 0 && (
                        <div className="col-span-3 py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <p className="text-slate-400 font-medium">Nenhuma prova encontrada nesta rede.</p>
                        </div>
                    )
                }
            </div >
        </div >
    );
};
