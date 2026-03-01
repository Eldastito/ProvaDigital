import React from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface PredictionChartProps {
    currentScore: number;
    projectedScore: number;
    history: { date: string; score: number }[];
}

export const PredictionChart: React.FC<PredictionChartProps> = ({ currentScore, projectedScore, history }) => {
    const isImproving = projectedScore >= currentScore;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-600" /> Curva de Projeção (IA)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Previsão baseada no seu ritmo dos últimos 3 meses.</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${isImproving ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                    {isImproving ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isImproving ? 'TENDÊNCIA DE ALTA' : 'ATENÇÃO REDOBRADA'}
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Nota Atual</div>
                    <div className="text-3xl font-black text-slate-800">{currentScore.toFixed(1)}</div>
                </div>
                <div className="w-px h-10 bg-slate-100 shadow-inner"></div>
                <div className="flex-1">
                    <div className="text-[10px] text-indigo-400 uppercase font-bold mb-1">Projeção (90 dias)</div>
                    <div className="text-3xl font-black text-indigo-600">{projectedScore.toFixed(1)}</div>
                </div>
            </div>

            {/* Visual Chart Placeholder/Simplified SVG */}
            <div className="mt-6 h-24 w-full relative">
                <svg viewBox="0 0 100 40" className="w-full h-full preserve-3d">
                    {/* Path History */}
                    <path
                        d="M 0,35 Q 25,32 50,25"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                    />
                    {/* Projection Path */}
                    <path
                        d="M 50,25 Q 75,18 100,10"
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                        className="animate-pulse"
                    />
                    {/* Current Point */}
                    <circle cx="50" cy="25" r="2.5" fill="#4f46e5" />
                </svg>
            </div>

            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                    ✨ <strong>Insight:</strong> Se você focar em <u>Matemática</u> nas próximas 2 semanas, sua projeção pode subir para <strong>{(projectedScore + 0.5).toFixed(1)}</strong>.
                </p>
            </div>
        </div>
    );
};
