import React from 'react';
import { Check, Info, Save, ShieldCheck, Loader2 } from 'lucide-react';
import { Item } from '../../../types';

interface ExamReviewProps {
    config: {
        title: string;
        subject: string;
        duration: number;
    };
    gradingConfig: {
        totalsByDiscipline: Record<string, number>;
        totalScore: number;
    };
    setGradingConfig: (config: any) => void;
    selectedItems: Item[];
    onSave: (publish: boolean) => Promise<string | void>;
    onSeal: (id: string) => Promise<void>;
    onStepChange: (step: number) => void;
    navigate: (path: string) => void;
}

export const ExamReview = ({
    config, gradingConfig, setGradingConfig, selectedItems, onSave, onSeal, onStepChange, navigate
}: ExamReviewProps) => {

    const [isSaving, setIsSaving] = React.useState(false);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="border-b pb-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Check className="text-emerald-500" size={24} /> Revisão Final e Pontuação
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Confira os dados da prova e defina a pontuação antes de publicar.</p>
                </div>

                <div className="grid grid-cols-2 gap-12">
                    {/* Summary */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Resumo da Prova</h4>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Título</div>
                                <div className="font-bold text-slate-800">{config.title}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Disciplina</div>
                                    <div className="font-bold text-slate-800">{config.subject}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Duração</div>
                                    <div className="font-bold text-slate-800">{config.duration} min</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Questões</div>
                                <div className="font-bold text-slate-800">{selectedItems.length} itens selecionados</div>
                            </div>
                        </div>
                    </div>

                    {/* Scoring */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Configuração de Notas</h4>

                        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-slate-700">Nota Máxima da Prova</span>
                                    <span className="font-bold text-brand-primary">10.0</span>
                                </div>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-brand-primary outline-none"
                                    defaultValue={10}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setGradingConfig({
                                            ...gradingConfig,
                                            totalsByDiscipline: { ...gradingConfig.totalsByDiscipline, [config.subject]: val }
                                        });
                                    }}
                                />
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 border border-blue-100 flex items-center gap-2">
                                <Info size={16} />
                                <span>
                                    Cada questão valerá aproximadamente <b>{(10 / (selectedItems.length || 1)).toFixed(2)}</b> pontos.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex items-center gap-4 pt-8 border-t border-slate-100">
                    <button onClick={() => onStepChange(2)} className="px-6 py-3 rounded-lg border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition">
                        Voltar
                    </button>
                    <div className="flex-1"></div>
                    <button onClick={async () => {
                        setIsSaving(true);
                        await onSave(false);
                        setIsSaving(false);
                    }} className="px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition">
                        {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar Rascunho'}
                    </button>

                    <button
                        onClick={async () => {
                            setIsSaving(true);
                            await onSave(true);
                            setIsSaving(false);
                        }}
                        className="bg-brand-primary text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-brand-dark transition flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Publicar Normal
                    </button>

                    {/* Premium Crypto Button */}
                    <button
                        onClick={async () => {
                            if (!confirm("Isso irá criptografar a prova com uma chave única (AES-256). Deseja continuar?")) return;
                            setIsSaving(true);
                            try {
                                const id = await onSave(true);
                                if (id && typeof id === 'string') {
                                    await onSeal(id);
                                    navigate('/exams');
                                }
                            } catch (e) {
                                alert("Erro ao criptografar prova");
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                        disabled={isSaving}
                        className={`bg-slate-900 text-amber-400 px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-black border border-amber-500/30 transition-all ${isSaving ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                        Publicar & Criptografar
                    </button>
                </div>
            </div>
        </div>
    );
};
