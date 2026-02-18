import React, { useState } from 'react';
import { Users, Brain, ShieldAlert, Clock, MousePointer2, PenTool, Star, Target, ChevronDown, ChevronUp, Search, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { AnalyticsService } from '../../../services/analyticsService';
import { translateBehaviorCluster, translateSecurityFlag } from '../../../utils/translations';

const DistributionChart = ({ grades }: { grades: number[] }) => {
    const buckets = [0, 0, 0, 0, 0]; // 0-2, 2-4, 4-6, 6-8, 8-10
    grades.forEach(g => {
        const idx = Math.min(4, Math.floor(g / 2));
        buckets[idx]++;
    });
    const maxVal = Math.max(...buckets, 1);

    return (
        <div className="h-40 flex items-end justify-between gap-2 w-full">
            {buckets.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full flex items-end justify-center h-full">
                        <div
                            className={`w-full rounded-t-md transition-all duration-500 ${i < 2 ? 'bg-rose-400' : i === 2 ? 'bg-amber-400' : 'bg-emerald-400'} group-hover:opacity-80`}
                            style={{ height: `${(count / maxVal) * 100}%` }}
                        >
                            {count > 0 && <span className="block text-center text-[10px] font-bold text-white mt-1">{count}</span>}
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-medium">{i * 2}-{(i + 1) * 2}</span>
                </div>
            ))}
        </div>
    );
};

