import { db } from './offlineDb';
import { StoredSession } from '../types';

/**
 * PersistenceGateway: Camada de desacoplamento de I/O (Trava 2)
 * Evita dependência circular entre offlineDb.ts e serviços de alto nível.
 */
export const PersistenceGateway = {
    /**
     * Salva ou atualiza uma sessão de estudante
     */
    saveSession: async (session: StoredSession): Promise<void> => {
        await db.studentSessions.put(session);
    },

    /**
     * Busca uma sessão pelo storage_key (O(1))
     */
    findSessionByStorageKey: async (storageKey: string): Promise<StoredSession | undefined> => {
        return await db.studentSessions.where('storage_key').equals(storageKey).first();
    },

    /**
     * Busca uma sessão pelo sessionId original
     */
    getSessionById: async (sessionId: string): Promise<StoredSession | undefined> => {
        return await db.studentSessions.get(sessionId);
    },

    /**
     * Retorna todas as sessões armazenadas
     */
    getAllSessions: async (): Promise<StoredSession[]> => {
        return await db.studentSessions.toArray();
    },

    /**
     * Conta o total de sessões
     */
    countSessions: async (): Promise<number> => {
        return await db.studentSessions.count();
    },

    /**
     * Gerenciamento do Manifesto de Migração (Auditoria Operacional)
     */
    getMigrationManifesto: async (id: string = 'main_migration') => {
        return await db.migrationMetadata.get(id);
    },

    updateMigrationManifesto: async (id: string, data: any) => {
        const existing = await db.migrationMetadata.get(id);
        const manifesto = {
            id,
            ...existing,
            ...data,
            completedAt: data.validationPassed ? Date.now() : undefined
        };
        await db.migrationMetadata.put(manifesto);
        return manifesto;
    },

    initMigrationManifesto: async (version: string, source: string) => {
        const manifesto = {
            id: 'main_migration',
            migrationVersion: version,
            startedAt: Date.now(),
            sourceDbDetected: source,
            migratedSessionCount: 0,
            validationPassed: false,
            cleanupEligible: false
        };
        await db.migrationMetadata.put(manifesto);
        return manifesto;
    }
};
