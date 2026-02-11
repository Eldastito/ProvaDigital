import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { AppState, Item, DifficultyLevel, QuestionType, ItemOrigin, ItemLifecycleStatus, ItemGenerationBatch, QualityStandard, DifficultyLevelConfig, DualValidationResult } from '../../../types';
import { generateQuestionsFromText, improveItemStatement, generateDistractors, suggestBNCC, generateJustification, variateItem, adaptItemForAccessibility, extractItemFromImage, auditPedagogicalItem, validateQuestionQuality, validateQuestionStandards, generateExamCover } from '../../../services/geminiService';
import { uuidv4 } from '../../../utils/helpers';
import { useSafeAppStore } from '../../../store/useAppStore';
import { useFormPersistence, getPersistedValue, clearPersistedForm } from './useFormPersistence';

// Configuração do Worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.530/pdf.worker.mjs`;

export const useItemEditor = () => {
    const navigate = useNavigate();
    const state = useSafeAppStore();
    const { addItem, activeBatchId, setActiveBatchId } = state;

    const [mode, setMode] = useState<'MANUAL' | 'AI'>(() => getPersistedValue('mode', 'MANUAL'));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [aiContext, setAiContext] = useState(() => getPersistedValue('aiContext', ''));
    const [aiQuantity, setAiQuantity] = useState(() => getPersistedValue('aiQuantity', 3));
    const [aiLoading, setAiLoading] = useState(false);
    const [showBatchHistory, setShowBatchHistory] = useState(false);

    // Multi-level generation states
    const [useMultiLevel, setUseMultiLevel] = useState(() => getPersistedValue('useMultiLevel', false));
    const [topic, setTopic] = useState(() => getPersistedValue('topic', ''));
    const [bnccCodes, setBnccCodes] = useState<string[]>(() => getPersistedValue('bnccCodes', []));
    const [examType, setExamType] = useState<'LINEAR' | 'ADAPTIVE'>(() => getPersistedValue('examType', 'ADAPTIVE'));
    const [standards, setStandards] = useState<QualityStandard[]>(() => getPersistedValue('standards', ['INEP', 'BNCC']));
    const [levelConfigs, setLevelConfigs] = useState<DifficultyLevelConfig[]>(() => getPersistedValue('levelConfigs', [
        { level: 'MUITO_FACIL', quantity: 5, enabled: true, triRange: [-2.0, -1.0] },
        { level: 'FACIL', quantity: 6, enabled: true, triRange: [-1.0, -0.5] },
        { level: 'MEDIO', quantity: 8, enabled: true, triRange: [-0.5, 0.5] },
        { level: 'DIFICIL', quantity: 6, enabled: true, triRange: [0.5, 1.0] },
        { level: 'MUITO_DIFICIL', quantity: 5, enabled: true, triRange: [1.0, 2.0] }
    ]));
    const [generationProgress, setGenerationProgress] = useState(0);
    const [validationResults, setValidationResults] = useState<DualValidationResult | null>(null);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [coverText, setCoverText] = useState('');

    // Adaptive configuration states (Gold Standard defaults)
    const [adaptiveBankSize, setAdaptiveBankSize] = useState(() => getPersistedValue('adaptiveBankSize', 60));
    const [adaptiveQuestionsPerStudent, setAdaptiveQuestionsPerStudent] = useState(() => getPersistedValue('adaptiveQuestionsPerStudent', 25));

    // Persistir estados automaticamente
    useFormPersistence('mode', mode);
    useFormPersistence('aiContext', aiContext);
    useFormPersistence('aiQuantity', aiQuantity);
    useFormPersistence('useMultiLevel', useMultiLevel);
    useFormPersistence('topic', topic);
    useFormPersistence('bnccCodes', bnccCodes);
    useFormPersistence('examType', examType);
    useFormPersistence('standards', standards);
    useFormPersistence('levelConfigs', levelConfigs);
    useFormPersistence('adaptiveBankSize', adaptiveBankSize);
    useFormPersistence('adaptiveQuestionsPerStudent', adaptiveQuestionsPerStudent);

    // Flags de carregamento
    const [isImproving, setIsImproving] = useState(false);
    const [isGeneratingAlts, setIsGeneratingAlts] = useState(false);
    const [isBNCCLoading, setIsBNCCLoading] = useState(false);
    const [isExtractingOCR, setIsExtractingOCR] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
    const [isVariating, setIsVariating] = useState(false);
    const [isAdapting, setIsAdapting] = useState(false);
    const [auditReport, setAuditReport] = useState<any>(null);

    // Drag and Drop State
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const [form, setForm] = useState<{
        statement: string;
        subject: string;
        difficulty: DifficultyLevel;
        type: QuestionType;
        correctAnswerJustification: string;
        tags: string;
        imageUrl: string;
        bnccCode: string;
        minLines: string;
        maxLines: string;
        showWordCount: boolean;
        triParams?: {
            difficulty: number;
            discrimination: number;
            guessing: number;
            bloomTaxonomy: string;
        };
        multimedia: { type: 'IMAGE' | 'VIDEO' | 'AUDIO', url: string, description?: string }[];
        offlineKeywords?: { required: string; optional: string };
        isPublic: boolean;
    }>({
        statement: '',
        subject: '',
        difficulty: DifficultyLevel.MEDIUM,
        type: QuestionType.MULTIPLE_CHOICE,
        correctAnswerJustification: '',
        tags: '',
        imageUrl: '',
        bnccCode: '',
        minLines: '',
        maxLines: '',
        showWordCount: false,
        multimedia: [],
        isPublic: false
    });

    const [alternatives, setAlternatives] = useState([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);

    const handleTypeChange = (newType: QuestionType) => {
        setForm({ ...form, type: newType });
        if (newType === QuestionType.TRUE_FALSE) {
            setAlternatives([
                { text: 'Verdadeiro', isCorrect: true },
                { text: 'Falso', isCorrect: false }
            ]);
        } else if (newType === QuestionType.ESSAY || newType === QuestionType.REDACTION) {
            setAlternatives([]);
        } else {
            setAlternatives([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => { setDraggedIdx(index); e.dataTransfer.effectAllowed = "move"; };
    const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (draggedIdx === null || draggedIdx === index) return; const newAlts = [...alternatives]; const draggedItem = newAlts[draggedIdx]; newAlts.splice(draggedIdx, 1); newAlts.splice(index, 0, draggedItem); setAlternatives(newAlts); setDraggedIdx(index); };
    const handleDragEnd = () => { setDraggedIdx(null); };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAiLoading(true);
        try {
            let extractedText = "";

            if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map((item: any) => item.str).join(" ");
                    fullText += `\n--- Página ${i} ---\n${pageText}\n`;
                }
                extractedText = fullText;
            } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx")) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                extractedText = result.value;
            } else if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.name.endsWith(".xlsx")) {
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer);
                let fullText = "";
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    fullText += `\n--- Planilha: ${sheetName} ---\n${JSON.stringify(json)}\n`;
                });
                extractedText = fullText;
            } else {
                extractedText = await file.text();
            }

            setAiContext(prev => prev + `\n\n--- Arquivo: ${file.name} ---\n` + extractedText);
        } catch (error) {
            console.error("Erro ao processar arquivo:", error);
            alert("Não foi possível ler este arquivo. Verifique o formato.");
        } finally {
            setAiLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleImproveStatement = async () => {
        if (!form.statement.replace(/<[^>]*>/g, '').trim()) return alert('Escreva algo no enunciado primeiro.');
        setIsImproving(true);
        const improved = await improveItemStatement(form.statement);
        setForm(prev => ({ ...prev, statement: improved }));
        setIsImproving(false);
    };

    const handleGenerateAlts = async () => {
        const correctAlt = alternatives.find(a => a.isCorrect && a.text.trim());
        if (!correctAlt) return alert('Defina a alternativa correta e o seu texto primeiro.');
        if (!form.statement.trim()) return alert('O enunciado é necessário para o contexto.');

        setIsGeneratingAlts(true);
        const distratores = await generateDistractors(form.statement, correctAlt.text);

        const newAlts = [
            correctAlt,
            ...distratores.map(d => ({ text: d, isCorrect: false }))
        ];
        setAlternatives(newAlts);
        setIsGeneratingAlts(false);
    };

    const handleVariate = async () => {
        if (!form.statement) return alert('É necessário um enunciado para clonar.');
        setIsVariating(true);
        try {
            const itemContext = JSON.stringify({ ...form, alternatives });
            const result = await variateItem(itemContext);
            setForm(prev => ({ ...prev, statement: result.statement, bnccCode: result.bnccCode || prev.bnccCode }));
            setAlternatives(result.alternatives);
            alert("Questão variada e atualizada! Note que o enunciado e as alternativas mudaram para evitar colas.");
        } catch (e) {
            console.error(e);
            alert("Erro ao variar questão.");
        } finally {
            setIsVariating(false);
        }
    };

    const handleAudit = async () => {
        if (!form.statement) return alert('É necessário um enunciado para auditar.');
        setIsAuditing(true);
        setAuditReport(null);
        try {
            const itemContext = JSON.stringify({ ...form, alternatives });
            const result = await auditPedagogicalItem(itemContext);
            setAuditReport(result);
        } catch (e) {
            console.error(e);
            alert("Erro ao realizar auditoria.");
        } finally {
            setIsAuditing(false);
        }
    };

    const handleAccessibility = async (profile: 'TEA' | 'TDAH' | 'VISUAL' | 'GERAL') => {
        if (!form.statement) return alert('É necessário um enunciado para adaptar.');
        setIsAdapting(true);
        try {
            const itemContext = JSON.stringify({ ...form, alternatives });
            const result = await adaptItemForAccessibility(itemContext, profile);
            setForm(prev => ({
                ...prev,
                statement: result.statement,
                isAccessible: true,
                accessibilityInstructions: result.accessibilityInstructions
            }));
            setAlternatives(result.alternatives);
            alert(`Questão adaptada com sucesso para o perfil ${profile}!`);
        } catch (e) {
            console.error(e);
            alert("Erro ao adaptar questão.");
        } finally {
            setIsAdapting(false);
        }
    };

    const handleSuggestBNCC = async () => {
        if (!form.statement.trim()) return alert('O enunciado é necessário para sugerir a BNCC.');
        setIsBNCCLoading(true);
        const suggestion = await suggestBNCC(form.statement);
        setForm(prev => ({ ...prev, bnccCode: suggestion.code }));
        alert(`Sugerido: ${suggestion.code}\nMotivo: ${suggestion.reason}`);
        setIsBNCCLoading(false);
    };

    const handleGenerateJustification = async () => {
        const correctAlt = alternatives.find(a => a.isCorrect && a.text.trim());
        if (!correctAlt) return alert('Defina a alternativa correta primeiro.');
        if (!form.statement.trim()) return alert('O enunciado é necessário.');

        setIsImproving(true);
        const justification = await generateJustification(form.statement, correctAlt.text);
        setForm(prev => ({ ...prev, correctAnswerJustification: justification }));
        setIsImproving(false);
    };

    const handleGenerate = async () => {
        if (!aiContext) return alert('Insira um texto de contexto.');
        if (!state.currentUser?.id || !state.currentUser?.tenantId) {
            return alert('Sua sessão parece inválida ou expirou. Por favor, faça login novamente para gerar questões.');
        }

        setAiLoading(true);
        setGenerationProgress(0);

        try {
            const batchId = uuidv4();
            let allItems: Item[] = [];
            let coverText = '';

            if (useMultiLevel) {
                // ============ MODO MULTI-NÍVEL ============
                const enabledLevels = levelConfigs.filter(c => c.enabled);
                const totalQuestions = enabledLevels.reduce((sum, c) => sum + c.quantity, 0);

                if (totalQuestions === 0) {
                    return alert('Configure pelo menos um nível de dificuldade.');
                }

                if (standards.length === 0) {
                    return alert('Selecione pelo menos um padrão de qualidade.');
                }

                // Fase 1: Gerar questões por nível
                for (let i = 0; i < enabledLevels.length; i++) {
                    const level = enabledLevels[i];
                    const questions = await generateQuestionsFromText(
                        aiContext,
                        level.quantity,
                        QuestionType.MULTIPLE_CHOICE,
                        level.level as any,
                        form.subject || 'Geral'
                    );

                    if (questions) {
                        const levelItems: Item[] = questions.map(g => ({
                            id: uuidv4(),
                            tenantId: state.currentUser!.tenantId,
                            ownerId: state.currentUser!.id,
                            knowledgeArea: 'Geral',
                            subject: form.subject || 'Geral',
                            type: QuestionType.MULTIPLE_CHOICE,
                            statement: g.statement,
                            alternatives: g.alternatives.map(a => ({ id: uuidv4(), ...a })),
                            correctAnswerJustification: g.justification,
                            difficulty: g.difficulty as DifficultyLevel,
                            score: 1.0,
                            origin: ItemOrigin.IA,
                            tags: ['IA', 'Multi-Nível', level.level, ...bnccCodes],
                            bnccCode: g.bnccCode || bnccCodes[0],
                            usageCount: 0,
                            generationBatchId: batchId,
                            aiModelId: g.aiModel,
                            aiPromptVersion: g.promptVersion,
                            lifecycleStatus: ItemLifecycleStatus.DRAFT,
                            createdAt: new Date().toISOString(),
                            triParams: g.triParams as any
                        }));

                        allItems.push(...levelItems);
                    }

                    setGenerationProgress(((i + 1) / enabledLevels.length) * 50);
                }

                // Fase 2: Validação de Qualidade (rápida)
                const qualityResult = await validateQuestionQuality(allItems);
                setGenerationProgress(60);

                // Fase 3: Validação de Padrões (detalhada)
                const standardsResult = await validateQuestionStandards(allItems, standards);
                setGenerationProgress(80);

                // Fase 4: Gerar documentação da capa
                const distribution = {
                    veryEasy: levelConfigs[0].enabled ? levelConfigs[0].quantity : 0,
                    easy: levelConfigs[1].enabled ? levelConfigs[1].quantity : 0,
                    medium: levelConfigs[2].enabled ? levelConfigs[2].quantity : 0,
                    hard: levelConfigs[3].enabled ? levelConfigs[3].quantity : 0,
                    veryHard: levelConfigs[4].enabled ? levelConfigs[4].quantity : 0
                };

                coverText = await generateExamCover({
                    examType,
                    subject: form.subject || 'Geral',
                    topic: topic || 'Diversos',
                    bnccCodes,
                    questionCount: examType === 'ADAPTIVE' ? Math.floor(totalQuestions / 3) : totalQuestions,
                    bankSize: totalQuestions,
                    distribution,
                    standards,
                    validationScore: Math.round((qualityResult.skillCoverage + standardsResult.inepCompliance + standardsResult.bnccCompliance) / 3)
                });

                setGenerationProgress(90);

                // Armazenar texto da capa e resultados da validação
                setCoverText(coverText);
                setValidationResults({
                    phase1: qualityResult,
                    phase2: standardsResult as any, // Cast para resolver incompatibilidade de tipo category
                    overallScore: Math.round((qualityResult.skillCoverage + standardsResult.inepCompliance + standardsResult.bnccCompliance) / 3),
                    approved: qualityResult.skillCoverage >= 70 && standardsResult.inepCompliance >= 70,
                    flaggedQuestions: standardsResult.issues.filter(i => i.severity === 'HIGH').map(i => i.questionId)
                });

            } else {
                // ============ MODO SIMPLES (Original) ============
                const questions = await generateQuestionsFromText(
                    aiContext, aiQuantity, QuestionType.MULTIPLE_CHOICE, form.difficulty, form.subject || 'Geral'
                );

                if (questions) {
                    allItems = questions.map(g => ({
                        id: uuidv4(),
                        tenantId: state.currentUser!.tenantId,
                        ownerId: state.currentUser!.id,
                        knowledgeArea: 'Geral',
                        subject: form.subject || 'Geral',
                        type: QuestionType.MULTIPLE_CHOICE,
                        statement: g.statement,
                        alternatives: g.alternatives.map(a => ({ id: uuidv4(), ...a })),
                        correctAnswerJustification: g.justification,
                        difficulty: g.difficulty as DifficultyLevel,
                        score: 1.0,
                        origin: ItemOrigin.IA,
                        tags: ['IA', 'Banco de Itens'],
                        bnccCode: g.bnccCode,
                        usageCount: 0,
                        generationBatchId: batchId,
                        aiModelId: g.aiModel,
                        aiPromptVersion: g.promptVersion,
                        lifecycleStatus: ItemLifecycleStatus.DRAFT,
                        createdAt: new Date().toISOString()
                    }));
                }
            }

            // Salvar batch e itens
            if (allItems.length > 0) {
                if (state.addGenerationBatch) {
                    await state.addGenerationBatch({
                        id: batchId,
                        creatorId: state.currentUser!.id,
                        tenantId: state.currentUser!.tenantId,
                        promptContext: aiContext,
                        totalRequested: useMultiLevel ? allItems.length : aiQuantity,
                        createdAt: new Date().toISOString()
                    });
                }

                if (state.addItems) {
                    await state.addItems(allItems);
                }

                setActiveBatchId(batchId);
                setGenerationProgress(100);

                if (useMultiLevel) {
                    // Abrir modal de resultados ao invés de alert
                    setShowValidationModal(true);
                } else {
                    alert(`${allItems.length} questões geradas e salvas com sucesso.`);
                }
            }
        } catch (e: any) {
            console.error('AI Generation Error:', e);
            const errorMsg = e.message || "Erro desconhecido";
            alert(`Não foi possível salvar as questões no banco.\n\nDetalhe técnico: ${errorMsg}\n\nVerifique se você tem permissão de administrador ou se o banco de dados está acessível.`);
        } finally {
            setAiLoading(false);
            setGenerationProgress(0);
        }
    };

    const handleMagicPolish = async () => {
        if (!form.statement.replace(/<[^>]*>/g, '').trim()) return alert('Escreva algo no enunciado primeiro para o Polimento Mágico.');
        setIsImproving(true);
        setIsGeneratingAlts(true);
        setIsBNCCLoading(true);

        try {
            const improved = await improveItemStatement(form.statement);
            const bncc = await suggestBNCC(improved);
            const correctAlt = alternatives.find(a => a.isCorrect && a.text.trim());
            let justification = form.correctAnswerJustification;
            if (correctAlt) {
                justification = await generateJustification(improved, correctAlt.text);
            }

            setForm(prev => ({
                ...prev,
                statement: improved,
                bnccCode: bncc.code,
                correctAnswerJustification: justification
            }));

            if (form.type === QuestionType.MULTIPLE_CHOICE && correctAlt) {
                const distratores = await generateDistractors(improved, correctAlt.text);
                setAlternatives([
                    correctAlt,
                    ...distratores.map(d => ({ text: d, isCorrect: false }))
                ]);
            }
        } catch (err) {
            console.error("Erro no Polimento Mágico:", err);
            alert("Ocorreu um erro no polimento. Tente as funções individuais.");
        } finally {
            setIsImproving(false);
            setIsGeneratingAlts(false);
            setIsBNCCLoading(false);
        }
    };

    const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setIsExtractingOCR(true);
            try {
                const result = await extractItemFromImage(base64);
                if (result) {
                    setForm(prev => ({
                        ...prev,
                        statement: result.statement,
                        difficulty: result.difficulty as DifficultyLevel,
                        correctAnswerJustification: result.justification,
                        bnccCode: result.bnccCode || '',
                        triParams: result.triParams
                    }));
                    if (result.alternatives) {
                        setAlternatives(result.alternatives.map(a => ({
                            text: a.text,
                            isCorrect: a.isCorrect
                        })));
                    }
                    alert("OCR Concluído: Dados extraídos da imagem com sucesso!");
                } else {
                    alert("A IA não conseguiu interpretar a questão nesta imagem. Tente uma foto mais nítida.");
                }
            } catch (err) {
                console.error(err);
                alert("Erro ao ler imagem. Tente uma foto mais clara.");
            } finally {
                setIsExtractingOCR(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const saveManual = () => {
        if (!form.statement.trim()) return alert('O campo de Enunciado/Proposta é obrigatório.');
        if (!form.subject) return alert('Selecione uma Disciplina.');

        if (form.type === QuestionType.MULTIPLE_CHOICE || form.type === QuestionType.TRUE_FALSE) {
            if (alternatives.length < 2) return alert('Adicione pelo menos 2 alternativas.');
            if (!alternatives.some(a => a.isCorrect)) return alert('Selecione qual é a alternativa correta.');
            if (alternatives.some(a => !a.text.trim())) return alert('O texto das alternativas não pode estar vazio.');
        }

        if (form.type === QuestionType.REDACTION) {
            if (form.maxLines && parseInt(form.maxLines) < 1) return alert('O máximo de linhas deve ser maior que 0.');
        }

        const newItem: Item = {
            id: uuidv4(),
            tenantId: state.currentUser?.tenantId || 't1',
            schoolId: state.currentUser?.schoolId,
            ownerId: state.currentUser?.id || '',
            knowledgeArea: 'Geral',
            subject: form.subject,
            type: form.type,
            statement: form.statement,
            imageUrl: form.imageUrl,
            alternatives: (form.type === QuestionType.REDACTION || form.type === QuestionType.ESSAY)
                ? []
                : alternatives.map((a, i) => ({ id: `alt-${i}`, text: a.text, isCorrect: a.isCorrect })),

            correctAnswerJustification: form.correctAnswerJustification +
                (form.offlineKeywords?.required || form.offlineKeywords?.optional
                    ? `\n\nREQUIRED: ${form.offlineKeywords?.required || ''}\nOPTIONAL: ${form.offlineKeywords?.optional || ''}`
                    : ''),

            difficulty: form.difficulty,
            score: 1.0,
            origin: ItemOrigin.MANUAL,
            tags: form.tags.split(',').map(t => t.trim()).filter(t => t),
            bnccCode: form.bnccCode,
            minLines: form.minLines ? parseInt(form.minLines) : undefined,
            maxLines: form.maxLines ? parseInt(form.maxLines) : undefined,
            showWordCount: form.showWordCount,
            triParams: form.triParams as any, // Cast temporário para compatibilidade de enum BloomTaxonomy
            isAccessible: (form as any).isAccessible || false,
            accessibilityInstructions: (form as any).accessibilityInstructions || '',
            multimedia: form.multimedia || [],
            isPublic: form.isPublic,
            usageCount: 0,
            lifecycleStatus: ItemLifecycleStatus.APPROVED,
            createdAt: new Date().toISOString()
        };

        addItem(newItem);
        alert("Questão salva com sucesso!");
        navigate('/items');
    };

    // Modal callbacks
    const handleApproveValidation = () => {
        setShowValidationModal(false);
        alert('✅ Banco de questões aprovado e salvo com sucesso!');
    };

    const handleReviewQuestions = () => {
        setShowValidationModal(false);
        // Navegar para revisão do batch
        if (activeBatchId) {
            // O usuário já está na tela de revisão através do activeBatchId
            alert('📝 Revise as questões sinalizadas no painel de lote.');
        }
    };

    // Limpar formulário
    const handleClearForm = () => {
        if (confirm('Deseja limpar todos os campos do formulário?')) {
            // Resetar estados
            setMode('MANUAL');
            setAiContext('');
            setAiQuantity(3);
            setUseMultiLevel(false);
            setTopic('');
            setBnccCodes([]);
            setExamType('ADAPTIVE');
            setStandards(['INEP', 'BNCC']);
            setLevelConfigs([
                { level: 'MUITO_FACIL', quantity: 5, enabled: true, triRange: [-2.0, -1.0] },
                { level: 'FACIL', quantity: 6, enabled: true, triRange: [-1.0, -0.5] },
                { level: 'MEDIO', quantity: 8, enabled: true, triRange: [-0.5, 0.5] },
                { level: 'DIFICIL', quantity: 6, enabled: true, triRange: [0.5, 1.0] },
                { level: 'MUITO_DIFICIL', quantity: 5, enabled: true, triRange: [1.0, 2.0] }
            ]);
            // Limpar localStorage
            clearPersistedForm();
        }
    };

    return {
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
        // Multi-level generation states
        useMultiLevel, setUseMultiLevel,
        topic, setTopic,
        bnccCodes, setBnccCodes,
        examType, setExamType,
        standards, setStandards,
        levelConfigs, setLevelConfigs,
        generationProgress,
        validationResults,
        // Adaptive configuration states
        adaptiveBankSize, setAdaptiveBankSize,
        adaptiveQuestionsPerStudent, setAdaptiveQuestionsPerStudent,
        // Modal states
        showValidationModal, setShowValidationModal,
        coverText,
        handleApproveValidation,
        handleReviewQuestions,
        // Form utilities
        handleClearForm
    };
};
