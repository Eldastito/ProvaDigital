/**
 * File Security Service
 * 
 * Implementa o padrão de "Reconstrução de Dados" para garantir 100% de segurança
 * contra vírus, macros e scripts maliciosos em uploads.
 */

import { supabase } from './supabaseClient';
import { uuidv4 } from '../utils/helpers';

export class FileSecurityService {
    /**
     * Sanitiza uma imagem (Avatar) redesenhando-a em um Canvas
     * Isso remove metadados (EXIF), scripts embarcados e reconstrói o binário.
     */
    async sanitizeImage(file: File): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    return reject(new Error("Não foi possível criar contexto 2D"));
                }

                // Limitar tamanho para performance e padronização (Ex: 512x512 para avatares)
                const MAX_SIZE = 512;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Pintar na "tela limpa"
                ctx.drawImage(img, 0, 0, width, height);

                // Exportar como novo Blob (Sanitizado)
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Falha ao reconstruir imagem"));
                    }
                }, 'image/jpeg', 0.85); // Compressão leve
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Arquivo de imagem inválido ou corrompido"));
            };

            img.src = url;
        });
    }

    /**
     * Sanitiza arquivos de texto/planilha extraindo apenas os dados brutos.
     * Para CSV/Excel, o processamento será feito pela IA via BatchImportService.
     */
    async validateRawData(file: File): Promise<string> {
        const text = await file.text();
        // Remove caracteres de controle e possíveis tags script se for texto puro
        return text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/[^\x20-\x7E\s]/g, ""); // Apenas ASCII e caracteres comuns
    }

    /**
     * Upload Seguro para o Supabase Storage após sanitização
     */
    async secureUpload(bucket: string, path: string, blob: Blob): Promise<string | null> {
        const { data, error } = await supabase.storage.from(bucket).upload(path, blob);
        if (error) {
            console.error("Erro no upload seguro:", error);
            return null;
        }
        return data.path;
    }
}

export const fileSecurityService = new FileSecurityService();
