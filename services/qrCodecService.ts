
import { EncryptedPackage } from "../types";

// Segredo de Ofuscação para impedir leitura por apps de câmera comuns (Anti-Sniffing)
const FORGE_OBFUSCATION_KEY = "FORGE_2026_SECURE_TRANSPORT";

// Tamanho seguro para um QR Code denso ser lido rapidamente por câmeras medianas
// Aumentado levemente pois a compressão reduzirá a densidade real
const CHUNK_SIZE = 450;

export interface QRChunk {
    id: string;      // ID único da transferência
    index: number;   // Índice atual (0, 1, 2...)
    total: number;   // Total de chunks
    data: string;    // Fragmento da string Base64 ofuscada
}

export class QRDataTransfer {

    /**
     * Auxiliar para ofuscação XOR (Simples mas impede leitura direta por câmeras)
     */
    private static xorTransform(data: string): string {
        let result = "";
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data.charCodeAt(i) ^ FORGE_OBFUSCATION_KEY.charCodeAt(i % FORGE_OBFUSCATION_KEY.length));
        }
        return result;
    }

    /**
     * Comprime uma string usando GZIP (Browser API)
     */
    private static async compress(text: string): Promise<Uint8Array> {
        const stream = new Blob([text]).stream();
        const compressedStream = stream.pipeThrough(new (window as any).CompressionStream('gzip'));
        const reader = compressedStream.getReader();
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const combined = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }
        return combined;
    }

    /**
     * Descomprime um Uint8Array usando GZIP (Browser API)
     */
    private static async decompress(data: Uint8Array): Promise<string> {
        const stream = new Blob([data.buffer as ArrayBuffer]).stream();
        const decompressedStream = stream.pipeThrough(new (window as any).DecompressionStream('gzip'));
        const reader = decompressedStream.getReader();
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const combined = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }
        return new TextDecoder().decode(combined);
    }

    // EMISSOR: Quebra o pacote em chunks com compressão e ofuscação
    static async compressAndChunk(payload: any): Promise<string[]> {
        const jsonString = JSON.stringify(payload);

        // 1. Compressão GZIP
        const compressedBytes = await this.compress(jsonString);

        // 2. Converter para string para ofuscação (Base64 Temporário para evitar problemas com XOR em binário puro no transport)
        const base64ForXor = btoa(String.fromCharCode(...compressedBytes));

        // 3. Ofuscação XOR (Anti-Sniffing)
        const obfuscated = this.xorTransform(base64ForXor);

        // 4. Base64 Final para o QR (Garante caracteres seguros)
        const finalBase64 = btoa(encodeURIComponent(obfuscated));

        const transferId = Math.random().toString(36).substring(7);
        const totalChunks = Math.ceil(finalBase64.length / CHUNK_SIZE);
        const chunks: string[] = [];

        for (let i = 0; i < totalChunks; i++) {
            const chunkData = finalBase64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            // Formato enxuto para o QR: "F|ID|INDEX|TOTAL|DATA" (F de FORGE)
            chunks.push(`F|${transferId}|${i}|${totalChunks}|${chunkData}`);
        }

        return chunks;
    }

    // RECEPTOR: Processa um chunk lido
    static parseChunk(rawString: string): QRChunk | null {
        try {
            const parts = rawString.split('|');
            // Verifica se é um pacote FORGE legítimo
            if (parts[0] !== 'F' || parts.length < 5) return null;

            return {
                id: parts[1],
                index: parseInt(parts[2]),
                total: parseInt(parts[3]),
                data: parts.slice(4).join('|')
            };
        } catch (e) {
            return null;
        }
    }

    // RECEPTOR: Tenta montar o objeto final se tiver todos os chunks
    static async tryReassemble(chunksMap: Map<number, string>, totalExpected: number): Promise<any | null> {
        if (chunksMap.size !== totalExpected) return null;

        try {
            let fullBase64 = '';
            for (let i = 0; i < totalExpected; i++) {
                if (!chunksMap.has(i)) return null;
                fullBase64 += chunksMap.get(i);
            }

            // 1. Reverter Base64 Final
            const obfuscated = decodeURIComponent(atob(fullBase64));

            // 2. Desofuscar XOR
            const base64ForXor = this.xorTransform(obfuscated);

            // 3. Reverter Base64 Temporário
            const compressedBinary = atob(base64ForXor);
            const bytes = new Uint8Array(compressedBinary.length);
            for (let i = 0; i < compressedBinary.length; i++) {
                bytes[i] = compressedBinary.charCodeAt(i);
            }

            // 4. Descomprimir GZIP
            const jsonString = await this.decompress(bytes);

            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Erro ao remontar pacote FORGE via QR", e);
            return null;
        }
    }
}
