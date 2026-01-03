import React, { useState, useMemo } from 'react';
import { Gamepad2, Search, ExternalLink, Play, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GamificationService } from '../../services/gamificationService';

interface ArcadeViewProps {
    onBack: () => void;
}

export const ArcadeView = ({ onBack }: ArcadeViewProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    const games = useMemo(() => GamificationService.getArcadeGames(), []);

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
        // Open in new tab for security and performance
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-300">
            {/* ARCADE HEADER */}
            <div className="bg-slate-900 text-white p-6 shadow-xl z-10 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <button
                        onClick={onBack}
                        className="mb-4 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors"
                    >
                        <ArrowLeft size={16} /> Voltar ao Painel
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Gamepad2 size={32} className="text-purple-400" />
                                <h1 className="text-3xl font-black tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                    Arcade Zone
                                </h1>
                            </div>
                            <p className="text-slate-400 text-sm max-w-md">
                                Explore jogos educativos selecionados para treinar seu cérebro enquanto se diverte.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-64">
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

                    {/* Category Tabs */}
                    <div className="flex gap-2 mt-8 overflow-x-auto pb-2 custom-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id
                                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* GAMES GRID */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                    {filteredGames.length === 0 ? (
                        <div className="text-center py-20">
                            <Gamepad2 size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-500">Nenhum jogo encontrado</h3>
                            <p className="text-slate-400 text-sm">Tente mudar a categoria ou sua busca.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredGames.map(game => (
                                <div
                                    key={game.id}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden group flex flex-col h-full"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-40 bg-slate-200 overflow-hidden">
                                        <img
                                            src={game.thumbnailUrl}
                                            alt={game.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => {
                                                // Fallback image
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                            <button
                                                onClick={() => handlePlay(game.gameUrl)}
                                                className="bg-white text-purple-600 rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                            >
                                                <Play fill="currentColor" size={20} className="ml-1" />
                                            </button>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                            {game.category}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-purple-600 transition-colors">
                                            {game.title}
                                        </h3>
                                        <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2 flex-1">
                                            {game.description}
                                        </p>

                                        <button
                                            onClick={() => handlePlay(game.gameUrl)}
                                            className="w-full py-2.5 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                        >
                                            Jogar Agora <ExternalLink size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
