/**
 * @module OfflineDatabase
 * @description Banco de dados offline local baseado em IndexedDB (via Dexie.js).
 * 
 * Provê armazenamento persistente no dispositivo para todas as operações offline:
 * - Eventos de avaliação cacheados
 * - Sessões de estudante com trilha de auditoria
 * - Fila de sincronização para envio posterior
 * - Metadados de migração para auditoria operacional
 * - Configurações do dispositivo
 * 
 * Evolução de Schema:
 * - v1: Estrutura inicial (events, sessions, cache, queue)
 * - v2: Adição de índice storage_key para Context Pointer
 * - v3: Adição de migrationMetadata
 * - v4: Adição de config
 * 
 * @patent-safe Este módulo é parte do dossiê de Patente de Invenção FORGE.
 */

import Dexie, { Table } from 'dexie';
import { ExamEvent, StoredSession } from '../types';

/**
 * Entrada na fila de sincronização offline.
 * Resultados são enfileirados localmente e sincronizados quando há conectividade.
 */
export interface OfflineQueueEntry {
    /** Identificador único derivado: `{studentId}_{examId}_{timestamp}` */
    id: string;
    /** ID da prova */
    examId: string;
    /** ID do estudante */
    studentId: string;
    /** Dados serializados do resultado */
    data: Record<string, unknown>;
    /** Timestamp de criação (epoch ms) */
    timestamp: number;
    /** Se já foi sincronizado com o servidor */
    synced: boolean;
}

/**
 * Prova cacheada localmente para uso offline.
 */
export interface CachedExamEntry {
    /** ID da prova */
    examId: string;
    /** Título da prova */
    title: string;
    /** Timestamp do cache (epoch ms) */
    cachedAt: number;
}

/**
 * Configuração do dispositivo armazenada localmente.
 */
export interface DeviceConfig {
    /** Chave da configuração */
    key: string;
    /** Valor da configuração */
    value: string | number | boolean | Record<string, unknown>;
    /** Data/hora da configuração */
    configuredAt: string;
}

/**
 * Metadados de migração para rastreabilidade.
 */
export interface MigrationMetadataEntry {
    /** Identificador único */
    id: string;
    /** Versão da migração */
    migrationVersion: string;
    /** Timestamp de início */
    startedAt: number;
    /** Timestamp de conclusão */
    completedAt?: number;
    /** Banco de origem detectado */
    sourceDbDetected: string;
    /** Número de sessões migradas */
    migratedSessionCount: number;
    /** Se a validação passou */
    validationPassed: boolean;
    /** Se os dados antigos podem ser removidos */
    cleanupEligible: boolean;
    /** Detalhes adicionais */
    details?: string;
}

/**
 * Banco de Dados Offline — IndexedDB via Dexie.js.
 * Persistência local para operações sem conectividade.
 */
export class OfflineDatabase extends Dexie {
    examEvents!: Table<ExamEvent, string>;
    studentSessions!: Table<StoredSession, string>;
    cachedExams!: Table<CachedExamEntry, string>;
    offlineQueue!: Table<OfflineQueueEntry, string>;
    migrationMetadata!: Table<MigrationMetadataEntry, string>;
    config!: Table<DeviceConfig, string>;

    constructor() {
        super('ExamePadOfflineDB');
        
        this.version(1).stores({
            examEvents: 'id, status, date',
            studentSessions: 'sessionId, studentId, eventId, synced',
            cachedExams: 'examId, title, cachedAt',
            offlineQueue: 'id, examId, studentId, synced, timestamp'
        });

        this.version(2).stores({
            studentSessions: 'sessionId, studentId, eventId, synced, storage_key'
        });

        this.version(3).stores({
            migrationMetadata: 'id, migrationVersion, completedAt'
        });

        this.version(4).stores({
            config: 'key'
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
 * Enfileira um resultado para sincronização posterior.
 * @param examId - ID da prova
 * @param studentId - ID do estudante
 * @param data - Dados do resultado (JSON serializável)
 */
export const enqueueOfflineResult = async (examId: string, studentId: string, data: Record<string, unknown>) => {
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
    await db.offlineQueue.update(id, { synced: true });
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