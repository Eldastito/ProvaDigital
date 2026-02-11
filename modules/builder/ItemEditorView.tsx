import React from 'react';
import { Save, ArrowRight, ShoppingBag } from 'lucide-react';
import { useItemEditor } from './hooks/useItemEditor';
import { EditorHeader } from './components/editor/EditorHeader';
import { AuditReportView } from './components/editor/AuditReportView';
import { QuestionTypeSelector } from './components/editor/QuestionTypeSelector';
import { StatementEditor } from './components/editor/StatementEditor';
import { AlternativesEditor } from './components/editor/AlternativesEditor';
import { AnswerKeyEditor } from './components/editor/AnswerKeyEditor';
import { AIGenerationPanel } from './components/editor/AIGenerationPanel';
import { TRIParamsEditor } from './components/editor/TRIParamsEditor';
import { BatchReviewPanel } from '../runner/features/BatchReviewPanel';
import { ValidationResultsModal } from './components/ValidationResultsModal';

export const ItemEditorView = () => {
    const {
        mode, setMode,
        form, setForm,
        alternatives, setAlternatives,
        aiQuantity, setAiQuantity,
        aiContext, setAiContext,
        fileInputRef,
        handleFileUpload,
        handleTypeChange,
        handleDragStart, handleDragOver, handleDragEnd, draggedIdx,
        handleImproveStatement, isImproving,
        handleGenerateAlts, isGeneratingAlts,
        handleVariate, isVariating,
        handleAudit, isAuditing, auditReport, setAuditReport,
        handleAccessibility, isAdapting,
        handleSuggestBNCC, isBNCCLoading,
        handleGenerateJustification,
        handleGenerate, aiLoading,
        handleMagicPolish,
        handleOCR, isExtractingOCR,
        saveManual,
        state,
        showBatchHistory, setShowBatchHistory,
        activeBatchId, setActiveBatchId,
        // Multi-level states
        useMultiLevel, setUseMultiLevel,
        topic, setTopic,
        bnccCodes, setBnccCodes,
        examType, setExamType,
        standards, setStandards,
        levelConfigs, setLevelConfigs,
        generationProgress,
        // Modal states
        showValidationModal, setShowValidationModal,
        validationResults,
        coverText,
        handleApproveValidation,
        handleReviewQuestions
    } = useItemEditor();

    return (
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-brand-primary overflow-hidden flex flex-col h-[calc(100vh-100px)]">
            <EditorHeader
                mode={mode}
                setMode={setMode}
                handleMagicPolish={handleMagicPolish}
                isImproving={isImproving}
                isGeneratingAlts={isGeneratingAlts}
                isBNCCLoading={isBNCCLoading}
                handleAudit={handleAudit}
                isAuditing={isAuditing}
                handleOCR={handleOCR}
                isExtractingOCR={isExtractingOCR}
            />

            <div className="flex-1 overflow-y-auto p-6">
                <AuditReportView
                    auditReport={auditReport}
                    setAuditReport={setAuditReport}
                    handleMagicPolish={handleMagicPolish}
                />

                {mode === 'MANUAL' ? (
                    <div className="space-y-6">
                        <QuestionTypeSelector
                            form={form}
                            setForm={setForm}
                            handleTypeChange={handleTypeChange}
                        />

                        <StatementEditor
                            form={form}
                            setForm={setForm}
                            handleImproveStatement={handleImproveStatement}
                            isImproving={isImproving}
                            handleVariate={handleVariate}
                            isVariating={isVariating}
                            handleAccessibility={handleAccessibility}
                            isAdapting={isAdapting}
                        />

                        <AlternativesEditor
                            form={form}
                            alternatives={alternatives}
                            setAlternatives={setAlternatives}
                            handleGenerateAlts={handleGenerateAlts}
                            isGeneratingAlts={isGeneratingAlts}
                            draggedIdx={draggedIdx}
                            handleDragStart={handleDragStart}
                            handleDragOver={handleDragOver}
                            handleDragEnd={handleDragEnd}
                        />

                        <AnswerKeyEditor
                            form={form}
                            setForm={setForm}
                            handleGenerateJustification={handleGenerateJustification}
                            isImproving={isImproving}
                            handleSuggestBNCC={handleSuggestBNCC}
                            isBNCCLoading={isBNCCLoading}
                        />

                        <TRIParamsEditor form={form} setForm={setForm} />

                        {/* Marketplace & Sharing (Sprint 6) */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                    <ShoppingBag size={20} className="text-brand-primary" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">Publicar no Marketplace</div>
                                    <p className="text-[10px] text-slate-500">Torna este item visível e reutilizável por outros professores da rede.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${form.isPublic ? 'bg-brand-primary' : 'bg-slate-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.isPublic ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                ) : (
                    // AI Mode
                    <div className="space-y-6">
                        {activeBatchId ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                        Revisão de Lote
                                    </h3>
                                    <button
                                        onClick={() => setActiveBatchId(null)}
                                        className="text-sm font-bold text-brand-primary hover:underline"
                                    >
                                        Nova Geração
                                    </button>
                                </div>
                                <BatchReviewPanel
                                    batchId={activeBatchId}
                                    items={state.items.filter(i => i.generationBatchId === activeBatchId)}
                                    onFinish={() => {
                                        setActiveBatchId(null);
                                    }}
                                />
                            </div>
                        ) : showBatchHistory ? (
                            // Histórico Logic needs to be kept or extracted. 
                            // It's small enough to keep or we can extract `BatchHistoryList.tsx`, but for now I'll keep it inline-ish to save tokens unless it's huge.
                            // Actually it's lines 1013-1080 (67 lines). I'll keep it inline for now to avoid over-engineering.
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl">
                                    <h3 className="font-bold">Histórico de Lotes</h3>
                                    <button onClick={() => setShowBatchHistory(false)} className="text-sm font-bold text-slate-500">Voltar</button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {state.itemGenerationBatches.length > 0 ? (
                                        state.itemGenerationBatches.map(b => (
                                            <div
                                                key={b.id}
                                                className="p-4 bg-white border rounded-xl hover:border-brand-primary transition flex justify-between items-center group gap-4"
                                            >
                                                <div
                                                    onClick={() => {
                                                        setActiveBatchId(b.id);
                                                        setShowBatchHistory(false);
                                                    }}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    <div className="font-bold text-slate-900 line-clamp-1">{b.promptContext}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                                                        {new Date(b.createdAt).toLocaleDateString()} • {b.totalRequested} Itens
                                                    </div>
                                                </div>
                                                {/* Simplified Actions for brevity */}
                                                <button
                                                    onClick={() => {
                                                        setActiveBatchId(b.id);
                                                        setShowBatchHistory(false);
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-brand-primary transition"
                                                >
                                                    <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-400 italic">Nenhum lote anterior encontrado.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <AIGenerationPanel
                                form={form}
                                setForm={setForm}
                                aiQuantity={aiQuantity}
                                setAiQuantity={setAiQuantity}
                                aiContext={aiContext}
                                setAiContext={setAiContext}
                                fileInputRef={fileInputRef}
                                handleFileUpload={handleFileUpload}
                                handleGenerate={handleGenerate}
                                aiLoading={aiLoading}
                                useMultiLevel={useMultiLevel}
                                setUseMultiLevel={setUseMultiLevel}
                                topic={topic}
                                setTopic={setTopic}
                                bnccCodes={bnccCodes}
                                setBnccCodes={setBnccCodes}
                                examType={examType}
                                setExamType={setExamType}
                                standards={standards}
                                setStandards={setStandards}
                                levelConfigs={levelConfigs}
                                setLevelConfigs={setLevelConfigs}
                                generationProgress={generationProgress}
                            />
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end flex-shrink-0">
                {mode === 'MANUAL' ? (
                    <button onClick={saveManual} className="btn-gradient px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2">
                        <Save size={18} /> Salvar Item
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                state.loadGenerationBatches();
                                setShowBatchHistory(true);
                            }}
                            className="bg-slate-100 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-200 transition"
                        >
                            Ver Lotes Anteriores
                        </button>
                    </div>
                )}
            </div>

            {/* Validation Results Modal */}
            <ValidationResultsModal
                isOpen={showValidationModal}
                onClose={() => setShowValidationModal(false)}
                validationResults={validationResults}
                coverText={coverText}
                onApprove={handleApproveValidation}
                onReview={handleReviewQuestions}
            />
        </div>
    );
};
