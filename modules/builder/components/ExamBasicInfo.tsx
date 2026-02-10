import React from 'react';
import { Settings2, Sparkles, Brain, ShieldCheck, GripVertical, Trash, X, ArrowRight } from 'lucide-react';
import { ExamModel } from '../../../types';

interface CoverSection {
    id: string;
    title: string;
    type: 'text' | 'distribution';
    content?: string;
    distribution?: {
        groups: {
            name: string;
            items: {
                subject: string;
                range: string;
                points: string;
            }[];
        }[];
    };
}

interface ExamBasicInfoProps {
    config: {
        title: string;
        duration: number;
        subject: string;
        model: ExamModel;
        shuffleItems: boolean;
        description: string;
    };
    setConfig: (val: any) => void;
    coverConfig: {
        title: string;
        sections: CoverSection[];
        instructions: string;
        securityNotices: string;
    };
    setCoverConfig: (val: any) => void;
    builderMode: 'MANUAL' | 'SMART';
    setBuilderMode: (mode: 'MANUAL' | 'SMART') => void;
    handleSmartGenerate?: () => void;
    setStep: (step: number) => void;
}

export const ExamBasicInfo = ({
    config, setConfig,
    coverConfig, setCoverConfig,
    builderMode, setBuilderMode,
    handleSmartGenerate,
    setStep
}: ExamBasicInfoProps) => {

    const setSmartCriteria = (val: any) => {
        // Placeholder propagation if needed, or handled via useEffect in parent
    };

    return (
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto space-y-6">
            <div className="border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Configuração da Prova</h3>
                <p className="text-sm text-slate-500">Defina os metadados e a aparência da capa.</p>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setBuilderMode('MANUAL')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${builderMode === 'MANUAL' ? 'border-brand-primary bg-brand-light/50 ring-2 ring-brand-primary/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                    <Settings2 size={20} className={builderMode === 'MANUAL' ? 'text-brand-primary' : 'text-slate-400'} />
                    <div className="text-center">
                        <div className="font-bold text-slate-900 text-xs">Manual</div>
                    </div>
                </button>
                <button
                    onClick={() => setBuilderMode('SMART')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${builderMode === 'SMART' ? 'border-brand-primary bg-brand-light/50 ring-2 ring-brand-primary/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                    <Sparkles size={20} className={builderMode === 'SMART' ? 'text-brand-primary' : 'text-slate-400'} />
                    <div className="text-center">
                        <div className="font-bold text-slate-900 text-xs">Inteligente (IA)</div>
                    </div>
                </button>
            </div>

            {/* Essential Metadata */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Título da Prova <span className="text-rose-500">*</span></label>
                    <input
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-slate-800"
                        value={config.title}
                        onChange={e => {
                            setConfig({ ...config, title: e.target.value });
                            setCoverConfig({ ...coverConfig, title: e.target.value });
                        }}
                        placeholder="Ex: Avaliação de História - 1º Bimestre"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Disciplina <span className="text-rose-500">*</span></label>
                        <input
                            className="w-full border rounded-lg p-2"
                            value={config.subject}
                            onChange={e => {
                                setConfig({ ...config, subject: e.target.value });
                            }}
                            placeholder="Ex: História"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Duração (min)</label>
                        <input type="number" className="w-full border rounded-lg p-2" value={config.duration} onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })} />
                    </div>
                </div>
            </div>

            {/* Cover Sections Editor */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-brand-primary" /> Seções da Capa
                    </h4>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCoverConfig({
                                ...coverConfig,
                                sections: [...coverConfig.sections, { id: Math.random().toString(), type: 'text', title: 'NOVA SEÇÃO', content: '' }]
                            })}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition"
                        >
                            + Texto
                        </button>
                        <button
                            onClick={() => setCoverConfig({
                                ...coverConfig,
                                sections: [...coverConfig.sections, {
                                    id: Math.random().toString(),
                                    type: 'distribution',
                                    title: 'QUADRO DE QUESTÕES',
                                    distribution: { groups: [{ name: "GRUPO 1", items: [{ subject: "Matéria", range: "1-10", points: "1.0" }] }] }
                                }]
                            })}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition"
                        >
                            + Quadro
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {coverConfig.sections.map((section, index) => (
                        <div key={section.id} className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                            {/* Header */}
                            <div className="bg-slate-100 p-2 flex items-center gap-2 border-b border-slate-200">
                                <GripVertical size={14} className="text-slate-400 cursor-move" />
                                <input
                                    className="bg-transparent border-none text-xs font-bold text-slate-700 uppercase focus:ring-0 p-0 w-full"
                                    value={section.title}
                                    onChange={e => {
                                        const newSections = [...coverConfig.sections];
                                        newSections[index].title = e.target.value;
                                        setCoverConfig({ ...coverConfig, sections: newSections });
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const newSections = coverConfig.sections.filter((_, i) => i !== index);
                                        setCoverConfig({ ...coverConfig, sections: newSections });
                                    }}
                                    className="text-slate-400 hover:text-rose-500"
                                >
                                    <Trash size={14} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-3">
                                {section.type === 'text' ? (
                                    <textarea
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs h-20 focus:ring-1 focus:ring-brand-primary outline-none resize-none"
                                        value={section.content}
                                        onChange={e => {
                                            const newSections = [...coverConfig.sections];
                                            newSections[index].content = e.target.value;
                                            setCoverConfig({ ...coverConfig, sections: newSections });
                                        }}
                                        placeholder="Digite o conteúdo da seção..."
                                    />
                                ) : (
                                    /* Distribution Table Editor */
                                    <div className="space-y-4">
                                        {section.distribution?.groups.map((group, gIdx) => (
                                            <div key={gIdx} className="bg-white border border-slate-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <input
                                                        className="flex-1 text-xs font-bold border-b border-dashed border-slate-300 focus:border-brand-primary outline-none pb-1"
                                                        value={group.name}
                                                        onChange={e => {
                                                            const newSections = [...coverConfig.sections];
                                                            if (newSections[index].distribution) {
                                                                newSections[index].distribution!.groups[gIdx].name = e.target.value;
                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newSections = [...coverConfig.sections];
                                                            if (newSections[index].distribution) {
                                                                newSections[index].distribution!.groups.splice(gIdx, 1);
                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                            }
                                                        }}
                                                        className="text-rose-400 hover:text-rose-600"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                                {/* Columns */}
                                                <div className="space-y-2">
                                                    {group.items.map((item, iIdx) => (
                                                        <div key={iIdx} className="grid grid-cols-6 gap-2 items-center">
                                                            <input className="col-span-3 text-[10px] border rounded p-1" placeholder="Matéria" value={item.subject} onChange={e => {
                                                                const newSections = [...coverConfig.sections];
                                                                newSections[index].distribution!.groups[gIdx].items[iIdx].subject = e.target.value;
                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                            }} />
                                                            <input className="col-span-1 text-[10px] border rounded p-1" placeholder="Ex: 1-10" value={item.range} onChange={e => {
                                                                const newSections = [...coverConfig.sections];
                                                                newSections[index].distribution!.groups[gIdx].items[iIdx].range = e.target.value;
                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                            }} />
                                                            <input className="col-span-1 text-[10px] border rounded p-1" placeholder="Pts" value={item.points} onChange={e => {
                                                                const newSections = [...coverConfig.sections];
                                                                newSections[index].distribution!.groups[gIdx].items[iIdx].points = e.target.value;
                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                            }} />
                                                            <button onClick={() => {
                                                                const newSections = [...coverConfig.sections];
                                                                newSections[index].distribution!.groups[gIdx].items.splice(iIdx, 1);
                                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                                            }} className="text-slate-300 hover:text-rose-500 justify-self-center"><X size={12} /></button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const newSections = [...coverConfig.sections];
                                                            newSections[index].distribution!.groups[gIdx].items.push({ subject: "", range: "", points: "" });
                                                            setCoverConfig({ ...coverConfig, sections: newSections });
                                                        }}
                                                        className="w-full text-[10px] text-slate-400 hover:text-brand-primary border border-dashed border-slate-200 rounded p-1 mt-2"
                                                    >
                                                        + Adicionar Matéria
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => {
                                                const newSections = [...coverConfig.sections];
                                                newSections[index].distribution!.groups.push({ name: "NOVO GRUPO", items: [] });
                                                setCoverConfig({ ...coverConfig, sections: newSections });
                                            }}
                                            className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:border-brand-primary hover:text-brand-primary transition"
                                        >
                                            + Adicionar Grupo de Colunas
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Model Config */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                    <select className="w-full border rounded-lg p-2 bg-slate-50" value={config.model} onChange={e => setConfig({ ...config, model: e.target.value as ExamModel })}>
                        <option value="SOMATIVO">Somativo (Nota)</option>
                        <option value="ADAPTADO">Adaptado (Flexível)</option>
                        <option value="OCDE_PISA">Padrão OCDE (PISA)</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <div className="flex items-center justify-between w-full p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="text-xs text-amber-800 font-bold flex items-center gap-2"><Brain size={14} /> Embaralhar Itens</div>
                        <input
                            type="checkbox"
                            checked={config.shuffleItems}
                            onChange={e => setConfig({ ...config, shuffleItems: e.target.checked })}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 flex justify-end">
                <button
                    onClick={() => {
                        if (!config.title || !config.subject) return alert("Preencha Título e Disciplina");
                        if (builderMode === 'SMART') {
                            if (handleSmartGenerate) handleSmartGenerate();
                        } else {
                            setStep(2);
                        }
                    }}
                    className="btn-gradient text-white px-6 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
                >
                    {builderMode === 'SMART' ? <><Sparkles size={20} /> Gerar com IA</> : <>Próximo <ArrowRight size={20} /></>}
                </button>
            </div>
        </div>
    );
};
