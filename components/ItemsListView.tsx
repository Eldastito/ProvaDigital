import React, { useState } from 'react';
import { Search, Filter, Plus, Eye, X, Check, Brain, ChevronDown, ChevronUp, History, BookOpen, AlignLeft, Trash2, Download, Tag, Square, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppState, Item, DifficultyLevel, ItemOrigin, Exam, QuestionType, UserRole } from '../types';
import { Badge } from './ui/Badge';
import { useAppStore } from '../store/useAppStore';

export interface ItemRowProps {
    item: Item;
    onSelect: (i: Item) => void;
    onHistory: (i: Item) => void;
    getUsageColor: (n: number) => any;
    getItemHistory: (id: string) => any[];
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
}

// Row Component (Standard Rendering)
const ItemRow: React.FC<ItemRowProps> = ({ item, onSelect, onHistory, getUsageColor, getItemHistory, isSelected, onToggleSelect }) => {
    const realUsageCount = getItemHistory(item.id).length;

    let typeLabel = 'Multipla Escolha';
    if (item.type === QuestionType.TRUE_FALSE) typeLabel = 'V ou F';
    if (item.type === QuestionType.ESSAY) typeLabel = 'Discursiva';
    if (item.type === QuestionType.REDACTION) typeLabel = 'Redação';

    return (
        <div className={`flex items-center border-b border-slate-100 hover:bg-slate-50 transition px-6 py-3 text-sm ${isSelected ? 'bg-brand-light/20' : ''}`}>
            <div className="w-10 flex-shrink-0">
                <button
                    onClick={() => onToggleSelect(item.id)}
                    className={`transition-colors ${isSelected ? 'text-brand-primary' : 'text-slate-300 hover:text-slate-400'}`}
                >
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
            </div>
            <div className="flex-1 pr-4 min-w-0">
                <div className="font-medium text-slate-900 truncate cursor-pointer hover:text-brand-primary" onClick={() => onSelect(item)}>
                    {item.statement.replace(/<[^>]*>/g, '')}
                </div>
                {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">{tag}</span>
                        ))}
                    </div>
                )}
            </div>
            <div className="w-32 text-slate-600">{item.subject}</div>
            <div className="w-24">
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded">{typeLabel}</span>
            </div>
            <div className="w-24">
                {item.bnccCode ? (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100" title="Código BNCC">{item.bnccCode}</span>
                ) : <span className="text-xs text-slate-300">-</span>}
            </div>
            <div className="w-24">
                <Badge color={item.difficulty === DifficultyLevel.EASY ? 'green' : item.difficulty === DifficultyLevel.MEDIUM ? 'yellow' : 'red'}>
                    {item.difficulty}
                </Badge>
            </div>
            <div className="w-24 text-slate-500 text-xs uppercase font-semibold">
                {item.origin === ItemOrigin.IA ? <span className="text-purple-600 flex items-center gap-1"><Brain size={12} /> IA</span> : 'Manual'}
            </div>
            <div className="w-24">
                <Badge color={item.lifecycleStatus === 'DRAFT' ? 'yellow' : 'blue'}>
                    {item.lifecycleStatus || 'APPROVED'}
                </Badge>
            </div>
            <div className="w-24 text-center">
                <Badge color={getUsageColor(realUsageCount)}>{realUsageCount}x</Badge>
            </div>
            <div className="w-24 text-right flex justify-end gap-2">
                <button className="text-slate-400 hover:text-brand-primary p-1" onClick={() => onSelect(item)} title="Ver Detalhes"><Eye size={18} /></button>
                <button
                    className="text-slate-400 hover:text-brand-secondary p-1 relative"
                    onClick={() => onHistory(item)}
                    title="Ver Histórico de Uso"
                >
                    <History size={18} />
                    {realUsageCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-brand-secondary rounded-full"></span>}
                </button>
            </div>
        </div>
    );
};

