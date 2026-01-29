
import React from 'react';
import { Trophy, Coins, Medal } from 'lucide-react';
import { UserProfileExtended } from '../../../../types';

interface GamificationCardProps {
    extendedProfile: UserProfileExtended | null | undefined;
}

export const GamificationCard: React.FC<GamificationCardProps> = ({ extendedProfile }) => {
    // --- LEVELLING LOGIC ---
    const currentXP = extendedProfile?.xp || 0;
    const currentLevel = Math.floor(currentXP / 1000) + 1;
    const nextLevelXP = currentLevel * 1000;
    const progressToNext = currentXP % 1000;
    const progressPercent = (progressToNext / 1000) * 100;

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-amber-900 flex items-center gap-2 text-lg">
                            <Trophy size={20} className="text-amber-600" /> Nível {currentLevel}
                        </h3>
                        <p className="text-xs text-amber-700 font-bold uppercase">{currentXP} XP Total</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-amber-600">{extendedProfile?.owlCoins || 0}</span>
                        <div className="text-[10px] font-bold text-amber-700 uppercase">Owl Coins</div>
                    </div>
                </div>

                {/* XP Progress Bar */}
                <div className="mb-2">
                    <div className="flex justify-between text-xs font-bold text-amber-800 mb-1">
                        <span>Progresso para Nível {currentLevel + 1}</span>
                        <span>{Math.floor(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-white/50 h-3 rounded-full border border-amber-200 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
                            style={{ width: (progressPercent) + '%' }}
                        ></div>
                    </div>
                    <div className="text-[10px] text-amber-700 mt-1 text-right">Faltam {1000 - progressToNext} XP</div>
                </div>

                <div className="flex gap-2 mt-2 flex-wrap">
                    {(extendedProfile?.badges || ['Iniciante']).map((badge, idx) => (
                        <div key={idx} className="bg-white/80 px-2 py-1 rounded text-[10px] font-bold text-amber-900 flex items-center gap-1 border border-amber-200 shadow-sm">
                            <Medal size={10} className="text-orange-500" /> {badge}
                        </div>
                    ))}
                </div>
            </div>
            <Coins size={120} className="absolute -right-6 -bottom-6 text-amber-200 opacity-40 rotate-12" />
        </div>
    );
};
