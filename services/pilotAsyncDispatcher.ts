
import { pilotOutboxService, PilotOutboxItem, ErrorClassification } from './pilotOutboxService';

/**
 * Simulação de um Client de Integração Externo
 */
class ExternalLMSClient {
    async sendPayload(payload: any): Promise<void> {
        // Simulação de latência de rede
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Simulação de erro aleatório para testar dispatcher (10% de chance)
        if (Math.random() < 0.1) {
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
                // 4. Falha: Por enquanto tratamos como transiente (RETRY_SCHEDULED)
                // O Step 7.2C vai classificar os erros.
                pilotOutboxService.updateStatus(item.event_id, 'RETRY_SCHEDULED', {
                    message: error.message,
                    type: 'TRANSIENT'
                });
                failedCount++;
            }
        }

        this.isProcessing = false;
        console.log(`[PILOT_DISPATCHER] Cycle completed. Success: ${successCount}, Failed: ${failedCount}`);
        return { success: successCount, failed: failedCount };
    }
}

export const pilotAsyncDispatcher = new PilotAsyncDispatcher();
