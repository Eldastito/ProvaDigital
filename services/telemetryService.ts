/**
 * Telemetry Service
 * 
 * Serviço de telemetria para enviar dados do aluno ao professor
 * via rede mesh em tempo real.
 * 
 * Sprint 2 - Fase 5
 */

import { getMeshNetwork } from './meshNetworkService';

// Tipos
export interface TelemetryData {
    studentId: string;
    studentName: string;
    examId: string;
    eventId: string;
    currentQuestion: number;
    answeredCount: number;
    totalQuestions: number;
    violations: number;
    lastViolation?: string;
    batteryLevel: number;
    lastQuestion: number; // F3C Tracking
    timestamp: number;
    metadata?: any;
}

export interface SecurityEvent {
    studentId: string;
    eventType: 'TAB_SWITCH' | 'MULTIPLE_FACES' | 'NO_FACE' | 'COPY_PASTE' | 'SCREEN_SHARE' | 'OTHER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    timestamp: number;
    metadata?: any;
}

/**
 * Serviço de Telemetria
 * 
 * Envia dados do aluno automaticamente via mesh network.
 */
export class TelemetryService {
    private mesh = getMeshNetwork();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private telemetryInterval: NodeJS.Timeout | null = null;
    private isActive: boolean = false;

    // Dados atuais do aluno
    private currentData: TelemetryData | null = null;
    private violationCount: number = 0;
    private lastViolationType: string | null = null;

    /**
     * Iniciar envio de telemetria
     */
    async start(config: {
        studentId: string;
        studentName: string;
        examId: string;
        eventId: string;
        totalQuestions: number;
    }): Promise<void> {
        try {
            console.log('📡 Iniciando telemetria para:', config.studentName);

            // Inicializar dados
            this.currentData = {
                studentId: config.studentId,
                studentName: config.studentName,
                examId: config.examId,
                eventId: config.eventId,
                currentQuestion: 0,
                answeredCount: 0,
                totalQuestions: config.totalQuestions,
                violations: 0,
                batteryLevel: 100,
                lastQuestion: 0,
                timestamp: Date.now()
            };

            this.isActive = true;

            // Iniciar heartbeat (a cada 5 segundos)
            this.startHeartbeat();

            // Iniciar telemetria detalhada (a cada 10 segundos)
            this.startTelemetry();

            console.log('✅ Telemetria iniciada');

        } catch (error) {
            console.error('❌ Erro ao iniciar telemetria:', error);
            throw error;
        }
    }

    /**
     * Iniciar envio de heartbeat
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (!this.isActive || !this.currentData) return;

            // Heartbeat simples
            this.mesh.broadcastMessage('HEARTBEAT', {
                peerId: this.currentData.studentId,
                peerName: this.currentData.studentName,
                peerType: 'STUDENT',
                timestamp: Date.now()
            });

        }, 5000); // A cada 5 segundos
    }

    /**
     * Iniciar envio de telemetria detalhada
     */
    private startTelemetry(): void {
        this.telemetryInterval = setInterval(() => {
            if (!this.isActive || !this.currentData) return;

            // Atualizar bateria
            this.updateBatteryLevel();

            // Telemetria completa
            this.mesh.broadcastMessage('TELEMETRY', {
                ...this.currentData,
                timestamp: Date.now()
            });

            console.log('📊 Telemetria enviada:', {
                question: this.currentData.currentQuestion,
                answered: this.currentData.answeredCount,
                violations: this.currentData.violations
            });

        }, 10000); // A cada 10 segundos
    }

    /**
     * Atualizar questão atual
     */
    updateCurrentQuestion(questionNumber: number): void {
        if (!this.currentData) return;

        this.currentData.currentQuestion = questionNumber;
        this.currentData.timestamp = Date.now();

        // Envio imediato (importante)
        this.sendTelemetryNow();
    }

    /**
     * Atualizar contagem de respostas
     */
    updateAnsweredCount(count: number): void {
        if (!this.currentData) return;

        this.currentData.answeredCount = count;
        this.currentData.timestamp = Date.now();

        // Envio imediato
        this.sendTelemetryNow();
    }

    /**
     * Registrar violação de segurança
     */
    logViolation(event: SecurityEvent): void {
        if (!this.currentData) return;

        this.violationCount++;
        this.lastViolationType = event.eventType;

        this.currentData.violations = this.violationCount;
        this.currentData.lastViolation = event.eventType;
        this.currentData.timestamp = Date.now();

        // Enviar evento de segurança imediatamente
        this.mesh.broadcastMessage('ALERT', {
            type: 'SECURITY_EVENT',
            studentId: this.currentData.studentId,
            studentName: this.currentData.studentName,
            eventType: event.eventType,
            severity: event.severity,
            timestamp: event.timestamp,
            metadata: event.metadata
        });

        // Enviar telemetria atualizada
        this.sendTelemetryNow();

        console.warn('⚠️ Violação registrada:', event.eventType);
    }

    /**
     * Atualizar nível de bateria
     */
    private updateBatteryLevel(): void {
        if (!this.currentData) return;

        // Tentar obter bateria real (Browser API)
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                this.currentData!.batteryLevel = Math.round(battery.level * 100);
            }).catch(() => {
                // Fallback: simular bateria decrescendo lentamente
                this.currentData!.batteryLevel = Math.max(0, this.currentData!.batteryLevel - 0.1);
            });
        } else {
            // Simular bateria
            this.currentData.batteryLevel = Math.max(0, this.currentData.batteryLevel - 0.1);
        }
    }

    /**
     * Enviar telemetria imediatamente
     */
    private sendTelemetryNow(): void {
        if (!this.currentData) return;

        this.mesh.broadcastMessage('TELEMETRY', {
            ...this.currentData,
            timestamp: Date.now()
        });
    }

    /**
     * Obter dados atuais
     */
    getCurrentData(): TelemetryData | null {
        return this.currentData;
    }

    /**
     * Obter estatísticas
     */
    getStats() {
        return {
            isActive: this.isActive,
            violations: this.violationCount,
            lastViolation: this.lastViolationType,
            currentData: this.currentData
        };
    }

    /**
     * Parar telemetria
     */
    stop(): void {
        console.log('⏹️ Parando telemetria...');

        // Parar heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Parar telemetria
        if (this.telemetryInterval) {
            clearInterval(this.telemetryInterval);
            this.telemetryInterval = null;
        }

        this.isActive = false;

        console.log('✅ Telemetria parada');
    }

    /**
     * Reset (para novo aluno no mesmo tablet)
     */
    reset(): void {
        this.stop();
        this.currentData = null;
        this.violationCount = 0;
        this.lastViolationType = null;
    }
}

// Export singleton
let telemetryInstance: TelemetryService | null = null;

export function getTelemetryService(): TelemetryService {
    if (!telemetryInstance) {
        telemetryInstance = new TelemetryService();
    }
    return telemetryInstance;
}
