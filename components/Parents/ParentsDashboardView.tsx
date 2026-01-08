import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChevronDown, TrendingUp, BookOpen, Award, Calendar, User, FileText, BarChart3, Clock } from 'lucide-react';
import { calculateRiskScore } from '../../services/riskDetectionEngine';
import { RiskLevel } from '../../types';
import { NotificationBell } from '../Notifications/NotificationBell';

export const ParentsDashboardView = () => {
    const { currentUser, students, results, exams, selectedChildId, setSelectedChildId } = useAppStore();

    // Get children
    const myChildren = currentUser?.childrenIds
        ? students.filter(s => currentUser.childrenIds?.includes(s.id))
        : [];

    // Initialize selectedChildId if not set
    React.useEffect(() => {
        if (myChildren.length > 0 && !selectedChildId) {
            setSelectedChildId(myChildren[0].id);
        }
    }, [myChildren, selectedChildId, setSelectedChildId]);

    const selectedChild = myChildren.find(c => c.id === selectedChildId);

    // Get Data
    const childResults = selectedChild ? results.filter(r => r.studentId === selectedChild.id) : [];
    const childExams = selectedChild ? exams.filter(e => e.classIds?.includes(selectedChild.classId || '')) : [];

    // --- INTELLIGENCE ENGINE ---
    // Calculates risk in real-time based on current data
    const riskAssessment = selectedChild
        ? calculateRiskScore(selectedChild, childResults)
        : null;

    // Use simulated attendance from Risk Engine (replacing hardcoded 95%)
    const attendancePercentage = riskAssessment?.simulatedAttendance || 0;
    const averageScore = childResults.length > 0
        ? (childResults.reduce((sum, r) => sum + (r.totalScore || 0), 0) / childResults.length).toFixed(1)
        : '0.0';

    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-brand-dark">Portal dos Pais e Responsáveis</h1>
                        <p className="text-slate-600 mt-1">Acompanhamento em Tempo Real</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">{currentUser?.name}</p>
                            <p className="text-xs text-slate-500">Responsável</p>
                        </div>
                        <NotificationBell />
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {currentUser?.name?.charAt(0) || 'P'}
                        </div>
                    </div>
                </div>
            </div>

            {myChildren.length > 0 ? (
                <>
                    {/* Child Selector */}
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-3">Selecione o filho(a):</label>
                        <div className="relative">
                            <select
                                value={selectedChild?.id || ''}
                                onChange={(e) => setSelectedChildId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg font-medium text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                            >
                                {myChildren.map(child => (
                                    <option key={child.id} value={child.id}>{child.name} - {child.registrationNumber}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                        </div>
                    </div>

                    {selectedChild && riskAssessment && (
                        <>
                            {/* --- RISK ALERT SECTION (NEW) --- */}
                            {(riskAssessment.riskLevel === RiskLevel.HIGH || riskAssessment.riskLevel === RiskLevel.MEDIUM) && (
                                <div className={`rounded-xl p-6 shadow-lg border ${riskAssessment.riskLevel === RiskLevel.HIGH
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-yellow-50 border-yellow-200'
                                    }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${riskAssessment.riskLevel === RiskLevel.HIGH ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            <TrendingUp size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className={`text-xl font-bold mb-1 ${riskAssessment.riskLevel === RiskLevel.HIGH ? 'text-red-800' : 'text-yellow-800'
                                                }`}>
                                                {riskAssessment.riskLevel === RiskLevel.HIGH ? '⚠️ Alerta de Risco Acadêmico' : '⚠️ Atenção Necessária'}
                                            </h2>
                                            <p className="text-slate-700 mb-4">
                                                Detectamos padrões que indicam risco de evasão ou queda de desempenho.
                                            </p>

                                            <div className="space-y-2 mb-4">
                                                {riskAssessment.factors.map((factor, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm font-medium text-slate-800 bg-white/50 p-2 rounded">
                                                        <span>🚨</span>
                                                        <span>{factor.name}: <strong>{factor.value}</strong></span>
                                                        <span className="text-slate-500">- {factor.message}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {riskAssessment.riskLevel === RiskLevel.HIGH && (
                                                <button
                                                    onClick={() => alert("Solicitação enviada para a coordenação! Entraremos em contato em breve.")}
                                                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition shadow-md"
                                                >
                                                    📞 Solicitar Reunião com Coordenação
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <MetricCard
                                    icon={<TrendingUp size={24} />}
                                    color="emerald"
                                    value={averageScore}
                                    label="Média Geral"
                                />
                                <MetricCard
                                    icon={<BookOpen size={24} />}
                                    color="blue"
                                    value={childResults.length.toString()}
                                    label="Provas Realizadas"
                                />
                                <MetricCard
                                    icon={<Award size={24} />}
                                    color={attendancePercentage < 75 ? 'red' : 'purple'}
                                    value={`${attendancePercentage}%`}
                                    label="Frequência Escolar"
                                />
                                <MetricCard
                                    icon={<Calendar size={24} />}
                                    color="orange"
                                    value={childExams.length.toString()}
                                    label="Próximas Provas"
                                />
                            </div>

                            {/* ... (Rest of existing UI: Results & Exams) ... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Desempenho Recente */}
                                <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                                    <h2 className="text-xl font-black text-brand-dark flex items-center gap-2 mb-4">
                                        <TrendingUp size={24} className="text-emerald-500" />
                                        Histórico de Notas
                                    </h2>
                                    <div className="space-y-3">
                                        {childResults.length > 0 ? (
                                            childResults.slice(0, 5).map(result => {
                                                const exam = exams.find(e => e.id === result.examId);
                                                const score = result.totalScore || 0;
                                                return (
                                                    <div key={result.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-brand-dark">{exam?.title}</p>
                                                            <p className="text-sm text-slate-600">{exam?.subject}</p>
                                                        </div>
                                                        <span className={`text-xl font-black ${score < 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                            {score.toFixed(1)}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : <p className="text-slate-500 text-center py-4">Sem notas lançadas.</p>}
                                    </div>
                                </div>

                                {/* Próximas Provas */}
                                <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                                    <h2 className="text-xl font-black text-brand-dark flex items-center gap-2 mb-4">
                                        <Calendar size={24} className="text-orange-500" />
                                        Agenda de Provas
                                    </h2>
                                    <div className="space-y-3">
                                        {childExams.length > 0 ? (
                                            childExams.slice(0, 5).map(exam => (
                                                <div key={exam.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                                                    <div>
                                                        <p className="font-bold text-brand-dark">{exam.title}</p>
                                                        <p className="text-sm text-slate-600">{exam.subject}</p>
                                                    </div>
                                                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full h-fit">Agendada</span>
                                                </div>
                                            ))
                                        ) : <p className="text-slate-500 text-center py-4">Nenhuma prova agendada.</p>}
                                    </div>
                                </div>
                            </div>

                        </>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                    <User size={64} className="mx-auto text-slate-300 mb-4" />
                    <h2 className="text-2xl font-black text-brand-dark">Nenhum filho vinculado</h2>
                    <p className="text-slate-600">Entre em contato com a secretaria.</p>
                </div>
            )}
        </div>
    );
};

// Helper Component for Metrics
const MetricCard = ({ icon, color, value, label }: any) => {
    const colorClasses = {
        emerald: 'bg-emerald-100 text-emerald-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
        red: 'bg-red-100 text-red-600'
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-black text-brand-dark">{value}</p>
                <p className="text-xs text-slate-500 font-bold uppercase">{label}</p>
            </div>
        </div>
    );
};

