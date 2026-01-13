import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    StudentReportData,
    ClassReportData,
    ReportConfig,
    PerformanceDataPoint,
    SubjectPerformance,
    BNCCCompetency
} from '../types';

/**
 * Report Exporter - Phase 11
 * Handles PDF and Excel export functionality for analytics reports
 */

// ============================================
// PDF Generation
// ============================================

export const generateStudentReportPDF = (data: StudentReportData, config: ReportConfig): jsPDF => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(config.customTitle || 'Relatório Individual de Desempenho', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Aluno: ${data.student.name}`, 14, 35);
    doc.text(`Período: ${new Date(config.dateRange.start).toLocaleDateString()} - ${new Date(config.dateRange.end).toLocaleDateString()}`, 14, 42);

    // Overall Metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Métricas Gerais', 14, 55);

    const metricsData = [
        ['Métrica', 'Valor'],
        ['Média Geral', `${data.overallMetrics.averageScore.toFixed(1)}%`],
        ['Mediana', `${data.overallMetrics.medianScore.toFixed(1)}%`],
        ['Taxa de Conclusão', `${data.overallMetrics.completionRate.toFixed(1)}%`],
        ['Taxa de Aprovação', `${data.overallMetrics.passRate.toFixed(1)}%`]
    ];

    autoTable(doc, {
        startY: 60,
        head: [metricsData[0]],
        body: metricsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
    });

    // Subject Performance
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Desempenho por Matéria', 14, finalY + 10);

    const subjectData = [
        ['Matéria', 'Média', 'Questões', 'Tendência'],
        ...data.subjectPerformance.map(sp => [
            sp.subject,
            `${sp.averageScore.toFixed(1)}%`,
            sp.questionsCount.toString(),
            sp.trend === 'improving' ? '↑' : sp.trend === 'declining' ? '↓' : '→'
        ])
    ];

    autoTable(doc, {
        startY: finalY + 15,
        head: [subjectData[0]],
        body: subjectData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
    });

    // BNCC Competencies
    if (data.bnccCompetencies.length > 0) {
        const bnccFinalY = (doc as any).lastAutoTable.finalY || 150;

        // Check if we need a new page
        if (bnccFinalY > 240) {
            doc.addPage();
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Competências BNCC', 14, 20);

            const bnccData = [
                ['Código BNCC', 'Média', 'Nível'],
                ...data.bnccCompetencies.slice(0, 10).map(bc => [
                    bc.code,
                    `${bc.averageScore.toFixed(1)}%`,
                    bc.masteryLevel === 'high' ? 'Alto' : bc.masteryLevel === 'medium' ? 'Médio' : 'Baixo'
                ])
            ];

            autoTable(doc, {
                startY: 25,
                head: [bnccData[0]],
                body: bnccData.slice(1),
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] }
            });
        } else {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Competências BNCC', 14, bnccFinalY + 10);

            const bnccData = [
                ['Código BNCC', 'Média', 'Nível'],
                ...data.bnccCompetencies.slice(0, 10).map(bc => [
                    bc.code,
                    `${bc.averageScore.toFixed(1)}%`,
                    bc.masteryLevel === 'high' ? 'Alto' : bc.masteryLevel === 'medium' ? 'Médio' : 'Baixo'
                ])
            ];

            autoTable(doc, {
                startY: bnccFinalY + 15,
                head: [bnccData[0]],
                body: bnccData.slice(1),
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] }
            });
        }
    }

    // Recommendations
    if (config.includeRecommendations && data.recommendations.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Recomendações Pedagógicas', 14, 20);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        let yPos = 30;

        data.recommendations.forEach((rec, idx) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(`${idx + 1}. ${rec}`, 14, yPos, { maxWidth: pageWidth - 28 });
            yPos += 10;
        });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString()}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    return doc;
};

export const generateClassReportPDF = (data: ClassReportData, config: ReportConfig): jsPDF => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Desempenho da Turma', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Turma: ${data.class.name}`, 14, 35);
    doc.text(`Período: ${new Date(config.dateRange.start).toLocaleDateString()} - ${new Date(config.dateRange.end).toLocaleDateString()}`, 14, 42);

    // Overall Metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Métricas Gerais', 14, 55);

    const metricsData = [
        ['Métrica', 'Valor'],
        ['Média da Turma', `${data.overallMetrics.averageScore.toFixed(1)}%`],
        ['Mediana', `${data.overallMetrics.medianScore.toFixed(1)}%`],
        ['Desvio Padrão', `${data.overallMetrics.standardDeviation.toFixed(1)}`],
        ['Total de Alunos', data.overallMetrics.totalStudents.toString()],
        ['Taxa de Aprovação', `${data.overallMetrics.passRate.toFixed(1)}%`]
    ];

    autoTable(doc, {
        startY: 60,
        head: [metricsData[0]],
        body: metricsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
    });

    // Top Performers
    const finalY = (doc as any).lastAutoTable.finalY || 110;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Melhores Desempenhos', 14, finalY + 10);

    const topPerformersData = [
        ['Aluno', 'Média'],
        ...data.topPerformers.slice(0, 5).map(tp => [tp.name, `${tp.score.toFixed(1)}%`])
    ];

    autoTable(doc, {
        startY: finalY + 15,
        head: [topPerformersData[0]],
        body: topPerformersData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] }
    });

    // At-Risk Students
    if (data.atRiskStudents.length > 0) {
        const riskFinalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Alunos em Risco', 14, riskFinalY + 10);

        const riskData = [
            ['Aluno', 'Nível de Risco'],
            ...data.atRiskStudents.map(ar => [
                ar.name,
                ar.riskLevel === 'HIGH' ? 'Alto' : ar.riskLevel === 'MEDIUM' ? 'Médio' : 'Baixo'
            ])
        ];

        autoTable(doc, {
            startY: riskFinalY + 15,
            head: [riskData[0]],
            body: riskData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] }
        });
    }

    // Subject Breakdown
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Desempenho por Matéria', 14, 20);

    const subjectData = [
        ['Matéria', 'Média', 'Questões', 'Provas'],
        ...data.subjectBreakdown.map(sb => [
            sb.subject,
            `${sb.averageScore.toFixed(1)}%`,
            sb.questionsCount.toString(),
            sb.examsCount.toString()
        ])
    ];

    autoTable(doc, {
        startY: 25,
        head: [subjectData[0]],
        body: subjectData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString()}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    return doc;
};

