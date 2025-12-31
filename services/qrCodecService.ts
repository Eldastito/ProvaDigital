
import { EncryptedPackage } from "../types";

// Tamanho seguro para um QR Code denso ser lido rapidamente por câmeras medianas
const CHUNK_SIZE = 400; 

export interface QRChunk {
    id: string;      // ID único da transferência
    index: number;   // Índice atual (0, 1, 2...)
    total: number;   // Total de chunks
    data: string;    // Fragmento da string Base64
}

export class QRDataTransfer {
    // EMISSOR: Quebra o pacote em chunks
    static compressAndChunk(payload: any): string[] {
        const jsonString = JSON.stringify(payload);
        // Em produção real, usaríamos compressão GZIP/Brotli aqui antes de Base64 para economizar espaço
        const base64Full = window.btoa(encodeURIComponent(jsonString));
        
        const transferId = Math.random().toString(36).substring(7);
        const totalChunks = Math.ceil(base64Full.length / CHUNK_SIZE);
        const chunks: string[] = [];

        for (let i = 0; i < totalChunks; i++) {
            const chunkData = base64Full.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const chunkObj: QRChunk = {
                id: transferId,
                index: i,
                total: totalChunks,
                data: chunkData
            };
            // Formato enxuto para o QR: "ID|INDEX|TOTAL|DATA"
            chunks.push(`${transferId}|${i}|${totalChunks}|${chunkData}`);
        }

        return chunks;
    }

    // RECEPTOR: Processa um chunk lido
    static parseChunk(rawString: string): QRChunk | null {
        try {
            const parts = rawString.split('|');
            if (parts.length < 4) return null;
            
            return {
                id: parts[0],
                index: parseInt(parts[1]),
                total: parseInt(parts[2]),
                data: parts.slice(3).join('|') // Caso o dado tenha pipe, rejoin
            };
        } catch (e) {
            return null;
        }
    }

    // RECEPTOR: Tenta montar o objeto final se tiver todos os chunks
    static tryReassemble(chunksMap: Map<number, string>, totalExpected: number): any | null {
        if (chunksMap.size !== totalExpected) return null;

        try {
            let fullBase64 = '';
            for (let i = 0; i < totalExpected; i++) {
                if (!chunksMap.has(i)) return null; // Falta pedaço
                fullBase64 += chunksMap.get(i);
            }
            
            const jsonString = decodeURIComponent(window.atob(fullBase64));
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Erro ao remontar JSON via QR", e);
            return null;
        }
    }
}
