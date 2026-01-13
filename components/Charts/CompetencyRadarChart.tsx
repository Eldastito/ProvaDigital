import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { CompetencyRadarData } from '../../types';

interface CompetencyRadarChartProps {
    data: CompetencyRadarData[];
    title?: string;
}

export const CompetencyRadarChart: React.FC<CompetencyRadarChartProps> = ({ data, title }) => {
    if (data.length < 3) {
        return (
            <div className="h-80 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-500 text-center px-4">
                    São necessárias pelo menos 3 competências avaliadas para gerar o gráfico de radar.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[450px] w-full">
            {title && <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>}
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                        dataKey="competency"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />

                    <Radar
                        name="Aluno"
                        dataKey="studentScore"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.4}
                    />
                    <Radar
                        name="Média da Turma"
                        dataKey="classAverage"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                    />

                    <Legend />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`]}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
