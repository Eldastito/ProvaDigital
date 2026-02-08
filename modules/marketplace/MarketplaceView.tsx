
import React, { useState } from 'react';
import { Search, Filter, ShoppingBag, Star, Download, Eye, Share2, Award, BookOpen, Clock, Users, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Item } from '../../types';

export const MarketplaceView = () => {
    const state = useAppStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDiscipline, setSelectedDiscipline] = useState('ALL');
    const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');

    // Itens fictícios para o Marketplace (Simulando itens públicos da rede)
    const marketplaceItems = [
        {
            id: 'm1',
            title: 'Equações de 2º Grau - Contextualizadas',
            discipline: 'Matemática',
            difficulty: 'HARD',
            author: 'Prof. Ricardo Silva',
            downloads: 124,
            rating: 4.8,
            tags: ['Álgebra', 'BNCC'],
            price: 0, // Grátis para a rede
            isPremium: false,
            createdAt: '2026-02-01'
        },
        {
            id: 'm2',
            title: 'Interpretação de Texto: Machado de Assis',
            discipline: 'Português',
            difficulty: 'MEDIUM',
            author: 'Profa. Ana Costa',
            downloads: 89,
            rating: 5.0,
            tags: ['Literatura', 'Realismo'],
            price: 0,
            isPremium: true,
            createdAt: '2026-02-05'
        },
        {
            id: 'm3',
            title: 'Revolução Industrial: Impactos Sociais',
            discipline: 'História',
            difficulty: 'MEDIUM',
            author: 'Prof. Marcos Oliveira',
            downloads: 215,
            rating: 4.5,
            tags: ['Sociedade', 'Tecnologia'],
            price: 0,
            isPremium: false,
            createdAt: '2026-01-20'
        },
        {
            id: 'm4',
            title: 'Genética: Leis de Mendel',
            discipline: 'Ciências',
            difficulty: 'HARD',
            author: 'Profa. Juliana Lima',
            downloads: 56,
            rating: 4.7,
            tags: ['Biologia', 'Laboratório'],
            price: 0,
            isPremium: false,
            createdAt: '2026-02-06'
        }
    ];

    const filteredItems = marketplaceItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDiscipline = selectedDiscipline === 'ALL' || item.discipline === selectedDiscipline;
        const matchesDifficulty = selectedDifficulty === 'ALL' || item.difficulty === selectedDifficulty;
        return matchesSearch && matchesDiscipline && matchesDifficulty;
    });

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {/* Header com Banner */}
            <div className="relative bg-gradient-to-r from-brand-primary to-brand-dark rounded-3xl p-10 mb-10 overflow-hidden shadow-xl">
                <div className="relative z-10 text-white max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                            <ShoppingBag size={24} />
                        </div>
                        <span className="font-bold uppercase tracking-widest text-xs opacity-80">Marketplace ExamePad</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4">Comunidade de Professores</h1>
                    <p className="text-lg opacity-90 leading-relaxed mb-6">
                        Explore, compartilhe e utilize questões de alta qualidade criadas por outros educadores da rede.
                        Economize tempo e melhore o nível das suas avaliações.
                    </p>
                    <div className="flex gap-4">
                        <button className="px-6 py-3 bg-white text-brand-dark rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition shadow-lg">
                            <Award size={18} /> Meus Itens Públicos
                        </button>
                    </div>
                </div>
                {/* Visual Decon (Abstract) */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                    <BookOpen size={400} className="absolute -top-20 -right-20 rotate-12" />
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por título, autor ou disciplina..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <select
                        className="p-3 bg-slate-50 rounded-xl border-none outline-none font-medium text-slate-600 focus:ring-2 focus:ring-brand-primary/20"
                        value={selectedDiscipline}
                        onChange={(e) => setSelectedDiscipline(e.target.value)}
                    >
                        <option value="ALL">Todas Disciplinas</option>
                        <option value="Matemática">Matemática</option>
                        <option value="Português">Português</option>
                        <option value="História">História</option>
                        <option value="Ciências">Ciências</option>
                    </select>

                    <select
                        className="p-3 bg-slate-50 rounded-xl border-none outline-none font-medium text-slate-600 focus:ring-2 focus:ring-brand-primary/20"
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                    >
                        <option value="ALL">Dificuldades</option>
                        <option value="EASY">Fácil</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HARD">Difícil</option>
                    </select>
                </div>
            </div>

            {/* Grid de Itens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${item.difficulty === 'HARD' ? 'bg-rose-50 text-rose-600' :
                                    item.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                                        'bg-emerald-50 text-emerald-600'
                                    }`}>
                                    {item.difficulty}
                                </span>
                                {item.isPremium && (
                                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                )}
                            </div>

                            <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-brand-primary transition-colors leading-snug">
                                {item.title}
                            </h3>

                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                                <Users size={14} />
                                <span>{item.author}</span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-4">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 pt-0 mt-auto border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-slate-400">
                                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs font-bold text-slate-600">{item.rating}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-400">
                                    <Download size={12} />
                                    <span className="text-xs font-bold text-slate-600">{item.downloads}</span>
                                </div>
                            </div>
                            <button className="p-2 bg-slate-100 hover:bg-brand-primary hover:text-white rounded-lg transition-all text-slate-600 shadow-inner">
                                <Eye size={18} />
                            </button>
                        </div>

                        <button className="w-full py-3 bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                            <Download size={16} /> Utilizar no Banco {item.price === 0 ? '(Grátis)' : `R$ ${item.price}`}
                        </button>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <BookOpen size={64} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum item encontrado</h3>
                    <p className="text-slate-500">Tente ajustar seus filtros de busca ou disciplina.</p>
                </div>
            )}
        </div>
    );
};
