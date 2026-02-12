import React from 'react';
import { TrendingUp, ArrowUp, ArrowDown, CheckCircle, AlertTriangle, BookOpen, Flame } from 'lucide-react';
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-effect p-5 rounded-2xl shadow-xl shadow-brand-primary/5 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Índice Global (IDG)</span>
                    <TrendingUp size={20} className="text-brand-primary" />
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-black text-slate-800 dark:text-white">
                        {stats.examsTaken > 0 ? stats.idgScore.toFixed(1) : <span className="text-slate-300 dark:text-slate-600">--</span>}
                    </div>
                    {trend !== 0 && (
                        <div className={'flex items-center text-xs font-bold px-2 py-0.5 rounded-full ' + (trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600') + ' '}>
                            {trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {Math.abs(trend).toFixed(1)}
                        </div>
                    )}
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            </div>

            <div className="glass-effect p-5 rounded-2xl shadow-xl shadow-emerald-500/5 relative group hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência</span>
                    <CheckCircle size={20} className={stats.attendanceRate > 85 ? "text-emerald-500" : "text-rose-500"} />
                </div>
                <div className="text-4xl font-black text-slate-800 dark:text-white">{stats.attendanceRate}%</div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                        className={'h-full rounded-full transition-all duration-1000 ' + (stats.attendanceRate > 85 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500') + ' '}
                        style={{ width: (stats.attendanceRate) + '%' }}
                    ></div>
                </div>
            </div>

            <div className={'p-5 rounded-2xl shadow-xl relative group hover:scale-[1.02] transition-transform ' + (getRiskColor(stats.riskLevel || RiskLevel.LOW)) + ' '}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">Status de Risco</span>
                    <AlertTriangle size={20} />
                </div>
                <div className="text-2xl font-black">
                    {translateRiskLevel(stats.riskLevel || RiskLevel.LOW)}
                </div>
                <div className="text-xs mt-1 font-bold opacity-60">
                    {stats.riskLevel === RiskLevel.LOW ? 'EXCELENTE DESEMPENHO!' : 'ATENÇÃO NECESSÁRIA'}
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#00A3E0] via-[#00CDAC] to-[#00A3E0] bg-[length:200%_200%] animate-gradient text-white p-5 rounded-2xl shadow-xl shadow-brand-primary/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-sky-100 uppercase tracking-widest">Ponto de Equilíbrio</span>
                    <Flame size={20} className="text-white animate-pulse" />
                </div>
                <div className="text-4xl font-black text-white">
                    {Math.min(10, stats.missingPointsForApproval).toFixed(1)}
                </div>
                <div className="text-[10px] text-sky-100 mt-1 font-bold">META PARA PRÓXIMA PROVA</div>
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
            </div>
        </div>
    );
};
