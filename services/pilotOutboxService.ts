
import { PilotCanonicalV1 } from './pilotContractService';

export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'RETRY_SCHEDULED' | 'DEAD_LETTERED';
export type ErrorClassification = 'TRANSIENT' | 'PERMANENT' | 'POISON_MESSAGE';

export interface PilotOutboxItem {
    event_id: string;
    resource_id: string;
    resource_version: number;
    contract_version: string;
    destination: string;
    payload: PilotCanonicalV1;
    payload_hash: string;
    status: OutboxStatus;
    attempt_count: number;
    last_error?: string;
    last_error_type?: ErrorClassification;
    next_attempt_at?: string;
    correlation_id: string;
    created_at: string;
    processed_at?: string;
}

class PilotOutboxService {
    private items: PilotOutboxItem[] = [];

    /**
     * Adiciona um item ao outbox (Geralmente chamado de dentro de uma transação de domínio)
     */
    enqueue(item: Omit<PilotOutboxItem, 'event_id' | 'status' | 'attempt_count' | 'created_at'>): PilotOutboxItem {
        const newItem: PilotOutboxItem = {
            ...item,
            event_id: `evt_${Math.random().toString(36).substring(7)}`,
            status: 'PENDING',
            attempt_count: 0,
            created_at: new Date().toISOString()
        };
        this.items.push(newItem);
        console.log(`[PILOT_OUTBOX][ENQUEUED] Event: ${newItem.event_id} | Resource: ${newItem.resource_id} v${newItem.resource_version}`);
        return newItem;
    }

    /**
     * Retorna itens pendentes para processamento
     */
    getPendingItems(): PilotOutboxItem[] {
        const now = new Date();
        return this.items.filter(i => 
            (i.status === 'PENDING' || i.status === 'RETRY_SCHEDULED') && 
            (!i.next_attempt_at || new Date(i.next_attempt_at) <= now)
        );
    }

    /**
     * Atualiza o status de um item após tentativa de entrega
     */
    updateStatus(eventId: string, status: OutboxStatus, error?: { message: string, type: ErrorClassification }): void {
        const item = this.items.find(i => i.event_id === eventId);
        if (!item) return;

        item.status = status;
        item.attempt_count++;
        
        if (error) {
            item.last_error = error.message;
            item.last_error_type = error.type;
            
            if (status === 'RETRY_SCHEDULED') {
                // Exponential Backoff simplificado
                const delayMinutes = Math.pow(2, item.attempt_count); 
                const nextDate = new Date();
                nextDate.setMinutes(nextDate.getMinutes() + delayMinutes);
                item.next_attempt_at = nextDate.toISOString();
            }
        }

        if (status === 'DELIVERED' || status === 'DEAD_LETTERED') {
            item.processed_at = new Date().toISOString();
        }

        console.log(`[PILOT_OUTBOX][STATUS_UPDATE] Event: ${eventId} -> ${status} (Attempt: ${item.attempt_count})`);
    }

    /**
     * Retorna todos os itens (Auditoria/DLQ)
     */
    getAllItems(): PilotOutboxItem[] {
        return [...this.items];
    }
}

export const pilotOutboxService = new PilotOutboxService();
