import React, { useState } from 'react';
import { X, Brain } from 'lucide-react';
import { useExamBuilder } from './hooks/useExamBuilder';
import { ExamBasicInfo } from './components/ExamBasicInfo';
import { ExamQuestionSelector } from './components/ExamQuestionSelector';
import { ExamReview } from './components/ExamReview';
import { BatchReviewPanel } from '../runner/features/BatchReviewPanel';
import { AdvancedReviewPipeline } from '../runner/features/AdvancedReviewPipeline';
import { extractTextFromPDF } from '../../utils/pdfExtractor';
import { generateQuestionsFromText, extractQuestionsFromImage } from '../../services/geminiService';
import { Loader2, FileText, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Item, QuestionType, DifficultyLevel, ItemOrigin, ItemLifecycleStatus } from '../../types';
import { AgentCoPilotOverlay } from './components/AgentCoPilotOverlay';

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
        navigate,
        prediction
    } = useExamBuilder();

    const [isGenerating, setIsGenerating] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importContext, setImportContext] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importImageBase64, setImportImageBase64] = useState<string | null>(null);
    const [importImageMime, setImportImageMime] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImportFile(file);
            if (file.type === 'application/pdf') {
                try {
                    setIsGenerating(true);
                    setImportImageBase64(null);
                    setImportImageMime(null);
                    const text = await extractTextFromPDF(file);
                    setImportContext(text);
                } catch (err) {
                    alert('Erro ao ler PDF: ' + err);
                } finally {
                    setIsGenerating(false);
                }
            } else if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = e.target?.result as string;
                    setImportImageBase64(base64);
                    setImportImageMime(file.type);
                    setImportContext('Imagem Carregada. A IA fará a extração (OCR) para gerar as questões.');
                };
                reader.readAsDataURL(file);
            } else {
                alert('Formato não suportado. Envie um arquivo PDF ou uma Imagem.');
                setImportFile(null);
            }
        }
    };

    const handleGenerateFromContext = async () => {
        if (!importContext && !importImageBase64) return;
        setIsGenerating(true);
        try {
            let newQuestions = [];

            if (importImageBase64 && importImageMime) {
                // Modo OCR de Imagem
                newQuestions = await extractQuestionsFromImage(importImageBase64, importImageMime);
            } else if (importContext) {
                // Modo RAG de Texto (PDF)
                newQuestions = await generateQuestionsFromText(
                    importContext,
                    5, // Quantidade default ou dinâmica depois
                    QuestionType.MULTIPLE_CHOICE,
                    DifficultyLevel.MEDIUM,
                    config.subject || 'Geral'
                );
            }

            // Map to Item format
            const items: Item[] = newQuestions.map(q => ({
                id: uuidv4(),
                tenantId: 'demo-tenant',
                ownerId: 'demo-user', // Será substituído pelo ID real no backend
                knowledgeArea: 'Geral',
                subject: config.subject || 'Geral',
                type: QuestionType.MULTIPLE_CHOICE,
                statement: q.statement,
                alternatives: q.alternatives.map(a => ({ id: uuidv4(), text: a.text, isCorrect: a.isCorrect })),
                correctAnswerJustification: q.justification,
                difficulty: q.difficulty as DifficultyLevel,
                score: 1.0,
                origin: importImageBase64 ? ItemOrigin.MANUAL : ItemOrigin.IA, // Marca como manual se extraído via OCR
                lifecycleStatus: ItemLifecycleStatus.DRAFT,
                generationBatchId: currentBatchId || uuidv4(),
                tags: importImageBase64 ? ['Extração OCR'] : ['Gerado por IA', 'Contexto PDF'],
                usageCount: 0,
                createdAt: new Date().toISOString(),
                triParams: {
                    ...q.triParams,
                    bloomTaxonomy: q.triParams?.bloomTaxonomy as any,
                    cognitiveAxis: q.triParams?.cognitiveAxis as any
                }
            }));

            // Adiciona no state master
            items.forEach(i => state.addItem(i));

            setImportModalOpen(false);
            setImportContext('');
            setImportImageBase64(null);
            setImportImageMime(null);
            setImportFile(null);

            // Vai para a tela de revisão
            setCurrentBatchId(items[0].generationBatchId || uuidv4());
            setCurrentBatchItems(items);
            setIsReviewingBatch(true);
            setStep(2);

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
                    />
                )}

                {/* SMART PREDICTION / IMPORT PDF BUTTON (Visible in Step 1) */}
                {step === 1 && (
                    <>
                        {prediction && !config.title && (
                            <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 font-bold text-xl leading-none">
                                    ✨
                                </div>
                                <div>
                                    <h4 className="font-semibold text-indigo-900">Configuração Inteligente</h4>
                                    <p className="text-sm text-indigo-700 mt-1">{prediction.reasoning}</p>
                                </div>
                            </div>
                        )}
                        <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-purple-800 flex items-center gap-2">
                                    <FileText size={18} />
                                    Digitalizar / Extrair Questões (PDF ou Imagem)
                                </h4>
                                <p className="text-sm text-purple-600">Gere questões baseadas em conteúdo bibliográfico ou extraia (OCR) de fotos de provas.</p>
                            </div>
                            <button
                                onClick={() => setImportModalOpen(true)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold flex items-center gap-2"
                            >
                                <Upload size={18} />
                                Importar Conteúdo
                            </button>
                        </div>
                    </>
                )}

                {/* IMPORT MODAL */}
                {importModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl w-[500px] shadow-2xl">
                            <h3 className="text-lg font-bold mb-4">Importar Conteúdo de Estudo</h3>

                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".pdf,image/png,image/jpeg,image/webp"
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
                                            {importFile ? importFile.name : "Arraste seu PDF ou IMAGEM aqui"}
                                        </span>
                                        {importContext && <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded">Pronto para extração de contexto via RAG/OCR</span>}
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
                                                {importImageBase64 ? 'Extrair via OCR' : 'Analisar Fonte e Gerar Questões'}
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
                            examModel={config.model}
                        />
                    )
                )}

                {step === 3 && (
                    <ExamReview
                        config={config} gradingConfig={gradingConfig} setGradingConfig={setGradingConfig}
                        selectedItems={selectedItems} onSave={handleSave} onSeal={state.sealExam}
                        onStepChange={setStep} navigate={navigate} onRemoveItem={toggleItem}
                    />
                )}
            </div>

            {/* AI Co-Pilot Overlay */}
            {step > 1 && (
                <AgentCoPilotOverlay
                    examTitle={config.title}
                    items={selectedItems}
                    onApplyAction={(type, data) => {
                        console.log(`Co-Pilot Action: ${type}`, data);
                        if (type === 'BNCC_LINK' && data) {
                            // Example: Linking BNCC to the exam configuration
                            setConfig(prev => ({ ...prev, bnccCodes: data }));
                        }
                    }}
                />
            )}
        </div>
    );
};
