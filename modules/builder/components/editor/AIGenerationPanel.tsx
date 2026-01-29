import React, { RefObject } from 'react';
import { Brain, Upload, Loader2 } from 'lucide-react';
import { DifficultyLevel } from '../../../../types';

interface AIGenerationPanelProps {
    form: {
        subject: string;
        difficulty: DifficultyLevel;
    };
    setForm: (form: any) => void;
    aiQuantity: number;
    setAiQuantity: (qty: number) => void;
    aiContext: string;
    setAiContext: (ctx: string) => void;
    fileInputRef: RefObject<HTMLInputElement>;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGenerate: () => void;
    aiLoading: boolean;
}

export const AIGenerationPanel: React.FC<AIGenerationPanelProps> = ({
    form,
    setForm,
    aiQuantity,
    setAiQuantity,
    aiContext,
    setAiContext,
    fileInputRef,
    handleFileUpload,
    handleGenerate,
    aiLoading
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 text-sm text-sky-900 mb-4">
                <p className="font-semibold flex items-center gap-2"><Brain size={16} /> IA SAEB/INEP + BNCC + TRI</p>
                Faça upload de materiais em <b>PDF, Word (DOCX), Excel ou TXT</b>. A IA seguirá os padrões do INEP/BNCC e estimará parâmetros TRI automaticamente.
            </div>
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
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
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. Questões</label>
                    <input type="number" min="1" max="50" className="w-full border rounded-lg p-2 text-sm" value={aiQuantity} onChange={e => setAiQuantity(parseInt(e.target.value) || 1)} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Texto de Contexto ou Arquivo</label>
                <textarea className="w-full border rounded-lg p-3 text-sm h-40 font-mono mb-2" value={aiContext} onChange={e => setAiContext(e.target.value)} placeholder="Cole aqui o texto ou faça upload de um arquivo para análise..." />
                <input type="file" accept=".txt,.csv,.md,.pdf,.docx,.xlsx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="text-sm text-white bg-brand-primary hover:bg-sky-700 px-4 py-2 rounded-lg flex items-center gap-2 w-fit transition shadow-sm font-bold"><Upload size={16} /> Carregar PDF, Word ou Excel</button>
            </div>
            <button onClick={handleGenerate} disabled={aiLoading} className="w-full py-3 btn-gradient rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01]">
                {aiLoading ? <><Loader2 size={20} className="animate-spin" /> Processando Documento...</> : <><Brain size={20} /> Gerar Itens Padrão INEP</>}
            </button>
        </div>
    );
};
