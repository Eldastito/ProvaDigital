import React, { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, AlertTriangle, FileText, Database,
    Download, RefreshCw, CheckCircle2, Server
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { reportingService } from '../../services/reportingService';
import { dataLakeService, DataLakeJob } from '../../services/dataLakeService';
import { predictiveService } from '../../services/predictiveService';

export const PredictiveDashboardView = () => {
    const { students, auditLogs, schools } = useAppStore();
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [lastJob, setLastJob] = useState<DataLakeJob | null>(null);
    const [riskData, setRiskData] = useState<any[]>([]);

    useEffect(() => {
        // Calculate risks on mount
        const risks = predictiveService.analyzeDropoutRisk(students, auditLogs);
        setRiskData(risks.slice(0, 5)); // Top 5 risky students
    }, [students, auditLogs]);

    const handleDownloadReport = async (type: 'pdf' | 'excel') => {
        setIsGeneratingReport(true);
        try {
            const reportData = schools.map(s => ({
                schoolName: s.name,
                cityName: s.city,
                studentsCount: students.filter(st => st.schoolId === s.id).length,
                averageScore: 7.5, // Mock average
                riskLevel: 'Médio'
            }));

            let blob;
            if (type === 'pdf') {
                blob = await reportingService.generateNetworkReport(reportData);
            } else {
                blob = await reportingService.generateExcelExport(reportData);
            }

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_rede_${Date.now()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Report generation failed', error);
            alert('Erro ao gerar relatório');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleDataLakeExtraction = async () => {
        if (!window.confirm('Iniciar extração massiva (Full Dump) para o Data Lake? Isso pode consumir recursos.')) return;

        setIsExtracting(true);
        try {
            const job = await dataLakeService.startFullExtraction();
            setLastJob(job);
            if (job.status === 'completed') {
                alert(`Extração concluída! ${job.recordCount} registros enviados.`);
            } else {
                alert('Falha na extração. Verifique os logs.');
            }
        } catch (error) {
            console.error('Extraction failed', error);
            alert('Erro crítico na extração.');
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-brand-primary" />
                        Analytics Avançado & Data Lake
                    </h1>
                    <p className="text-slate-500">Inteligência Preditiva e Interoperabilidade Governamental</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleDownloadReport('excel')}
                        disabled={isGeneratingReport}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                    >
                        <FileText size={16} className="text-emerald-600" />
                        Exportar Excel
                    </button>
                    <button
                        onClick={() => handleDownloadReport('pdf')}
                        disabled={isGeneratingReport}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 flex items-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                    >
                        <Download size={16} />
                        Relatório PDF
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">+2.4%</span>
                    </div>
                    <h3 className="mt-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Risco de Evasão (Rede)</h3>
                    <p className="text-3xl font-black text-slate-800">4.2%</p>
                    <p className="text-xs text-slate-500 mt-1">128 alunos em zona crítica</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <BarChart3 size={24} />
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">+15 pts</span>
                    </div>
                    <h3 className="mt-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Projeção SAEB (Matemática)</h3>
                    <p className="text-3xl font-black text-slate-800">286</p>
                    <p className="text-xs text-slate-500 mt-1">Tendência de alta confirmada</p>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-900/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-32 bg-brand-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="p-3 bg-white/10 text-white rounded-xl">
                            <Server size={24} />
                        </div>
                        <div className={`w-3 h-3 rounded-full ${isExtracting ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                    </div>
                    <h3 className="mt-4 text-white/50 text-xs font-bold uppercase tracking-wider relative z-10">Data Lake Connector</h3>
                    <p className="text-2xl font-black text-white mt-1 relative z-10">
                        {lastJob ? 'Sincronizado' : 'Aguardando'}
                    </p>

                    <button
                        onClick={handleDataLakeExtraction}
                        disabled={isExtracting}
                        className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition relative z-10 disabled:opacity-50"
                    >
                        {isExtracting ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                        {isExtracting ? 'Extraindo...' : 'Executar Full Dump'}
                    </button>
                    {lastJob && (
                        <p className="text-[10px] text-white/40 mt-2 text-center relative z-10">
                            Último job: {new Date(lastJob.startedAt).toLocaleTimeString()} • {lastJob.recordCount} regs
                        </p>
                    )}
                </div>
            </div>

            {/* Risk Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Alunos em Risco Crítico (Top 5)</h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Aluno</th>
                            <th className="px-6 py-3">Score de Risco</th>
                            <th className="px-6 py-3">Fatores Principais</th>
                            <th className="px-6 py-3">Previsão IA</th>
                            <th className="px-6 py-3">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {riskData.map(risk => (
                            <tr key={risk.studentId} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4 font-bold text-slate-700">{risk.studentName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${risk.riskScore > 70 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {risk.riskScore}/100
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {risk.riskFactors.join(', ')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                                        {risk.predictedOutcome === 'dropout' ? 'Evasão Iminente' : 'Retenção'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-brand-primary font-bold text-xs hover:underline">
                                        Criar Intervenção
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
