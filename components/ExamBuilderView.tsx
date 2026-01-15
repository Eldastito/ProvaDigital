import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Brain, Sparkles, AlertCircle, Trash2, Edit3, Check, X,
    ChevronLeft, ArrowRight, Tablet, Loader2, Save, History, ShieldCheck,
    Settings2, BarChart, ChevronRight, Info, GripVertical, PlusCircle, Trash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppState, Exam, Item, ExamModel, ExamStatus, QuestionType, DifficultyLevel, ItemOrigin } from '../types';
import { Badge } from './ui/Badge';
import { uuidv4 } from '../utils/helpers';
import { useSafeAppStore } from '../store/useAppStore';
import { translateDifficultyLevel } from '../utils/translations';
import { smartSelectItems, ExamCriteria } from '../services/examService';
// - [x] Criar `services/examService.ts` com algoritmos de seleção
// - [x] Adicionar modo "Montagem Inteligente" no `ExamBuilderView.tsx`
// - [x] Implementar painel de critérios (Dificuldade, BNCC, Qtd)
// - [x] Integrar geração via IA para "Gaps" no banco de itens
// - [ ] Validar equilíbrio pedagógico e exportação PDF
import { generateQuestionsFromText, reviewExamAdvanced } from '../services/geminiService';
import { BatchReviewPanel } from './OnlineExam/BatchReviewPanel';
import { AdvancedReviewPipeline } from './OnlineExam/AdvancedReviewPipeline';
import { ItemLifecycleStatus } from '../types';

// --- Types for Cover Sections ---
type CoverSectionType = 'text' | 'distribution';

interface CoverSection {
    id: string;
    title: string;
    type: CoverSectionType;
    content?: string; // For text type
    distribution?: {  // For distribution type
        groups: {
            name: string; // e.g. "Conhecimentos Básicos"
            items: {
                subject: string; // e.g. "Português"
                range: string;   // e.g. "1 a 10"
                points: string;  // e.g. "1,0"
            }[];
        }[];
    };
}

