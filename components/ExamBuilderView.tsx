import React, { useState } from 'react';
import { X, ChevronRight, Search, Plus, Tablet, ChevronLeft, ArrowRight, Brain, Target, Star } from 'lucide-react';
import { AppState, Exam, Item, ExamModel, ExamStatus, QuestionType } from '../types';
import { Badge } from './ui/Badge';
import { uuidv4 } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchItems, insertExam } from '../services/supabaseClient';

export const ExamBuilderView = ({ onSave, onCancel }: { state?: AppState, onSave: (e: Exam) => void, onCancel: () => void }) => {
    const { currentUser } = useAppStore();
    
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({
        title: '',
        description: '',
        duration: 60,
        subject: '',
        knowledgeArea: 'Geral',
        model: ExamModel.SOMATIVO
    });
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [itemScores, setItemScores] = useState<Record<string, number>>({});
    const [filter, setFilter] = useState('');

    const { data: availableItems, isLoading: itemsLoading } = useQuery<Item[]>({ queryKey: ['items'], queryFn: fetchItems });

    const addExamMutation = useMutation({
        mutationFn: insertExam,
        onSuccess: (data) => {
            onSave(data as any);
            alert('Avaliação criada e pronta para distribuição!');
        }
    });

    const handleSave = (publish = false) => {
        if (!currentUser || !config.title || selectedItems.length === 0) return alert('Preencha os campos obrigatórios.');
        
        const newExam: Exam = {
            id: uuidv4(),
            tenantId: currentUser.tenantId || 't1',
            schoolId: currentUser.schoolId || 's1',
            creatorId: currentUser.id,
            title: config.title,
            description: config.description,
            subject: config.subject,
            model: config.model,
            durationMinutes: config.duration,
            targetQuestionCount: selectedItems.length,
            status: publish ? ExamStatus.PUBLISHED : ExamStatus.DRAFT,
            items: selectedItems.map((item, idx) => ({
                itemId: item.id,
                order: idx + 1,
                customScore: itemScores[item.id] || item.score
            })),
            classIds: [],
            createdAt: new Date().toISOString()
        };
        addExamMutation.mutate(newExam);
    };

    const toggleItem = (item: Item) => {
        if (selectedItems.find(i => i.id === item.id)) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
            if (!itemScores[item.id]) setItemScores(prev => ({...prev, [item.id]: item.score}));
        }
    };

    const filteredAvailableItems = availableItems?.filter(i => 
        !selectedItems.find(s => s.id === i.id) &&
        (i.statement.toLowerCase().includes(filter.toLowerCase()) || i.subject.toLowerCase().includes(filter.toLowerCase()))
    ) || [];

    // @-fix: Explicitly cast Object.values(itemScores) to number[] to resolve 'unknown' type assignment error.
    const totalPoints: number = (Object.values(itemScores) as number[]).reduce((acc: number, val: number): number => acc + (Number(val) || 0), 0);

    if (itemsLoading) return <div className="p-20 text-center font-black text-slate-400 uppercase animate-pulse">Acessando Banco de Itens...</div>;

    return (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col h-[calc(100vh-120px)] overflow-hidden">
             <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                        <Plus className="text-indigo-600" size={24}/> Montar Avaliação
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Passo {step} de 2: {step === 1 ? 'Definições Técnicas' : 'Seleção de Itens'}</p>
                </div>
                <div className="flex gap-3">
                    {step === 2 && <button onClick={() => setStep(1)} className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition">Voltar</button>}
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2"><X size={24}/></button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
                {step === 1 ? (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título da Prova</label>
                                <input className="w-full border-2 border-slate-50 rounded-2xl p-4 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} placeholder="Ex: Avaliação Trimestral de Ciências" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Área de Conhecimento</label>
                                    <select className="w-full border-2 border-slate-50 rounded-2xl p-4 font-bold text-slate-700 bg-slate-50 outline-none" value={config.knowledgeArea} onChange={e => setConfig({...config, knowledgeArea: e.target.value})}>
                                        <option value="Linguagens">Linguagens</option>
                                        <option value="Matemática">Matemática</option>
                                        <option value="Ciências Natureza">Ciências Natureza</option>
                                        <option value="Ciências Humanas">Ciências Humanas</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Disciplina Específica</label>
                                    <input className="w-full border-2 border-slate-50 rounded-2xl p-4 font-bold text-slate-700 outline-none" value={config.subject} onChange={e => setConfig({...config, subject: e.target.value})} placeholder="Ex: Física" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tempo (minutos)</label>
                                    <input type="number" className="w-full border-2 border-slate-50 rounded-2xl p-4 font-bold text-slate-700 outline-none" value={config.duration} onChange={e => setConfig({...config, duration: parseInt(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Modelo</label>
                                    <select className="w-full border-2 border-slate-50 rounded-2xl p-4 font-bold text-slate-700 bg-slate-50 outline-none" value={config.model} onChange={e => setConfig({...config, model: e.target.value as ExamModel})}>
                                        <option value="SOMATIVO">Somativo (Fixo)</option>
                                        <option value="ADAPTADO">Adaptado (IA)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button onClick={() => setStep(2)} className="btn-premium px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl">
                                    Próximo <ArrowRight size={20}/>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full gap-10">
                        {/* Banco de Itens */}
                        <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-6 bg-slate-50/50 border-b">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18}/>
                                    <input 
                                        className="w-full border-2 border-white rounded-2xl pl-12 p-3 font-bold text-sm shadow-sm outline-none focus:border-brand-primary transition-all" 
                                        placeholder="Pesquisar questões..."
                                        value={filter}
                                        onChange={e => setFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {filteredAvailableItems.map(item => (
                                    <div key={item.id} className="p-5 border-2 border-slate-50 rounded-2xl hover:border-brand-primary bg-white cursor-pointer group transition-all" onClick={() => toggleItem(item)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.subject}</span>
                                            <Badge color={item.difficulty === 'FACIL' ? 'green' : 'yellow'}>{item.difficulty}</Badge>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 line-clamp-2">{item.statement}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Configuração da Prova e Pontos */}
                        <div className="w-[450px] flex flex-col gap-6">
                            <div className="bg-[#0f1d2e] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                                <Target size={120} className="absolute -right-8 -bottom-8 opacity-5"/>
                                <h3 className="text-xs font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Itens Selecionados ({selectedItems.length})</h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                    {selectedItems.map((item, idx) => (
                                        <div key={item.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <span className="text-indigo-400 font-black text-xs">Q{idx+1}</span>
                                                <div className="text-xs font-medium truncate w-32">{item.statement}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Star size={12} className="text-amber-400"/>
                                                <input 
                                                    type="number" 
                                                    className="w-12 bg-transparent border-b border-white/20 text-center font-black text-xs outline-none focus:border-amber-400"
                                                    value={itemScores[item.id] || 0}
                                                    onChange={e => setItemScores({...itemScores, [item.id]: parseFloat(e.target.value) || 0})}
                                                />
                                                <button onClick={() => toggleItem(item)} className="p-1 text-rose-400 opacity-0 group-hover:opacity-100 transition"><X size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedItems.length === 0 && <div className="text-slate-500 text-xs italic text-center py-8">Nenhuma questão adicionada.</div>}
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Total de Pontos</span>
                                    <span className="text-2xl font-black text-emerald-400">{totalPoints.toFixed(1)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button onClick={() => handleSave(false)} className="py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition">Salvar Rascunho</button>
                                <button onClick={() => handleSave(true)} className="py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition">Publicar Avaliação</button>
                            </div>
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};
