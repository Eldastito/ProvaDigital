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
     * Tenta entrar em modo Kiosk (Android Lock Task)
     */
    async enterKioskMode() {
        if (!this.isNative) return;
        console.log('🔒 Solicitando modo Kiosk...');
        // Esta funcionalidade geralmente requer um plugin customizado ou MDM
        // Mas podemos simular ou usar um plugin de "Screen Pinning"
    }

    /**
     * Verifica se está rodando nativamente
     */
    getIsNative(): boolean {
        return this.isNative;
    }
}

export const nativeBridge = NativeBridgeService.getInstance();
