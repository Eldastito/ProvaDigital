
import React from 'react';
import { BarChart, Users, AlertTriangle, Award, Brain, Lock } from 'lucide-react';
import { AppState, RiskLevel } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';

export const SchoolDashboardView = ({ state }: { state: AppState }) => {
    const analytics = new AnalyticsService(state);

    // Calculate overall stats
    const allStats = state.students.map(s => analytics.getStudentStats(s.id)).filter(Boolean) as any[];
    const atRiskCount = allStats.filter(s => s.riskLevel !== RiskLevel.LOW).length;
    const totalAvg = allStats.reduce((acc, curr) => acc + curr.idgScore, 0) / (allStats.length || 1);

    // Ranking Logic
    const topStudents = [...allStats].sort((a, b) => b.idgScore - a.idgScore).slice(0, 5);

    // Learning Channel Stats
    const channelCounts = state.studentProfiles?.reduce((acc, curr) => {
        acc[curr.learningChannel] = (acc[curr.learningChannel] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    const { rankingEnabled, rankingAnonymity } = state.settings;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-brand-dark">Analytics da Escola</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand-light rounded-lg text-brand-primary"><BarChart size={20}/></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Média IDG</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{totalAvg.toFixed(1)}</div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><AlertTriangle size={20}/></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Alunos em Risco</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{atRiskCount}</div>
                    <div className="text-xs text-rose-600 mt-1 font-bold">{((atRiskCount / (allStats.length || 1))*100).toFixed(0)}% da escola</div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Brain size={20}/></div>
                        <span className="text-sm font-bold text-slate-500 uppercase">Perfil Dominante</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">Visual</div>
                    <div className="text-xs text-purple-600 mt-1 font-bold">45% dos alunos</div>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ranking */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Award size={20} className="text-yellow-500"/> Top 5 Alunos (Ranking)</h3>
                        {rankingEnabled && rankingAnonymity === 'ANONIMO' && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded flex items-center gap-1">
                                <Lock size={10}/> Modo Anônimo
                            </span>
                        )}
                    </div>
                    
                    {rankingEnabled ? (
                        <div className="space-y-4">
                            {topStudents.map((stat, idx) => {
                                const student = state.students.find(s => s.id === stat.studentId);
                                const displayName = rankingAnonymity === 'NOMINAL' 
                                    ? student?.name 
                                    : `Aluno ${student?.registrationNumber?.slice(-4) || '****'}`;

                                return (
                                    <div key={stat.studentId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-300'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="font-bold text-slate-700">
                                                {displayName}
                                            </div>
                                        </div>
                                        <div className="font-black text-brand-primary">{stat.idgScore.toFixed(1)}</div>
                                    </div>
                                );
                            })}
                            {topStudents.length === 0 && <p className="text-slate-400">Sem dados suficientes.</p>}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center opacity-50">
                            <Award size={32} className="mb-2"/>
                            <p>Ranking desativado nas configurações da escola.</p>
                        </div>
                    )}
                </div>

                {/* Learning Profiles Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Brain size={20} className="text-purple-500"/> Canais de Aprendizagem (Psicopedagogia)</h3>
                    <div className="space-y-4">
                        {Object.entries(channelCounts).map(([channel, count]) => {
                            const percentage = (count / (state.studentProfiles?.length || 1)) * 100;
                            return (
                                <div key={channel}>
                                    <div className="flex justify-between text-xs mb-1 font-bold text-slate-600">
                                        <span className="capitalize">{channel.toLowerCase().replace('_', ' ')}</span>
                                        <span>{count} alunos ({percentage.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${channel === 'VISUAL' ? 'bg-purple-500' : channel === 'AUDITIVO' ? 'bg-blue-500' : channel === 'CINESTESICO' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                        {(!state.studentProfiles || state.studentProfiles.length === 0) && <p className="text-slate-400 text-sm">Nenhum perfil cadastrado.</p>}
                    </div>
                </div>

                {/* Risk List */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><AlertTriangle size={20} className="text-rose-500"/> Atenção Necessária</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                        {allStats.filter(s => s.riskLevel !== RiskLevel.LOW).map(stat => {
                            const student = state.students.find(s => s.id === stat.studentId);
                            const profile = state.studentProfiles?.find(p => p.studentId === stat.studentId);
                            return (
                                <div key={stat.studentId} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">{student?.name}</div>
                                        <div className="text-xs text-slate-500">Perfil: {profile?.learningChannel || 'N/A'}</div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded font-bold ${stat.riskLevel === RiskLevel.HIGH ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {stat.riskLevel === RiskLevel.HIGH ? 'CRÍTICO' : 'ALERTA'}
                                    </div>
                                </div>
                            );
                        })}
                         {atRiskCount === 0 && <p className="text-slate-400 text-sm">Nenhum aluno em risco.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
