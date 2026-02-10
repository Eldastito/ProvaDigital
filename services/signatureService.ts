/**
 * Signature Service - Blindagem Forense FORGE 2031
 * Garante que a trajetória e o resultado do aluno sejam imutáveis.
 */
export const signatureService = {
    /**
     * Gera um hash SHA-256 da trajetória e resultados
     * No futuro, este hash pode ser assinado por um Certificado Digital (e-CPF/e-CNPJ)
     */
    async generateIntegritySignature(assessmentData: any): Promise<string> {
        // Serialização determinística para garantir que o hash seja o mesmo para os mesmos dados
        const canonicalData = JSON.stringify(assessmentData, Object.keys(assessmentData).sort());

        const encoder = new TextEncoder();
        const data = encoder.encode(canonicalData);

        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return `forge_v1:${hashHex}`;
    },

    /**
     * Valida se a assinatura atual condiz com os dados
     */
    async verifyIntegrity(data: any, signature: string): Promise<boolean> {
        if (!signature) return false;
        const currentHash = await this.generateIntegritySignature(data);
        return currentHash === signature;
    },

    /**
     * Registra um log forense imutável
     */
    async logForensicEvent(supabase: any, event: {
        type: string,
        severity: 'INFO' | 'WARNING' | 'CRITICAL',
        entityType?: string,
        entityId?: string,
        payload: any
    }) {
        const payloadHash = await this.generateIntegritySignature(event.payload);

        const { error } = await supabase
            .from('forensic_logs')
            .insert({
                event_type: event.type,
                severity: event.severity,
                entity_type: event.entityType,
                entity_id: event.entityId,
                payload_hash: payloadHash,
                client_context: {
                    ua: navigator.userAgent,
                    ts: new Date().toISOString()
                }
            });

        if (error) console.error('CRITICAL: Forensic log failure', error);
    }
};
