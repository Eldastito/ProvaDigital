import React from 'react';
import { X } from 'lucide-react';
import { useExamBuilder } from './hooks/useExamBuilder';
import { ExamBasicInfo } from './components/ExamBasicInfo';
import { ExamQuestionSelector } from './components/ExamQuestionSelector';
import { ExamReview } from './components/ExamReview';
import { BatchReviewPanel } from '../runner/features/BatchReviewPanel';
import { AdvancedReviewPipeline } from '../runner/features/AdvancedReviewPipeline';

export const ExamBuilderView = () => {
    const {
        step, setStep,
        builderMode, setBuilderMode,
        config, setConfig,
        gradingConfig, setGradingConfig,
        coverConfig, setCoverConfig,
        smartCriteria, setSmartCriteria,
        selectedItems, setSelectedItems,
        isFillingGaps,
        selectionDiagnosis,
        currentBatchId, setCurrentBatchId,
        currentBatchItems, setCurrentBatchItems,
        isReviewingBatch, setIsReviewingBatch,
        isReviewingExam, setIsReviewingExam,
        showBatchHistory, setShowBatchHistory,
        showRecommendations, setShowRecommendations,
        handleSave,
        toggleItem,
        handleSmartGenerate,
        handleGapGeneration,
        handleBatchImport,
        csvImportRef,
        state,
        navigate
    } = useExamBuilder();

    return (
        <div className="bg-white rounded-xl shadow-lg border border-brand-primary flex flex-col h-[calc(100vh-120px)]">
            <input type="file" ref={csvImportRef} className="hidden" accept=".csv" onChange={handleBatchImport} />

            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Montar Prova</h2>
                    <p className="text-sm text-slate-500">Passo {step} de 3</p>
                </div>
                <div className="flex gap-3">
                    {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Voltar</button>}
                    <button onClick={() => navigate('/exams')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                {step === 1 && (
                    <ExamBasicInfo
                        config={config} setConfig={setConfig}
                        coverConfig={coverConfig} setCoverConfig={setCoverConfig}
                        builderMode={builderMode} setBuilderMode={setBuilderMode}
                        handleSmartGenerate={handleSmartGenerate} setStep={setStep}
                    />
                )}

                {step === 2 && (
                    isReviewingBatch ? (
                        <BatchReviewPanel
                            batchId={currentBatchId || ''} items={currentBatchItems}
                            onFinish={() => { setIsReviewingBatch(false); if (builderMode === 'SMART') handleSmartGenerate(); }}
                        />
                    ) : isReviewingExam ? (
                        <AdvancedReviewPipeline
                            items={selectedItems} onCancel={() => setIsReviewingExam(false)}
                            onComplete={async (polished) => {
                                setSelectedItems(polished);
                                setIsReviewingExam(false);
                            }}
                        />
                    ) : showBatchHistory ? (
                        <div className="bg-white p-6 rounded-2xl">
                            <div className="flex justify-between mb-4">
                                <h3 className="font-bold">Histórico de Lotes</h3>
                                <button onClick={() => setShowBatchHistory(false)}>Fechar</button>
                            </div>
                            {state.itemGenerationBatches.map(b => (
                                <div key={b.id} onClick={() => {
                                    setCurrentBatchId(b.id);
                                    setCurrentBatchItems(state.items.filter(i => i.generationBatchId === b.id));
                                    setIsReviewingBatch(true);
                                    setShowBatchHistory(false);
                                }} className="p-3 border my-2 cursor-pointer">{b.promptContext}</div>
                            ))}
                        </div>
                    ) : (
                        <ExamQuestionSelector
                            builderMode={builderMode} items={state.items} selectedItems={selectedItems} toggleItem={toggleItem}
                            config={config} coverConfig={coverConfig} selectionDiagnosis={selectionDiagnosis} smartCriteria={smartCriteria}
                            isFillingGaps={isFillingGaps} onGapGeneration={handleGapGeneration}
                            onImportClick={() => csvImportRef.current?.click()}
                            onRecommendationsClick={() => setShowRecommendations(!showRecommendations)}
                            showRecommendations={showRecommendations}
                            onSave={handleSave} onReviewIA={() => setIsReviewingExam(true)}
                            onStepChange={setStep}
                            loadGenerationBatches={state.loadGenerationBatches} setShowBatchHistory={setShowBatchHistory}
                            currentBatchId={currentBatchId}
                        />
                    )
                )}

                {step === 3 && (
                    <ExamReview
                        config={config} gradingConfig={gradingConfig} setGradingConfig={setGradingConfig}
                        selectedItems={selectedItems} onSave={handleSave} onSeal={state.sealExam}
                        onStepChange={setStep} navigate={navigate}
                    />
                )}
            </div>
        </div>
    );
};
