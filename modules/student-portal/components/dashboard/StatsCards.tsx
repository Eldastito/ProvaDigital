import React from 'react';
import { TrendingUp, ArrowUp, ArrowDown, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import { RiskLevel } from '../../../../types';
import { translateRiskLevel } from '../../../../utils/translations';

interface StatsCardsProps {
    stats: {
        examsTaken: number;
        idgScore: number;
        attendanceRate: number;
        riskLevel: RiskLevel;
        missingPointsForApproval: number;
    };
    trend: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, trend }) => {

    const getRiskColor = (level: RiskLevel) => {
        if (level === RiskLevel.HIGH) return 'bg-rose-100 text-rose-700 border-rose-200';
        if (level === RiskLevel.MEDIUM) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Índice Global (IDG)</span>
                    <TrendingUp size={20} className="text-brand-primary" />
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-slate-800">
                        {stats.examsTaken > 0 ? stats.idgScore.toFixed(1) : <span className="text-slate-300 text-2xl">--</span>}
                    </div>
                    {trend !== 0 && (
                        <div className={'flex items-center text-xs font-bold ' + (trend > 0 ? 'text-emerald-500' : 'text-rose-500') + ' '}>
                            {trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {Math.abs(trend).toFixed(1)}
                        </div>
                    )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                    {stats.examsTaken > 0 ? "Média Ponderada (Provas + Trabalhos)" : "Realize sua primeira avaliação!"}
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Frequência</span>
                    <CheckCircle size={20} className={stats.attendanceRate > 85 ? "text-emerald-500" : "text-rose-500"} />
                </div>
                <div className="text-3xl font-black text-slate-800">{stats.attendanceRate}%</div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                        className={'h-full ' + (stats.attendanceRate > 85 ? 'bg-emerald-500' : 'bg-rose-500') + ' '}
                        style={{ width: (stats.attendanceRate) + '%' }}
                    ></div>
                </div>
            </div>

            <div className={'p-5 rounded-xl border shadow-sm ' + (getRiskColor(stats.riskLevel || RiskLevel.LOW)) + ' '}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase opacity-70">Status de Risco</span>
                    <AlertTriangle size={20} />
                </div>
                <div className="text-xl font-black">
                    {translateRiskLevel(stats.riskLevel || RiskLevel.LOW)}
                </div>
                <div className="text-xs mt-1 opacity-80">
                    {stats.riskLevel === RiskLevel.LOW ? 'Continue assim!' : 'Procure o Corujão.'}
                </div>
            </div>

            <div className="bg-gradient-to-br from-brand-dark to-brand-primary text-white p-5 rounded-xl border border-brand-dark shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-200 uppercase">Meta Próxima Prova</span>
                    <BookOpen size={20} className="text-white" />
                </div>
                <div className="text-3xl font-black text-white">
                    {Math.min(10, stats.missingPointsForApproval).toFixed(1)}
                </div>
                <div className="text-xs text-sky-100 mt-1">Para manter média 6.0</div>
            </div>
        </div>
    );
};
