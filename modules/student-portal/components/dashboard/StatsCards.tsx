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
        if (level === RiskLevel.HIGH) return 'bg-rose-50 border-rose-200 text-rose-800';
        if (level === RiskLevel.MEDIUM) return 'bg-amber-50 border-amber-200 text-amber-800';
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: IDG */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-brand-primary/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Índice Global (IDG)</span>
                    <TrendingUp size={20} className="text-brand-primary" />
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-black text-brand-dark">
                        {stats.examsTaken > 0 ? stats.idgScore.toFixed(1) : <span className="text-slate-300">--</span>}
                    </div>
                    {trend !== 0 && (
                        <div className={'flex items-center text-xs font-bold px-2 py-0.5 rounded-full ' + (trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600') + ' '}>
                            {trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {Math.abs(trend).toFixed(1)}
                        </div>
                    )}
                </div>
            </div>

            {/* Card 2: Frequência */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Frequência</span>
                    <CheckCircle size={20} className={stats.attendanceRate > 85 ? "text-emerald-500" : "text-rose-500"} />
                </div>
                <div className="text-4xl font-black text-brand-dark">{stats.attendanceRate}%</div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden border border-slate-200">
                    <div
                        className={'h-full rounded-full transition-all duration-1000 ' + (stats.attendanceRate > 85 ? 'bg-emerald-500' : 'bg-rose-500') + ' '}
                        style={{ width: (stats.attendanceRate) + '%' }}
                    ></div>
                </div>
            </div>

            {/* Card 3: Risco */}
            <div className={'p-5 rounded-xl border shadow-sm relative group hover:shadow-md transition-all ' + (getRiskColor(stats.riskLevel || RiskLevel.LOW)) + ' '}>
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

            {/* Card 4: Meta */}
            <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-5 rounded-xl border border-brand-primary shadow-sm text-white relative overflow-hidden group hover:shadow-md hover:shadow-brand-secondary/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-sky-100 uppercase tracking-widest">Ponto de Equilíbrio</span>
                    <Flame size={20} className="text-white animate-pulse" />
                </div>
                <div className="text-4xl font-black text-white">
                    {Math.min(10, stats.missingPointsForApproval).toFixed(1)}
                </div>
                <div className="text-[10px] py-1 text-sky-100 mt-1 font-bold">META PARA PRÓXIMA PROVA</div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </div>
        </div>
    );
};
