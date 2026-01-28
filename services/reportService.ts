import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Augment jsPDF type for autotable
declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable: { finalY: number };
    }
}

export class ReportService {

    /**
     * Export raw data to CSV/Excel
     */
    static exportToCSV(filename: string, data: any[]) {
        if (!data || data.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
        XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    /**
     * Generate PDF Report with standard header/footer
     */
    static exportToPDF(title: string, columns: string[], rows: any[][], orientation: 'p' | 'l' = 'p') {
        const doc = new jsPDF(orientation, 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;

        // --- Header ---
        doc.setFillColor(37, 99, 235); // Brand Primary (Blue)
        doc.rect(0, 0, pageWidth, 20, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text("ExamePad SaaS", 14, 13);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Relatório Oficial", pageWidth - 14, 13, { align: 'right' });

        // --- Report Title ---
        doc.setTextColor(33, 33, 33);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 14, 35);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 14, 42);

        // --- Table ---
        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 50 }
        });

        // --- Footer ---
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Página ${i} de ${pageCount} - ExamePad Prova Digital`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    }

    /**
     * Mock data fetcher for preview
     */
    static async getMockData(type: string): Promise<any[]> {
        // Simulation delay
        await new Promise(r => setTimeout(r, 600));

        if (type === 'CLASS_REPORT') {
            return [
                ['Ana Silva', '3C', '9.5', '98%'],
                ['Bruno Costa', '3C', '8.2', '90%'],
                ['Carlos Lima', '3C', '7.5', '85%'],
                ['Daniela Alves', '3C', '10.0', '100%'],
                ['Eduardo Souza', '3C', '6.8', '75%'],
            ];
        }
        return [];
    }
}

export const reportService = ReportService;
