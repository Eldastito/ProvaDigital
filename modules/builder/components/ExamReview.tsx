import React from 'react';
import { Check, Info, Save, ShieldCheck, Loader2, Trash2, ChevronDown, ChevronUp, Truck, Send } from 'lucide-react';
import { Item } from '../../../types';
import { auditExamPedagogically } from '../../../services/PredictivePedagogicalService';
import { Target, AlertTriangle, CheckCircle, Lightbulb, Clock, Brain, User, BarChart, Lock } from 'lucide-react';
import { ExamLogisticsStatus, DifficultyLevel } from '../../../types';

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
    onRemoveItem?: (item: Item) => void;
    logisticsStatus: ExamLogisticsStatus;
    wizardTelemetry: any;
    isHandoffRunning: boolean;
}


export const ExamReview = ({
    config, gradingConfig, setGradingConfig, selectedItems, onSave, onSeal, onStepChange, navigate, onRemoveItem,
    logisticsStatus, wizardTelemetry, isHandoffRunning
}: ExamReviewProps) => {


    const [isSaving, setIsSaving] = React.useState(false);
    const [auditReport, setAuditReport] = React.useState<any>(null);

    React.useEffect(() => {
        const runAudit = async () => {
            const report = await auditExamPedagogically(selectedItems, (config as any).schoolId || 'demo-tenant');
            setAuditReport(report);
        };
        runAudit();
    }, [selectedItems, config]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="border-b pb-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Check className="text-emerald-500" size={24} /> Revisão Final e Status "A Carga"
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-slate-500 text-sm">Confira os dados da prova e o status de segurança antes do envio físico.</p>

                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-2 ${logisticsStatus === ExamLogisticsStatus.SENT ? 'bg-emerald-100 text-emerald-700' :
                                logisticsStatus === ExamLogisticsStatus.SENDING ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                                    logisticsStatus === ExamLogisticsStatus.ERROR ? 'bg-rose-100 text-rose-700' :
                                        'bg-slate-100 text-slate-500'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${logisticsStatus === ExamLogisticsStatus.SENT ? 'bg-emerald-500' :
                                    logisticsStatus === ExamLogisticsStatus.SENDING ? 'bg-indigo-500' :
                                        logisticsStatus === ExamLogisticsStatus.ERROR ? 'bg-rose-500' :
                                            'bg-slate-400'
                                }`} />
                            Status: {
                                logisticsStatus === ExamLogisticsStatus.SENT ? 'Enviada com Sucesso' :
                                    logisticsStatus === ExamLogisticsStatus.SENDING ? 'Enviando...' :
                                        logisticsStatus === ExamLogisticsStatus.ERROR ? 'Erro no Envio' :
                                            logisticsStatus === ExamLogisticsStatus.DRAFT ? 'Rascunho / Pendente' : 'Pronta para Envio'
                            }
                        </div>
                    </div>
                </div>

                {/* Telemetry Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2 text-indigo-700 mb-2">
                            <Brain size={16} />
                            <span className="text-[10px] font-black uppercase">Origem Questões</span>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <div className="text-lg font-bold text-slate-800">{wizardTelemetry.iaCount}</div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Via IA</div>
                            </div>
                            <div className="h-8 w-[1px] bg-indigo-200" />
                            <div>
                                <div className="text-lg font-bold text-slate-800">{wizardTelemetry.manualCount}</div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Manual</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 text-amber-700 mb-2">
                            <BarChart size={16} />
                            <span className="text-[10px] font-black uppercase">Mix Dificuldade</span>
                        </div>
                        <div className="flex gap-4 text-center">
                            <div className="flex-1">
                                <div className="text-xs font-bold text-emerald-600">{wizardTelemetry.difficultyMix[DifficultyLevel.EASY]}</div>
                                <div className="text-[8px] text-slate-400 uppercase font-bold">Fácil</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-amber-600">{wizardTelemetry.difficultyMix[DifficultyLevel.MEDIUM]}</div>
                                <div className="text-[8px] text-slate-400 uppercase font-bold">Média</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-rose-600">{wizardTelemetry.difficultyMix[DifficultyLevel.HARD]}</div>
                                <div className="text-[8px] text-slate-400 uppercase font-bold">Difícil</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                        <div className="flex items-center gap-2 text-teal-700 mb-2">
                            <CheckCircle size={16} />
                            <span className="text-[10px] font-black uppercase">Qualidade & Regras</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-500">Cobertura BNCC:</span>
                                <span className="text-teal-700">{(wizardTelemetry.bnccCoverage * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-1 bg-teal-200 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500" style={{ width: `${wizardTelemetry.bnccCoverage * 100}%` }} />
                            </div>
                        </div>
                    </div>
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

                {/* AI SKILL INSIGHTS */}
                <div className="mt-8 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
                    {/* Animated background element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -mr-32 -mt-32"></div>

                    <div className="flex items-center gap-3 mb-6 relative">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Target className="text-indigo-400" size={24} />
                        </div>
                        {auditReport ? (
                            <>
                                <div>
                                    <h4 className="text-white font-bold text-lg">Insights da Skill de Auditoria</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Health Score:</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${auditReport.score > 70 ? 'bg-emerald-500' : auditReport.score > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${auditReport.score}%` }}
                                                ></div>
                                            </div>
                                            <span className={`text-sm font-black ${auditReport.score > 70 ? 'text-emerald-400' : auditReport.score > 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                {auditReport.score}/100
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ml-auto flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Tempo Est.</span>
                                        <div className="flex items-center gap-1 text-white font-bold">
                                            <Clock size={14} className="text-indigo-400" />
                                            {auditReport.metrics.estimatedTimeMinutes} min
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <h4 className="text-white font-bold text-lg flex items-center gap-2">
                                    <Loader2 className="animate-spin text-indigo-400" size={20} />
                                    Analisando com IA...
                                </h4>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                        {auditReport?.insights.map((insight: any, i: number) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border flex gap-3 transition-all hover:scale-[1.02] ${insight.type === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' :
                                    insight.type === 'DANGER' ? 'bg-rose-500/10 border-rose-500/20 text-rose-100' :
                                        insight.type === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-100' :
                                            'bg-slate-800 border-slate-700 text-slate-200'
                                    }`}
                            >
                                <div className="mt-0.5">
                                    {insight.type === 'SUCCESS' ? <CheckCircle size={18} className="text-emerald-400" /> :
                                        insight.type === 'DANGER' ? <AlertTriangle size={18} className="text-rose-400" /> :
                                            insight.type === 'WARNING' ? <AlertTriangle size={18} className="text-amber-400" /> :
                                                <Lightbulb size={18} className="text-slate-400" />
                                    }
                                </div>
                                <div>
                                    <div className="text-sm font-bold mb-1">{insight.title}</div>
                                    <div className="text-xs opacity-80 leading-relaxed">{insight.message}</div>
                                    {insight.actionLabel && (
                                        <button className="mt-3 text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 transition px-3 py-1.5 rounded-lg">
                                            {insight.actionLabel}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question List Review */}
                <div className="mt-12 border-t pt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                            <Info size={18} className="text-brand-primary" />
                            Verificar Itens Selecionados ({selectedItems.length})
                        </h4>
                    </div>

                    <div className="space-y-3">
                        {selectedItems.map((item, idx) => (
                            <div key={item.id} className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-primary transition-all relative">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex gap-3 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-slate-800 font-medium line-clamp-2">{item.statement}</p>
                                            <div className="flex gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.subject}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${item.difficulty === 'FACIL' ? 'text-emerald-600' : item.difficulty === 'DIFICIL' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                    {item.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onRemoveItem?.(item)}
                                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                        title="Remover questão"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {selectedItems.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm font-medium">Nenhuma questão selecionada.</p>
                                <button onClick={() => onStepChange(2)} className="text-brand-primary font-bold text-sm mt-2 hover:underline">Voltar para seleção</button>
                            </div>
                        )}
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

                    <button
                        onClick={async () => {
                            if (!confirm("Isso irá criptografar a prova com uma chave única (AES-256) e enviá-la para a fila de logística. Deseja continuar?")) return;
                            await onSave(true);
                        }}
                        disabled={isHandoffRunning || logisticsStatus === ExamLogisticsStatus.SENT}
                        className={`bg-slate-900 text-amber-400 px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-black border border-amber-500/30 transition-all ${isHandoffRunning ? 'opacity-75 cursor-wait' : ''} ${logisticsStatus === ExamLogisticsStatus.SENT ? 'grayscale opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isHandoffRunning ? <Loader2 className="animate-spin" size={18} /> :
                            logisticsStatus === ExamLogisticsStatus.SENT ? <Lock size={18} /> : <Truck size={18} />}
                        {logisticsStatus === ExamLogisticsStatus.SENT ? 'Prova Bloqueada (Já Enviada)' : 'Finalizar e Enviar para ExamePad'}
                    </button>
                    {logisticsStatus === ExamLogisticsStatus.SENT && (
                        <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                            ⚠️ A Prova foi encriptada. O conteúdo agora é secreto e só será revelado nos tablets dos alunos no dia da aplicação. Preview desabilitado conforme regra de segurança.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};
