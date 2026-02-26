import React, { useState, useEffect } from 'react';
import { Brain, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, Users, Target, Activity, Calendar, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { predictBatch, PredictionResult } from '../../services/predictionService';

export const PredictiveRiskDashboard: React.FC = () => {
    const state = useAppStore();
    const students = state.students;
    const [predictions, setPredictions] = useState<PredictionResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const runPredictions = async () => {
            setIsLoading(true);
            // Limitamos a 5 alunos para o demo para não estourar tokens
            const subsetIds = students.slice(0, 5).map(s => s.id);
            const results = await predictBatch(subsetIds, state as any);
            setPredictions(results);
            setIsLoading(false);
        };
        runPredictions();
    }, []);

    const highRisk = predictions.filter(p => p.evasionRiskProbability > 0.6);
    const avgScorePrediction = predictions.reduce((sum, p) => sum + p.predictedScore, 0) / (predictions.length || 1);

    return (
        <div className="p-8 space-y-8 bg-secondary min-h-screen transition-colors duration-500">
            {/* Header - Refined Card Layout */}
            <div className="mx-0 mt-2 mb-8 glass-effect bg-surface/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl z-20">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-primary/20 p-3 rounded-xl text-brand-primary border border-brand-primary/30">
                        <Brain size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-primary tracking-tight">Dashboard de Predição IA</h1>
                        <p className="text-secondary text-sm font-medium">Análise preditiva de retenção e sucesso acadêmico (v4.0 Alpha)</p>
                    </div>
                </div>
                <div className="bg-surface/30 px-4 py-2 rounded-xl border border-divider text-[10px] font-black text-secondary flex items-center gap-2 uppercase tracking-widest">
                    <Calendar size={14} />
                    Projeção: Próximo Bimestre
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{highRisk.length}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Alertas de Evasão</div>
                </div>

                <div className="bg-surface p-6 rounded-3xl border border-divider shadow-sm group hover:border-brand-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl">
                            <Target className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-primary">{avgScorePrediction.toFixed(1)}</div>
                    <div className="text-sm font-bold text-secondary uppercase tracking-wider">Média Projetada</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{predictions.filter(p => p.trend === 'UP').length}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tendência de Melhora</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{students.length}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total de Alunos</div>
                </div>
            </div>

            {/* Detailed Predictions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-slate-800">Previsões Individuais</h2>
                    {isLoading ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-bold text-slate-600">IA analisando histórico escolar...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {predictions.map((p, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-slate-900 text-lg">{p.studentName}</h3>
                                                {p.trend === 'UP' ? <TrendingUp className="text-emerald-500 w-5 h-5" /> : <TrendingDown className="text-red-500 w-5 h-5" />}
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.trend === 'UP' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    TENDÊNCIA: {p.trend}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed italic line-clamp-2 italic mb-4">"{p.aiInsight}"</p>

                                            <div className="bg-indigo-50 p-4 rounded-2xl flex items-start gap-3">
                                                <Lightbulb className="text-indigo-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-indigo-900 uppercase">Intervenção Sugerida</p>
                                                    <p className="text-sm text-indigo-700">{p.recommendedIntervention}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-48 space-y-4 border-l border-divider pl-6">
                                            <div>
                                                <div className="flex justify-between text-[10px] font-black text-secondary uppercase mb-1">
                                                    <span>Risco Evasão</span>
                                                    <span>{Math.round(p.evasionRiskProbability * 100)}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ${p.evasionRiskProbability > 0.6 ? 'bg-rose-500' : 'bg-brand-primary'}`} style={{ width: `${p.evasionRiskProbability * 100}%` }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] font-black text-secondary uppercase mb-1">
                                                    <span>Nota Projetada</span>
                                                    <span>{p.predictedScore.toFixed(1)}</span>
                                                </div>
                                                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand-navy transition-all duration-1000" style={{ width: `${p.predictedScore * 10}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800">Alertas Críticos</h2>
                    <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-amber-400 font-black text-xs uppercase tracking-widest">Sinais de Alerta IA</h3>
                            {predictions.flatMap(p => p.criticalAlerts).slice(0, 5).map((alert, i) => (
                                <div key={i} className="flex gap-3 text-sm border-b border-white/10 pb-3 last:border-0 pt-3">
                                    <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0" />
                                    <p className="text-slate-300">{alert}</p>
                                </div>
                            ))}
                            {predictions.length === 0 && <p className="text-slate-500 text-sm italic">Nenhum alerta crítico processado.</p>}
                        </div>

                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                            <h4 className="font-bold text-indigo-400 text-sm mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Resumo da Saúde Escolar
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                A IA detectou uma predominância de tendências **{avgScorePrediction > 6 ? 'ESTÁVEIS' : 'EM QUEDA'}**.
                                {highRisk.length > 0 ? ` Atenção especial para os ${highRisk.length} alunos com risco crítico de desengajamento.` : ' Ninguém com risco crítico imediato detectado.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
