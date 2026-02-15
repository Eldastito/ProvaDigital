import { supabase } from './supabaseClient';
import { getSessionService, StudentSession } from './sessionIsolationService';
import { offlineConsolidationService } from './offlineConsolidationService';

export class SynchronizationService {
    private isSyncing = false;
    private syncInterval: number | null = null;
    private sessionService = getSessionService();

    /**
     * Inicia sincronização automática em background
     */
    startAutoSync(intervalMs: number = 60000) {
        if (this.syncInterval) return;

        console.log(`🔄 AutoSync iniciado (${intervalMs}ms)`);
        this.syncInterval = window.setInterval(async () => {
            await this.syncPendingSessions();
            await this.syncOfflineSubmissions();
        }, intervalMs);
    }

    /**
     * Para sincronização automática
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ AutoSync parado');
        }
    }

    /**
     * Tenta sincronizar todas as sessões pendentes
     */
    async syncPendingSessions(): Promise<{ total: number; success: number; failed: number }> {
        if (this.isSyncing) {
            console.log('⚠️ Sincronização já em andamento...');
            return { total: 0, success: 0, failed: 0 };
        }

        this.isSyncing = true;
        const result = { total: 0, success: 0, failed: 0 };

        try {
            const pendingSessions = await this.sessionService.getPendingSessions();
            result.total = pendingSessions.length;

            if (result.total === 0) {
                return result;
            }

            console.log(`🚀 Iniciando sincronização de ${result.total} sessões...`);

            for (const session of pendingSessions) {
                try {
                    await this.uploadSession(session);
                    await this.sessionService.markAsUploaded(session.id);
                    result.success++;
                } catch (error) {
                    console.error(`❌ Falha ao sincronizar sessão ${session.id}:`, error);
                    result.failed++;
                }
            }

            console.log(`✅ Sincronização concluída. Sucesso: ${result.success}, Falhas: ${result.failed}`);
        } catch (error) {
            console.error('❌ Erro crítico no processo de sincronização:', error);
        } finally {
            this.isSyncing = false;
        }

        return result;
    }

    /**
     * Envia uma única sessão para o Supabase
     */
    private async uploadSession(session: StudentSession): Promise<void> {
        // 1. Salvar resultado consolidado na tabela exam_results
        // (Assume que esta tabela existe com base na Sprint 3)
        const { error: resultError } = await supabase
            .from('exam_results')
            .insert({
                student_id: session.studentId, // Assumindo que table usa snake_case
                exam_id: session.examId,
                score: 0, // Nota deve ser calculada pelo gradingService antes ou trigger
                answers: session.encryptedAnswers, // JSONB
                started_at: session.startedAt,
                finished_at: session.finishedAt,
                metadata: {
                    telemetry: session.telemetry,
                    security_events: session.securityEvents
                }
            });

        if (resultError) {
            throw new Error(`Erro Supabase (Result): ${resultError.message}`);
        }

        // 2. Opcional: Salvar logs de auditoria detalhados
    }

    /**
     * Sincroniza submissões coletadas via Scanner Offline
     */
    async syncOfflineSubmissions(): Promise<{ total: number; success: number; failed: number }> {
        const result = { total: 0, success: 0, failed: 0 };

        try {
            const submissions = await offlineConsolidationService.getAllSubmissions();
            result.total = submissions.length;

            if (result.total === 0) return result;

            console.log(`🚀 Sincronizando ${result.total} submissões offline (Scanner)...`);

            for (const sub of submissions) {
                try {
                    // Reutilizar a lógica de upload (pode precisar de ajustes se o formato for diferente)
                    // Adaptando OfflineSubmission para StudentSession para reuso
                    const mockSession: any = {
                        studentId: sub.studentId,
                        examId: sub.examId,
                        encryptedAnswers: sub.encryptedAnswers,
                        startedAt: sub.scannedAt,
                        finishedAt: sub.scannedAt, // Aproximação
                        telemetry: {},
                        securityEvents: []
                    };

                    await this.uploadSession(mockSession);
                    await offlineConsolidationService.deleteSubmission(sub.eventId, sub.studentId);
                    result.success++;
                } catch (error) {
                    console.error(`❌ Falha ao sincronizar submissão offline de ${sub.studentName}:`, error);
                    result.failed++;
                }
            }
        } catch (error) {
            console.error('Erro na sincronização offline:', error);
        }

        return result;
    }
}

export const syncService = new SynchronizationService();