// ============================================
// Excel Generation
// ============================================

export const generateStudentReportExcel = (data: StudentReportData): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();

    // Overview Sheet
    const overviewData = [
        ['Relatório Individual de Desempenho'],
        ['Aluno', data.student.name],
        ['Email', data.student.email],
        [''],
        ['Métricas Gerais'],
        ['Métrica', 'Valor'],
        ['Média Geral', data.overallMetrics.averageScore.toFixed(1) + '%'],
        ['Mediana', data.overallMetrics.medianScore.toFixed(1) + '%'],
        ['Desvio Padrão', data.overallMetrics.standardDeviation.toFixed(1)],
        ['Taxa de Conclusão', data.overallMetrics.completionRate.toFixed(1) + '%'],
        ['Taxa de Aprovação', data.overallMetrics.passRate.toFixed(1) + '%']
    ];

    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Visão Geral');

    // Subject Performance Sheet
    const subjectData = [
        ['Matéria', 'Média', 'Questões', 'Provas', 'Tendência'],
        ...data.subjectPerformance.map(sp => [
            sp.subject,
            sp.averageScore.toFixed(1),
            sp.questionsCount,
            sp.examsCount,
            sp.trend
        ])
    ];

    const wsSubjects = XLSX.utils.aoa_to_sheet(subjectData);
    XLSX.utils.book_append_sheet(wb, wsSubjects, 'Desempenho por Matéria');

    // BNCC Competencies Sheet
    if (data.bnccCompetencies.length > 0) {
        const bnccData = [
            ['Código BNCC', 'Descrição', 'Média', 'Questões', 'Nível'],
            ...data.bnccCompetencies.map(bc => [
                bc.code,
                bc.description,
                bc.averageScore.toFixed(1),
                bc.questionsCount,
                bc.masteryLevel
            ])
        ];

        const wsBNCC = XLSX.utils.aoa_to_sheet(bnccData);
        XLSX.utils.book_append_sheet(wb, wsBNCC, 'Competências BNCC');
    }

    // Performance Evolution Sheet
    if (data.performanceEvolution.length > 0) {
        const evolutionData = [
            ['Data', 'Nota', 'Prova', 'Matéria'],
            ...data.performanceEvolution.map(pe => [
                new Date(pe.date).toLocaleDateString(),
                pe.score.toFixed(1),
                pe.examTitle,
                pe.subject
            ])
        ];

        const wsEvolution = XLSX.utils.aoa_to_sheet(evolutionData);
        XLSX.utils.book_append_sheet(wb, wsEvolution, 'Evolução');
    }

    return wb;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
    doc.save(filename);
};

export const downloadExcel = (wb: XLSX.WorkBook, filename: string) => {
    XLSX.writeFile(wb, filename);
};
