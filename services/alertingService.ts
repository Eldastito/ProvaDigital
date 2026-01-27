/**
 * Alerting Service
 * 
 * Sistema de alertas bidirecionais via rede mesh:
 * - Professor → Aluno: Avisos, advertências
 * - Aluno → Professor: Pedidos de ajuda, dúvidas
 * 
 * Sprint 2 - Fase 7
 */

import { getMeshNetwork } from './meshNetworkService';

// Tipos
export interface Alert {
    id: string;
    type: 'WARNING' | 'INFO' | 'HELP_REQUEST' | 'QUESTION';
    from: string;
    fromName: string;
    to: string; // studentId ou 'BROADCAST'
    toName?: string;
    message: string;
    timestamp: number;
    read: boolean;
    responded: boolean;
    responseMessage?: string;
}

export type AlertCallback = (alert: Alert) => void;

/**
 * Serviço de Alertas
 * 
 * Gerencia comunicação bidirecional entre professor e alunos.
 */
export class AlertingService {
    private mesh = getMeshNetwork();
    private alerts: Map<string, Alert> = new Map();
    private onAlertReceived?: AlertCallback;
    private onAlertSent?: AlertCallback;
    private isActive: boolean = false;

    // Identificação do usuário atual
    private currentUserId: string | null = null;
    private currentUserName: string | null = null;
    private currentUserType: 'PROFESSOR' | 'STUDENT' | null = null;

    /**
     * Inicializar serviço de alertas
     */
    initialize(config: {
        userId: string;
        userName: string;
        userType: 'PROFESSOR' | 'STUDENT';
    }): void {
        console.log('🔔 Inicializando sistema de alertas...');

        this.currentUserId = config.userId;
        this.currentUserName = config.userName;
        this.currentUserType = config.userType;
        this.isActive = true;

        // Registrar handler de mensagens de alerta
        this.mesh.setOnMessageReceived((message) => {
            if (message.type === 'ALERT') {
                this.handleIncomingAlert(message.payload);
            }
        });

        console.log(`✅ Alertas ativos para ${config.userType}: ${config.userName}`);
    }

    /**
     * Processar alerta recebido
     */
    private handleIncomingAlert(payload: any): void {
        // Verificar se o alerta é para mim
        const isForMe = payload.to === this.currentUserId || payload.to === 'BROADCAST';

        if (!isForMe) {
            return; // Não é para mim, ignorar
        }

        const alert: Alert = {
            id: payload.id || this.generateAlertId(),
            type: payload.type || 'INFO',
            from: payload.from,
            fromName: payload.fromName || 'Desconhecido',
            to: payload.to,
            toName: payload.toName,
            message: payload.message,
            timestamp: payload.timestamp || Date.now(),
            read: false,
            responded: false
        };

        // Armazenar alerta
        this.alerts.set(alert.id, alert);

        console.log(`📨 Alerta recebido de ${alert.fromName}:`, alert.message);

        // Notificar callback
        if (this.onAlertReceived) {
            this.onAlertReceived(alert);
        }

        // Se for aluno, mostrar notificação visual
        if (this.currentUserType === 'STUDENT') {
            this.showNotification(alert);
        }
    }

    /**
     * Enviar alerta
     */
    sendAlert(config: {
        to: string; // studentId ou 'BROADCAST'
        toName?: string;
        type: Alert['type'];
        message: string;
    }): Alert {
        if (!this.isActive || !this.currentUserId || !this.currentUserName) {
            throw new Error('Serviço de alertas não inicializado');
        }

        const alert: Alert = {
            id: this.generateAlertId(),
            type: config.type,
            from: this.currentUserId,
            fromName: this.currentUserName,
            to: config.to,
            toName: config.toName,
            message: config.message,
            timestamp: Date.now(),
            read: false,
            responded: false
        };

        // Armazenar no histórico
        this.alerts.set(alert.id, alert);

        // Enviar via mesh
        if (config.to === 'BROADCAST') {
            this.mesh.broadcastMessage('ALERT', alert);
            console.log('📢 Alerta enviado para TODOS:', config.message);
        } else {
            this.mesh.sendMessage(config.to, 'ALERT', alert);
            console.log(`📨 Alerta enviado para ${config.toName || config.to}:`, config.message);
        }

        // Notificar callback
        if (this.onAlertSent) {
            this.onAlertSent(alert);
        }

        return alert;
    }

