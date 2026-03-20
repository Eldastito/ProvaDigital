
import { PilotTestSessionDraft } from './pilotStorageService';

/**
 * Contrato Canônico V1 - Estável e Exportável
 * Este é o contrato oficial que consumidores externos esperam.
 */
export interface PilotCanonicalV1 {
    id: string;
    canonical_version: 'v1';
    external_reference: string;
    payload: {
        title: string;
        info: string;
        date_iso: string;
        status: 'draft' | 'reviewed';
    };
    metadata: {
        exported_at: string;
        origin_tenant: string;
    };
}

class PilotContractService {
    /**
     * Adapter: Transforma o objeto de domínio (Draft) no Contrato Canônico V1.
     * Note que aqui há uma transformação de campos (name -> title, description -> info)
     * para desacoplar a nomenclatura interna da externa.
     */
    adaptToV1(draft: PilotTestSessionDraft): PilotCanonicalV1 {
        // Validação básica de contrato
        if (!draft.name || !draft.intended_date) {
            throw new Error('[PILOT_CONTRACT][ERROR] Draft missing mandatory fields for V1 contract.');
        }

        return {
            id: draft.id,
            canonical_version: 'v1',
            external_reference: `EP-DRAFT-${draft.id.split('_')[1]?.toUpperCase() || draft.id}`,
            payload: {
                title: draft.name,
                info: draft.description || '',
                date_iso: draft.intended_date,
                status: draft.status
            },
            metadata: {
                exported_at: new Date().toISOString(),
                origin_tenant: draft.tenant_id
            }
        };
    }

    /**
     * Valida se um payload respeita o schema V1
     */
    validateV1(payload: any): boolean {
        const required = ['id', 'canonical_version', 'payload', 'metadata'];
        return required.every(field => field in payload) && payload.canonical_version === 'v1';
    }
}

export const pilotContractService = new PilotContractService();
