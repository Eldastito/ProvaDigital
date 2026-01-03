
import React, { useState } from 'react';
import { X, ChevronRight, Search, Plus, Tablet, ChevronLeft, ArrowRight } from 'lucide-react';
import { AppState, Exam, Item, ExamModel, ExamStatus, QuestionType } from '../types';
import { Badge } from './ui/Badge';
import { uuidv4 } from '../utils/helpers';

export const ExamBuilderView = ({ state, onSave, onCancel }: { state: AppState, onSave: (e: Exam) => void, onCancel: () => void }) => {
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({
        title: '',
        description: '',
        duration: 60,
        subject: '',
        model: ExamModel.SOMATIVO
    });
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [filter, setFilter] = useState('');

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
            status: publish ? ExamStatus.PUBLISHED : ExamStatus.DRAFT,
            items: selectedItems.map((item, idx) => ({
                itemId: item.id,
                order: idx + 1,
                customScore: item.score
            })),
            classIds: [],
            createdAt: new Date().toISOString()
        };
        onSave(newExam);
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

    const addRecommendedItem = (item: any) => {
        // Add to state items if not exists (it's a new generated item)
        // In a real app we would save to DB first
        if (!state.items.find(i => i.id === item.id)) {
            state.items.push(item); // Temporary local push
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
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                {step === 1 ? (
                    <div className="max-w-2xl mx-auto space-y-6 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                        {/* ... Existing Step 1 Form ... */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título da Prova</label>
                            <input className="w-full border rounded-lg p-2" value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} placeholder="Ex: Avaliação Bimestral de História" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Disciplina</label>
                                <input className="w-full border rounded-lg p-2" value={config.subject} onChange={e => setConfig({ ...config, subject: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Duração (minutos)</label>
                                <input type="number" className="w-full border rounded-lg p-2" value={config.duration} onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })} />
                            </div>
                        </div>
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
                        <div className="flex justify-end pt-4">
                            <button onClick={() => setStep(2)} className="btn-gradient px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg">
                                Próximo: Selecionar Questões <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full gap-8">
                        {/* Left: Available Items (List) */}
                        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <div className="p-4 border-b bg-slate-50 flex flex-col gap-3">
                                <h3 className="font-bold text-slate-800">Banco de Itens Disponível</h3>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={16} />
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

                            <div className="flex-1 overflow-y-auto p-2 space-y-2 relative">
                                {/* AI Recommendations Overlay/Panel */}
                                {showRecommendations && (
                                    <div className="mb-4 bg-purple-50 border border-purple-100 rounded-xl p-4 animate-in slide-in-from-top-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-purple-800 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                                Sugestões Inteligentes (BNCC)
                                            </h4>
                                            {recommendedItems.length === 0 && !loadingRecs && (
                                                <button onClick={handleGetRecommendations} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition">
                                                    Gerar Questões Baseadas em Gaps
                                                </button>
                                            )}
                                        </div>

                                        {loadingRecs ? (
                                            <div className="text-center py-8 text-purple-400">
                                                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                                Analisando desempenho da turma...
                                            </div>
                                        ) : recommendedItems.length > 0 ? (
                                            <div className="grid gap-3">
                                                {recommendedItems.map(rec => (
                                                    <div key={rec.id} className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition cursor-pointer group" onClick={() => addRecommendedItem(rec)}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <Badge color="indigo">{rec.bncc}</Badge>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Match: {rec.matchScore}%</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 mb-2 line-clamp-2">{rec.statement}</p>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-purple-600 font-medium italic">Motivo: {rec.reason}</span>
                                                            <button className="text-purple-600 text-xs font-bold flex items-center gap-1 bg-purple-50 px-2 py-1 rounded group-hover:bg-purple-100">
                                                                Aceitar <Plus size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-slate-500 text-xs italic">
                                                Clique em "Gerar" para a IA identificar gaps de aprendizado nesta turma.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Standard List */}
                                {filteredAvailableItems.map(item => (
                                    <div key={item.id} className="p-3 border border-slate-200 rounded-lg hover:border-brand-secondary bg-white cursor-pointer group transition-all hover:shadow-sm" onClick={() => toggleItem(item)}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-500 uppercase">{item.subject}</span>
                                            <Badge color={item.difficulty === 'FACIL' ? 'green' : 'yellow'}>{item.difficulty}</Badge>
                                        </div>
                                        <p className="text-sm text-slate-800 line-clamp-2 mb-2">{item.statement}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">ID: {item.id.slice(0, 6)}</span>
                                            <button className="text-brand-primary text-xs font-bold opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-brand-light px-2 py-1 rounded">Adicionar <Plus size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Tablet Simulator (Preview) - Unchanged */}
                        <div className="w-[500px] flex flex-col">
                            {/* ... (Existing Simulator Code) ... */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Tablet size={20} /> Simulação do Aluno</h3>
                                <span className="text-xs font-bold bg-brand-primary text-white px-3 py-1 rounded-full">{selectedItems.length} questões selecionadas</span>
                            </div>

                            {/* Tablet Device Frame */}
                            <div className="flex-1 bg-slate-900 rounded-[2rem] p-3 shadow-2xl relative border-4 border-slate-800 flex flex-col min-h-[600px]">
                                {/* Camera Dot */}
                                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rounded-full"></div>

                                {/* Screen Content */}
                                <div className="flex-1 bg-slate-100 rounded-[1.5rem] overflow-hidden flex flex-col relative">
                                    {selectedItems.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                            <Plus size={48} className="mb-4 opacity-50" />
                                            <p>Adicione questões do banco ao lado para visualizar como elas aparecerão na prova.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Header Inside Tablet */}
                                            <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold text-xs">
                                                        {previewIndex + 1}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Questão {previewIndex + 1} de {selectedItems.length}</span>
                                                </div>
                                                <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">00:45:00</span>
                                            </div>

                                            {/* Scrollable Question Content */}
                                            <div className="flex-1 overflow-y-auto p-5 bg-[#f8fafc]">
                                                {currentPreviewItem && (
                                                    <div className="animate-in slide-in-from-right-4 duration-300">
                                                        <div className="text-sm text-slate-800 font-medium leading-relaxed mb-4">
                                                            {currentPreviewItem.statement}
                                                        </div>

                                                        {currentPreviewItem.imageUrl && (
                                                            <div className="mb-4 rounded-lg overflow-hidden border border-slate-200">
                                                                <img src={currentPreviewItem.imageUrl} alt="Questão" className="w-full object-cover" />
                                                            </div>
                                                        )}

                                                        <div className="space-y-3">
                                                            {(currentPreviewItem.type === QuestionType.MULTIPLE_CHOICE || currentPreviewItem.type === QuestionType.TRUE_FALSE) && (
                                                                currentPreviewItem.alternatives.map((alt, idx) => (
                                                                    <button key={idx} className="w-full text-left p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-primary hover:bg-sky-50 transition flex items-start gap-3 group">
                                                                        <div className="w-6 h-6 rounded-full border border-slate-300 text-slate-500 text-xs flex items-center justify-center group-hover:border-brand-primary group-hover:text-brand-primary font-bold">
                                                                            {String.fromCharCode(65 + idx)}
                                                                        </div>
                                                                        <span className="text-sm text-slate-600 group-hover:text-slate-900 pt-0.5">{alt.text}</span>
                                                                    </button>
                                                                ))
                                                            )}

                                                            {/* VISUAL DE CADERNO / REDAÇÃO */}
                                                            {(currentPreviewItem.type === QuestionType.ESSAY || currentPreviewItem.type === QuestionType.REDACTION) && (
                                                                <div className="mt-4">
                                                                    <div className="text-xs font-bold text-slate-500 mb-1 uppercase flex justify-between">
                                                                        <span>Folha de Resposta Oficial</span>
                                                                        <span>Max: {currentPreviewItem.maxLines || 30} linhas</span>
                                                                    </div>

                                                                    {/* NOTEBOOK MASK */}
                                                                    <div className="w-full bg-white border border-slate-300 shadow-sm flex relative overflow-hidden rounded-md" style={{ height: '400px' }}>
                                                                        {/* Numbered Column + Red Margin */}
                                                                        <div className="w-8 bg-slate-100 flex-shrink-0 flex flex-col items-center pt-1 border-r-2 border-red-400/50 text-slate-400 font-mono text-xs select-none leading-[32px]">
                                                                            {Array.from({ length: currentPreviewItem.maxLines || 30 }).map((_, i) => (
                                                                                <div key={i} style={{ height: '32px' }}>{i + 1}</div>
                                                                            ))}
                                                                        </div>

                                                                        {/* Lined Paper Background + Transparent Input */}
                                                                        <div className="flex-1 relative overflow-y-auto custom-scrollbar">
                                                                            <div
                                                                                className="absolute inset-0 pointer-events-none"
                                                                                style={{
                                                                                    backgroundImage: 'linear-gradient(transparent 31px, #cbd5e1 32px)',
                                                                                    backgroundSize: '100% 32px',
                                                                                    marginTop: '0px'
                                                                                }}
                                                                            ></div>
                                                                            <textarea
                                                                                className="w-full h-full bg-transparent outline-none resize-none p-0 pl-2 text-slate-800 text-base leading-[32px] font-sans relative z-10"
                                                                                placeholder="Escreva sua redação aqui..."
                                                                                spellCheck={false}
                                                                                style={{ lineHeight: '32px' }}
                                                                                disabled
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tablet Footer Navigation */}
                                            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center z-10">
                                                <button
                                                    onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                                                    disabled={previewIndex === 0}
                                                    className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition"
                                                >
                                                    <ChevronLeft size={24} />
                                                </button>

                                                {/* Question Dots */}
                                                <div className="flex gap-1 overflow-hidden max-w-[200px] justify-center px-2">
                                                    {selectedItems.map((_, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => setPreviewIndex(i)}
                                                            className={`w-2 h-2 rounded-full cursor-pointer transition-all ${i === previewIndex ? 'bg-brand-primary w-4' : 'bg-slate-300 hover:bg-slate-400'}`}
                                                        />
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => setPreviewIndex(Math.min(selectedItems.length - 1, previewIndex + 1))}
                                                    disabled={previewIndex === selectedItems.length - 1}
                                                    className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition"
                                                >
                                                    <ArrowRight size={24} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons below Simulator */}
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <button onClick={() => handleSave(false)} className="py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 transition shadow-sm">
                                    Salvar Rascunho
                                </button>
                                <button onClick={() => handleSave(true)} className="btn-gradient py-3 rounded-lg font-bold text-sm transition shadow-md">
                                    Publicar Prova
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
