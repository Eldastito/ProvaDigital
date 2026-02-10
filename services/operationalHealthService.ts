import { supabase } from './supabaseClient';

/**
 * Serviço de Excelência Operacional (Fase VIII - Plano 2031)
 * Monitoramento de SLOs (Service Level Objectives) em Tempo Real.
 */
export const operationalHealthService = {
    /**
     * Registra uma métrica de performance de sincronização para cálculo de SLO (P95/P99).
     */
    logSyncTrace: async (latencyMs: number, success: boolean, payloadSize: number) => {
        try {
            // Registrar no Supabase para agregação global de SLO
            const { error } = await supabase
                .from('operational_telemetry')
                .insert({
                    event_type: 'SYNC_RELIABILITY',
                    latency_ms: latencyMs,
                    is_success: success,
                    metadata: {
                        payload_size: payloadSize,
                        user_agent: navigator.userAgent,
                        connection_type: (navigator as any).connection?.effectiveType || 'unknown'
                    }
                });

            if (error) throw error;

            // Armazenar localmente para o Dashboard de Health de Campo
            const localLog = JSON.parse(localStorage.getItem('forge_health_traces') || '[]');
            localLog.push({ t: Date.now(), l: latencyMs, s: success });
            localStorage.setItem('forge_health_traces', JSON.stringify(localLog.slice(-50)));
        } catch (err) {
            console.warn('⚠️ Falha ao registrar telemetria (SLO):', err);
        }
    },

    /**
     * Calcula as métricas atuais de Health baseadas no log local.
     */
    getLocalHealthMetrics: () => {
        const traces = JSON.parse(localStorage.getItem('forge_health_traces') || '[]');
        if (traces.length === 0) return { successRate: 100, p95Latency: 0 };

        const successRate = (traces.filter((t: any) => t.s).length / traces.length) * 100;
        const latencies = traces.map((t: any) => t.l).sort((a: number, b: number) => a - b);
        const p95Index = Math.floor(latencies.length * 0.95);
        const p95Latency = latencies[p95Index] || latencies[latencies.length - 1];

        return {
            successRate: parseFloat(successRate.toFixed(2)),
            p95Latency: Math.round(p95Latency),
            sampleSize: traces.length
        };
    },

    /**
     * Registra uma tentativa de recuperação de sessão pós-falha (Resiliência).
     */
    logRecoveryEvent: async (sessionId: string, success: boolean) => {
        console.info(`[Fase VIII] Evento de Recuperação para Sessão ${sessionId}: ${success ? 'SUCESSO' : 'FALHA'}`);

        try {
            await supabase.from('operational_telemetry').insert([{
                event_type: 'SESSION_RECOVERY',
                is_success: success,
                metadata: { session_id: sessionId }
            }]);
        } catch (err) {
            console.warn('⚠️ Falha ao sincronizar evento de recuperação:', err);
        }
    }
};
