import { PersistenceGateway } from './persistenceGateway';
import { StoredSession } from '../types';

// O serviço passa a usar o tipo StoredSession do offlineDb para consistência
export type StudentSession = StoredSession;

export interface SessionState {
    // Estado volátil (RAM) - limpo ao logout
    currentQuestion: number;
    uiState: {
        scrollPosition: number;
        examMode: 'normal' | 'review';
        flaggedQuestions: number[];
    };
    activeTimers: number[];
    networkConnections: any[];
}

export class SessionIsolationService {
    private currentSession: StudentSession | null = null;
    private sessionState: SessionState | null = null;

    /**
     * Inicia nova sessão ou reativa sessão existente para um aluno
     */
    async startSession(
        studentId: string,
        studentName: string,
        examId: string,
        eventId: string,
        attemptId?: string
    ): Promise<StudentSession> {

        // 1. Verificar se há sessão ativa na RAM
        if (this.currentSession && 
            this.currentSession.studentId === studentId && 
            this.currentSession.examId === examId) {
            console.log('🔄 Reativando sessão da RAM...');
            return this.currentSession;
        }

        // 2. Tentar encontrar sessão persistente (O(1) via Gateway)
        let existingSession = await this.findSessionByContext(eventId, studentId, examId);

        if (existingSession) {
            console.log(`📡 [RESUME] Sessão compatível encontrada: ${existingSession.sessionId}`);
            this.currentSession = existingSession;
            
            if (attemptId && !this.currentSession.attempt_id) {
                this.currentSession.attempt_id = attemptId;
            }
        } else {
            const sessionId = `auth_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)}`;
            const storageKey = this.generateStorageKey(eventId, studentId, examId);

            // Criar nova sessão
            this.currentSession = {
                sessionId: sessionId,
                storage_key: storageKey,
                studentId,
                studentName,
                examId,
                eventId,
                attempt_id: attemptId,
                encryptedAnswers: [],
                securityEvents: [],
                telemetry: {
                    timePerQuestion: [],
                    backtracks: [],
                    batteryLevels: [],
                    networkQuality: []
                },
                startedAt: new Date().toISOString(),
                qrCodeGenerated: false,
                synced: false,
                uploadedToServer: false
            };
            console.log(`✅ Nova sessão criada para ${studentName} (${sessionId})`);
        }

        // Criar estado volátil (RAM) se não houver
        if (!this.sessionState) {
            this.sessionState = {
                currentQuestion: 1,
                uiState: {
                    scrollPosition: 0,
                    examMode: 'normal',
                    flaggedQuestions: []
                },
                activeTimers: [],
                networkConnections: []
            };
        }

        // Persistir (Update ou Create) via Gateway
        if (this.currentSession) {
            await PersistenceGateway.saveSession(this.currentSession);
        }

        return this.currentSession;
    }

    /**
     * Gera chave determinística única para armazenamento persistente
     */
    private generateStorageKey(eventId: string, studentId: string, examId: string): string {
        return `storage_${eventId}_${studentId}_${examId}`;
    }

    /**
     * Busca sessão por contexto (O(1))
     */
    async findSessionByContext(
        eventId: string, 
        studentId: string, 
        examId: string
    ): Promise<StudentSession | null> {
        const storageKey = this.generateStorageKey(eventId, studentId, examId);
        
        // Busca Direta via Índice storage_key (O(1)) no Gateway
        const session = await PersistenceGateway.findSessionByStorageKey(storageKey);
        
        if (session) {
            console.log(`📡 [RESUME] Sessão canônica encontrada: ${session.sessionId}`);
            return session as StudentSession;
        }

        return null;
    }

    /**
     * Salva resposta de uma questão
     */
    async saveAnswer(
        questionId: number,
        answer: string | string[]
    ): Promise<void> {

        if (!this.currentSession) {
            throw new Error('Nenhuma sessão ativa');
        }

        const existingIndex = this.currentSession.encryptedAnswers.findIndex(
            a => a.questionId === questionId
        );

        const answerData = {
            questionId,
            answer,
            timestamp: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            this.currentSession.encryptedAnswers[existingIndex] = answerData;
        } else {
            this.currentSession.encryptedAnswers.push(answerData);
        }

        // Persistir via Gateway
        await PersistenceGateway.saveSession(this.currentSession);
    }

    /**
     * Registra evento de segurança
     */
    async logSecurityEvent(
        type: StudentSession['securityEvents'][0]['type'],
        severity: StudentSession['securityEvents'][0]['severity'],
        metadata?: any
    ): Promise<void> {

        if (!this.currentSession) return;

        this.currentSession.securityEvents.push({
            type,
            severity,
            timestamp: new Date().toISOString(),
            metadata
        });

        await PersistenceGateway.saveSession(this.currentSession);
    }

