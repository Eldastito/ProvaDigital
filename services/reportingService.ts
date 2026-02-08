import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Exam, ExamResult, StudentAnswer } from '../types';

export class ReportingService {
    /**
     * Exporta dados genéricos para Excel
     */
    static exportToExcel(data: any[], filename: string) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Planilha1");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    }

    /**
     * Gera um relatório de desempenho por turma (PDF)
     */
    static generateClassReport(exam: Exam, results: any[], className: string) {
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text(`Relatório de Desempenho: ${exam.title}`, 14, 20);

        doc.setFontSize(11);
        doc.text(`Turma: ${className}`, 14, 30);
        doc.text(`Data de Geração: ${new Date().toLocaleDateString()}`, 14, 35);

        // Tabela de Alunos
        const tableData = results.map(r => [
            r.studentName,
            r.score.toFixed(1),
            `${((r.score / (exam.maxScore || 10)) * 100).toFixed(0)}%`,
            r.status === 'submitted' ? 'Entregue' : 'Pendente'
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Estudante', 'Nota', 'Aproveitamento', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] }
        });

        doc.save(`Relatorio_${className}_${exam.id}.pdf`);
    }

    /**
     * Exporta o Plano de Estudo IA para PDF
     */
    static exportStudyPlan(studentName: string, studyPlan: any) {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(40, 44, 52);
        doc.text(`Plano de Recuperação: ${studentName}`, 14, 22);

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Gerado por ExamePad AI em ${new Date().toLocaleDateString()}`, 14, 30);

        doc.setLineWidth(0.5);
        doc.line(14, 35, 196, 35);

        // Seção Meta
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Objetivo Principal", 14, 45);
        doc.setFontSize(11);
        doc.text(studyPlan.objective || "Recuperação de conteúdos e reforço de aprendizagem.", 14, 52, { maxWidth: 180 });

        // Tabela de Tarefas
        const tasks = studyPlan.tasks.map((t: any) => [
            t.title,
            t.description,
            `${t.rewardSafe || 0} 🦉`
        ]);

        autoTable(doc, {
            startY: 65,
            head: [['Atividade', 'Descrição', 'Recompensa']],
            body: tasks,
            columnStyles: {
                1: { cellWidth: 100 }
            }
        });

        doc.save(`Plano_Estudo_${studentName.replace(/\s+/g, '_')}.pdf`);
    }

    /**
     * Converte um array de resultados para formato CSV amigável para Excel
     */
    static resultsToSheetData(results: any[], exam: Exam) {
        return results.map(r => ({
            'Estudante': r.studentName,
            'Email': r.studentEmail || '-',
            'Nota': r.score,
            'Máximo': exam.maxScore || 10,
            '%': `${((r.score / (exam.maxScore || 10)) * 100).toFixed(1)}%`,
            'Data': new Date(r.submittedAt).toLocaleString(),
            'Status': r.status
        }));
    }
}
