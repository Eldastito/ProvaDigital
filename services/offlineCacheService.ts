/**
 * Offline Cache Service
 * 
 * Gerencia o download e armazenamento de provas e seus assets (imagens, vídeos, libras)
 * para permitir a realização de exames sem conexão com a internet.
 * 
 * Sprint 4 - PWA & Resiliência
 */

import { Item, Exam } from '../types';

export interface OfflineCacheStats {
    totalItems: number;
    cachedItems: number;
    totalAssets: number;
    cachedAssets: number;
    sizeBytes: number;
}

export class OfflineCacheService {
    private static instance: OfflineCacheService;
    private CACHE_NAME = 'examepad-exams-v1';

    private constructor() { }

    static getInstance(): OfflineCacheService {
        if (!OfflineCacheService.instance) {
            OfflineCacheService.instance = new OfflineCacheService();
        }
        return OfflineCacheService.instance;
    }

    /**
     * Extrai todos os URLs de assets de uma lista de itens
     */
    extractAssetUrls(items: Item[]): string[] {
        const urls = new Set<string>();

        items.forEach(item => {
            // Imagem principal da questão
            if (item.imageUrl) urls.add(item.imageUrl);

            // Assets em multimídia
            if (item.multimedia) {
                item.multimedia.forEach(m => urls.add(m.url));
            }

            // Tags de Libras no enunciado [libras]URL[/libras]
            const librasMatches = item.statement.match(/\[libras\](.*?)\[\/libras\]/g);
            if (librasMatches) {
                librasMatches.forEach(match => {
                    const url = match.replace(/\[\/?libras\]/g, '');
                    if (url) urls.add(url);
                });
            }

            // Imagens markdown ![alt](URL)
            const mdImageMatches = item.statement.match(/!\[.*?\]\((.*?)\)/g);
            if (mdImageMatches) {
                mdImageMatches.forEach(match => {
                    const urlMatch = match.match(/\((.*?)\)/);
                    if (urlMatch && urlMatch[1]) urls.add(urlMatch[1]);
                });
            }
        });

        return Array.from(urls);
    }

    /**
     * Baixa a prova e seus assets para o cache do PWA
     */
    async downloadExamForOffline(exam: Exam, items: Item[]): Promise<boolean> {
        try {
            console.log(`[OfflineCache] Iniciando download da prova: ${exam.title}`);

            if (!('caches' in window)) {
                throw new Error('Cache API não suportada neste navegador');
            }

            const cache = await caches.open(this.CACHE_NAME);
            const assetUrls = this.extractAssetUrls(items);

            // 1. Salvar o JSON da prova
            const examBlob = new Blob([JSON.stringify({ exam, items })], { type: 'application/json' });
            const examResponse = new Response(examBlob);
            await cache.put(`/api/exams/offline-package/${exam.id}`, examResponse);

            // 2. Baixar assets binários
            console.log(`[OfflineCache] Baixando ${assetUrls.length} assets...`);

            const downloadPromises = assetUrls.map(async (url) => {
                try {
                    // Tenta baixar e colocar no cache
                    const response = await fetch(url, { mode: 'no-cors' }); // no-cors para assets externos se necessário
                    if (response.ok || response.type === 'opaque') {
                        await cache.put(url, response);
                    }
                } catch (err) {
                    console.warn(`[OfflineCache] Falha ao baixar asset: ${url}`, err);
                }
            });

            await Promise.all(downloadPromises);

            console.log(`[OfflineCache] Download concluído para: ${exam.title}`);
            return true;
        } catch (error) {
            console.error('[OfflineCache] Erro fatal no download:', error);
            return false;
        }
    }

    /**
     * Verifica se uma prova está disponível offline
     */
    async isAvailableOffline(examId: string): Promise<boolean> {
        if (!('caches' in window)) return false;
        const cache = await caches.open(this.CACHE_NAME);
        const response = await cache.match(`/api/exams/offline-package/${examId}`);
        return !!response;
    }

    /**
     * Remove uma prova do cache offline
     */
    async removeExamFromOffline(examId: string): Promise<void> {
        if (!('caches' in window)) return;
        const cache = await caches.open(this.CACHE_NAME);
        await cache.delete(`/api/exams/offline-package/${examId}`);
    }
}

export const offlineCacheService = OfflineCacheService.getInstance();
