
import React, { useState, useRef, useEffect } from 'react';
import { Brain, X, Trash2, Image as ImageIcon, Plus, BookOpen, Save, CheckCircle, Info, Paperclip, Loader2, Sparkles, Wand2, FileUp } from 'lucide-react';
import { AppState, Item, DifficultyLevel, QuestionType, ItemOrigin } from '../types';
import { generateQuestionsWithAI, suggestBnccCode } from '../services/geminiService';
import { uuidv4 } from '../utils/helpers';
import { RichTextEditor } from './RichTextEditor';
import { Badge } from './ui/Badge';
import { useAppStore } from '../store/useAppStore';
import { useMutation } from '@tanstack/react-query';
import { insertItem } from '../services/supabaseClient';

const INITIAL_SUBJECTS = [
    'Artes', 'Biologia', 'Ciências', 'Educação Física', 'Ensino Religioso', 'Espanhol', 'Filosofia', 'Física', 'Geografia', 'História', 'Inglês', 'Língua Portuguesa', 'Literatura', 'Matemática', 'Química', 'Redação', 'Sociologia'
];

const INITIAL_TYPES = [
    { value: QuestionType.MULTIPLE_CHOICE, label: 'Múltipla Escolha' },
    { value: QuestionType.TRUE_FALSE, label: 'Verdadeiro / Falso' },
    { value: QuestionType.ESSAY, label: 'Discursiva' },
    { value: QuestionType.REDACTION, label: 'Redação' }
];

