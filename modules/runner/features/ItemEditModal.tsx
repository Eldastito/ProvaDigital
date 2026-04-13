import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Item, DifficultyLevel } from '../../../types';
import { RichTextEditor } from '../../../components/RichTextEditor';
import { useToast } from '../../../components/ui/Toast';

interface ItemEditModalProps {
    item: Item;
    onSave: (updatedItem: Item) => void;
    onClose: () => void;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({ item, onSave, onClose }) => {
    const [form, setForm] = useState<Item>({ ...item });
    const toast = useToast();

    const handleSave = () => {
        if (!form.statement.trim()) return toast.warning('O enunciado é obrigatório.');
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <AlertCircle size={20} className="text-brand-primary" /> Editar Questão (Lote)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Disciplina</label>
                            <input
                                className="w-full border rounded-lg p-2 text-sm"
                                value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dificuldade</label>
                            <select
                                className="w-full border rounded-lg p-2 text-sm"
                                value={form.difficulty}
                                onChange={e => setForm({ ...form, difficulty: e.target.value as DifficultyLevel })}
                            >
                                <option value="FACIL">Fácil</option>
                                <option value="MEDIO">Médio</option>
                                <option value="DIFICIL">Difícil</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Enunciado</label>
                        <RichTextEditor
                            value={form.statement}
                            onChange={val => setForm({ ...form, statement: val })}
                            height="h-48"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alternativas</label>
                        {form.alternatives.map((alt, idx) => (
                            <div key={alt.id} className="flex gap-3 items-start">
                                <input
                                    type="radio"
                                    name="correct-modal"
                                    checked={alt.isCorrect}
                                    onChange={() => {
                                        setForm({
                                            ...form,
                                            alternatives: form.alternatives.map((a, i) => ({ ...a, isCorrect: i === idx }))
                                        });
                                    }}
                                    className="mt-3 w-4 h-4 text-brand-primary"
                                />
                                <div className="flex-1">
                                    <RichTextEditor
                                        value={alt.text}
                                        onChange={val => {
                                            const newAlts = [...form.alternatives];
                                            newAlts[idx].text = val;
                                            setForm({ ...form, alternatives: newAlts });
                                        }}
                                        miniMode={true}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Justificativa</label>
                        <RichTextEditor
                            value={form.correctAnswerJustification}
                            onChange={val => setForm({ ...form, correctAnswerJustification: val })}
                            height="h-24"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-6">
                        {/* ACCESSIBILITY */}
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    id="isAccessible"
                                    checked={form.isAccessible}
                                    onChange={(e) => setForm({ ...form, isAccessible: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <label htmlFor="isAccessible" className="text-sm font-bold text-emerald-800 uppercase">Item Acessível (PCD)</label>
                            </div>
                            {form.isAccessible && (
                                <textarea
                                    className="w-full border rounded-lg p-3 text-sm h-24 bg-white"
                                    placeholder="Descreva aqui as instruções especiais para alunos TEA, TDAH ou Baixa Visão..."
                                    value={form.accessibilityInstructions}
                                    onChange={(e) => setForm({ ...form, accessibilityInstructions: e.target.value })}
                                />
                            )}
                        </div>

                        {/* MULTIMEDIA */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mídia de Apoio (Imagem/Vídeo/Áudio)</label>
                            <input
                                className="w-full border rounded-lg p-2 text-sm bg-white"
                                placeholder="Link da imagem, YouTube ou arquivo de áudio..."
                                value={form.multimedia?.[0]?.url || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const type = val.toLowerCase().includes('youtube') || val.toLowerCase().endsWith('.mp4') ? 'VIDEO' : 'IMAGE';
                                    setForm({ ...form, multimedia: val ? [{ type, url: val }] : [] });
                                }}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Este link será usado para renderizar mídias durante a prova.</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="bg-brand-primary text-white px-8 py-2 rounded-lg text-sm font-bold hover:bg-brand-dark transition shadow-lg flex items-center gap-2">
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};
