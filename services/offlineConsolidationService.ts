/**
 * Offline Consolidation Service
 * 
 * Gerencia a persistência de submissões escaneadas pelo professor no IndexedDB.
 * Permite que o professor escaneie alunos ao longo do dia e mantenha o progresso
 * mesmo se o aplicativo for fechado.
 */

import { E2EEncryptionService } from './security/e2eEncryptionService';

export interface OfflineSubmission {
    studentId: string;
    studentName: string;
    examId: string;
    eventId: string;
    encryptedAnswers: any;
    scannedAt: string;
    metadata?: any;
}

export interface ClassroomBatch {
    id: string; // eventId-schoolId-timestamp
    eventId: string;
    schoolId: string;
    submissions: OfflineSubmission[];
    status: 'COLLECTING' | 'CONSOLIDATED' | 'SYNCED';
    createdAt: string;
    consolidatedAt?: string;
    syncedAt?: string;
}

export class OfflineConsolidationService {
    private static instance: OfflineConsolidationService;
    private dbName = 'ExamePadConsolidation';
    private dbVersion = 1;

    private constructor() { }

    static getInstance(): OfflineConsolidationService {
        if (!OfflineConsolidationService.instance) {
            OfflineConsolidationService.instance = new OfflineConsolidationService();
        }
        return OfflineConsolidationService.instance;
    }

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('submissions')) {
                    const store = db.createObjectStore('submissions', { keyPath: ['eventId', 'studentId'] });
                    store.createIndex('eventId', 'eventId', { unique: false });
                    store.createIndex('studentId', 'studentId', { unique: false });
                }
                if (!db.objectStoreNames.contains('batches')) {
                    db.createObjectStore('batches', { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * Salva uma submissão escaneada
     */
    async saveSubmission(submission: OfflineSubmission): Promise<void> {
        const db = await this.openDB();
        const tx = db.transaction('submissions', 'readwrite');
        const store = tx.objectStore('submissions');

        return new Promise((resolve, reject) => {
            const request = store.put(submission);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtém todas as submissões de um evento
     */
    async getSubmissionsByEvent(eventId: string): Promise<OfflineSubmission[]> {
        const db = await this.openDB();
        const tx = db.transaction('submissions', 'readonly');
        const store = tx.objectStore('submissions');
        const index = store.index('eventId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(eventId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Remove submissão (em caso de erro ou re-escaneamento necessário)
     */
    async deleteSubmission(eventId: string, studentId: string): Promise<void> {
        const db = await this.openDB();
        const tx = db.transaction('submissions', 'readwrite');
        const store = tx.objectStore('submissions');

        return new Promise((resolve, reject) => {
            const request = store.delete([eventId, studentId]);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtém todas as submissões pendentes de todos os eventos
     */
    async getAllSubmissions(): Promise<OfflineSubmission[]> {
        const db = await this.openDB();
        const tx = db.transaction('submissions', 'readonly');
        const store = tx.objectStore('submissions');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Limpa todas as submissões sincronizadas de um evento
     */
    async clearEventData(eventId: string): Promise<void> {
        const db = await this.openDB();
        const tx = db.transaction('submissions', 'readwrite');
        const store = tx.objectStore('submissions');
        const index = store.index('eventId');

        const submissions = await this.getSubmissionsByEvent(eventId);
        for (const s of submissions) {
            await store.delete([s.eventId, s.studentId]);
        }
    }
}

export const offlineConsolidationService = OfflineConsolidationService.getInstance();