    /**
     * Marcar alerta como lido
     */
    markAsRead(alertId: string): void {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.read = true;
            this.alerts.set(alertId, alert);
        }
    }

    /**
     * Responder a um alerta
     */
    respondToAlert(alertId: string, responseMessage: string): void {
        const originalAlert = this.alerts.get(alertId);
        if (!originalAlert) {
            console.warn('⚠️ Alerta não encontrado:', alertId);
            return;
        }

        // Marcar como respondido
        originalAlert.responded = true;
        originalAlert.responseMessage = responseMessage;
        this.alerts.set(alertId, originalAlert);

        // Enviar resposta como novo alerta
        this.sendAlert({
            to: originalAlert.from,
            toName: originalAlert.fromName,
            type: 'INFO',
            message: `RE: ${responseMessage}`
        });

        console.log('📬 Resposta enviada:', responseMessage);
    }

    /**
     * Obter todos os alertas
     */
    getAllAlerts(): Alert[] {
        return Array.from(this.alerts.values()).sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Obter alertas não lidos
     */
    getUnreadAlerts(): Alert[] {
        return this.getAllAlerts().filter(a => !a.read);
    }

    /**
     * Obter contagem de não lidos
     */
    getUnreadCount(): number {
        return this.getUnreadAlerts().length;
    }

    /**
     * Limpar alertas antigos (> 1 hora)
     */
    clearOldAlerts(): void {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        this.alerts.forEach((alert, id) => {
            if (alert.timestamp < oneHourAgo && alert.read) {
                this.alerts.delete(id);
            }
        });
    }

    /**
     * Mostrar notificação visual
     */
    private showNotification(alert: Alert): void {
        // Browser Notification API (se permitido)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${alert.fromName} - ${alert.type}`, {
                body: alert.message,
                icon: '/icon.png',
                badge: '/badge.png'
            });
        }

        // Fallback: toast visual (implementar no componente)
        this.showToast(alert);
    }

    /**
     * Toast visual (callback para componente UI)
     */
    private showToast(alert: Alert): void {
        // Este método será sobrescrito pelo componente UI
        console.log('🔔 Toast:', alert.message);
    }

    /**
     * Registrar callback para toast
     */
    setToastHandler(handler: (alert: Alert) => void): void {
        this.showToast = handler;
    }

    /**
     * Gerar ID único para alerta
     */
    private generateAlertId(): string {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Registrar callback para alertas recebidos
     */
    setOnAlertReceived(callback: AlertCallback): void {
        this.onAlertReceived = callback;
    }

    /**
     * Registrar callback para alertas enviados
     */
    setOnAlertSent(callback: AlertCallback): void {
        this.onAlertSent = callback;
    }

    /**
     * Obter estatísticas
     */
    getStats() {
        return {
            isActive: this.isActive,
            totalAlerts: this.alerts.size,
            unreadCount: this.getUnreadCount(),
            currentUser: {
                id: this.currentUserId,
                name: this.currentUserName,
                type: this.currentUserType
            }
        };
    }

    /**
     * Parar serviço
     */
    stop(): void {
        console.log('⏹️ Parando sistema de alertas...');

        this.isActive = false;
        this.clearOldAlerts();

        console.log('✅ Alertas parados');
    }

    /**
     * Reset completo
     */
    reset(): void {
        this.stop();
        this.alerts.clear();
        this.currentUserId = null;
        this.currentUserName = null;
        this.currentUserType = null;
    }
}

// Export singleton
let alertingInstance: AlertingService | null = null;

export function getAlertingService(): AlertingService {
    if (!alertingInstance) {
        alertingInstance = new AlertingService();
    }
    return alertingInstance;
}

/**
 * Helper: Enviar alerta rápido do professor para aluno
 */
export function sendQuickAlert(studentId: string, studentName: string, message: string): void {
    const service = getAlertingService();
    service.sendAlert({
        to: studentId,
        toName: studentName,
        type: 'WARNING',
        message
    });
}

/**
 * Helper: Aluno pedir ajuda ao professor
 */
export function requestHelp(message: string = 'Preciso de ajuda'): void {
    const service = getAlertingService();
    service.sendAlert({
        to: 'BROADCAST', // Broadcast para professor ver
        type: 'HELP_REQUEST',
        message
    });
}
