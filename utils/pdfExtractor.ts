
import * as pdfjsLib from 'pdfjs-dist';

// Configuração do Worker (Cdn ou Local)
// Para Vite, idealmente usamos o worker local ou import dinâmico.
// Vamos usar CDN para garantir funcionamento sem configurar build complexo agora.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // @ts-ignore
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `--- Página ${i} ---\n${pageText}\n\n`;
        }

        return fullText;
    } catch (error) {
        console.error("Erro ao ler PDF:", error);
        throw new Error("Falha ao processar arquivo PDF. Verifique se não está corrompido.");
    }
};
