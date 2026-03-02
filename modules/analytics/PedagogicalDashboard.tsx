
import React, { useState, useMemo } from 'react';
import { BookOpen, Target, Brain, FileText, AlertCircle, Printer, Layers, CheckCircle, BarChart, Calendar, Filter, X, Clock } from 'lucide-react';
import { AppState, RiskLevel, ExamStatus, InstitutionalEvent } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { AnalyticsService } from '../../services/analyticsService';
import { translateRiskLevel } from '../../utils/translations';

export const PedagogicalDashboard = () => {
    const state = useAppStore();
    const { currentUser } = state;
    const [showActivitiesModal, setShowActivitiesModal] = useState(false);
    const analytics = new AnalyticsService(state);

    const schoolId = currentUser?.schoolId;
    const school = state.schools.find(s => s.id === schoolId);

    // Filtros Globais
    const schoolStudents = state.students.filter(s => s.schoolId === schoolId);
    const schoolExams = state.exams.filter(e => e.schoolId === schoolId && e.status === ExamStatus.PUBLISHED);
    const schoolClasses = state.classes.filter(c => c.schoolId === schoolId);

    // --- LÓGICA DO GRÁFICO DE COMPARAÇÃO DE TURMAS ---

    // 1. Extrair disciplinas únicas que têm provas publicadas
    const availableSubjects = useMemo(() => {
        const subjects = new Set(schoolExams.map(e => e.subject));
        return Array.from(subjects).sort();
    }, [schoolExams]);

    const [selectedSubject, setSelectedSubject] = useState<string>(availableSubjects[0] || '');

    // 2. Encontrar a ÚLTIMA prova aplicada da disciplina selecionada
    const targetExam = useMemo(() => {
        if (!selectedSubject) return null;
        return schoolExams
            .filter(e => e.subject === selectedSubject)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    }, [selectedSubject, schoolExams]);

    // 3. Calcular média por turma para essa prova específica
    const classComparisonData = useMemo(() => {
        if (!targetExam) return [];

        return schoolClasses.map(cls => {
            // Alunos da turma
            const studentsInClass = schoolStudents.filter(s => s.classId === cls.id);

            // Resultados desses alunos NESTA prova
            const classResults = state.results.filter(r =>
                r.examId === targetExam.id &&
                studentsInClass.some(s => s.id === r.studentId)
            );

            const avg = classResults.length > 0
                ? classResults.reduce((acc, r) => acc + r.totalScore, 0) / classResults.length
                : 0;

            return {
                classId: cls.id,
                className: cls.name,
                average: avg,
                participants: classResults.length,
                totalStudents: studentsInClass.length
            };
        }).filter(d => d.participants > 0) // Mostrar apenas turmas que participaram
            .sort((a, b) => b.average - a.average); // Ordenar por nota

    }, [targetExam, schoolClasses, schoolStudents, state.results]);

    // --- FIM LÓGICA GRÁFICO ---

    // 1. Análise de Defasagem por Disciplina (Mantido)
    const subjectStats: Record<string, { total: number, count: number }> = {};
    const results = state.results.filter(r => schoolStudents.some(s => s.id === r.studentId));

    results.forEach(res => {
        const exam = state.exams.find(e => e.id === res.examId);
        if (exam) {
            if (!subjectStats[exam.subject]) subjectStats[exam.subject] = { total: 0, count: 0 };
            const normalizedScore = res.totalScore;
            subjectStats[exam.subject].total += normalizedScore;
            subjectStats[exam.subject].count += 1;
        }
    });

    const gaps = Object.entries(subjectStats).map(([subject, data]) => ({
        subject,
        avg: data.total / data.count
    })).sort((a, b) => a.avg - b.avg);

    // 2. Monitoramento de Intervenção
    const atRiskStudents = schoolStudents.map(s => ({ ...s, stats: analytics.getStudentStats(s.id) })).filter(s => s.stats?.riskLevel !== RiskLevel.LOW);
    const studyPlans = state.studyPlans.filter(sp => schoolStudents.some(s => s.id === sp.studentId));

    const interventionCoverage = atRiskStudents.length > 0
        ? (atRiskStudents.filter(s => studyPlans.some(sp => sp.studentId === s.id)).length / atRiskStudents.length) * 100
        : 100;

    // 3. Uso do Banco de Itens
    const schoolItems = state.items.filter(i => i.schoolId === schoolId);
    const aiItemsCount = schoolItems.filter(i => i.origin === 'IA').length;

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Relatorio_Pedagogico_${school?.name.replace(/\s/g, '_')}`;
        window.print();
        document.title = originalTitle;
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 print:border-black">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark flex items-center gap-3">
                        <Brain size={32} className="text-purple-600" />
                        Coordenação Pedagógica
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">{school?.name || 'Escola'} • Monitoramento de Aprendizagem</p>
                </div>
                <button onClick={handlePrint} className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700 shadow-lg print:hidden">
                    <Printer size={20} /> Relatório Pedagógico
                </button>
            </div>

            {/* KPIs Pedagógicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase">Cobertura de Intervenção</span>
                        <Target size={20} className={interventionCoverage < 50 ? "text-rose-600" : "text-emerald-600"} />
                    </div>
                    <div className="text-4xl font-black text-slate-800">{interventionCoverage.toFixed(0)}%</div>
                    <div className="text-xs text-slate-400 mt-2">Dos alunos em risco possuem Plano de Estudo</div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full ${interventionCoverage < 50 ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${interventionCoverage}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase">Provas Aplicadas</span>
                        <FileText size={20} className="text-blue-600" />
                    </div>
                    <div className="text-4xl font-black text-slate-800">{schoolExams.length}</div>
                    <div className="text-xs text-slate-400 mt-2">Avaliações no período</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md cursor-pointer group" onClick={() => setShowActivitiesModal(true)}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase">Calendário Institucional</span>
                        <Calendar size={20} className="text-brand-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-4xl font-black text-slate-800">
                        {state.institutionalEvents.filter(e => !e.schoolId || e.schoolId === schoolId).length}
                    </div>
                    <div className="text-xs text-brand-primary mt-2 font-bold">Eventos e atividades cadastradas</div>
                </div>
            </div>

            {/* Modal de Atividades Institucionais */}
            {showActivitiesModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <Calendar className="text-brand-primary" size={28} />
                                    Calendário Macro Institucional
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">Atividades e períodos lettingos programados pelo Gestor</p>
                            </div>
                            <button
                                onClick={() => setShowActivitiesModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                            <div className="grid grid-cols-1 gap-4">
                                {state.institutionalEvents
                                    .filter(e => !e.schoolId || e.schoolId === schoolId)
                                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                                    .map(event => {
                                        const isBlocking = event.blocksScheduling;
                                        return (
                                            <div key={event.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-brand-primary/30">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isBlocking ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        <Calendar size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-lg">{event.title}</h4>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={14} />
                                                                {new Date(event.startDate).toLocaleDateString()}
                                                                {event.endDate && ` até ${new Date(event.endDate).toLocaleDateString()}`}
                                                            </span>
                                                            <span className={`font-bold ${isBlocking ? 'text-rose-500' : 'text-blue-500'}`}>
                                                                {isBlocking ? 'Bloqueia Agendamentos' : 'Informativo'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {(event.examsStartDate || event.examsEndDate) && (
                                                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 min-w-[200px]">
                                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Período de Provas</p>
                                                        <div className="text-sm font-bold text-indigo-700">
                                                            {event.examsStartDate ? new Date(event.examsStartDate).toLocaleDateString() : '?'}
                                                            <span className="mx-1">→</span>
                                                            {event.examsEndDate ? new Date(event.examsEndDate).toLocaleDateString() : '?'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                {state.institutionalEvents.filter(e => !e.schoolId || e.schoolId === schoolId).length === 0 && (
                                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                        <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-500">Nenhum evento institucional cadastrado.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                            <button
                                onClick={() => setShowActivitiesModal(false)}
                                className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-lg"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GRÁFICO COMPARATIVO DE TURMAS (NOVO) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
                            <BarChart size={22} className="text-brand-primary" /> Comparativo de Desempenho entre Turmas
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Média por turma na última prova aplicada da disciplina.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <Filter size={16} className="text-slate-400 ml-1" />
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none min-w-[150px] cursor-pointer"
                        >
                            {availableSubjects.length === 0 && <option value="">Sem provas cadastradas</option>}
                            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {targetExam ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-6 text-xs text-slate-500 bg-slate-50 w-fit px-3 py-1 rounded border border-slate-100">
                            <Calendar size={12} />
                            Prova: <strong>{targetExam.title}</strong> ({new Date(targetExam.createdAt).toLocaleDateString()})
                        </div>

                        {classComparisonData.length > 0 ? (
                            <div className="h-64 flex items-end gap-4 md:gap-8 px-4">
                                {classComparisonData.map((data, idx) => (
                                    <div key={data.classId} className="flex-1 flex flex-col justify-end group h-full relative">
                                        <div className="flex justify-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-0 right-0">
                                            <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg font-bold">
                                                {data.average.toFixed(1)}
                                            </span>
                                        </div>

                                        <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden flex items-end justify-center">
                                            <div
                                                className={`w-full transition-all duration-1000 ease-out rounded-t-lg relative group-hover:brightness-110 ${data.average >= 7 ? 'bg-emerald-500' :
                                                    data.average >= 5 ? 'bg-amber-400' :
                                                        'bg-rose-500'
                                                    }`}
                                                style={{ height: `${data.average * 10}%` }} // Altura baseada na nota (0-10)
                                            >
                                                {/* Pattern Overlay */}
                                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
                                            </div>
                                        </div>

                                        <div className="text-center mt-3">
                                            <div className="font-bold text-slate-700 text-sm">{data.className}</div>
                                            <div className="text-[10px] text-slate-400">{data.participants} alunos</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                                Nenhuma turma realizou esta prova ainda.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-lg">
                        Selecione uma disciplina para visualizar o comparativo.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
                {/* Radar de Defasagem */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-xl">
                        <AlertCircle className="text-amber-500" /> Pontos de Atenção (Por Disciplina)
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Disciplinas com média abaixo do esperado, exigindo reforço imediato.</p>

                    <div className="space-y-4">
                        {gaps.map((gap, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-bold text-slate-700">{gap.subject}</span>
                                    <span className={`font-bold ${gap.avg < 6 ? 'text-rose-600' : 'text-slate-600'}`}>{gap.avg.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${gap.avg < 5 ? 'bg-rose-500' : gap.avg < 7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${gap.avg * 10}%` }}
                                    ></div>
                                </div>
                                {gap.avg < 6 && (
                                    <div className="mt-1 text-[10px] text-rose-600 font-bold bg-rose-50 inline-block px-2 py-0.5 rounded border border-rose-100">
                                        Prioridade Alta
                                    </div>
                                )}
                            </div>
                        ))}
                        {gaps.length === 0 && <div className="text-slate-400 text-center py-8">Sem dados de provas suficientes.</div>}
                    </div>
                </div>

                {/* Alunos em Foco (Intervenção) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-black print:break-inside-avoid">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-xl">
                        <Target className="text-brand-primary" /> Plano de Ação Individual
                    </h3>

                    <div className="overflow-y-auto max-h-[400px] print:max-h-none pr-2">
                        {atRiskStudents.length === 0 ? (
                            <div className="text-center text-slate-400 py-12">
                                <CheckCircle size={48} className="mx-auto mb-2 text-emerald-200" />
                                Nenhum aluno em risco detectado.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {atRiskStudents.map(s => {
                                    const hasPlan = studyPlans.some(sp => sp.studentId === s.id);
                                    return (
                                        <div key={s.id} className="p-4 rounded-lg border border-slate-200 flex items-center justify-between bg-slate-50">
                                            <div>
                                                <div className="font-bold text-slate-800">{s.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    Risco: <span className="font-bold text-rose-600">{translateRiskLevel(s.stats?.riskLevel || RiskLevel.LOW)}</span> • Média: {s.stats?.idgScore.toFixed(1)}
                                                </div>
                                            </div>
                                            {hasPlan ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded border border-emerald-200">
                                                    <CheckCircle size={12} /> Em Acompanhamento
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded border border-rose-200 animate-pulse">
                                                    <AlertCircle size={12} /> Sem Plano
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-slate-400 mt-12 print:fixed print:bottom-4 print:w-full">
                Supervisão Pedagógica • Documento Confidencial • {new Date().toLocaleDateString()}
            </div>
        </div>
    );
};
