import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Brain, Activity, ShieldAlert } from 'lucide-react';

interface TrajectoryPoint {
    step: number;
    theta: number;
    see: number;
}

interface TrajectoryVisualizerProps {
    data: TrajectoryPoint[];
}

export const TrajectoryVisualizer: React.FC<TrajectoryVisualizerProps> = ({ data }) => {
    // Transform data for chart adding confidence intervals
    const chartData = data.map(d => ({
        ...d,
        upperBound: d.theta + d.see,
        lowerBound: d.theta - d.see
    }));

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity size={18} className="text-brand-primary" />
                    Convergência Estocástica de Proficiência ($\theta$)
                </h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Motor: FORGE-CAT-V1.5</span>
            </div>

            <div className="p-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorTheta" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="step"
                            label={{ value: 'Itens Apresentados', position: 'insideBottom', offset: -5, fontSize: 10 }}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            domain={[-4, 4]}
                            label={{ value: 'Proficiência (\u03b8)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                            tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />

                        {/* Confidence Interval (SEE) */}
                        <Area
                            type="monotone"
                            dataKey="upperBound"
                            stroke="none"
                            fill="#e2e8f0"
                            fillOpacity={0.3}
                        />

                        {/* Theta Path */}
                        <Line
                            type="monotone"
                            dataKey="theta"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="p-4 bg-indigo-50/50 border-t border-indigo-100 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-indigo-100">
                        <ShieldAlert size={16} className="text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Erro Padrão Final (SEE)</p>
                        <p className="text-sm font-bold text-slate-800">{data[data.length - 1]?.see.toFixed(3) || '0.000'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-indigo-100">
                        <Brain size={16} className="text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Estimativa Final ($\theta$)</p>
                        <p className="text-sm font-bold text-slate-800">{data[data.length - 1]?.theta.toFixed(2) || '0.00'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
