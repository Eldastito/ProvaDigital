import React, { useState } from 'react';
import { Check, X, Edit3, Trash2, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Item, ItemLifecycleStatus } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../ui/Badge';

interface BatchReviewPanelProps {
    batchId: string;
    items: Item[];
    onFinish: () => void;
}

export const BatchReviewPanel: React.FC<BatchReviewPanelProps> = ({ batchId, items: initialItems, onFinish }) => {
    const { updateItemStatus, removeItems } = useAppStore();
    const [localItems, setLocalItems] = useState<Item[]>(initialItems);

    const approveItem = async (id: string) => {
        await updateItemStatus(id, ItemLifecycleStatus.APPROVED);
        setLocalItems(prev => prev.map(i => i.id === id ? { ...i, lifecycleStatus: ItemLifecycleStatus.APPROVED } : i));
    };

    const discardItem = async (id: string) => {
        await removeItems([id]);
        setLocalItems(prev => prev.filter(i => i.id !== id));
    };

    const approveAll = async () => {
        const pendingIds = localItems
            .filter(i => i.lifecycleStatus === ItemLifecycleStatus.DRAFT)
            .map(i => i.id);

        for (const id of pendingIds) {
            await approveItem(id);
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
                    {pendingCount > 0 && (
                        <button
                            onClick={approveAll}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition"
                        >
                            <Check size={18} /> Aprovar Todas
                        </button>
                    )}
                    <button
                        onClick={onFinish}
                        className="bg-brand-primary text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-brand-dark transition"
                    >
                        Concluir <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Listagem */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {localItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <CheckCircle2 size={48} className="mb-4 text-emerald-500 opacity-20" />
                        <p className="font-medium text-slate-600">Lote sem questões pendentes.</p>
                        <button onClick={onFinish} className="text-brand-primary text-sm font-bold mt-2">Voltar para a prova</button>
                    </div>
                ) : (
                    localItems.map((item) => (
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
                                <div className="flex gap-2">
                                    <Badge color="indigo">IA</Badge>
                                    <Badge color={item.difficulty === 'FACIL' ? 'green' : item.difficulty === 'MEDIO' ? 'yellow' : 'rose'}>
                                        {item.difficulty}
                                    </Badge>
                                    <Badge color="slate">{item.subject}</Badge>
                                    {item.bnccCode && <Badge color="blue">{item.bnccCode}</Badge>}
                                </div>

                                {item.lifecycleStatus === ItemLifecycleStatus.DRAFT && (
                                    <div className="flex gap-2">
                                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg hover:text-slate-600 transition" title="Editar">
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
                                {item.statement}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                {item.alternatives.map((alt, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border text-sm flex gap-3 ${alt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${alt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        {alt.text}
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> Justificativa Pedagógica
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    {item.correctAnswerJustification}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
