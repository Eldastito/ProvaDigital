import { useEffect } from 'react';

/**
 * Hook para gerenciar segurança de Fullscreen e Modo Quiosque
 * Protege contra saída acidental por teclado Android ou Câmera
 */
export const useFullscreenSecurity = (
    step: string,
    cameraActive: boolean,
    isSessionActive: boolean
) => {

    const enterKioskMode = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                console.log('🖥️ Fullscreen ativado (Kiosk Mode)');
            }
            // Tenta travar orientação se suportado
            if ((window.screen as any).orientation && (window.screen as any).orientation.lock) {
                // @ts-ignore
                try { await window.screen.orientation.lock('landscape'); } catch (e) { }
            }
        } catch (err) {
            console.warn('Fullscreen bloqueado pelo navegador:', err);
        }
    };

    // 1. Forçar Kiosk Mode ao entrar na prova
    useEffect(() => {
        if (step === 'EXAM' || step === 'READY') {
            enterKioskMode();

            const handleResize = () => {
                if (!document.fullscreenElement && (step === 'EXAM' || step === 'READY')) {
                    console.warn('⚠️ Saída de fullscreen detectada via resize (Teclado/Android UI)');
                    // Pequeno delay para recuperar
                    setTimeout(() => enterKioskMode(), 300);
                }
            };

            window.addEventListener('resize', handleResize);
            document.addEventListener('fullscreenchange', handleResize);

            // Heartbeat para garantir fullscreen
            const interval = setInterval(() => {
                if (!document.fullscreenElement && (step === 'EXAM')) {
                    console.log('💓 Kiosk Heartbeat: Restaurando fullscreen...');
                    enterKioskMode();
                }
            }, 5000);

            return () => {
                window.removeEventListener('resize', handleResize);
                document.removeEventListener('fullscreenchange', handleResize);
                clearInterval(interval);
            };
        }
    }, [step]);

    // 2. Restaurar Fullscreen após uso da Câmera (Android Bug Fix)
    // O Android sai do fullscreen ao pedir permissão ou abrir câmera nativa
    useEffect(() => {
        if (cameraActive && step === 'EXAM' && !document.fullscreenElement) {
            // Delay para garantir que a UI do browser assentou
            const timer = setTimeout(() => {
                console.log('📷 Câmera ativa: Restaurando fullscreen...');
                enterKioskMode();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [cameraActive, step]);

    return { enterKioskMode };
};
