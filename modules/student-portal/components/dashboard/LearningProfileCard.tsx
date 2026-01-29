import React from 'react';
import { Brain, Medal, Coins, User as UserIcon, ShoppingBag, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfileExtended, StudentProfile } from '../../../../types';

interface LearningProfileCardProps {
    profile: StudentProfile | null | undefined;
    extendedProfile: UserProfileExtended | null | undefined;
    isParent: boolean;
}

export const LearningProfileCard: React.FC<LearningProfileCardProps> = ({ profile, extendedProfile, isParent }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Brain size={20} className="text-purple-600" /> Perfil e Conquistas
                </h3>
                <div className="space-y-4">
                    {/* Academic Achievements List */}
                    {extendedProfile?.academicAchievements && extendedProfile.academicAchievements.length > 0 && (
                        <div className="mb-4">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-2">Conquistas Acadêmicas</div>
                            <div className="space-y-2">
                                {extendedProfile.academicAchievements.map(ach => (
                                    <div key={ach.id} className="flex items-center gap-2 bg-yellow-50 p-2 rounded border border-yellow-200 text-sm text-yellow-800">
                                        <Medal size={16} />
                                        <span className="font-bold">{ach.title}</span>
                                        <span className="text-xs bg-white px-1 rounded ml-auto border border-yellow-300">+{ach.bonusPoints} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {profile ? (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
                                {profile.learningChannel.charAt(0)}
                            </div>
                            <div className="flex flex-col items-center p-2 rounded-xl bg-amber-100 border border-amber-200 min-w-[80px]">
                                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Coins size={12} /> Moedas
                                </div>
                                <div className="font-black text-amber-600 text-lg leading-none">
                                    {extendedProfile?.owlCoins || 0}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-primary transition-colors"
                                    title="Meu Perfil"
                                >
                                    <UserIcon size={20} />
                                </button>
                                {!isParent && (
                                    <button
                                        onClick={() => navigate('/student/shop')}
                                        className="p-2 bg-brand-primary text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-bold text-xs"
                                        title="Loja de Avatares"
                                    >
                                        <ShoppingBag size={16} /> <span>LOJA</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-400">
                            <Activity size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Triagem de perfil ainda não realizada.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
