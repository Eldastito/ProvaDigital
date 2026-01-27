/**
 * Wi-Fi Hotspot Service
 * 
 * Transforma o tablet em um roteador Wi-Fi local para criar
 * rede mesh offline entre tablets.
 * 
 * Sprint 2 - Fase 1
 */

// Tipos
export interface HotspotConfig {
    ssid: string;
    password: string;
    band?: '2.4GHz' | '5GHz';
    maxConnections?: number;
}

export interface HotspotStatus {
    isActive: boolean;
    ssid: string;
    connectedDevices: number;
    ipAddress?: string;
}

export interface ConnectedDevice {
    macAddress: string;
    ipAddress: string;
    hostname?: string;
    connectedAt: number;
}

/**
 * Serviço de Hotspot Wi-Fi
 * 
 * IMPORTANTE: Este serviço requer plugins nativos do Capacitor.
 * Para funcionar em produção, é necessário:
 * 
 * 1. Instalar plugin de hotspot:
 *    npm install @capacitor-community/hotspot
 * 
 * 2. Adicionar permissões no AndroidManifest.xml:
 *    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE"/>
 *    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
 *    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
 *    <uses-permission android:name="android.permission.WRITE_SETTINGS"/>
 * 
 * 3. Para iOS, adicionar em Info.plist:
 *    <key>NSLocalNetworkUsageDescription</key>
 *    <string>Necessário para criar rede local entre tablets</string>
 */
export class WifiHotspotService {
    private static instance: WifiHotspotService;
    private isHotspotActive: boolean = false;
    private currentConfig: HotspotConfig | null = null;

    private constructor() { }

    static getInstance(): WifiHotspotService {
        if (!WifiHotspotService.instance) {
            WifiHotspotService.instance = new WifiHotspotService();
        }
        return WifiHotspotService.instance;
    }

    /**
     * Gera SSID único para o evento
     */
    static generateSSID(schoolId: string, eventId: string): string {
        const shortEventId = eventId.slice(-6).toUpperCase();
        return `ExamePad-${schoolId}-${shortEventId}`;
    }

