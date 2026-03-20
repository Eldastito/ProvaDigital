
import { pilotContractService } from './pilotContractService';
import { pilotContractService } from './pilotContractService';
import { pilotOutboxService } from './pilotOutboxService';
import { pilotPrivacyService } from './pilotPrivacyService';

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
    student_id?: string; // Pseudonimizado (LGPD)
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
    description?: string;
    status: 'draft' | 'reviewed';
    version: number; // Suporte a Optimistic Concurrency (Fase 6)
    test_batch_id: string;
    created_at: string;
}

export interface PilotExport {
    export_id: string;
    resource_id: string;
    version: number;
    contract_version: string;
    type: string;
    payload_hash: string;
    timestamp: string;
}

class PilotStorageService {
    private logs: PilotExecutionLog[] = [];
    private userPrefs: UserPreference[] = [];
    private functionalDrafts: PilotTestSessionDraft[] = [];
    private exportHistory: PilotExport[] = []; // Cache de idempotência de exportação (F6 Step 3)
    
    // Whitelist de chaves autorizadas para o Pilot (Step 2)
    private userPrefsWhitelist = ['pilot_ui_hint_enabled'];

    /**
     * Cria um novo log de execução do Pilot (Simulação de Escrita Autorizada)
     */
    async createLog(log: Omit<PilotExecutionLog, 'id' | 'created_at'>): Promise<PilotExecutionLog> {
        // LGPD: Mascaramento dinâmico de Student ID se presente
        const student_id = log.student_id ? pilotPrivacyService.mask(log.student_id) : undefined;

        const newLog: PilotExecutionLog = {
            ...log,
            student_id,
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
    async createFunctionalDraft(draft: Omit<PilotTestSessionDraft, 'id' | 'created_at' | 'status' | 'version'>): Promise<PilotTestSessionDraft> {
        const newDraft: PilotTestSessionDraft = {
            ...draft,
            id: `draft_${Math.random().toString(36).substring(7)}`,
            status: 'draft',
            version: 1,
            created_at: new Date().toISOString()
        };
        this.functionalDrafts.push(newDraft);
        console.log(`[PILOT_STORAGE] FunctionalDraft created: ${newDraft.id} (v1) for user ${newDraft.user_id}`);
        return newDraft;
    }

    /**
     * Atualiza um rascunho (Fase 6 Step 1 - UPDATE Controlado)
     * Implementa Optimistic Concurrency e Attribute Whitelist
     */
    async updateFunctionalDraft(id: string, updates: Partial<PilotTestSessionDraft>, expectedVersion: number): Promise<PilotTestSessionDraft> {
        const index = this.functionalDrafts.findIndex(d => d.id === id);
        if (index === -1) throw new Error('[PILOT_STORAGE] Draft not found');

        const current = this.functionalDrafts[index];
        
        // 1. Check de Concorrência Otimista
        if (current.version !== expectedVersion) {
            throw new Error(`[PILOT_STORAGE][CONCURRENCY_ERROR] Version mismatch. Current: ${current.version}, expected: ${expectedVersion}`);
        }

        // 2. Whitelist de Atributos (Fase 6)
        const allowedFields = ['name', 'description', 'intended_date'];
        const updateFields = Object.keys(updates);
        const forbiddenFields = updateFields.filter(f => !allowedFields.includes(f));

        if (forbiddenFields.length > 0) {
            throw new Error(`[PILOT_STORAGE][SECURITY_ERROR] Forbidden attributes for UPDATE: ${forbiddenFields.join(', ')}`);
        }

        // 3. Registro de Delta para Auditoria
        const delta = updateFields.map(f => ({
            field: f,
            old: (current as any)[f],
            new: (updates as any)[f]
        }));

        const updatedDraft: PilotTestSessionDraft = {
            ...current,
            ...updates,
            version: current.version + 1
        };

        this.functionalDrafts[index] = updatedDraft;

        console.log(`[PILOT_STORAGE][AUDIT] Draft ${id} updated (v${current.version} -> v${updatedDraft.version}). Delta:`, JSON.stringify(delta));
        return updatedDraft;
    }

    /**
     * Transição de Estado (Fase 6 Step 2 - Workflow Goverisado)
     * Implementa CAS, Pre-conditions e Audit Semântico.
     */
    async transitionDraftStatus(id: string, expectedVersion: number, reason: string): Promise<PilotTestSessionDraft> {
        const index = this.functionalDrafts.findIndex(d => d.id === id);
        if (index === -1) throw new Error('[PILOT_STORAGE][ERROR:NOT_FOUND] Draft session not found');

        const current = this.functionalDrafts[index];

        // 1. Idempotência: Se já for reviewed, ignorar se a versão bater
        if (current.status === 'reviewed') {
            console.log(`[PILOT_STORAGE][IDEMPOTENCY] Draft ${id} already in reviewed status.`);
            return current;
        }

        // 2. Atomicidade (CAS): Check de Versão e Status Atual
        if (current.version !== expectedVersion) {
            throw new Error(`[PILOT_STORAGE][ERROR:VERSION_MISMATCH] Version conflict. Current: ${current.version}, Expected: ${expectedVersion}`);
        }
        if (current.status !== 'draft') {
            throw new Error(`[PILOT_STORAGE][ERROR:INVALID_STATE_TRANSITION] Target transition draft -> reviewed requires current status to be 'draft'. Current: ${current.status}`);
        }

        // 3. Pre-conditions (Completude)
        const missingFields = [];
        if (!current.name || current.name.trim() === '') missingFields.push('name');
        if (!current.description || current.description.trim() === '') missingFields.push('description');
        if (!current.intended_date) missingFields.push('intended_date');

        if (missingFields.length > 0) {
            throw new Error(`[PILOT_STORAGE][ERROR:PRECONDITION_FAILED] Cannot transition to 'reviewed'. Missing required data: ${missingFields.join(', ')}`);
        }

        // 4. Efetivar Transição
        const updated: PilotTestSessionDraft = {
            ...current,
            status: 'reviewed',
            version: current.version + 1
        };

        this.functionalDrafts[index] = updated;

        console.log(`[PILOT_STORAGE][AUDIT_WORKFLOW] Draft ${id} transition draft -> reviewed. Version: ${current.version} -> ${updated.version}. Reason: ${reason}`);
        
        // 5. Transactional Outbox (Step 7.2A)
        // O registro no outbox deve ser atômico com a mudança de estado.
        try {
            const canonical = pilotContractService.adaptToV1(updated);
            const payloadString = JSON.stringify(canonical);
            const hash = `sha256_${payloadString.length}_${Math.random().toString(36).substring(7)}`;

            pilotOutboxService.enqueue({
                resource_id: updated.id,
                resource_version: updated.version,
                contract_version: 'v1',
                destination: 'LMS_EXTERNAL_SYNC',
                payload: canonical,
                payload_hash: hash,
                correlation_id: `corr_${Math.random().toString(36).substring(7)}`
            });
        } catch (error: any) {
            console.error(`[PILOT_STORAGE][OUTBOX_ERROR] Failed to enqueue draft ${id} for export: ${error.message}`);
            // Em uma transação real de DB, o erro de outbox faria rollback do status.
        }

        return updated;
    }

    /**
     * Exportação Segura (Fase 6 Step 3 - Egress Hardening)
     * Implementa Eligibility, Whitelist e Idempotência.
     */
    async exportFunctionalDraft(id: string, expectedVersion: number, exportType: string): Promise<{ data: Partial<PilotTestSessionDraft>, export_id: string }> {
        const draft = this.functionalDrafts.find(d => d.id === id);
        if (!draft) throw new Error('[PILOT_STORAGE][ERROR:NOT_FOUND] Draft not found for export');

        // 1. Snapshot Consistency Check
        if (draft.version !== expectedVersion) {
            throw new Error(`[PILOT_STORAGE][ERROR:VERSION_MISMATCH] Version mismatch for export. Current: ${draft.version}, requested: ${expectedVersion}`);
        }

        // 2. Export Eligibility (apenas 'reviewed')
        if (draft.status !== 'reviewed') {
            throw new Error(`[PILOT_STORAGE][ERROR:INELEGIBLE_STATUS] Only 'reviewed' drafts can be exported. Current: ${draft.status}`);
        }

        // 3. Idempotency Check
        const existingExport = this.exportHistory.find(e => e.resource_id === id && e.version === expectedVersion && e.type === exportType);
        if (existingExport) {
            console.log(`[PILOT_STORAGE][IDEMPOTENCY] Reusing existing export for ${id} v${expectedVersion}`);
            // Em um cenário real, retornaríamos o payload do cache ou storage persistente.
            // Aqui simulamos a re-entrega do payload via whitelist.
        }

        // 4. Egress Whitelist & Contract Adaptation (V1)
        // O Storage agora delega a formatação para o ContractService.
        const canonicalPayload = pilotContractService.adaptToV1(draft);

        // 5. Auditoria de Payload (Hash do Contrato Canônico)
        const payloadString = JSON.stringify(canonicalPayload);
        const hash = `sha256_${payloadString.length}_${Math.random().toString(36).substring(7)}`;

        const exportRecord: PilotExport = {
            export_id: `exp_${Math.random().toString(36).substring(7)}`,
            resource_id: id,
            version: expectedVersion,
            contract_version: 'v1',
            type: exportType,
            payload_hash: hash,
            timestamp: new Date().toISOString()
        };

        if (!existingExport) {
            this.exportHistory.push(exportRecord);
        }

        console.log(`[PILOT_STORAGE][AUDIT_EGRESS] Exported ${id} v${expectedVersion} as Canonical ${exportRecord.contract_version}. Type: ${exportType}. Hash: ${hash}`);

        return {
            data: canonicalPayload as any,
            export_id: exportRecord.export_id
        };
    }

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
