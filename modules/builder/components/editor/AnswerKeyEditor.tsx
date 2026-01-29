import React from 'react';
import { Loader2, Sparkles, Brain, CheckCircle2, AlertCircle, Wand2, BookOpen } from 'lucide-react';
import { RichTextEditor } from '../../../../components/RichTextEditor';
import { QuestionType } from '../../../../types';

interface AnswerKeyEditorProps {
    form: any;
    setForm: (form: any) => void;
    handleGenerateJustification: () => void;
    isImproving: boolean;
    handleSuggestBNCC: () => void;
    isBNCCLoading: boolean;
}

export const AnswerKeyEditor: React.FC<AnswerKeyEditorProps> = ({
    form,
    setForm,
    handleGenerateJustification,
    isImproving,
    handleSuggestBNCC,
    isBNCCLoading
}) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">
                    {form.type === QuestionType.ESSAY || form.type === QuestionType.REDACTION ? 'Critérios de Correção / Gabarito Esperado' : 'Justificativa da Resposta Correta'}
                </label>
                <button
                    onClick={handleGenerateJustification}
                    disabled={isImproving}
                    className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 hover:bg-indigo-100 transition font-bold uppercase"
                >
                    {isImproving ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    Gerar Justificativa
                </button>
            </div>

            {/* CRITÉRIOS DE CORREÇÃO AUTOMÁTICA OFFLINE (DISSERTATIVAS) */}
            {(form.type === QuestionType.ESSAY || form.type === QuestionType.REDACTION) && (
                <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-start gap-2">
                        <Brain className="text-purple-600 flex-shrink-0 mt-0.5" size={18} />
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-purple-900 mb-1">⚡ Correção Automática Offline</h4>
                            <p className="text-xs text-purple-700 leading-relaxed">
                                Defina <span className="font-bold">palavras-chave</span> para permitir correção automática mesmo sem internet.
                                Ideal para provas offline em tablets!
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-purple-800 uppercase mb-1.5 flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-purple-600" />
                                Palavras-chave OBRIGATÓRIAS (70% da nota)
                            </label>
                            <input
                                type="text"
                                className="w-full border-2 border-purple-200 rounded-lg p-2.5 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                                placeholder="Ex: fotossíntese, clorofila, luz solar, glicose"
                                value={(form as any).offlineKeywords?.required || ''}
                                onChange={e => setForm({
                                    ...form,
                                    offlineKeywords: {
                                        ...(form as any).offlineKeywords,
                                        required: e.target.value
                                    }
                                })}
                            />
                            <p className="text-[10px] text-purple-600 mt-1 italic">
                                💡 Conceitos essenciais que devem aparecer na resposta. Separe por vírgula.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-purple-800 uppercase mb-1.5 flex items-center gap-1.5">
                                <Sparkles size={12} className="text-purple-600" />
                                Palavras-chave OPCIONAIS (até +30% bônus)
                            </label>
                            <input
                                type="text"
                                className="w-full border-2 border-purple-200 rounded-lg p-2.5 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                                placeholder="Ex: CO2, oxigênio, ATP, estômatos"
                                value={(form as any).offlineKeywords?.optional || ''}
                                onChange={e => setForm({
                                    ...form,
                                    offlineKeywords: {
                                        ...(form as any).offlineKeywords,
                                        optional: e.target.value
                                    }
                                })}
                            />
                            <p className="text-[10px] text-purple-600 mt-1 italic">
                                ⭐ Conceitos extras que dão pontos de bônus se mencionados.
                            </p>
                        </div>

                        <div className="pt-2 border-t border-purple-200">
                            <p className="text-xs text-purple-800 font-medium flex items-start gap-2">
                                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                <span>
                                    Deixe em branco para <strong>correção manual obrigatória</strong>.
                                    Com IA online habilitada, pode ser usada como backup.
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <RichTextEditor
                value={form.correctAnswerJustification}
                onChange={(val) => setForm({ ...form, correctAnswerJustification: val })}
                placeholder={form.type === QuestionType.REDACTION ? "Descreva o que se espera que o aluno aborde na redação..." : "Explique o raciocínio da resposta correta..."}
                height="h-32"
            />

            <div className="grid grid-cols-2 gap-6 pb-6 mt-6">
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
    );
};
