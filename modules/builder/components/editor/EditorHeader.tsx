import React from 'react';
import { Brain, X, Sparkles, Loader2, ShieldAlert, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EditorHeaderProps {
    mode: 'MANUAL' | 'AI';
    setMode: (mode: 'MANUAL' | 'AI') => void;
    handleMagicPolish: () => void;
    isImproving: boolean;
    isGeneratingAlts: boolean;
    handleAudit: () => void;
    isAuditing: boolean;
    handleOCR: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isExtractingOCR: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
    mode,
    setMode,
    handleMagicPolish,
    isImproving,
    isGeneratingAlts,
    handleAudit,
    isAuditing,
    handleOCR,
    isExtractingOCR
}) => {
    const navigate = useNavigate();

    return (
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
            <div className="flex gap-4">
                <button onClick={() => setMode('MANUAL')} className={`pb-1 text-sm font-medium border-b-2 transition ${mode === 'MANUAL' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    Criação Manual
                </button>
                <button onClick={() => setMode('AI')} className={`pb-1 text-sm font-medium border-b-2 transition flex items-center gap-2 ${mode === 'AI' ? 'border-brand-secondary text-brand-secondary' : 'border-transparent text-slate-500'}`}>
                    <Brain size={14} /> Gerar com IA
                </button>
                {mode === 'MANUAL' && (
                    <div className="flex gap-4">
                        <button
                            onClick={handleMagicPolish}
                            disabled={isImproving || isGeneratingAlts}
                            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center gap-2 hover:shadow-lg hover:scale-105 transition shadow-sm disabled:opacity-50"
                            title="Aprimora enunciado e gera alternativas de uma só vez"
                        >
                            {isImproving || isGeneratingAlts ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Polimento Mágico
                        </button>
                        <button
                            onClick={handleAudit}
                            disabled={isAuditing}
                            className="pb-1 text-sm font-bold text-rose-600 flex items-center gap-2 hover:text-rose-800 transition border-b-2 border-transparent hover:border-rose-400"
                        >
                            {isAuditing ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                            Auditoria Pedagógica
                        </button>
                        <label className="cursor-pointer group">
                            <span className="pb-1 text-sm font-bold text-emerald-600 flex items-center gap-2 group-hover:text-emerald-800 transition border-b-2 border-transparent group-hover:border-emerald-400">
                                {isExtractingOCR ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                Magic Scan (OCR)
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleOCR}
                                disabled={isExtractingOCR}
                            />
                        </label>
                    </div>
                )}
            </div>
            <button onClick={() => navigate('/items')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
    );
};