export const ItemsListView = () => {
    const state = useAppStore();
    const { currentUser } = state;
    const navigate = useNavigate();
    const userTenantId = currentUser?.tenantId;

    const getUsageColor = (count: number) => {
        if (count === 0) return 'green';
        if (count === 1) return 'yellow';
        return 'red';
    };

    const [filterText, setFilterText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedExamPreview, setSelectedExamPreview] = useState<Exam | null>(null);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { removeItems, bulkAddTag } = useAppStore();

    const [filterSubject, setFilterSubject] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [filterBncc, setFilterBncc] = useState('');

    const normalizeText = (text: string) =>
        text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // FILTER LOGIC
    const filteredItems = (state.items || []).filter(i => {
        // More lenient tenant check: allow if same tenant OR if current user is super admin
        const matchesTenant = !userTenantId || i.tenantId === userTenantId || currentUser?.role === UserRole.SUPER_ADMIN;
        if (!matchesTenant) return false;

        const searchText = normalizeText(filterText);
        const matchesText = !filterText ||
            normalizeText(i.statement).includes(searchText) ||
            (i.tags && i.tags.some(t => normalizeText(t).includes(searchText)));

        const subjectQuery = normalizeText(filterSubject);
        const matchesSubject = !filterSubject || normalizeText(i.subject).includes(subjectQuery);

        const matchesDifficulty = !filterDifficulty || i.difficulty === filterDifficulty;

        const bnccQuery = normalizeText(filterBncc);
        const matchesBncc = !filterBncc || (i.bnccCode && normalizeText(i.bnccCode).includes(bnccQuery));

        return matchesText && matchesSubject && matchesDifficulty && matchesBncc;
    });

    const getItemHistory = (itemId: string) => {
        return state.exams.filter(e => e.items?.some(examItem => examItem.itemId === itemId));
    };

    const itemHistory = selectedItem ? getItemHistory(selectedItem.id) : [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center flex-shrink-0">
                <div className="flex flex-1 max-w-md gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por enunciado ou tag..."
                            className="w-full pl-10 pr-4 py-2 border border-brand-secondary/30 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none text-sm shadow-sm"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setShowFilters(false)}
                        />
                    </div>
                    <button className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-sky-700 transition flex items-center gap-2">
                        <Search size={16} /> Buscar
                    </button>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition ${showFilters ? 'bg-brand-light border-brand-secondary text-brand-primary' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Filter size={16} /> Filtros {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button onClick={() => navigate('/items/new')} className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <Plus size={18} /> Nova Questão
                    </button>
                </div>
            </div>

            {/* BULK ACTION TOOLBAR (FLOATING) */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-8 z-50 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300 border border-slate-700">
                    <div className="flex items-center gap-3 pr-8 border-r border-slate-700">
                        <button
                            onClick={() => setSelectedIds([])}
                            className="p-1 hover:bg-slate-800 rounded transition"
                        >
                            <X size={20} />
                        </button>
                        <span className="font-bold whitespace-nowrap">
                            {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                const tag = prompt('Digite a tag para adicionar aos itens:');
                                if (tag) bulkAddTag(selectedIds, tag);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition text-sm font-medium"
                        >
                            <Tag size={16} className="text-emerald-400" /> Etiquetas
                        </button>
                        <button
                            onClick={() => {
                                const data = JSON.stringify(filteredItems.filter(i => selectedIds.includes(i.id)), null, 2);
                                const blob = new Blob([data], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `itens_exportados_${new Date().toISOString().split('T')[0]}.json`;
                                a.click();
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition text-sm font-medium"
                        >
                            <Download size={16} className="text-blue-400" /> Exportar
                        </button>
                        <button
                            onClick={() => {
                                if (confirm(`Deseja realmente excluir ${selectedIds.length} questões?`)) {
                                    removeItems(selectedIds);
                                    setSelectedIds([]);
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-900/40 text-rose-200 hover:text-white rounded-lg transition text-sm font-medium"
                        >
                            <Trash2 size={16} className="text-rose-500" /> Excluir
                        </button>
                    </div>
                </div>
            )}

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="bg-brand-dark/5 p-4 rounded-xl border border-brand-secondary/20 grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 flex-shrink-0">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Disciplina</label>
                        <input
                            className="w-full border rounded-lg p-2 text-sm"
                            placeholder="Ex: Física"
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dificuldade</label>
                        <select
                            className="w-full border rounded-lg p-2 text-sm"
                            value={filterDifficulty}
                            onChange={e => setFilterDifficulty(e.target.value)}
                        >
                            <option value="">Todas</option>
                            <option value={DifficultyLevel.EASY}>Fácil</option>
                            <option value={DifficultyLevel.MEDIUM}>Médio</option>
                            <option value={DifficultyLevel.HARD}>Difícil</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">BNCC</label>
                        <input
                            className="w-full border rounded-lg p-2 text-sm"
                            placeholder="Ex: EF09"
                            value={filterBncc}
                            onChange={e => setFilterBncc(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end gap-3">
                        <button
                            onClick={() => setShowFilters(false)}
                            className="bg-brand-primary text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-sky-700 transition flex items-center justify-center gap-2 flex-1"
                        >
                            <Filter size={16} /> Filtrar Resultados
                        </button>
                        <button
                            onClick={() => { setFilterSubject(''); setFilterDifficulty(''); setFilterText(''); setFilterBncc(''); }}
                            className="text-xs text-slate-500 hover:text-rose-600 font-medium mb-2 whitespace-nowrap"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                {/* Table Header */}
                <div className="flex items-center bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 px-6 py-4 text-sm flex-shrink-0">
                    <div className="w-10">
                        <button
                            onClick={() => {
                                if (selectedIds.length === filteredItems.length) setSelectedIds([]);
                                else setSelectedIds(filteredItems.map(i => i.id));
                            }}
                            className={`transition-colors ${(selectedIds.length > 0 && selectedIds.length === filteredItems.length) ? 'text-brand-primary' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                            {(selectedIds.length > 0 && selectedIds.length === filteredItems.length) ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                    </div>
                    <div className="flex-1 pr-4">Enunciado</div>
                    <div className="w-32">Disciplina</div>
                    <div className="w-24">Tipo</div>
                    <div className="w-24">BNCC</div>
                    <div className="w-24">Dificuldade</div>
                    <div className="w-24">Origem</div>
                    <div className="w-24">Status</div>
                    <div className="w-24 text-center">Uso</div>
                    <div className="w-24 text-right">Ações</div>
                </div>

                {/* Standard List (Replaced Virtualized List) */}
                <div className="flex-1 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredItems.map(item => (
                                <ItemRow
                                    key={item.id}
                                    item={item}
                                    onSelect={setSelectedItem}
                                    onHistory={(i) => { setSelectedItem(i); setShowHistoryModal(true); }}
                                    getUsageColor={getUsageColor}
                                    getItemHistory={getItemHistory}
                                    isSelected={selectedIds.includes(item.id)}
                                    onToggleSelect={(id) => {
                                        setSelectedIds(prev =>
                                            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                                        );
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500">Nenhum item encontrado no banco.</div>
                    )}
                </div>
            </div>

            {/* DETAIL MODAL */}
            {selectedItem && !showHistoryModal && !selectedExamPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-brand-primary">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-bold text-slate-800">Detalhes da Questão</h3>
                            <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Enunciado</label>
                                <div className="p-4 bg-slate-50 rounded-lg text-slate-800 text-base leading-relaxed border border-slate-100">
                                    {selectedItem.statement}
                                </div>
                                {selectedItem.imageUrl && (
                                    <div className="mt-2 flex justify-center p-2 border rounded bg-brand-dark/5">
                                        <img src={selectedItem.imageUrl} alt="Questão" className="max-h-64 rounded shadow-sm" />
                                    </div>
                                )}
                            </div>

                            {(selectedItem.type === QuestionType.MULTIPLE_CHOICE || selectedItem.type === QuestionType.TRUE_FALSE) && (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Alternativas</label>
                                    <div className="space-y-2">
                                        {selectedItem.alternatives.map((alt, idx) => (
                                            <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${alt.isCorrect ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold ${alt.isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 text-slate-500'}`}>
                                                    {alt.isCorrect ? <Check size={14} /> : String.fromCharCode(65 + idx)}
                                                </div>
                                                <span className={`text-sm ${alt.isCorrect ? 'text-emerald-900 font-medium' : 'text-slate-600'}`}>{alt.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedItem.type === QuestionType.ESSAY || selectedItem.type === QuestionType.REDACTION) && (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Configuração de Resposta</label>
                                    <div className="flex gap-4">
                                        {selectedItem.minLines && <div className="text-sm bg-blue-50 text-blue-800 px-3 py-1 rounded border border-blue-200">Mínimo: {selectedItem.minLines} linhas</div>}
                                        {selectedItem.maxLines && <div className="text-sm bg-blue-50 text-blue-800 px-3 py-1 rounded border border-blue-200">Máximo: {selectedItem.maxLines} linhas</div>}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Justificativa / Critérios</label>
                                    <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded border border-slate-100">{selectedItem.correctAnswerJustification}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Habilidade BNCC</label>
                                    <p className="text-sm text-indigo-700 font-bold bg-indigo-50 p-3 rounded border border-indigo-100 flex items-center gap-2">
                                        <BookOpen size={16} /> {selectedItem.bnccCode || 'Não informado'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 text-sm text-slate-500 border-t pt-4">
                                <span>Tags: {selectedItem.tags.join(', ')}</span>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => navigate(`/items/${selectedItem.id}/edit-v2`)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">
                                Editar V2 (Versionamento)
                            </button>
                            <button onClick={() => setSelectedItem(null)} className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {selectedItem && showHistoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-brand-primary">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><History size={18} /> Histórico de Uso</h3>
                            <button onClick={() => { setShowHistoryModal(false); setSelectedItem(null); }}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-slate-500 mb-4">Provas onde a questão <strong>{selectedItem.id.slice(0, 6)}</strong> foi utilizada:</p>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {itemHistory.map(exam => (
                                    <div key={exam.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center hover:bg-slate-100 cursor-pointer" onClick={() => setSelectedExamPreview(exam)}>
                                        <div>
                                            <div className="font-bold text-sm text-slate-800">{exam.title}</div>
                                            <div className="text-xs text-slate-500">{new Date(exam.createdAt).toLocaleDateString()} • {exam.status}</div>
                                        </div>
                                        <Eye size={16} className="text-slate-400" />
                                    </div>
                                ))}
                                {itemHistory.length === 0 && <p className="text-center text-slate-400 italic">Esta questão ainda não foi utilizada.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
