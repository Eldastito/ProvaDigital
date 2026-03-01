
import React, { useState } from 'react';
import { BookOpen, FileText, GraduationCap, Users, Plus, Tablet, BarChart, ChevronDown, ChevronUp, Search, AlertCircle, TrendingUp, ArrowRight, Target, Star, ShieldAlert, ClipboardCheck, Brain, Clock, MousePointer2, PenTool, Grip, CloudDownload, CheckCircle } from 'lucide-react';
import { AppState, UserRole, ExamStatus } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';

import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { translateExamStatus, translateBehaviorCluster, translateSecurityFlag } from '../../utils/translations';
import { InterventionDashboard } from '../professor/features/InterventionDashboard';
import { ExamDetailsModal } from '../professor/ExamDetailsModal';
import { ProfessorPerformanceTab } from '../professor/tabs/ProfessorPerformanceTab';
import { ActionableTaskPanel } from './components/ActionableTaskPanel';
import { getStrategicInsights } from '../../services/StrategicAdvisorService';
import { mapStrategicInsightToTask } from '../../services/actionableTaskService';
import { useEffect } from 'react';
import { schedulingService, ScheduledExam } from '../../services/schedulingService';

const DistributionChart = ({ grades }: { grades: number[] }) => {
    const buckets = [0, 0, 0, 0, 0]; // 0-2, 2-4, 4-6, 6-8, 8-10
    grades.forEach(g => {
        const idx = Math.min(4, Math.floor(g / 2));
        buckets[idx]++;
    });
    const maxVal = Math.max(...buckets, 1);

    return (
        <div className="h-40 flex items-end justify-between gap-2 w-full">
            {buckets.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full flex items-end justify-center h-full">
                        <div
                            className={`w-full rounded-t-md transition-all duration-500 ${i < 2 ? 'bg-rose-400' : i === 2 ? 'bg-amber-400' : 'bg-emerald-400'} group-hover:opacity-80`}
                            style={{ height: `${(count / maxVal) * 100}%` }}
                        >
                            {count > 0 && <span className="block text-center text-[10px] font-bold text-white mt-1">{count}</span>}
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-medium">{i * 2}-{(i + 1) * 2}</span>
                </div>
            ))}
        </div>
    );
};

