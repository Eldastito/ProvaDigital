import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const reportingService = {
    /**
     * Generates a PDF report for network performance
     */
    generateNetworkReport: async (data: any[], title: string = 'Relatório de Rede'): Promise<Blob> => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 30);

        const tableData = data.map((item: any) => [
            item.schoolName || 'N/A',
            item.cityName || 'N/A',
            item.studentsCount || 0,
            item.averageScore?.toFixed(1) || '0.0',
            item.riskLevel || 'Baixo'
        ]);

        autoTable(doc, {
            head: [['Escola', 'Cidade', 'Alunos', 'Média', 'Risco']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });

        return doc.output('blob');
    },

    /**
     * Generates an Excel export for raw data analysis
     */
    generateExcelExport: async (data: any[], sheetName: string = 'Dados'): Promise<Blob> => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    },

    /**
     * Generates a PDF for the Study Plan
     */
    exportStudyPlan: async (studentName: string, plan: any): Promise<void> => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(41, 128, 185); // Brand Primary
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Plano de Estudos Personalizado', 14, 25);
        doc.setFontSize(12);
        doc.text(`Aluno: ${studentName}`, 14, 35);

        let yPos = 50;
        doc.setTextColor(0, 0, 0);

        // Intro
        doc.setFontSize(11);
        doc.text('Com base na sua performance recente, nossa IA preparou este roteiro:', 14, yPos);
        yPos += 10;

        // Tasks
        if (plan && plan.tasks) {
            plan.tasks.forEach((task: any, index: number) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFillColor(245, 247, 250);
                doc.roundedRect(14, yPos, 182, 35, 3, 3, 'F');

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`${index + 1}. ${task.title}`, 20, yPos + 10);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                // Split description to fit
                const descLines = doc.splitTextToSize(task.description || '', 170);
                doc.text(descLines, 20, yPos + 20);

                doc.setFontSize(10);
                doc.setTextColor(41, 128, 185);
                doc.text(`Recompensa: +${task.rewardSafe || 0} XP`, 150, yPos + 10);
                doc.setTextColor(0, 0, 0);

                yPos += 40;
            });
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Gerado automaticamente pela Plataforma de Avaliação Digital', 14, 285);

        doc.save(`Plano_Estudos_${studentName.replace(/\s+/g, '_')}.pdf`);
    }
};
