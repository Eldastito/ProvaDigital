import React, { useState } from 'react';
import { X, Brain } from 'lucide-react';
import { useExamBuilder } from './hooks/useExamBuilder';
import { ExamBasicInfo } from './components/ExamBasicInfo';
import { ExamQuestionSelector } from './components/ExamQuestionSelector';
import { ExamReview } from './components/ExamReview';
import { BatchReviewPanel } from '../runner/features/BatchReviewPanel';
import { AdvancedReviewPipeline } from '../runner/features/AdvancedReviewPipeline';
import { extractTextFromPDF } from '../../../utils/pdfExtractor';
import { generateQuestionsFromText } from '../../../services/geminiService';
import { Loader2, FileText, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Item, QuestionType, DifficultyLevel, ItemOrigin } from '../../../types';

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

    const [isGenerating, setIsGenerating] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importContext, setImportContext] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImportFile(file);
            if (file.type === 'application/pdf') {
                try {
                    setIsGenerating(true);
                    const text = await extractTextFromPDF(file);
                    setImportContext(text);
                } catch (err) {
                    alert('Erro ao ler PDF: ' + err);
                } finally {
                    setIsGenerating(false);
                }
            }
        }
    };

    const handleGenerateFromContext = async () => {
        if (!importContext) return;
        setIsGenerating(true);
        try {
            // Generate 5 questions based on the context
            const newQuestions = await generateQuestionsFromText(
                importContext,
                5,
                QuestionType.MULTIPLE_CHOICE,
                DifficultyLevel.MEDIUM,
                config.subject || 'Geral'
            );

            // Map to Item format
            const items: Item[] = newQuestions.map(q => ({
                id: uuidv4(),
                tenantId: 'demo-tenant',
                ownerId: 'demo-user',
                knowledgeArea: 'Geral',
                subject: config.subject || 'Geral',
                type: QuestionType.MULTIPLE_CHOICE,
                statement: q.statement,
                alternatives: q.alternatives.map(a => ({ id: uuidv4(), text: a.text, isCorrect: a.isCorrect })),
                correctAnswerJustification: q.justification,
                difficulty: q.difficulty as DifficultyLevel,
                score: 1.0,
                origin: ItemOrigin.IA,
                tags: ['Gerado por IA', 'Contexto PDF'],
                usageCount: 0,
                createdAt: new Date().toISOString(),
                triParams: q.triParams // Ensure this is mapped if returned
            }));

            // Add to exam - using state.addItem or updateExam if available
            // Assuming state.addItem exists or we iterate
            items.forEach(i => state.addItem(i));

            setImportModalOpen(false);
            setImportContext('');
            setImportFile(null);
            alert(`${items.length} questões geradas com sucesso a partir do material!`);
        } catch (error) {
            console.error(error);
            alert('Falha na geração: ' + error);
        } finally {
            setIsGenerating(false);
        }
    };

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
                )}

                {/* IMPORT PDF BUTTON (Visible in Step 1) */}
                {step === 1 && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-purple-800 flex items-center gap-2">
                                <FileText size={18} />
                                Criar Prova contextualizada (PDF)
                            </h4>
                            <p className="text-sm text-purple-600">Gere questões automaticamente a partir de um livro ou apostila.</p>
                        </div>
                        <button
                            onClick={() => setImportModalOpen(true)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold flex items-center gap-2"
                        >
                            <Upload size={18} />
                            Importar Conteúdo
                        </button>
                    </div>

                {/* IMPORT MODAL */}
                {importModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-[500px] shadow-2xl">
                            <h3 className="text-lg font-bold mb-4">Importar Conteúdo de Estudo</h3>

                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        {isGenerating ? (
                                            <Loader2 className="animate-spin text-purple-600" size={32} />
                                        ) : (
                                            <Upload size={32} />
                                        )}
                                        <span className="font-medium">
                                            {importFile ? importFile.name : "Arraste seu PDF aqui ou clique para buscar"}
                                        </span>
                                        {importContext && <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded">Conteúdo Extraído ({importContext.length} caracteres)</span>}
                                    </div>
                                </div>

                                {importContext && (
                                    <button
                                        onClick={handleGenerateFromContext}
                                        disabled={isGenerating}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="animate-spin" />
                                                Lendo e Criando Questões...
                                            </>
                                        ) : (
                                            <>
                                                <Brain size={18} />
                                                Gerar Questões via IA
                                            </>
                                        )}
                                    </button>
                                )}

                                <button onClick={() => setImportModalOpen(false)} className="w-full py-2 text-slate-400 hover:text-slate-600">Cancelar</button>
                            </div>
                        </div>
                    </div>
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
