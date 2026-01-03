import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { calculateSchoolRisk, RiskAssessment } from '../../services/riskDetectionEngine';
import { RiskLevel } from '../../types';
import { processSchoolRiskAlerts } from '../../services/alertService';
import {
    AlertTriangle,
    TrendingDown,
    Users,
    Filter,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    FileText,
    Calendar,
    CheckCircle,
    AlertCircle,
    Save,
    Bell
} from 'lucide-react';

type FilterLevel = 'ALL' | RiskLevel;

export const RiskDashboard = () => {
    const state = useAppStore();
    const { currentUser, schools, classes } = state;

    const [filterLevel, setFilterLevel] = useState<FilterLevel>('ALL');
    const [filterClass, setFilterClass] = useState<string>('ALL');
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Calcular risco para todos os alunos da escola
    const riskAssessments = useMemo(() => {
        if (!currentUser?.schoolId) return [];
        return calculateSchoolRisk(currentUser.schoolId, state);
    }, [currentUser, state]);

    // Aplicar filtros
    const filteredAssessments = useMemo(() => {
        let filtered = riskAssessments;

        if (filterLevel !== 'ALL') {
            filtered = filtered.filter(a => a.riskLevel === filterLevel);
        }

        if (filterClass !== 'ALL') {
            filtered = filtered.filter(a => a.classId === filterClass);
        }

        return filtered;
    }, [riskAssessments, filterLevel, filterClass]);

    // Estatísticas
    const stats = useMemo(() => {
        const total = riskAssessments.length;
        const high = riskAssessments.filter(a => a.riskLevel === RiskLevel.HIGH).length;
        const medium = riskAssessments.filter(a => a.riskLevel === RiskLevel.MEDIUM).length;
        const low = riskAssessments.filter(a => a.riskLevel === RiskLevel.LOW).length;

        return { total, high, medium, low };
    }, [riskAssessments]);

    const schoolClasses = useMemo(() => {
        if (!currentUser?.schoolId) return [];
        return classes.filter(c => {
            const school = schools.find(s => s.id === currentUser.schoolId);
            return school && state.classes.some(cl => cl.schoolId === school.id);
        });
    }, [currentUser, classes, schools, state]);

    // Função para salvar alertas
    const handleSaveAlerts = async () => {
        if (!currentUser?.schoolId) return;

        setIsSaving(true);
        try {
            const result = await processSchoolRiskAlerts(currentUser.schoolId, riskAssessments);
            setLastSaved(new Date().toISOString());
            alert(
                `✅ Alertas processados com sucesso!\n\n` +
                `• ${result.created} novos alertas criados\n` +
                `• ${result.updated} alertas atualizados\n` +
                `• ${result.notifications} notificações enviadas\n\n` +
                `Coordenadores e pais foram notificados.`
            );
        } catch (error) {
            console.error('Erro ao salvar alertas:', error);
            alert('❌ Erro ao salvar alertas. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2 flex items-center gap-3">
                    <AlertTriangle className="text-orange-500" size={32} />
                    Gestão de Risco de Evasão
                </h1>
                <p className="text-slate-600">
                    Sistema de detecção precoce e intervenção para prevenir evasão escolar
                </p>
                {lastSaved && (
                    <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle size={16} />
                        Alertas salvos em {new Date(lastSaved).toLocaleString('pt-BR')}
                    </div>
                )}
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                <StatCard
                    title="Total de Alunos"
                    value={stats.total}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Risco Alto"
                    value={stats.high}
                    subtitle={`${((stats.high / stats.total) * 100).toFixed(1)}%`}
                    icon={AlertTriangle}
                    color="red"
                    alert
                />
                <StatCard
                    title="Risco Médio"
                    value={stats.medium}
                    subtitle={`${((stats.medium / stats.total) * 100).toFixed(1)}%`}
                    icon={AlertCircle}
                    color="yellow"
                />
                <StatCard
                    title="Risco Baixo"
                    value={stats.low}
                    subtitle={`${((stats.low / stats.total) * 100).toFixed(1)}%`}
                    icon={CheckCircle}
                    color="green"
                />
            </div>

            {/* Botão de Salvar Alertas */}
            {stats.high > 0 || stats.medium > 0 ? (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-orange-900 mb-2 flex items-center gap-2">
                                <Bell size={20} />
                                Alertas Pendentes
                            </h3>
                            <p className="text-sm text-orange-700 mb-4">
                                {stats.high + stats.medium} alunos precisam de atenção.
                                Salve os alertas para notificar coordenadores e pais automaticamente.
                            </p>
                            <button
                                onClick={handleSaveAlerts}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-lg transition disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Salvar Alertas e Notificar
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-red-600">{stats.high}</div>
                            <div className="text-xs text-red-700">Risco Alto</div>
                            <div className="text-2xl font-bold text-yellow-600 mt-2">{stats.medium}</div>
                            <div className="text-xs text-yellow-700">Risco Médio</div>
                        </div>
                    </div>
                </div>
            ) : null}


            {/* Filtros */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={20} className="text-slate-600" />
                    <h2 className="text-lg font-semibold text-slate-800">Filtros</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Filtro por Nível de Risco */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nível de Risco
                        </label>
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value as FilterLevel)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        >
                            <option value="ALL">Todos os níveis</option>
                            <option value={RiskLevel.HIGH}>🔴 Risco Alto</option>
                            <option value={RiskLevel.MEDIUM}>🟡 Risco Médio</option>
                            <option value={RiskLevel.LOW}>🟢 Risco Baixo</option>
                        </select>
                    </div>

                    {/* Filtro por Turma */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Turma
                        </label>
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        >
                            <option value="ALL">Todas as turmas</option>
                            {schoolClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name} - {cls.series}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 text-sm text-slate-600">
                    Mostrando <strong>{filteredAssessments.length}</strong> de <strong>{stats.total}</strong> alunos
                </div>
            </div>

            {/* Lista de Alunos em Risco */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Alunos Identificados</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Ordenados por score de risco (maior risco primeiro)
                    </p>
                </div>

                {filteredAssessments.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <CheckCircle size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Nenhum aluno encontrado com os filtros selecionados</p>
                        <p className="text-sm mt-2">Ajuste os filtros para ver mais resultados</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredAssessments.map(assessment => (
                            <StudentRiskCard
                                key={assessment.studentId}
                                assessment={assessment}
                                isExpanded={expandedStudent === assessment.studentId}
                                onToggle={() => setExpandedStudent(
                                    expandedStudent === assessment.studentId ? null : assessment.studentId
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente de Card de Estatística
const StatCard = ({ title, value, subtitle, icon: Icon, color, alert }: any) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        green: 'bg-green-50 text-green-600',
    };

    const borderClasses = {
        blue: 'border-blue-200',
        red: 'border-red-200',
        yellow: 'border-yellow-200',
        green: 'border-green-200',
    };

    return (
        <div className={`bg-white p-6 rounded-xl border-2 ${alert ? borderClasses[color as keyof typeof borderClasses] : 'border-slate-200'} shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">{title}</span>
                <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-800">{value}</div>
            {subtitle && (
                <div className="text-sm text-slate-500 mt-1">{subtitle}</div>
            )}
        </div>
    );
};

// Componente de Card de Aluno em Risco
const StudentRiskCard = ({ assessment, isExpanded, onToggle }: {
    assessment: RiskAssessment;
    isExpanded: boolean;
    onToggle: () => void;
}) => {
    const { classes } = useAppStore();
    const studentClass = classes.find(c => c.id === assessment.classId);

    const riskColor = {
        [RiskLevel.HIGH]: 'bg-red-50 border-red-200',
        [RiskLevel.MEDIUM]: 'bg-yellow-50 border-yellow-200',
        [RiskLevel.LOW]: 'bg-green-50 border-green-200',
    };

    const riskBadge = {
        [RiskLevel.HIGH]: 'bg-red-100 text-red-700',
        [RiskLevel.MEDIUM]: 'bg-yellow-100 text-yellow-700',
        [RiskLevel.LOW]: 'bg-green-100 text-green-700',
    };

    const riskLabel = {
        [RiskLevel.HIGH]: '🔴 Risco Alto',
        [RiskLevel.MEDIUM]: '🟡 Risco Médio',
        [RiskLevel.LOW]: '🟢 Risco Baixo',
    };

    return (
        <div className={`border-l-4 ${riskColor[assessment.riskLevel]}`}>
            <div className="p-6">
                {/* Header do Card */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {assessment.studentName}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskBadge[assessment.riskLevel]}`}>
                                {riskLabel[assessment.riskLevel]}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>Turma: {studentClass?.name || 'N/A'}</span>
                            <span>Score: {assessment.riskScore}/100</span>
                            <span>{assessment.factors.length} fatores identificados</span>
                        </div>
                    </div>

                    <button
                        onClick={onToggle}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                {/* Detalhes Expandidos */}
                {isExpanded && (
                    <div className="mt-6 space-y-6">
                        {/* Fatores de Risco */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <TrendingDown size={16} />
                                Fatores de Risco Identificados
                            </h4>
                            <div className="space-y-3">
                                {assessment.factors.map((factor, idx) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-800">{factor.name}</div>
                                                <div className="text-sm text-slate-600 mt-1">
                                                    Valor atual: <strong>{factor.value}</strong> (Limiar: {factor.threshold})
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${factor.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                factor.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {factor.severity}
                                            </span>
                                        </div>

                                        {/* Evidências */}
                                        {factor.evidence.length > 0 && (
                                            <div className="mt-2 text-sm text-slate-600">
                                                <strong>Evidências:</strong>
                                                <ul className="list-disc list-inside mt-1 space-y-1">
                                                    {factor.evidence.map((ev, i) => (
                                                        <li key={i}>{ev}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Recomendação */}
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                            <strong className="text-blue-800">Recomendação:</strong>
                                            <p className="text-blue-700 mt-1">{factor.recommendation}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Intervenções Sugeridas */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <FileText size={16} />
                                Intervenções Sugeridas (Prioridade)
                            </h4>
                            <div className="space-y-3">
                                {assessment.interventions.map((intervention, idx) => (
                                    <div key={idx} className={`p-4 rounded-lg border-2 ${intervention.priority === 'URGENT' ? 'bg-red-50 border-red-300' :
                                        intervention.priority === 'HIGH' ? 'bg-orange-50 border-orange-300' :
                                            'bg-blue-50 border-blue-300'
                                        }`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${intervention.priority === 'URGENT' ? 'bg-red-600 text-white' :
                                                        intervention.priority === 'HIGH' ? 'bg-orange-600 text-white' :
                                                            'bg-blue-600 text-white'
                                                        }`}>
                                                        {intervention.priority}
                                                    </span>
                                                    <span className="font-semibold text-slate-800">{intervention.action}</span>
                                                </div>
                                                <div className="text-sm text-slate-600 mt-2">{intervention.description}</div>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-600">Responsável:</span>
                                                <span className="ml-2 font-medium text-slate-800">{intervention.target}</span>
                                            </div>
                                            {intervention.deadline && (
                                                <div>
                                                    <span className="text-slate-600">Prazo:</span>
                                                    <span className="ml-2 font-medium text-slate-800">{intervention.deadline}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2 text-xs text-slate-600 italic">
                                            💡 {intervention.expectedImpact}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ações Rápidas */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                            <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition">
                                <MessageCircle size={16} />
                                Alertar Pais
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                                <Calendar size={16} />
                                Agendar Reunião
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                                <FileText size={16} />
                                Criar Plano de Intervenção
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
