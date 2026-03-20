
/**
 * PilotPrivacyService - Guardião da Identidade e PII (LGPD)
 * Responsável por pseudonimização e reveal controlado.
 */
export interface PrivacyAuditLog {
    reveal_id: string;
    public_id: string;
    internal_id: string;
    actor_id: string;
    reason: string;
    timestamp: string;
}

class PilotPrivacyService {
    // Mapa segregado (Mock de DB de Identidade)
    private idMap: Map<string, string> = new Map(); // internalId -> publicId
    private reverseMap: Map<string, string> = new Map(); // publicId -> internalId
    private auditLogs: PrivacyAuditLog[] = [];

    /**
     * Pseudonimiza um ID real de estudante.
     * Retorna um student_public_id estável.
     */
    mask(internalId: string): string {
        let publicId = this.idMap.get(internalId);
        if (!publicId) {
            publicId = `spid_${Math.random().toString(36).substring(7).toUpperCase()}`;
            this.idMap.set(internalId, publicId);
            this.reverseMap.set(publicId, internalId);
        }
        return publicId;
    }

    /**
     * Revela o ID real a partir de um ID público.
     * EXIGE contexto de auditoria obrigatório.
     */
    reveal(publicId: string, context: { actorId: string, reason: string }): string {
        const internalId = this.reverseMap.get(publicId);
        if (!internalId) {
            throw new Error(`[PILOT_PRIVACY][ERROR] Public ID ${publicId} not found in map.`);
        }

        // Registro Mandatório de Auditoria LGPD
        const auditRecord: PrivacyAuditLog = {
            reveal_id: `rev_${Math.random().toString(36).substring(7)}`,
            public_id: publicId,
            internal_id: internalId,
            actor_id: context.actorId,
            reason: context.reason,
            timestamp: new Date().toISOString()
        };
        this.auditLogs.push(auditRecord);

        console.log(`[PILOT_PRIVACY][AUDIT_LGPD] Reveal triggered for ${publicId} by actor ${context.actorId}. Reason: ${context.reason}`);
        
        return internalId;
    }

    /**
     * Retorna trilha de auditoria para inspeção ANPD/DPO
     */
    getAuditTrail(actorId?: string): PrivacyAuditLog[] {
        if (actorId) return this.auditLogs.filter(l => l.actor_id === actorId);
        return [...this.auditLogs];
    }
}

export const pilotPrivacyService = new PilotPrivacyService();
