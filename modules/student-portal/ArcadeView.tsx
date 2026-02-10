import React, { useState, useMemo } from 'react';
import { Gamepad2, Search, ExternalLink, Play, ArrowLeft, Swords, Shield, Zap, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export const ArcadeView = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    const { arcadeGames } = useAppStore();

    const games = useMemo(() => arcadeGames, [arcadeGames]);

    const filteredGames = games.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || game.category === selectedCategory;
        return matchesSearch && matchesCategory;
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

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 animate-in fade-in duration-300">
            {/* ARCADE HEADER (Restored to Dark Banner Style) */}
            <div className="bg-slate-900 text-white p-8 pb-12 shadow-xl relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                </div>

                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-6 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors"
                    >
                        <ArrowLeft size={16} /> Voltar ao Painel
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <Gamepad2 size={40} className="text-purple-400" />
                                <h1 className="text-4xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                    ARCADE ZONE
                                </h1>
                            </div>
                            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                                Explore jogos educativos selecionados para treinar seu cérebro enquanto se diverte.
                                Desafie seus colegas ou sobreviva nos modos especiais!
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar jogos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800/80 backend-blur border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-3 mt-10">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${selectedCategory === cat.id
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* GAMES GRID */}
            <div className="flex-1 max-w-7xl mx-auto w-full p-8 -mt-6 z-20">

                {/* 1. SPECIAL MODES (Moved from Sidebar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {/* RPG Adventure Card */}
                    <div onClick={() => navigate('/aluno/rpg-adventure')} className="cursor-pointer group relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                        <div className="relative h-full p-8 flex flex-col justify-center items-start z-10">
                            <div className="bg-white/10 backdrop-blur rounded p-2 mb-4 text-white">
                                <Map size={32} />
                            </div>
                            <h2 className="text-3xl font-black italic text-white mb-2">RPG Adventure</h2>
                            <p className="text-emerald-100 font-medium">Aprenda vivendo a história!</p>

                            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                <span className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">
                                    Iniciar <Play size={14} fill="currentColor" />
                                </span>
                            </div>
                        </div>
                        <Map size={200} className="absolute -right-10 -bottom-10 text-white opacity-10 transform rotate-12" />
                    </div>

                    {/* Quiz Cards Card */}
                    <div onClick={() => navigate('/aluno/quiz-cards')} className="cursor-pointer group relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                        <div className="relative h-full p-8 flex flex-col justify-center items-start z-10">
                            <div className="bg-white/10 backdrop-blur rounded p-2 mb-4 text-white">
                                <Zap size={32} />
                            </div>
                            <h2 className="text-3xl font-black italic text-white mb-2">Quiz Cards</h2>
                            <p className="text-violet-100 font-medium">Revisão rápida e dinâmica.</p>

                            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                <span className="bg-white text-violet-600 px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">
                                    Jogar <Play size={14} fill="currentColor" />
                                </span>
                            </div>
                        </div>
                        <Zap size={200} className="absolute -right-10 -bottom-10 text-white opacity-10 transform -rotate-12" />
                    </div>

                    {/* Battle Arena Card */}
                    <div onClick={() => navigate('/battle-arena')} className="cursor-pointer group relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                        <div className="relative h-full p-8 flex flex-col justify-center items-start z-10">
                            <div className="bg-white/10 backdrop-blur rounded p-2 mb-4 text-white">
                                <Swords size={32} />
                            </div>
                            <h2 className="text-3xl font-black italic text-white mb-2">Battle Arena</h2>
                            <p className="text-orange-100 font-medium">Desafie sua turma em tempo real!</p>

                            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                <span className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">
                                    Entrar <Play size={14} fill="currentColor" />
                                </span>
                            </div>
                        </div>
                        <Swords size={200} className="absolute -right-10 -bottom-10 text-white opacity-10 transform -rotate-12" />
                    </div>

                    {/* Survival Mode Card */}
                    <div onClick={() => navigate('/survival-mode')} className="cursor-pointer group relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                        <div className="relative h-full p-8 flex flex-col justify-center items-start z-10">
                            <div className="bg-white/10 backdrop-blur rounded p-2 mb-4 text-white">
                                <Shield size={32} />
                            </div>
                            <h2 className="text-3xl font-black italic text-white mb-2">Survival Mode</h2>
                            <p className="text-blue-100 font-medium">Quanto tempo você aguenta sem errar?</p>

                            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                <span className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">
                                    Jogar <Play size={14} fill="currentColor" />
                                </span>
                            </div>
                        </div>
                        <Shield size={200} className="absolute -right-10 -bottom-10 text-white opacity-10" />
                    </div>
                </div>

                <div className="h-px bg-slate-200 w-full mb-10"></div>

                {/* 2. REGULAR ARCADE GAMES */}
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Gamepad2 className="text-purple-600" /> Todos os Jogos
                </h3>

                {filteredGames.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <Gamepad2 size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-500">Nenhum jogo encontrado</h3>
                        <p className="text-slate-400 text-sm">Tente mudar a categoria ou sua busca.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredGames.map(game => (
                            <div
                                key={game.id}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 overflow-hidden group flex flex-col h-full hover:-translate-y-1"
                            >
                                {/* Thumbnail */}
                                <div className="relative h-48 bg-slate-200 overflow-hidden">
                                    {/* Badge */}
                                    <div className="absolute top-3 right-3 z-10">
                                        <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded shadow uppercase tracking-wider">
                                            {game.category}
                                        </span>
                                    </div>

                                    <img
                                        src={game.thumbnailUrl}
                                        alt={game.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-purple-900/20 group-hover:bg-purple-900/40 transition-colors"></div>

                                    {/* Center Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={() => handlePlay(game.gameUrl)}
                                            className="bg-white text-purple-600 rounded-full w-14 h-14 flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform shadow-2xl"
                                        >
                                            <Play fill="currentColor" size={24} className="ml-1" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">
                                        {game.title}
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed mb-6 flex-1 line-clamp-3">
                                        {game.description}
                                    </p>

                                    <button
                                        onClick={() => handlePlay(game.gameUrl)}
                                        className="w-full py-3 bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-100 group-hover:border-purple-200"
                                    >
                                        Jogar Agora <ExternalLink size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};
