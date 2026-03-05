import { Capacitor } from '@capacitor/core';
// Importações dinâmicas para evitar erro em web padrão
// npm install @capacitor/app @capacitor/keyboard

export class NativeBridgeService {
    private static instance: NativeBridgeService;
    private isNative: boolean;

    private constructor() {
        this.isNative = Capacitor.isNativePlatform();
        if (this.isNative) {
            this.setupListeners();
        }
    }

    static getInstance(): NativeBridgeService {
        if (!NativeBridgeService.instance) {
            NativeBridgeService.instance = new NativeBridgeService();
        }
        return NativeBridgeService.instance;
    }

    /**
     * Configura ouvintes nativos
     */
    private async setupListeners() {
        if (!this.isNative) return;

        try {
            // Interceptar botão voltar (Android)
            const { App } = await import('@capacitor/app');
            App.addListener('backButton', ({ canGoBack }) => {
                if (!canGoBack) {
                    // Se não há histórico, bloqueia saída direta se estiver em prova
                    const isExamInProgress = window.location.pathname.includes('/aluno/prova');
                    if (isExamInProgress) {
                        console.log('🔒 Tentativa de saída bloqueada pelo NativeBridge (Back Button)');
                        if (confirm('Você está em prova! Deseja realmente sair? (Isso será logado)')) {
                            App.exitApp();
                        }
                    } else {
                        App.exitApp();
                    }
                } else {
                    window.history.back();
                }
            });

            console.log('🚀 NativeBridge: Listeners configurados com sucesso');
        } catch (err) {
            console.warn('⚠️ NativeBridge: Erro ao carregar plugins nativos (talvez não instalados)', err);
        }
    }

    /**
     * Realiza o Handshake de Segurança da Sede (Passo 2)
     */
    async checkSecurityHealth(): Promise<{ isRooted: boolean; isBinaryIntact: boolean; isOfficialApp: boolean; osVersion: string }> {
        if (this.isNative) {
            try {
                // @ts-ignore
                const { Device } = await import('@capacitor/device');
                const info = await Device.getInfo();

                // Em um cenário real, usaríamos plugins de Root Detection (SafetyNet/Play Integrity)
                // Aqui simulamos uma validação de hardware e binário
                return {
                    isRooted: false, // Simulação: saudável
                    isBinaryIntact: true,
                    isOfficialApp: true,
                    osVersion: info.osVersion
                };
            } catch (e) {
                console.warn('⚠️ Erro ao realizar check de segurança nativo:', e);
            }
        }

        return {
            isRooted: false,
            isBinaryIntact: true,
            isOfficialApp: true,
            osVersion: 'Web-Emulator'
        };
    }

    /**
     * Simula o download e instalação do APK via rede local (Passo 1)
     */
    async downloadUpdateAPK(version: string): Promise<boolean> {
        console.log(`📦 Iniciando download do binário Forge v${version} via Mesh...`);
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('✅ APK baixado e instalado com sucesso!');
                resolve(true);
            }, 3000);
        });
    }

    /**
     * Tenta entrar em modo Kiosk (Android Lock Task)
     */
    async enterKioskMode() {
        if (!this.isNative) return;
        console.log('🔒 Solicitando modo Kiosk...');
        // Esta funcionalidade geralmente requer um plugin customizado ou MDM
        // Mas podemos simular ou usar um plugin de "Screen Pinning"
    }

    /**
     * Obtém o ID único do dispositivo (Serial Number / Hardware ID)
     */
    async getDeviceId(): Promise<string> {
        if (this.isNative) {
            try {
                // @ts-ignore
                const { Device } = await import('@capacitor/device');
                const info = await Device.getId();
                return info.identifier;
            } catch (e) {
                console.warn('⚠️ Erro ao obter Device ID nativo:', e);
            }
        }

        // Fallback para Web (Simulado: Serial Number persistente no browser)
        let webId = localStorage.getItem('forge_web_serial');
        if (!webId) {
            webId = `WEB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            localStorage.setItem('forge_web_serial', webId);
        }
        return webId;
    }

    /**
     * Verifica se está rodando nativamente
     */
    getIsNative(): boolean {
        return this.isNative;
    }
}

export const nativeBridge = NativeBridgeService.getInstance();
