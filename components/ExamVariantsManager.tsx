import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Save, Plus, Edit, Copy, MoreHorizontal, Layers, FileText, X } from 'lucide-react';
import { Badge } from './ui/Badge';
import { uuidv4 } from '../utils/helpers';
import { ExamVariant, ExamVariantOverride } from '../types';

export const ExamVariantsManager = () => {
    const { id: examId } = useParams();
    const navigate = useNavigate();
    const state = useAppStore();
    const { exams, examVariants = [], variantOverrides = [], loadExamVariants, addExamVariant, saveOverride, items } = state;

    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<ExamVariant | null>(null);
    const [showNewVariantModal, setShowNewVariantModal] = useState(false);

    // New Variant Form
    const [newVariantName, setNewVariantName] = useState('');
    const [newVariantDesc, setNewVariantDesc] = useState('');

    // Editing Override
    const [editingItem, setEditingItem] = useState<string | null>(null); // Item ID
    const [overrideText, setOverrideText] = useState('');

    const exam = exams.find(e => e.id === examId);

    useEffect(() => {
        if (examId) {
            loadExamVariants(examId).then(() => setLoading(false));
        }
    }, [examId, loadExamVariants]);

    if (loading) return <div className="p-8 text-center">Carregando variações...</div>;
    if (!exam) return <div className="p-8 text-center text-red-500">Prova não encontrada</div>;

    const handleCreateVariant = async () => {
        if (!newVariantName) return alert('Nome obrigatório');

        const newVariant: ExamVariant = {
            id: uuidv4(),
            examId: exam.id,
            name: newVariantName,
            slug: newVariantName.toLowerCase().replace(/\s+/g, '-'),
            description: newVariantDesc,
            accessibilityConfig: {
                zoom: 100,
                highContrast: false,
                screenReader: false
            },
            status: 'active',
            createdAt: new Date().toISOString()
        };

        await addExamVariant(newVariant);
        setShowNewVariantModal(false);
        setNewVariantName('');
        setNewVariantDesc('');
        alert('Variante criada!');
    };

    const handleSaveOverride = async (itemId: string, itemVersionId: string | undefined) => {
        if (!selectedVariant) return;
        if (!itemVersionId) return alert('Item sem versão base. Atualize o item primeiro.');

        const overrideId = uuidv4();
        const override: ExamVariantOverride = {
            id: overrideId,
            variantId: selectedVariant.id,
            itemVersionId: itemVersionId,
            overridePayload: {
                statement: overrideText // Simple text override for now
            },
            rationale: "Adaptação manual",
            status: 'APPROVED',
            createdBy: state.currentUser?.id || 'system',
            createdAt: new Date().toISOString()
        };

        await saveOverride(override);
        setEditingItem(null);
    };

    const getOverride = (itemVersionId: string) => {
        return variantOverrides.find(o => o.variantId === selectedVariant?.id && o.itemVersionId === itemVersionId);
    };

    const examItems = (exam.items || []).map(examItem => {
        const fullItem = items.find(i => i.id === examItem.itemId);
        return { ...fullItem, ...examItem };
    }).filter(i => i.id); // Filter undefined

    return (
        <div className="max-w-6xl mx-auto p-6">
            <button onClick={() => navigate('/exams')} className="flex items-center text-slate-500 hover:text-brand-primary mb-4">
                <ArrowLeft size={16} className="mr-2" /> Voltar para Provas
            </button>

            <header className="mb-8 border-b pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark mb-1">Gestão de Variantes</h1>
                        <p className="text-slate-500">Prova Base: <span className="font-medium text-slate-800">{exam.title}</span></p>
                    </div>
                    <button
                        onClick={() => setShowNewVariantModal(true)}
                        className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus size={18} /> Nova Variante
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* LISTA DE VARIANTES */}
                <div className="md:col-span-1 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Variantes Disponíveis</h3>
                    {examVariants.filter(v => v.examId === exam.id).length === 0 && (
                        <p className="text-sm text-slate-400 italic">Nenhuma variante criada.</p>
                    )}
                    {examVariants.filter(v => v.examId === exam.id).map(v => (
                        <div
                            key={v.id}
                            onClick={() => setSelectedVariant(v)}
                            className={`p-3 rounded-lg cursor-pointer border transition ${selectedVariant?.id === v.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className="font-medium text-slate-800 flex items-center justify-between">
                                {v.name}
                                {selectedVariant?.id === v.id && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 truncate">{v.description || 'Sem descrição'}</div>
                        </div>
                    ))}
                </div>

                {/* EDITOR DE OVERRIDES */}
                <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl min-h-[500px] p-6">
                    {!selectedVariant ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Layers size={48} className="mb-4 opacity-20" />
                            <p>Selecione uma variante para gerenciar as adaptações.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h2 className="text-xl font-bold text-indigo-700">{selectedVariant.name}</h2>
                                <Badge color="blue">Editando Adaptações</Badge>
                            </div>

                            <p className="text-sm text-slate-500 mb-4">
                                Esta variante será apresentada aos alunos que tiverem o código de acessibilidade compatível.
                                Abaixo, você pode sobrescrever o conteúdo de qualquer questão da prova original.
                            </p>

                            <div className="space-y-4">
                                {examItems.map((item, idx) => {
                                    if (!item) return null;
                                    const hasVersion = !!item.currentVersionId;
                                    const activeOverride = hasVersion ? getOverride(item.currentVersionId!) : null;
                                    const isEditing = editingItem === item.id;

                                    return (
                                        <div key={item.id} className={`border rounded-lg p-4 ${activeOverride ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-medium text-slate-700">Questão {idx + 1}</div>
                                                <div className="flex gap-2">
                                                    {activeOverride && (
                                                        <Badge color="yellow">ADAPTADO</Badge>
                                                    )}
                                                    {!isEditing && (
                                                        <button
                                                            onClick={() => {
                                                                if (!hasVersion) return alert("Esta questão não tem versão controlada (V2). Edite-a na lista de itens primeiro.");
                                                                setEditingItem(item.id);
                                                                setOverrideText(activeOverride?.overridePayload?.statement || item.statement || '');
                                                            }}
                                                            className="text-xs text-indigo-600 font-medium hover:underline"
                                                        >
                                                            {activeOverride ? 'Editar Adaptação' : 'Criar Adaptação'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Original Content Preview */}
                                            {!isEditing && (
                                                <div className="text-sm text-slate-600 mb-2">
                                                    <div className="font-semibold text-xs text-slate-400 mb-1">ORIGINAL:</div>
                                                    <div dangerouslySetInnerHTML={{ __html: item.statement || '' }} className="line-clamp-2" />
                                                </div>
                                            )}

                                            {/* Override Content Preview */}
                                            {activeOverride && !isEditing && (
                                                <div className="mt-3 pt-3 border-t border-amber-200">
                                                    <div className="font-semibold text-xs text-amber-600 mb-1">ADAPTAÇÃO:</div>
                                                    <div className="text-sm text-slate-800">{activeOverride.overridePayload.statement}</div>
                                                </div>
                                            )}

                                            {/* Edit Form */}
                                            {isEditing && (
                                                <div className="mt-4 bg-white p-4 border rounded shadow-sm">
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Enunciado Adaptado</label>
                                                    <textarea
                                                        className="w-full border rounded p-2 text-sm min-h-[100px] mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        value={overrideText}
                                                        onChange={(e) => setOverrideText(e.target.value)}
                                                        placeholder="Digite o texto adaptado..."
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingItem(null)}
                                                            className="px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 rounded"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveOverride(item.id!, item.currentVersionId)}
                                                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                                        >
                                                            Salvar Adaptação
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL NOVA VARIANTE */}
            {showNewVariantModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700">Nova Variante</h3>
                            <button onClick={() => setShowNewVariantModal(false)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome da Variante</label>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Adaptação</label>
                                <select
                                    value={newVariantName}
                                    onChange={e => {
                                        setNewVariantName(e.target.value);
                                        // Auto-fill description based on selection
                                        const descMap: any = {
                                            'TDAH': 'Adaptação com foco em redução de distrações e tempo estendido.',
                                            'TEA': 'Adaptação com linguagem direta e suporte visual reforçado.',
                                            'Baixa Visão': 'Fonte ampliada e alto contraste.',
                                            'Dislexia': 'Fonte OpenDyslexic e espaçamento aumentado.',
                                            'Superdotação': 'Nível de desafio ajustado (enrichment).',
                                            'Outro': ''
                                        };
                                        if (descMap[e.target.value]) setNewVariantDesc(descMap[e.target.value]);
                                    }}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    autoFocus
                                >
                                    <option value="">Selecione o tipo...</option>
                                    <option value="TDAH">TDAH (Transtorno de Déficit de Atenção)</option>
                                    <option value="TEA">TEA (Transtorno do Espectro Autista)</option>
                                    <option value="Baixa Visão">Baixa Visão / Deficiência Visual</option>
                                    <option value="Dislexia">Dislexia</option>
                                    <option value="Superdotação">Altas Habilidades / Superdotação</option>
                                    <option value="Outro">Outro (Personalizado)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição</label>
                                <textarea
                                    value={newVariantDesc}
                                    onChange={e => setNewVariantDesc(e.target.value)}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                                    placeholder="Descreva o propósito desta adaptação..."
                                />
                            </div>
                            <button
                                onClick={handleCreateVariant}
                                className="w-full bg-brand-primary text-white font-bold py-2 rounded-lg hover:bg-brand-dark transition"
                            >
                                Criar Variante
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
