import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Save, Trash2, Loader2, Image as ImageIcon, CheckCircle2, ArrowRight } from 'lucide-react';
import { QuestionType, DifficultyLevel, Item, ItemOrigin, ItemLifecycleStatus } from '../../types';
import { generateQuestionsFromText, generateEssayQuestion, generateVisualSuggestion, auditPedagogicalItem, GeneratedEssay, VisualSuggestion } from '../../services/geminiService';
import { useSafeAppStore } from '../../store/useAppStore';
import { uuidv4 } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

export const AIQuestionGeneratorView = () => {
    const navigate = useNavigate();
    const state = useSafeAppStore();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Config
    const [config, setConfig] = useState({
        type: QuestionType.MULTIPLE_CHOICE,
        subject: '',
        grade: '',
        topic: '',
        count: 5,
        difficulty: DifficultyLevel.MEDIUM,
        bnccCode: '',
        withVisual: false
    });

    const [context, setContext] = useState('');
    const [batchId, setBatchId] = useState<string | null>(null);
    const [generatedItems, setGeneratedItems] = useState<any[]>([]);
    const [visualSuggestions, setVisualSuggestions] = useState<Record<number, VisualSuggestion>>({});
    const [auditResults, setAuditResults] = useState<Record<number, any>>({});
    const [auditing, setAuditing] = useState(false);

    // Persistence Logic
    useEffect(() => {
        // Use a stable key to avoid race conditions with User ID loading
        const key = 'ai_generator_current_draft';
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                // Validate if draft is not too old (e.g. 24h)
                if (Date.now() - (draft.updatedAt || 0) < 24 * 60 * 60 * 1000) {
                    console.log("Restoring draft...", draft);
                    setConfig(draft.config);
                    setContext(draft.context);
                    setBatchId(draft.batchId);
                    setGeneratedItems(draft.generatedItems);
                    setVisualSuggestions(draft.visualSuggestions || {});
                    setAuditResults(draft.auditResults || {});
                    setStep(draft.step);
                }
            } catch (e) { console.error("Error restoring AI draft", e); }
        }
    }, []); // Run once on mount

    useEffect(() => {
        if (!config.topic && generatedItems.length === 0) return;

        const key = 'ai_generator_current_draft';
        const draft = {
            config,
            context,
            batchId,
            generatedItems,
            visualSuggestions,
            auditResults,
            step,
            updatedAt: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(draft));
    }, [config, context, batchId, generatedItems, visualSuggestions, auditResults, step]);

    const handleGenerate = async () => {
        setLoading(true);
        const newBatchId = uuidv4();
        setBatchId(newBatchId);
        setAuditResults({}); // Reset audits

        try {
            let res: any[] = [];

            if (config.type === QuestionType.REDACTION) {
                const essay = await generateEssayQuestion(config.subject, config.topic);
                res = [essay];
                setGeneratedItems(res);
            } else {
                res = await generateQuestionsFromText(
                    context || `Crie questões sobre ${config.topic} para o ${config.grade} de ${config.subject}. Alinhado à BNCC ${config.bnccCode}`,
                    config.count,
                    config.type,
                    config.difficulty,
                    config.subject
                );
                setGeneratedItems(res);

                if (config.withVisual && res.length > 0) {
                    generateVisualSuggestion(res[0].statement).then(vis => {
                        setVisualSuggestions(prev => ({ ...prev, 0: vis }));
                    });
                }
            }
            setStep(2);

            // --- AUTOMATED AUDIT FACTORY ---
            if (config.type !== QuestionType.REDACTION) {
                setAuditing(true);
                // Trigger audits in parallel
                res.forEach(async (item, idx) => {
                    try {
                        const audit = await auditPedagogicalItem(JSON.stringify(item));
                        setAuditResults(prev => ({ ...prev, [idx]: audit }));
                    } catch (err) {
                        console.error("Audit failed for item", idx, err);
                    }
                });
                setAuditing(false);
            }

        } catch (e) {
            alert("Erro na geração: " + e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        const newItems: Item[] = generatedItems.map((g, idx) => {
            if (config.type === QuestionType.REDACTION) {
                const essay = g as GeneratedEssay;
                return {
                    id: uuidv4(),
                    tenantId: state.currentUser?.tenantId || 't1',
                    ownerId: state.currentUser?.id || 'sys',
                    statement: `${essay.motivationalText}\n\n**Comando:** ${essay.instruction}`,
                    subject: config.subject,
                    type: QuestionType.REDACTION,
                    difficulty: DifficultyLevel.MEDIUM,
                    alternatives: [],
                    correctAnswerJustification: JSON.stringify(essay.criteria),
                    tags: ['IA', 'Redação', essay.bnccCode],
                    bnccCode: essay.bnccCode,
                    score: 10.0,
                    origin: ItemOrigin.IA,
                    lifecycleStatus: ItemLifecycleStatus.DRAFT,
                    generationBatchId: batchId || undefined,
                    createdAt: new Date().toISOString(),
                    knowledgeArea: 'Linguagens',
                    usageCount: 0
                };
            } else {
                return {
                    id: uuidv4(),
                    tenantId: state.currentUser?.tenantId || 't1',
                    ownerId: state.currentUser?.id || 'sys',
                    statement: g.statement,
                    subject: config.subject,
                    type: config.type,
                    difficulty: g.difficulty as DifficultyLevel,
                    alternatives: g.alternatives.map((a: any) => ({ id: uuidv4(), ...a })),
                    correctAnswerJustification: g.justification,
                    tags: ['IA', 'Gerador', g.bnccCode || ''],
                    bnccCode: g.bnccCode || config.bnccCode,
                    score: 1.0,
                    origin: ItemOrigin.IA,
                    lifecycleStatus: ItemLifecycleStatus.DRAFT,
                    generationBatchId: batchId || undefined,
                    createdAt: new Date().toISOString(),
                    knowledgeArea: 'Geral',
                    usageCount: 0
                };
            }
        });

        await state.addItems(newItems);
        localStorage.removeItem('ai_generator_current_draft');
        alert(`${newItems.length} itens salvos no banco!`);
        navigate('/items');
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/10 rounded-xl">
                            <Brain className="text-brand-primary" size={32} />
                        </div>
                        Gerador Pedagógico IA
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Crie questões e redações alinhadas à BNCC em segundos.</p>
                </div>
                <button
                    onClick={() => navigate('/items')}
                    className="px-4 py-2 text-slate-400 hover:text-slate-600 font-bold"
                >
                    Voltar para o Banco
                </button>
            </header>

            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* Params */}
                    <div className="lg:col-span-1 space-y-6">
                        <section className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">Configurações</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Tipo de Item</label>
                                    <select
                                        value={config.type}
                                        onChange={e => setConfig({ ...config, type: e.target.value as QuestionType })}
                                        className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl font-bold text-slate-800"
                                    >
                                        <option value={QuestionType.MULTIPLE_CHOICE}>Múltipla Escolha</option>
                                        <option value={QuestionType.ESSAY}>Discursiva</option>
                                        <option value={QuestionType.REDACTION}>Redação/Composição</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500">Disciplina</label>
                                    <input
                                        value={config.subject}
                                        placeholder="Ex: Matemática"
                                        onChange={e => setConfig({ ...config, subject: e.target.value })}
                                        className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Série</label>
                                        <input
                                            value={config.grade}
                                            placeholder="Ex: 9º Ano"
                                            onChange={e => setConfig({ ...config, grade: e.target.value })}
                                            className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500">Qtd. Itens</label>
                                        <input
                                            type="number"
                                            value={config.count}
                                            min={1} max={20}
                                            onChange={e => setConfig({ ...config, count: parseInt(e.target.value) })}
                                            className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl font-bold"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500">Dificuldade Alvo</label>
                                    <div className="flex gap-2 mt-1">
                                        {[DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setConfig({ ...config, difficulty: d })}
                                                className={`flex-1 py-2 rounded-lg text-xs font-black transition ${config.difficulty === d ? 'bg-brand-primary text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500">Código BNCC (Opcional)</label>
                                    <input
                                        value={config.bnccCode}
                                        placeholder="Ex: EF09HI01"
                                        onChange={e => setConfig({ ...config, bnccCode: e.target.value })}
                                        className="w-full mt-1 p-3 bg-slate-50 border-none rounded-xl font-bold"
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-10 h-6 rounded-full transition relative ${config.withVisual ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.withVisual ? 'left-5' : 'left-1'}`} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={config.withVisual}
                                        onChange={e => setConfig({ ...config, withVisual: e.target.checked })}
                                    />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition">Incluir Sugestão Visual</span>
                                </label>
                            </div>
                        </section>
                    </div>

                    {/* Context / Topic */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 h-full flex flex-col">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">Tópico ou Texto de Apoio</h3>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Título/Tema Central</label>
                                    <input
                                        value={config.topic}
                                        placeholder="Sobre o que são as questões?"
                                        onChange={e => setConfig({ ...config, topic: e.target.value })}
                                        className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-xl"
                                    />
                                </div>

                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500">Contexto Adicional (Opcional)</label>
                                    <textarea
                                        value={context}
                                        placeholder="Cole aqui um pedaço de um livro ou notícia para a IA usar como base..."
                                        onChange={e => setContext(e.target.value)}
                                        className="w-full mt-2 p-6 bg-slate-50 border-none rounded-3xl font-medium min-h-[300px] leading-relaxed"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading || !config.topic}
                                className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-900/20"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="text-indigo-400" />}
                                {loading ? 'O Corujão está criando...' : 'Gerar Itens com IA'}
                            </button>
                        </section>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full uppercase tracking-wider">Preview da Geração</span>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-slate-900 mt-2">Fábrica de Itens (Revisão)</h2>
                                {auditing && (
                                    <span className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-pulse border border-amber-200 mt-2">
                                        <Loader2 size={12} className="animate-spin" /> Auditando Qualidade INEP...
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                            >
                                Refazer
                            </button>
                            <button
                                onClick={handleSaveAll}
                                className="px-8 py-3 bg-brand-primary text-white font-black rounded-xl shadow-lg shadow-brand-primary/30 flex items-center gap-2"
                            >
                                <Save size={20} /> Salvar Tudo no Banco
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {generatedItems.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                                <div className="w-12 bg-slate-900 flex items-center justify-center text-white font-black text-xl">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 p-8">
                                    {config.type === QuestionType.REDACTION ? (
                                        <div className="space-y-6">
                                            <h4 className="text-xl font-black text-slate-800">{item.title}</h4>
                                            <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-slate-300 italic font-serif leading-relaxed">
                                                {item.motivationalText}
                                            </div>
                                            <div>
                                                <h5 className="font-black text-slate-500 text-xs uppercase mb-2">Comando da Redação</h5>
                                                <p className="font-bold text-slate-700">{item.instruction}</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {item.criteria.map((c: any, cidx: number) => (
                                                    <div key={cidx} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                                        <p className="text-xs font-black text-indigo-600 uppercase">{c.name}</p>
                                                        <p className="text-sm font-medium text-slate-600 mt-1">{c.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-800 text-lg leading-relaxed">{item.statement}</p>
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase">
                                                    BNCC: {item.bnccCode || 'N/A'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 mt-6">
                                                {item.alternatives.map((alt: any, aidx: number) => (
                                                    <div key={aidx} className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${alt.isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${alt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                            {String.fromCharCode(65 + aidx)}
                                                        </div>
                                                        <span className={`font-semibold ${alt.isCorrect ? 'text-emerald-700' : 'text-slate-600'}`}>{alt.text}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* AUDIT REPORT CARD */}
                                            {auditResults[idx] && (
                                                <div className="mt-6 border-2 border-slate-100 rounded-3xl overflow-hidden">
                                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                            <CheckCircle2 size={14} className={auditResults[idx].score > 80 ? "text-emerald-500" : "text-amber-500"} />
                                                            Relatório de Qualidade INEP
                                                        </h5>
                                                        <div className={`px-3 py-1 rounded-full text-xs font-black ${auditResults[idx].score > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            IQI: {auditResults[idx].score}/100
                                                        </div>
                                                    </div>
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Veredito BNCC</p>
                                                            <p className="text-sm font-semibold text-slate-700">{auditResults[idx].bnccVerdict}</p>

                                                            <div className="flex flex-wrap gap-2 mt-4">
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Taxonomia de Bloom</p>
                                                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md uppercase border border-purple-100">
                                                                        {auditResults[idx].bloomLevel}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Eixo Cognitivo (ENEM)</p>
                                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase border border-blue-100">
                                                                        {auditResults[idx].cognitiveAxis || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {auditResults[idx].pros && auditResults[idx].pros.length > 0 && (
                                                                <div>
                                                                    <span className="text-[10px] font-black text-emerald-600 uppercase mb-1 block">Positivos</span>
                                                                    <ul className="list-disc list-inside text-xs text-slate-600">
                                                                        {auditResults[idx].pros.slice(0, 2).map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {auditResults[idx].improvements && auditResults[idx].improvements.length > 0 && (
                                                                <div>
                                                                    <span className="text-[10px] font-black text-rose-500 uppercase mb-1 block">Atenção</span>
                                                                    <ul className="list-disc list-inside text-xs text-slate-600">
                                                                        {auditResults[idx].improvements.slice(0, 2).map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {auditResults[idx].score < 100 && (
                                                        <div className="bg-orange-50/50 p-3 flex justify-center border-t border-orange-100">
                                                            <button className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                                                                <Sparkles size={12} /> Aplicar Melhorias Sugeridas (IA)
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                    <CheckCircle2 size={12} className="text-slate-400" /> Justificativa Pedagógica
                                                </h5>
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.justification}</p>
                                            </div>

                                            {visualSuggestions[idx] && (
                                                <div className="mt-6 p-6 bg-indigo-900 text-white rounded-3xl shadow-xl shadow-indigo-900/10">
                                                    <h5 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <ImageIcon size={14} /> Sugestão de Recurso Multimodal
                                                    </h5>
                                                    <p className="text-sm font-bold leading-relaxed">{visualSuggestions[idx].description}</p>
                                                    <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/10">
                                                        <p className="text-[10px] font-black text-indigo-200 uppercase mb-1">Prompt para IA de Imagem</p>
                                                        <p className="text-xs font-mono opacity-80">{visualSuggestions[idx].imageGeneratorPrompt}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="w-16 border-l flex flex-col items-center py-4 bg-slate-50">
                                    <button
                                        onClick={() => setGeneratedItems(generatedItems.filter((_, i) => i !== idx))}
                                        className="p-3 text-slate-400 hover:text-rose-500 transition"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
