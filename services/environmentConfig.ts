/**
 * Environment Configuration Service (SST - Single Source of Truth)
 * 
 * Centraliza as configurações de infraestrutura local, portas e endpoints
 * da plataforma FORGE, garantindo o "Mode-Aware Boot".
 * 
 * DESIGN NOTE: Este serviço é a fonte única para portas e endpoints.
 * Hardcodes em outros arquivos devem ser removidos.
 */

export type AppMode = 'PRODUCTION' | 'WEB_DEMO' | 'DEVELOPMENT';

export interface NetworkConfig {
    port: number;
    signalingPort: number;
    gatewayPort: number;
    host: string;
    isMeshEnabled: boolean;
}

export class EnvironmentConfigService {
    private static instance: EnvironmentConfigService;
    private currentMode: AppMode = 'DEVELOPMENT';

    private constructor() {
        this.detectMode();
    }

    public static getInstance(): EnvironmentConfigService {
        if (!EnvironmentConfigService.instance) {
            EnvironmentConfigService.instance = new EnvironmentConfigService();
        }
        return EnvironmentConfigService.instance;
    }

    /**
     * Detecta o modo de execução baseado em flags de ambiente ou URL
     */
    private detectMode(): void {
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const isDemo = params.get('demo') === 'true' || params.get('mode') === 'demo';
        
        // Em ambiente nativo (Windows/Android), assumimos PRODUÇÃO por default se não for demo
        const isNative = typeof window !== 'undefined' && (window as any).isNativeApp === true;

        if (isDemo) {
            this.currentMode = 'WEB_DEMO';
        } else if (isNative) {
            this.currentMode = 'PRODUCTION';
        } else {
            this.currentMode = 'DEVELOPMENT';
        }

        console.log(`[FORGE][ENVIRONMENT] Detectado Modo: ${this.currentMode}`);
    }

    public getMode(): AppMode {
        return this.currentMode;
    }

    /**
     * Retorna a configuração de rede consolidada
     */
    public getNetworkConfig(): NetworkConfig {
        // Fonte Única de Verdade para Portas
        const BASE_PORT = 8080;
        const GATEWAY_PORT = 3001; // Mantido por compatibilidade de bridge

        return {
            port: BASE_PORT,
            signalingPort: BASE_PORT,
            gatewayPort: GATEWAY_PORT,
            host: '192.168.43.1', // IP padrão do hotspot
            isMeshEnabled: this.currentMode !== 'WEB_DEMO'
        };
    }

    /**
     * Validação de Boot Mode-Aware
     * Lança erro ou avisa dependendo do modo.
     */
    public validateBoot(): { isValid: boolean; error?: string } {
        const config = this.getNetworkConfig();
        
        // 1. Em PRODUÇÃO, falha se parâmetros críticos estiverem faltando
        if (this.currentMode === 'PRODUCTION') {
            if (!config.port || !config.host) {
                return { isValid: false, error: 'CRITICAL_INFRA_MISSING: Produção exige host e porta válidos.' };
            }
        }

        // 2. Em DEMO, degradação controlada
        if (this.currentMode === 'WEB_DEMO') {
            console.warn('[FORGE][BOOT] Modo DEMO: Mesh Network desativado/mocked.');
        }

        // 3. Em DEV, warning
        if (this.currentMode === 'DEVELOPMENT') {
            console.log('%c[FORGE][BOOT] Modo DEV: Iniciando com configurações padrão.', 'color: orange; font-weight: bold;');
        }

        return { isValid: true };
    }

    /**
     * Retorna URL de sinalização consolidada
     */
    public getSignalingUrl(): string {
        const config = this.getNetworkConfig();
        // Fallback para localhost em dev/web
        const host = this.currentMode === 'PRODUCTION' ? config.host : 'localhost';
        return `http://${host}:${config.port}`;
    }
}

export const envConfig = EnvironmentConfigService.getInstance();
