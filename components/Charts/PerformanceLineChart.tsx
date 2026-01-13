import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { PerformanceDataPoint } from '../../types';

interface PerformanceLineChartProps {
    data: PerformanceDataPoint[];
    title?: string;
}

export const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({ data, title }) => {
    // Format data for the chart, ensuring chronological order
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Format dates for display
    const formattedData = sortedData.map(d => ({
        ...d,
        formattedDate: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: new Date(d.date).toLocaleDateString('pt-BR'),
    }));

    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-500">Dados insuficientes para gerar o gráfico</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-96 w-full">
            {title && <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>}
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={formattedData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="formattedDate"
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        unit="%"
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Nota']}
                        labelFormatter={(label, payload) => payload[0]?.payload.examTitle || label}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="score"
                        name="Desempenho"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                        dot={{ r: 4, fill: '#4f46e5' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
