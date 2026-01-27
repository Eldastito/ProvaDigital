/**
 * Tablet Provisioning Service
 * 
 * Gerencia o provisionamento de tablets para eventos:
 * - Detecta dados de evento anterior
 * - Limpa automaticamente antes de novo evento
 * - Configura modo (Router/Professor/Coordenador/Aluno)
 * - Baixa dados do evento
 */

import { E2EEncryptionService } from './security/e2eEncryptionService';

export type TabletMode = 'ROUTER' | 'PROFESSOR' | 'COORDINATOR' | 'STUDENT';

export interface EventData {
    eventId: string;
    eventName: string;
    date: string;
    schoolId: string;
    schoolName: string;

    // Dados específicos por modo
    exams?: any[]; // Para Professor/Aluno
    questions?: any[]; // Para Aluno
    studentList?: any[]; // Para Professor
    classrooms?: any[]; // Para Coordenador
}

export interface ProvisioningConfig {
    tabletId: string;
    mode: TabletMode;
    eventData: EventData;

    // Configurações específicas de rede (se Router)
    networkConfig?: {
        ssid: string;
        password: string;
        channel: number;
        maxClients: number;
    };

    // Tokens de segurança (se Professor/Aluno)
    securityTokens?: {
        sessionToken: string;
        meshKey: string;
        hmacSecret: string;
    };
}

export interface ProvisioningResult {
    success: boolean;
    tabletId: string;
    mode: TabletMode;
    eventId: string;
    previousEventCleaned: boolean;
    dataDownloaded: boolean;
    errors?: string[];
}

export class TabletProvisioningService {

