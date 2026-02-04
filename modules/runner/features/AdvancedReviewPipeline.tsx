import React, { useState, useEffect } from 'react';
import { ShieldCheck, Brain, Accessibility, Type, GitMerge, BarChart3, Save, CheckCircle2, Loader2, AlertTriangle, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { AppState, Item, ItemLifecycleStatus, DifficultyLevel } from '../../../types';
import { reviewExamAdvanced } from '../../../services/geminiService';
import { useSafeAppStore } from '../../../store/useAppStore';
import { Badge } from '../../../components/ui/Badge';
import { supabase } from '../../../services/supabaseClient';

interface ReviewStage {
    id: string;
    label: string;
    icon: React.ReactNode;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR';
    result?: string;
}

interface AdvancedReviewPipelineProps {
    items?: Item[];
    examId?: string;
    onComplete?: (polishedItems: Item[], reviewSummary: any) => void;
    onCancel?: () => void;
}

export const AdvancedReviewPipeline: React.FC<AdvancedReviewPipelineProps> = ({ items = [], examId, onComplete, onCancel }) => {

    const [stages, setStages] = useState<ReviewStage[]>([
        { id: 'structural', label: 'Validação Estrutural', icon: <ShieldCheck size={20} />, status: 'PENDING' },
        { id: 'pedagogical', label: 'Auditoria BNCC/SAEB', icon: <Brain size={20} />, status: 'PENDING' },
        { id: 'accessibility', label: 'Acessibilidade & Neuro', icon: <Accessibility size={20} />, status: 'PENDING' },
        { id: 'textual', label: 'Polimento de Enunciados', icon: <Type size={20} />, status: 'PENDING' },
        { id: 'anticheat', label: 'Proteção Anti-Cola', icon: <ShieldCheck size={20} />, status: 'PENDING' },
        { id: 'tri', label: 'Calibração TRI', icon: <BarChart3 size={20} />, status: 'PENDING' },
        { id: 'snapshot', label: 'Snapshot de Versão', icon: <Save size={20} />, status: 'PENDING' },
        { id: 'approval', label: 'Aprovação Final', icon: <CheckCircle2 size={20} />, status: 'PENDING' },
    ]);

    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [reviewResult, setReviewResult] = useState<any>(null);
    const [isFinished, setIsFinished] = useState(false);

    const [localItems, setLocalItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorStage, setErrorStage] = useState<{ id: string; message: string } | null>(null);

    // Correções automáticas
    const [correctionsAvailable, setCorrectionsAvailable] = useState(false);
    const [correctionsPreview, setCorrectionsPreview] = useState<{
        polished: number;
        variants: number;
        removed: number;
    }>({ polished: 0, variants: 0, removed: 0 });

    // Fetch items if examId is provided and no items passed
    useEffect(() => {
        const fetchItems = async () => {
            if (examId && items.length === 0) {
                setIsLoading(true);
                try {
                    // 1. Get Exam Config
                    const { data: examData } = await supabase.from('exams').select('items_config').eq('id', examId).single();
                    if (!examData || !examData.items_config) {
                        console.error("Exam items not found");
                        return;
                    }

                    // 2. Get Items Details
                    const itemIds = examData.items_config.map((ic: any) => ic.itemId);
                    if (itemIds.length > 0) {
                        const { data: itemsData } = await supabase.from('items').select('*').in('id', itemIds);

                        if (itemsData) {
                            const mappedItems: Item[] = itemsData.map((i: any) => ({
                                id: i.id,
                                tenantId: i.tenant_id,
                                ownerId: i.owner_id || '',
                                subject: i.subject,
                                knowledgeArea: i.knowledge_area || i.subject,
                                statement: i.statement,
                                type: i.type,
                                difficulty: i.difficulty,
                                alternatives: i.alternatives,
                                correctAnswerJustification: i.correct_justification,
                                bnccCode: i.bncc_code || '',
                                origin: i.origin || 'MANUAL',
                                score: i.score || 1.0,
                                tags: i.tags || [],
                                generationBatchId: i.generation_batch_id,
                                lifecycleStatus: i.lifecycle_status,
                                isAccessible: i.is_accessible,
                                accessibilityInstructions: i.accessibility_instructions,
                                multimedia: i.multimedia || [],
                                usageCount: 0,
                                createdAt: i.created_at
                            }));
                            setLocalItems(mappedItems);
                        }
                    }
                } catch (e) {
                    console.error("Error loading exam items for audit", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchItems();
    }, [examId, items.length]);

    const effectiveItems = items.length > 0 ? items : localItems;

    const startReview = async () => {
        if (effectiveItems.length === 0 && !isLoading) return; // Wait for items

        // Marcamos as primeiras como em execução
        updateStageStatus('structural', 'RUNNING');

        try {
            const result = await reviewExamAdvanced(effectiveItems);
            setReviewResult(result);
            setErrorStage(null);

            // Calcular correções disponíveis
            if (result.polishedItems || result.variantsSuggested || result.itemsToRemove) {
                const polishedCount = result.polishedItems?.filter((item: any) => {
                    const original = effectiveItems.find(i => i.id === item.id);
                    return original && (
                        item.statement !== original.statement ||
                        JSON.stringify(item.alternatives) !== JSON.stringify(original.alternatives)
                    );
                }).length || 0;

                setCorrectionsPreview({
                    polished: polishedCount,
                    variants: result.variantsSuggested?.length || 0,
                    removed: result.itemsToRemove?.length || 0
                });

                setCorrectionsAvailable(polishedCount > 0 || result.variantsSuggested?.length > 0 || result.itemsToRemove?.length > 0);
            }

            // Mapping AI Result to Stages
            // We still animate sequentially for UX, but the RESULT IS REAL.

            // 1. Structural
            setCurrentStageIndex(0);
            updateStageStatus('structural', 'RUNNING');
            await new Promise(r => setTimeout(r, 500));
            const structStatus = result.stages?.structural?.status === 'OK' ? 'COMPLETED' : 'ERROR';
            updateStageStatus('structural', structStatus);

            // 2. Pedagogical
            setCurrentStageIndex(1);
            updateStageStatus('pedagogical', 'RUNNING');
            await new Promise(r => setTimeout(r, 500));
            const pedStatus = result.stages?.pedagogical?.status === 'OK' ? 'COMPLETED' : 'ERROR';
            updateStageStatus('pedagogical', pedStatus);

            // 3. Accessibility
            setCurrentStageIndex(2);
            updateStageStatus('accessibility', 'RUNNING');
            await new Promise(r => setTimeout(r, 500));
            const accessStatus = (result.stages?.accessibility?.status === 'OK' || result.stages?.accessibility?.status === 'SUCCESS') ? 'COMPLETED' : 'ERROR';
            updateStageStatus('accessibility', accessStatus);

            // 4. Textual (Polishing)
            setCurrentStageIndex(3);
            updateStageStatus('textual', 'RUNNING');
            await new Promise(r => setTimeout(r, 500));
            const textualStatus = result.stages?.textual?.status === 'OK' ? 'COMPLETED' : 'ERROR';
            updateStageStatus('textual', textualStatus);

            // 5. Anti-Cheat
            setCurrentStageIndex(4);
            updateStageStatus('anticheat', 'RUNNING');
            await new Promise(r => setTimeout(r, 500));
            const cheatStatus = result.stages?.anticheat?.status === 'OK' ? 'COMPLETED' : 'ERROR';
            updateStageStatus('anticheat', cheatStatus);

            // 6. TRI (Simulation)
            setCurrentStageIndex(5);
            updateStageStatus('tri', 'RUNNING');
            await new Promise(r => setTimeout(r, 500));
            const triStatus = result.stages?.tri?.status === 'OK' ? 'COMPLETED' : 'ERROR';
            updateStageStatus('tri', triStatus);

            // 7. Snapshot
            setCurrentStageIndex(6);
            updateStageStatus('snapshot', 'RUNNING');
            await new Promise(r => setTimeout(r, 300));
            updateStageStatus('snapshot', 'COMPLETED');

            // 8. Approval
            setCurrentStageIndex(7);
            updateStageStatus('approval', 'COMPLETED');

            setIsFinished(true);
        } catch (e: any) {
            console.error("Review failed", e);
            const stageId = stages[currentStageIndex]?.id || 'structural';
            updateStageStatus(stageId, 'ERROR');
            setErrorStage({ id: stageId, message: e.message || "Erro desconhecido na IA" });
        } finally {
            setIsLoading(false);
        }
    };

    const updateStageStatus = (id: string, status: ReviewStage['status']) => {
        setStages(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    const applyCorrections = () => {
        if (!reviewResult) return;

        let correctedItems = [...effectiveItems];

        // 1. Aplicar polishedItems (substituir versões melhoradas)
        if (reviewResult.polishedItems) {
            correctedItems = correctedItems.map(item => {
                const polished = reviewResult.polishedItems.find((p: any) => p.id === item.id);
                return polished ? { ...item, ...polished } : item;
            });
        }

        // 2. Remover duplicatas
        if (reviewResult.itemsToRemove && reviewResult.itemsToRemove.length > 0) {
            correctedItems = correctedItems.filter(item =>
                !reviewResult.itemsToRemove.includes(item.id)
            );
        }

        // 3. Adicionar variantes sugeridas
        if (reviewResult.variantsSuggested && reviewResult.variantsSuggested.length > 0) {
            const newVariants = reviewResult.variantsSuggested.map((v: any) => {
                const original = effectiveItems.find(i => i.id === v.originalItemId);
                return {
                    ...original,
                    id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    statement: v.newStatement,
                    alternatives: v.newAlternatives,
                    origin: 'AI_VARIANT' as any
                };
            });
            correctedItems = [...correctedItems, ...newVariants];
        }

        onComplete && onComplete(correctedItems, reviewResult);
    };

    useEffect(() => {
        if (effectiveItems.length > 0) {
            startReview();
        }
    }, [effectiveItems]);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-primary/20 text-brand-primary rounded-2xl border border-brand-primary/30">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Sparkles className="text-brand-primary" size={24} />
                                Pipeline de Revisão Avançada (IA)
                            </h2>
                            <p className="text-slate-400 text-sm">Garantindo a qualidade pedagógica e técnica da sua avaliação.</p>
                        </div>
                    </div>
                </div>

                {/* Pipeline Steps */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-4 custom-scrollbar">
                    {stages.map((stage, idx) => (
                        <div
                            key={stage.id}
                            className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${stage.status === 'RUNNING' ? 'border-brand-primary bg-brand-primary/5 shadow-lg shadow-brand-primary/10' :
                                stage.status === 'COMPLETED' ? 'border-emerald-500/30 bg-emerald-500/5' :
                                    'border-slate-800 bg-slate-800/50 opacity-60'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${stage.status === 'RUNNING' ? 'bg-brand-primary text-white animate-pulse' :
                                    stage.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                                        'bg-slate-700 text-slate-400'
                                    }`}>
                                    {stage.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{stage.label}</h4>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mt-1">
                                        {stage.status === 'PENDING' ? 'Aguardando' :
                                            stage.status === 'RUNNING' ? 'Analisando...' :
                                                stage.status === 'COMPLETED' ? 'Sucesso' : 'Erro'}
                                    </p>
                                    {stage.status === 'ERROR' && (
                                        <div className="mt-2 p-1.5 bg-rose-500/10 rounded border border-rose-500/20 max-w-[280px]">
                                            <p className="text-[10px] text-rose-300 break-words">
                                                {reviewResult?.stages?.[stage.id]?.feedback || (errorStage?.id === stage.id ? errorStage.message : "Inconsistência detectada pela IA.")}
                                            </p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startReview(); }}
                                                className="mt-2 px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-[9px] text-rose-200 rounded transition flex items-center gap-1"
                                            >
                                                Tentar Novamente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {stage.status === 'RUNNING' && <Loader2 size={20} className="animate-spin text-brand-primary" />}
                            {stage.status === 'COMPLETED' && <CheckCircle2 size={20} className="text-emerald-500" />}
                            {stage.status === 'ERROR' && <AlertTriangle size={20} className="text-rose-500" />}
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="mt-12 flex justify-between items-center p-6 bg-slate-800/80 rounded-2xl border border-slate-700 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Total de Itens</p>
                                <p className="font-bold">{effectiveItems.length} Questões</p>
                            </div>
                        </div>

                        {correctionsAvailable && (
                            <div className="flex items-center gap-3 px-4 py-2 bg-brand-primary/10 rounded-xl border border-brand-primary/30">
                                <Sparkles size={20} className="text-brand-primary" />
                                <div>
                                    <p className="text-xs text-brand-primary font-bold">Correções Disponíveis</p>
                                    <p className="text-[10px] text-slate-400">
                                        {correctionsPreview.polished} melhoradas • {correctionsPreview.variants} variantes • {correctionsPreview.removed} removidas
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="bg-transparent border border-slate-600 text-slate-400 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 transition"
                        >
                            Cancelar
                        </button>

                        {correctionsAvailable && isFinished && (
                            <button
                                onClick={applyCorrections}
                                className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg bg-brand-primary text-white hover:bg-brand-dark"
                            >
                                <Sparkles size={18} />
                                Aplicar Correções
                            </button>
                        )}

                        <button
                            disabled={!isFinished}
                            onClick={() => onComplete && onComplete(effectiveItems, reviewResult)}
                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg ${isFinished ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {isFinished ? 'Manter Original' : 'Processando...'} <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
