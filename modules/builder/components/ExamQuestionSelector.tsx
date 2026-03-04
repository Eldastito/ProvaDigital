import React, { useState } from 'react';
import { Brain, Search, FileUp, Plus, Tablet, ChevronLeft, ArrowRight, ShieldCheck, ChevronRight, Loader2, Sparkles, Check, Trash2 } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import { Item, ItemLifecycleStatus, ItemOrigin, DifficultyLevel, ExamModel, LiteracyDomain } from '../../../types';
import { Badge } from '../../../components/ui/Badge';
import { translateDifficultyLevel, translateLiteracyDomain } from '../../../utils/translations';
import { normalizeString } from '../../../utils/helpers';

interface ExamQuestionSelectorProps {
    builderMode: 'MANUAL' | 'SMART';
    items: Item[];
    selectedItems: Item[];
    toggleItem: (item: Item) => void;
    config: { subject: string };
    coverConfig: { sections: any[] };
    selectionDiagnosis: any;
    smartCriteria: any;
    isFillingGaps: boolean;
    onGapGeneration: () => void;
    onImportClick: () => void;
    onRecommendationsClick: () => void;
    showRecommendations: boolean;
    onSave: (publish: boolean) => void;
    onReviewIA: () => void;
    onStepChange: (step: number) => void;
    loadGenerationBatches?: () => void;
    setShowBatchHistory?: (show: boolean) => void;
    currentBatchId?: string | null;
    examModel?: ExamModel;
}

