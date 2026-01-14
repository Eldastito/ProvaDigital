import React, { useState, useMemo } from 'react';
import { Gamepad2, Search, ExternalLink, Play, ArrowLeft, Swords, Shield, ShoppingCart, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { GamificationService } from '../../services/gamificationService';

export const ArcadeView = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'PORTAL' | 'ARENA' | 'SURVIVAL'>('PORTAL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    const { arcadeGames, currentUser, userProfiles } = useAppStore();

    // User Profile for XP Widget
    const userProfile = userProfiles.find(p => p.userId === currentUser?.id);
    const { level, progress, currentLevelXp, nextLevelXp } = GamificationService.calculateLevel(userProfile?.xp || 0);

    const games = useMemo(() => arcadeGames, [arcadeGames]);

    const filteredGames = games.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.description.toLowerCase().includes(searchTerm.toLowerCase());
        // Simple mock filtering for modes: Arena = Math/Logic, Survival = Memory/Strategy
        const modeFilter = viewMode === 'ARENA' ? ['MATH', 'LOGIC'].includes(game.category) :
            viewMode === 'SURVIVAL' ? ['MEMORY', 'STRATEGY'].includes(game.category) : true;

        const matchesCategory = selectedCategory === 'ALL' || game.category === selectedCategory;
        return matchesSearch && matchesCategory && modeFilter;
    });

    const categories = [
        { id: 'ALL', label: 'Todos' },
        { id: 'MATH', label: 'Matemática' },
        { id: 'LOGIC', label: 'Lógica' },
        { id: 'MEMORY', label: 'Memória' },
        { id: 'STRATEGY', label: 'Estratégia' }
    ];

    const handlePlay = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // --- GAME LIST COMPONENT ---
    const GameList = ({ title, color }: { title: string, color: string }) => (
        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right duration-300">
            <div className="bg-slate-900 p-6 shadow-xl relative overflow-hidden shrink-0">
                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <button onClick={() => setViewMode('PORTAL')} className="mb-4 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors">
                        <ArrowLeft size={16} /> Voltar ao Portal
                    </button>
                    <h1 className={`text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r ${color}`}>
                        {title}
                    </h1>
                    {/* Search Bar */}
                    <div className="relative w-full mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar jogos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGames.length > 0 ? filteredGames.map(game => (
                        <div key={game.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden group flex flex-col h-full">
                            <div className="relative h-40 bg-slate-200 overflow-hidden">
                                <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                    <button onClick={() => handlePlay(game.gameUrl)} className="bg-white text-purple-600 rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                        <Play fill="currentColor" size={20} className="ml-1" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-slate-800 mb-1">{game.title}</h3>
                                <p className="text-slate-500 text-xs mb-3 line-clamp-2 flex-1">{game.description}</p>
                                <button onClick={() => handlePlay(game.gameUrl)} className="w-full py-2 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors">
                                    Jogar <ExternalLink size={12} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-20 text-slate-400">Nenhum jogo encontrado.</div>
                    )}
                </div>
            </div>
        </div>
    );

    if (viewMode === 'ARENA') return <GameList title="Battle Arena" color="from-orange-400 to-red-500" />;
    if (viewMode === 'SURVIVAL') return <GameList title="Survival Mode" color="from-blue-400 to-cyan-400" />;

    // --- PORTAL VIEW (Main Hub) ---
    return (
        <div className="h-full bg-slate-900 text-white relative overflow-hidden font-sans flex flex-col items-center justify-center p-6">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black"></div>

            {/* XP WIDGET (Like Ref Image) */}
            <div className="absolute top-6 right-6 z-20 animate-in slide-in-from-top-10 duration-700">
                <div className="relative">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-30"></div>

                    <div className="relative bg-slate-800/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-2xl min-w-[280px]">
                        {/* Owl Icon / Logo */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
                            🦉
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500">XP</span>
                                <span className="text-xs font-bold text-slate-400">Level {level} | {Math.floor(currentLevelXp)}/{nextLevelXp} XP</span>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Widget: Shop Link */}
                    <button
                        onClick={() => navigate('/dashboard/aluno/loja')}
                        className="mt-3 w-full bg-gradient-to-r from-sky-400/10 to-blue-500/10 backdrop-blur-md border border-sky-400/30 p-3 rounded-xl flex items-center justify-between hover:bg-sky-400/20 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                                <ShoppingCart size={16} className="text-sky-400" />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-sm text-sky-100">Loja de Avatares</div>
                                <div className="text-[10px] text-sky-300 group-hover:text-sky-200">Novos itens disponíveis!</div>
                            </div>
                        </div>
                        <ArrowLeft className="rotate-180 text-sky-400 group-hover:translate-x-1 transition-transform" size={16} />
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT CENTER */}
            <div className="relative z-10 w-full max-w-md flex flex-col gap-6 -mt-10">

                {/* 3D Character Placeholder (Ref Image has character on left, but centered stack is better for mobile-opt) */}
                <div className="h-64 w-full flex items-center justify-center mb-4">
                    <div className="relative animate-bounce-slow">
                        {/* MOCK 3D CHAIR BOY */}
                        <div className="text-[150px] drop-shadow-2xl grayscale-[0.2] hover:grayscale-0 transition-all duration-700 cursor-pointer transform hover:scale-105">
                            🧑‍🦽
                        </div>
                        {/* Floor Shadow */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/40 rounded-[100%] blur-md"></div>
                    </div>
                </div>

                {/* GAME MODES BUTTONS */}
                <button
                    onClick={() => setViewMode('ARENA')}
                    className="group relative w-full h-24 rounded-3xl overflow-hidden shadow-2xl transition-transform hover:scale-105 active:scale-95"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 opacity-90 transition-opacity group-hover:opacity-100"></div>
                    {/* Fire Effect Overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 bg-blend-soft-light"></div>

                    <div className="relative h-full flex items-center justify-between px-8">
                        <div>
                            <h2 className="text-2xl font-black italic text-white drop-shadow-md">Battle Arena</h2>
                            <span className="text-xs font-bold text-orange-200">Competitivo PvP</span>
                        </div>
                        <Swords size={40} className="text-white drop-shadow-lg transform -rotate-12 group-hover:rotate-12 transition-transform" />
                    </div>
                </button>

                <button
                    onClick={() => setViewMode('SURVIVAL')}
                    className="group relative w-full h-20 rounded-3xl overflow-hidden shadow-2xl transition-transform hover:scale-105 active:scale-95 border-t border-white/10"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 opacity-90 group-hover:from-blue-900 group-hover:to-slate-900"></div>
                    <div className="relative h-full flex items-center justify-between px-8">
                        <div>
                            <h2 className="text-xl font-bold text-white">Survival</h2>
                            <span className="text-xs text-slate-400 group-hover:text-blue-300">Modo Solo</span>
                        </div>
                        <Shield size={32} className="text-blue-400 group-hover:text-blue-200" />
                    </div>
                </button>

            </div>

            {/* BOTTOM NAV MOCK (Just visual to match ref) */}
            <div className="absolute bottom-6 w-full max-w-sm bg-slate-800/80 backdrop-blur-md rounded-full px-6 py-4 flex justify-between items-center border border-white/5 shadow-2xl">
                <div className="flex flex-col items-center gap-1 text-blue-400">
                    <div className="w-1 h-1 bg-current rounded-full mb-1"></div>
                    <span className="text-[10px] font-bold">Home</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition cursor-pointer" onClick={() => navigate('/student/avatar-shop')}>
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-5 h-5 rounded-full grayscale opacity-50" />
                </div>
                <div className="flex flex-col items-center gap-1 text-orange-500 cursor-pointer" onClick={() => setViewMode('ARENA')}>
                    <Swords size={20} />
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition">
                    <ShoppingCart size={20} />
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition">
                    <div className="w-5 h-5 rounded-full bg-slate-600"></div>
                </div>
            </div>

        </div>
    );
};
