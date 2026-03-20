
import { pilotMonitoringService, PilotMetric } from './pilotMonitoringService';

/**
 * PilotAlertService - Motor de Regras e Alertas Acionáveis
 * Monitora os SLOs e dispara notificações P0/P1.
 */
export interface PilotAlert {
    id: string;
    severity: 'P0' | 'P1';
    title: string;
    description: string;
    timestamp: string;
    resolved: boolean;
}

class PilotAlertService {
    private activeAlerts: Map<string, PilotAlert> = new Map();

    /**
     * Avalia as métricas recentes contra thresholds de SLO.
     */
    evaluateRules(): PilotAlert[] {
        const metrics = pilotMonitoringService.getLatestMetrics();
        const alerts: PilotAlert[] = [];

        // 1. Regra P0: Falha de Handshake (Simulação de Threshold)
        const handshakeFails = metrics.filter(m => m.name === 'pilot_mesh_handshake_total' && m.labels.status === 'failure');
        if (handshakeFails.length > 5) { // Threshold fictício para o teste
            const alert = this.trigger('MESH_DOWN_MASSIVE', 'P0', 'Falha massiva de Handshake', 'Taxa de erro excedeu 20% na malha local.');
            alerts.push(alert);
        }

        // 2. Regra P0: Suspeita de Quebra de Privacidade
        const piiReveals = metrics.filter(m => m.name === 'pilot_pii_reveal_total' && m.value > 10);
        if (piiReveals.length > 0) {
            const alert = this.trigger('PRIVACY_BREACH_SUSPECT', 'P0', 'Anomalia de Reveal PII', 'Volume de revelação de PII acima do baseline seguro.');
            alerts.push(alert);
        }

        return alerts;
    }

    private trigger(id: string, severity: 'P0' | 'P1', title: string, description: string): PilotAlert {
        if (this.activeAlerts.has(id)) return this.activeAlerts.get(id)!;

        const alert: PilotAlert = {
            id, severity, title, description,
            timestamp: new Date().toISOString(),
            resolved: false
        };
        
        this.activeAlerts.set(id, alert);
        console.warn(`[ALERT][${severity}] ${title}: ${description}`);
        return alert;
    }

    reset(id: string) {
        this.activeAlerts.delete(id);
    }
}

export const pilotAlertService = new PilotAlertService();
