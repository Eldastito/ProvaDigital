
export enum PurposeClass {
    SECURITY_AUDIT = 'SECURITY_AUDIT',
    PRIVACY_REVEAL = 'PRIVACY_REVEAL',
    OPERATIONAL = 'OPERATIONAL',
    DEBUG = 'DEBUG',
    OUTBOX_EVENT = 'OUTBOX_EVENT',
    DLQ_RECORD = 'DLQ_RECORD',
    EXPORT_AUDIT = 'EXPORT_AUDIT'
}

export interface RetentionPolicy {
    ttl_days: number;
    description: string;
    requires_proof: boolean;
}

export interface EliminationProof {
    proof_id: string;
    purpose_class: PurposeClass;
    batch_count: number;
    authorized_by: string;
    timestamp: string;
}

const RETENTION_MATRIZ: Record<PurposeClass, RetentionPolicy> = {
    [PurposeClass.SECURITY_AUDIT]: { ttl_days: 365, description: 'Auditoria de segurança e acesso', requires_proof: true },
    [PurposeClass.PRIVACY_REVEAL]: { ttl_days: 1825, description: 'Trilha de Reveal PII (Compliance LGPD)', requires_proof: true },
    [PurposeClass.OPERATIONAL]: { ttl_days: 90, description: 'Logs de operação do Pilot', requires_proof: false },
    [PurposeClass.DEBUG]: { ttl_days: 7, description: 'Logs técnicos de troubleshooting', requires_proof: false },
    [PurposeClass.OUTBOX_EVENT]: { ttl_days: 30, description: 'Histórico de eventos entregues', requires_proof: false },
    [PurposeClass.DLQ_RECORD]: { ttl_days: 180, description: 'Registros de falhas em quarentena', requires_proof: true },
    [PurposeClass.EXPORT_AUDIT]: { ttl_days: 365, description: 'Auditoria de hashes de saída', requires_proof: true }
};

class PilotRetentionService {
    private legalHolds: Map<string, string> = new Map(); // resourceId -> reason
    private eliminationProofs: EliminationProof[] = [];

    /**
     * Define um Legal Hold para suspensão de expurgo.
     */
    setLegalHold(resourceId: string, reason: string): void {
        this.legalHolds.set(resourceId, reason);
        console.log(`[PILOT_RETENTION][LEGAL_HOLD] Hold active for ${resourceId}. Reason: ${reason}`);
    }

    /**
     * Remove um Legal Hold.
     */
    releaseHold(resourceId: string): void {
        this.legalHolds.delete(resourceId);
        console.log(`[PILOT_RETENTION][LEGAL_HOLD] Hold released for ${resourceId}.`);
    }

    /**
     * Verifica se um recurso está sob hold.
     */
    hasHold(resourceId: string): boolean {
        return this.legalHolds.has(resourceId);
    }

    /**
     * Verifica se um item é elegível para expurgo baseado no TTL.
     */
    isEligibleForPurge(purposeClass: PurposeClass, createdAt: string, resourceId?: string): boolean {
        // Regra de Ouro: Dados sob Legal Hold NUNCA são expurgados.
        if (resourceId && this.hasHold(resourceId)) return false;

        const policy = RETENTION_MATRIZ[purposeClass];
        const createdDate = new Date(createdAt);
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - policy.ttl_days);

        return createdDate < limitDate;
    }

    /**
     * Registra a prova de eliminação de um lote.
     */
    recordElimination(proof: Omit<EliminationProof, 'proof_id' | 'timestamp'>): EliminationProof {
        const newProof: EliminationProof = {
            ...proof,
            proof_id: `proof_${Math.random().toString(36).substring(7)}`,
            timestamp: new Date().toISOString()
        };
        this.eliminationProofs.push(newProof);
        console.log(`[PILOT_RETENTION][AUDIT_LGPD] Elimination Proof recorded: ${newProof.proof_id} for ${newProof.batch_count} items of ${newProof.purpose_class}`);
        return newProof;
    }

    getProofs(): EliminationProof[] {
        return [...this.eliminationProofs];
    }
}

export const pilotRetentionService = new PilotRetentionService();
