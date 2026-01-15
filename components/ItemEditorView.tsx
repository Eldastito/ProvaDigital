import React, { useState, useRef } from 'react';
import { Brain, X, Trash2, Image as ImageIcon, Upload, GripVertical, BookOpen, Eye, CheckSquare, Save, Wand2, Loader2, Sparkles, Video, Music, Camera, Scan, Wifi, ShieldAlert, CheckCircle2, AlertCircle, BarChart3, Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppState, Item, DifficultyLevel, QuestionType, ItemOrigin, ItemLifecycleStatus, ItemGenerationBatch } from '../types';
import { generateQuestionsFromText, improveItemStatement, generateDistractors, suggestBNCC, generateJustification, variateItem, adaptItemForAccessibility, extractItemFromImage, auditPedagogicalItem } from '../services/geminiService';
import { uuidv4 } from '../utils/helpers';
import { RichTextEditor } from './RichTextEditor';
import { useSafeAppStore } from '../store/useAppStore';
import { Badge } from './ui/Badge';
import { BatchReviewPanel } from './OnlineExam/BatchReviewPanel';
import { translateQuestionType, translateDifficultyLevel } from '../utils/translations';

// Bibliotecas para leitura de documentos
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Configuração do Worker do PDF.js via CDN (Versão compatível com o node_module)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.530/pdf.worker.mjs`;

// Lista de disciplinas padrão do currículo brasileiro (Fundamental e Médio)
const BRAZILIAN_SUBJECTS = [
    'Artes',
    'Biologia',
    'Ciências',
    'Educação Física',
    'Ensino Religioso',
    'Espanhol',
    'Filosofia',
    'Física',
    'Geografia',
    'História',
    'Inglês',
    'Língua Portuguesa',
    'Literatura',
    'Matemática',
    'Química',
    'Redação',
    'Sociologia'
];

export const ItemEditorView = () => {
    const navigate = useNavigate();
    const state = useSafeAppStore();
    const { addItem } = state;
    const [mode, setMode] = useState<'MANUAL' | 'AI'>('MANUAL');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [aiContext, setAiContext] = useState('');
    const [aiQuantity, setAiQuantity] = useState(3);
    const [aiLoading, setAiLoading] = useState(false);
    const { activeBatchId, setActiveBatchId } = state;
    const [showBatchHistory, setShowBatchHistory] = useState(false);

    // Novas flags de carregamento para otimização
    const [isImproving, setIsImproving] = useState(false);
    const [isGeneratingAlts, setIsGeneratingAlts] = useState(false);
    const [isBNCCLoading, setIsBNCCLoading] = useState(false);
    const [isExtractingOCR, setIsExtractingOCR] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
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
        multimedia: [] as { type: 'IMAGE' | 'VIDEO' | 'AUDIO', url: string, description?: string }[]
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
                // Fallback para .txt ou outros
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

    // FUNÇÕES DE AUTOMAÇÃO IA
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

    // VARIADOR E ACESSIBILIDADE
    const [isVariating, setIsVariating] = useState(false);
    const [isAdapting, setIsAdapting] = useState(false);

    const handleVariate = async () => {
        if (!form.statement) return alert('É necessário um enunciado para clonar.');
        setIsVariating(true);
        try {
            const itemContext = JSON.stringify({ ...form, alternatives });
            const result = await (await import('../services/geminiService')).variateItem(itemContext);
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
            const result = await (await import('../services/geminiService')).adaptItemForAccessibility(itemContext, profile);
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

        // Validação de Sessão
        if (!state.currentUser?.id || !state.currentUser?.tenantId) {
            return alert('Sua sessão parece inválida ou expirou. Por favor, faça login novamente para gerar questões.');
        }

        setAiLoading(true);
        try {
            const batchId = uuidv4();
            const questions = await generateQuestionsFromText(
                aiContext, aiQuantity, QuestionType.MULTIPLE_CHOICE, form.difficulty, form.subject || 'Geral'
            );

            if (questions) {
                const newItems: Item[] = questions.map(g => ({
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
                    lifecycleStatus: ItemLifecycleStatus.DRAFT,
                    createdAt: new Date().toISOString()
                }));

                // 1. Create Batch Metadata
                if (state.addGenerationBatch) {
                    await state.addGenerationBatch({
                        id: batchId,
                        creatorId: state.currentUser!.id,
                        tenantId: state.currentUser!.tenantId,
                        promptContext: aiContext,
                        totalRequested: aiQuantity,
                        createdAt: new Date().toISOString()
                    });
                }

                // 2. Add Items to Store/DB as DRAFT
                if (state.addItems) {
                    await state.addItems(newItems);
                }

                setActiveBatchId(batchId);
                alert(`${newItems.length} questões geradas e salvas com sucesso.`);
            }
        } catch (e: any) {
            console.error('AI Generation Error:', e);
            const errorMsg = e.message || "Erro desconhecido";
            alert(`Não foi possível salvar as questões no banco.\n\nDetalhe técnico: ${errorMsg}\n\nVerifique se você tem permissão de administrador ou se o banco de dados está acessível.`);
        } finally {
            setAiLoading(false);
        }
    };

    const handleMagicPolish = async () => {
        if (!form.statement.replace(/<[^>]*>/g, '').trim()) return alert('Escreva algo no enunciado primeiro para o Polimento Mágico.');

        setIsImproving(true);
        setIsGeneratingAlts(true);
        setIsBNCCLoading(true);

        try {
            // 1. Melhorar Enunciado
            const improved = await improveItemStatement(form.statement);

            // 2. Sugerir BNCC
            const bncc = await suggestBNCC(improved);

            // 3. Gerar Justificativa (se tiver a correta)
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

            // 4. Gerar Alternativas (se for múltipla escolha e tiver a correta marcada)
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
        // 1. Validação Básica (Campos Comuns)
        if (!form.statement.trim()) return alert('O campo de Enunciado/Proposta é obrigatório.');
        if (!form.subject) return alert('Selecione uma Disciplina.');

        // 2. Validação Específica por Tipo
        if (form.type === QuestionType.MULTIPLE_CHOICE || form.type === QuestionType.TRUE_FALSE) {
            if (alternatives.length < 2) return alert('Adicione pelo menos 2 alternativas.');
            if (!alternatives.some(a => a.isCorrect)) return alert('Selecione qual é a alternativa correta.');
            if (alternatives.some(a => !a.text.trim())) return alert('O texto das alternativas não pode estar vazio.');
        }

        // 3. Validação de Redação/Discursiva
        if (form.type === QuestionType.REDACTION || form.type === QuestionType.ESSAY) {
            // Não valida alternativas aqui
            if (form.type === QuestionType.REDACTION) {
                if (form.maxLines && parseInt(form.maxLines) < 1) return alert('O máximo de linhas deve ser maior que 0.');
            }
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
            // Garante que alternativas seja um array vazio se for redação/discursiva
            alternatives: (form.type === QuestionType.REDACTION || form.type === QuestionType.ESSAY)
                ? []
                : alternatives.map((a, i) => ({ id: `alt-${i}`, text: a.text, isCorrect: a.isCorrect })),
            correctAnswerJustification: form.correctAnswerJustification,
            difficulty: form.difficulty,
            score: 1.0,
            origin: ItemOrigin.MANUAL,
            tags: form.tags.split(',').map(t => t.trim()).filter(t => t),
            bnccCode: form.bnccCode,
            minLines: form.minLines ? parseInt(form.minLines) : undefined,
            maxLines: form.maxLines ? parseInt(form.maxLines) : undefined,
            showWordCount: form.showWordCount,
            triParams: form.triParams,
            isAccessible: (form as any).isAccessible || false,
            accessibilityInstructions: (form as any).accessibilityInstructions || '',
            multimedia: (form as any).multimedia || [],
            usageCount: 0,
            lifecycleStatus: ItemLifecycleStatus.APPROVED,
            createdAt: new Date().toISOString()
        };

        addItem(newItem);
        alert("Questão salva com sucesso!");
        navigate('/items');
    };

    return (
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-brand-primary overflow-hidden flex flex-col h-[calc(100vh-100px)]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div className="flex gap-4">
                    <button onClick={() => setMode('MANUAL')} className={`pb-1 text-sm font-medium border-b-2 transition ${mode === 'MANUAL' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                        Criação Manual
                    </button>
                    <button onClick={() => setMode('AI')} className={`pb-1 text-sm font-medium border-b-2 transition flex items-center gap-2 ${mode === 'AI' ? 'border-brand-secondary text-brand-secondary' : 'border-transparent text-slate-500'}`}>
                        <Brain size={14} /> Gerar com IA
                    </button>
                    {mode === 'MANUAL' && (
                        <div className="flex gap-4">
                            <button
                                onClick={handleMagicPolish}
                                disabled={isImproving || isGeneratingAlts || isBNCCLoading}
                                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center gap-2 hover:shadow-lg hover:scale-105 transition shadow-sm disabled:opacity-50"
                                title="Aprimora enunciado, gera alternativas e sugere BNCC de uma só vez"
                            >
                                {isImproving || isGeneratingAlts || isBNCCLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                Polimento Mágico
                            </button>
                            <button
                                onClick={handleAudit}
                                disabled={isAuditing}
                                className="pb-1 text-sm font-bold text-rose-600 flex items-center gap-2 hover:text-rose-800 transition border-b-2 border-transparent hover:border-rose-400"
                            >
                                {isAuditing ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                                Auditoria Pedagógica
                            </button>
                            <label className="cursor-pointer group">
                                <span className="pb-1 text-sm font-bold text-emerald-600 flex items-center gap-2 group-hover:text-emerald-800 transition border-b-2 border-transparent group-hover:border-emerald-400">
                                    {isExtractingOCR ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                    Magic Scan (OCR)
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleOCR}
                                    disabled={isExtractingOCR}
                                />
                            </label>
                        </div>
                    )}
                </div>
                <button onClick={() => navigate('/items')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {auditReport && (
                    <div className="mb-8 bg-slate-900 text-white rounded-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-700 shadow-2xl">
                        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="text-rose-400" size={20} />
                                <h3 className="font-bold text-lg">Relatório de Auditoria Pedagógica</h3>
                            </div>
                            <button onClick={() => setAuditReport(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700 relative overflow-hidden group">
                                    <div className={`text-4xl font-black mb-1 ${auditReport.score >= 80 ? 'text-emerald-400' : auditReport.score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {auditReport.score}%
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Search size={10} className="text-brand-primary" /> Ineditismo & Qualidade
                                    </div>
                                    <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                </div>
                                <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="text-xl font-bold text-blue-400 mb-1">{auditReport.bloomLevel}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxonomia de Bloom</div>
                                </div>
                                <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div className="text-sm font-bold text-purple-400 mb-1 truncate px-2">{auditReport.bnccVerdict}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Veredito BNCC</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                        <CheckCircle2 size={16} /> Pontos Fortes
                                    </h4>
                                    <ul className="space-y-2">
                                        {auditReport.pros.map((p: string, i: number) => (
                                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                                                <span className="text-emerald-500 mt-1">•</span> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                                        <AlertCircle size={16} /> Sugestões de Melhoria
                                    </h4>
                                    <ul className="space-y-2">
                                        {auditReport.improvements.map((p: string, i: number) => (
                                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                                                <span className="text-rose-500 mt-1">•</span> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                                <button
                                    onClick={() => {
                                        setAuditReport(null);
                                        handleMagicPolish();
                                    }}
                                    className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-brand-dark transition shadow-lg flex items-center gap-2 mx-auto"
                                >
                                    <Sparkles size={18} /> Aplicar Melhorias Automaticamente
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'MANUAL' ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Disciplina</label>
                                <select
                                    className="w-full border rounded-lg p-2 text-sm"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {BRAZILIAN_SUBJECTS.map(subj => (
                                        <option key={subj} value={subj}>{subj}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select className="w-full border rounded-lg p-2 text-sm" value={form.type} onChange={e => handleTypeChange(e.target.value as QuestionType)}>
                                    <option value={QuestionType.MULTIPLE_CHOICE}>{translateQuestionType(QuestionType.MULTIPLE_CHOICE)}</option>
                                    <option value={QuestionType.TRUE_FALSE}>{translateQuestionType(QuestionType.TRUE_FALSE)}</option>
                                    <option value={QuestionType.ESSAY}>{translateQuestionType(QuestionType.ESSAY)}</option>
                                    <option value={QuestionType.REDACTION}>{translateQuestionType(QuestionType.REDACTION)}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dificuldade</label>
                                <select className="w-full border rounded-lg p-2 text-sm" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as DifficultyLevel })}>
                                    <option value={DifficultyLevel.EASY}>{translateDifficultyLevel(DifficultyLevel.EASY)}</option>
                                    <option value={DifficultyLevel.MEDIUM}>{translateDifficultyLevel(DifficultyLevel.MEDIUM)}</option>
                                    <option value={DifficultyLevel.HARD}>{translateDifficultyLevel(DifficultyLevel.HARD)}</option>
                                </select>
                            </div>
                        </div>

                        {/* Linhas Config (Only for Essay/Redaction) */}
                        {(form.type === QuestionType.ESSAY || form.type === QuestionType.REDACTION) && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-6">
                                    {form.type === QuestionType.REDACTION && (
                                        <div>
                                            <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Mínimo de Linhas</label>
                                            <input type="number" className="w-full border rounded-lg p-2 text-sm" value={form.minLines} onChange={e => setForm({ ...form, minLines: e.target.value })} placeholder="Ex: 20" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Máximo de Linhas</label>
                                        <input type="number" className="w-full border rounded-lg p-2 text-sm" value={form.maxLines} onChange={e => setForm({ ...form, maxLines: e.target.value })} placeholder="Ex: 30" />
                                    </div>
                                </div>

                                {/* Optional Counter Toggle */}
                                <div className="flex items-center gap-2 border-t border-blue-200 pt-3">
                                    <button
                                        onClick={() => setForm({ ...form, showWordCount: !form.showWordCount })}
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${form.showWordCount ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-300'}`}
                                    >
                                        {form.showWordCount && <CheckSquare size={14} />}
                                    </button>
                                    <span className="text-sm text-blue-800 font-medium">Exibir contador de palavras/caracteres para o aluno?</span>
                                    <span className="text-xs text-blue-600 italic">(Útil para redação, mas pode ser desativado para simular papel)</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    {form.type === QuestionType.REDACTION ? 'Proposta da Redação / Texto de Apoio' : 'Enunciado da Questão'}
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleImproveStatement}
                                        disabled={isImproving}
                                        className="text-xs flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100 hover:bg-purple-100 transition font-bold"
                                    >
                                        {isImproving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        Aprimorar Texto
                                    </button>
                                    <button
                                        onClick={handleVariate}
                                        disabled={isVariating}
                                        className="text-xs flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-100 hover:bg-amber-100 transition font-bold"
                                        title="Criar uma variação desta questão para evitar colas"
                                    >
                                        {isVariating ? <Loader2 size={12} className="animate-spin" /> : <GripVertical size={12} />}
                                        Variar Anti-Cola
                                    </button>
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            disabled={isAdapting}
                                            className="text-xs flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 hover:bg-emerald-100 transition font-bold"
                                        >
                                            {isAdapting ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                                            Adaptar PCD
                                        </button>
                                        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                                            <button onClick={() => handleAccessibility('TEA')} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 font-medium border-b border-slate-100">TEA (Autismo)</button>
                                            <button onClick={() => handleAccessibility('TDAH')} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 font-medium border-b border-slate-100">TDAH</button>
                                            <button onClick={() => handleAccessibility('VISUAL')} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 font-medium border-b border-slate-100">Def. Visual</button>
                                            <button onClick={() => handleAccessibility('GERAL')} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 font-medium">Linguagem Simples</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* INFORMAÇÕES DE ACESSIBILIDADE SE ATIVO */}
                            {(form as any).isAccessible && (
                                <div className="mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-100 animate-in slide-in-from-top-2">
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Instruções de Acessibilidade (IA)</p>
                                    <p className="text-xs text-emerald-800 italic">{(form as any).accessibilityInstructions || 'A questão foi adaptada para melhor compreensão.'}</p>
                                </div>
                            )}

                            {/* RICH TEXT EDITOR FOR STATEMENT */}
                            <RichTextEditor
                                value={form.statement}
                                onChange={(val) => setForm({ ...form, statement: val })}
                                placeholder={form.type === QuestionType.REDACTION ? "Insira os textos motivadores e o tema da redação..." : "Digite o enunciado. Use **negrito**, $$fórmulas$$..."}
                                height="h-64"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Imagem de Capa (URL)</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={16} />
                                    <input
                                        className="w-full border rounded-lg pl-9 p-2 text-sm"
                                        value={form.imageUrl}
                                        onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                        placeholder="https://exemplo.com/imagem.jpg"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Áudio/Vídeo de Apoio (URL)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary">
                                            {(form as any).multimedia?.[0]?.type === 'VIDEO' ? <Video size={16} /> : <Music size={16} />}
                                        </div>
                                        <input
                                            className={`w-full border rounded-lg pl-9 p-2 text-sm ${(form as any).multimedia?.[0]?.url?.includes('youtube.com') || (form as any).multimedia?.[0]?.url?.includes('youtu.be') ? 'border-amber-400 bg-amber-50' : ''}`}
                                            placeholder="Link do YouTube ou MP3/MP4"
                                            onChange={e => {
                                                const val = e.target.value;
                                                const type = val.toLowerCase().includes('youtube') || val.toLowerCase().includes('vimeo') || val.toLowerCase().endsWith('.mp4') ? 'VIDEO' : 'AUDIO';
                                                setForm(prev => ({
                                                    ...prev,
                                                    multimedia: val ? [{ type, url: val }] : []
                                                }));
                                            }}
                                            value={(form as any).multimedia?.[0]?.url || ''}
                                        />
                                        {((form as any).multimedia?.[0]?.url?.includes('youtube.com') || (form as any).multimedia?.[0]?.url?.includes('youtu.be')) && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded animate-pulse">
                                                <Wifi size={10} /> REQUER INTERNET
                                            </div>
                                        )}
                                    </div>
                                    <label className="flex-shrink-0 cursor-pointer flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition border border-slate-200" title="Upload de Arquivo (Para uso offline)">
                                        <Upload size={18} />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="video/mp4,audio/mpeg,image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                // Em prod enviaria para Supabase Storage. Aqui usamos Blob URL p/ demo.
                                                const objectUrl = URL.createObjectURL(file);
                                                const type = file.type.startsWith('video') ? 'VIDEO' : file.type.startsWith('audio') ? 'AUDIO' : 'IMAGE';
                                                setForm(prev => ({
                                                    ...prev,
                                                    multimedia: [{ type, url: objectUrl, description: `Arquivo offline: ${file.name}` }]
                                                }));
                                                alert("Arquivo carregado com sucesso! Este recurso estará disponível offline no tablet.");
                                            }}
                                        />
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 italic">
                                    Use arquivos locais (MP4/MP3) para garantir que a mídia funcione sem internet. Links externos como YouTube podem falhar offline.
                                </p>
                            </div>
                        </div>

                        {(form.type === QuestionType.MULTIPLE_CHOICE || form.type === QuestionType.TRUE_FALSE) && (
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-medium text-slate-700">Alternativas / Gabarito</label>
                                    {form.type === QuestionType.MULTIPLE_CHOICE && (
                                        <button
                                            onClick={handleGenerateAlts}
                                            disabled={isGeneratingAlts}
                                            className="text-xs flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 hover:bg-indigo-100 transition font-bold"
                                            title="Gera 4 alternativas incorretas plausíveis"
                                        >
                                            {isGeneratingAlts ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            Autocompletar Distratores
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {alternatives.map((alt, i) => (
                                        <div
                                            key={i}
                                            draggable={form.type === QuestionType.MULTIPLE_CHOICE}
                                            onDragStart={(e) => handleDragStart(e, i)}
                                            onDragOver={(e) => handleDragOver(e, i)}
                                            onDragEnd={handleDragEnd}
                                            className={`flex items-start gap-3 p-3 rounded bg-white border border-slate-200 transition ${draggedIdx === i ? 'opacity-50 bg-slate-200' : ''}`}
                                        >
                                            {form.type === QuestionType.MULTIPLE_CHOICE && (
                                                <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-brand-primary mt-2">
                                                    <GripVertical size={20} />
                                                </div>
                                            )}
                                            <div className="pt-2">
                                                <input
                                                    type="radio"
                                                    name="correct"
                                                    checked={alt.isCorrect}
                                                    onChange={() => {
                                                        const newAlts = alternatives.map((a, idx) => ({ ...a, isCorrect: idx === i }));
                                                        setAlternatives(newAlts);
                                                    }}
                                                    className="w-5 h-5 text-brand-primary focus:ring-brand-secondary border-brand-dark bg-brand-input"
                                                />
                                            </div>

                                            <div className="flex-1">
                                                {/* RICH TEXT EDITOR FOR ALTERNATIVES */}
                                                <RichTextEditor
                                                    value={alt.text}
                                                    onChange={(val) => {
                                                        const newAlts = [...alternatives];
                                                        newAlts[i].text = val;
                                                        setAlternatives(newAlts);
                                                    }}
                                                    placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                                                    miniMode={true}
                                                />
                                            </div>

                                            {form.type === QuestionType.MULTIPLE_CHOICE && (
                                                <button onClick={() => setAlternatives(alternatives.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 mt-2"><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {form.type === QuestionType.MULTIPLE_CHOICE && (
                                    <button onClick={() => setAlternatives([...alternatives, { text: '', isCorrect: false }])} className="text-sm text-brand-primary hover:underline mt-4 font-bold flex items-center gap-1">
                                        <span className="text-lg">+</span> Adicionar Alternativa
                                    </button>
                                )}
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-700">
                                    {form.type === QuestionType.ESSAY || form.type === QuestionType.REDACTION ? 'Critérios de Correção / Gabarito Esperado' : 'Justificativa da Resposta Correta'}
                                </label>
                                <button
                                    onClick={handleGenerateJustification}
                                    disabled={isImproving}
                                    className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 hover:bg-indigo-100 transition font-bold uppercase"
                                >
                                    {isImproving ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                    Gerar Justificativa
                                </button>
                            </div>
                            <RichTextEditor
                                value={form.correctAnswerJustification}
                                onChange={(val) => setForm({ ...form, correctAnswerJustification: val })}
                                placeholder={form.type === QuestionType.REDACTION ? "Descreva o que se espera que o aluno aborde na redação..." : "Explique o raciocínio da resposta correta..."}
                                height="h-32"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6 pb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                                <input className="w-full border rounded-lg p-2 text-sm" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Separe por vírgulas" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-700">Código BNCC</label>
                                    <button
                                        onClick={handleSuggestBNCC}
                                        disabled={isBNCCLoading}
                                        className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 hover:bg-blue-100 transition font-bold uppercase"
                                    >
                                        {isBNCCLoading ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                        Sugerir
                                    </button>
                                </div>
                                <div className="relative">
                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input className="w-full border rounded-lg pl-9 p-2 text-sm uppercase" value={form.bnccCode} onChange={e => setForm({ ...form, bnccCode: e.target.value })} placeholder="Ex: EF09HI01" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // AI Mode (Existing)
                    <div className="space-y-6">
                        {activeBatchId ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                        <Sparkles className="text-brand-secondary" /> Revisão de Lote
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

                                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Tem certeza que deseja excluir este lote e todas as suas questões?')) {
                                                                await state.deleteGenerationBatch(b.id);
                                                            }
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title="Excluir Lote"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Mover todas as questões deste lote para o Banco de Itens (Aprovar)?')) {
                                                                await state.approveAllItemsInBatch(b.id);
                                                                alert('Questões movidas para o Banco com sucesso!');
                                                            }
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                                                        title="Mover para Banco de Itens"
                                                    >
                                                        <CheckSquare size={18} />
                                                    </button>
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
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-400 italic">Nenhum lote anterior encontrado.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 text-sm text-sky-900 mb-4">
                                    <p className="font-semibold flex items-center gap-2"><Brain size={16} /> IA SAEB/INEP + BNCC + TRI</p>
                                    Faça upload de materiais em <b>PDF, Word (DOCX), Excel ou TXT</b>. A IA seguirá os padrões do INEP/BNCC e estimará parâmetros TRI automaticamente.
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Disciplina Alvo</label>
                                        <input className="w-full border rounded-lg p-2 text-sm" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Geografia" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nível Desejado</label>
                                        <select className="w-full border rounded-lg p-2 text-sm" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as DifficultyLevel })}>
                                            <option value="FACIL">Fácil</option>
                                            <option value="MEDIO">Médio</option>
                                            <option value="DIFICIL">Difícil</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. Questões</label>
                                        <input type="number" min="1" max="50" className="w-full border rounded-lg p-2 text-sm" value={aiQuantity} onChange={e => setAiQuantity(parseInt(e.target.value) || 1)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Texto de Contexto ou Arquivo</label>
                                    <textarea className="w-full border rounded-lg p-3 text-sm h-40 font-mono mb-2" value={aiContext} onChange={e => setAiContext(e.target.value)} placeholder="Cole aqui o texto ou faça upload de um arquivo para análise..." />
                                    <input type="file" accept=".txt,.csv,.md,.pdf,.docx,.xlsx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                    <button onClick={() => fileInputRef.current?.click()} className="text-sm text-white bg-brand-primary hover:bg-sky-700 px-4 py-2 rounded-lg flex items-center gap-2 w-fit transition shadow-sm font-bold"><Upload size={16} /> Carregar PDF, Word ou Excel</button>
                                </div>
                                <button onClick={handleGenerate} disabled={aiLoading} className="w-full py-3 btn-gradient rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01]">
                                    {aiLoading ? <><Loader2 size={20} className="animate-spin" /> Processando Documento...</> : <><Brain size={20} /> Gerar Itens Padrão INEP</>}
                                </button>
                            </>
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
        </div >
    );
};