export const ExamQuestionSelector = ({
    builderMode, items, selectedItems, toggleItem, config, coverConfig,
    selectionDiagnosis, smartCriteria, isFillingGaps, onGapGeneration,
    onImportClick, onRecommendationsClick, showRecommendations,
    onSave, onReviewIA, onStepChange, loadGenerationBatches, setShowBatchHistory, currentBatchId,
    examModel
}: ExamQuestionSelectorProps) => {
    const { can } = usePermissions();
    const canCreateItems = can('CREATE', 'ITEM_BANK');


    const [filter, setFilter] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'APPROVED' | 'DRAFT' | 'ALL'>('ALL');
    const [literacyFilter, setLiteracyFilter] = useState<LiteracyDomain | 'ALL'>('ALL');
    const [previewIndex, setPreviewIndex] = useState(0);

    const filteredAvailableItems = items.filter(i => {
        const iStatement = i.statement || '';
        const iSubject = i.subject || '';
        const filterStr = filter.toLowerCase();

        const matchesSearch = iStatement.toLowerCase().includes(filterStr) ||
            iSubject.toLowerCase().includes(filterStr);
        const matchesDiff = difficultyFilter === 'ALL' || i.difficulty === difficultyFilter;
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'APPROVED' ? i.lifecycleStatus === ItemLifecycleStatus.APPROVED : i.lifecycleStatus === ItemLifecycleStatus.DRAFT);
        const matchesLiteracy = literacyFilter === 'ALL' || i.literacyDomain === literacyFilter;
        const notSelected = !selectedItems.find(s => s.id === i.id);

        const distributionSubjects = coverConfig.sections
            .filter(s => s.type === 'distribution' && s.distribution)
            .flatMap(s => s.distribution!.groups.flatMap((g: any) => g.items.map((i: any) => i.subject)))
            .filter(s => s && s.trim().length > 0)
            .map(s => normalizeString(s));

        const configSubject = normalizeString(config.subject || '');
        const allowedSubjects = new Set([configSubject, ...distributionSubjects].filter(Boolean));
        const itemSubjectNorm = normalizeString(iSubject);

        const matchesConfigSubject = allowedSubjects.size === 0 ||
            Array.from(allowedSubjects).some(allowed => itemSubjectNorm.includes(allowed) || allowed.includes(itemSubjectNorm));

        return matchesSearch && matchesDiff && matchesStatus && matchesLiteracy && notSelected && matchesConfigSubject;
    });

    const currentPreviewItem = selectedItems[previewIndex];

    const displayItems = builderMode === 'SMART'
        ? items.filter(i => selectedItems.find(s => s.id === i.id) || (i.generationBatchId === currentBatchId && i.lifecycleStatus === ItemLifecycleStatus.APPROVED))
        : filteredAvailableItems;

    return (
        <div className="flex gap-8 h-[75vh]">
            {/* Left: Item Bank */}
            <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {builderMode === 'SMART' && selectionDiagnosis && selectionDiagnosis.missingCount > 0 && (
                    <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                <Brain size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-rose-900">Lacuna Detectada no Banco</h4>
                                <p className="text-xs text-rose-700">Faltam {selectionDiagnosis.missingCount} questões para atingir a meta selecionada.</p>
                            </div>
                        </div>
                        {canCreateItems && (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        if (loadGenerationBatches) loadGenerationBatches();
                                        if (setShowBatchHistory) setShowBatchHistory(true);
                                    }}
                                    className="text-white/80 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-white/20 hover:bg-white/10 transition"
                                >Recuperar Lotes IA</button>
                                <button
                                    onClick={onGapGeneration}
                                    disabled={isFillingGaps}
                                    className="bg-rose-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-700 transition flex items-center gap-2 shadow-sm"
                                >
                                    {isFillingGaps ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    Gerar Questões Inéditas via IA
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {builderMode === 'SMART' && selectionDiagnosis && (
                    <div className="p-4 bg-slate-50 border-b flex justify-around text-center">
                        <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase">Fácil</div>
                            <div className="font-bold text-emerald-600">{selectionDiagnosis.distributionActual[DifficultyLevel.EASY]}</div>
                        </div>
                        <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase">Médio</div>
                            <div className="font-bold text-amber-600">{selectionDiagnosis.distributionActual[DifficultyLevel.MEDIUM]}</div>
                        </div>
                        <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase">Difícil</div>
                            <div className="font-bold text-rose-600">{selectionDiagnosis.distributionActual[DifficultyLevel.HARD]}</div>
                        </div>
                        <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase">Total</div>
                            <div className="font-bold text-slate-900">{selectedItems.length} / {smartCriteria.targetCount}</div>
                        </div>
                    </div>
                )}

                <div className="p-4 border-b bg-slate-50 flex flex-col gap-3">
                    <h3 className="font-bold text-slate-800">
                        {builderMode === 'SMART' ? 'Questões Selecionadas Automaticamente' : 'Banco de Itens Disponível'}
                    </h3>

                    {/* OECD Literacy Domains - Only visible if OCDE model */}
                    {examModel === ExamModel.OCDE_PISA && (
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                            <span className="text-[9px] font-black text-indigo-400 uppercase self-center px-2">Domínios OCDE:</span>
                            <button
                                onClick={() => setLiteracyFilter('ALL')}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${literacyFilter === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-400 border-indigo-200'}`}
                            >TODOS</button>
                            {Object.values(LiteracyDomain).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLiteracyFilter(l)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${literacyFilter === l ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-400 border-indigo-200'}`}
                                >{translateLiteracyDomain(l)}</button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setDifficultyFilter('ALL')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${difficultyFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                        >DIFICULDADE: TODOS</button>
                        {Object.values(DifficultyLevel).map(d => (
                            <button
                                key={d}
                                onClick={() => setDifficultyFilter(d)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${difficultyFilter === d ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-500 border-slate-200'}`}
                            >{translateDifficultyLevel(d)}</button>
                        ))}
                        <div className="w-px h-4 bg-slate-200 mx-1 self-center" />
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${statusFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                        >STATUS: TODOS</button>
                        <button
                            onClick={() => setStatusFilter('APPROVED')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
                        >APROVADOS</button>
                        <button
                            onClick={() => setStatusFilter('DRAFT')}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${statusFilter === 'DRAFT' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200'}`}
                        >DRAFTS IA</button>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                className="w-full border rounded-lg pl-9 p-2 text-sm shadow-sm"
                                placeholder="Filtrar por enunciado ou disciplina..."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </div>
                        {canCreateItems && (
                            <>
                                <button
                                    onClick={onImportClick}
                                    className="px-3 py-2 rounded-lg text-sm font-bold bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition flex items-center gap-2"
                                    title="Importar CSV"
                                >
                                    <FileUp size={16} /> Importar
                                </button>
                                <button
                                    onClick={onRecommendationsClick}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition border ${showRecommendations ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-600'}`}
                                >
                                    <Plus size={16} className={showRecommendations ? 'rotate-45 transition' : ''} />
                                    {showRecommendations ? 'Fechar IA' : 'Sugestões IA'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {displayItems.map(item => (
                        <div key={item.id} className={`p-3 border rounded-lg cursor-pointer group transition-all hover:shadow-sm relative ${selectedItems.find(s => s.id === item.id) ? 'border-brand-primary bg-brand-light/20' : 'border-slate-200 bg-white hover:border-brand-primary text-slate-400'}`} onClick={() => toggleItem(item)}>
                            {selectedItems.find(s => s.id === item.id) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleItem(item); }}
                                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold uppercase">{item.subject}</span>
                                <div className="flex gap-2">
                                    {item.origin === ItemOrigin.IA && <Badge color="indigo">IA</Badge>}
                                    <Badge color={item.difficulty === DifficultyLevel.EASY ? 'green' : (item.difficulty === DifficultyLevel.HARD ? 'red' : 'yellow')}>{translateDifficultyLevel(item.difficulty)}</Badge>
                                </div>
                            </div>
                            <p className={`text-sm line-clamp-2 mb-2 ${selectedItems.find(s => s.id === item.id) ? 'text-slate-800' : 'text-slate-400'}`}>{item.statement}</p>
                            <div className="flex justify-between items-center text-[10px]">
                                <span>BNCC: {item.bnccCode || 'N/A'}</span>
                                <span className="font-bold">{item.lifecycleStatus === ItemLifecycleStatus.DRAFT ? 'AGUARDANDO REVISÃO' : 'DISPONÍVEL'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Tablet Simulator */}
            <div className="w-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Tablet size={20} /> Simulação do Aluno</h3>
                    <span className="text-xs font-bold bg-brand-primary text-white px-3 py-1 rounded-full">{selectedItems.length} questões</span>
                </div>

                <div className="flex-1 bg-slate-900 rounded-[2rem] p-3 shadow-2xl relative border-4 border-slate-800 flex flex-col min-h-[500px]">
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rounded-full"></div>
                    <div className="flex-1 bg-slate-100 rounded-[1.5rem] overflow-hidden flex flex-col relative">
                        {selectedItems.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                <Plus size={48} className="mb-4 opacity-50" />
                                <p>Adicione questões ao lado.</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold text-xs">{previewIndex + 1}</div>
                                        <span className="text-xs font-bold text-slate-500 uppercase">Questão {previewIndex + 1} de {selectedItems.length}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const itemToRemove = currentPreviewItem;
                                            if (itemToRemove) {
                                                toggleItem(itemToRemove);
                                                if (previewIndex >= selectedItems.length - 1 && previewIndex > 0) {
                                                    setPreviewIndex(previewIndex - 1);
                                                }
                                            }
                                        }}
                                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                        title="Remover desta prova"
                                    >
                                        <Trash2 size={16} />
                                        REMOVER
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 bg-[#f8fafc]">
                                    {currentPreviewItem && (
                                        <div className="animate-in slide-in-from-right-4 duration-300">
                                            <div className="text-sm text-slate-800 font-medium leading-relaxed mb-4">{currentPreviewItem.statement}</div>
                                            <div className="space-y-3">
                                                {currentPreviewItem.alternatives.map((alt, idx) => (
                                                    <button key={idx} className="w-full text-left p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-primary hover:bg-sky-50 transition flex items-start gap-3 group">
                                                        <div className="w-6 h-6 rounded-full border border-slate-300 text-slate-500 text-xs flex items-center justify-center">{String.fromCharCode(65 + idx)}</div>
                                                        <span className="text-sm text-slate-600 pt-0.5">{alt.text}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center z-10">
                                    <button onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"><ChevronLeft size={24} /></button>
                                    <button onClick={() => setPreviewIndex(Math.min(selectedItems.length - 1, previewIndex + 1))} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition"><ArrowRight size={24} /></button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                    <button onClick={() => onSave(false)} className="py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 transition shadow-sm">Rascunho</button>
                    <button onClick={onReviewIA} className="py-3 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg font-bold text-sm hover:bg-purple-100 transition shadow-sm flex items-center justify-center gap-2">
                        <ShieldCheck size={18} /> Revisar IA
                    </button>
                    <button
                        onClick={() => onStepChange(3)}
                        disabled={selectedItems.length === 0}
                        className="btn-gradient py-3 rounded-lg font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                    >
                        Configurar Capa <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
