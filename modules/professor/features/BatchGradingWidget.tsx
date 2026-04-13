import React, { useState, useMemo } from 'react';
import { AnswerCluster } from '../../../types';
import { ClusteringService } from '../../../services/ai/clusteringService'; // Assuming service path
import { useAppStore } from '../../../store/useAppStore';
import { Brain, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

interface BatchGradingWidgetProps {
    clusters: AnswerCluster[];
    onGradeCluster: (clusterId: string, grade: number, feedback: string) => void;
}

export const BatchGradingWidget: React.FC<BatchGradingWidgetProps> = ({ clusters, onGradeCluster }) => {
    const [selectedClusterId, setSelectedClusterId] = useState<string | null>(clusters[0]?.id || null);
    const toast = useToast();
    const [grade, setGrade] = useState<number>(0);
    const [feedback, setFeedback] = useState<string>('');

    const selectedCluster = useMemo(() => clusters.find(c => c.id === selectedClusterId), [clusters, selectedClusterId]);

    // Update form when cluster changes
    React.useEffect(() => {
        if (selectedCluster) {
            setGrade(selectedCluster.suggestedGrade || 0);
            setFeedback(selectedCluster.gradeReasoning || '');
        }
    }, [selectedClusterId]);

    const handleApply = () => {
        if (selectedClusterId) {
            onGradeCluster(selectedClusterId, grade, feedback);
            toast.info(`Nota ${grade} aplicada para ${selectedCluster?.answerIds.length} alunos com sucesso!`);
        }
    };

    if (!selectedCluster) return <div className="p-8 text-center text-slate-500">Nenhum agrupamento disponível.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
            {/* Sidebar: Cluster List */}
            <div className="bg-slate-50 border-r border-slate-200 overflow-y-auto rounded-l-xl">
                <div className="p-4 border-b border-slate-200 bg-white sticky top-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Brain size={18} className="text-purple-600" />
                        Grupos Sugeridos
                    </h3>
                    <p className="text-xs text-slate-500">IA identificou {clusters.length} padrões de resposta.</p>
                </div>
                <div className="divide-y divide-slate-100">
                    {clusters.map(cluster => (
                        <div
                            key={cluster.id}
                            onClick={() => setSelectedClusterId(cluster.id)}
                            className={`p-4 cursor-pointer hover:bg-white transition-colors border-l-4 ${selectedClusterId === cluster.id ? 'bg-white border-purple-500 shadow-sm' : 'border-transparent'
                                }`}
                        >
                            <h4 className="font-bold text-slate-700 text-sm mb-1">{cluster.label}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Users size={12} /> {cluster.answerIds.length}
                                </span>
                                <span>Confiança: {Math.round(cluster.confidence * 100)}%</span>
                            </div>

                            {/* PLAGIARISM ALERT */}
                            {cluster.isPlagiarismSuspect && (
                                <div className="mt-2 flex items-center gap-1 text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                    <AlertTriangle size={12} />
                                    Suspeita de Cópia ({Math.round((cluster.avgSimilarity || 0) * 100)}%)
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area: Details & Actions */}
            <div className="lg:col-span-2 p-6 flex flex-col h-full overflow-y-auto">
                <div className="mb-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Resumo do Grupo</span>
                    <h2 className="text-xl font-bold text-slate-800 mt-1">{selectedCluster.label}</h2>
                    <p className="text-slate-600 mt-2 bg-slate-50 p-4 rounded-lg border border-slate-200 italic">
                        "{selectedCluster.summary}"
                    </p>

                    {selectedCluster.isPlagiarismSuspect && (
                        <div className="mt-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <strong>Alta Similaridade Detectada ({Math.round((selectedCluster.avgSimilarity || 0) * 100)}%)</strong>
                                <p>As respostas deste grupo são matematicamente quase idênticas. Verifique se houve cópia.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nota em Lote</label>
                        <input
                            type="number"
                            min="0" max="10"
                            value={grade}
                            onChange={(e) => setGrade(Number(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-lg"
                        />
                    </div>
                </div>

                <div className="mb-6 flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Feedback Padronizado</label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                        placeholder="Escreva um feedback que será enviado para todos os alunos deste grupo..."
                    />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h5 className="font-bold text-amber-800 text-sm">Atenção</h5>
                        <p className="text-xs text-amber-700">
                            Ao confirmar, a nota e o feedback serão aplicados para <strong>{selectedCluster.answerIds.length} alunos</strong>.
                            Você poderá ajustar notas individuais depois se necessário.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleApply}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                    <CheckCircle size={20} />
                    Aplicar Correção em Lote
                </button>
            </div>
        </div>
    );
};
