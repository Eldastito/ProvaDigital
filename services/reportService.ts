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
    /**
     * Generate PDF Report with standard header/footer and optional logo
     */
    static async exportToPDF(title: string, columns: string[], rows: any[][], options?: {
        orientation?: 'p' | 'l';
        schoolName?: string;
        logoUrl?: string; // Base64 or URL
    }) {
        const orientation = options?.orientation || 'p';
        const doc = new jsPDF(orientation, 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;

        // --- Header Background ---
        doc.setFillColor(37, 99, 235); // Brand Primary (Blue)
        doc.rect(0, 0, pageWidth, 25, 'F'); // Increased height for logo space

        // --- Logo Processing ---
        let titleX = 14;
        if (options?.logoUrl) {
            try {
                // Determine if it's Base64 or URL
                let validImage = options.logoUrl;
                // If URL, we would normally fetch it here. For simplicity in this env, we assume valid base64/url that jsPDF handles 
                // OR we advise the caller to pass Base64.
                // Assuming Base64 for stability or accessible URL.
                doc.addImage(validImage, 'PNG', 14, 2, 21, 21); // x, y, w, h
                titleX = 40; // Shift title to the right
            } catch (e) {
                console.warn("Falha ao carregar logo no PDF", e);
            }
        }

        // --- Header Text ---
        doc.setTextColor(255, 255, 255);

        // System Name (Top Left or shifted)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text("ExamePad SaaS", titleX, 10);

        // School Name (Subtitle)
        if (options?.schoolName) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(options.schoolName, titleX, 18);
        }

        // Report Type Label (Top Right)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Relatório Oficial", pageWidth - 14, 10, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text("Confidencial", pageWidth - 14, 16, { align: 'right' });

        // --- Report Title (Body) ---
        doc.setTextColor(33, 33, 33);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const reportTitleY = 40;
        doc.text(title.toUpperCase(), 14, reportTitleY);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 14, reportTitleY + 7);

        // --- Table ---
        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: reportTitleY + 15,
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
