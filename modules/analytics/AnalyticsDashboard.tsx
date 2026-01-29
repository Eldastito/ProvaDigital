/**
 * Analytics Dashboard
 * 
 * Painel principal de análise de dados.
 */

import React, { useState, useEffect } from 'react';
import {
    BarChart, TrendingUp, Users, BookOpen, Calendar,
    Filter, Download, RefreshCw, ChevronDown
} from 'lucide-react';
import {
    analyticsService,
    PerformanceData,
    AttendanceData,
    DifficultyItem,
    GlobalStats
} from '../../services/analyticsService';
import { PerformanceChart } from './components/PerformanceChart';
import { AttendancePieChart } from './components/AttendancePieChart';
import { DifficultyTable } from './components/DifficultyTable';
import { MetricsCard } from '../../components/Metrics/MetricsCard';

export const AnalyticsDashboard: React.FC = () => {
    // Estados
    const [loading, setLoading] = useState(true);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
    const [weakSpots, setWeakSpots] = useState<DifficultyItem[]>([]);

    // Carregar dados
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [stats, performance, attendance, spots] = await Promise.all([
                analyticsService.getGlobalStats(),
                analyticsService.getPerformanceHistory(),
                analyticsService.getAttendanceStats(),
                analyticsService.getWeakSpots()
            ]);

            setGlobalStats(stats);
            setPerformanceData(performance);
            setAttendanceData(attendance);
            setWeakSpots(spots);
        } catch (error) {
            console.error('Erro ao carregar analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Calculando estatísticas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <BarChart className="text-indigo-600" size={32} />
                            Analytics & Insights
                        </h1>
                        <p className="text-slate-600 mt-1">
                            Acompanhe o desempenho acadêmico e indicadores de qualidade
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition flex items-center gap-2">
                            <Calendar size={18} />
                            Últimos 30 dias
                            <ChevronDown size={16} />
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200">
                            <Download size={18} />
                            Exportar Relatório
                        </button>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            {globalStats && (
                <div className="max-w-7xl mx-auto mb-8 grid grid-cols-4 gap-4">
                    <MetricsCard
                        title="Nota Média Geral"
                        value={globalStats.averageScore.toString()}
                        icon={TrendingUp}
                        color="blue"
                        subtitle="+2.5% vs mês anterior"
                    />
                    <MetricsCard
                        title="Provas Realizadas"
                        value={globalStats.totalExams.toString()}
                        icon={BookOpen}
                        color="violet"
                        subtitle="Neste período"
                    />
                    <MetricsCard
                        title="Alunos Avaliados"
                        value={globalStats.totalStudents.toString()}
                        icon={Users}
                        color="green"
                        subtitle="Ativos na plataforma"
                    />
                    <MetricsCard
                        title="Taxa de Conclusão"
                        value={`${globalStats.completionRate}%`}
                        icon={RefreshCw}
                        color="violet"
                        subtitle="Entregas no prazo"
                    />
                </div>
            )}

            {/* Grid Principal */}
            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">

                {/* Gráfico de Desempenho (Grande - 8 cols) */}
                <div className="col-span-8 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Desempenho por Avaliação</h3>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition">
                            <Filter size={20} />
                        </button>
                    </div>

                    <PerformanceChart data={performanceData} />
                </div>

                {/* Gráfico de Comparecimento (Pequeno - 4 cols) */}
                <div className="col-span-4 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Comparecimento</h3>
                    <div className="flex justify-center">
                        <AttendancePieChart data={attendanceData} />
                    </div>
                </div>

                {/* Tabela de Pontos Fracos (6 cols) */}
                <div className="col-span-6 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Tópicos com Maior Dificuldade</h3>
                    <p className="text-sm text-slate-500 mb-6">Áreas que necessitam reforço escolar imediato</p>

                    <DifficultyTable data={weakSpots} />
                </div>

                {/* Lista de Insights (6 cols) */}
                <div className="col-span-6 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Insights Automáticos</h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex gap-4">
                            <div className="bg-green-100 p-2 rounded-full h-fit">
                                <TrendingUp className="text-green-600" size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-900">Melhora Significativa em História</h4>
                                <p className="text-sm text-green-700 mt-1">A turma 9A aumentou a média em 15% comparado ao último bimestre.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-4">
                            <div className="bg-amber-100 p-2 rounded-full h-fit">
                                <Users className="text-amber-600" size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-900">Queda de Comparecimento</h4>
                                <p className="text-sm text-amber-700 mt-1">A taxa de ausência em provas de sexta-feira aumentou 8%.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-4">
                            <div className="bg-blue-100 p-2 rounded-full h-fit">
                                <BookOpen className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900">Cobertura de Conteúdo</h4>
                                <p className="text-sm text-blue-700 mt-1">92% do currículo planejado já foi avaliado neste semestre.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
