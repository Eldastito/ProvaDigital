import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppState, Exam, ExamStatus, ExamModel, Item, QuestionType, DifficultyLevel, ItemOrigin, ItemLifecycleStatus } from '../../types';
import { uuidv4, normalizeString } from '../../utils/helpers';
import * as Papa from 'papaparse';
import { useSafeAppStore } from '../../store/useAppStore';
import { smartSelectItems, ExamCriteria } from '../../services/examService';
import { generateQuestionsFromText } from '../../services/geminiService';
import { AdvancedReviewPipeline } from '../exam-taking/AdvancedReviewPipeline';
import { BatchReviewPanel } from '../exam-taking/BatchReviewPanel';

import { ExamBasicInfo } from './components/ExamBasicInfo';
import { ExamQuestionSelector } from './components/ExamQuestionSelector';
import { ExamReview } from './components/ExamReview';

type CoverSectionType = 'text' | 'distribution';

interface CoverSection {
    id: string;
    title: string;
    type: CoverSectionType;
    content?: string;
    distribution?: {
        groups: {
            name: string;
            items: {
                subject: string;
                range: string;
                points: string;
            }[];
        }[];
    };
}

export const ExamBuilderView = () => {
    const navigate = useNavigate();
    const state = useSafeAppStore();
    const { addExam, addItem, addItems } = state;
    const [step, setStep] = useState(1);
    const [builderMode, setBuilderMode] = useState<'MANUAL' | 'SMART'>('MANUAL');
    const [config, setConfig] = useState({
        title: '',
        duration: 60,
        subject: '',
        model: ExamModel.SOMATIVO,
        shuffleItems: true,
        description: ''
    });

    const [gradingConfig, setGradingConfig] = useState({
        totalsByDiscipline: {} as Record<string, number>,
        totalScore: 0
    });

    const [coverConfig, setCoverConfig] = useState<{
        title: string;
        sections: CoverSection[];
        instructions: string;
        securityNotices: string;
    }>({
        title: '',
        instructions: '',
        securityNotices: '',
        sections: [
            {
                id: '1',
                type: 'text',
                title: 'INSTRUÇÕES GERAIS',
                content: `1 - Navegue entre as questões utilizando as setas ou o painel lateral.\n2 - Questões respondidas ficarão marcadas em verde.\n3 - Você pode revisar suas respostas a qualquer momento antes de finalizar.\n4 - O sistema salva seu progresso automaticamente.`
            },
            {
                id: '2',
                type: 'distribution',
                title: 'DISTRIBUIÇÃO DE QUESTÕES',
                distribution: {
                    groups: [
                        {
                            name: "CONHECIMENTOS BÁSICOS",
                            items: [
                                { subject: "Língua Portuguesa", range: "1 a 10", points: "1,0 cada" },
                                { subject: "Matemática", range: "11 a 20", points: "1,0 cada" }
                            ]
                        },
                        {
                            name: "CONHECIMENTOS ESPECÍFICOS",
                            items: [
                                { subject: "Bloco 1", range: "21 a 40", points: "1,0 cada" },
                                { subject: "Bloco 2", range: "41 a 60", points: "1,0 cada" }
                            ]
                        }
                    ]
                }
            },
            {
                id: '3',
                type: 'text',
                title: 'AVISOS DE SEGURANÇA',
                content: `1 - O modo de tela cheia é obrigatório. Sair da tela cheia pode ser registrado como infração.\n2 - O sistema monitora a troca de abas e perda de foco.\n3 - Certifique-se de que sua bateria está carregada e conexão estável.\n4 - Identificação de cola ou consulta não autorizada anulará a prova.`
            }
        ]
    });

    const [smartCriteria, setSmartCriteria] = useState<ExamCriteria>({
        subject: '',
        targetCount: 10,
        difficultyDistribution: {
            [DifficultyLevel.EASY]: 30,
            [DifficultyLevel.MEDIUM]: 50,
            [DifficultyLevel.HARD]: 20
        },
        bnccCodes: []
    });
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFillingGaps, setIsFillingGaps] = useState(false);
    const [selectionDiagnosis, setSelectionDiagnosis] = useState<any>(null);
    const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
    const [currentBatchItems, setCurrentBatchItems] = useState<Item[]>([]);
    const [isReviewingBatch, setIsReviewingBatch] = useState(false);
    const [isReviewingExam, setIsReviewingExam] = useState(false);
    const [showBatchHistory, setShowBatchHistory] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);

    // --- PERSISTENCE & AUTO-SAVE ---
    useEffect(() => {
        const key = `exam_builder_draft_${state.currentUser?.id}`;
        const draft = localStorage.getItem(key);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed.config?.title || parsed.selectedItems?.length > 0) {
                    if (confirm('⚠️ Encontramos um rascunho de prova não salvo. Deseja restaurar onde parou?')) {
                        setConfig(parsed.config);
                        setSelectedItems(parsed.selectedItems || []);
                        setStep(parsed.step || 1);
                        if (parsed.gradingConfig) setGradingConfig(parsed.gradingConfig);
                        if (parsed.coverConfig) {
                            setCoverConfig(prev => {
                                const restored = parsed.coverConfig;
                                if (!restored.sections) {
                                    return { ...prev, title: restored.title || prev.title };
                                }
                                return restored;
                            });
                        }
                    } else {
                        localStorage.removeItem(key);
                    }
                }
            } catch (e) { console.error("Error restoring draft:", e); }
        }
    }, [state.currentUser?.id]);

    useEffect(() => {
        if (!config.title && selectedItems.length === 0) return;
        const key = `exam_builder_draft_${state.currentUser?.id}`;
        const draft = { config, selectedItems, step, gradingConfig, coverConfig, updatedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(draft));
    }, [config, selectedItems, step, gradingConfig, coverConfig, state.currentUser?.id]);

    // Logic Handlers
    const handleSave = async (publish = false) => {
        if (!config.title) return alert('Título obrigatório');
        if (selectedItems.length === 0) return alert('Selecione ao menos 1 questão');

        setIsSaving(true);
        try {
            const examId = uuidv4();
            const versionId = uuidv4();

            const itemsWithWeights = selectedItems.map((item, idx) => {
                const subjectItems = selectedItems.filter(i => i.subject === item.subject);
                const totalPointsForSubject = gradingConfig.totalsByDiscipline[item.subject] || 10.0;
                const itemWeight = totalPointsForSubject / subjectItems.length;

                return { itemId: item.id, weight: itemWeight, position: idx + 1 };
            });

            const newExam: Exam = {
                id: examId,
                tenantId: state.currentUser?.tenantId || 't1',
                schoolId: state.currentUser?.schoolId || 's1',
                creatorId: state.currentUser?.id || '',
                title: config.title,
                description: config.description,
                subject: config.subject,
                model: config.model,
                durationMinutes: config.duration,
                targetQuestionCount: selectedItems.length,
                status: publish ? ExamStatus.ACTIVE : ExamStatus.DRAFT,
                items: itemsWithWeights.map(i => ({ itemId: i.itemId, order: i.position, customScore: i.weight })),
                classIds: [],
                shuffleItems: config.shuffleItems,
                createdAt: new Date().toISOString(),
                maxScore: Object.values(gradingConfig.totalsByDiscipline).length > 0
                    ? (Object.values(gradingConfig.totalsByDiscipline) as number[]).reduce((a, b) => a + b, 0)
                    : selectedItems.length * 1.0
            };

            await addExam(newExam);

            if (state.addExamVersion) {
                await state.addExamVersion({
                    id: versionId,
                    examId: examId,
                    versionNumber: 1,
                    itemsSnapshot: itemsWithWeights,
                    gradingConfig: gradingConfig,
                    coverConfig: coverConfig,
                    status: publish ? 'published' : 'draft',
                    createdAt: new Date().toISOString()
                });
            }

            localStorage.removeItem(`exam_builder_draft_${state.currentUser?.id}`);

            if (!publish) {
                alert('Prova salva como rascunho!');
                navigate('/exams');
            }
            return examId;
        } catch (error: any) {
            console.error(error);
            alert('Erro ao salvar prova: ' + (error.message || 'Erro desconhecido.'));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleItem = (item: Item) => {
        const exists = selectedItems.find(i => i.id === item.id);
        if (exists) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleSmartGenerate = () => {
        if (!state.items || state.items.length === 0) return alert("Banco vazio.");
        const result = smartSelectItems({ ...smartCriteria, subject: config.subject || smartCriteria.subject }, state.items);
        setSelectedItems(result.selectedItems);
        setSelectionDiagnosis(result);
        if (result.selectedItems.length > 0) setStep(2);
        else alert("Nenhum item encontrado.");
    };

    const handleGapGeneration = async () => {
        if (!selectionDiagnosis || selectionDiagnosis.missingCount <= 0) return;
        setIsFillingGaps(true);
        try {
            const batchId = uuidv4();
            const promptContext = `Crie questões sobre ${config.subject}. Foco: ${JSON.stringify(selectionDiagnosis.unmetBnccCodes)}`;
            const generated = await generateQuestionsFromText(promptContext, selectionDiagnosis.missingCount, QuestionType.MULTIPLE_CHOICE, DifficultyLevel.MEDIUM, config.subject || smartCriteria.subject);

            if (generated) {
                const newItems: Item[] = generated.map(g => ({
                    id: uuidv4(),
                    tenantId: state.currentUser?.tenantId || 't1', ownerId: state.currentUser?.id || 'sys',
                    statement: g.statement, subject: config.subject, type: QuestionType.MULTIPLE_CHOICE,
                    alternatives: g.alternatives.map(a => ({ id: uuidv4(), ...a })),
                    correctAnswerJustification: g.justification, difficulty: g.difficulty as DifficultyLevel,
                    score: 1.0, origin: ItemOrigin.IA, tags: ['IA', 'Gerador'], bnccCode: g.bnccCode,
                    usageCount: 0, generationBatchId: batchId, lifecycleStatus: ItemLifecycleStatus.DRAFT,
                    createdAt: new Date().toISOString(), knowledgeArea: 'Geral'
                }));
                if (state.addGenerationBatch) {
                    await state.addGenerationBatch({
                        id: batchId, creatorId: state.currentUser?.id || '', tenantId: state.currentUser?.tenantId || 't1',
                        promptContext, totalRequested: selectionDiagnosis.missingCount, createdAt: new Date().toISOString()
                    });
                }
                await addItems(newItems);
                setCurrentBatchId(batchId);
                setCurrentBatchItems(newItems);
                setIsReviewingBatch(true);
            }
        } catch (e) { console.error(e); alert("Erro ao gerar via IA."); } finally { setIsFillingGaps(false); }
    };

    const csvImportRef = useRef<HTMLInputElement>(null);
    const handleBatchImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as any[];
                const newItems: Item[] = [];
                rows.forEach(row => {
                    if (!row.enunciado || !row.disciplina || !row.alternativa_a || !row.gabarito) return;
                    newItems.push({
                        id: uuidv4(), tenantId: state.currentUser?.tenantId || 't1', ownerId: state.currentUser?.id || 'sys',
                        statement: row.enunciado, subject: row.disciplina, type: QuestionType.MULTIPLE_CHOICE,
                        difficulty: DifficultyLevel.MEDIUM,
                        alternatives: [
                            { id: uuidv4(), text: row.alternativa_a, isCorrect: row.gabarito.toUpperCase() === 'A' },
                            { id: uuidv4(), text: row.alternativa_b, isCorrect: row.gabarito.toUpperCase() === 'B' },
                            { id: uuidv4(), text: row.alternativa_c, isCorrect: row.gabarito.toUpperCase() === 'C' },
                            { id: uuidv4(), text: row.alternativa_d, isCorrect: row.gabarito.toUpperCase() === 'D' },
                            { id: uuidv4(), text: row.alternativa_e, isCorrect: row.gabarito.toUpperCase() === 'E' }
                        ],
                        correctAnswerJustification: row.justificativa, tags: ['Importado'], score: 1.0,
                        origin: ItemOrigin.MANUAL, lifecycleStatus: ItemLifecycleStatus.APPROVED, usageCount: 0,
                        createdAt: new Date().toISOString(), knowledgeArea: 'Geral'
                    });
                });
                if (newItems.length > 0) {
                    await state.addItems(newItems);
                    alert(`${newItems.length} questões importadas!`);
                } else alert('Nenhuma questão válida.');
            },
            error: (err) => alert("Erro ao ler CSV: " + err.message)
        });
        if (csvImportRef.current) csvImportRef.current.value = '';
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