export const ItemEditorView = ({ onSave, onCancel }: { state?: AppState, onSave: (item: Item) => void, onCancel: () => void }) => {
    const { currentUser } = useAppStore();
    
    const [mode, setMode] = useState<'MANUAL' | 'AI'>('MANUAL');
    const [subjects, setSubjects] = useState<string[]>(() => {
        const saved = localStorage.getItem('ep_custom_subjects');
        return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
    });
    const [questionTypes, setQuestionTypes] = useState<any[]>(() => {
        const saved = localStorage.getItem('ep_custom_types');
        return saved ? JSON.parse(saved) : INITIAL_TYPES;
    });

    const [newSubjectName, setNewSubjectName] = useState('');
    const [newTypeName, setNewTypeName] = useState('');

    const [aiContext, setAiContext] = useState('');
    const [aiInstructions, setAiInstructions] = useState('');
    const [aiFormat, setAiFormat] = useState('MULTIPLE_CHOICE_4');
    const [aiLoading, setAiLoading] = useState(false);
    const [generatedItems, setGeneratedItems] = useState<any[]>([]);
    const [attachedFile, setAttachedFile] = useState<{data: string, name: string, mimeType: string} | null>(null);

    const [form, setForm] = useState<{
        statement: string;
        subject: string;
        difficulty: DifficultyLevel;
        type: QuestionType;
        justification: string;
        tags: string;
        bnccCode: string;
    }>({
        statement: '',
        subject: subjects[0] || '',
        difficulty: DifficultyLevel.MEDIUM,
        type: QuestionType.MULTIPLE_CHOICE,
        justification: '',
        tags: '',
        bnccCode: ''
    });

    const [alternatives, setAlternatives] = useState<{ id: string; text: string; isCorrect: boolean }[]>([
        { id: uuidv4(), text: '', isCorrect: true },
        { id: uuidv4(), text: '', isCorrect: false }
    ]);

    const [bnccLoading, setBnccLoading] = useState(false);

    const addItemMutation = useMutation({
        mutationFn: insertItem,
        onSuccess: (data, variables) => {
            onSave(variables as any);
            alert('Item adicionado ao Banco com sucesso!');
        }
    });

    // --- Persistência e Sincronização ---
    useEffect(() => {
        localStorage.setItem('ep_custom_subjects', JSON.stringify(subjects));
    }, [subjects]);

    useEffect(() => {
        localStorage.setItem('ep_custom_types', JSON.stringify(questionTypes));
    }, [questionTypes]);

    const handleAddSubject = () => {
        if (!newSubjectName.trim()) return;
        if (subjects.includes(newSubjectName)) return alert("Essa disciplina já existe.");
        setSubjects(prev => [...prev, newSubjectName].sort());
        setNewSubjectName('');
    };

    const handleAddType = () => {
        if (!newTypeName.trim()) return;
        const value = newTypeName.toUpperCase().replace(/\s+/g, '_');
        if (questionTypes.find(t => t.value === value)) return alert("Este tipo já existe.");
        setQuestionTypes(prev => [...prev, { value, label: newTypeName }]);
        setNewTypeName('');
    };

    const handleTypeChange = (newType: string) => {
        setForm({ ...form, type: newType as QuestionType });
        if (newType === QuestionType.TRUE_FALSE) {
            setAlternatives([
                { id: 'v', text: 'Verdadeiro', isCorrect: true },
                { id: 'f', text: 'Falso', isCorrect: false }
            ]);
        } else if (newType === QuestionType.ESSAY || newType === QuestionType.REDACTION) {
            setAlternatives([]);
        } else {
            if (alternatives.length === 0 || alternatives.length < 2) {
                setAlternatives([
                    { id: uuidv4(), text: '', isCorrect: true },
                    { id: uuidv4(), text: '', isCorrect: false }
                ]);
            }
        }
    };

    const handleAutoBncc = async () => {
        if (!form.statement.trim()) return alert("Descreva o enunciado primeiro para a IA analisar.");
        setBnccLoading(true);
        try {
            const code = await suggestBnccCode(form.statement, form.subject);
            setForm(prev => ({ ...prev, bnccCode: code }));
        } catch (e) {
            console.error(e);
        } finally {
            setBnccLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = (event.target?.result as string).split(',')[1];
            setAttachedFile({
                data: base64,
                name: file.name,
                mimeType: file.type
            });
        };
        reader.readAsDataURL(file);
    };

    const handleGenerateAI = async () => {
        if (!aiContext.trim() && !attachedFile) return alert('Insira um contexto ou anexe um arquivo para análise.');
        setAiLoading(true);
        try {
            const questions = await generateQuestionsWithAI(
                aiContext, 3, aiFormat, form.difficulty, form.subject, aiInstructions, attachedFile || undefined
            );
            setGeneratedItems(questions);
        } catch(e) {
            console.error(e);
            alert('Falha na geração inteligente. Verifique a chave API ou tente novamente.');
        } finally {
            setAiLoading(false);
        }
    };

    const approveAIItem = (genItem: any) => {
        if (!currentUser) return;
        const newItem: Item = {
            id: uuidv4(),
            tenantId: currentUser.tenantId,
            schoolId: currentUser.schoolId,
            ownerId: currentUser.id,
            knowledgeArea: 'Geral',
            subject: form.subject,
            type: genItem.alternatives?.length > 0 ? QuestionType.MULTIPLE_CHOICE : QuestionType.ESSAY,
            statement: genItem.statement,
            alternatives: genItem.alternatives?.map((a: any) => ({ id: uuidv4(), text: a.text, isCorrect: a.isCorrect })) || [],
            correctAnswerJustification: genItem.justification,
            difficulty: genItem.difficulty as DifficultyLevel,
            score: 1.0,
            origin: ItemOrigin.IA,
            tags: ['AI', 'Gerado'],
            bnccCode: genItem.bnccCode,
            usageCount: 0,
            createdAt: new Date().toISOString()
        };
        addItemMutation.mutate(newItem);
    };

    const saveManual = () => {
        if (!currentUser) return;
        if (!form.statement.trim()) return alert('O enunciado é obrigatório.');
        if (form.type !== QuestionType.ESSAY && form.type !== QuestionType.REDACTION) {
            if (!alternatives.find(a => a.isCorrect)) return alert('Selecione a resposta correta.');
            if (alternatives.some(a => !a.text.trim())) return alert('Preencha o texto de todas as alternativas.');
        }

        const newItem: Item = {
            id: uuidv4(),
            tenantId: currentUser.tenantId,
            schoolId: currentUser.schoolId,
            ownerId: currentUser.id,
            knowledgeArea: 'Geral',
            subject: form.subject,
            type: form.type,
            statement: form.statement,
            alternatives: alternatives,
            correctAnswerJustification: form.justification,
            difficulty: form.difficulty,
            score: 1.0,
            origin: ItemOrigin.MANUAL,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            bnccCode: form.bnccCode,
            usageCount: 0,
            createdAt: new Date().toISOString()
        };
        addItemMutation.mutate(newItem);
    };

    return (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col h-[calc(100vh-120px)] overflow-hidden animate-in slide-in-from-bottom-6">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                <div className="flex gap-8">
                    <button onClick={() => setMode('MANUAL')} className={`pb-2 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${mode === 'MANUAL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
                        Criação Manual
                    </button>
                    <button onClick={() => setMode('AI')} className={`pb-2 text-sm font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 ${mode === 'AI' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400'}`}>
                        <Brain size={16}/> Motor de IA Gemini
                    </button>
                </div>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
                {mode === 'MANUAL' ? (
                    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Enunciado</label>
                                <RichTextEditor value={form.statement} onChange={(val) => setForm({...form, statement: val})} placeholder="Escreva o enunciado..." height="h-64" />
                            </div>

                            {(form.type === QuestionType.MULTIPLE_CHOICE || form.type === QuestionType.TRUE_FALSE) && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alternativas</label>
                                        {form.type === QuestionType.MULTIPLE_CHOICE && (
                                            <button onClick={() => setAlternatives([...alternatives, { id: uuidv4(), text: '', isCorrect: false }])} className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1">
                                                <Plus size={12}/> Adicionar Opção
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {alternatives.map((alt, idx) => (
                                            <div key={alt.id} className="flex items-center gap-4 animate-in slide-in-from-left">
                                                <button 
                                                    onClick={() => setAlternatives(alternatives.map(a => ({ ...a, isCorrect: a.id === alt.id })))}
                                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${alt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border-2 border-slate-50'}`}
                                                >
                                                    {alt.isCorrect ? <CheckCircle size={20}/> : String.fromCharCode(65 + idx)}
                                                </button>
                                                <input 
                                                    className="flex-1 p-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-600 outline-none font-bold"
                                                    value={alt.text}
                                                    onChange={e => setAlternatives(alternatives.map(a => a.id === alt.id ? { ...a, text: e.target.value } : a))}
                                                    placeholder={`Opção ${String.fromCharCode(65 + idx)}...`}
                                                />
                                                {form.type === QuestionType.MULTIPLE_CHOICE && alternatives.length > 2 && (
                                                    <button onClick={() => setAlternatives(alternatives.filter(a => a.id !== alt.id))} className="text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Justificativa da Resposta Correta</label>
                                <textarea 
                                    className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-600 outline-none font-medium text-slate-600"
                                    rows={3}
                                    placeholder="Explique o gabarito..."
                                    value={form.justification}
                                    onChange={e => setForm({...form, justification: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-[#0f1d2e] p-8 rounded-[2.5rem] text-white shadow-xl">
                                <h3 className="text-xs font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4 flex items-center gap-2">
                                    <Info size={16} className="text-indigo-400"/> Metadados do Item
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Disciplina</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold outline-none" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <div className="mt-3 flex gap-2">
                                            <input className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2 text-xs outline-none" placeholder="Nova disciplina..." value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
                                            <button onClick={handleAddSubject} className="p-2 bg-indigo-600 rounded-lg text-white"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Tipo</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold outline-none" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                                            {questionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                        <div className="mt-3 flex gap-2">
                                            <input className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2 text-xs outline-none" placeholder="Novo tipo..." value={newTypeName} onChange={e => setNewTypeName(e.target.value)} />
                                            <button onClick={handleAddType} className="p-2 bg-indigo-600 rounded-lg text-white"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Código BNCC</label>
                                        <div className="relative">
                                            <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold outline-none pr-10" placeholder="Ex: EF09MA01" value={form.bnccCode} onChange={e => setForm({...form, bnccCode: e.target.value})} />
                                            <button 
                                                onClick={handleAutoBncc}
                                                disabled={bnccLoading}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                                                title="Gerar via IA"
                                            >
                                                {bnccLoading ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={saveManual} disabled={addItemMutation.isPending} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition flex items-center justify-center gap-3">
                                <Save size={20}/> Salvar Questão
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-10 pb-32">
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-purple-100 text-purple-600 rounded-3xl"><Brain size={32}/></div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase italic">Geração Inteligente (Gemini)</h2>
                                    <p className="text-sm text-slate-500 font-medium">Use documentos ou contexto para criar questões estruturadas BNCC.</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteúdo ou Contexto</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm font-medium text-slate-700 outline-none focus:border-purple-600 transition-all h-64"
                                        placeholder="Cole o texto base da aula..."
                                        value={aiContext}
                                        onChange={e => setAiContext(e.target.value)}
                                    />
                                    <div className="flex items-center gap-3">
                                        <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 p-4 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center gap-2">
                                            <Paperclip size={18} className="text-slate-500"/>
                                            <span className="text-sm font-bold text-slate-600">{attachedFile ? attachedFile.name : 'Anexar Arquivo'}</span>
                                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
                                        </label>
                                        {attachedFile && <button onClick={() => setAttachedFile(null)} className="p-4 text-rose-500 bg-rose-50 rounded-2xl"><X size={20}/></button>}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instruções para a IA</label>
                                        <textarea 
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 text-sm font-medium text-slate-700 outline-none focus:border-purple-600 h-24"
                                            placeholder="Ex: Gere questões sobre fotossíntese focadas em alunos do 6º ano..."
                                            value={aiInstructions}
                                            onChange={e => setAiInstructions(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Disciplina</label>
                                            <select className="w-full p-4 rounded-2xl bg-slate-100 font-bold outline-none" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Formato</label>
                                            <select className="w-full p-4 rounded-2xl bg-slate-100 font-bold outline-none" value={aiFormat} onChange={e => setAiFormat(e.target.value)}>
                                                <option value="MULTIPLE_CHOICE_4">Múltipla Escolha (4 opções)</option>
                                                <option value="MULTIPLE_CHOICE_5">Múltipla Escolha (5 opções)</option>
                                                <option value="TRUE_FALSE">Verdadeiro ou Falso</option>
                                                <option value="ESSAY">Discursiva</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleGenerateAI} 
                                        disabled={aiLoading} 
                                        className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl hover:bg-purple-700 transition flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {aiLoading ? <Loader2 className="animate-spin" size={24}/> : <Sparkles size={24}/>}
                                        {aiLoading ? 'Processando Inteligência...' : 'Gerar 3 Questões'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {generatedItems.map((gen, idx) => (
                                <div key={idx} className="bg-white p-10 rounded-[3rem] border-2 border-purple-50 shadow-lg animate-in fade-in">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <Badge color="indigo">Sugestão {idx + 1}</Badge>
                                            <span className="text-[10px] font-black text-purple-400 uppercase">{gen.bnccCode}</span>
                                        </div>
                                        <button onClick={() => approveAIItem(gen)} className="btn-premium px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2">
                                            <Plus size={14}/> Aprovar Questão
                                        </button>
                                    </div>
                                    <div className="text-slate-800 text-xl font-bold mb-8 leading-relaxed">{gen.statement}</div>
                                    <div className="grid gap-3 mb-8">
                                        {gen.alternatives?.map((alt: any, aIdx: number) => (
                                            <div key={aIdx} className={`p-5 rounded-2xl border-2 font-bold text-sm flex items-center gap-4 ${alt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${alt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>{String.fromCharCode(65+aIdx)}</span>
                                                {alt.text}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><Info size={12}/> Justificativa Pedagógica</h5>
                                        <p className="text-sm text-slate-600 font-medium italic">{gen.justification}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
