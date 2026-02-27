import React, { useState } from 'react';
import {
    FileText,
    Download,
    Filter,
    Printer,
    Calendar,
    Users,
    BookOpen,
    BarChart2,
    CheckCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { reportService } from '../../services/reportService';
import * as reportExporter from '../../services/reportExporter';
import { ReportType, ReportFilter, StudentReportData, ClassReportData } from '../../types';

export const ReportGeneratorView: React.FC = () => {
    const { schools, classes, exams } = useAppStore();
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [filters, setFilters] = useState<ReportFilter>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);

    const reportTypes = [
        {
            id: 'CLASS_REPORT',
            title: 'Relatório de Turma',
            description: 'Lista de alunos, frequência e médias gerais.',
            icon: Users,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            id: 'EXAM_ANALYSIS',
            title: 'Análise de Prova',
            description: 'Estatísticas detalhadas por questão e descritor.',
            icon: BarChart2,
            color: 'bg-emerald-100 text-emerald-600'
        },
        {
            id: 'STUDENT_BULLETIN',
            title: 'Boletim Individual',
            description: 'Desempenho detalhado do aluno em todas as provas.',
            icon: BookOpen,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            id: 'AUDIT_LOG',
            title: 'Logs de Auditoria',
            description: 'Registro de ações e segurança do sistema.',
            icon: FileText,
            color: 'bg-amber-100 text-amber-600'
        }
    ];

    const handleGenerate = async (format: 'PDF' | 'EXCEL') => {
        if (!selectedReport) return;

        setIsGenerating(true);
        try {
            // Em uma implementação real, chamaria o service
            // await reportService.generateReport(selectedReport, filters, format);

            // Simulação
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (format === 'PDF') {
                const columns = ['Nome', 'Turma', 'Nota', 'Frequência']; // Mock columns

                // Find school name if filtered
                const schoolName = filters.schoolId
                    ? schools.find(s => s.id === filters.schoolId)?.name
                    : 'Rede Municipal de Ensino';

                // We need to fetch the actual data object for the report
                // This is a simplified integration for the demo
                const reportData = selectedReportId === 'STUDENT_BULLETIN'
                    ? await reportService.getStudentData(filters)
                    : await reportService.getClassData(filters);

                const reportDoc = selectedReportId === 'STUDENT_BULLETIN'
                    ? await reportExporter.generateStudentReportPDF(reportData as StudentReportData, {
                        type: 'student',
                        format: 'pdf',
                        includeCharts: true,
                        targetIds: [filters.studentId || ''],
                        dateRange: { start: filters.startDate, end: filters.endDate },
                        includeRecommendations: true
                    })
                    : await reportExporter.generateClassReportPDF(reportData as ClassReportData, {
                        type: 'class',
                        format: 'pdf',
                        includeCharts: true,
                        targetIds: [filters.classId || ''],
                        dateRange: { start: filters.startDate, end: filters.endDate },
                        includeRecommendations: true
                    });

                reportExporter.downloadPDF(reportDoc, `relatorio_${selectedReportId}.pdf`);
            } else {
                reportService.exportToCSV(`relatorio_${selectedReport}`, previewData);
            }

        } catch (error) {
            console.error('Erro ao gerar relatório', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Mock data for preview
    const selectedReportId = selectedReport as string;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Printer className="text-brand-primary" /> Gerador de Relatórios
            </h1>
            <p className="text-slate-500 mb-8">Exporte dados pedagógicos e administrativos em PDF ou Excel.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Seleção de Relatório */}
                <div className="col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">1. Escolha o Modelo</h3>
                    <div className="space-y-3">
                        {reportTypes.map((report) => (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReport(report.id as any)}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${selectedReport === report.id
                                    ? 'border-brand-primary bg-brand-light ring-1 ring-brand-primary'
                                    : 'border-slate-200 hover:border-brand-primary hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${report.color}`}>
                                    <report.icon size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">{report.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">{report.description}</div>
                                </div>
                                {selectedReport === report.id && (
                                    <CheckCircle size={18} className="ml-auto text-brand-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Filtros */}
                <div className="col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">2. Configure os Filtros</h3>

                    {!selectedReport ? (
                        <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center text-slate-400 bg-slate-50">
                            Selecione um modelo à esquerda para ver os filtros disponíveis.
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Escola</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                    value={filters.schoolId || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, schoolId: e.target.value }))}
                                >
                                    <option value="">Todas as Escolas</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {(selectedReport === 'CLASS_REPORT' || selectedReport === 'STUDENT_BULLETIN') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Turma</label>
                                    <select
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                        value={filters.classId || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, classId: e.target.value }))}
                                    >
                                        <option value="">Selecione uma turma...</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {(selectedReport === 'EXAM_ANALYSIS' || selectedReport === 'STUDENT_BULLETIN') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prova / Avaliação</label>
                                    <select
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                        value={filters.examId || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, examId: e.target.value }))}
                                    >
                                        <option value="">Todas as Avaliações</option>
                                        {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                        value={filters.startDate || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    />
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                        value={filters.endDate || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Ações */}
                <div className="col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">3. Exportar</h3>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                        <div className="mb-6">
                            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                                <FileText size={32} className="text-slate-400" />
                            </div>
                            <h4 className="font-bold text-slate-800">Pronto para gerar?</h4>
                            <p className="text-sm text-slate-500 mt-1">
                                {selectedReport
                                    ? `Modelo "${reportTypes.find(r => r.id === selectedReport)?.title}" selecionado.`
                                    : 'Aguardando seleção de modelo...'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                disabled={!selectedReport || isGenerating}
                                onClick={() => handleGenerate('PDF')}
                                className="w-full py-3 bg-brand-primary text-white rounded-lg font-bold shadow-sm hover:bg-brand-secondary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isGenerating ? 'Gerando...' : <><Download size={18} /> Baixar PDF</>}
                            </button>

                            <button
                                disabled={!selectedReport || isGenerating}
                                onClick={() => handleGenerate('EXCEL')}
                                className="w-full py-3 bg-white text-slate-700 border border-slate-300 rounded-lg font-bold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <FileText size={18} /> Exportar Excel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
