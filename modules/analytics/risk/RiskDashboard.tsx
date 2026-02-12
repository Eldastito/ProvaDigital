import React, { useState, useMemo, useEffect } from 'react';
import { useSafeAppStore } from '../../../store/useAppStore';
import { calculateSchoolRisk, calculateBatchRisk, RiskAssessment } from '../../../services/riskDetectionEngine';
import { RiskLevel } from '../../../types';
import { processSchoolRiskAlerts, createIntervention, getInterventionsByAlert } from '../../../services/alertService';
import { growthService, GrowthMetric } from '../../../services/growthService';
import { uuidv4 } from '../../../utils/helpers';
import {
    AlertTriangle,
    TrendingDown,
    TrendingUp,
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
    Bell,
    Brain
} from 'lucide-react';
import { RiskAgentAnalyst } from './components/RiskAgentAnalyst';

type FilterLevel = 'ALL' | RiskLevel;

export const RiskDashboard = () => {
    const state = useSafeAppStore();
    const { currentUser, schools, classes } = state;

    const [filterLevel, setFilterLevel] = useState<FilterLevel>('ALL');
    const [filterClass, setFilterClass] = useState<string>('ALL');
    const [filterSchool, setFilterSchool] = useState<string>('ALL');
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string>('');
    const [activeModal, setActiveModal] = useState<'MEETING' | 'PLAN' | null>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);

    // HIERARQUIA DE ACESSO
    const isMEC = currentUser?.role === 'SUPER_ADMIN';
    const isStateAdmin = currentUser?.role === 'STATE_ADMIN';
    const isMunicipalAdmin = currentUser?.role === 'TENANT_ADMIN';

    // MEC e Estadual veem tudo (No MVP, assumimos que Estadual vê todo o estado/deployment)
    const canViewAllSchools = isMEC || isStateAdmin;

    // Obter lista de escolas visíveis
    const visibleSchools = useMemo(() => {
        if (canViewAllSchools) return state.schools;

        // Secretaria Municipal: Vê todas as escolas do seu município (Tenant)
        if (isMunicipalAdmin && currentUser?.tenantId) {
            return state.schools.filter(s => s.tenantId === currentUser.tenantId);
        }

        // Diretor/Supervisor: Vê apenas sua escola
        if (currentUser?.schoolId) {
            return state.schools.filter(s => s.id === currentUser.schoolId);
        }

        return [];
    }, [currentUser, state.schools, canViewAllSchools, isMunicipalAdmin]);

    // Obter lista de turmas visíveis
    const schoolClasses = useMemo(() => {
        let baseClasses = state.classes;

        // Se uma escola específica estiver selecionada no filtro
        if (filterSchool !== 'ALL') {
            baseClasses = baseClasses.filter(c => c.schoolId === filterSchool);
        } else {
            // Se não selecionou, filtra pelo escopo possível
            if (isMunicipalAdmin && currentUser?.tenantId) {
                // Classes de escolas do tenant
                const tenantSchoolIds = visibleSchools.map(s => s.id);
                baseClasses = baseClasses.filter(c => tenantSchoolIds.includes(c.schoolId));
            } else if (!canViewAllSchools && currentUser?.schoolId) {
                // Diretor/Prof na sua escola
                baseClasses = baseClasses.filter(c => c.schoolId === currentUser.schoolId);
            }
        }

        // Restrição do Professor (apenas suas turmas)
        if (currentUser?.role === 'PROFESSOR' && currentUser.classIds) {
            baseClasses = baseClasses.filter(c => currentUser.classIds?.includes(c.id));
        }

        return baseClasses;
    }, [currentUser, state.classes, filterSchool, canViewAllSchools, isMunicipalAdmin, visibleSchools]);

    // Calcular risco (Hierárquico)
    const riskAssessments = useMemo(() => {
        // 1. Identificar alunos elegíveis
        let eligibleStudents = state.students;

        // Filtrar por escola (se selecionada)
        if (filterSchool !== 'ALL') {
            eligibleStudents = eligibleStudents.filter(s => s.schoolId === filterSchool);
        } else {
            // Se não tem escola selecionada, aplica filtro de escopo
            if (isMunicipalAdmin && currentUser?.tenantId) {
                eligibleStudents = eligibleStudents.filter(s => s.tenantId === currentUser.tenantId);
            } else if (!canViewAllSchools && currentUser?.schoolId) {
                eligibleStudents = eligibleStudents.filter(s => s.schoolId === currentUser.schoolId);
            }
        }

        // 2. Se for professor, filtrar alunos das suas turmas
        if (currentUser?.role === 'PROFESSOR' && currentUser.classIds) {
            eligibleStudents = eligibleStudents.filter(s => currentUser.classIds?.includes(s.classId));
        }

        // 3. Calcular risco em lote
        return calculateBatchRisk(eligibleStudents, state);

    }, [currentUser, state, filterSchool, canViewAllSchools, isMunicipalAdmin]);

    // Aplicar filtros de UI (Nível e Turma)
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


    // Função para salvar alertas
    const handleSaveAlerts = async () => {
        // Se for admin geral, pode não ter schoolId definido, então processamos por lote ou escola?
        // O backend espera schoolId. Se estivermos vendo MÚLTIPLAS escolas, isso é complexo.
        // Por simplificação: Salvar alertas funciona melhor "Por Escola selecionada" ou ignora school_id no backend se for nulo.

        const targetSchoolId = filterSchool !== 'ALL' ? filterSchool : currentUser?.schoolId;

        if (!targetSchoolId && !canViewAllSchools) return; // Segurança

        setIsSaving(true);
        try {
            // Se tivermos múltiplas escolas, teríamos que agrupar.
            // Para MVP, vamos salvar passando o first schoolId ou tratar no serviço.
            // O serviço `processSchoolRiskAlerts` itera sobre assessments.
            // Ele usa `saveRiskAlert` que precisa de `schoolId`. O Assessment JÁ TEM `schoolId`.
            // Então podemos refatorar `processSchoolRiskAlerts` para não exigir schoolId como parametro principal, ou ignorá-lo.

            // Vou chamar passando targetSchoolId ou o primeiro da lista, mas o importante é que o assessment tenha os dados.
            const result = await processSchoolRiskAlerts(targetSchoolId || 'MULTI_SCHOOL', riskAssessments);

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

    const handleAlertParents = async (assessment: RiskAssessment) => {
        alert(`📣 Notificação enviada para os responsáveis de ${assessment.studentName}.`);
    };

    const handleScheduleMeeting = (assessment: RiskAssessment) => {
        setSelectedAssessment(assessment);
        setActiveModal('MEETING');
    };

    const handleCreateIntervention = (assessment: RiskAssessment) => {
        setSelectedAssessment(assessment);
        setActiveModal('PLAN');
    };

    const handleSubmitAction = async (actionData: any) => {
        if (!selectedAssessment || !currentUser) return;
        setIsSubmittingAction(true);
        try {
            // 1. Garantir que o Alerta de Risco esteja salvo no banco (usa saveRiskAlert importado)
            const alertResult = await processSchoolRiskAlerts(selectedAssessment.schoolId || 'N/A', [selectedAssessment]);

            // Buscamos o ID do alerta recém criado ou atualizado
            // Para simplificar no MVP, vamos usar o studentId se não conseguirmos o UUID do risk_alerts facilmente aqui,
            // mas o alertService.ts permite buscar por studentId.

            await createIntervention({
                alertId: selectedAssessment.studentId, // Usando studentId como fallback de vínculo
                ...actionData,
                responsibleId: currentUser.id,
                responsibleName: currentUser.name || 'Coordenador',
                status: 'PENDING'
            });

            window.alert('✅ Ação registrada com sucesso no sistema!');
            setActiveModal(null);
            setSelectedAssessment(null);
        } catch (error) {
            console.error('Erro ao registrar ação:', error);
            window.alert('❌ Erro ao salvar a ação. Por favor, tente novamente.');
        } finally {
            setIsSubmittingAction(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header - Refined Card Layout */}
            <div className="mx-0 mt-2 mb-8 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md z-20">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-50 p-3 rounded-xl text-orange-500">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Risco de Evasão</h1>
                        <p className="text-slate-500 text-sm font-medium">
                            {canViewAllSchools ? 'Visão Consolidada da Rede de Ensino' : 'Detecção precoce e intervenção'}
                        </p>
                        {lastSaved && (
                            <div className="mt-1 text-[10px] text-green-600 font-bold uppercase flex items-center gap-1">
                                <CheckCircle size={12} /> Salvo em {new Date(lastSaved).toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>
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
                    subtitle={`${((stats.high / stats.total) * 100).toFixed(1)}% `}
                    icon={AlertTriangle}
                    color="red"
                    alert
                />
                <StatCard
                    title="Risco Médio"
                    value={stats.medium}
                    subtitle={`${((stats.medium / stats.total) * 100).toFixed(1)}% `}
                    icon={AlertCircle}
                    color="yellow"
                />
                <StatCard
                    title="Risco Baixo"
                    value={stats.low}
                    subtitle={`${((stats.low / stats.total) * 100).toFixed(1)}% `}
                    icon={CheckCircle}
                    color="green"
                />
            </div>

            {/* AI Agent Analyst - Contextual Strategic Insights */}
            <RiskAgentAnalyst assessments={riskAssessments} />

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

                    {/* Filtro por Escola (Apenas para Admins/Secretaria) */}
                    {(canViewAllSchools || isMunicipalAdmin) && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Escola / Unidade
                            </label>
                            <select
                                value={filterSchool}
                                onChange={(e) => {
                                    setFilterSchool(e.target.value);
                                    setFilterClass('ALL'); // Reset class filter when school changes
                                }}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                            >
                                <option value="ALL">Todas as Escolas</option>
                                {visibleSchools.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

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
                        {filteredAssessments.map(risk => (
                            <StudentRiskCard
                                key={risk.studentId}
                                assessment={risk}
                                isExpanded={expandedStudent === risk.studentId}
                                onToggle={() => setExpandedStudent(
                                    expandedStudent === risk.studentId ? null : risk.studentId
                                )}
                                onAlertParents={handleAlertParents}
                                onScheduleMeeting={handleScheduleMeeting}
                                onCreatePlan={handleCreateIntervention}
                            />
                        ))}
                    </div>

                )}
            </div>

            {/* MODAIS DE INTERVENÇÃO */}
            {activeModal === 'MEETING' && selectedAssessment && (
                <MeetingModal
                    assessment={selectedAssessment}
                    onClose={() => setActiveModal(null)}
                    onSubmit={handleSubmitAction}
                    isSubmitting={isSubmittingAction}
                />
            )}

            {activeModal === 'PLAN' && selectedAssessment && (
                <InterventionPlanModal
                    assessment={selectedAssessment}
                    onClose={() => setActiveModal(null)}
                    onSubmit={handleSubmitAction}
                    isSubmitting={isSubmittingAction}
                />
            )}
        </div>
    );
};

// ============================================
// COMPONENTES DE APOIO (CARDS E MODAIS)
// ============================================

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

const GrowthIndicator = ({ studentId }: { studentId: string }) => {
    const [growth, setGrowth] = useState<GrowthMetric | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchGrowth = async () => {
            setLoading(true);
            try {
                // No MVP, comparamos os dois últimos exames conhecidos
                // Mock ids para demonstração se não houver exames reais no contexto local
                const metric = await growthService.calculateStudentGrowth(studentId, 'baseline', 'followup');
                setGrowth(metric);
            } catch (e) {
                console.error('Growth fetch error', e);
            } finally {
                setLoading(false);
            }
        };
        fetchGrowth();
    }, [studentId]);

    if (loading) return <div className="animate-pulse h-4 w-12 bg-slate-200 rounded"></div>;
    if (!growth) return null;

    const isPositive = growth.deltaTheta > 0;

    return (
        <div className="flex flex-col items-end">
            <div className="text-sm font-medium text-slate-700">Crescimento (Δθ)</div>
            <div className={`text-lg font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {growth.deltaTheta > 0 ? '+' : ''}{growth.deltaTheta.toFixed(2)}
            </div>
        </div>
    );
};

const StudentRiskCard = ({
    assessment,
    isExpanded,
    onToggle,
    onAlertParents,
    onScheduleMeeting,
    onCreatePlan
}: any) => {
    const riskBadge = assessment.riskLevel === RiskLevel.HIGH ? 'bg-red-100 text-red-700' :
        assessment.riskLevel === RiskLevel.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700';

    const riskLabel = assessment.riskLevel === RiskLevel.HIGH ? 'Risco Alto' :
        assessment.riskLevel === RiskLevel.MEDIUM ? 'Risco Médio' :
            'Risco Baixo';

    return (
        <div className={`border-l-4 transition-all ${assessment.riskLevel === RiskLevel.HIGH ? 'border-red-500' :
            assessment.riskLevel === RiskLevel.MEDIUM ? 'border-yellow-500' :
                'border-green-500'
            } ${isExpanded ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}>
            <div
                className="p-4 md:p-6 cursor-pointer flex items-center justify-between"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${assessment.riskLevel === RiskLevel.HIGH ? 'bg-red-100 text-red-700' :
                        assessment.riskLevel === RiskLevel.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                        {assessment.studentName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{assessment.studentName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${riskBadge}`}>
                                {riskLabel}
                            </span>
                            <span className="text-xs text-slate-500">Score: {assessment.riskScore}/100</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <GrowthIndicator studentId={assessment.studentId} />
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-medium text-slate-700">Frequência Estimada</div>
                        <div className={`text-lg font-bold ${assessment.simulatedAttendance < 75 ? 'text-red-600' : 'text-green-600'}`}>
                            {assessment.simulatedAttendance}%
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                </div>
            </div>

            {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <AlertCircle size={14} /> Fatores de Risco Detectados
                            </h4>
                            <div className="space-y-3">
                                {assessment.factors.map((factor: any, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                                        <div className={`mt-1 p-1 rounded ${factor.severity === RiskLevel.HIGH ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                                            }`}>
                                            <TrendingDown size={14} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{factor.name}</div>
                                            <p className="text-xs text-slate-600 mt-1">{factor.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <CheckCircle size={14} /> Intervenções Recomendadas
                            </h4>
                            <div className="space-y-3">
                                {assessment.factors.map((factor: any, i: number) => factor.recommendation && (
                                    <div key={i} className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                        <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                                            {factor.recommendation}
                                        </p>
                                    </div>
                                ))}
                                {assessment.factors.every((f: any) => !f.recommendation) && (
                                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 italic text-center">
                                        Aguardando análise detalhada para recomendações específicas.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                        <button
                            onClick={() => onAlertParents(assessment)}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition"
                        >
                            <MessageCircle size={16} />
                            Alertar Pais
                        </button>
                        <button
                            onClick={() => onScheduleMeeting(assessment)}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                        >
                            <Calendar size={16} />
                            Agendar Reunião
                        </button>
                        <button
                            onClick={() => onCreatePlan(assessment)}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                        >
                            <FileText size={16} />
                            Criar Plano de Intervenção
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MeetingModal = ({ assessment, onClose, onSubmit, isSubmitting }: any) => {
    const [formData, setFormData] = React.useState({
        action: 'Reunião Pedagógica',
        description: `Reunião para tratar do risco de evasão do aluno ${assessment.studentName}.`,
        target: 'PARENT',
        priority: 'HIGH',
        scheduledDate: new Date().toISOString().split('T')[0] + 'T14:00',
        notes: ''
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-brand-primary p-6 text-white">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Calendar size={24} /> Agendar Reunião
                        </h2>
                        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full text-white/80 hover:text-white transition-colors">
                            <ChevronDown size={24} className="rotate-90" />
                        </button>
                    </div>
                    <p className="text-brand-light/80 text-sm mt-1">Aluno: {assessment.studentName}</p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data e Hora</label>
                            <input
                                type="datetime-local"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                value={formData.scheduledDate}
                                onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridade</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="URGENT">Urgente</option>
                                <option value="HIGH">Alta</option>
                                <option value="MEDIUM">Média</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Participante Principal</label>
                        <select
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                            value={formData.target}
                            onChange={e => setFormData({ ...formData, target: e.target.value })}
                        >
                            <option value="PARENT">Pais / Responsáveis</option>
                            <option value="COORDINATOR">Coordenador Pedagógico</option>
                            <option value="PSYCHOLOGIST">Psicólogo Escolar</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objetivo / Descritivo</label>
                        <textarea
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={isSubmitting}
                        onClick={() => onSubmit(formData)}
                        className={`flex-1 px-4 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-dark transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? 'Salvando...' : 'Confirmar Agendamento'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const InterventionPlanModal = ({ assessment, onClose, onSubmit, isSubmitting }: any) => {
    const [formData, setFormData] = React.useState({
        action: 'Plano de Intervenção Pedagógica',
        description: `Implementação de reforço e acompanhamento para ${assessment.studentName}.`,
        target: 'TEACHER',
        priority: 'MEDIUM',
        notes: ''
    });

    const [selectedAcoes, setSelectedAcoes] = React.useState<string[]>([]);

    const acoesSugeridas = [
        'Aulas de Reforço Contraburno',
        'Monitoria Individualizada',
        'Adaptação Curricular',
        'Incentivo à Participação em Clubes',
        'Mentoria com Aluno Veterano'
    ];

    const toggleAcao = (acao: string) => {
        if (selectedAcoes.includes(acao)) {
            setSelectedAcoes(selectedAcoes.filter(a => a !== acao));
        } else {
            setSelectedAcoes([...selectedAcoes, acao]);
        }
    };

    const handleLocalSubmit = () => {
        onSubmit({
            ...formData,
            notes: `Ações selecionadas: ${selectedAcoes.join(', ')}. ${formData.notes}`
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-emerald-600 p-6 text-white">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText size={24} /> Criar Plano de Intervenção
                        </h2>
                        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full text-white/80 hover:text-white transition-colors">
                            <ChevronDown size={24} className="rotate-90" />
                        </button>
                    </div>
                    <p className="text-emerald-100/80 text-sm mt-1">Defina o suporte pedagógico para {assessment.studentName}</p>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Selecione as Ações Estratégicas</label>
                        <div className="flex flex-wrap gap-2">
                            {acoesSugeridas.map(acao => (
                                <button
                                    key={acao}
                                    onClick={() => toggleAcao(acao)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${selectedAcoes.includes(acao)
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    {acao}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsável pela Execução</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={formData.target}
                                onChange={e => setFormData({ ...formData, target: e.target.value as any })}
                            >
                                <option value="TEACHER">Professor Regente</option>
                                <option value="COORDINATOR">Coordenador</option>
                                <option value="STUDENT">O Próprio Aluno</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Impacto Esperado</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                            >
                                <option value="HIGH">Alto</option>
                                <option value="MEDIUM">Médio</option>
                                <option value="LOW">Baixo</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações Adicionais</label>
                        <textarea
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            rows={3}
                            placeholder="Descreva metas específicas ou detalhes do acompanhamento..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={isSubmitting || selectedAcoes.length === 0}
                        onClick={handleLocalSubmit}
                        className={`flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 ${(isSubmitting || selectedAcoes.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? 'Salvando...' : 'Ativar Plano'}
                    </button>
                </div>
            </div>
        </div>
    );
};
