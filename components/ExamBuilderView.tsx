import React, { useState } from 'react';
import {
    Plus, Search, Brain, Sparkles, AlertCircle, Trash2, Edit3, Check, X,
    ChevronLeft, ArrowRight, Tablet, Loader2, Save, History, ShieldCheck,
    Settings2, BarChart, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppState, Exam, Item, ExamModel, ExamStatus, QuestionType, DifficultyLevel, ItemOrigin } from '../types';
import { Badge } from './ui/Badge';
import { uuidv4 } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';
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

export const ExamBuilderView = () => {
    const navigate = useNavigate();
    const state = useAppStore();
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
    const [isReviewingBatch, setIsReviewingBatch] = useState(false);
    const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
    const [currentBatchItems, setCurrentBatchItems] = useState<Item[]>([]);
    const [isReviewingExam, setIsReviewingExam] = useState(false);

    // Preview State for "Tablet Simulator"
    const [previewIndex, setPreviewIndex] = useState(0);

    const handleSave = (publish = false) => {
        if (!config.title) return alert('Título obrigatório');
        if (selectedItems.length === 0) return alert('Selecione ao menos 1 questão');

        const newExam: Exam = {
            id: uuidv4(),
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
            items: selectedItems.map((item, idx) => ({
                itemId: item.id,
                order: idx + 1,
                customScore: item.score
            })),
            classIds: [],
            shuffleItems: config.shuffleItems,
            createdAt: new Date().toISOString()
        };
        addExam(newExam);
        navigate('/exams');
    };

    const toggleItem = (item: Item) => {
        if (selectedItems.find(i => i.id === item.id)) {
            const newItems = selectedItems.filter(i => i.id !== item.id);
            setSelectedItems(newItems);
            if (previewIndex >= newItems.length && newItems.length > 0) {
                setPreviewIndex(newItems.length - 1);
            }
        } else {
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

    const filteredAvailableItems = state.items.filter(i =>
        !selectedItems.find(s => s.id === i.id) &&
        (i.statement.toLowerCase().includes(filter.toLowerCase()) || i.subject.toLowerCase().includes(filter.toLowerCase()))
    );

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
                    <div className="max-w-2xl mx-auto space-y-6 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                        {/* ... Existing Step 1 Form ... */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => setBuilderMode('MANUAL')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${builderMode === 'MANUAL' ? 'border-brand-primary bg-brand-light/50 ring-2 ring-brand-primary/20' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <Settings2 size={24} className={builderMode === 'MANUAL' ? 'text-brand-primary' : 'text-slate-400'} />
                                <div className="text-center">
                                    <div className="font-bold text-slate-900 text-sm">Montagem Manual</div>
                                    <div className="text-[10px] text-slate-500">Escolha questão por questão</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setBuilderMode('SMART')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${builderMode === 'SMART' ? 'border-brand-primary bg-brand-light/50 ring-2 ring-brand-primary/20' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <Sparkles size={24} className={builderMode === 'SMART' ? 'text-brand-primary' : 'text-slate-400'} />
                                <div className="text-center">
                                    <div className="font-bold text-slate-900 text-sm">Montagem Inteligente</div>
                                    <div className="text-[10px] text-slate-500">Geração equilibrada por IA</div>
                                </div>
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título da Prova</label>
                            <input className="w-full border rounded-lg p-2" value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} placeholder="Ex: Avaliação Bimestral de História" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Disciplina</label>
                                <input className="w-full border rounded-lg p-2" value={config.subject || smartCriteria.subject} onChange={e => {
                                    setConfig({ ...config, subject: e.target.value });
                                    setSmartCriteria({ ...smartCriteria, subject: e.target.value });
                                }} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Duração (minutos)</label>
                                <input type="number" className="w-full border rounded-lg p-2" value={config.duration} onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })} />
                            </div>
                        </div>

                        {builderMode === 'SMART' && (
                            <div className="animate-in slide-in-from-bottom-4 space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm mb-2">
                                    <BarChart size={18} /> Critérios de Seleção Inteligente
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qtd de Questões</label>
                                        <input type="number" className="w-full border rounded-lg p-2 font-bold" value={smartCriteria.targetCount} onChange={e => setSmartCriteria({ ...smartCriteria, targetCount: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Distribuição de Dificuldade</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <input type="number" className="w-full border rounded-lg p-1 text-xs text-center border-emerald-200" value={smartCriteria.difficultyDistribution[DifficultyLevel.EASY]} onChange={e => setSmartCriteria({ ...smartCriteria, difficultyDistribution: { ...smartCriteria.difficultyDistribution, [DifficultyLevel.EASY]: parseInt(e.target.value) } })} />
                                                <div className="text-[8px] text-center text-emerald-600 font-bold mt-1">FÁCIL %</div>
                                            </div>
                                            <div className="flex-1">
                                                <input type="number" className="w-full border rounded-lg p-1 text-xs text-center border-amber-200" value={smartCriteria.difficultyDistribution[DifficultyLevel.MEDIUM]} onChange={e => setSmartCriteria({ ...smartCriteria, difficultyDistribution: { ...smartCriteria.difficultyDistribution, [DifficultyLevel.MEDIUM]: parseInt(e.target.value) } })} />
                                                <div className="text-[8px] text-center text-amber-600 font-bold mt-1">MÉDIO %</div>
                                            </div>
                                            <div className="flex-1">
                                                <input type="number" className="w-full border rounded-lg p-1 text-xs text-center border-rose-200" value={smartCriteria.difficultyDistribution[DifficultyLevel.HARD]} onChange={e => setSmartCriteria({ ...smartCriteria, difficultyDistribution: { ...smartCriteria.difficultyDistribution, [DifficultyLevel.HARD]: parseInt(e.target.value) } })} />
                                                <div className="text-[8px] text-center text-rose-600 font-bold mt-1">DIFÍCIL %</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo de Avaliação</label>
                            <select className="w-full border rounded-lg p-2" value={config.model} onChange={e => setConfig({ ...config, model: e.target.value as ExamModel })}>
                                <option value="SOMATIVO">Somativo</option>
                                <option value="ADAPTADO">Adaptado</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição/Instruções</label>
                            <textarea className="w-full border rounded-lg p-2 h-24" value={config.description} onChange={e => setConfig({ ...config, description: e.target.value })} />
                        </div>
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                    <Brain size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900">Segurança Anti-Cola</h4>
                                    <p className="text-xs text-amber-700">Embaralhar ordem das questões aleatoriamente para cada aluno.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, shuffleItems: !config.shuffleItems })}
                                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${config.shuffleItems ? 'bg-amber-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.shuffleItems ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="flex justify-end pt-4">
                            {builderMode === 'MANUAL' ? (
                                <button onClick={() => setStep(2)} className="btn-gradient px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg">
                                    Próximo: Selecionar Questões <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button onClick={handleSmartGenerate} className="bg-brand-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg hover:bg-brand-dark transition">
                                    <Sparkles size={18} /> Gerar Prova Inteligente <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ) : isReviewingExam ? (
                    <AdvancedReviewPipeline
                        items={selectedItems}
                        onCancel={() => setIsReviewingExam(false)}
                        onComplete={async (polished, summary) => {
                            // Atualiza os itens com a versão polida se necessário
                            setSelectedItems(polished);
                            setIsReviewingExam(false);

                            // Cria uma nova versão da prova (snapshot)
                            if (state.addExamVersion && summary) {
                                await state.addExamVersion({
                                    id: uuidv4(),
                                    examId: '', // Será preenchido ao salvar o exame final
                                    versionNumber: 1,
                                    itemsSnapshot: polished,
                                    reviewSummary: summary,
                                    createdAt: new Date().toISOString()
                                });
                            }

                            alert("Revisão concluída com sucesso! Sua prova foi otimizada pela IA.");
                        }}
                    />
                ) : isReviewingBatch && currentBatchId ? (
                    <BatchReviewPanel
                        batchId={currentBatchId}
                        items={currentBatchItems}
                        onFinish={() => {
                            setIsReviewingBatch(false);
                            // Sincroniza os itens aprovados para a seleção da prova
                            const approved = state.items.filter(i =>
                                i.generationBatchId === currentBatchId &&
                                i.lifecycleStatus === ItemLifecycleStatus.APPROVED
                            );
                            if (approved.length > 0) {
                                setSelectedItems(prev => [...prev, ...approved]);
                                // Atualiza o diagnóstico
                                setSelectionDiagnosis({ ...selectionDiagnosis, missingCount: 0 });
                            }
                        }}
                    />
                ) : (
                    <div className="flex h-full gap-8 overflow-hidden">
                        {/* Left: Available Items (List) OR Selection Diagnosis */}
                        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
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
                                    <button
                                        onClick={handleGapGeneration}
                                        disabled={isFillingGaps}
                                        className="bg-rose-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-700 transition flex items-center gap-2 shadow-sm"
                                    >
                                        {isFillingGaps ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                        Gerar Questões Inéditas via IA
                                    </button>
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
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            className="w-full border rounded-lg pl-9 p-2 text-sm shadow-sm"
                                            placeholder="Filtrar questões..."
                                            value={filter}
                                            onChange={e => setFilter(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowRecommendations(!showRecommendations)}
                                        className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition border ${showRecommendations ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-600'}`}
                                    >
                                        <Plus size={16} className={showRecommendations ? 'rotate-45 transition' : ''} />
                                        {showRecommendations ? 'Fechar IA' : 'Sugestões IA'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {/* Standard List */}
                                {(builderMode === 'SMART' ? (state.items.filter(i => selectedItems.find(s => s.id === i.id) || (i.generationBatchId === currentBatchId && i.lifecycleStatus === ItemLifecycleStatus.APPROVED))) : filteredAvailableItems).map(item => (
                                    <div key={item.id} className="p-3 border border-slate-200 rounded-lg hover:border-brand-primary bg-white cursor-pointer group transition-all hover:shadow-sm" onClick={() => toggleItem(item)}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{item.subject}</span>
                                            <div className="flex gap-2">
                                                {item.origin === ItemOrigin.IA && <Badge color="indigo">IA</Badge>}
                                                <Badge color={item.difficulty === 'FACIL' ? 'green' : 'yellow'}>{item.difficulty}</Badge>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-800 line-clamp-2 mb-2">{item.statement}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">ID: {item.id.slice(0, 6)}</span>
                                            <button className={`text-brand-primary text-xs font-bold opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-brand-light px-2 py-1 rounded ${builderMode === 'SMART' ? 'text-rose-600 bg-rose-50' : ''}`}>
                                                {builderMode === 'SMART' ? 'Remover' : 'Adicionar'}
                                                {builderMode === 'SMART' ? <X size={12} /> : <Plus size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Tablet Simulator (Preview) */}
                        <div className="w-[500px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Tablet size={20} /> Simulação do Aluno</h3>
                                <span className="text-xs font-bold bg-brand-primary text-white px-3 py-1 rounded-full">{selectedItems.length} questões selecionadas</span>
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
                                <button onClick={() => handleSave(true)} className="btn-gradient py-3 rounded-lg font-bold text-sm transition shadow-md">Publicar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
