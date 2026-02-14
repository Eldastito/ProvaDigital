import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
    TrendingUp, Users, Award, Download, Calendar,
    BookOpen, Target, BarChart2, Activity
} from 'lucide-react';
import {
    calculatePerformanceMetrics,
    analyzeBNCCCompetencies,
    analyzeSubjectPerformance,
    applyAnalyticsFilter,
    getPerformanceEvolution
} from '../../services/analyticsEngine';
import {
    generateClassReportPDF,
    downloadPDF
} from '../../services/reportExporter';
import { AnalyticsFilter, ClassReportData } from '../../types';

// Child Components
import { PerformanceLineChart } from '../../components/Charts/PerformanceLineChart';
import { CompetencyTracker } from './CompetencyTracker';
import { ComparativeAnalysis } from './ComparativeAnalysis';

type AnalyticsTab = 'overview' | 'competencies' | 'comparative';

export const PerformanceAnalyticsDashboard = () => {
    const { results, exams, items, classes, currentUser, users } = useAppStore();
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

    const [filter, setFilter] = useState<AnalyticsFilter>({
        dateRange: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 90 days default
            end: new Date().toISOString().split('T')[0]
        }
    });

    // Filter logic
    const accessibleResults = useMemo(() => {
        let filtered = results;

        if (currentUser?.role === 'PROFESSOR') {
            const professorClassIds = classes
                .filter(c => c.schoolId === currentUser.schoolId)
                .map(c => c.id);
            filtered = results.filter(r => professorClassIds.includes(r.classId || ''));
        } else if (currentUser?.role === 'DIRETOR' || currentUser?.role === 'SUPERVISOR') {
            filtered = results.filter(r => {
                const student = users.find(u => u.id === r.studentId);
                return student?.schoolId === currentUser.schoolId;
            });
        }

        return applyAnalyticsFilter(filtered, exams, items, filter);
    }, [results, exams, items, filter, currentUser, classes, users]);

    // Derived Metrics
    const metrics = useMemo(() =>
        calculatePerformanceMetrics(accessibleResults),
        [accessibleResults]
    );

    const bnccCompetencies = useMemo(() =>
        analyzeBNCCCompetencies(accessibleResults, items, exams),
        [accessibleResults, items, exams]
    );

    const subjectPerformance = useMemo(() =>
        analyzeSubjectPerformance(accessibleResults, items, exams),
        [accessibleResults, items, exams]
    );

    const performanceEvolution = useMemo(() => {
        // For overview chart, we might want to see evolution of the whole group
        // We can map all results to data points
        // This is a simplified aggregation for the line chart
        return accessibleResults
            .map(r => {
                const exam = exams.find(e => e.id === r.examId);
                return {
                    date: r.submittedAt || new Date().toISOString(),
                    score: (r.totalScore / (exams.find(e => e.id === r.examId)?.maxScore || 100)) * 100, // Normalize to %
                    examTitle: exam?.title || 'Prova',
                    subject: exam?.subject || 'Geral'
                };
            })
            .filter(d => d.date >= (filter.dateRange?.start || '') && d.date <= (filter.dateRange?.end || ''));
    }, [accessibleResults, exams, filter]);


    const handleExportClassReport = () => {
        if (!currentUser) return;

        const classData: ClassReportData = {
            class: classes[0] || { id: '1', name: 'Relatório Geral', schoolId: '', series: '', shift: 'MANHA' },
            overallMetrics: metrics,
            topPerformers: accessibleResults
                .map(r => ({
                    studentId: r.studentId,
                    name: users.find(u => u.id === r.studentId)?.name || 'Aluno',
                    score: r.totalScore
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 5),
            atRiskStudents: [],
            subjectBreakdown: subjectPerformance,
            bnccHeatmap: bnccCompetencies
        };

        const pdf = generateClassReportPDF(classData, {
            type: 'class',
            format: 'pdf',
            dateRange: filter.dateRange!,
            includeCharts: true,
            includeRecommendations: true,
            targetIds: [],
            customTitle: 'Relatório de Desempenho Analítico'
        });

        downloadPDF(pdf, `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Analytics & Inteligência de Dados</h1>
                    <p className="text-slate-500 mt-1">Visão 360º do desempenho acadêmico, competências e indicadores de qualidade.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Activity size={18} /> Visão Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('competencies')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'competencies' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Target size={18} /> Competências BNCC
                        </button>
                        <button
                            onClick={() => setActiveTab('comparative')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'comparative' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <BarChart2 size={18} /> Comparativo
                        </button>
                    </div>

                    <button
                        onClick={handleExportClassReport}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        <Download size={18} />
                        Exportar PDF
                    </button>
                </div>
            </div>

            {/* Global Filter Bar */}
            {activeTab === 'overview' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
                        <Calendar size={18} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">Período:</span>
                        <input
                            type="date"
                            value={filter.dateRange?.start || ''}
                            onChange={(e) => setFilter({ ...filter, dateRange: { ...filter.dateRange!, start: e.target.value } })}
                            className="input-field py-1"
                        />
                        <span className="text-slate-400 text-sm">até</span>
                        <input
                            type="date"
                            value={filter.dateRange?.end || ''}
                            onChange={(e) => setFilter({ ...filter, dateRange: { ...filter.dateRange!, end: e.target.value } })}
                            className="input-field py-1"
                        />
                    </div>
                    {/* Future filters (Class, Subject) can go here */}
                </div>
            )}

            {/* ================= TAB CONTENT ================= */}

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <TrendingUp size={24} />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Média Geral</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{metrics.averageScore.toFixed(1)}%</p>
                                <p className="text-xs text-slate-500 mt-2">Desvio Padrão: ±{metrics.standardDeviation.toFixed(1)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                        <Users size={24} />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Engajamento</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{metrics.totalStudents}</p>
                                <p className="text-xs text-slate-500 mt-2">Taxa de Conclusão: {metrics.completionRate.toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <Award size={24} />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Aprovação</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{metrics.passRate.toFixed(1)}%</p>
                                <p className="text-xs text-slate-500 mt-2">Alunos acima de 60%</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <Target size={24} />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Mediana</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{metrics.medianScore.toFixed(1)}%</p>
                                <p className="text-xs text-slate-500 mt-2">Ponto central da distribuição</p>
                            </div>
                        </div>
                    </div>

                    {/* Performance Over Time Chart */}
                    <div className="w-full">
                        <PerformanceLineChart
                            data={performanceEvolution}
                            title="Evolução de Desempenho (Últimos 90 dias)"
                        />
                    </div>

                    {/* Subject Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <BookOpen size={24} className="text-indigo-600" />
                                Performance por Disciplina
                            </h2>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {subjectPerformance.map((subject) => (
                                    <div key={subject.subject} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">{subject.subject}</span>
                                            <span className="text-sm font-bold text-slate-600">
                                                {subject.averageScore.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${subject.averageScore >= 70 ? 'bg-green-500' :
                                                    subject.averageScore >= 50 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}
                                                style={{ width: `${subject.averageScore}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 text-right">Base: {subject.questionsCount} questões</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick BNCC Snapshot */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Target size={24} className="text-purple-600" />
                                Top Competências BNCC
                            </h2>
                            <div className="space-y-3">
                                {bnccCompetencies.slice(0, 5).map((comp) => (
                                    <div key={comp.code} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <span className="font-bold text-slate-800 text-sm">{comp.code}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`w-2 h-2 rounded-full ${comp.masteryLevel === 'high' ? 'bg-green-500' :
                                                    comp.masteryLevel === 'medium' ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`} />
                                                <span className="text-xs text-slate-500 capitalize">{comp.masteryLevel === 'high' ? 'Domínio Alto' : comp.masteryLevel === 'medium' ? 'Médio' : 'Baixo'}</span>
                                            </div>
                                        </div>
                                        <span className="text-lg font-bold text-slate-700">{comp.averageScore.toFixed(0)}%</span>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setActiveTab('competencies')}
                                    className="w-full mt-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                >
                                    Ver análise completa BNCC →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'competencies' && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <CompetencyTracker />
                </div>
            )}

            {activeTab === 'comparative' && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <ComparativeAnalysis />
                </div>
            )}
        </div>
    );
};
