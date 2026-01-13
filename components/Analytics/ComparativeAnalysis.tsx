import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BarChart2, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { calculatePerformanceMetrics } from '../../services/analyticsEngine';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export const ComparativeAnalysis = () => {
    const { classes, results } = useAppStore();
    const [selectedMetric, setSelectedMetric] = useState<'average' | 'passRate' | 'completion'>('average');

    // Calculate metrics for all classes
    const classMetrics = useMemo(() => {
        return classes.map(cls => {
            const clsResults = results.filter(r => r.classId === cls.id);
            const metrics = calculatePerformanceMetrics(clsResults);
            return {
                id: cls.id,
                name: cls.name,
                metrics
            };
        }).sort((a, b) => b.metrics.averageScore - a.metrics.averageScore);
    }, [classes, results]);

    const chartData = useMemo(() => {
        return classMetrics.map(c => ({
            name: c.name,
            Média: c.metrics.averageScore,
            Aprovação: c.metrics.passRate,
            Conclusão: c.metrics.completionRate
        }));
    }, [classMetrics]);

    const networkAverage = useMemo(() => {
        if (classMetrics.length === 0) return 0;
        const sum = classMetrics.reduce((acc, curr) => acc + curr.metrics.averageScore, 0);
        return sum / classMetrics.length;
    }, [classMetrics]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BarChart2 className="text-indigo-600" />
                            Análise Comparativa
                        </h2>
                        <p className="text-slate-600">Comparação de desempenho entre turmas e benchmark da rede.</p>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setSelectedMetric('average')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedMetric === 'average' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Média Geral
                        </button>
                        <button
                            onClick={() => setSelectedMetric('passRate')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedMetric === 'passRate' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Aprovação
                        </button>
                        <button
                            onClick={() => setSelectedMetric('completion')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedMetric === 'completion' ? 'bg-white shadow text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Conclusão
                        </button>
                    </div>
                </div>

                {/* Main Chart */}
                <div className="h-80 w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Bar
                                dataKey={selectedMetric === 'average' ? 'Média' : selectedMetric === 'passRate' ? 'Aprovação' : 'Conclusão'}
                                fill="#4f46e5"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Ranking Table */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Ranking de Turmas</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-500">Posição</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-500">Turma</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-center">Desempenho</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-center">Vs. Rede</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-slate-500 text-right">Métrica ({
                                        selectedMetric === 'average' ? 'Nota 0-100' :
                                            selectedMetric === 'passRate' ? '% Aprov.' :
                                                '% Concl.'
                                    })</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {classMetrics.map((cls, index) => {
                                    const value = selectedMetric === 'average' ? cls.metrics.averageScore :
                                        selectedMetric === 'passRate' ? cls.metrics.passRate :
                                            cls.metrics.completionRate;

                                    const diff = value - (selectedMetric === 'average' ? networkAverage : 0); // Simplified logic

                                    return (
                                        <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        index === 1 ? 'bg-slate-200 text-slate-700' :
                                                            index === 2 ? 'bg-orange-100 text-orange-800' :
                                                                'bg-slate-50 text-slate-500'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-medium text-slate-900">{cls.name}</td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px] mx-auto overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500"
                                                        style={{ width: `${value}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 flex justify-center">
                                                {index === 0 ? (
                                                    <span className="flex items-center text-green-600 text-xs font-bold gap-1 bg-green-50 px-2 py-1 rounded-full">
                                                        <ArrowUpRight size={14} /> Líder
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                                                {value.toFixed(1)}
                                                {selectedMetric !== 'average' && '%'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