export const ProfessorPerformanceTab = () => {
    const state = useAppStore();
    const { currentUser } = state;
    const analytics = new AnalyticsService(state);

    // Ensure we have access and data (unificado com a lógica do dashboard)
    const professorClasses = state.classes.filter(c =>
        c.teacherId === currentUser?.id || currentUser?.classIds?.includes(c.id)
    );

    const [selectedClassId, setSelectedClassId] = useState<string>(professorClasses[0]?.id || '');
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [showIntegrityFilter, setShowIntegrityFilter] = useState(false);

    // Initial selection if empty and classes exist
    if (professorClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(professorClasses[0].id);
    }

    const selectedClass = state.classes.find(c => c.id === selectedClassId);
    const classStudents = state.students.filter(s => s.classId === selectedClassId);

    // Process Stats for Class
    const studentStats = classStudents.map(s => {
        const results = state.results
            .filter(r => r.studentId === s.id)
            .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

        const totalViolations = results.reduce((acc, r) => acc + (r.violationCount || 0), 0);
        const lastExamFlags = results.length > 0 ? results[0].securityFlags : [];

        // Cluster Identification Logic (Mock for Demo)
        let behaviorCluster = 'NORMAL';
        const grade = analytics.getStudentStats(s.id)?.idgScore || 0;
        if (grade > 8) behaviorCluster = 'RAPID_PREC';
        else if (grade > 6) behaviorCluster = 'SLOW_PREC';
        else if (grade > 4) behaviorCluster = 'SLOW_ERR';
        else behaviorCluster = 'RAPID_ERR';

        return {
            ...s,
            stats: analytics.getStudentStats(s.id),
            violations: totalViolations,
            lastFlags: lastExamFlags,
            behaviorCluster
        };
    }).sort((a, b) => (b.stats?.idgScore || 0) - (a.stats?.idgScore || 0));

    // Filter Logic
    const filteredStudents = showIntegrityFilter
        ? studentStats.filter(s => s.violations > 0)
        : studentStats;

    const classAverage = studentStats.reduce((acc, s) => acc + (s.stats?.idgScore || 0), 0) / (studentStats.length || 1);
    const gradesList = studentStats.map(s => s.stats?.idgScore || 0);
    const cheatingAttempts = studentStats.reduce((acc, s) => acc + s.violations, 0);
    const studentsWithFlags = studentStats.filter(s => s.violations > 0).length;

    const getAiSuggestion = (studentName: string, weakSubject: string) => {
        return `Sugerir revisão do capítulo 4 de ${weakSubject}. O aluno apresenta dificuldade em conceitos base.`;
    };

    // Cluster Stats
    const clusterCounts = {
        RAPID_PREC: studentStats.filter(s => s.behaviorCluster === 'RAPID_PREC').length,
        SLOW_PREC: studentStats.filter(s => s.behaviorCluster === 'SLOW_PREC').length,
        SLOW_ERR: studentStats.filter(s => s.behaviorCluster === 'SLOW_ERR').length,
        RAPID_ERR: studentStats.filter(s => s.behaviorCluster === 'RAPID_ERR').length
    };

    const avgFrequency = 92.4; // Mock for now
    const neuroAlerts = studentStats.filter(s => (s.stats?.riskLevel || 'LOW') === 'HIGH').length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Left Column: Class Selection & Overview */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Selecione a Turma</label>
                    <select
                        className="w-full border border-slate-300 rounded-lg p-3 font-medium text-slate-700 mb-6 focus:ring-2 focus:ring-brand-primary outline-none"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                        {professorClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.series}</option>)}
                    </select>

                    {selectedClass && (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800">IDG Médio (Turma)</h3>
                                <span className={`text-xl font-black ${classAverage >= 6 ? 'text-emerald-600' : 'text-amber-500'}`}>{classAverage.toFixed(1)}</span>
                            </div>

                            <div className="mb-6">
                                <div className="text-xs text-slate-400 mb-2 text-center">Distribuição de Notas (0-10)</div>
                                <DistributionChart grades={gradesList} />
                            </div>

                            {/* CLUSTERIZATION PANEL */}
                            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><Brain size={14} /> Clusters Comportamentais</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-emerald-700 font-bold">{translateBehaviorCluster('RAPID_PREC')}</span>
                                        <span className="bg-emerald-100 px-2 py-0.5 rounded">{clusterCounts.RAPID_PREC}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-blue-700 font-bold">{translateBehaviorCluster('SLOW_PREC')}</span>
                                        <span className="bg-blue-100 px-2 py-0.5 rounded">{clusterCounts.SLOW_PREC}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-amber-700 font-bold">{translateBehaviorCluster('SLOW_ERR')}</span>
                                        <span className="bg-amber-100 px-2 py-0.5 rounded">{clusterCounts.SLOW_ERR}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-rose-700 font-bold">{translateBehaviorCluster('RAPID_ERR')}</span>
                                        <span className="bg-rose-100 px-2 py-0.5 rounded">{clusterCounts.RAPID_ERR}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                                    <div className="text-2xl font-bold text-slate-800">{avgFrequency}%</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Frequência Média</div>
                                </div>
                                <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-center">
                                    <div className="text-2xl font-bold text-rose-600">{neuroAlerts}</div>
                                    <div className="text-[10px] text-rose-600 uppercase">Alertas Neuro</div>
                                </div>
                            </div>

                            {/* Integrity Alert Card */}
                            {cheatingAttempts > 0 && (
                                <div
                                    onClick={() => setShowIntegrityFilter(!showIntegrityFilter)}
                                    className={`mt-4 p-4 rounded-xl border cursor-pointer transition ${showIntegrityFilter ? 'bg-rose-100 border-rose-300 shadow-inner' : 'bg-rose-50 border-rose-200 hover:bg-rose-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-200 rounded-full text-rose-700 animate-pulse">
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-rose-800 text-sm">Monitoramento de Fraude</div>
                                            <div className="text-xs text-rose-600">
                                                <strong>{studentsWithFlags} alunos</strong> geraram {cheatingAttempts} alertas de segurança.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                                        {showIntegrityFilter ? 'Mostrar Todos' : 'Filtrar Incidentes'}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* AI Insight for Class */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold flex items-center gap-2 mb-2"><Brain size={20} className="text-yellow-300" /> Insight da IA</h3>
                        <p className="text-sm text-indigo-100 leading-relaxed">
                            A turma <strong>{selectedClass?.name}</strong> teve uma queda de 15% em interpretação de texto na última semana. Sugiro focar em exercícios de leitura ativa.
                        </p>
                        <button className="mt-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-2">
                            Ver Plano de Aula Sugerido <ArrowRight size={14} />
                        </button>
                    </div>
                    <Brain size={100} className="absolute -right-4 -bottom-4 opacity-10 text-white" />
                </div>
            </div>

            {/* Right Column: Students List & Detail */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px]">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={20} className="text-brand-secondary" /> Desempenho Individual (IDG)
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input placeholder="Buscar aluno..." className="pl-9 pr-4 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    {filteredStudents.length === 0 && (
                        <div className="text-center py-12 text-slate-400">Nenhum aluno encontrado com os filtros atuais.</div>
                    )}
                    {filteredStudents.map((student, idx) => (
                        <div key={student.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition hover:shadow-md ${student.violations > 0 ? 'border-rose-200' : 'border-slate-200'}`}>
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${idx < 3 && !showIntegrityFilter ? 'bg-yellow-500' : 'bg-slate-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            {student.name}
                                            {student.violations > 0 && (
                                                <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 border border-rose-200" title="Violações de segurança detectadas">
                                                    <ShieldAlert size={10} /> {student.violations}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 flex gap-2">
                                            <span>Mat: {student.registrationNumber}</span>
                                            <span className="text-slate-300">|</span>
                                            <span className={`font-bold ${student.behaviorCluster.includes('ERR') ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                Cluster: {translateBehaviorCluster(student.behaviorCluster)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-xs font-bold text-slate-700">95%</div>
                                            <div className="text-[8px] text-slate-400 uppercase leading-none">Freq</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-black text-lg ${student.stats?.idgScore && student.stats.idgScore >= 6 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {student.stats?.idgScore.toFixed(1)}
                                            </div>
                                            <div className="text-[10px] text-slate-400 uppercase">IDG</div>
                                        </div>
                                    </div>
                                    {expandedStudentId === student.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </div>
                            </div>

                            {/* Expanded Detail */}
                            {expandedStudentId === student.id && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4 animate-in slide-in-from-top-2">

                                    {/* Integrity Report Panel (Only if violations exist) */}
                                    {student.violations > 0 && (
                                        <div className="mb-4 bg-rose-50 border border-rose-100 rounded-lg p-3 flex gap-3 items-start">
                                            <ShieldAlert size={18} className="text-rose-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="text-sm font-bold text-rose-800">Alerta de Integridade da Prova</div>
                                                <p className="text-xs text-rose-600 mt-1">
                                                    O sistema detectou {student.violations} eventos suspeitos durante a última avaliação.
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    {student.lastFlags?.includes('FOCUS_LOST') && <span className="text-[10px] bg-white border border-rose-200 px-2 py-1 rounded text-rose-600 font-bold">{translateSecurityFlag('FOCUS_LOST')}</span>}
                                                    {student.lastFlags?.includes('ALT_TAB') && <span className="text-[10px] bg-white border border-rose-200 px-2 py-1 rounded text-rose-600 font-bold">{translateSecurityFlag('ALT_TAB')}</span>}
                                                    {student.lastFlags?.includes('FULLSCREEN_EXIT') && <span className="text-[10px] bg-white border border-rose-200 px-2 py-1 rounded text-rose-600 font-bold">{translateSecurityFlag('FULLSCREEN_EXIT')}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Telemetry Data */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="p-2 bg-white border rounded text-center">
                                            <div className="text-[10px] text-slate-400 uppercase flex justify-center gap-1"><Clock size={10} /> Tempo Médio</div>
                                            <div className="font-bold text-slate-800">3m 12s</div>
                                        </div>
                                        <div className="p-2 bg-white border rounded text-center">
                                            <div className="text-[10px] text-slate-400 uppercase flex justify-center gap-1"><MousePointer2 size={10} /> Trocas Resp.</div>
                                            <div className="font-bold text-slate-800">2.1</div>
                                        </div>
                                        <div className="p-2 bg-white border rounded text-center">
                                            <div className="text-[10px] text-slate-400 uppercase flex justify-center gap-1"><PenTool size={10} /> Rascunho</div>
                                            <div className="font-bold text-emerald-600">Usado</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Ponto Forte</div>
                                            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                                                <Star size={14} /> {student.stats?.strongestSubject}
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Ponto de Atenção</div>
                                            <div className="text-sm font-bold text-rose-600 flex items-center gap-1">
                                                <Target size={14} /> {student.stats?.weakestSubject}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-brand-light/30 border border-brand-primary/20 rounded-lg p-4">
                                        <h4 className="text-sm font-bold text-brand-dark flex items-center gap-2 mb-2">
                                            <Brain size={16} className="text-brand-primary" /> Sugestão da IA para Recuperação
                                        </h4>
                                        <p className="text-sm text-slate-700 mb-3 leading-relaxed">
                                            {getAiSuggestion(student.name, student.stats?.weakestSubject || 'Geral')}
                                        </p>
                                        <div className="flex gap-2">
                                            <button className="text-xs bg-white border border-brand-primary text-brand-primary px-3 py-1.5 rounded font-bold hover:bg-brand-primary hover:text-white transition">
                                                Gerar Tarefa Personalizada
                                            </button>
                                            <button className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1.5 rounded font-bold hover:bg-slate-100 transition">
                                                Enviar Mensagem aos Pais
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
