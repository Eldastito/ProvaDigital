import React from 'react';
import { X, CheckCircle, AlertTriangle, FileText, ThumbsUp, Eye, Calendar } from 'lucide-react';
import { DualValidationResult } from '../../../types';
import { useAppStore } from '../../../store/useAppStore';
import { mapPedagogicalInsightToTask } from '../../../services/actionableTaskService';
import { SkillInsight } from '../../../services/PredictivePedagogicalService';
import { useToast } from '../../../components/ui/Toast';

interface ValidationResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    validationResults: DualValidationResult | null;
    coverText: string;
    onApprove: () => void;
    onReview: () => void;
}

export const ValidationResultsModal: React.FC<ValidationResultsModalProps> = ({
    isOpen,
    onClose,
    validationResults,
    coverText,
    onApprove,
    onReview
}) => {
    if (!isOpen || !validationResults) return null;

    const { phase1, phase2, overallScore, approved, flaggedQuestions } = validationResults;
    const { addTask } = useAppStore();

    const handleCreateTask = (issue: any) => {
        const mockSkillInsight: SkillInsight = {
            type: 'DANGER',
            title: `Revisar: ${issue.category}`,
            message: issue.description,
            actionLabel: 'Revisar Prova',
            actionType: 'BNCC'
        };
        addTask(mapPedagogicalInsightToTask(mockSkillInsight));
        toast.success('Tarefa de revisão agendada com sucesso!');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-sky-50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            {approved ? (
                                <CheckCircle className="text-green-500" size={28} />
                            ) : (
                                <AlertTriangle className="text-amber-500" size={28} />
                            )}
                            Resultados da Validação
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Análise completa em 2 fases: Qualidade Técnica + Padrões Educacionais
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-lg transition"
                    >
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Score Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ScoreCard
                            title="Qualidade"
                            score={phase1.skillCoverage}
                            icon="🎯"
                        />
                        <ScoreCard
                            title="INEP"
                            score={phase2.inepCompliance}
                            icon="📋"
                        />
                        <ScoreCard
                            title="BNCC"
                            score={phase2.bnccCompliance}
                            icon="📚"
                        />
                        <ScoreCard
                            title="Geral"
                            score={overallScore}
                            icon="⭐"
                            highlight
                        />
                    </div>

                    {/* Status Banner */}
                    <div className={`p-4 rounded-xl border-2 ${approved
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            {approved ? (
                                <CheckCircle className="text-green-600" size={24} />
                            ) : (
                                <AlertTriangle className="text-amber-600" size={24} />
                            )}
                            <div>
                                <div className="font-bold text-slate-800">
                                    {approved ? '✅ Banco Aprovado!' : '⚠️ Revisão Recomendada'}
                                </div>
                                <div className="text-sm text-slate-600">
                                    {approved
                                        ? 'Todas as questões atendem aos critérios de qualidade.'
                                        : `${flaggedQuestions.length} questão(ões) necessita(m) de revisão.`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Validation */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-slate-800">📊 Análise Detalhada</h3>

                        {/* Phase 1 */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                            <div className="font-semibold text-slate-700">Fase 1: Qualidade Técnica</div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <CheckItem
                                    label="Cobertura de Habilidades"
                                    value={`${phase1.skillCoverage}%`}
                                    passed={phase1.skillCoverage >= 70}
                                />
                                <CheckItem
                                    label="Distribuição Equilibrada"
                                    value={phase1.difficultyDistribution ? 'Sim' : 'Não'}
                                    passed={phase1.difficultyDistribution}
                                />
                                <CheckItem
                                    label="Diversidade de Distratores"
                                    value={`${phase1.distractorDiversity}%`}
                                    passed={phase1.distractorDiversity >= 70}
                                />
                                <CheckItem
                                    label="Parâmetros TRI"
                                    value={phase1.triParamsEstimated ? 'Estimados' : 'Pendente'}
                                    passed={phase1.triParamsEstimated}
                                />
                            </div>
                        </div>

                        {/* Phase 2 */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                            <div className="font-semibold text-slate-700">Fase 2: Conformidade com Padrões</div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <CheckItem
                                    label="Contextualização"
                                    value={phase2.detailedReport.contextualization ? 'Adequada' : 'Revisar'}
                                    passed={phase2.detailedReport.contextualization}
                                />
                                <CheckItem
                                    label="Comando Claro"
                                    value={phase2.detailedReport.clearCommand ? 'Sim' : 'Revisar'}
                                    passed={phase2.detailedReport.clearCommand}
                                />
                                <CheckItem
                                    label="Distratores Plausíveis"
                                    value={phase2.detailedReport.plausibleDistractors ? 'Sim' : 'Revisar'}
                                    passed={phase2.detailedReport.plausibleDistractors}
                                />
                                <CheckItem
                                    label="Alinhamento BNCC"
                                    value={phase2.detailedReport.bnccAlignment ? 'Alinhado' : 'Revisar'}
                                    passed={phase2.detailedReport.bnccAlignment}
                                />
                            </div>
                        </div>

                        {/* Issues */}
                        {phase2.issues.length > 0 && (
                            <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                                <div className="font-semibold text-amber-800 flex items-center gap-2">
                                    <AlertTriangle size={18} />
                                    Problemas Identificados ({phase2.issues.length})
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {phase2.issues.slice(0, 5).map((issue, idx) => (
                                        <div key={idx} className="text-sm bg-white p-2 rounded border border-amber-200">
                                            <div className="font-medium text-slate-700 flex justify-between items-start">
                                                <span>Questão #{issue.questionNumber} - {issue.category}</span>
                                                <button
                                                    onClick={() => handleCreateTask(issue)}
                                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1 font-bold transition"
                                                    title="Criar tarefa para resolver depois"
                                                >
                                                    <Calendar size={10} /> Agendar para depois
                                                </button>
                                            </div>
                                            <div className="text-slate-600">{issue.description}</div>
                                            {issue.suggestion && (
                                                <div className="text-blue-600 text-xs mt-1">
                                                    💡 {issue.suggestion}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {phase2.issues.length > 5 && (
                                        <div className="text-xs text-slate-500 text-center">
                                            + {phase2.issues.length - 5} problema(s) adicional(is)
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cover Text */}
                    {coverText && (
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <FileText size={20} />
                                Documentação da Capa
                            </h3>
                            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto border border-slate-200">
                                {coverText}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                    >
                        Fechar
                    </button>
                    {!approved && (
                        <button
                            onClick={onReview}
                            className="px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition flex items-center gap-2"
                        >
                            <Eye size={18} />
                            Revisar Questões
                        </button>
                    )}
                    <button
                        onClick={onApprove}
                        className="px-6 py-3 btn-gradient rounded-lg font-semibold flex items-center gap-2 shadow-md"
                    >
                        <ThumbsUp size={18} />
                        {approved ? 'Aprovar Tudo' : 'Aprovar Mesmo Assim'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const ScoreCard: React.FC<{ title: string; score: number; icon: string; highlight?: boolean }> = ({
    title, score, icon, highlight
}) => (
    <div className={`p-4 rounded-xl border-2 ${highlight
        ? 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200'
        : 'bg-white border-slate-200'
        }`}>
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-xs text-slate-600 font-medium">{title}</div>
        <div className={`text-2xl font-bold ${score >= 80 ? 'text-green-600' :
            score >= 70 ? 'text-amber-600' :
                'text-red-600'
            }`}>
            {score}%
        </div>
    </div>
);

const CheckItem: React.FC<{ label: string; value: string; passed: boolean }> = ({
    label, value, passed
}) => (
    <div className="flex items-center justify-between">
        <span className="text-slate-600">{label}:</span>
        <span className={`font-semibold ${passed ? 'text-green-600' : 'text-amber-600'}`}>
            {passed ? '✓' : '⚠'} {value}
        </span>
    </div>
);
