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
    },

    /**
     * Busca sessões pendentes de sincronização
     */
    getPendingSessions: async (): Promise<StoredSession[]> => {
        return await db.studentSessions.where('uploadedToServer').equals(0).toArray();
    },

    /**
     * Deleta múltiplas sessões (Ex: Limpeza pós-upload)
     */
    deleteSessions: async (ids: string[]): Promise<void> => {
        await db.studentSessions.bulkDelete(ids);
    },

    /**
     * Atualiza campos específicos de uma sessão
     */
    updateSession: async (sessionId: string, updates: Partial<StoredSession>): Promise<void> => {
        await db.studentSessions.update(sessionId, updates);
    },

    /**
     * CONFIGURAÇÕES UNIFICADAS (F3B)
     */
    saveConfig: async (key: string, value: any): Promise<void> => {
        await db.config.put({
            key,
            value,
            configuredAt: new Date().toISOString()
        });
    },

    getConfig: async (key: string): Promise<any | undefined> => {
        const item = await db.config.get(key);
        return item?.value;
    },

    deleteConfig: async (key: string): Promise<void> => {
        await db.config.delete(key);
    },

    /**
     * PONTE DE MIGRAÇÃO: Resgata dados do IDB Nativo Legado (F3B)
     */
    migrateLegacyProvisioning: async (): Promise<{ migrated: boolean; count: number }> => {
        const isDone = await PersistenceGateway.getConfig('migration_legacy_idb_done');
        if (isDone) return { migrated: false, count: 0 };

        console.log('🏗️ [BRIDGE] Iniciando resgate de dados do IDB Nativo Legado...');
        let count = 0;

        try {
            // Tentar abrir o banco legado
            const legacyData = await new Promise<any[]>((resolve) => {
                const request = indexedDB.open('ExamePadOffline', 1);
                request.onsuccess = () => {
                    const ldb = request.result;
                    if (!ldb.objectStoreNames.contains('config')) return resolve([]);
                    
                    const tx = ldb.transaction(['config'], 'readonly');
                    const store = tx.objectStore('config');
                    const getRequest = store.getAll();
                    getRequest.onsuccess = () => resolve(getRequest.result);
                    getRequest.onerror = () => resolve([]);
                };
                request.onerror = () => resolve([]);
            });

            if (legacyData.length > 0) {
                for (const item of legacyData) {
                    await PersistenceGateway.saveConfig(item.key, item.value);
                    count++;
                }
                console.log(`✅ [BRIDGE] ${count} chaves migradas com sucesso.`);
            }

            await PersistenceGateway.saveConfig('migration_legacy_idb_done', true);
            return { migrated: true, count };
        } catch (e) {
            console.warn('⚠️ [BRIDGE] Falha na migração do IDB legado:', e);
            return { migrated: false, count: 0 };
        }
    },

    /**
     * RESET TOTAL: Limpa dados operacionais (F3B)
     */
    clearMainDatabase: async (): Promise<void> => {
        console.warn('🔥 [GATEWAY] Executando Wipe de dados operacionais...');
        await Promise.all([
            db.studentSessions.clear(),
            db.cachedExams.clear(),
            db.offlineQueue.clear(),
            db.migrationMetadata.clear()
        ]);
        console.log('✅ [GATEWAY] Wipe concluído.');
    }
};
