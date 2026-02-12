import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { MaterialSource } from '../modules/builder/components/MaterialUploader';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.530/pdf.worker.mjs`;

/**
 * Processa um arquivo e extrai seu conteúdo textual
 */
export async function processFile(material: MaterialSource): Promise<{
    extractedText: string;
    totalPages?: number;
    metadata?: any;
}> {
    switch (material.type) {
        case 'pdf':
            return await processPDF(material);
        case 'docx':
            return await processDOCX(material);
        case 'xlsx':
            return await processExcel(material);
        case 'txt':
            return await processTXT(material);
        case 'image':
            return await processImage(material);
        default:
            throw new Error('Tipo de arquivo não suportado');
    }
}

/**
 * Processa arquivo PDF e extrai texto
 */
async function processPDF(material: MaterialSource): Promise<{
    extractedText: string;
    totalPages: number;
}> {
    try {
        const arrayBuffer = await material.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        const pageRange = material.pageRange || { start: 1, end: totalPages };
        let extractedText = '';

        // Extrair texto das páginas selecionadas
        for (let i = pageRange.start; i <= Math.min(pageRange.end, totalPages); i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            extractedText += `\n\n--- Página ${i} ---\n${pageText}`;
        }

        return {
            extractedText: extractedText.trim(),
            totalPages
        };
    } catch (error) {
        console.error('Erro ao processar PDF:', error);
        throw new Error('Erro ao extrair texto do PDF');
    }
}

/**
 * Processa arquivo DOCX e extrai texto
 */
async function processDOCX(material: MaterialSource): Promise<{
    extractedText: string;
}> {
    try {
        const arrayBuffer = await material.file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        return {
            extractedText: result.value
        };
    } catch (error) {
        console.error('Erro ao processar DOCX:', error);
        throw new Error('Erro ao extrair texto do DOCX');
    }
}

/**
 * Processa arquivo Excel e extrai dados
 */
async function processExcel(material: MaterialSource): Promise<{
    extractedText: string;
}> {
    try {
        const arrayBuffer = await material.file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        let extractedText = '';

        // Processar todas as planilhas
        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            extractedText += `\n\n--- Planilha: ${sheetName} ---\n`;
            extractedText += sheetData
                .map((row: any) => row.join(' | '))
                .join('\n');
        });

        return {
            extractedText: extractedText.trim()
        };
    } catch (error) {
        console.error('Erro ao processar Excel:', error);
        throw new Error('Erro ao extrair dados do Excel');
    }
}

/**
 * Processa arquivo TXT
 */
async function processTXT(material: MaterialSource): Promise<{
    extractedText: string;
}> {
    try {
        const text = await material.file.text();

        return {
            extractedText: text
        };
    } catch (error) {
        console.error('Erro ao processar TXT:', error);
        throw new Error('Erro ao ler arquivo de texto');
    }
}

/**
 * Processa imagem e converte para Base64 para OCR
 */
async function processImage(material: MaterialSource): Promise<{
    extractedText: string;
}> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Retornamos o base64 no extractedText com um prefixo identificador
            resolve({
                extractedText: `IMAGE_BASE64:${base64}`
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(material.file);
    });
}

/**
 * Extrai um trecho específico do texto baseado em critérios
 */
export function extractTextSegment(
    fullText: string,
    criteria: {
        startPage?: number;
        endPage?: number;
        searchTerm?: string;
        maxLength?: number;
    }
): string {
    let text = fullText;

    // Se há termo de busca, encontrar contexto ao redor
    if (criteria.searchTerm) {
        const index = text.toLowerCase().indexOf(criteria.searchTerm.toLowerCase());
        if (index !== -1) {
            const start = Math.max(0, index - 200);
            const end = Math.min(text.length, index + criteria.searchTerm.length + 200);
            text = '...' + text.substring(start, end) + '...';
        }
    }

    // Limitar tamanho se necessário
    if (criteria.maxLength && text.length > criteria.maxLength) {
        text = text.substring(0, criteria.maxLength) + '...';
    }

    return text;
}

/**
 * Gera hash do arquivo para rastreamento
 */
export async function generateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
