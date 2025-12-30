
import React, { useState, useMemo } from 'react';
import { BookOpen, Target, Brain, FileText, AlertCircle, Printer, Layers, CheckCircle, BarChart, Calendar, Filter, ChevronRight, GraduationCap, Sparkles } from 'lucide-react';
import { AppState, RiskLevel, ExamStatus, School, Student, Exam, SchoolClass, ExamResult, StudyPlan, Item, ExamRegistration, UserProfileExtended, LessonPlan, User } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';
import { useQuery } from '@tanstack/react-query';
import { fetchSchools, fetchStudents, fetchExams, fetchClasses, fetchResults, fetchStudyPlans, fetchItems, fetchRegistrations, fetchUserProfiles, fetchLessonPlans, fetchUsers } from '../../services/supabaseClient';

export const PedagogicalDashboard = ({ state }: { state: AppState }) => {
    const { currentUser } = state;
    const schoolId = currentUser?.schoolId;

    const { data: allSchools } = useQuery<School[]>({ queryKey: ['schools'], queryFn: fetchSchools, initialData: [] });
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allExams } = useQuery<Exam[]>({ queryKey: ['exams'], queryFn: fetchExams, initialData: [] });
    const { data: allClasses } = useQuery<SchoolClass[]>({ queryKey: ['classes'], queryFn: fetchClasses, initialData: [] });
    const { data: allResults } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults, initialData: [] });
    const { data: allStudyPlans } = useQuery<StudyPlan[]>({ queryKey: ['studyPlans'], queryFn: fetchStudyPlans, initialData: [] });
    const { data: allItems } = useQuery<Item[]>({ queryKey: ['items'], queryFn: fetchItems, initialData: [] });
    const { data: allRegistrations } = useQuery<ExamRegistration[]>({ queryKey: ['registrations'], queryFn: fetchRegistrations, initialData: [] });
    const { data: allUserProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });
    const { data: allLessonPlans } = useQuery<LessonPlan[]>({ queryKey: ['lessonPlans'], queryFn: fetchLessonPlans, initialData: [] });
    const { data: allUsers } = useQuery<User[]>({ queryKey: ['users'], queryFn: fetchUsers, initialData: [] });

    const analytics = useMemo(() => new AnalyticsService(), []);
    const school = (allSchools || []).find(s => s.id === schoolId);

    const schoolStudents = (allStudents || []).filter(s => s.schoolId === schoolId);
    const schoolExams = (allExams || []).filter(e => e.schoolId === schoolId && e.status === ExamStatus.PUBLISHED);
    const schoolClasses = (allClasses || []).filter(c => c.schoolId === schoolId);

    const availableSubjects = useMemo(() => {
        const subjects = new Set(schoolExams.map(e => e.subject));
        return Array.from(subjects).sort();
    }, [schoolExams]);

    const [selectedSubject, setSelectedSubject] = useState<string>(availableSubjects[0] || '');

    const targetExam = useMemo(() => {
        if (!selectedSubject) return null;
        return schoolExams
            .filter(e => e.subject === selectedSubject)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [selectedSubject, schoolExams]);

    const classComparisonData = useMemo(() => {
        if (!targetExam) return [];
        return schoolClasses.map(cls => {
            const studentsInClass = schoolStudents.filter(s => s.classId === cls.id);
            const classResults = (allResults || []).filter(r => 
                r.examId === targetExam.id && 
                studentsInClass.some(s => s.id === r.studentId)
            );
            const avg = classResults.length > 0 ? classResults.reduce((acc, r) => acc + r.totalScore, 0) / classResults.length : 0;
            return { classId: cls.id, className: cls.name, series: cls.series, average: avg, participants: classResults.length, totalStudents: studentsInClass.length };
        }).filter(d => d.participants > 0).sort((a, b) => b.average - a.average);
    }, [targetExam, schoolClasses, schoolStudents, allResults]);

    const subjectStats: Record<string, { total: number, count: number }> = {};
    const results = (allResults || []).filter(r => schoolStudents.some(s => s.id === r.studentId));
    results.forEach(res => {
        const exam = (allExams || []).find(e => e.id === res.examId);
        if (exam) {
            if (!subjectStats[exam.subject]) subjectStats[exam.subject] = { total: 0, count: 0 };
            subjectStats[exam.subject].total += res.totalScore;
            subjectStats[exam.subject].count += 1;
        }
    });

    const gaps = Object.entries(subjectStats).map(([subject, data]) => ({ subject, avg: data.total / data.count })).sort((a, b) => a.avg - b.avg); 
    const atRiskStudents = schoolStudents.map(s => ({...s, stats: analytics.getStudentStats(s.id, allStudents || [], allResults || [], allExams || [], allRegistrations || [], allUserProfiles || [])})).filter(s => s.stats?.riskLevel !== RiskLevel.LOW);
    const studyPlans = (allStudyPlans || []).filter(sp => schoolStudents.some(s => s.id === sp.studentId));
    const interventionCoverage = atRiskStudents.length > 0 ? (atRiskStudents.filter(s => studyPlans.some(sp => sp.studentId === s.id)).length / atRiskStudents.length) * 100 : 100;
    const schoolItems = (allItems || []).filter(i => i.schoolId === schoolId);
    const aiItemsCount = schoolItems.filter(i => i.origin === 'IA').length;
    const professorIds = (allUsers || []).filter(u => u.schoolId === schoolId && u.role === 'PROFESSOR').map(u => u.id);
    const totalLessonPlans = (allLessonPlans || []).filter(lp => professorIds.includes(lp.professorId)).length;

    const handlePrint = () => {
        // Forçar layout de impressão via alteração de estado se necessário, ou apenas window.print()
        window.print();
    };

    return (
        <div id="pedagogical-dashboard-container" className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in">
            <style>{`
                @media print {
                    body { background: white !important; height: auto !important; overflow: visible !important; }
                    .sidebar-dark, header, .print\\:hidden, .no-print, button { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; }
                    #pedagogical-dashboard-container { 
                        position: absolute; 
                        left: 0; top: 0; 
                        width: 100% !important; 
                        padding: 40px !important; 
                        background: white !important; 
                        display: block !important; 
                        overflow: visible !important;
                    }
                    .bg-white { border: 1px solid #eee !important; box-shadow: none !important; }
                    .grid { display: grid !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 print:border-black">
                <div>
                    <h1 className="text-3xl font-black text-brand-dark flex items-center gap-3 uppercase tracking-tighter italic">
                        <Brain size={32} className="text-purple-600"/> 
                        Monitoramento Pedagógico
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">{school?.name || 'Unidade Escolar'} • Coordenação</p>
                </div>
                <button onClick={handlePrint} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-600 transition shadow-xl print:hidden">
                    <Printer size={20}/> Gerar Relatório PDF
                </button>
            </div>

            {/* KPIs Pedagógicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plano de Recuperação</span>
                        <Target size={20} className={interventionCoverage < 50 ? "text-rose-600" : "text-emerald-600"}/>
                    </div>
                    <div className="text-5xl font-black text-slate-800 tracking-tighter">{interventionCoverage.toFixed(0)}%</div>
                    <div className="text-xs text-slate-400 mt-3 font-medium">Cobertura de alunos em risco</div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliações Ativas</span>
                        <FileText size={20} className="text-indigo-600"/>
                    </div>
                    <div className="text-5xl font-black text-slate-800 tracking-tighter">{schoolExams.length}</div>
                    <div className="text-xs text-slate-400 mt-3 font-medium">Provas publicadas na rede</div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efetividade IA</span>
                        <Brain size={20} className="text-purple-600"/>
                    </div>
                    <div className="text-5xl font-black text-slate-800 tracking-tighter">{totalLessonPlans}</div>
                    <div className="text-xs text-slate-400 mt-3 font-medium">Planos de aula curados</div>
                </div>
            </div>

            {/* Gráfico de Desempenho */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <h3 className="font-black text-xl text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                        <BarChart className="text-brand-primary"/> Performance por Turma
                    </h3>
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 print:hidden">
                        <Filter size={16} className="text-slate-400 ml-2"/>
                        <select 
                            className="bg-transparent border-none text-xs font-black uppercase text-slate-600 outline-none p-2 cursor-pointer"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                        >
                            {availableSubjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                        </select>
                    </div>
                </div>
                
                {targetExam && classComparisonData.length > 0 ? (
                    <div className="h-64 flex items-end justify-between gap-6 px-4">
                        {classComparisonData.map((data) => {
                            const barHeight = (data.average / 10) * 100;
                            return (
                                <div key={data.classId} className="flex-1 flex flex-col items-center group relative min-w-[100px]">
                                    <div className="absolute -top-8 font-black text-lg text-indigo-600 opacity-0 group-hover:opacity-100 transition duration-300">
                                        {data.average.toFixed(1)}
                                    </div>
                                    <div 
                                        className={`w-full max-w-[60px] h-full rounded-2xl transition-all duration-700 ease-out shadow-lg ${data.average >= 6 ? 'bg-indigo-600' : 'bg-rose-500'} hover:scale-105`}
                                        style={{ height: `${barHeight}%` }}
                                    ></div>
                                    <span className="text-xs font-black text-slate-800 mt-4 truncate w-full text-center uppercase tracking-tighter">{data.className}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{data.series}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-300 flex flex-col items-center">
                        <BarChart size={64} className="mb-4 opacity-10"/>
                        <p className="font-black uppercase text-xs tracking-widest">Selecione uma disciplina para visualizar o comparativo.</p>
                    </div>
                )}
                <p className="mt-12 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center italic border-t border-slate-50 pt-6">
                    Relatório gerado com base na prova: {targetExam?.title || 'Nenhuma selecionada'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Alertas de Defasagem */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg">
                    <h3 className="font-black text-xl text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                        <AlertCircle className="text-rose-500"/> Alertas de Defasagem
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {gaps.map((gap, i) => (
                            <div key={i} className="flex items-center gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-rose-300 transition-all">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg ${gap.avg < 6 ? 'bg-rose-500' : 'bg-amber-400'}`}>
                                    {gap.avg.toFixed(1)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-black text-slate-800 text-lg">{gap.subject}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Média de Aproveitamento</div>
                                </div>
                                <button className="p-3 bg-white rounded-xl text-brand-primary shadow-sm hover:bg-brand-primary hover:text-white transition-all">
                                    <ChevronRight size={20}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inventário Pedagógico */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg">
                    <h3 className="font-black text-xl text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
                        <Layers className="text-indigo-600"/> Inteligência de Conteúdo
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-6 bg-indigo-50 rounded-[1.5rem] border border-indigo-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><BookOpen size={20}/></div>
                                <span className="font-black text-slate-700 uppercase text-xs">Total Questões</span>
                            </div>
                            <span className="text-3xl font-black text-indigo-700">{schoolItems.length}</span>
                        </div>
                        <div className="p-6 bg-purple-50 rounded-[1.5rem] border border-purple-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl text-purple-600 shadow-sm"><Brain size={20}/></div>
                                <span className="font-black text-slate-700 uppercase text-xs">Produção IA</span>
                            </div>
                            <span className="text-3xl font-black text-purple-700">{aiItemsCount}</span>
                        </div>
                        <div className="p-8 mt-4 bg-[#0f1d2e] rounded-3xl text-white relative overflow-hidden">
                            <Sparkles size={100} className="absolute -right-8 -bottom-8 opacity-5"/>
                            <h4 className="text-xs font-black uppercase text-indigo-400 mb-2">Diagnóstico Gemini</h4>
                            <p className="text-sm text-slate-400 leading-relaxed italic">"O banco de itens está crescendo em 25% ao mês. Sugere-se maior foco em questões discursivas para a área de Natureza."</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-20 mb-8">
                Documento Oficial de Uso Pedagógico Interno • Gerado via EP Cloud
            </div>
        </div>
    );
};
