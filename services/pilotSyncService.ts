
/**
 * PilotSyncService - Orquestrador de Sincronização e Reconciliação Mesh
 * Implementa troca diferencial por manifesto e resolução híbrida de conflitos.
 */
export interface SyncItem {
    id: string;
    version: number;
    payload_hash: string;
    causal_ctx: string; // Ex: peer_id:version (Simplificação de Dotted Version Vector)
    data: any;
}

export interface SyncManifest {
    batch_id: string;
    items_summary: Record<string, { version: number, hash: string }>; // id -> {version, hash}
}

class PilotSyncService {
    /**
     * Gera manifesto diferencial para comparação.
     */
    generateManifest(batchId: string, items: SyncItem[]): SyncManifest {
        const summary: Record<string, { version: number, hash: string }> = {};
        items.forEach(item => {
            summary[item.id] = { version: item.version, hash: item.payload_hash };
        });

        return { batch_id: batchId, items_summary: summary };
    }

    /**
     * Reconcilia um item divergetne usando lógica híbrida.
     * 1. Append-only (Union)
     * 2. State Dominance (Rank/Status)
     * 3. Desempate (Rank)
     */
    reconcile(local: SyncItem | undefined, inbound: SyncItem, context: { localPeerRank: number, remotePeerRank: number }): SyncItem {
        if (!local) return inbound; // Item novo: Aceitar

        // Regra de Domínio: Respostas Objetivas (Append-only / ID de Operação Único)
        if (inbound.data.type === 'RESPONSE_APPEND') {
            return local; // Se o ID de operação é o mesmo, ignora duplicata (idempotência)
        }

        // Regra de Domínio: State Machine Dominance (Status Reviewed > Draft)
        if (inbound.data.status === 'reviewed' && local.data.status === 'draft') {
            console.log(`[SYNC][RECONCILE] State Dominance: 'reviewed' wins over 'draft' for ${local.id}`);
            return inbound;
        }

        // Conflito Concorrente: Decisão por Peer Rank
        if (inbound.version === local.version && inbound.payload_hash !== local.payload_hash) {
            if (context.remotePeerRank > context.localPeerRank) {
                console.log(`[SYNC][RECONCILE] Conflict: Remote Rank ${context.remotePeerRank} wins for ${local.id}`);
                return inbound;
            } else {
                console.log(`[SYNC][RECONCILE] Conflict: Local Rank ${context.localPeerRank} preserved for ${local.id}`);
                return local;
            }
        }

        // Dominância por Versão (Default Causal)
        return inbound.version > local.version ? inbound : local;
    }
}

export const pilotSyncService = new PilotSyncService();
