
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

export interface UserPreference {
    tenant_id: string;
    user_id: string;
    key: string;
    value: any;
    updated_at: string;
}

export interface PilotTestSessionDraft {
    id: string;
    tenant_id: string;
    user_id: string;
    name: string;
    intended_date: string;
    status: 'draft';
    test_batch_id: string;
    created_at: string;
}

class PilotStorageService {
    private logs: PilotExecutionLog[] = [];
    private userPrefs: UserPreference[] = [];
    private functionalDrafts: PilotTestSessionDraft[] = [];
    
    // Whitelist de chaves autorizadas para o Pilot (Step 2)
    private userPrefsWhitelist = ['pilot_ui_hint_enabled'];

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
     * Upsert de Preferência de Usuário (Passo 2 - Escrita em Recurso Real)
     */
    async upsertUserPreference(pref: Omit<UserPreference, 'updated_at'>): Promise<UserPreference> {
        if (!this.userPrefsWhitelist.includes(pref.key)) {
            throw new Error(`[PILOT_STORAGE][SECURITY_VIOLATION] Key ${pref.key} not in Pilot whitelist.`);
        }

        const index = this.userPrefs.findIndex(p => p.tenant_id === pref.tenant_id && p.user_id === pref.user_id && p.key === pref.key);
        const updatedPref = { ...pref, updated_at: new Date().toISOString() };

        if (index >= 0) {
            this.userPrefs[index] = updatedPref;
        } else {
            this.userPrefs.push(updatedPref);
        }

        console.log(`[PILOT_STORAGE] UserPreference upserted: ${pref.key} for user ${pref.user_id}`);
        return updatedPref;
    }

    /**
     * Retorna preferências de um usuário
     */
    getUserPreferences(tenantId: string, userId: string): UserPreference[] {
        return this.userPrefs.filter(p => p.tenant_id === tenantId && p.user_id === userId);
    }

    /**
     * Cria um rascunho de sessão de teste (Step 3 - Recurso Funcional)
     */
    async createFunctionalDraft(draft: Omit<PilotTestSessionDraft, 'id' | 'created_at' | 'status'>): Promise<PilotTestSessionDraft> {
        const newDraft: PilotTestSessionDraft = {
            ...draft,
            id: `draft_${Math.random().toString(36).substring(7)}`,
            status: 'draft',
            created_at: new Date().toISOString()
        };
        this.functionalDrafts.push(newDraft);
        console.log(`[PILOT_STORAGE] FunctionalDraft created: ${newDraft.id} for user ${newDraft.user_id}`);
        return newDraft;
    }

    /**
     * Retorna drafts funcionais
     */
    getFunctionalDrafts(tenantId: string): PilotTestSessionDraft[] {
        return this.functionalDrafts.filter(d => d.tenant_id === tenantId);
    }

    /**
     * Rollback por Lote (Expurgo controlado)
     */
    purgeBatch(testBatchId: string): number {
        const initialLogs = this.logs.length;
        this.logs = this.logs.filter(l => l.test_batch_id !== testBatchId);
        
        const initialDrafts = this.functionalDrafts.length;
        this.functionalDrafts = this.functionalDrafts.filter(d => d.test_batch_id !== testBatchId);

        // No Step 2, o rollback das preferências pode ser feito por reset das chaves do pilot
        const prefCount = this.userPrefs.length;
        this.userPrefs = this.userPrefs.filter(p => !this.userPrefsWhitelist.includes(p.key));
        
        const removedCount = (initialLogs - this.logs.length) + (initialDrafts - this.functionalDrafts.length) + (prefCount - this.userPrefs.length);
        console.log(`[PILOT_STORAGE] Rollback executed. Purged logs, drafts and pilot-specific preferences.`);
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
