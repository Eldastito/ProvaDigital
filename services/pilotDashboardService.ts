
import { pilotMonitoringService, PilotMetric } from './pilotMonitoringService';

/**
 * PilotDashboardService - Agregador de Visualização Hierárquica
 * Consolida sinais para os painéis Executivo e Operacional.
 */
export interface HealthSummary {
    total_handshakes: number;
    handshake_success_rate: number;
    total_sync_bytes: number;
    active_incidents: number;
}

export interface RoomHealth {
    room_id: string;
    status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    latency_p95: number;
    error_rate: number;
}

class PilotDashboardService {
    /**
     * Consolida a saúde global para o Painel Executivo.
     */
    getGlobalHealth(): HealthSummary {
        const metrics = pilotMonitoringService.getLatestMetrics();
        
        const success = metrics.filter(m => m.name === 'pilot_mesh_handshake_total' && m.labels.status === 'success').length;
        const fails = metrics.filter(m => m.name === 'pilot_mesh_handshake_total' && m.labels.status === 'failure').length;
        const totalBytes = metrics.filter(m => m.name === 'pilot_sync_delta_bytes').reduce((acc, curr) => acc + curr.value, 0);

        return {
            total_handshakes: success + fails,
            handshake_success_rate: (success + fails) > 0 ? (success / (success + fails)) * 100 : 100,
            total_sync_bytes: totalBytes,
            active_incidents: fails > 5 ? 1 : 0 // Integração simples com alertas
        };
    }

    /**
     * Retorna a saúde de uma sala específica (RED Pattern).
     */
    getRoomHealth(roomId: string): RoomHealth {
        const metrics = pilotMonitoringService.getLatestMetrics().filter(m => m.labels.room_id === roomId || m.labels.tenant_id === roomId);
        
        const fails = metrics.filter(m => m.labels.status === 'failure').length;
        const total = metrics.length || 1;
        const errorRate = (fails / total) * 100;

        return {
            room_id: roomId,
            status: errorRate > 20 ? 'DOWN' : (errorRate > 0 ? 'DEGRADED' : 'HEALTHY'),
            latency_p95: 45, // Simulação de histograma
            error_rate: errorRate
        };
    }
}

export const pilotDashboardService = new PilotDashboardService();
