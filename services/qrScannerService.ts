/**
 * QR Scanner Service - Detecção automática de QR Codes via câmera
 * 
 * Usa jsQR para processar frames da câmera em tempo real.
 * Suporta câmera frontal e traseira.
 * 
 * Uso:
 * ```typescript
 * const scanner = new QRScannerService();
 * await scanner.start(videoElement, (data) => {
 *   console.log('QR Code detectado:', data);
 * });
 * ```
 */

import jsQR from 'jsqr';

export interface QRScannerConfig {
    /** Elemento de vídeo para exibir câmera */
    videoElement: HTMLVideoElement;
    /** Canvas para processamento (invisível) */
    canvasElement?: HTMLCanvasElement;
    /** Callback quando QR Code é detectado */
    onDetected: (data: string) => void;
    /** Callback para erros */
    onError?: (error: Error) => void;
    /** Usar câmera traseira (padrão: true) */
    useFrontCamera?: boolean;
    /** Intervalo de scan em ms (padrão: 100ms = 10fps) */
    scanInterval?: number;
    /** Mostrar overlay de debug (quadrado verde quando detectar) */
    showDebugOverlay?: boolean;
}

export class QRScannerService {
    private stream: MediaStream | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private context: CanvasRenderingContext2D | null = null;
    private scanIntervalId: number | null = null;
    private isScanning = false;

    /**
     * Inicia o scanner de QR Code
     */
    async start(config: QRScannerConfig): Promise<void> {
        try {
            // 1. Obter acesso à câmera
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: config.useFrontCamera === true ? 'user' : 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // 2. Conectar stream ao vídeo
            config.videoElement.srcObject = this.stream;
            await config.videoElement.play();

            // 3. Preparar canvas para processamento
            this.canvas = config.canvasElement || document.createElement('canvas');
            this.context = this.canvas.getContext('2d', { willReadFrequently: true });

            if (!this.context) {
                throw new Error('Não foi possível criar contexto 2D do canvas');
            }

            // 4. Iniciar loop de detecção
            this.isScanning = true;
            const interval = config.scanInterval || 100;

            this.scanIntervalId = window.setInterval(() => {
                this.scanFrame(config);
            }, interval);

            console.log('✅ QR Scanner iniciado');

        } catch (error) {
            console.error('❌ Erro ao iniciar scanner:', error);
            if (config.onError) {
                config.onError(error as Error);
            }
            throw error;
        }
    }

    /**
     * Processa um frame da câmera em busca de QR Code
     */
    private scanFrame(config: QRScannerConfig): void {
        if (!this.isScanning || !this.canvas || !this.context) return;

        const video = config.videoElement;

        // Verificar se vídeo está pronto
        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

        // Ajustar tamanho do canvas
        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;

        // Copiar frame do vídeo para canvas
        this.context.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        // Obter dados de imagem
        const imageData = this.context.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        // Tentar detectar QR Code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert' // Performance: não tentar inverter cores
        });

        if (code) {
            console.log('📱 QR Code detectado:', code.data.substring(0, 50) + '...');

            // Desenhar overlay de debug (opcional)
            if (config.showDebugOverlay) {
                this.drawDebugOverlay(code, this.context);
            }

            // Callback com dados
            config.onDetected(code.data);

            // Pause brevemente após detecção para evitar múltiplas leituras
            this.pause(500);
        }
    }

    /**
     * Desenha quadrado verde ao redor do QR Code detectado
     */
    private drawDebugOverlay(
        code: { location: { topLeftCorner: any; topRightCorner: any; bottomRightCorner: any; bottomLeftCorner: any } },
        ctx: CanvasRenderingContext2D
    ): void {
        const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = code.location;

        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(topLeftCorner.x, topLeftCorner.y);
        ctx.lineTo(topRightCorner.x, topRightCorner.y);
        ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
        ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
        ctx.closePath();
        ctx.stroke();
    }

    /**
     * Pausa o scanner temporariamente (útil após detecção)
     */
    pause(durationMs: number): void {
        this.isScanning = false;
        setTimeout(() => {
            this.isScanning = true;
        }, durationMs);
    }

    /**
     * Para o scanner e libera recursos
     */
    stop(): void {
        this.isScanning = false;

        // Parar loop de detecção
        if (this.scanIntervalId !== null) {
            clearInterval(this.scanIntervalId);
            this.scanIntervalId = null;
        }

        // Parar stream de vídeo
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        console.log('🛑 QR Scanner parado');
    }

    /**
     * Retorna se o scanner está ativo
     */
    isActive(): boolean {
        return this.isScanning;
    }

    /**
     * Troca entre câmera frontal e traseira
     */
    async switchCamera(config: QRScannerConfig): Promise<void> {
        this.stop();
        const newConfig = {
            ...config,
            useFrontCamera: !config.useFrontCamera
        };
        await this.start(newConfig);
    }
}

// Instância singleton (opcional - útil para gerenciar estado global)
export const qrScanner = new QRScannerService();