    /**
     * Provisiona um tablet para um evento
     */
    static async provisionTablet(config: ProvisioningConfig): Promise<ProvisioningResult> {
        const errors: string[] = [];
        let previousEventCleaned = false;
        let dataDownloaded = false;

        try {
            // 1. Verificar se há evento anterior
            const previousEvent = await this.detectPreviousEvent(config.tabletId);

            if (previousEvent) {
                console.log(`🗑️ Evento anterior detectado: ${previousEvent.eventId}`);
                await this.cleanPreviousEvent(config.tabletId, previousEvent);
                previousEventCleaned = true;
            }

            // 2. Configurar modo do tablet
            await this.configureMo de(config.tabletId, config.mode);

            // 3. Baixar dados do evento
            await this.downloadEventData(config);
            dataDownloaded = true;

            // 4. Configurações específicas por modo
            switch (config.mode) {
                case 'ROUTER':
                    if (config.networkConfig) {
                        await this.configureRouter(config.tabletId, config.networkConfig);
                    }
                    break;

                case 'PROFESSOR':
                case 'STUDENT':
                    if (config.securityTokens) {
                        await this.configureSecurityTokens(config.tabletId, config.securityTokens);
                    }
                    break;
            }

            // 5. Marcar como "PREPARADO"
            await this.markAsPrepared(config.tabletId, config.eventData.eventId);

            console.log(`✅ Tablet ${config.tabletId} provisionado como ${config.mode}`);

            return {
                success: true,
                tabletId: config.tabletId,
                mode: config.mode,
                eventId: config.eventData.eventId,
                previousEventCleaned,
                dataDownloaded
            };

        } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Erro desconhecido');

            return {
                success: false,
                tabletId: config.tabletId,
                mode: config.mode,
                eventId: config.eventData.eventId,
                previousEventCleaned,
                dataDownloaded,
                errors
            };
        }
    }

    /**
     * Detecta se há dados de evento anterior no tablet
     */
    private static async detectPreviousEvent(tabletId: string): Promise<EventData | null> {
        try {
            // Buscar no IndexedDB local
            const db = await this.openDatabase();
            const tx = db.transaction(['config'], 'readonly');
            const store = tx.objectStore('config');
            const config = await store.get('currentEvent');

            return config || null;
        } catch {
            return null;
        }
    }

    /**
     * Limpa dados do evento anterior
     */
    private static async cleanPreviousEvent(tabletId: string, previousEvent: EventData): Promise<void> {
        console.log(`🗑️ Limpando dados do evento: ${previousEvent.eventId}`);

        const db = await this.openDatabase();

        // Deletar stores do evento anterior
        const storesToClear = [
            'studentSessions',
            'questionCache',
            'securityLog',
            'telemetry',
            'networkCache',
            'config'
        ];

        for (const storeName of storesToClear) {
            try {
                const tx = db.transaction([storeName], 'readwrite');
                const store = tx.objectStore(storeName);
                await store.clear();
                console.log(`  ✅ Store ${storeName} limpo`);
            } catch (error) {
                console.warn(`  ⚠️ Erro ao limpar ${storeName}:`, error);
            }
        }

        console.log(`✅ Dados do evento ${previousEvent.eventId} removidos`);
    }

    /**
     * Configura o modo do tablet
     */
    private static async configureMode(tabletId: string, mode: TabletMode): Promise<void> {
        const db = await this.openDatabase();
        const tx = db.transaction(['config'], 'readwrite');
        const store = tx.objectStore('config');

        await store.put({
            key: 'tabletMode',
            value: mode,
            configuredAt: new Date().toISOString()
        });

        console.log(`📱 Tablet ${tabletId} configurado como ${mode}`);
    }

    /**
     * Baixa dados do evento para o tablet
     */
    private static async downloadEventData(config: ProvisioningConfig): Promise<void> {
        console.log(`⬇️ Baixando dados do evento: ${config.eventData.eventId}`);

        const db = await this.openDatabase();
        const tx = db.transaction(['config', 'questionCache'], 'readwrite');

        // Salvar configuração do evento
        const configStore = tx.objectStore('config');
        await configStore.put({
            key: 'currentEvent',
            value: config.eventData
        });

        // Salvar questões (se aplicável)
        if (config.eventData.questions) {
            const questionStore = tx.objectStore('questionCache');
            for (const question of config.eventData.questions) {
                await questionStore.put(question);
            }
            console.log(`  ✅ ${config.eventData.questions.length} questões baixadas`);
        }

        console.log(`✅ Dados do evento baixados`);
    }

    /**
     * Configura tablet como roteador Wi-Fi
     */
    private static async configureRouter(
        tabletId: string,
        networkConfig: ProvisioningConfig['networkConfig']
    ): Promise<void> {
        if (!networkConfig) return;

        const db = await this.openDatabase();
        const tx = db.transaction(['config'], 'readwrite');
        const store = tx.objectStore('config');

        await store.put({
            key: 'networkConfig',
            value: networkConfig
        });

        console.log(`📡 Roteador configurado: SSID=${networkConfig.ssid}`);
    }

    /**
     * Configura tokens de segurança para mesh
     */
    private static async configureSecurityTokens(
        tabletId: string,
        tokens: ProvisioningConfig['securityTokens']
    ): Promise<void> {
        if (!tokens) return;

        const db = await this.openDatabase();
        const tx = db.transaction(['config'], 'readwrite');
        const store = tx.objectStore('config');

        await store.put({
            key: 'securityTokens',
            value: tokens
        });

        console.log(`🔐 Tokens de segurança configurados`);
    }

    /**
     * Marca tablet como preparado
     */
    private static async markAsPrepared(tabletId: string, eventId: string): Promise<void> {
        const db = await this.openDatabase();
        const tx = db.transaction(['config'], 'readwrite');
        const store = tx.objectStore('config');

        await store.put({
            key: 'provisioningStatus',
            value: {
                status: 'PREPARED',
                tabletId,
                eventId,
                preparedAt: new Date().toISOString()
            }
        });
    }

    /**
     * Abre conexão com IndexedDB
     */
    private static async openDatabase(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ExamePadOffline', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Criar stores se não existirem
                if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('studentSessions')) {
                    db.createObjectStore('studentSessions', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('questionCache')) {
                    db.createObjectStore('questionCache', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('securityLog')) {
                    db.createObjectStore('securityLog', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('telemetry')) {
                    db.createObjectStore('telemetry', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('networkCache')) {
                    db.createObjectStore('networkCache', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Reseta tablet para estado de fábrica (emergência)
     */
    static async factoryReset(tabletId: string): Promise<void> {
        console.warn(`⚠️ FACTORY RESET - Tablet ${tabletId}`);

        try {
            // Deletar todo o banco de dados
            await new Promise<void>((resolve, reject) => {
                const request = indexedDB.deleteDatabase('ExamePadOffline');
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            console.log(`✅ Factory reset completo`);
        } catch (error) {
            console.error(`❌ Erro no factory reset:`, error);
            throw error;
        }
    }
}
