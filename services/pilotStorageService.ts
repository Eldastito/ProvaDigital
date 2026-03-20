
export interface PilotExecutionLog {
    id: string;
    tenant_id: string;
    correlation_id: string;
    reason_code: string;
    actor_type: string;
    actor_id: string;
    phase: string;
    step: string;
    decision_source: string;
    payload_summary: string;
    test_batch_id: string;
    created_at: string;
}

class PilotStorageService {
    private logs: PilotExecutionLog[] = [];

    /**
     * Cria um novo log de execução do Pilot (Simulação de Escrita Autorizada)
     */
    async createLog(log: Omit<PilotExecutionLog, 'id' | 'created_at'>): Promise<PilotExecutionLog> {
        const newLog: PilotExecutionLog = {
            ...log,
            id: Math.random().toString(36).substring(7),
            created_at: new Date().toISOString()
        };
        this.logs.push(newLog);
        console.log(`[PILOT_STORAGE] Log created: ${newLog.id} | Batch: ${newLog.test_batch_id}`);
        return newLog;
    }

    /**
     * Retorna todos os logs (Auditoria)
     */
    getLogs(tenantId?: string): PilotExecutionLog[] {
        if (tenantId) {
            return this.logs.filter(l => l.tenant_id === tenantId);
        }
        return [...this.logs];
    }

    /**
     * Rollback por Lote (Expurgo controlado sem abrir DELETE)
     */
    purgeBatch(testBatchId: string): number {
        const initialCount = this.logs.length;
        this.logs = this.logs.filter(l => l.test_batch_id !== testBatchId);
        const removedCount = initialCount - this.logs.length;
        console.log(`[PILOT_STORAGE] Rollback executed. Purged ${removedCount} logs for batch ${testBatchId}`);
        return removedCount;
    }

    /**
     * Limpa todo o storage (Saneamento de sessão)
     */
    clearAll() {
        this.logs = [];
    }
}

export const pilotStorageService = new PilotStorageService();
