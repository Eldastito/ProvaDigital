import React from 'react';
import { Activity } from 'lucide-react';

interface EvolutionChartProps {
    data: { label: string, value: number }[];
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ data }) => {
    if (data.length < 2) return (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <Activity size={24} className="mb-2 opacity-50" />
            <span>Ainda sem dados suficientes para gráfico.</span>
            <span className="text-xs">Realize mais provas!</span>
        </div>
    );

    const height = 150;
    const width = 300;
    const padding = 20;

    const maxY = 10; // Grades are 0-10
    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - (d.value / maxY) * (height - 2 * padding);
        return x + ',' + y;
    }).join(' ');

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={'0 0 ' + width + ' ' + height} className="w-full h-full">
                {/* Grid Lines */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />

                {/* Path */}
                <polyline points={points} fill="none" stroke="#0077b6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Dots and Labels */}
                {data.map((d, i) => {
                    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
                    const y = height - padding - (d.value / maxY) * (height - 2 * padding);
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="white" stroke="#0077b6" strokeWidth="2" />
                            <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#0f1d2e" fontWeight="bold">{d.value.toFixed(1)}</text>
                            <text x={x} y={height - 2} textAnchor="middle" fontSize="8" fill="#64748b">{d.label.slice(0, 6)}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