    /**
     * Atualiza telemetria
     */
    async updateTelemetry(
        data: Partial<StudentSession['telemetry']>
    ): Promise<void> {

        if (!this.currentSession) return;

        if (data.timePerQuestion) {
            this.currentSession.telemetry.timePerQuestion.push(...data.timePerQuestion);
        }
        if (data.backtracks) {
            this.currentSession.telemetry.backtracks.push(...data.backtracks);
        }
        if (data.batteryLevels) {
            this.currentSession.telemetry.batteryLevels.push(...data.batteryLevels);
        }
        if (data.networkQuality) {
            this.currentSession.telemetry.networkQuality.push(...data.networkQuality);
        }

        // Persistência oportunista via Gateway
        if (Math.random() < 0.1) {
            await PersistenceGateway.saveSession(this.currentSession);
        }
    }

    /**
     * Finaliza sessão
     */
    async finishSession(): Promise<StudentSession> {
        if (!this.currentSession) {
            throw new Error('Nenhuma sessão ativa');
        }

        const duration = Date.now() - new Date(this.currentSession.startedAt).getTime();

        this.currentSession.finishedAt = new Date().toISOString();
        this.currentSession.totalDuration = Math.floor(duration / 1000);

        await PersistenceGateway.saveSession(this.currentSession);

        return { ...this.currentSession };
    }

    /**
     * Logout
     */
    logout(): void {
        if (!this.currentSession) return;

        if (this.sessionState?.activeTimers) {
            this.sessionState.activeTimers.forEach(timerId => {
                clearInterval(timerId);
                clearTimeout(timerId);
            });
        }

        if (this.sessionState?.networkConnections) {
            this.sessionState.networkConnections.forEach((conn: any) => {
                if (conn && typeof conn.close === 'function') {
                    conn.close();
                }
            });
        }

        this.currentSession = null;
        this.sessionState = null;
    }

    getCurrentSession(): StudentSession | null {
        return this.currentSession;
    }

    getSessionState(): SessionState | null {
        return this.sessionState;
    }

    updateSessionState(updates: Partial<SessionState>): void {
        if (!this.sessionState) return;

        this.sessionState = {
            ...this.sessionState,
            ...updates
        };
    }

    /**
     * Métodos delegados ao Gateway
     */
    async getAllSessions(): Promise<StudentSession[]> {
        return await PersistenceGateway.getAllSessions() as StudentSession[];
    }

    async getPendingSessions(): Promise<StudentSession[]> {
        return await PersistenceGateway.getPendingSessions() as StudentSession[];
    }

    async markAsUploaded(sessionId: string): Promise<void> {
        await PersistenceGateway.updateSession(sessionId, {
            uploadedToServer: true as any,
            uploadedAt: new Date().toISOString()
        });
    }

    async cleanUploadedSessions(): Promise<number> {
        const sessions = await PersistenceGateway.getAllSessions();
        const toDelete = sessions.filter(s => s.uploadedToServer).map(s => s.sessionId);
        
        if (toDelete.length > 0) {
            await PersistenceGateway.deleteSessions(toDelete);
        }
        
        return toDelete.length;
    }

    /**
     * Gera relatório diário
     */
    async generateDailyReport(): Promise<string> {
        const allSessions = await this.getAllSessions();
        const today = new Date().toISOString().split('T')[0];

        const todaySessions = allSessions.filter((s: StudentSession) =>
            s.startedAt.startsWith(today)
        );

        if (todaySessions.length === 0) {
            return 'Nenhuma sessão registrada hoje.';
        }

        let report = `📊 RELATÓRIO DO TABLET - ${today}\n\n`;
        report += `Total de alunos: ${todaySessions.length}\n`;
        report += `Sessões finalizadas: ${todaySessions.filter((s: StudentSession) => s.finishedAt).length}\n`;
        report += `Pendentes upload: ${todaySessions.filter((s: StudentSession) => !s.uploadedToServer).length}\n\n`;
        report += `Sessões:\n`;

        todaySessions.forEach((session: StudentSession, index: number) => {
            report += `${index + 1}. ${session.studentName}\n`;
            report += `   Status: ${session.uploadedToServer ? '✅ Enviado' : '⏳ Pendente'}\n\n`;
        });

        return report;
    }
}

// Singleton para uso global
let sessionService: SessionIsolationService | null = null;

export function getSessionService(): SessionIsolationService {
    if (!sessionService) {
        sessionService = new SessionIsolationService();
    }
    return sessionService;
}
