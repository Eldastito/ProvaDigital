
import { pilotOutboxService, PilotOutboxItem, ErrorClassification } from './pilotOutboxService';

/**
 * Simulação de um Client de Integração Externo
 */
class ExternalLMSClient {
    async sendPayload(payload: any): Promise<void> {
        // Simulação de latência de rede
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Simulação de erro PERMANENTE (Contract mismatch)
        if (payload.payload.title === 'TRIGGER_PERMANENT_ERROR') {
            throw new Error('[EXTERNAL_LMS][CONTRACT_ERROR] Mandatory field info is malformed');
        }

        // Simulação de erro TRANSITÓRIO (Network)
        if (Math.random() < 0.2) {
            throw new Error('[EXTERNAL_LMS][NETWORK_ERROR] Connection reset by peer');
        }
        
        console.log(`[EXTERNAL_LMS] Payload received successfully.`);
    }
}

const lmsClient = new ExternalLMSClient();

class PilotAsyncDispatcher {
    private isProcessing = false;

    /**
     * Ciclo de processamento do Outbox
     * Em um ambiente real, seria um cron job ou worker contínuo.
     */
    async dispatchPending(): Promise<{ success: number, failed: number }> {
        if (this.isProcessing) return { success: 0, failed: 0 };
        this.isProcessing = true;
        
        const items = pilotOutboxService.getPendingItems();
        let successCount = 0;
        let failedCount = 0;

        console.log(`[PILOT_DISPATCHER] Starting cycle. Items to process: ${items.length}`);

        for (const item of items) {
            try {
                // 1. Lock Simulado (Status: PROCESSING)
                pilotOutboxService.updateStatus(item.event_id, 'PROCESSING');

                // 2. Entrega ao Destino
                await lmsClient.sendPayload(item.payload);

                // 3. Sucesso: DELIVERED
                pilotOutboxService.updateStatus(item.event_id, 'DELIVERED');
                successCount++;
            } catch (error: any) {
                // 4. Falha: Classificação de Erro (Step 7.2C)
                const isPermanent = error.message.includes('CONTRACT_ERROR');
                const maxAttempts = 3;

                if (isPermanent) {
                    console.log(`[PILOT_DISPATCHER] Permanent error detected for ${item.event_id}. Sending to DLQ.`);
                    pilotOutboxService.updateStatus(item.event_id, 'DEAD_LETTERED', {
                        message: error.message,
                        type: 'PERMANENT'
                    });
                } else if (item.attempt_count >= maxAttempts) {
                    console.log(`[PILOT_DISPATCHER] Max attempts reached for ${item.event_id}. Sending to DLQ.`);
                    pilotOutboxService.updateStatus(item.event_id, 'DEAD_LETTERED', {
                        message: `Max retries reached: ${error.message}`,
                        type: 'POISON_MESSAGE'
                    });
                } else {
                    console.log(`[PILOT_DISPATCHER] Transient error for ${item.event_id}. Scheduling retry.`);
                    pilotOutboxService.updateStatus(item.event_id, 'RETRY_SCHEDULED', {
                        message: error.message,
                        type: 'TRANSIENT'
                    });
                }
                failedCount++;
            }
        }

        this.isProcessing = false;
        console.log(`[PILOT_DISPATCHER] Cycle completed. Success: ${successCount}, Failed: ${failedCount}`);
        return { success: successCount, failed: failedCount };
    }
}

export const pilotAsyncDispatcher = new PilotAsyncDispatcher();
