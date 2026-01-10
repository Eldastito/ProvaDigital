import React, { useState, useRef } from 'react';
import { Brain, X, Trash2, Image as ImageIcon, Upload, GripVertical, BookOpen, Eye, CheckSquare, Save, Wand2, Loader2, Sparkles, Video, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppState, Item, DifficultyLevel, QuestionType, ItemOrigin } from '../types';
import { generateQuestionsFromText, improveItemStatement, generateDistractors, suggestBNCC, generateJustification } from '../services/geminiService';
import { uuidv4 } from '../utils/helpers';
import { RichTextEditor } from './RichTextEditor';
import { useAppStore } from '../store/useAppStore';

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

export const ItemEditorView = ({ state }: { state: AppState }) => {
    const navigate = useNavigate();
    const { addItem } = useAppStore();
    const [mode, setMode] = useState<'MANUAL' | 'AI'>('MANUAL');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [aiContext, setAiContext] = useState('');
    const [aiQuantity, setAiQuantity] = useState(3);
    const [aiLoading, setAiLoading] = useState(false);
    const [generatedItems, setGeneratedItems] = useState<any[]>([]);

    // Novas flags de carregamento para otimização
    const [isImproving, setIsImproving] = useState(false);
    const [isGeneratingAlts, setIsGeneratingAlts] = useState(false);
    const [isBNCCLoading, setIsBNCCLoading] = useState(false);

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
        setAiLoading(true);
        try {
            const questions = await generateQuestionsFromText(
                aiContext, aiQuantity, QuestionType.MULTIPLE_CHOICE, form.difficulty, form.subject || 'Geral'
            );
            setGeneratedItems(questions);
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar questões. Verifique sua conexão e tente novamente.");
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

    const approveItem = (genItem: any) => {
        setForm(prev => ({
            ...prev,
            statement: genItem.statement,
            difficulty: genItem.difficulty as DifficultyLevel,
            correctAnswerJustification: genItem.justification,
            bnccCode: genItem.bnccCode || '',
            triParams: genItem.triParams
        }));

        // Mapear alternativas da IA para o formato do formulário
        if (genItem.alternatives) {
            setAlternatives(genItem.alternatives.map((a: any) => ({
                text: a.text,
                isCorrect: a.isCorrect
            })));
        }

        setGeneratedItems([]);
        setMode('MANUAL');
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
            createdAt: new Date().toISOString()
        };

        addItem(newItem);
        alert("Questão salva com sucesso!");
        navigate('/teacher/itens');
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
                        <button
                            onClick={handleMagicPolish}
                            disabled={isImproving || isGeneratingAlts || isBNCCLoading}
                            className="pb-1 text-sm font-bold text-indigo-600 flex items-center gap-2 hover:text-indigo-800 transition border-b-2 border-transparent hover:border-indigo-400"
                            title="Aprimora enunciado, gera alternativas e sugere BNCC de uma só vez"
                        >
                            {isImproving || isGeneratingAlts || isBNCCLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Polimento Mágico
                        </button>
                    )}
                </div>
                <button onClick={() => navigate('/items')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
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
                                    <option value={QuestionType.MULTIPLE_CHOICE}>Múltipla Escolha</option>
                                    <option value={QuestionType.TRUE_FALSE}>Verdadeiro / Falso</option>
                                    <option value={QuestionType.ESSAY}>Discursiva (Curta)</option>
                                    <option value={QuestionType.REDACTION}>Tema de Redação</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dificuldade</label>
                                <select className="w-full border rounded-lg p-2 text-sm" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as DifficultyLevel })}>
                                    <option value="FACIL">Fácil</option>
                                    <option value="MEDIO">Médio</option>
                                    <option value="DIFICIL">Difícil</option>
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
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary">
                                        {(form as any).multimedia?.[0]?.type === 'VIDEO' ? <Video size={16} /> : <Music size={16} />}
                                    </div>
                                    <input
                                        className="w-full border rounded-lg pl-9 p-2 text-sm"
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
                                </div>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {form.type === QuestionType.ESSAY || form.type === QuestionType.REDACTION ? 'Critérios de Correção / Gabarito Esperado' : 'Justificativa da Resposta Correta'}
                            </label>
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
                        {generatedItems.length > 0 && (
                            <div className="mt-8 border-t pt-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Propostas da IA</h3>
                                <div className="space-y-4">
                                    {generatedItems.map((item, idx) => (
                                        <div key={idx} className="border rounded-xl p-4 bg-slate-50 hover:border-brand-secondary transition">
                                            <div className="flex justify-between gap-4 mb-2">
                                                <div className="font-medium text-slate-900">{item.statement}</div>
                                                <button onClick={() => approveItem(item)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-emerald-700 h-8 whitespace-nowrap">Aprovar</button>
                                            </div>
                                            {item.bnccCode && <div className="text-xs font-bold text-indigo-600 mb-2 bg-indigo-50 inline-block px-2 rounded border border-indigo-100 mr-2">{item.bnccCode}</div>}
                                            {item.triParams && (
                                                <div className="text-[10px] font-bold text-amber-600 mb-2 bg-amber-50 inline-block px-2 rounded border border-amber-100">
                                                    TRI: {item.triParams.difficulty.toFixed(1)} | {item.triParams.bloomTaxonomy}
                                                </div>
                                            )}
                                            <ul className="pl-4 list-disc text-sm text-slate-600 space-y-1 mb-2">
                                                {item.alternatives.map((alt: any, i: number) => (
                                                    <li key={i} className={alt.isCorrect ? "text-emerald-700 font-medium" : ""}>{alt.text}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end flex-shrink-0">
                <button onClick={saveManual} className="btn-gradient px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2">
                    <Save size={18} /> Salvar Item
                </button>
            </div>
        </div >
    );
};
