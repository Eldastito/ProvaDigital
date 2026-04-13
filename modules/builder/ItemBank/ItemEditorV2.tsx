import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { Item, ItemVersion, QuestionType, DifficultyLevel } from '../../../types';
import { Save, History, ArrowLeft, AlertTriangle, Plus, Trash2, Video, Music, Image as ImageIcon, ShoppingBag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { RichTextEditor } from '../../../components/RichTextEditor';
import { useToast } from '../../../components/ui/Toast';

export const ItemEditorV2 = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { items, updateItemWithVersion, currentUser } = useAppStore();

    const [item, setItem] = useState<Item | null>(null);
    const toast = useToast();
    const [changeReason, setChangeReason] = useState('');
    const [activeTab, setActiveTab] = useState<'EDIT' | 'HISTORY'>('EDIT');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) {
            const found = items.find(i => i.id === id);
            if (found) setItem(JSON.parse(JSON.stringify(found))); // Clone
        }
    }, [id, items]);

    const handleSave = async () => {
        if (!item || !changeReason.trim()) {
            toast.info("Por favor, descreva o motivo da alteração para o histórico.");
            return;
        }
        setIsSaving(true);
        try {
            await updateItemWithVersion(item.id, item, changeReason);
            setChangeReason('');
            // stay on page or navigate back?
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    if (!item) return <div className="p-8">Carregando item...</div>;

    return (
        <div className="flex h-screen bg-gray-50 flex-col">
            {/* Find Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Editor de Item V2</h1>
                        <div className="flex gap-2 text-sm text-gray-500">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{item.type}</span>
                            <span>Versão Atual: {item.currentVersionId ? 'v' + item.currentVersionId.slice(0, 4) : 'v1 (Original)'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('HISTORY')}
                    >
                        <History size={18} /> Histórico
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'EDIT' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('EDIT')}
                    >
                        <AlertTriangle size={18} /> Editor (Head)
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'EDIT' ? (
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enunciado da Questão</label>
                            <RichTextEditor
                                value={item.statement}
                                onChange={val => setItem({ ...item, statement: val })}
                                height="h-64"
                            />
                        </div>

                        {/* Multimedia Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Multimídia (Imagens, Vídeos, Áudios)</label>
                                <button
                                    onClick={() => {
                                        const newMulti = [...(item.multimedia || [])];
                                        newMulti.push({ type: 'IMAGE', url: '' });
                                        setItem({ ...item, multimedia: newMulti });
                                    }}
                                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                                >
                                    <Plus size={14} /> Adicionar Mídia
                                </button>
                            </div>
                            <div className="space-y-3">
                                {(item.multimedia || []).map((m, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <select
                                            value={m.type}
                                            onChange={(e) => {
                                                const newMulti = [...item.multimedia!];
                                                newMulti[idx].type = e.target.value as any;
                                                setItem({ ...item, multimedia: newMulti });
                                            }}
                                            className="text-sm border rounded p-1 bg-white"
                                        >
                                            <option value="IMAGE">Imagem</option>
                                            <option value="VIDEO">Vídeo</option>
                                            <option value="AUDIO">Áudio</option>
                                        </select>
                                        <div className="relative flex-1">
                                            {m.type === 'IMAGE' && <ImageIcon size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />}
                                            {m.type === 'VIDEO' && <Video size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />}
                                            {m.type === 'AUDIO' && <Music size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />}
                                            <input
                                                type="text"
                                                placeholder="URL do recurso..."
                                                className="w-full pl-8 p-1.5 text-sm border rounded"
                                                value={m.url}
                                                onChange={(e) => {
                                                    const newMulti = [...item.multimedia!];
                                                    newMulti[idx].url = e.target.value;
                                                    setItem({ ...item, multimedia: newMulti });
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newMulti = item.multimedia!.filter((_, i) => i !== idx);
                                                setItem({ ...item, multimedia: newMulti });
                                            }}
                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {(item.multimedia || []).length === 0 && (
                                    <p className="text-xs text-gray-400 italic">Nenhuma mídia externa anexada. Use a barra do editor para mídia inline.</p>
                                )}
                            </div>
                        </div>

                        {/* Just a basic alternative editor for MVP */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Alternativas</label>
                            <div className="space-y-3">
                                {item.alternatives.map((alt, idx) => (
                                    <div key={alt.id} className="flex gap-3 items-start">
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center mt-2 flex-shrink-0 ${alt.isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <input
                                            type="text"
                                            value={alt.text}
                                            onChange={(e) => {
                                                const newAlts = [...item.alternatives];
                                                newAlts[idx].text = e.target.value;
                                                setItem({ ...item, alternatives: newAlts });
                                            }}
                                            className="flex-1 p-2 border rounded"
                                        />
                                        <button
                                            onClick={() => {
                                                const newAlts = item.alternatives.map((a, i) => ({ ...a, isCorrect: i === idx }));
                                                setItem({ ...item, alternatives: newAlts });
                                            }}
                                            className={`px-3 py-1 text-xs rounded border ${alt.isCorrect ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                            {alt.isCorrect ? 'Correta' : 'Marcar Correta'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Justificativa da Resposta</label>
                            <RichTextEditor
                                value={item.correctAnswerJustification || ''}
                                onChange={val => setItem({ ...item, correctAnswerJustification: val })}
                                height="h-32"
                            />
                        </div>

                        {/* Marketplace & Sharing (Sprint 6) */}
                        <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-indigo-600">
                                    <ShoppingBag size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-800 text-sm">Publicar no Marketplace</div>
                                    <p className="text-[10px] text-slate-500">Torna esta versão visível e reutilizável por outros professores.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setItem({ ...item, isPublic: !item.isPublic })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${item.isPublic ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${item.isPublic ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Versioning Footer */}
                        <div className="mt-8 pt-6 border-t bg-yellow-50 -mx-8 -mb-8 p-6 flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-yellow-600 shrink-0 mt-1" size={20} />
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-yellow-800">Controle de Versão</h3>
                                    <p className="text-xs text-yellow-700 mb-2">
                                        Qualquer alteração aqui criará uma nova versão permanente no histórico.
                                        Provas antigas continuarão usando a versão anterior.
                                    </p>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Alteração <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Correção ortográfica no enunciado..."
                                        className="w-full p-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500"
                                        value={changeReason}
                                        onChange={e => setChangeReason(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={!changeReason.trim() || isSaving}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? 'Salvando...' : <><Save size={18} /> Salvar Nova Versão</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                        <History size={48} className="mx-auto mb-4 text-gray-300" />
                        <h2 className="text-lg font-medium text-gray-900">Histórico de Versões</h2>
                        <p>Funcionalidade de visualização de diff em desenvolvimento.</p>
                        {/* 
                            TODO: Fetch item_versions where item_id = item.id 
                            Render list with dates and reasons.
                        */}
                    </div>
                )}
            </div>
        </div >
    );
};