export const ExamBuilderView = () => {
    const navigate = useNavigate();
    const state = useSafeAppStore();
    const { addExam, addItem, addItems } = state;
    const [step, setStep] = useState(1); // 1: Config, 2: Selection, 3: Grading & Cover
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
        instructions: string; // Deprecated but kept for type safety until full cleanup
        securityNotices: string; // Deprecated
    }>({
        title: '',
        instructions: '',
        securityNotices: '',
        sections: [
            {
                id: '1',
                type: 'text',
                title: 'INSTRUÇÕES GERAIS',
                content: `01 - O candidato recebeu do fiscal o seguinte material:\na) este CADERNO DE QUESTÕES, com o enunciado das questões objetivas, sem repetição ou falha.`
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
                content: 'É proibido o uso de calculadoras, relógios digitais e equipamentos eletrônicos.\nA violação destas regras implicará na desclassificação imediata.'
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
    const [filter, setFilter] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFillingGaps, setIsFillingGaps] = useState(false);
    const [selectionDiagnosis, setSelectionDiagnosis] = useState<any>(null);
    const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
    const [currentBatchItems, setCurrentBatchItems] = useState<Item[]>([]);
    const [isReviewingBatch, setIsReviewingBatch] = useState(false);
    const [isReviewingExam, setIsReviewingExam] = useState(false);
    const [showBatchHistory, setShowBatchHistory] = useState(false);

    // Preview State for "Tablet Simulator"
    const [previewIndex, setPreviewIndex] = useState(0);

    const [isSaving, setIsSaving] = useState(false);

    // --- PERSISTENCE & AUTO-SAVE ---
    useEffect(() => {
        const key = `exam_builder_draft_${state.currentUser?.id}`;
        const draft = localStorage.getItem(key);
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                // Only ask if meaningful data exists
                if (parsed.config?.title || parsed.selectedItems?.length > 0) {
                    if (confirm('⚠️ Encontramos um rascunho de prova não salvo. Deseja restaurar onde parou?')) {
                        setConfig(parsed.config);
                        setSelectedItems(parsed.selectedItems || []);
                        setStep(parsed.step || 1);
                        if (parsed.gradingConfig) setGradingConfig(parsed.gradingConfig);
                        if (parsed.coverConfig) {
                            // Safe restore: Ensure sections exist if restoring from legacy draft
                            setCoverConfig(prev => {
                                const restored = parsed.coverConfig;
                                if (!restored.sections) {
                                    // Migration: Legacy -> Sections
                                    return {
                                        ...prev,
                                        title: restored.title || prev.title,
                                        instructions: restored.instructions || prev.instructions,
                                        securityNotices: restored.securityNotices || prev.securityNotices
                                    };
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
            updatedAt: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(draft));
    }, [config, selectedItems, step, gradingConfig, coverConfig, state.currentUser?.id]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if ((config.title || selectedItems.length > 0) && !isSaving) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [config.title, selectedItems.length, isSaving]);

    const handleSave = async (publish = false) => {
        if (!config.title) return alert('Título obrigatório');
        if (selectedItems.length === 0) return alert('Selecione ao menos 1 questão');

        setIsSaving(true);
        try {
            const examId = uuidv4();
            const versionId = uuidv4();

            // Calculate individual item weights
            const itemsWithWeights = selectedItems.map((item, idx) => {
                const subjectItems = selectedItems.filter(i => i.subject === item.subject);
                const totalPointsForSubject = gradingConfig.totalsByDiscipline[item.subject] || 10.0;
                const itemWeight = totalPointsForSubject / subjectItems.length;

                return {
                    itemId: item.id,
                    weight: itemWeight,
                    position: idx + 1
                };
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
                items: itemsWithWeights.map(i => ({
                    itemId: i.itemId,
                    order: i.position,
                    customScore: i.weight
                })),
                classIds: [],
                shuffleItems: config.shuffleItems,
                createdAt: new Date().toISOString(),
                maxScore: Object.values(gradingConfig.totalsByDiscipline).length > 0
                    ? (Object.values(gradingConfig.totalsByDiscipline) as number[]).reduce((a, b) => a + b, 0)
                    : selectedItems.length * 1.0
            };

            // 1. Save standard Exam (Legacy compat)
            await addExam(newExam);

            // 2. Save Phase 2 Version
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

            // If not returning ID for chaining, navigate standardly
            if (!publish) {
                alert('Prova salva como rascunho!');
                navigate('/exams');
            }

            return examId;
        } catch (error: any) {
            console.error(error);
            alert('Erro ao salvar prova: ' + (error.message || 'Erro desconhecido. Verifique o console.'));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleItem = (item: Item) => {
        // Strict Duplicate Check (ID based)
        const exists = selectedItems.find(i => i.id === item.id);

        if (exists) {
            // Remove (Toggle OFF)
            const newItems = selectedItems.filter(i => i.id !== item.id);
            setSelectedItems(newItems);
            if (previewIndex >= newItems.length && newItems.length > 0) {
                setPreviewIndex(newItems.length - 1);
            }
        } else {
            // Add (Toggle ON) - Check for content duplication logic if needed?
            // For now, strict ID check is sufficient as per "Questão repetida na mesma prova".
            // Double safety: Ensure ID isn't somehow already in list (though find covers it)
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleSmartGenerate = () => {
        if (!state.items || state.items.length === 0) {
            return alert("O banco de questões está vazio ou ainda carregando. Por favor, aguarde a sincronização.");
        }

        const result = smartSelectItems({
            ...smartCriteria,
            subject: config.subject || smartCriteria.subject
        }, state.items);

        setSelectedItems(result.selectedItems);
        setSelectionDiagnosis(result);
        if (result.selectedItems.length > 0) {
            setStep(2);
        } else {
            alert("Nenhum item encontrado no banco para estes critérios.");
        }
    };

    const handleGapGeneration = async () => {
        if (!selectionDiagnosis || selectionDiagnosis.missingCount <= 0) return;

        setIsFillingGaps(true);
        try {
            const batchId = uuidv4();
            const promptContext = `Crie questões sobre ${config.subject || smartCriteria.subject}. 
            Habilidades desejadas: ${smartCriteria.bnccCodes?.join(', ') || 'Geral'}. 
            Foco em preencher as seguintes lacunas: ${JSON.stringify(selectionDiagnosis.unmetBnccCodes)}`;

            const generated = await generateQuestionsFromText(
                promptContext,
                selectionDiagnosis.missingCount,
                QuestionType.MULTIPLE_CHOICE,
                DifficultyLevel.MEDIUM,
                config.subject || smartCriteria.subject
            );

            if (generated) {
                const newItems: Item[] = generated.map(g => ({
                    id: uuidv4(),
                    tenantId: state.currentUser?.tenantId || 't1',
                    ownerId: state.currentUser?.id || 'sys',
                    knowledgeArea: 'Geral',
                    subject: config.subject || smartCriteria.subject,
                    type: QuestionType.MULTIPLE_CHOICE,
                    statement: g.statement,
                    alternatives: g.alternatives.map(a => ({ id: uuidv4(), ...a })),
                    correctAnswerJustification: g.justification,
                    difficulty: g.difficulty as DifficultyLevel,
                    score: 1.0,
                    origin: ItemOrigin.IA,
                    tags: ['IA', 'Gerador de Provas'],
                    bnccCode: g.bnccCode,
                    usageCount: 0,
                    generationBatchId: batchId,
                    lifecycleStatus: ItemLifecycleStatus.DRAFT,
                    createdAt: new Date().toISOString()
                }));

                // Registra o lote no store/db
                if (state.addGenerationBatch) {
                    await state.addGenerationBatch({
                        id: batchId,
                        creatorId: state.currentUser?.id || '',
                        tenantId: state.currentUser?.tenantId || 't1',
                        promptContext,
                        totalRequested: selectionDiagnosis.missingCount,
                        createdAt: new Date().toISOString()
                    });
                }

                // Adiciona itens ao banco (como DRAFT)
                await addItems(newItems);

                setCurrentBatchId(batchId);
                setCurrentBatchItems(newItems);
                setIsReviewingBatch(true);

                // Note: O diagnóstico não zera aqui, zera só quando o usuário aprovar e os itens entrarem na prova
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar questões via IA.");
        } finally {
            setIsFillingGaps(false);
        }
    };

    const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'APPROVED' | 'DRAFT' | 'ALL'>('ALL');

    const filteredAvailableItems = state.items.filter(i => {
        const iStatement = i.statement || '';
        const iSubject = i.subject || '';
        const filterStr = filter.toLowerCase();

        const matchesSearch = iStatement.toLowerCase().includes(filterStr) ||
            iSubject.toLowerCase().includes(filterStr);
        const matchesDiff = difficultyFilter === 'ALL' || i.difficulty === difficultyFilter;
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'APPROVED' ? i.lifecycleStatus === ItemLifecycleStatus.APPROVED : i.lifecycleStatus === ItemLifecycleStatus.DRAFT);
        const notSelected = !selectedItems.find(s => s.id === i.id);

        // [NEW] Step 2 Enforcement: Filter by Config Subject
        const matchesConfigSubject = !config.subject || iSubject.toLowerCase() === (config.subject || '').toLowerCase();

        return matchesSearch && matchesDiff && matchesStatus && notSelected && matchesConfigSubject;
    });

    const currentPreviewItem = selectedItems[previewIndex];

    // --- Recommendation Logic ---
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [recommendedItems, setRecommendedItems] = useState<any[]>([]);
    const [loadingRecs, setLoadingRecs] = useState(false);

    const handleGetRecommendations = async () => {
        setLoadingRecs(true);
        setShowRecommendations(true);
        try {
            // Import dynamically to avoid circular dependencies if any
            const { getRecommendedItems } = await import('../services/recommendationService');

            const recs = await getRecommendedItems({
                subject: config.subject || 'Geral',
                gradeLevel: 8 // Mock grade, in real app get from class selection
            }, state);

            setRecommendedItems(recs);
        } catch (error) {
            console.error("Failed to get recs:", error);
            alert("Erro ao buscar recomendações da IA.");
        } finally {
            setLoadingRecs(false);
        }
    };

    const addRecommendedItem = async (item: any) => {
        if (!state.items.find(i => i.id === item.id)) {
            await addItem(item);
        }
        toggleItem(item);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-brand-primary flex flex-col h-[calc(100vh-120px)]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Montar Prova</h2>
                    <p className="text-sm text-slate-500">Passo {step} de 2: {step === 1 ? 'Configurações' : 'Seleção e Revisão'}</p>
                </div>
                <div className="flex gap-3">
                    {step === 2 && <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Voltar</button>}
                    <button onClick={() => navigate('/exams')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                {step === 1 ? (
                    <div className="flex gap-8 h-[80vh]">
                        {/* LEFT: Configuration Form */}
                        <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto space-y-6">
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Configuração da Prova</h3>
                                <p className="text-sm text-slate-500">Defina os metadados e a aparência da capa.</p>
                            </div>

                            {/* Mode Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setBuilderMode('MANUAL')}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${builderMode === 'MANUAL' ? 'border-brand-primary bg-brand-light/50 ring-2 ring-brand-primary/20' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <Settings2 size={20} className={builderMode === 'MANUAL' ? 'text-brand-primary' : 'text-slate-400'} />
                                    <div className="text-center">
                                        <div className="font-bold text-slate-900 text-xs">Manual</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setBuilderMode('SMART')}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${builderMode === 'SMART' ? 'border-brand-primary bg-brand-light/50 ring-2 ring-brand-primary/20' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <Sparkles size={20} className={builderMode === 'SMART' ? 'text-brand-primary' : 'text-slate-400'} />
                                    <div className="text-center">
                                        <div className="font-bold text-slate-900 text-xs">Inteligente (IA)</div>
                                    </div>
                                </button>
                            </div>

                            {/* Essential Metadata */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Título da Prova <span className="text-rose-500">*</span></label>
                                    <input
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-slate-800"
                                        value={config.title}
                                        onChange={e => {
                                            setConfig({ ...config, title: e.target.value });
                                            setCoverConfig({ ...coverConfig, title: e.target.value }); // Sync cover title
                                        }}
                                        placeholder="Ex: Avaliação de História - 1º Bimestre"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Disciplina <span className="text-rose-500">*</span></label>
                                        <input
                                            className="w-full border rounded-lg p-2"
                                            value={config.subject}
                                            onChange={e => {
                                                setConfig({ ...config, subject: e.target.value });
                                                setSmartCriteria({ ...smartCriteria, subject: e.target.value });
                                            }}
                                            placeholder="Ex: História"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Duração (min)</label>
                                        <input type="number" className="w-full border rounded-lg p-2" value={config.duration} onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                            </div>

                            {/* Cover Sections Editor (New Pattern) */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-brand-primary" /> Seções da Capa
                                    </h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCoverConfig(prev => ({
                                                ...prev,
                                                sections: [...prev.sections, { id: Math.random().toString(), type: 'text', title: 'NOVA SEÇÃO', content: '' }]
                                            }))}
                                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition"
                                        >
                                            + Texto
                                        </button>
                                        <button
                                            onClick={() => setCoverConfig(prev => ({
                                                ...prev,
                                                sections: [...prev.sections, {
                                                    id: Math.random().toString(),
                                                    type: 'distribution',
                                                    title: 'QUADRO DE QUESTÕES',
                                                    distribution: { groups: [{ name: "GRUPO 1", items: [{ subject: "Matéria", range: "1-10", points: "1.0" }] }] }
                                                }]
                                            }))}
                                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition"
                                        >
                                            + Quadro
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {coverConfig.sections.map((section, index) => (
                                        <div key={section.id} className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                                            {/* Header */}
                                            <div className="bg-slate-100 p-2 flex items-center gap-2 border-b border-slate-200">
                                                <GripVertical size={14} className="text-slate-400 cursor-move" />
                                                <input
                                                    className="bg-transparent border-none text-xs font-bold text-slate-700 uppercase focus:ring-0 p-0 w-full"
                                                    value={section.title}
                                                    onChange={e => {
                                                        const newSections = [...coverConfig.sections];
                                                        newSections[index].title = e.target.value;
                                                        setCoverConfig({ ...coverConfig, sections: newSections });
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newSections = coverConfig.sections.filter((_, i) => i !== index);
                                                        setCoverConfig({ ...coverConfig, sections: newSections });
                                                    }}
                                                    className="text-slate-400 hover:text-rose-500"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            </div>

                                            {/* Body */}
                                            <div className="p-3">
                                                {section.type === 'text' ? (
                                                    <textarea
                                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs h-20 focus:ring-1 focus:ring-brand-primary outline-none resize-none"
                                                        value={section.content}
                                                        onChange={e => {
                                                            const newSections = [...coverConfig.sections];
                                                            newSections[index].content = e.target.value;
                                                            setCoverConfig({ ...coverConfig, sections: newSections });
                                                        }}
                                                        placeholder="Digite o conteúdo da seção..."
                                                    />
                                                ) : (
                                                    /* Distribution Table Editor */
                                                    <div className="space-y-4">
                                                        {section.distribution?.groups.map((group, gIdx) => (
                                                            <div key={gIdx} className="bg-white border border-slate-200 rounded-lg p-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <input
                                                                        className="flex-1 text-xs font-bold border-b border-dashed border-slate-300 focus:border-brand-primary outline-none pb-1"
                                                                        value={group.name}
                                                                        onChange={e => {
                                                                            const newSections = [...coverConfig.sections];
                                                                            if (newSections[index].distribution) {
                                                                                newSections[index].distribution!.groups[gIdx].name = e.target.value;
                                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                                            }
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            const newSections = [...coverConfig.sections];
                                                                            if (newSections[index].distribution) {
                                                                                newSections[index].distribution!.groups.splice(gIdx, 1);
                                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                                            }
                                                                        }}
                                                                        className="text-rose-400 hover:text-rose-600"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                                {/* Columns */}
                                                                <div className="space-y-2">
                                                                    {group.items.map((item, iIdx) => (
                                                                        <div key={iIdx} className="grid grid-cols-6 gap-2 items-center">
                                                                            <input className="col-span-3 text-[10px] border rounded p-1" placeholder="Matéria" value={item.subject} onChange={e => {
                                                                                const newSections = [...coverConfig.sections];
                                                                                newSections[index].distribution!.groups[gIdx].items[iIdx].subject = e.target.value;
                                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                                            }} />
                                                                            <input className="col-span-1 text-[10px] border rounded p-1" placeholder="Ex: 1-10" value={item.range} onChange={e => {
                                                                                const newSections = [...coverConfig.sections];
                                                                                newSections[index].distribution!.groups[gIdx].items[iIdx].range = e.target.value;
                                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                                            }} />
                                                                            <input className="col-span-1 text-[10px] border rounded p-1" placeholder="Pts" value={item.points} onChange={e => {
                                                                                const newSections = [...coverConfig.sections];
                                                                                newSections[index].distribution!.groups[gIdx].items[iIdx].points = e.target.value;
                                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                                            }} />
                                                                            <button onClick={() => {
                                                                                const newSections = [...coverConfig.sections];
                                                                                newSections[index].distribution!.groups[gIdx].items.splice(iIdx, 1);
                                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                                            }} className="text-slate-300 hover:text-rose-500 justify-self-center"><X size={12} /></button>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => {
                                                                            const newSections = [...coverConfig.sections];
                                                                            newSections[index].distribution!.groups[gIdx].items.push({ subject: "", range: "", points: "" });
                                                                            setCoverConfig({ ...coverConfig, sections: newSections });
                                                                        }}
                                                                        className="w-full text-[10px] text-slate-400 hover:text-brand-primary border border-dashed border-slate-200 rounded p-1 mt-2"
                                                                    >
                                                                        + Adicionar Matéria
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                const newSections = [...coverConfig.sections];
                                                                newSections[index].distribution!.groups.push({ name: "NOVO GRUPO", items: [] });
                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                            }}
                                                            className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:border-brand-primary hover:text-brand-primary transition"
                                                        >
                                                            + Adicionar Grupo de Colunas
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Model Config */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                                    <select className="w-full border rounded-lg p-2 bg-slate-50" value={config.model} onChange={e => setConfig({ ...config, model: e.target.value as ExamModel })}>
                                        <option value="SOMATIVO">Somativo (Nota)</option>
                                        <option value="ADAPTADO">Adaptado (Flexível)</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <div className="flex items-center justify-between w-full p-2 bg-amber-50 rounded-lg border border-amber-100">
                                        <div className="text-xs text-amber-800 font-bold flex items-center gap-2"><Brain size={14} /> Embaralhar Itens</div>
                                        <input
                                            type="checkbox"
                                            checked={config.shuffleItems}
                                            onChange={e => setConfig({ ...config, shuffleItems: e.target.checked })}
                                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={() => {
                                        if (!config.title || !config.subject) return alert("Preencha Título e Disciplina");
                                        if (builderMode === 'SMART') {
                                            handleSmartGenerate();
                                        } else {
                                            setStep(2);
                                        }
                                    }}
                                    className="btn-gradient w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                                >
                                    {builderMode === 'SMART' ? <><Sparkles size={20} /> Gerar Prova</> : <>Selecionar Questões <ChevronRight size={20} /></>}
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: Tablet Simulator (Cover Preview) */}
                        <div className="w-[480px] flex flex-col items-center justify-center bg-slate-100 rounded-3xl p-8 border-4 border-white shadow-inner">
                            <div className="mb-4 flex items-center gap-2 opacity-50">
                                <Tablet size={20} /> <span className="font-bold text-xs uppercase tracking-widest">Preview do Aluno</span>
                            </div>

                            {/* Device Frame */}
                            <div className="w-full h-[600px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl relative ring-4 ring-slate-900/50">
                                {/* Screen */}
                                <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden flex flex-col relative text-slate-800">
                                    {/* App Bar */}
                                    <div className="bg-brand-primary h-14 flex items-center justify-center shadow-md z-10">
                                        <div className="font-black text-white text-lg tracking-tight">ExamePad</div>
                                    </div>

                                    {/* Content Scroll */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                                        {/* Exam Card */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                                            <div className="w-12 h-12 bg-brand-light text-brand-primary rounded-xl flex items-center justify-center mb-2">
                                                <Brain size={28} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{config.subject || 'Disciplina'}</div>
                                                <h2 className="text-xl font-black text-slate-900 leading-tight">{config.title || 'Título da Prova'}</h2>
                                            </div>
                                            <div className="flex gap-3 text-xs font-bold text-slate-500">
                                                <span className="bg-slate-100 px-2 py-1 rounded">⏱️ {config.duration} min</span>
                                                <span className="bg-slate-100 px-2 py-1 rounded">📅 {new Date().toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Dynamic Cover Sections Preview */}
                                        <div className="space-y-6">
                                            {coverConfig.sections.map((section, idx) => (
                                                <div key={section.id} className="space-y-2">
                                                    <h3 className="text-center font-bold text-slate-900 uppercase tracking-widest text-[10px]">
                                                        {section.title}
                                                    </h3>

                                                    {section.type === 'text' ? (
                                                        <div className="text-[10px] text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-200 whitespace-pre-line text-justify">
                                                            {section.content}
                                                        </div>
                                                    ) : (
                                                        /* Table Preview */
                                                        <div className="border border-slate-800 rounded bg-white overflow-hidden text-[9px]">
                                                            <div className="flex border-b border-slate-800 bg-slate-100">
                                                                {section.distribution?.groups.map((group, i) => (
                                                                    <div key={i} className={`flex-1 text-center py-1 font-bold uppercase border-r border-slate-800 last:border-r-0`}>
                                                                        {group.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="flex">
                                                                {section.distribution?.groups.map((group, i) => (
                                                                    <div key={i} className="flex-1 border-r border-slate-800 last:border-r-0">
                                                                        <div className="grid grid-cols-12 border-b border-slate-800 bg-slate-50 font-bold text-[8px]">
                                                                            <div className="col-span-6 p-1 border-r border-slate-300">DISCIPLINA</div>
                                                                            <div className="col-span-3 p-1 text-center border-r border-slate-300">QTD</div>
                                                                            <div className="col-span-3 p-1 text-center">PTS</div>
                                                                        </div>
                                                                        {group.items.map((item, ii) => (
                                                                            <div key={ii} className="grid grid-cols-12 border-b border-slate-200 last:border-b-0">
                                                                                <div className="col-span-6 p-1 truncate border-r border-slate-200 font-medium">{item.subject || '-'}</div>
                                                                                <div className="col-span-3 p-1 text-center border-r border-slate-200">{item.range || '-'}</div>
                                                                                <div className="col-span-3 p-1 text-center">{item.points || '-'}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Button */}
                                    <div className="p-4 bg-white border-t border-slate-100">
                                        <div className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-center shadow-lg opacity-50 cursor-not-allowed text-sm">
                                            Iniciar Prova
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isReviewingExam ? (
                    <AdvancedReviewPipeline
                        items={selectedItems}
                        onCancel={() => setIsReviewingExam(false)}
                        onComplete={async (polished, summary) => {
                            setSelectedItems(polished);
                            setIsReviewingExam(false);
                            // NOTE: Variants and versions will be created in handleSave to ensure examId exists.
                            // We can store the summary if needed, but for now we trust the polished items are enough.
                            if (summary.variantsSuggested.length > 0) {
                                alert("Revisão concluída! Variantes serão geradas ao salvar a prova.");
                                // Store variants in temporary state/ref if implemented, or re-generate on save.
                                // For now, we proceed with manual save flow.
                            }
                        }}
                    />
                ) : isReviewingBatch ? (
                    <BatchReviewPanel
                        batchId={currentBatchId || ''}
                        items={currentBatchItems}
                        onFinish={() => {
                            setIsReviewingBatch(false);
                            if (builderMode === 'SMART') {
                                handleSmartGenerate();
                            }
                        }}
                    />
                ) : showBatchHistory ? (
                    <div className="flex flex-col bg-white rounded-2xl p-6 h-full overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Sparkles className="text-brand-secondary" /> Histórico de Lotes Gerados
                            </h3>
                            <button onClick={() => setShowBatchHistory(false)} className="text-sm font-bold text-slate-500">Voltar</button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {state.itemGenerationBatches.length > 0 ? (
                                state.itemGenerationBatches.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => {
                                            const batchItems = state.items.filter(i => i.generationBatchId === b.id);
                                            setCurrentBatchId(b.id);
                                            setCurrentBatchItems(batchItems);
                                            setIsReviewingBatch(true);
                                            setShowBatchHistory(false);
                                        }}
                                        className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-brand-primary transition group"
                                    >
                                        <div className="font-bold text-slate-900 group-hover:text-brand-primary transition">{b.promptContext}</div>
                                        <div className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
                                            {new Date(b.createdAt).toLocaleDateString()} • {b.totalRequested} Questões
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-20 text-slate-400 italic">Nenhum lote de geração por IA encontrado.</div>
                            )}
                        </div>
                    </div>
                ) : step === 2 ? (
                    /* STEP 2: Selection & Preview */
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
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => {
                                                state.loadGenerationBatches();
                                                setShowBatchHistory(true);
                                            }}
                                            className="text-white/80 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-white/20 hover:bg-white/10 transition"
                                        >Recuperar Lotes IA</button>
                                        <button
                                            onClick={handleGapGeneration}
                                            disabled={isFillingGaps}
                                            className="bg-rose-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-700 transition flex items-center gap-2 shadow-sm"
                                        >
                                            {isFillingGaps ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            Gerar Questões Inéditas via IA
                                        </button>
                                    </div>
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
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    <button
                                        onClick={() => setDifficultyFilter('ALL')}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${difficultyFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >TODOS</button>
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
                                    <button
                                        onClick={handleGetRecommendations}
                                        className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition border ${showRecommendations ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-600'}`}
                                    >
                                        <Plus size={16} className={showRecommendations ? 'rotate-45 transition' : ''} />
                                        {showRecommendations ? 'Fechar IA' : 'Sugestões IA'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {(builderMode === 'SMART' ? (state.items.filter(i => selectedItems.find(s => s.id === i.id) || (i.generationBatchId === currentBatchId && i.lifecycleStatus === ItemLifecycleStatus.APPROVED))) : filteredAvailableItems).map(item => (
                                    <div key={item.id} className={`p-3 border rounded-lg cursor-pointer group transition-all hover:shadow-sm ${selectedItems.find(s => s.id === item.id) ? 'border-brand-primary bg-brand-light/20' : 'border-slate-200 bg-white hover:border-brand-primary text-slate-400'}`} onClick={() => toggleItem(item)}>
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
                                <button onClick={() => handleSave(false)} className="py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 transition shadow-sm">Rascunho</button>
                                <button onClick={() => setIsReviewingExam(true)} className="py-3 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg font-bold text-sm hover:bg-purple-100 transition shadow-sm flex items-center justify-center gap-2">
                                    <ShieldCheck size={18} /> Revisar IA
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={selectedItems.length === 0}
                                    className="btn-gradient py-3 rounded-lg font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                                >
                                    Configurar Capa <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* STEP 3: Grading and Cover */
                    /* STEP 3: Review & Grading */
                    <div className="max-w-4xl mx-auto space-y-8 pb-12">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            <div className="border-b pb-6 mb-6">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Check className="text-emerald-500" size={24} /> Revisão Final e Pontuação
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">Confira os dados da prova e defina a pontuação antes de publicar.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                                {/* Summary */}
                                <div className="space-y-6">
                                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Resumo da Prova</h4>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Título</div>
                                            <div className="font-bold text-slate-800">{config.title}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Disciplina</div>
                                                <div className="font-bold text-slate-800">{config.subject}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Duração</div>
                                                <div className="font-bold text-slate-800">{config.duration} min</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Questões</div>
                                            <div className="font-bold text-slate-800">{selectedItems.length} itens selecionados</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scoring */}
                                <div className="space-y-6">
                                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Configuração de Notas</h4>

                                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-bold text-slate-700">Nota Máxima da Prova</span>
                                                <span className="font-bold text-brand-primary">10.0</span>
                                            </div>
                                            <input
                                                type="number"
                                                className="w-full border rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none"
                                                defaultValue={10}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setGradingConfig(prev => ({
                                                        ...prev,
                                                        totalsByDiscipline: { ...prev.totalsByDiscipline, [config.subject]: val }
                                                    }));
                                                }}
                                            />
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 border border-blue-100 flex items-center gap-2">
                                            <Info size={16} />
                                            <span>
                                                Cada questão valerá aproximadamente <b>{(10 / (selectedItems.length || 1)).toFixed(2)}</b> pontos.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex items-center gap-4 pt-8 border-t border-slate-100">
                                <button onClick={() => setStep(2)} className="px-6 py-3 rounded-lg border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition">
                                    Voltar
                                </button>
                                <div className="flex-1"></div>
                                <button onClick={() => handleSave(false)} className="px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition">
                                    Salvar Rascunho
                                </button>

                                <button
                                    onClick={() => handleSave(true)}
                                    className="bg-brand-primary text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-brand-dark transition flex items-center gap-2"
                                >
                                    <Save size={18} /> Publicar Normal
                                </button>

                                {/* Premium Crypto Button */}
                                <button
                                    onClick={async () => {
                                        if (!confirm("Isso irá criptografar a prova com uma chave única (AES-256). Deseja continuar?")) return;
                                        const id = await handleSave(true);
                                        if (id) {
                                            setIsSaving(true);
                                            try {
                                                await state.sealExam(id);
                                                navigate('/exams');
                                            } catch (e) {
                                                alert("Erro ao criptografar prova");
                                                setIsSaving(false);
                                            }
                                        }
                                    }}
                                    disabled={isSaving}
                                    className={`bg-slate-900 text-amber-400 px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-black border border-amber-500/30 transition-all ${isSaving ? 'opacity-75 cursor-wait' : ''}`}
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                                    Publicar & Criptografar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
