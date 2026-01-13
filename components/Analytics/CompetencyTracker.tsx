import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Target, ChevronRight, AlertCircle, BookOpen } from 'lucide-react';
import { analyzeBNCCCompetencies } from '../../services/analyticsEngine';
import { CompetencyRadarChart } from '../Charts/CompetencyRadarChart';
import { generateCompetencyRadarData } from '../../services/analyticsEngine';

export const CompetencyTracker = () => {
    const { results, items, exams, students, currentUser } = useAppStore();
    const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null);

    // Filter logic (same as Dashboard)
    const accessibleResults = useMemo(() => {
        // Basic permissions logic (can be expanded)
        return results;
    }, [results]);

    const competencies = useMemo(() =>
        analyzeBNCCCompetencies(accessibleResults, items, exams),
        [accessibleResults, items, exams]
    );

    const radarData = useMemo(() => {
        // For this generic view, we'll assume we are comparing the overall average vs a "perfect" score
        // or if a specific student is selected (future enhancement), compare student vs class.
        // Here we will visualize Class Average vs Max Score as a baseline.
        return competencies.map(c => ({
            competency: c.code,
            studentScore: c.averageScore, // Using overall average as primary measure for this view
            classAverage: 70, // Benchmark
            maxScore: 100
        })).slice(0, 6); // Limit to top 6 for readability in radar

    }, [competencies]);

    const selectedData = useMemo(() =>
        selectedCompetency ? competencies.find(c => c.code === selectedCompetency) : null,
        [selectedCompetency, competencies]
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Target className="text-indigo-600" />
                    Rastreador de Competências BNCC
                </h2>
                <p className="text-slate-600 mb-6">
                    Acompanhamento detalhado do desenvolvimento das competências e habilidades conforme a Base Nacional Comum Curricular.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Radar Chart Section */}
                    <div>
                        <CompetencyRadarChart
                            data={radarData}
                            title="Mapeamento de Competências (Top 6)"
                        />
                    </div>

                    {/* Competency List */}
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                        {competencies.map(comp => (
                            <div
                                key={comp.code}
                                onClick={() => setSelectedCompetency(comp.code)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedCompetency === comp.code
                                        ? 'border-indigo-500 bg-indigo-50 shadow-md transform scale-[1.01]'
                                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-slate-800">{comp.code}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${comp.masteryLevel === 'high' ? 'bg-green-100 text-green-800' :
                                            comp.masteryLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>
                                        {comp.averageScore.toFixed(0)}% de Domínio
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                                    <div
                                        className={`h-1.5 rounded-full ${comp.masteryLevel === 'high' ? 'bg-green-500' :
                                                comp.masteryLevel === 'medium' ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                            }`}
                                        style={{ width: `${comp.averageScore}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">
                                    Avaliado em {comp.questionsCount} questões
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Drill Down Details */}
            {selectedData && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <BookOpen className="text-indigo-600" size={32} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900 mb-1">
                                Análise Detalhada: {selectedData.code}
                            </h3>
                            <p className="text-slate-600 mb-4">{selectedData.description || "Descrição padrão da competência conforme documentação oficial da BNCC."}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Alunos com Dificuldade</h4>
                                    <p className="text-3xl font-bold text-red-600">{selectedData.studentsBelowAverage}</p>
                                    <p className="text-xs text-slate-500 mt-1">Abaixo da média da turma</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Alunos em Excelência</h4>
                                    <p className="text-3xl font-bold text-green-600">{selectedData.studentsAboveAverage}</p>
                                    <p className="text-xs text-slate-500 mt-1">Acima da média da turma</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg flex flex-col justify-center items-start">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Recomendação</h4>
                                    <div className="flex items-center gap-2 text-indigo-700 text-sm font-medium">
                                        <AlertCircle size={16} />
                                        {selectedData.masteryLevel === 'low' ? 'Reforço Urgente Necessário' :
                                            selectedData.masteryLevel === 'medium' ? 'Revisão Recomendada' :
                                                'Avançar para Próximo Nível'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
