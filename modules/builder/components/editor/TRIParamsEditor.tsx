
import React, { useState } from 'react';
import { Settings, Info, AlertTriangle } from 'lucide-react';
import { Item } from '../../../../types';

interface TRIParamsEditorProps {
    form: any;
    setForm: React.Dispatch<React.SetStateAction<any>>;
}

export const TRIParamsEditor = ({ form, setForm }: TRIParamsEditorProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Initialize params if missing
    const tri = form.triParams || {
        difficulty: 0,
        discrimination: 1.0,
        guessing: 0.2
    };

    const handleChange = (field: keyof typeof tri, value: number) => {
        const newParams = { ...tri, [field]: value };
        setForm(prev => ({ ...prev, triParams: newParams }));
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-4 flex items-center justify-between text-left transition hover:bg-slate-50 ${isOpen ? 'bg-slate-50 border-b border-slate-100' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition ${isOpen ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Settings size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Calibragem Adaptativa (TRI)</h3>
                        <p className="text-xs text-slate-500">Ajuste os parâmetros matemáticos para o motor adaptativo.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!form.triParams && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">PADRÃO</span>}
                </div>
            </button>

            {isOpen && (
                <div className="p-6 bg-slate-50/50 space-y-6 animate-in slide-in-from-top-2 duration-200">

                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-sm text-blue-800">
                        <Info className="flex-shrink-0 mt-0.5" size={16} />
                        <p>Estes valores influenciam como o algoritmo seleciona esta questão. Só altere se tiver conhecimento estatístico ou resultados de pré-teste.</p>
                    </div>

                    {/* DIFICULDADE (b) */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="font-bold text-sm text-slate-700">Dificuldade (b)</label>
                            <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded border">{tri.difficulty?.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="-3.0" max="3.0" step="0.1"
                            value={tri.difficulty || 0}
                            onChange={(e) => handleChange('difficulty', parseFloat(e.target.value))}
                            className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Muito Fácil (-3)</span>
                            <span>Médio (0)</span>
                            <span>Muito Difícil (+3)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* DISCRIMINAÇÃO (a) */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="font-bold text-sm text-slate-700">Discriminação (a)</label>
                                <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded border">{tri.discrimination?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0.1" max="3.0" step="0.1"
                                value={tri.discrimination || 1.0}
                                onChange={(e) => handleChange('discrimination', parseFloat(e.target.value))}
                                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-[10px] text-slate-500 leading-tight">
                                Capacidade da questão de diferenciar alunos bons dos ruins. Valores acima de 1.0 são ideais.
                            </p>
                        </div>

                        {/* ACERTO AO ACASO (c) */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="font-bold text-sm text-slate-700">Chute (c)</label>
                                <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded border">{tri.guessing?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0.0" max="1.0" step="0.05"
                                value={tri.guessing || 0.2}
                                onChange={(e) => handleChange('guessing', parseFloat(e.target.value))}
                                className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-[10px] text-slate-500 leading-tight">
                                Probabilidade de acertar chutando. Para 5 alternativas, o ideal é 0.20 (20%).
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
