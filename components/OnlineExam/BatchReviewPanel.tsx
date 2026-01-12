import React, { useState } from 'react';
import { Check, X, Edit3, Trash2, ArrowRight, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Item, ItemLifecycleStatus } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../ui/Badge';
import { ItemEditModal } from './ItemEditModal';

interface BatchReviewPanelProps {
    batchId: string;
    items: Item[];
    onFinish: () => void;
    finishLabel?: string;
}

export const BatchReviewPanel: React.FC<BatchReviewPanelProps> = ({ batchId, items: initialItems, onFinish, finishLabel = "Concluir" }) => {
    const { approveOneItem, discardOneItem, removeItems, updateItem, forceFetchBatchItems } = useAppStore();
    const [localItems, setLocalItems] = useState<Item[]>(initialItems);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [rescuing, setRescuing] = useState(false);

    // Sincroniza estado local quando as questões são carregadas/atualizadas na store
    React.useEffect(() => {
        setLocalItems(initialItems);
    }, [initialItems]);

    const approveItem = async (id: string) => {
        try {
            if (approveOneItem) await approveOneItem(id);
            setLocalItems(prev => prev.map(i => i.id === id ? { ...i, lifecycleStatus: ItemLifecycleStatus.APPROVED } : i));
        } catch (e) {
            alert("Erro ao aprovar item.");
        }
    };

    const discardItem = async (id: string) => {
        try {
            if (discardOneItem) await discardOneItem(id);
            setLocalItems(prev => prev.map(i => i.id === id ? { ...i, lifecycleStatus: ItemLifecycleStatus.REJECTED } : i));
        } catch (e) {
            alert("Erro ao descartar item.");
        }
    };

    const approveAll = async () => {
        if (!batchId) return;
        try {
            await useAppStore.getState().approveAllItemsInBatch(batchId);
            setLocalItems(prev => prev.map(i => ({ ...i, lifecycleStatus: ItemLifecycleStatus.APPROVED })));
        } catch (e) {
            alert("Erro ao aprovar todas as questões.");
        }
    };

    const discardAll = async () => {
        const ids = localItems.map(i => i.id);
        if (confirm(`Deseja descartar todas as ${ids.length} questões deste lote?`)) {
            try {
                await removeItems(ids);
                setLocalItems([]);
            } catch (e) {
                alert("Erro ao descartar lote.");
            }
        }
    };

    const handleSaveEdit = async (updated: Item) => {
        if (updateItem) {
            await updateItem(updated);
            setLocalItems(prev => prev.map(i => i.id === updated.id ? updated : i));
        }
        setEditingItem(null);
    };

    const handleRescue = async () => {
        if (!batchId || !forceFetchBatchItems) return;
        setRescuing(true);
        try {
            await forceFetchBatchItems(batchId);
            // O useEffect que sincroniza initialItems cuidará do resto
        } catch (e) {
            alert("Erro ao tentar resgatar itens do banco.");
        } finally {
            setRescuing(false);
        }
    };

    const pendingCount = localItems.filter(i => i.lifecycleStatus === ItemLifecycleStatus.DRAFT).length;
    const approvedCount = localItems.filter(i => i.lifecycleStatus === ItemLifecycleStatus.APPROVED).length;

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-500">
            {/* Header Lote */}
            <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-light text-brand-primary rounded-lg">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Revisão de Lote (IA)</h3>
                        <p className="text-xs text-slate-500">Analise e aprove as questões antes de adicioná-las ao banco.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-4 text-xs font-bold mr-4">
                        <span className="text-amber-600 flex items-center gap-1">
                            <AlertCircle size={14} /> {pendingCount} Pendentes
                        </span>
                        <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={14} /> {approvedCount} Aprovadas
                        </span>
                    </div>
                    <button
                        onClick={onFinish}
                        className="bg-brand-primary text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-brand-dark transition"
                    >
                        {finishLabel} <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Listagem */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {localItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <CheckCircle2 size={48} className="mb-4 text-emerald-500 opacity-20" />
                        <p className="font-medium text-slate-600">Lote sem questões pendentes.</p>
                        <div className="flex flex-col items-center gap-2 mt-4">
                            <button onClick={onFinish} className="text-brand-primary text-sm font-bold bg-brand-light px-6 py-2 rounded-xl hover:bg-brand-primary hover:text-white transition">
                                Continuar
                            </button>
                            <button
                                onClick={handleRescue}
                                disabled={rescuing}
                                className="text-amber-600 text-[10px] font-bold mt-2 flex items-center gap-2 hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition disabled:opacity-50"
                            >
                                {rescuing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                TENTAR RESGATAR ITENS DESTE LOTE (MODO DE SEGURANÇA)
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {localItems.map((item) => (
                            <div
                                key={item.id}
                                className={`p-6 rounded-2xl border-2 transition-all bg-white relative group overflow-hidden ${item.lifecycleStatus === ItemLifecycleStatus.APPROVED
                                    ? 'border-emerald-500/30'
                                    : 'border-slate-200 hover:border-brand-primary/30'
                                    }`}
                            >
                                {/* Status Ribbon */}
                                {item.lifecycleStatus === ItemLifecycleStatus.APPROVED && (
                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                        <Check size={12} /> APROVADA
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-2 text-[10px]">
                                        <Badge color="indigo">IA</Badge>
                                        <Badge color={item.difficulty === 'FACIL' ? 'green' : item.difficulty === 'MEDIO' ? 'yellow' : 'red'}>
                                            {item.difficulty}
                                        </Badge>
                                        <Badge color="gray">{item.subject}</Badge>
                                        {item.bnccCode && <Badge color="blue">{item.bnccCode}</Badge>}
                                    </div>

                                    {item.lifecycleStatus === ItemLifecycleStatus.DRAFT && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hover:text-slate-600 transition"
                                                title="Editar"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => discardItem(item.id)}
                                                className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg hover:text-rose-600 transition"
                                                title="Descartar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => approveItem(item.id)}
                                                className="bg-brand-light text-brand-primary px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-brand-primary hover:text-white transition shadow-sm ml-2"
                                            >
                                                <Check size={18} /> Aprovar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p className="text-lg text-slate-800 font-medium leading-relaxed mb-6 italic border-l-4 border-slate-100 pl-4">
                                    <div dangerouslySetInnerHTML={{ __html: item.statement }} />
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                    {item.alternatives.map((alt, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl border text-sm flex gap-3 ${alt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${alt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <div dangerouslySetInnerHTML={{ __html: alt.text }} />
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <AlertCircle size={12} /> Justificativa Pedagógica
                                    </h4>
                                    <div className="text-sm text-slate-600 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: item.correctAnswerJustification }} />
                                </div>
                            </div>
                        ))}

                        {/* Batch Action Buttons at the bottom */}
                        <div className="pt-8 pb-12 flex flex-col items-center gap-6">
                            <div className="h-px w-full bg-slate-200" />
                            <div className="flex gap-4">
                                <button
                                    onClick={discardAll}
                                    className="px-8 py-4 bg-white border-2 border-rose-200 text-rose-600 rounded-2xl font-bold hover:bg-rose-50 transition flex items-center gap-2 shadow-sm"
                                >
                                    <Trash2 size={24} /> Descartar Todo o Lote
                                </button>
                                {pendingCount > 0 && (
                                    <button
                                        onClick={approveAll}
                                        className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg hover:scale-[1.02]"
                                    >
                                        <CheckCircle2 size={24} /> Aprovar Todas as Questões ({pendingCount})
                                    </button>
                                )}
                            </div>
                            <p className="text-slate-400 text-xs text-center max-w-sm">
                                Ao aprovar, as questões ficarão disponíveis para uso em provas e no banco geral de itens.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {editingItem && (
                <ItemEditModal
                    item={editingItem}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingItem(null)}
                />
            )}
        </div>
    );
};