    /**
     * Gera senha segura aleatória
     */
    static generatePassword(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem caracteres ambíguos
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Cria hotspot Wi-Fi
     */
    async createHotspot(config: HotspotConfig): Promise<HotspotStatus> {
        try {
            console.log('🔥 Criando hotspot Wi-Fi:', config.ssid);

            // Validação
            if (!config.ssid || config.ssid.length < 1) {
                throw new Error('SSID inválido');
            }

            if (!config.password || config.password.length < 8) {
                throw new Error('Senha deve ter no mínimo 8 caracteres');
            }

            // ===== IMPLEMENTAÇÃO NATIVA (REQUER PLUGIN) =====
            // Descomente quando o plugin estiver instalado:

            /*
            import { Hotspot } from '@capacitor-community/hotspot';
            
            const result = await Hotspot.create({
              ssid: config.ssid,
              password: config.password,
              band: config.band || '2.4GHz',
              maxConnections: config.maxConnections || 10
            });
            
            if (!result.success) {
              throw new Error(result.error || 'Falha ao criar hotspot');
            }
            */

            // ===== SIMULAÇÃO (DESENVOLVIMENTO) =====
            // Simula criação bem-sucedida
            await new Promise(resolve => setTimeout(resolve, 1500));

            this.isHotspotActive = true;
            this.currentConfig = config;

            const status: HotspotStatus = {
                isActive: true,
                ssid: config.ssid,
                connectedDevices: 0,
                ipAddress: '192.168.43.1' // IP padrão do hotspot Android
            };

            console.log('✅ Hotspot criado com sucesso:', status);

            // Salvar configuração no LocalStorage
            this.saveConfig(config);

            return status;

        } catch (error: any) {
            console.error('❌ Erro ao criar hotspot:', error);
            throw new Error(`Falha ao criar hotspot: ${error.message}`);
        }
    }

    /**
     * Desativa hotspot
     */
    async stopHotspot(): Promise<void> {
        try {
            console.log('⏹️ Desativando hotspot...');

            // ===== IMPLEMENTAÇÃO NATIVA =====
            /*
            import { Hotspot } from '@capacitor-community/hotspot';
            await Hotspot.stop();
            */

            // ===== SIMULAÇÃO =====
            await new Promise(resolve => setTimeout(resolve, 500));

            this.isHotspotActive = false;
            this.currentConfig = null;

            // Limpar configuração salva
            localStorage.removeItem('hotspot_config');

            console.log('✅ Hotspot desativado');

        } catch (error: any) {
            console.error('❌ Erro ao desativar hotspot:', error);
            throw new Error(`Falha ao desativar hotspot: ${error.message}`);
        }
    }

    /**
     * Verifica se hotspot está ativo
     */
    async getStatus(): Promise<HotspotStatus> {
        try {
            // ===== IMPLEMENTAÇÃO NATIVA =====
            /*
            import { Hotspot } from '@capacitor-community/hotspot';
            const status = await Hotspot.getStatus();
            return status;
            */

            // ===== SIMULAÇÃO =====
            if (!this.isHotspotActive || !this.currentConfig) {
                return {
                    isActive: false,
                    ssid: '',
                    connectedDevices: 0
                };
            }

            return {
                isActive: true,
                ssid: this.currentConfig.ssid,
                connectedDevices: Math.floor(Math.random() * 5), // Simula 0-4 dispositivos
                ipAddress: '192.168.43.1'
            };

        } catch (error: any) {
            console.error('❌ Erro ao obter status:', error);
            return {
                isActive: false,
                ssid: '',
                connectedDevices: 0
            };
        }
    }

    /**
     * Lista dispositivos conectados
     */
    async getConnectedDevices(): Promise<ConnectedDevice[]> {
        try {
            // ===== IMPLEMENTAÇÃO NATIVA =====
            /*
            import { Hotspot } from '@capacitor-community/hotspot';
            const devices = await Hotspot.getConnectedDevices();
            return devices;
            */

            // ===== SIMULAÇÃO =====
            if (!this.isHotspotActive) {
                return [];
            }

            // Simula alguns dispositivos conectados
            const mockDevices: ConnectedDevice[] = [
                {
                    macAddress: 'AA:BB:CC:DD:EE:01',
                    ipAddress: '192.168.43.101',
                    hostname: 'Professor-Tablet',
                    connectedAt: Date.now() - 120000
                },
                {
                    macAddress: 'AA:BB:CC:DD:EE:02',
                    ipAddress: '192.168.43.102',
                    hostname: 'Student-Tablet-01',
                    connectedAt: Date.now() - 60000
                }
            ];

            return mockDevices;

        } catch (error: any) {
            console.error('❌ Erro ao listar dispositivos:', error);
            return [];
        }
    }

    /**
     * Verifica se o dispositivo suporta hotspot
     */
    async isHotspotSupported(): Promise<boolean> {
        try {
            // ===== IMPLEMENTAÇÃO NATIVA =====
            /*
            import { Hotspot } from '@capacitor-community/hotspot';
            const supported = await Hotspot.isSupported();
            return supported;
            */

            // ===== SIMULAÇÃO =====
            // Assume que está rodando em Android/iOS
            const platform = navigator.userAgent;
            return platform.includes('Android') || platform.includes('iPhone');

        } catch (error) {
            console.error('❌ Erro ao verificar suporte:', error);
            return false;
        }
    }

    /**
     * Salva configuração no LocalStorage
     */
    private saveConfig(config: HotspotConfig): void {
        try {
            const configData = {
                ssid: config.ssid,
                password: config.password,
                band: config.band,
                maxConnections: config.maxConnections,
                createdAt: Date.now()
            };

            localStorage.setItem('hotspot_config', JSON.stringify(configData));

        } catch (error) {
            console.warn('⚠️ Erro ao salvar configuração:', error);
        }
    }

    /**
     * Recupera configuração salva
     */
    getSavedConfig(): HotspotConfig | null {
        try {
            const saved = localStorage.getItem('hotspot_config');
            if (!saved) return null;

            const config = JSON.parse(saved);

            // Verifica se não está expirada (24h)
            const age = Date.now() - config.createdAt;
            if (age > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('hotspot_config');
                return null;
            }

            return {
                ssid: config.ssid,
                password: config.password,
                band: config.band,
                maxConnections: config.maxConnections
            };

        } catch (error) {
            console.warn('⚠️ Erro ao recuperar configuração:', error);
            return null;
        }
    }

    /**
     * Reinicia hotspot (útil após mudanças)
     */
    async restartHotspot(): Promise<HotspotStatus> {
        if (!this.currentConfig) {
            throw new Error('Nenhuma configuração ativa para reiniciar');
        }

        await this.stopHotspot();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.createHotspot(this.currentConfig);
    }
}

// Export singleton instance
export const wifiHotspotService = WifiHotspotService.getInstance();
