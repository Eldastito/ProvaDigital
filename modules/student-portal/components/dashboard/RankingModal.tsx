import React, { useState } from 'react';
import { Trophy, Coins, X, Gamepad2, Zap, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RankingRanks {
    classRank: number;
    schoolRank: number;
    generalRank: number; // Not used in UI but kept for type compatibility
    totalClass: number;
    totalSchool: number;
    totalGeneral: number; // Not used in UI but kept for type compatibility
}

interface RankingStats {
    idgScore: number;
    examAverage: number;
    projectAverage: number;
    bonusPoints: number;
}

interface RankingModalProps {
    isOpen: boolean;
    onClose: () => void;
    rankingMode: 'ACADEMIC' | 'XP';
    setRankingMode: (mode: 'ACADEMIC' | 'XP') => void;
    ranks: RankingRanks;
    stats: RankingStats;
    settings: { rankingAnonymity?: string };
}

export const RankingModal: React.FC<RankingModalProps> = ({
    isOpen,
    onClose,
    rankingMode,
    setRankingMode,
    ranks,
    stats,
    settings
}) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-brand-primary relative">
                {/* Confetti Effect Background */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-10 pointer-events-none"></div>

                <div className="p-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>

                    <div className={'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 shadow-inner ' + (rankingMode === 'ACADEMIC' ? 'bg-yellow-100 border-yellow-200' : 'bg-amber-100 border-amber-300') + ' '}>
                        {rankingMode === 'ACADEMIC' ? <Trophy size={40} className="text-yellow-600 drop-shadow-sm" /> : <Coins size={40} className="text-amber-600 drop-shadow-sm" />}
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 mb-2">
                        {rankingMode === 'ACADEMIC' ? 'Ranking Ponderado' : 'Liga de Engajamento'}
                    </h2>
                    <p className="text-slate-500 text-sm mb-4">
                        {rankingMode === 'ACADEMIC' ? 'Critérios: Provas (60%) + Trabalhos (30%) + Extras.' : 'Baseado em Owl Coins ganhas nos jogos.'}
                    </p>

                    {/* TOGGLE */}
                    <div className="flex justify-center gap-2 mb-6">
                        {/* ARCADE BUTTON - NEW */}
                        <button
                            onClick={() => navigate('/student/arcade')}
                            className="bg-white border-2 border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-transparent rounded-bl-full -mr-8 -mt-8"></div>
                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                <Gamepad2 size={28} />
                            </div>
                            <div className="text-center z-10">
                                <div className="font-black text-slate-800 text-lg">Arcade Zone</div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Jogos Educativos</div>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/student/survival')}
                            className={'px-4 py-1 rounded-full text-xs font-bold transition ' + (rankingMode === 'ACADEMIC' ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500') + ' '}
                        >
                            Acadêmico (IDG)
                        </button>
                        <button
                            onClick={() => setRankingMode('XP')}
                            className={'px-4 py-1 rounded-full text-xs font-bold transition ' + (rankingMode === 'XP' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500') + ' '}
                        >
                            XP / Moedas
                        </button>
                    </div>

                    {/* Score Breakdown (New Feature) */}
                    {rankingMode === 'ACADEMIC' && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-left">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Composição da sua Nota Global ({stats.idgScore.toFixed(1)})</h4>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span>📘 Médias de Provas (60%)</span>
                                    <span className="font-bold">{stats.examAverage.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: (stats.examAverage * 10) + '%' }}></div>
                                </div>

                                <div className="flex justify-between items-center mt-1">
                                    <span>📙 Médias de Trabalhos (30%)</span>
                                    <span className="font-bold">{stats.projectAverage.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full" style={{ width: (stats.projectAverage * 10) + '%' }}></div>
                                </div>

                                {stats.bonusPoints > 0 && (
                                    <div className="flex justify-between items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded mt-2">
                                        <span className="flex items-center gap-1"><Medal size={12} /> Bônus Extra (Olimpíadas/Eventos)</span>
                                        <span>+{stats.bonusPoints.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white shadow-sm rounded-xl border border-slate-200">
                            <div className="text-left">
                                <div className="font-bold text-slate-700">Na Turma</div>
                                <div className="text-xs text-slate-400">Entre {ranks.totalClass} alunos</div>
                            </div>
                            <div className={'text-2xl font-black ' + (rankingMode === 'XP' ? 'text-amber-600' : 'text-brand-primary') + ' '}>#{ranks.classRank}</div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white shadow-sm rounded-xl border border-slate-200">
                            <div className="text-left">
                                <div className="font-bold text-slate-700">Na Escola</div>
                                <div className="text-xs text-slate-400">Entre {ranks.totalSchool} alunos</div>
                            </div>
                            <div className={'text-2xl font-black ' + (rankingMode === 'XP' ? 'text-amber-700' : 'text-brand-secondary') + ' '}>#{ranks.schoolRank}</div>
                        </div>
                    </div>

                    {settings?.rankingAnonymity === 'ANONIMO' && rankingMode === 'ACADEMIC' && (
                        <p className="text-[10px] text-slate-400 mt-4 italic">
                            * O ranking público acadêmico é anônimo, mas você pode ver sua posição aqui.
                        </p>
                    )}
                    {rankingMode === 'XP' && (
                        <p className="text-[10px] text-amber-600 mt-4 font-bold flex items-center justify-center gap-1">
                            <Zap size={10} /> Dica: Jogue o 'Modo Sobrevivência' para subir no ranking de XP!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
