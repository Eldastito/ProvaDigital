import React from 'react';
import { Loader2, Sparkles, GripVertical, Trash2 } from 'lucide-react';
import { RichTextEditor } from '../../../../components/RichTextEditor';
import { QuestionType } from '../../../../types';

interface AlternativesEditorProps {
    form: {
        type: QuestionType;
    };
    alternatives: { text: string; isCorrect: boolean }[];
    setAlternatives: (alts: { text: string; isCorrect: boolean }[]) => void;
    handleGenerateAlts: () => void;
    isGeneratingAlts: boolean;
    draggedIdx: number | null;
    handleDragStart: (e: React.DragEvent, index: number) => void;
    handleDragOver: (e: React.DragEvent, index: number) => void;
    handleDragEnd: () => void;
}

export const AlternativesEditor: React.FC<AlternativesEditorProps> = ({
    form,
    alternatives,
    setAlternatives,
    handleGenerateAlts,
    isGeneratingAlts,
    draggedIdx,
    handleDragStart,
    handleDragOver,
    handleDragEnd
}) => {
    if (form.type !== QuestionType.MULTIPLE_CHOICE && form.type !== QuestionType.TRUE_FALSE) {
        return null;
    }

    return (
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
    );
};