export const ProfessorDashboardView = () => {
    const state = useAppStore();
    const navigate = useNavigate();
    const { currentUser } = state;
    const analytics = new AnalyticsService(state);
    const isProfessor = currentUser?.role === UserRole.PROFESSOR;
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [showIntegrityFilter, setShowIntegrityFilter] = useState(false);

    const [schedules, setSchedules] = useState<ScheduledExam[]>([]);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
    const [loadedExams, setLoadedExams] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            const data = await schedulingService.getSchedules();
            setSchedules(data);
        } catch (error) {
            console.error("Error loading schedules:", error);
        }
    };

    const handleDownload = async (examId: string) => {
        setDownloadingId(examId);
        setDownloadProgress(prev => ({ ...prev, [examId]: 0 }));

        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 300));
            setDownloadProgress(prev => ({ ...prev, [examId]: i }));
        }

        setLoadedExams(prev => ({ ...prev, [examId]: true }));
        setDownloadingId(null);
    };

    // Data
    const professorClasses = isProfessor
        ? state.classes.filter(c => currentUser.classIds?.includes(c.id))
        : [];

    // Initial selection
    if (isProfessor && professorClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(professorClasses[0].id);
    }

    // Total Students from all my classes
    const totalStudents = professorClasses.reduce((sum, cls) => {
        return sum + state.students.filter(s => s.classId === cls.id).length;
    }, 0);

    // My Exams (Active/Recent)
    const myExams = state.exams.filter(e => e.creatorId === currentUser?.id || (e.classIds?.some(c => currentUser?.classIds?.includes(c))));

    // Incluir agendamentos provisórios (sem prova vinculada ainda)
    const provisionalExams = schedules.filter(s => !s.examId).map(s => ({
        id: s.id,
        title: s.examTitle || 'Sem título (Agendamento)',
        subject: 'Agendamento Direto',
        status: ExamStatus.PUBLISHED,
        createdAt: s.createdAt,
        classIds: s.classIds,
        creatorId: s.createdBy,
        isProvisional: true
    }));

    const allExams = [...myExams, ...provisionalExams];
    const filteredExams = selectedSubject === 'ALL' ? allExams : allExams.filter(e => e.subject === selectedSubject);
    const activeExams = filteredExams.filter(e => e.status !== ExamStatus.PENDING_RESCHEDULE);
    const cancelledExams = filteredExams.filter(e => e.status === ExamStatus.PENDING_RESCHEDULE);

    // Item Bank Stats Setup
    const myItems = state.items.filter(i => i.ownerId === currentUser?.id || i.tenantId === currentUser?.tenantId);
    const filteredItems = selectedSubject === 'ALL' ? myItems : myItems.filter(i => i.subject === selectedSubject || i.knowledgeArea === selectedSubject);
    const aiGeneratedItems = filteredItems.filter(i => i.metadata?.generatedBy === 'ai');
    const aiItemsPercentage = filteredItems.length > 0 ? Math.round((aiGeneratedItems.length / filteredItems.length) * 100) : 0;

    const selectedClass = state.classes.find(c => c.id === selectedClassId);
    const classStudents = state.students.filter(s => s.classId === selectedClassId);

    // Process Stats for Class (Include Cheating Flags from Last Exam)
    const studentStats = classStudents.map(s => {
        let results = state.results.filter(r => r.studentId === s.id);

        // Filter student results by the selected subject's exams
        if (selectedSubject !== 'ALL') {
            const subjectExamIds = state.exams.filter(e => e.subject === selectedSubject).map(e => e.id);
            results = results.filter(r => subjectExamIds.includes(r.examId));
        }

        results = results.sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

        const totalViolations = results.reduce((acc, r) => acc + (r.violationCount || 0), 0);
        // Use the most recent exam for detailed flags
        const lastExamFlags = results.length > 0 ? results[0].securityFlags : [];

        // Cluster Identification Logic (Mock for Demo)
        let behaviorCluster = 'NORMAL'; // NORMAL, RAPID_PREC, SLOW_PREC, RAPID_ERR, SLOW_ERR
        const grade = analytics.getStudentStats(s.id)?.idgScore || 0;
        if (grade > 8) behaviorCluster = 'RAPID_PREC';
        else if (grade > 6) behaviorCluster = 'SLOW_PREC';
        else if (grade > 4) behaviorCluster = 'SLOW_ERR';
        else behaviorCluster = 'RAPID_ERR';

        return {
            ...s,
            stats: analytics.getStudentStats(s.id),
            violations: totalViolations,
            lastFlags: lastExamFlags,
            behaviorCluster
        };
    }).sort((a, b) => (b.stats?.idgScore || 0) - (a.stats?.idgScore || 0));

    // Filter Logic
    const filteredStudents = showIntegrityFilter
        ? studentStats.filter(s => s.violations > 0)
        : studentStats;

    const classAverage = studentStats.reduce((acc, s) => acc + (s.stats?.idgScore || 0), 0) / (studentStats.length || 1);
    const gradesList = studentStats.map(s => s.stats?.idgScore || 0);
    const cheatingAttempts = studentStats.reduce((acc, s) => acc + s.violations, 0);
    const studentsWithFlags = studentStats.filter(s => s.violations > 0).length;

    const getAiSuggestion = (studentName: string, weakSubject: string) => {
        return `Sugerir revisão do capítulo 4 de ${weakSubject}. O aluno apresenta dificuldade em conceitos base.`;
    };

    // Cluster Stats
    const clusterCounts = {
        RAPID_PREC: studentStats.filter(s => s.behaviorCluster === 'RAPID_PREC').length,
        SLOW_PREC: studentStats.filter(s => s.behaviorCluster === 'SLOW_PREC').length,
        SLOW_ERR: studentStats.filter(s => s.behaviorCluster === 'SLOW_ERR').length,
        RAPID_ERR: studentStats.filter(s => s.behaviorCluster === 'RAPID_ERR').length
    };

    // PHASE 2: Trigger AI Actionable Tasks Generation
    useEffect(() => {
        const syncTasks = async () => {
            if (state.tasks.length === 0 && currentUser?.tenantId) {
                const insights = await getStrategicInsights(currentUser.tenantId);
                // Filter to only include high impact ones for first load tasks
                insights.forEach(insight => {
                    if (insight.impact === 'Urgente' || insight.impact === 'Alto') {
                        state.addTask(mapStrategicInsightToTask(insight));
                    }
                });
            }
        };
        syncTasks();
    }, [currentUser?.tenantId, state.tasks.length]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">

            {/* Top Header & Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-3">
                        Painel do Professor
                        {isProfessor && currentUser.subjectIds && currentUser.subjectIds.map(sub => (
                            <span key={sub} className="bg-brand-primary/10 text-brand-primary text-xs px-2 py-1 rounded-full font-bold">{sub}</span>
                        ))}
                    </h1>
                    <p className="text-slate-500 mt-1">Gestão de turmas, provas e acompanhamento individualizado.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/apps/tablet')} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition shadow-md">
                        <Tablet size={18} /> Aplicar Prova (Offline)
                    </button>
                    <button onClick={() => navigate('/items/new')} className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm">
                        <Plus size={18} /> Criar Questão
                    </button>
                </div>
            </div>

            {/* Subject Filter & KPI Cards */}
            {isProfessor && (
                <div className="flex flex-col md:flex-row gap-6 mb-8 mt-6">
                    {/* Filtro por Disciplina */}
                    {currentUser?.subjectIds && currentUser.subjectIds.length > 0 && (
                        <div className="flex flex-col gap-2 min-w-[250px]">
                            <span className="text-sm font-bold text-slate-500">Filtrar por Disciplina:</span>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="border border-slate-300 rounded-lg px-4 py-3 bg-white shadow-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand-primary/20 outline-none"
                            >
                                <option value="ALL">Todas as Disciplinas</option>
                                {currentUser.subjectIds.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* KPI Card: Banco de Itens */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banco de Itens Ativo</span>
                            <div className="text-purple-600"><BookOpen size={24} /></div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-800 mb-1">{filteredItems.length}</div>
                            <div className="text-sm font-bold text-purple-600">
                                {aiGeneratedItems.length} gerados por IA ({aiItemsPercentage}%)
                            </div>
                        </div>
                    </div>
                    {/* Espaço flex para manter o layout não tão esticado caso haja apenas 1 card ao lado */}
                    <div className="flex-1 hidden md:block"></div>
                </div>
            )}

            {/* Quick Stats Overview (Merged from old Dashboard) */}
            {isProfessor && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-brand-dark">{professorClasses.length}</p>
                                <p className="text-xs text-slate-500 font-medium">Turmas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-brand-dark">{totalStudents}</p>
                                <p className="text-xs text-slate-500 font-medium">Alunos</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-brand-dark">{activeExams.length}</p>
                                <p className="text-xs text-slate-500 font-medium">Provas Ativas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                <Target size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-brand-dark">{filteredItems.length}</p>
                                <p className="text-xs text-slate-500 font-medium">Total de Itens</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CANCELLED EXAMS ALERT (Ponto Facultativo) */}
            {isProfessor && cancelledExams.length > 0 && (
                <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-6 shadow-md mb-8 relative overflow-hidden">
                    <ShieldAlert size={100} className="absolute -right-4 -bottom-4 opacity-10 text-rose-500" />
                    <div className="relative z-10">
                        <h3 className="text-rose-800 font-bold text-lg flex items-center gap-2 mb-2">
                            <AlertCircle size={24} /> Atenção: Avaliações Invalidadas pelo Calendário
                        </h3>
                        <p className="text-rose-700 mb-4 max-w-3xl">
                            A Gestão da Escola cadastrou um evento institucional (Feriado, Ponto Facultativo, etc) que conflita com as seguintes provas. Elas precisam ser <strong>reagendadas obrigatoriamente</strong> para manterem a validação na plataforma.
                        </p>
                        <div className="space-y-3">
                            {cancelledExams.map(exam => (
                                <div key={exam.id} className="bg-white/80 border border-rose-200 rounded-lg p-3 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-rose-900">{exam.title}</div>
                                        <div className="text-xs text-rose-600 font-medium">Data original cancelada devido a calendário macro e logística.</div>
                                    </div>
                                    <button onClick={() => navigate('/exams')} className="text-xs font-bold text-white bg-rose-600 px-4 py-2 rounded-lg shadow hover:bg-rose-700 transition">
                                        Reagendar Agora
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* OPERATIONAL SECTION: My Exams */}
            {isProfessor && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-brand-secondary" /> Minhas Provas Ativas</h3>
                        <button onClick={() => navigate('/exams/new')} className="text-xs text-brand-primary font-bold hover:underline">+ Nova Prova</button>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activeExams.slice(0, 3).map(exam => (
                            <div key={exam.id} className="p-4 border rounded-lg hover:border-brand-primary transition group bg-white shadow-sm">
                                <div className="flex justify-between mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${exam.status === ExamStatus.PUBLISHED ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{translateExamStatus(exam.status)}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(exam.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{exam.title}</h4>
                                <p className="text-xs text-slate-500 mb-3">{exam.classIds?.length || 0} turmas alocadas</p>
                                <div className="flex gap-2">
                                    <button onClick={() => navigate('/exams')} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 flex-1">Gerenciar</button>

                                    {/* Botão de Download Offshore no Dashboard */}
                                    {(() => {
                                        const schedule = schedules.find(s => s.examId === exam.id);
                                        if (schedule?.mode === 'OFFLINE' || schedule?.mode === 'HYBRID') {
                                            return (
                                                <button
                                                    onClick={() => handleDownload(exam.id)}
                                                    disabled={downloadingId !== null || loadedExams[exam.id]}
                                                    className={`p-1.5 rounded transition border ${loadedExams[exam.id]
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                        : 'bg-white text-brand-primary border-brand-primary/20 hover:bg-brand-primary/5'
                                                        }`}
                                                    title={loadedExams[exam.id] ? "Carga já realizada" : "Baixar para Offline"}
                                                >
                                                    {downloadingId === exam.id ? (
                                                        <span className="text-[10px] font-bold px-1">{downloadProgress[exam.id]}%</span>
                                                    ) : loadedExams[exam.id] ? (
                                                        <CheckCircle size={14} />
                                                    ) : (
                                                        <CloudDownload size={14} />
                                                    )}
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {exam.status === ExamStatus.PUBLISHED && (
                                        <button onClick={() => navigate(`/exams/${exam.id}/results`)} className="text-xs bg-brand-light text-brand-primary px-3 py-1 rounded hover:bg-brand-secondary hover:text-white transition flex items-center gap-1">
                                            <ClipboardCheck size={12} /> Notas
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {activeExams.length === 0 && <div className="col-span-3 text-center text-slate-400 py-4 text-sm">Você não tem provas ativas recentes. Clique em "Nova Prova".</div>}
                    </div>
                </div>
            )}

            {isProfessor ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Class Selection & Overview */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Selecione a Turma</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg p-3 font-medium text-slate-700 mb-6 focus:ring-2 focus:ring-brand-primary outline-none"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                            >
                                {professorClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.series}</option>)}
                            </select>

                            {selectedClass && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-800">IDG Médio (Turma)</h3>
                                        <span className={`text-xl font-black ${classAverage >= 6 ? 'text-emerald-600' : 'text-amber-500'}`}>{classAverage.toFixed(1)}</span>
                                    </div>

                                    <div className="mb-6">
                                        <div className="text-xs text-slate-400 mb-2 text-center">Distribuição de Notas (0-10)</div>
                                        <DistributionChart grades={gradesList} />
                                    </div>

                                    {/* CLUSTERIZATION PANEL */}
                                    <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><Brain size={14} /> Clusters Comportamentais</div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-emerald-700 font-bold">{translateBehaviorCluster('RAPID_PREC')}</span>
                                                <span className="bg-emerald-100 px-2 py-0.5 rounded">{clusterCounts.RAPID_PREC}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-blue-700 font-bold">{translateBehaviorCluster('SLOW_PREC')}</span>
                                                <span className="bg-blue-100 px-2 py-0.5 rounded">{clusterCounts.SLOW_PREC}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-amber-700 font-bold">{translateBehaviorCluster('SLOW_ERR')}</span>
                                                <span className="bg-amber-100 px-2 py-0.5 rounded">{clusterCounts.SLOW_ERR}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-rose-700 font-bold">{translateBehaviorCluster('RAPID_ERR')}</span>
                                                <span className="bg-rose-100 px-2 py-0.5 rounded">{clusterCounts.RAPID_ERR}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                                            <div className="text-2xl font-bold text-slate-800">{studentStats.length}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">Alunos</div>
                                        </div>
                                        <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-center">
                                            <div className="text-2xl font-bold text-rose-600">{studentStats.filter(s => (s.stats?.riskLevel || 'LOW') !== 'LOW').length}</div>
                                            <div className="text-[10px] text-rose-600 uppercase">Em Risco</div>
                                        </div>
                                    </div>

                                    {/* Integrity Alert Card */}
                                    {cheatingAttempts > 0 && (
                                        <div
                                            onClick={() => setShowIntegrityFilter(!showIntegrityFilter)}
                                            className={`mt-4 p-4 rounded-xl border cursor-pointer transition ${showIntegrityFilter ? 'bg-rose-100 border-rose-300 shadow-inner' : 'bg-rose-50 border-rose-200 hover:bg-rose-100'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-rose-200 rounded-full text-rose-700 animate-pulse">
                                                    <ShieldAlert size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-rose-800 text-sm">Monitoramento de Fraude</div>
                                                    <div className="text-xs text-rose-600">
                                                        <strong>{studentsWithFlags} alunos</strong> geraram {cheatingAttempts} alertas de segurança.
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-center text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                                                {showIntegrityFilter ? 'Mostrar Todos' : 'Filtrar Incidentes'}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* AI Actionable Tasks Panel (Phase 2) */}
                        <ActionableTaskPanel />

                        {/* AI Insight for Class (Old Legacy - keeping but styled) */}
                        <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden border border-indigo-500">
                            <div className="relative z-10">
                                <h3 className="font-bold flex items-center gap-2 mb-2"><Brain size={20} className="text-yellow-300" /> Diagnóstico da Turma</h3>
                                <p className="text-sm text-indigo-100 leading-relaxed">
                                    A turma <strong>{selectedClass?.name}</strong> teve uma queda de 15% em interpretação de texto.
                                </p>
                            </div>
                            <Brain size={80} className="absolute -right-4 -top-4 opacity-10 text-white" />
                        </div>
                    </div>

                    {/* Right Column: Students List & Detail */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px]">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Users size={20} className="text-brand-secondary" /> Desempenho Individual (IDG)
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input placeholder="Buscar aluno..." className="pl-9 pr-4 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                            {filteredStudents.length === 0 && (
                                <div className="text-center py-12 text-slate-400">Nenhum aluno encontrado com os filtros atuais.</div>
                            )}
                            {filteredStudents.map((student, idx) => (
                                <div key={student.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition hover:shadow-md ${student.violations > 0 ? 'border-rose-200' : 'border-slate-200'}`}>
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                        onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${idx < 3 && !showIntegrityFilter ? 'bg-yellow-500' : 'bg-slate-400'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                                    {student.name}
                                                    {student.violations > 0 && (
                                                        <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border border-rose-200" title="Violações de segurança detectadas">
                                                            <ShieldAlert size={10} /> {student.violations}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 flex gap-2">
                                                    <span>Mat: {student.registrationNumber}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className={`font-bold ${student.behaviorCluster.includes('ERR') ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        Cluster: {translateBehaviorCluster(student.behaviorCluster)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className={`font-black text-lg ${student.stats?.idgScore && student.stats.idgScore >= 6 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {student.stats?.idgScore.toFixed(1)}
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase">IDG</div>
                                            </div>
                                            {expandedStudentId === student.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {expandedStudentId === student.id && (
                                        <div className="border-t border-slate-100 bg-slate-50 p-4 animate-in slide-in-from-top-2">

                                            {/* Integrity Report Panel (Only if violations exist) */}
                                            {student.violations > 0 && (
                                                <div className="mb-4 bg-rose-50 border border-rose-100 rounded-lg p-3 flex gap-3 items-start">
                                                    <ShieldAlert size={18} className="text-rose-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-sm font-bold text-rose-800">Alerta de Integridade da Prova</div>
                                                        <p className="text-xs text-rose-600 mt-1">
                                                            O sistema detectou {student.violations} eventos suspeitos durante a última avaliação.
                                                        </p>
                                                        <div className="flex gap-2 mt-2">
                                                            {student.lastFlags?.includes('FOCUS_LOST') && <span className="text-[10px] bg-white border border-rose-200 px-2 py-1 rounded text-rose-600 font-bold">{translateSecurityFlag('FOCUS_LOST')}</span>}
                                                            {student.lastFlags?.includes('ALT_TAB') && <span className="text-[10px] bg-white border border-rose-200 px-2 py-1 rounded text-rose-600 font-bold">{translateSecurityFlag('ALT_TAB')}</span>}
                                                            {student.lastFlags?.includes('FULLSCREEN_EXIT') && <span className="text-[10px] bg-white border border-rose-200 px-2 py-1 rounded text-rose-600 font-bold">{translateSecurityFlag('FULLSCREEN_EXIT')}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Telemetry Data */}
                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                <div className="p-2 bg-white border rounded text-center">
                                                    <div className="text-[10px] text-slate-400 uppercase flex justify-center gap-1"><Clock size={10} /> Tempo Médio</div>
                                                    <div className="font-bold text-slate-800">3m 12s</div>
                                                </div>
                                                <div className="p-2 bg-white border rounded text-center">
                                                    <div className="text-[10px] text-slate-400 uppercase flex justify-center gap-1"><MousePointer2 size={10} /> Trocas Resp.</div>
                                                    <div className="font-bold text-slate-800">2.1</div>
                                                </div>
                                                <div className="p-2 bg-white border rounded text-center">
                                                    <div className="text-[10px] text-slate-400 uppercase flex justify-center gap-1"><PenTool size={10} /> Rascunho</div>
                                                    <div className="font-bold text-emerald-600">Usado</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Ponto Forte</div>
                                                    <div className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                                                        <Star size={14} /> {student.stats?.strongestSubject}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Ponto de Atenção</div>
                                                    <div className="text-sm font-bold text-rose-600 flex items-center gap-1">
                                                        <Target size={14} /> {student.stats?.weakestSubject}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-brand-light/30 border border-brand-primary/20 rounded-lg p-4">
                                                <h4 className="text-sm font-bold text-brand-dark flex items-center gap-2 mb-2">
                                                    <Brain size={16} className="text-brand-primary" /> Sugestão da IA para Recuperação
                                                </h4>
                                                <p className="text-sm text-slate-700 mb-3 leading-relaxed">
                                                    {getAiSuggestion(student.name, student.stats?.weakestSubject || 'Geral')}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button className="text-xs bg-white border border-brand-primary text-brand-primary px-3 py-1.5 rounded font-bold hover:bg-brand-primary hover:text-white transition">
                                                        Gerar Tarefa Personalizada
                                                    </button>
                                                    <button className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded font-bold hover:bg-slate-100 transition">
                                                        Enviar Mensagem aos Pais
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-500">Visão restrita a Professores</h3>
                    <p className="text-slate-400">Acesse como professor para ver os dados detalhados da turma.</p>
                </div>
            )}

            {/* Painel de Intervenção Pedagógica (Merged from old dashboard) */}
            {isProfessor && <InterventionDashboard />}
        </div>
    );
};
