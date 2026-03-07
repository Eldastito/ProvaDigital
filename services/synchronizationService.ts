import { supabase } from './supabaseClient';
import { getSessionService, StudentSession } from './sessionIsolationService';
import { offlineConsolidationService } from './offlineConsolidationService';

export class SynchronizationService {
    private isSyncing = false;
    private timerId: number | null = null;
    private baseIntervalMs = 5000; // 5 segundos base
    private maxIntervalMs = 120000; // Max 2 minutos
    private currentIntervalMs = 5000;
    private sessionService = getSessionService();

    /**
     * Inicia sincronização automática em background com Backoff Exponencial
     */
    startAutoSync(intervalMs: number = 5000) {
        if (this.timerId) return;
        this.baseIntervalMs = intervalMs;
        this.currentIntervalMs = this.baseIntervalMs;
        
        console.log(`🔄 AutoSync iniciado com Backoff Exponencial (Base: ${intervalMs}ms)`);
        this.scheduleNextSync();
    }

    private scheduleNextSync() {
        if (this.timerId) clearTimeout(this.timerId);
        
        this.timerId = window.setTimeout(async () => {
            const hasFailures = await this.executeSyncCycle();
            
            if (hasFailures) {
                // Em caso de falha de internet/banco, aplica o Retry Exponencial
                this.currentIntervalMs = Math.min(this.currentIntervalMs * 2, this.maxIntervalMs);
                console.log(`⚠️ Sincronização falhou. Reagendando com backoff exponencial para ${this.currentIntervalMs}ms`);
            } else {
                // Sucesso: Retorna ao intervalo base
                this.currentIntervalMs = this.baseIntervalMs;
            }
            
            this.scheduleNextSync();
        }, this.currentIntervalMs);
    }

    private async executeSyncCycle(): Promise<boolean> {
        let hasFailures = false;
        
        const s1 = await this.syncPendingSessions();
        if (s1.failed > 0 || (s1.total > 0 && s1.success === 0)) hasFailures = true;
        
        const s2 = await this.syncOfflineSubmissions();
        if (s2.failed > 0 || (s2.total > 0 && s2.success === 0)) hasFailures = true;
        
        // Também busca diretamente do offlineDb caso existam coletas Mesh não processadas pelo IsolationService
        const s3 = await this.syncMeshSubmissions();
        if (s3.failed > 0 || (s3.total > 0 && s3.success === 0)) hasFailures = true;

        return hasFailures;
    }

    /**
     * Para sincronização automática
     */
    stopAutoSync() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
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

    /**
     * Sincroniza provas devolvidas automaticamente via Mesh e salvas no banco offline
     */
    async syncMeshSubmissions(): Promise<{ total: number; success: number; failed: number }> {
        const result = { total: 0, success: 0, failed: 0 };
        try {
            const { getSession, getAllSessions, markAsSynced } = await import('./offlineDb');
            const all = await getAllSessions();
            const pendingMesh = all.filter(s => s.sessionId.startsWith('mesh_') && !s.synced);
            
            result.total = pendingMesh.length;
            if (result.total === 0) return result;

            console.log(`🚀 Sincronizando ${result.total} provas recebidas via MESH Local...`);

            for (const session of pendingMesh) {
                try {
                    // Reutilizar o método uploadSession que faz o insert no exam_results
                    const mockSession: any = {
                        studentId: session.studentId,
                        examId: session.sessionId.split('_')[2], // mesh_uuid_examId
                        encryptedAnswers: JSON.parse(session.encryptedData || '[]'),
                        startedAt: session.timestamp,
                        finishedAt: session.timestamp,
                        telemetry: {},
                        securityEvents: []
                    };

                    await this.uploadSession(mockSession);
                    await markAsSynced(session.sessionId);
                    result.success++;
                } catch (error) {
                    console.error(`❌ Falha ao sincronizar prova Mesh de ${session.studentName}:`, error);
                    result.failed++;
                }
            }
        } catch (e) {
            console.warn("Erro ao ler tabela genérica de sessões do offlineDb", e);
        }
        return result;
    }
}

export const syncService = new SynchronizationService();
