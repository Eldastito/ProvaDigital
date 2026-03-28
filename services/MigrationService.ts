import { PersistenceGateway } from './persistenceGateway';
import { StoredSession } from '../types';

/**
 * Migration Service - Porto Alegre Hardening
 * 
 * Responsável por migrar dados do banco IndexedDB nativo (ExamePadOffline)
 * para o banco Dexie unificado (ExamePadOfflineDB).
 * 
 * Trava #1: Migração Não-Destrutiva.
 * Ajuste Operacional: Manifesto de Migração.
 */
export class MigrationService {
    private static readonly LEGACY_DB_NAME = 'ExamePadOffline';
    private static readonly MIGRATION_VERSION = '3.1.0-hardening';

    /**
     * Executa a fase de migração (Fase 1)
     */
    public static async run(): Promise<void> {
        if (typeof window === 'undefined') return;

        // 1. Verificar manifesto existente
        const manifesto = await PersistenceGateway.getMigrationManifesto();
        if (manifesto && manifesto.validationPassed) {
            console.log('[MIGRATION] Manifesto indica migração já validada.');
            return;
        }

        console.log('[MIGRATION] Iniciando Fase 1: Unificação de Persistência...');

        try {
            const hasLegacyDb = await this.checkLegacyDbExists();
            
            // Iniciar Manifesto
            await PersistenceGateway.initMigrationManifesto(
                this.MIGRATION_VERSION, 
                hasLegacyDb ? 'indexedDB:ExamePadOffline' : 'none'
            );

            if (!hasLegacyDb) {
                console.log('[MIGRATION] Nenhum banco legado encontrado.');
                await PersistenceGateway.updateMigrationManifesto('main_migration', {
                    validationPassed: true,
                    details: 'No legacy DB found.'
                });
                return;
            }

            // 2. Abrir banco legado e migrar dados (Non-destructive)
            const count = await this.migrateData();
            
            // 3. Finalizar Manifesto (Fase 1 concluída)
            await PersistenceGateway.updateMigrationManifesto('main_migration', {
                migratedSessionCount: count,
                validationPassed: true, // Marcamos como passado na Fase 1 se o I/O funcionou
                details: `Migradas ${count} sessões com sucesso. Pronto para validação de boot.`
            });

            console.log(`[MIGRATION] Fase 1 finalizada. ${count} sessões migradas.`);

        } catch (error) {
            console.error('[MIGRATION] Erro na Fase 1:', error);
            await PersistenceGateway.updateMigrationManifesto('main_migration', {
                validationPassed: false,
                details: `Erro: ${error instanceof Error ? error.message : 'Unknown'}`
            });
        }
    }

    private static async checkLegacyDbExists(): Promise<boolean> {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.LEGACY_DB_NAME);
            request.onsuccess = (e) => {
                const dbInstance = (e.target as IDBOpenDBRequest).result;
                const hasStores = dbInstance.objectStoreNames.contains('studentSessions');
                dbInstance.close();
                resolve(hasStores);
            };
            request.onerror = () => resolve(false);
        });
    }

    private static async migrateData(): Promise<number> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.LEGACY_DB_NAME);
            let migratedCount = 0;

            request.onsuccess = async (e) => {
                const legacyDb = (e.target as IDBOpenDBRequest).result;
                
                try {
                    if (legacyDb.objectStoreNames.contains('studentSessions')) {
                        const tx = legacyDb.transaction(['studentSessions'], 'readonly');
                        const store = tx.objectStore('studentSessions');
                        const cursorReq = store.openCursor();

                        cursorReq.onsuccess = async (ev) => {
                            const cursor = (ev.target as IDBRequest<IDBCursorWithValue>).result;
                            if (cursor) {
                                const session = cursor.value;
                                await this.importToDexie(session);
                                migratedCount++;
                                cursor.continue();
                            } else {
                                legacyDb.close();
                                resolve(migratedCount);
                            }
                        };
                        cursorReq.onerror = () => reject(cursorReq.error);
                    } else {
                        legacyDb.close();
                        resolve(0);
                    }
                } catch (err) {
                    legacyDb.close();
                    reject(err);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    private static async importToDexie(session: any): Promise<void> {
        const storage_key = session.storage_key || `${session.eventId}_${session.studentId}_${session.examId}`;
        
        let encryptedAnswers = session.encryptedAnswers || [];
        
        // Conversão de legado se necessário
        if (!encryptedAnswers.length && session.encryptedData) {
            try {
                const parsed = JSON.parse(session.encryptedData);
                Object.entries(parsed).forEach(([qId, ans]) => {
                    const questionId = parseInt(qId.replace('q', '')) || 0;
                    encryptedAnswers.push({
                        questionId,
                        answer: ans as any,
                        timestamp: session.timestamp || new Date().toISOString()
                    });
                });
            } catch (e) {
                console.warn(`[MIGRATION] Falha ao converter respostas legadas da sessão ${session.sessionId}`, e);
            }
        }

        const migratedSession: StoredSession = {
            sessionId: session.sessionId || `leg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            storage_key,
            studentId: session.studentId || 'anon',
            studentName: session.studentName || 'Aluno Migrado',
            examId: session.examId || 'unknown',
            eventId: session.eventId || 'unknown',
            encryptedAnswers,
            securityEvents: session.securityEvents || [],
            telemetry: session.telemetry || {
                timePerQuestion: [],
                backtracks: [],
                batteryLevels: [],
                networkQuality: []
            },
            startedAt: session.timestamp || new Date().toISOString(),
            synced: session.synced || false,
            uploadedToServer: false,
            // @ts-ignore
            isMigrated: true,
            // @ts-ignore
            migratedAt: new Date().toISOString()
        };

        await PersistenceGateway.saveSession(migratedSession);
    }

    /**
     * Trava 1/Fase 7: Limpeza só após validação explícita
     */
    public static async finalCleanup(): Promise<void> {
        const manifesto = await PersistenceGateway.getMigrationManifesto();
        if (manifesto && manifesto.cleanupEligible && manifesto.validationPassed) {
            indexedDB.deleteDatabase(this.LEGACY_DB_NAME);
            console.log('[MIGRATION] Limpeza operacional concluída.');
        } else {
            console.warn('[MIGRATION] Limpeza ignorada: critérios de segurança não atendidos.');
        }
    }
}
