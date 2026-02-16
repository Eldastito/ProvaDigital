
import React, { useState } from 'react';
import { Search, Filter, ShoppingBag, Star, Download, Eye, Share2, Award, BookOpen, Clock, Users, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Item, DifficultyLevel } from '../../types';
import { marketplaceService, MarketplaceItem } from '../../services/marketplaceService';

export const MarketplaceView = () => {
    const { currentUser } = useAppStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDiscipline, setSelectedDiscipline] = useState('ALL');
    const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | DifficultyLevel>('ALL');

    // Estado real
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [importingId, setImportingId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Carregar itens do backend
    React.useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const { items } = await marketplaceService.searchItems({
                    searchQuery,
                    discipline: selectedDiscipline,
                    difficulty: selectedDifficulty === 'ALL' ? 'ALL' : selectedDifficulty as DifficultyLevel,
                    page: 0,
                    pageSize: 20
                });
                setItems(items);
            } catch (error) {
                console.error('Erro ao buscar itens do marketplace:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchItems, 500);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, selectedDiscipline, selectedDifficulty]);

    // Função de Importação (Clonar Item)
    const handleImport = async (item: MarketplaceItem) => {
        if (!currentUser?.tenantId || !currentUser?.id) return;

        setImportingId(item.id);
        try {
            await marketplaceService.importItem(item, currentUser.tenantId, currentUser.id);
            setFeedback({ type: 'success', text: '✅ Questão adicionada ao seu banco com sucesso!' });

            // Opcional: Atualizar contagem localmente
            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, downloadsCount: (i.downloadsCount || 0) + 1 } : i
            ));
        } catch (error) {
            console.error('Erro ao importar item:', error);
            setFeedback({ type: 'error', text: '❌ Erro ao importar. Tente novamente.' });
        } finally {
            setImportingId(null);
            setTimeout(() => setFeedback(null), 3000);
        }
    };

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
                        onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel | 'ALL')}
                    >
                        <option value="ALL">Dificuldades</option>
                        <option value={DifficultyLevel.EASY}>Fácil</option>
                        <option value={DifficultyLevel.MEDIUM}>Média</option>
                        <option value={DifficultyLevel.HARD}>Difícil</option>
                    </select>
                </div>
            </div>

            {/* Feedback Toast */}
            {feedback && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {feedback.type === 'success' ? <Check size={24} /> : <AlertTriangle size={24} />}
                    <span className="font-bold text-sm">{feedback.text}</span>
                </div>
            )}

            {/* Grid de Itens */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                    <Loader2 size={48} className="animate-spin mb-4 text-brand-primary" />
                    <p>Carregando as melhores questões da rede...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">Nenhum item encontrado com estes filtros.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map(item => (
                        <div key={item.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-primary/30 transition-all duration-300 flex flex-col overflow-hidden relative">
                            {/* Badge de Dificuldade */}
                            <div className="absolute top-3 right-3 z-10">
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md ${item.difficulty === DifficultyLevel.HARD ? 'bg-red-500/10 text-red-600 border border-red-200' :
                                    item.difficulty === DifficultyLevel.MEDIUM ? 'bg-amber-500/10 text-amber-600 border border-amber-200' :
                                        'bg-emerald-500/10 text-emerald-600 border border-emerald-200'
                                    }`}>
                                    {item.difficulty === DifficultyLevel.HARD ? 'Difícil' : item.difficulty === DifficultyLevel.MEDIUM ? 'Médio' : 'Fácil'}
                                </span>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                        {item.subject}
                                    </span>
                                    {item.tags?.slice(0, 1).map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] uppercase tracking-wide">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-brand-primary transition-colors">
                                    {item.statement ? item.statement.substring(0, 80).replace(/<[^>]*>?/gm, '') + '...' : 'Sem enunciado'}
                                </h3>

                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {item.authorName?.substring(0, 1) || 'P'}
                                        </div>
                                        <span className="text-xs font-medium text-slate-500 truncate max-w-[100px]">
                                            {item.authorName || 'Professor'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                        <span className="flex items-center gap-1 hover:text-amber-500 transition-colors">
                                            <Star size={12} className="text-amber-400 fill-amber-400" /> {item.ratingAvg || '0.0'}
                                        </span>
                                        <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                                            <Download size={12} /> {item.downloadsCount || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Overlay */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                                <button
                                    onClick={() => handleImport(item)}
                                    disabled={importingId === item.id}
                                    className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-brand-primary transition-colors disabled:opacity-70 disabled:cursor-wait"
                                >
                                    {importingId === item.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Download size={14} />
                                    )}
                                    {importingId === item.id ? 'Importando...' : 'Importar Item'}
                                </button>
                                <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-brand-primary hover:border-brand-primary transition-colors">
                                    <Eye size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
