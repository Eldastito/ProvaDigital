
import React, { useState, useRef } from 'react';
import { Brain, X, Trash2, Image as ImageIcon, Upload, GripVertical, BookOpen, Eye, CheckSquare, Save, Wand2, Loader2, Sparkles } from 'lucide-react';
import { AppState, Item, DifficultyLevel, QuestionType, ItemOrigin } from '../types';
import { generateQuestionsFromText, improveItemStatement, generateDistractors, suggestBNCC } from '../services/geminiService';
import { uuidv4 } from '../utils/helpers';
import { RichTextEditor } from './RichTextEditor';

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

export const ItemEditorView = ({ state, onSave, onCancel }: { state: AppState, onSave: (item: Item) => void, onCancel: () => void }) => {
    const [mode, setMode] = useState<'MANUAL' | 'AI'>('MANUAL');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [aiContext, setAiContext] = useState('');
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
        justification: string;
        tags: string;
        imageUrl: string;
        bnccCode: string;
        minLines: string;
        maxLines: string;
        showWordCount: boolean;
    }>({
        statement: '',
        subject: '',
        difficulty: DifficultyLevel.MEDIUM,
        type: QuestionType.MULTIPLE_CHOICE,
        justification: '',
        tags: '',
        imageUrl: '',
        bnccCode: '',
        minLines: '',
        maxLines: '',
        showWordCount: false
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
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; setAiContext(prev => prev + "\n\n--- Conteúdo do Arquivo ---\n" + text); }; reader.readAsText(file); };

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

    const handleSuggestBNCC = async () => {
        if (!form.statement.trim()) return alert('O enunciado é necessário para sugerir a BNCC.');
        setIsBNCCLoading(true);
        const suggestion = await suggestBNCC(form.statement);
        setForm(prev => ({ ...prev, bnccCode: suggestion.code }));
        alert(`Sugerido: ${suggestion.code}\nMotivo: ${suggestion.reason}`);
        setIsBNCCLoading(false);
    };

    const handleGenerate = async () => {
        if (!aiContext) return alert('Insira um texto de contexto.');
        setAiLoading(true);
        try {
            const questions = await generateQuestionsFromText(
                aiContext, 3, QuestionType.MULTIPLE_CHOICE, form.difficulty, form.subject || 'Geral'
            );
            setGeneratedItems(questions);
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    };

    const approveItem = (genItem: any) => {
        const newItem: Item = {
            id: uuidv4(),
            tenantId: state.currentUser?.tenantId || 't1',
            schoolId: state.currentUser?.schoolId,
            ownerId: state.currentUser?.id || '',
            knowledgeArea: 'Geral',
            subject: form.subject || 'Geral',
            type: QuestionType.MULTIPLE_CHOICE,
            statement: genItem.statement,
            alternatives: genItem.alternatives.map((a: any, i: number) => ({ id: `alt-${i}`, text: a.text, isCorrect: a.isCorrect })),
            correctAnswerJustification: genItem.justification,
            difficulty: genItem.difficulty as DifficultyLevel,
            score: 1.0,
            origin: ItemOrigin.IA,
            tags: ['IA', 'Gerado'],
            bnccCode: genItem.bnccCode,
            usageCount: 0,
            createdAt: new Date().toISOString()
        };
        onSave(newItem);
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
            correctAnswerJustification: form.justification,
            difficulty: form.difficulty,
            score: 1.0,
            origin: ItemOrigin.MANUAL,
            tags: form.tags.split(',').map(t => t.trim()).filter(t => t),
            bnccCode: form.bnccCode,
            minLines: form.minLines ? parseInt(form.minLines) : undefined,
            maxLines: form.maxLines ? parseInt(form.maxLines) : undefined,
            showWordCount: form.showWordCount,
            usageCount: 0,
            createdAt: new Date().toISOString()
        };

        onSave(newItem);
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
                </div>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
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
                                <button
                                    onClick={handleImproveStatement}
                                    disabled={isImproving}
                                    className="text-xs flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100 hover:bg-purple-100 transition font-bold"
                                    title="Melhorar clareza e gram\u00e1tica com IA"
                                >
                                    {isImproving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    Aprimorar com IA
                                </button>
                            </div>
                            {/* RICH TEXT EDITOR FOR STATEMENT */}
                            <RichTextEditor
                                value={form.statement}
                                onChange={(val) => setForm({ ...form, statement: val })}
                                placeholder={form.type === QuestionType.REDACTION ? "Insira os textos motivadores e o tema da redação..." : "Digite o enunciado. Use **negrito**, $$fórmulas$$..."}
                                height="h-64"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem (Opcional)</label>
                            <div className="relative flex-1">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent" size={16} />
                                <input
                                    className="w-full border rounded-lg pl-9 p-2 text-sm"
                                    value={form.imageUrl}
                                    onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                                    placeholder="https://exemplo.com/figura.jpg"
                                />
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
                                value={form.justification}
                                onChange={(val) => setForm({ ...form, justification: val })}
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
                            <p className="font-semibold flex items-center gap-2"><Brain size={16} /> IA Generator + BNCC</p>
                            Faça upload de um arquivo de texto ou cole o conteúdo abaixo. A IA irá sugerir códigos BNCC automaticamente.
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
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
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Texto de Contexto</label>
                            <textarea className="w-full border rounded-lg p-3 text-sm h-40 font-mono mb-2" value={aiContext} onChange={e => setAiContext(e.target.value)} placeholder="Cole aqui o texto ou faça upload de um arquivo..." />
                            <input type="file" accept=".txt,.csv,.md" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm text-white bg-brand-primary hover:bg-sky-700 px-3 py-1 rounded flex items-center gap-2 w-fit"><Upload size={14} /> Carregar Arquivo (.txt)</button>
                        </div>
                        <button onClick={handleGenerate} disabled={aiLoading} className="w-full py-3 btn-gradient rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
                            {aiLoading ? 'Processando...' : <><Brain size={20} /> Gerar Questões</>}
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
                                            {item.bnccCode && <div className="text-xs font-bold text-indigo-600 mb-2 bg-indigo-50 inline-block px-2 rounded border border-indigo-100">{item.bnccCode}</div>}
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
        </div>
    );
};
