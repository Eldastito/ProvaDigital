
import Dexie, { Table } from 'dexie';
import { ExamEvent, StoredSession } from '../types';

// Definição do Banco de Dados Offline para o Tablet
// Usa IndexedDB por baixo do pano, permitindo armazenar megabytes de dados
export class OfflineDatabase extends Dexie {
    examEvents!: Table<ExamEvent, string>; // 'eventId' é a chave primária
    studentSessions!: Table<StoredSession, string>; // 'sessionId' é a chave
    cachedExams!: Table<{ examId: string; title: string; cachedAt: number }, string>;
    offlineQueue!: Table<{ id: string; examId: string; studentId: string; data: any; timestamp: number; synced: boolean }, string>;
    migrationMetadata!: Table<{
        id: string;
        migrationVersion: string;
        startedAt: number;
        completedAt?: number;
        sourceDbDetected: string;
        migratedSessionCount: number;
        validationPassed: boolean;
        cleanupEligible: boolean;
        details?: string;
    }, string>;

    constructor() {
        super('ExamePadOfflineDB');
        
        // Versões anteriores preservadas para histórico de migração do Dexie
        this.version(1).stores({
            examEvents: 'id, status, date',
            studentSessions: 'sessionId, studentId, eventId, synced',
            cachedExams: 'examId, title, cachedAt',
            offlineQueue: 'id, examId, studentId, synced, timestamp'
        });

        // Versão 2 - Adiciona índice storage_key
        this.version(2).stores({
            studentSessions: 'sessionId, studentId, eventId, synced, storage_key'
        });

        // Versão 3 - Manifesto de Migração (Trava Operacional)
        this.version(3).stores({
            migrationMetadata: 'id, migrationVersion, completedAt'
        });
    }
}

export const db = new OfflineDatabase();

/**
 * Registra que uma prova foi baixada com sucesso
 */
export const registerCachedExam = async (examId: string, title: string) => {
    await db.cachedExams.put({
        examId,
        title,
        cachedAt: Date.now()
    });
};

/**
 * Enfileira um resultado para sincronização posterior
 */
export const enqueueOfflineResult = async (examId: string, studentId: string, data: any) => {
    const id = `${studentId}_${examId}_${Date.now()}`;
    await db.offlineQueue.put({
        id,
        examId,
        studentId,
        data,
        timestamp: Date.now(),
        synced: false
    });
};

/**
 * Obtém todos os resultados pendentes de sincronização
 */
export const getPendingResults = async () => {
    return await db.offlineQueue.where('synced').equals(0).toArray();
};

/**
 * Marca uma tentativa como sincronizada (ou remove se preferir)
 */
export const markResultAsSynced = async (id: string) => {
    await db.offlineQueue.update(id, { synced: true as any });
};

// Helper functions existentes...
export const saveEventToDb = async (event: ExamEvent) => {
    try {
        await db.examEvents.put(event);
        console.log(`[DB] Evento ${event.id} salvo com segurança.`);
    } catch (e) {
        console.error("Erro ao salvar no IndexedDB", e);
    }
};

export const saveSession = async (session: StoredSession) => {
    try {
        await db.studentSessions.put(session);
        console.log(`[DB] Sessão ${session.sessionId} salva localmente.`);
    } catch (e) {
        console.error("Erro ao salvar sessão", e);
    }
};

export const getEventsFromDb = async (): Promise<ExamEvent[]> => {
    try {
        return await db.examEvents.toArray();
    } catch (e) {
        console.error("Erro ao ler do IndexedDB", e);
        return [];
    }
};

export const getStoredSessionsCount = async (): Promise<number> => {
    try {
        return await db.studentSessions.count();
    } catch (e) {
        return 0;
    }
};

export const getAllSessions = async (): Promise<StoredSession[]> => {
    try {
        return await db.studentSessions.toArray();
    } catch (e) {
        console.error("Erro ao ler sessões do IndexedDB", e);
        return [];
    }
};

export const getSession = async (sessionId: string): Promise<StoredSession | undefined> => {
    try {
        return await db.studentSessions.get(sessionId);
    } catch (e) {
        console.error("Erro ao recuperar sessão", e);
        return undefined;
    }
};

export const markAsSynced = async (sessionId: string) => {
    try {
        await db.studentSessions.update(sessionId, { synced: true });
        console.log(`[DB] Sessão ${sessionId} marcada como sincronizada.`);
    } catch (e) {
        console.error("Erro ao marcar sessão como sincronizada", e);
    }
};

export const clearDb = async () => {
    await db.examEvents.clear();
    await db.studentSessions.clear();
    await db.cachedExams.clear();
    await db.offlineQueue.clear();
};

export const getLastSession = async (studentId: string, eventId: string): Promise<StoredSession | undefined> => {
    try {
        const sessionId = `${studentId}_${eventId}`;
        const session = await db.studentSessions.get(sessionId);
        return session;
    } catch (e) {
        console.error("Erro ao recuperar última sessão", e);
        return undefined;
    }
};