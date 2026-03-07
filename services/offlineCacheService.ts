/**
 * Offline Cache Service
 * 
 * Gerencia o download e armazenamento de provas e seus assets (imagens, vídeos, libras)
 * para permitir a realização de exames sem conexão com a internet.
 * 
 * Sprint 4 - PWA & Resiliência
 */

import { Item, Exam } from '../types';
import { supabase } from './supabaseClient';
import { cryptoService } from './cryptoService';

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

            // 1. Buscar a Chave Offline do Supabase
            // Apenas coordenadores/admin têm permissão para ler essa tabela via RLS.
            // Se o request falhar, significa que este usuário (ex: Aluno) não tem permissão de gerar o cache semente.
            const { data: keyData, error: keyError } = await supabase
                .from('exam_offline_keys')
                .select('key_data')
                .eq('exam_id', exam.id)
                .single();

            if (keyError || !keyData) {
                console.error('[OfflineCache] Erro fatal: Chave criptográfica não encontrada ou sem permissão.', keyError);
                throw new Error('Permissão negada ou chave offline inexistente para esta prova.');
            }

            // 2. Importar a chave JWK
            const cryptoKey = await cryptoService.importKey(keyData.key_data);

            // 3. Criptografar o Payload (Exam + Items)
            const rawPayload = { exam, items };
            // FASE 4.2: Gerar Lacre de Integridade SHA-256
            const integrityHash = await cryptoService.generateSHA256Hash(rawPayload);
            const wrappedPayload = { data: rawPayload, integrityHash };
            
            const encryptedPayload = await cryptoService.encryptData(wrappedPayload, cryptoKey);

            // 4. Salvar o JSON Criptografado da prova no Cache API
            const examBlob = new Blob([JSON.stringify(encryptedPayload)], { type: 'application/json' });
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
     * Resgata o arquivo criptografado do Cache API e destranca usando a chave fornecida (A Faísca).
     * O retorno já é o pacote claro (Exam + Items) em memória RAM.
     */
    async loadExamFromOffline(examId: string, jwkKey: JsonWebKey): Promise<{ exam: Exam, items: Item[] } | null> {
        if (!('caches' in window)) return null;

        try {
            const cache = await caches.open(this.CACHE_NAME);
            const response = await cache.match(`/api/exams/offline-package/${examId}`);

            if (!response) {
                console.error('[OfflineCache] Prova não encontrada no disco local.', examId);
                return null;
            }

            const encryptedPayload = await response.json();
            
            // 1. Importa a Chave fornecida (O Coordenador passou isso e tem autorização RLS no banco)
            const cryptoKey = await cryptoService.importKey(jwkKey);
            
            // 2. Descriptografa o pacote em memória
            const decryptedPayload = await cryptoService.decryptData(encryptedPayload, cryptoKey);
            
            // FASE 4.2: Verificar Lacre de Integridade SHA-256
            if (decryptedPayload.integrityHash && decryptedPayload.data) {
                const currentHash = await cryptoService.generateSHA256Hash(decryptedPayload.data);
                if (currentHash !== decryptedPayload.integrityHash) {
                    console.error('[OfflineCache] \uD83D\uDEA8 ALERTA CRÍTICO: O Lacre SHA-256 foi violado!', { original: decryptedPayload.integrityHash, calculated: currentHash });
                    throw new Error('CORRUPTED_PAYLOAD_INTEGRITY_COMPROMISED');
                }
                console.log(`[OfflineCache] \u2705 Lacre de Integridade SHA-256 Validado com Sucesso.`);
                return decryptedPayload.data;
            } else {
                // Fallback de retrocompatibilidade para provas arquivadas antes da Fase 4
                console.log(`[OfflineCache] Prova '${decryptedPayload.exam?.title || 'Desconhecida'}' destrancada em Modo Legado (Sem Lacre).`);
                return decryptedPayload;
            }

        } catch (error) {
            console.error('[OfflineCache] Falha ao destrancar a Prova (Chave Incorreta ou Arquivo Corrompido):', error);
            return null;
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

    /**
     * Baixa os dados da turma (alunos) para o cache offline
     */
    async downloadClassDataForOffline(classId: string, students: any[]): Promise<boolean> {
        try {
            console.log(`[OfflineCache] Iniciando download da turma: ${classId}`);

            if (!('caches' in window)) {
                throw new Error('Cache API não suportada neste navegador');
            }

            const cache = await caches.open(this.CACHE_NAME);

            // Salvar o JSON dos alunos
            const studentsBlob = new Blob([JSON.stringify(students)], { type: 'application/json' });
            const studentsResponse = new Response(studentsBlob);
            await cache.put(`/api/classes/${classId}/students`, studentsResponse);

            // Registrar no index de caches locais
            const indexKey = 'cached_classes_index';
            const index = JSON.parse(localStorage.getItem(indexKey) || '[]');
            if (!index.includes(classId)) {
                index.push(classId);
                localStorage.setItem(indexKey, JSON.stringify(index));
            }

            console.log(`[OfflineCache] Download da turma ${classId} concluído.`);
            return true;
        } catch (error) {
            console.error('[OfflineCache] Erro no download da turma:', error);
            return false;
        }
    }
}

export const registerCachedExam = async (examId: string, title: string) => {
    const key = 'cached_exams_index';
    const index = JSON.parse(localStorage.getItem(key) || '[]');
    if (!index.find((e: any) => e.id === examId)) {
        index.push({ id: examId, title, downloadedAt: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(index));
    }
};

export const offlineCacheService = OfflineCacheService.getInstance();
