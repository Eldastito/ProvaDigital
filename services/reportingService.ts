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
    }
};
