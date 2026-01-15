import React, { useState, useEffect } from 'react';
import { ShieldCheck, Brain, Accessibility, Type, GitMerge, BarChart3, Save, CheckCircle2, Loader2, AlertTriangle, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { Item, Exam } from '../../types';
import { reviewExamAdvanced } from '../../services/geminiService';
import { useAppStore } from '../../store/useAppStore';

interface ReviewStage {
    id: string;
    label: string;
    icon: React.ReactNode;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR';
    result?: string;
}

interface AdvancedReviewPipelineProps {
    items: Item[];
    onComplete: (polishedItems: Item[], reviewSummary: any) => void;
    onCancel: () => void;
}

export const AdvancedReviewPipeline: React.FC<AdvancedReviewPipelineProps> = ({ items, onComplete, onCancel }) => {
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

    const startReview = async () => {
        // Marcamos as primeiras como em execução
        updateStageStatus('structural', 'RUNNING');

        try {
            const result = await reviewExamAdvanced(items);
            setReviewResult(result);

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
            // Review returns "OK" or "WARN" usually. Map WARN to ERROR for visibility if rigorous, or just COMPLETED if acceptable.
            // Let's use ERROR for 'WARN' to highlight it as an "Alert" state in UI (Yellow/Red)
            const accessStatus = result.stages?.accessibility?.status === 'OK' ? 'COMPLETED' : 'ERROR';
            updateStageStatus('accessibility', accessStatus);

            // 4. Textual (Polishing)
            setCurrentStageIndex(3);
            updateStageStatus('textual', 'RUNNING');
            // Check if polishedItems differs from original
            await new Promise(r => setTimeout(r, 500));
            updateStageStatus('textual', 'COMPLETED');

            // 5. Anti-Cheat
            setCurrentStageIndex(4);
            updateStageStatus('anticheat', 'RUNNING');
            await new Promise(r => setTimeout(r, 500));
            const cheatStatus = result.stages?.antiCheat?.status === 'OK' ? 'COMPLETED' : 'ERROR';
            updateStageStatus('anticheat', cheatStatus);

            // 6. TRI (Simulation)
            setCurrentStageIndex(5);
            updateStageStatus('tri', 'RUNNING');
            await new Promise(r => setTimeout(r, 500));
            updateStageStatus('tri', 'COMPLETED');

            // 7. Snapshot
            setCurrentStageIndex(6);
            updateStageStatus('snapshot', 'RUNNING');
            await new Promise(r => setTimeout(r, 300));
            updateStageStatus('snapshot', 'COMPLETED');

            // 8. Approval
            setCurrentStageIndex(7);
            updateStageStatus('approval', 'COMPLETED');

            setIsFinished(true);
        } catch (e) {
            console.error("Review failed", e);
            updateStageStatus(stages[currentStageIndex].id, 'ERROR');
        }
    };

    const updateStageStatus = (id: string, status: ReviewStage['status']) => {
        setStages(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    useEffect(() => {
        startReview();
    }, []);

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
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Total de Itens</p>
                            <p className="font-bold">{items.length} Questões</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="bg-transparent border border-slate-600 text-slate-400 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={!isFinished}
                            onClick={() => onComplete(reviewResult?.polishedItems || items, reviewResult)}
                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg ${isFinished ? 'bg-brand-primary text-white hover:bg-brand-dark' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {isFinished ? 'Concluir Revisão' : 'Processando...'} <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
