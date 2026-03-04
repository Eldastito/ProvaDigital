import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Papa from 'papaparse';
import { AppState, Exam, ExamStatus, ExamLogisticsStatus, ExamModel, Item, QuestionType, DifficultyLevel, ItemOrigin, ItemLifecycleStatus, CoverSection } from '../../../types';
import { uuidv4 } from '../../../utils/helpers';
import { useSafeAppStore } from '../../../store/useAppStore';
import { smartSelectItems, ExamCriteria } from '../../../services/examService';
import { generateQuestionsFromText } from '../../../services/geminiService';
import { predictNextExamConfiguration, SmartFormPrediction } from '../../../services/smartFormService';
import { MOCK_TENANT_ID, MOCK_SCHOOL_ID } from '../../../utils/mockData';

export const useExamBuilder = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
                id: uuidv4(),
                type: 'text',
                title: 'INSTRUÇÕES GERAIS',
                content: `1 - Navegue entre as questões utilizando as setas ou o painel lateral.\n2 - Questões respondidas ficarão marcadas em verde.\n3 - Você pode revisar suas respostas a qualquer momento antes de finalizar.\n4 - O sistema salva seu progresso automaticamente.`
            },
            {
                id: uuidv4(),
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
                id: uuidv4(),
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
    const [prediction, setPrediction] = useState<SmartFormPrediction | null>(null);

    // --- LOGISTICS & WIZARD FEEDBACK ---
    const [logisticsStatus, setLogisticsStatus] = useState<ExamLogisticsStatus>(ExamLogisticsStatus.DRAFT);
    const [isHandoffRunning, setIsHandoffRunning] = useState(false);
    const [wizardTelemetry, setWizardTelemetry] = useState({
        iaCount: 0,
        manualCount: 0,
        difficultyMix: { [DifficultyLevel.EASY]: 0, [DifficultyLevel.MEDIUM]: 0, [DifficultyLevel.HARD]: 0 },
        bnccCoverage: 0
    });

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
        const draft = {
            config,
            selectedItems,
            step,
            gradingConfig,
            coverConfig,
            logisticsStatus,
            updatedAt: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(draft));

        // Update Telemetry
        const ia = selectedItems.filter(i => i.origin === ItemOrigin.IA).length;
        const manual = selectedItems.filter(i => i.origin === ItemOrigin.MANUAL).length;
        const mix = {
            [DifficultyLevel.EASY]: selectedItems.filter(i => i.difficulty === DifficultyLevel.EASY).length,
            [DifficultyLevel.MEDIUM]: selectedItems.filter(i => i.difficulty === DifficultyLevel.MEDIUM).length,
            [DifficultyLevel.HARD]: selectedItems.filter(i => i.difficulty === DifficultyLevel.HARD).length
        };
        setWizardTelemetry({
            iaCount: ia,
            manualCount: manual,
            difficultyMix: mix,
            bnccCoverage: selectedItems.filter(i => !!i.bnccCode).length / (selectedItems.length || 1)
        });
    }, [config, selectedItems, step, gradingConfig, coverConfig, logisticsStatus, state.currentUser?.id]);

    // --- SMART PREDICTION INITIALIZATION ---
    useEffect(() => {
        // Run prediction only if creating a new exam from scratch
        if (!config.title && selectedItems.length === 0 && state.currentUser?.id) {
            const pred = predictNextExamConfiguration(state, state.currentUser.id);
            if (pred) {
                setPrediction(pred);
                if (pred.suggestedSubject) {
                    setConfig(prev => ({ ...prev, subject: prev.subject || pred.suggestedSubject! }));
                    setSmartCriteria(prev => ({ ...prev, subject: pred.suggestedSubject! }));
                }
            }
        }
    }, [state.currentUser?.id, state.exams]);

    // --- AUTO-TRIGGER FOR SUGGESTED SCHEDULES ---
    useEffect(() => {
        const urlState = location.state as any;
        if (urlState?.autoGenerate && !config.title && selectedItems.length === 0) {
            const subject = urlState.suggestedSubject || 'Geral';
            setConfig(prev => ({
                ...prev,
                subject,
                title: `Avaliação de ${subject} - ${new Date().toLocaleDateString()}`
            }));
            setSmartCriteria(prev => ({ ...prev, subject }));
            setBuilderMode('SMART');
            setStep(1); // Fica no step 1 para mostrar a geração ocorrendo

            // Disparar a geração inteligente um tick depois
            setTimeout(() => {
                handleSmartGenerate();
            }, 100);
        }
    }, [location.state]);

    // Logic Handlers
    const handleSave = async (publish = false) => {
        if (isSaving || isHandoffRunning) return; // Idempotency
        if (!config.title) return alert('Dica: Dê um título para sua prova antes de avançar.');
        if (selectedItems.length === 0) return alert('Checklist: Você precisa selecionar ao menos 1 questão para enviar para a ExamePad.');

        setIsSaving(true);
        if (publish) {
            setLogisticsStatus(ExamLogisticsStatus.SENDING);
            setIsHandoffRunning(true);
        }

        try {
            const examId = uuidv4();
            // ... (rest of logic)
            const itemsWithWeights = selectedItems.map((item, idx) => {
                const subjectItems = selectedItems.filter(i => i.subject === item.subject);
                const totalPointsForSubject = gradingConfig.totalsByDiscipline[item.subject] || 10.0;
                const itemWeight = totalPointsForSubject / subjectItems.length;

                return { itemId: item.id, weight: itemWeight, position: idx + 1 };
            });

            const newExam: Exam = {
                id: examId,
                tenantId: state.currentUser?.tenantId || MOCK_TENANT_ID,
                schoolId: state.currentUser?.schoolId || MOCK_SCHOOL_ID,
                creatorId: state.currentUser?.id || '',
                title: config.title,
                description: config.description,
                subject: config.subject,
                model: config.model,
                durationMinutes: config.duration,
                targetQuestionCount: selectedItems.length,
                status: publish ? ExamStatus.ACTIVE : ExamStatus.DRAFT,
                logisticsStatus: publish ? ExamLogisticsStatus.SENT : ExamLogisticsStatus.DRAFT,
                items: itemsWithWeights.map(i => ({ itemId: i.itemId, order: i.position, customScore: i.weight })),
                classIds: [],
                shuffleItems: config.shuffleItems,
                createdAt: new Date().toISOString(),
                maxScore: Object.values(gradingConfig.totalsByDiscipline).length > 0
                    ? (Object.values(gradingConfig.totalsByDiscipline) as number[]).reduce((a, b) => a + b, 0)
                    : selectedItems.length * 1.0
            };

            await addExam(newExam);

            if (publish) {
                setLogisticsStatus(ExamLogisticsStatus.SENT);
            }

            localStorage.removeItem(`exam_builder_draft_${state.currentUser?.id}`);
            return examId;

        } catch (error: any) {
            setLogisticsStatus(ExamLogisticsStatus.ERROR);
            console.error(error);
            alert('Erro no envio: ' + (error.message || 'Erro desconhecido. Verifique sua conexão.'));
        } finally {
            setIsSaving(false);
            setIsHandoffRunning(false);
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

    const handleSmartGenerate = async () => {
        setIsGenerating(true);
        try {
            // 1. Tenta selecionar do banco local primeiro
            const result = smartSelectItems({ ...smartCriteria, subject: config.subject || smartCriteria.subject }, state.items || []);

            if (result.selectedItems.length >= smartCriteria.targetCount) {
                // Se encontrou tudo no banco, apenas avança
                setSelectedItems(result.selectedItems);
                setSelectionDiagnosis(result);
                setStep(2);
                return;
            }

            // 2. Se não encontrou o suficiente, solicita geração IA para o restante
            const missing = smartCriteria.targetCount - result.selectedItems.length;
            const batchId = uuidv4();
            const promptContext = `Gere uma prova completa de ${config.subject}. Já temos ${result.selectedItems.length} questões. Preciso de mais ${missing} questões inéditas de nível ${config.model === ExamModel.ADAPTATIVO ? 'Médio/Difícil' : 'Variado'}.`;

            const generated = await generateQuestionsFromText(promptContext, missing, QuestionType.MULTIPLE_CHOICE, DifficultyLevel.MEDIUM, config.subject);

            if (generated && generated.length > 0) {
                const newItems: Item[] = generated.map(g => ({
                    id: uuidv4(),
                    tenantId: state.currentUser?.tenantId || MOCK_TENANT_ID,
                    ownerId: state.currentUser?.id || 'sys',
                    statement: g.statement,
                    subject: config.subject,
                    type: QuestionType.MULTIPLE_CHOICE,
                    alternatives: g.alternatives.map(a => ({ id: uuidv4(), ...a })),
                    correctAnswerJustification: g.justification,
                    difficulty: g.difficulty as DifficultyLevel,
                    score: 1.0,
                    origin: ItemOrigin.IA,
                    tags: ['IA', 'Gerado Automaticamente'],
                    usageCount: 0,
                    generationBatchId: batchId,
                    lifecycleStatus: ItemLifecycleStatus.DRAFT,
                    createdAt: new Date().toISOString(),
                    knowledgeArea: 'Geral'
                }));

                if (state.addGenerationBatch) {
                    await state.addGenerationBatch({
                        id: batchId,
                        creatorId: state.currentUser?.id || '',
                        tenantId: state.currentUser?.tenantId || MOCK_TENANT_ID,
                        promptContext,
                        totalRequested: missing,
                        createdAt: new Date().toISOString()
                    });
                }

                await addItems(newItems);
                const finalSelection = [...result.selectedItems, ...newItems];
                setSelectedItems(finalSelection);
                setSelectionDiagnosis({ ...result, selectedItems: finalSelection, missingCount: 0 });
                setStep(2);
            } else {
                // Fallback se a IA falhar mas tivermos algo no banco
                if (result.selectedItems.length > 0) {
                    setSelectedItems(result.selectedItems);
                    setSelectionDiagnosis(result);
                    setStep(2);
                } else {
                    alert("Não foi possível gerar questões no momento. Tente novamente ou use o modo Manual.");
                }
            }
        } catch (error) {
            console.error("Erro na geração inteligente:", error);
            alert("Erro ao processar geração com IA.");
        } finally {
            setIsGenerating(false);
        }
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
                    tenantId: state.currentUser?.tenantId || MOCK_TENANT_ID, ownerId: state.currentUser?.id || 'sys',
                    statement: g.statement, subject: config.subject, type: QuestionType.MULTIPLE_CHOICE,
                    alternatives: g.alternatives.map(a => ({ id: uuidv4(), ...a })),
                    correctAnswerJustification: g.justification, difficulty: g.difficulty as DifficultyLevel,
                    score: 1.0, origin: ItemOrigin.IA, tags: ['IA', 'Gerador'], bnccCode: g.bnccCode,
                    usageCount: 0, generationBatchId: batchId, lifecycleStatus: ItemLifecycleStatus.DRAFT,
                    createdAt: new Date().toISOString(), knowledgeArea: 'Geral'
                }));
                if (state.addGenerationBatch) {
                    await state.addGenerationBatch({
                        id: batchId, creatorId: state.currentUser?.id || '', tenantId: state.currentUser?.tenantId || MOCK_TENANT_ID,
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
                        id: uuidv4(), tenantId: state.currentUser?.tenantId || MOCK_TENANT_ID, ownerId: state.currentUser?.id || 'sys',
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

    return {
        step, setStep,
        builderMode, setBuilderMode,
        config, setConfig,
        gradingConfig, setGradingConfig,
        coverConfig, setCoverConfig,
        smartCriteria, setSmartCriteria,
        selectedItems, setSelectedItems,
        isGenerating,
        isFillingGaps,
        selectionDiagnosis,
        currentBatchId, setCurrentBatchId,
        currentBatchItems, setCurrentBatchItems,
        isReviewingBatch, setIsReviewingBatch,
        isReviewingExam, setIsReviewingExam,
        showBatchHistory, setShowBatchHistory,
        isSaving,
        showRecommendations, setShowRecommendations,
        logisticsStatus,
        isHandoffRunning,
        wizardTelemetry,
        handleSave,
        toggleItem,
        handleSmartGenerate,
        handleGapGeneration,
        handleBatchImport,
        csvImportRef,
        state,
        navigate,
        prediction
    };
};
