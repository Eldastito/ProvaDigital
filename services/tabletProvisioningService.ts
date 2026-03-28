/**
 * Tablet Provisioning Service
 * 
 * Gerencia o provisionamento de tablets para eventos:
 * - Detecta dados de evento anterior
 * - Limpa automaticamente antes de novo evento
 * - Configura modo (Router/Professor/Coordenador/Aluno)
 * - Baixa dados do evento
 */

import { PersistenceGateway } from './persistenceGateway';

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
            // 0. F3B: Migrar dados de IDB legado se necessário
            await PersistenceGateway.migrateLegacyProvisioning();

            // 1. Verificar se há evento anterior
            const previousEvent = await this.detectPreviousEvent();

            if (previousEvent) {
                console.log(`🗑️ Evento anterior detectado: ${previousEvent.eventId}`);
                await this.cleanPreviousEvent();
                previousEventCleaned = true;
            }

            // 2. Configurar modo do tablet
            await this.configureMode(config.mode);

            // 3. Baixar dados do evento
            await this.downloadEventData(config);
            dataDownloaded = true;

            // 4. Configurações específicas por modo
            switch (config.mode) {
                case 'ROUTER':
                    if (config.networkConfig) {
                        await this.configureRouter(config.networkConfig);
                    }
                    break;

                case 'PROFESSOR':
                case 'STUDENT':
                    if (config.securityTokens) {
                        await this.configureSecurityTokens(config.securityTokens);
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
    private static async detectPreviousEvent(): Promise<EventData | null> {
        const config = await PersistenceGateway.getConfig('currentEvent');
        return config || null;
    }

    /**
     * Limpa dados do evento anterior
     */
    private static async cleanPreviousEvent(): Promise<void> {
        console.log(`🗑️ Limpando dados do evento anterior (PersistenceGateway)...`);
        
        // Limpar chaves de configuração
        const keysToClear = [
            'currentEvent',
            'securityTokens',
            'networkConfig',
            'provisioningStatus',
            'tabletMode'
        ];

        for (const key of keysToClear) {
            await PersistenceGateway.deleteConfig(key);
        }

        console.log(`✅ Dados do evento removidos do storage unificado`);
    }

    /**
     * Configura o modo do tablet
     */
    private static async configureMode(mode: TabletMode): Promise<void> {
        await PersistenceGateway.saveConfig('tabletMode', mode);
        console.log(`📱 Tablet configurado como ${mode} via Gateway`);
    }

    /**
     * Baixa dados do evento para o tablet
     */
    private static async downloadEventData(config: ProvisioningConfig): Promise<void> {
        console.log(`⬇️ Salvando dados do evento via Gateway: ${config.eventData.eventId}`);
        await PersistenceGateway.saveConfig('currentEvent', config.eventData);

        console.log(`✅ Dados do evento salvos`);
    }

    /**
     * Configura tablet como roteador Wi-Fi
     */
    private static async configureRouter(
        networkConfig: ProvisioningConfig['networkConfig']
    ): Promise<void> {
        await PersistenceGateway.saveConfig('networkConfig', networkConfig);
    }

    /**
     * Configura tokens de segurança para mesh
     */
    private static async configureSecurityTokens(
        tokens: ProvisioningConfig['securityTokens']
    ): Promise<void> {
        await PersistenceGateway.saveConfig('securityTokens', tokens);
    }

    /**
     * Marca tablet como preparado
     */
    private static async markAsPrepared(tabletId: string, eventId: string): Promise<void> {
        await PersistenceGateway.saveConfig('provisioningStatus', {
            status: 'PREPARED',
            tabletId,
            eventId,
            preparedAt: new Date().toISOString()
        });
    }

    /**
     * Reseta tablet para estado de fábrica (emergência)
     */
    static async factoryReset(tabletId: string): Promise<void> {
        console.warn(`⚠️ FACTORY RESET - Tablet ${tabletId}`);
        await PersistenceGateway.deleteConfig('currentEvent');
        await PersistenceGateway.deleteConfig('securityTokens');
        await PersistenceGateway.deleteConfig('provisioningStatus');
        await PersistenceGateway.clearMainDatabase();
        console.log(`✅ Factory reset completo via Persistence Engine`);
    }

    /**
     * Obtém os tokens de segurança provisionados (F3A/F3B Unificado)
     */
    static async getSecurityTokens(): Promise<ProvisioningConfig['securityTokens'] | null> {
        return await PersistenceGateway.getConfig('securityTokens');
    }
}
