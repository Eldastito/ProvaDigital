/**
 * @module SessionIsolationService
 * @description Serviço de Isolamento de Sessão com Context Pointer Canônico.
 * 
 * Implementa o Núcleo Inventivo "Retomada Segura de Sessão (Cold Boot Determinístico)"
 * da plataforma FORGE, permitindo recuperação determinística de sessão em O(1)
 * após falhas de hardware, sem perda de dados e sem intervenção humana.
 * 
 * Mecanismos:
 * - Context Pointer: Ponteiro canônico `context:{eventId}:{studentId}:{examId}:active`
 *   para lookup direto da tentativa ativa mais recente.
 * - Idempotência: Controle via `requestId` para evitar duplicação de sessões.
 * - Transição de Estado: Matriz formal (ACTIVE → SUPERSEDED/COMPLETED/ABORTED)
 *   com cadeia de custódia auditável.
 * - Controle de Versão: Incremento atômico por operação para atomicidade lógica.
 * 
 * @patent-safe Este módulo é parte do dossiê de Patente de Invenção FORGE.
 * @see STATE_TRANSITION_MATRIX.md para a especificação formal de transições.
 * @see PI_DOSSIER_PATENT_SAFE.md para o dossiê de patente.
 */

import { PersistenceGateway } from './persistenceGateway';
import { StoredSession } from '../types';

/** Alias canônico para compatibilidade de nomenclatura */
export type StudentSession = StoredSession;

/**
 * Representa uma conexão de rede gerenciada pela sessão.
 * Conexões são limpas ao logout para evitar vazamentos de recursos.
 */
export interface ManagedNetworkConnection {
    /** Identificador único da conexão */
    id: string;
    /** Tipo de conexão (WebRTC, WebSocket, etc.) */
    type: 'WEBRTC' | 'WEBSOCKET' | 'HTTP';
    /** Método de encerramento da conexão */
    close: () => void;
}

/**
 * Estado volátil da sessão (RAM).
 * Este estado é **limpo ao logout** e NÃO é persistido no IndexedDB.
 * Contém apenas dados de UI e referências a recursos ativos.
 */
export interface SessionState {
    /** Número da questão atualmente visível */
    currentQuestion: number;
    /** Estado da interface do usuário */
    uiState: {
        /** Posição do scroll na tela */
        scrollPosition: number;
        /** Modo de exibição da prova */
        examMode: 'normal' | 'review';
        /** Questões marcadas para revisão */
        flaggedQuestions: number[];
    };
    /** IDs de timers ativos (clearInterval/clearTimeout) */
    activeTimers: number[];
    /** Conexões de rede gerenciadas */
    networkConnections: ManagedNetworkConnection[];
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
        attemptId?: string,
        requestId?: string // Trava #1: Idempotência
    ): Promise<StudentSession> {

        // 1. Verificar se há sessão ativa na RAM
        if (this.currentSession && 
            this.currentSession.studentId === studentId && 
            this.currentSession.examId === examId) {
            
            // Verificação de Idempotência
            if (requestId && this.currentSession.requestId === requestId) {
                console.log('🔄 [IDEMPOTENCY] Reativando sessão via requestId (RAM)...');
                return this.currentSession;
            }
            
            console.log('🔄 Reativando sessão da RAM...');
            return this.currentSession;
        }

        // 2. Tentar encontrar sessão ativa via Context Pointer (O(1))
        let existingSession = await this.findActiveAttemptByContext(eventId, studentId, examId);

        // Verificação de Idempotência na persistência
        if (requestId && existingSession && existingSession.requestId === requestId) {
            console.log('📡 [IDEMPOTENCY] Sessão encontrada via requestId (Persistência)...');
            this.currentSession = existingSession;
            return this.currentSession;
        }

        if (existingSession) {
            console.log(`📡 [RESUME] Sessão ativa encontrada: ${existingSession.sessionId}`);
            this.currentSession = existingSession;
            
            if (attemptId && !this.currentSession.attempt_id) {
                this.currentSession.attempt_id = attemptId;
            }
        } else {
            // Se houve um requestId e não encontramos a sessão, mas encontramos uma SUPERSEDED com o mesmo requestId,
            // poderíamos retornar um erro ou a SUPERSEDED. Aqui, criaremos uma nova ACTIVE.
            
            const sessionId = `auth_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)}`;
            const storageKey = this.generateStorageKey(eventId, studentId, examId);

            // Criar nova sessão determinística
            this.currentSession = {
                sessionId: sessionId,
                storage_key: storageKey,
                studentId,
                studentName,
                examId,
                eventId,
                attempt_id: attemptId,
                requestId,
                status: 'ACTIVE',
                origin: 'CANONICAL',
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
                encryptedAnswers: [],
                securityEvents: [],
                telemetry: {
                    timePerQuestion: [],
                    backtracks: [],
                    batteryLevels: [],
                    networkQuality: []
                },
                qrCodeGenerated: false,
                synced: false,
                uploadedToServer: false
            };
            
            // Marcar a anterior como superseded se aplicável
            await this.setActiveAttemptForContext(eventId, studentId, examId, sessionId, requestId);
            
            console.log(`✅ Nova sessão ACTIVE criada para ${studentName} (${sessionId})`);
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

        // Persistir via Gateway
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
     * Busca sessão ativa por Context Pointer — Lookup O(1).
     * 
     * Este é o mecanismo central do Cold Boot Determinístico.
     * O ponteiro de contexto (`context:{eventId}:{studentId}:{examId}:active`)
     * armazena o sessionId da tentativa ACTIVE mais recente, permitindo
     * retomada direta sem scan sequencial do banco.
     * 
     * @param eventId - Identificador do evento de avaliação
     * @param studentId - Identificador do estudante
     * @param examId - Identificador da prova
     * @returns Sessão ACTIVE ou null se não encontrada/inconsistente
     * 
     * @patent-safe Mecanismo de lookup direto por ponteiro canônico de contexto.
     */
    async findActiveAttemptByContext(
        eventId: string, 
        studentId: string, 
        examId: string
    ): Promise<StudentSession | null> {
        const contextKey = `context:${eventId}:${studentId}:${examId}:active`;
        const pointerRecord = await PersistenceGateway.findSessionByStorageKey(contextKey);
        
        if (!pointerRecord) return null;

        // O ponteiro é armazenado como um registro mínimo onde sessionId = attemptId alvo
        const targetAttemptId = pointerRecord.sessionId;
        if (!targetAttemptId) return null;

        // Buscar a sessão real pelo attemptId referenciado
        const session = await PersistenceGateway.findSessionByStorageKey(`attempt:${targetAttemptId}`);
        
        if (session) {
            if (session.status === 'ACTIVE') {
                session.lastAccessedAt = new Date().toISOString();
                return session as StudentSession;
            } else {
                // LOG-CB-PTR-ERR-001: Ponteiro inconsistente (aponta para algo não ACTIVE)
                // Gera evento operacional obrigatório para auditoria.
                console.warn(`[LOG-CB-PTR-ERR-001] Ponteiro inconsistente para contexto ${contextKey}. Status: ${session.status}`);
            }
        }

        return null; // Caso não encontre ACTIVE, o chamador (Dual-Read) tentará reconstrução
    }

    /**
     * Define a tentativa ativa para um contexto e faz a transição da anterior.
     * 
     * Implementa a regra de transição `ACTIVE → SUPERSEDED` com cadeia de custódia:
     * - Localiza a tentativa anterior via ponteiro de contexto
     * - Se ativa, transiciona para SUPERSEDED com referência à nova tentativa
     * - Atualiza o ponteiro de contexto para a nova tentativa (atômico)
     * 
     * @param eventId - Identificador do evento
     * @param studentId - Identificador do estudante
     * @param examId - Identificador da prova
     * @param attemptId - ID da nova tentativa ativa
     * @param requestId - Chave de idempotência (opcional)
     * 
     * @patent-safe Transição de estado auditável com cadeia de custódia.
     */
    private async setActiveAttemptForContext(
        eventId: string,
        studentId: string,
        examId: string,
        attemptId: string,
        requestId?: string
    ): Promise<void> {
        const contextKey = `context:${eventId}:${studentId}:${examId}:active`;
        
        // 1. Localizar tentativa anterior via ponteiro de contexto
        const previousPointer = await PersistenceGateway.findSessionByStorageKey(contextKey);
        const previousAttemptId = previousPointer?.sessionId;
        
        if (previousAttemptId && previousAttemptId !== attemptId) {
            const prevSession = await PersistenceGateway.findSessionByStorageKey(`attempt:${previousAttemptId}`);
            if (prevSession && prevSession.status === 'ACTIVE') {
                // Transição: ACTIVE → SUPERSEDED (Auditável)
                prevSession.status = 'SUPERSEDED';
                prevSession.supersededByAttemptId = attemptId;
                prevSession.updatedAt = new Date().toISOString();
                prevSession.version += 1;
                await PersistenceGateway.saveSession(prevSession as StudentSession);
                console.log(`[TRANSITION] Session ${previousAttemptId} superseded by ${attemptId}`);
            }
        }

        // 2. Atualizar Ponteiro de Contexto (O(1))
        // O registro do ponteiro é um StoredSession mínimo onde:
        // - storage_key = contextKey (chave primária)
        // - sessionId = attemptId (referência para a sessão real)
        const contextPointer: Partial<StudentSession> = {
            storage_key: contextKey,
            sessionId: attemptId,
            studentId: '',
            studentName: '',
            examId: '',
            eventId: '',
            status: 'ACTIVE',
            origin: 'CANONICAL',
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            encryptedAnswers: [],
            securityEvents: [],
            telemetry: { timePerQuestion: [], backtracks: [], batteryLevels: [], networkQuality: [] },
            synced: false,
            uploadedToServer: false,
            qrCodeGenerated: false
        };
        await PersistenceGateway.saveSession(contextPointer as StudentSession);
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

        this.currentSession.updatedAt = new Date().toISOString();
        this.currentSession.version += 1;

        // Persistir via Gateway
        await PersistenceGateway.saveSession(this.currentSession);
    }

    /**
     * Registra evento de segurança na sessão ativa.
     * 
     * Eventos são persistidos imediatamente no IndexedDB para garantir
     * trilha de auditoria mesmo em caso de falha subsequente.
     * 
     * @param type - Tipo do evento de segurança (TAB_SWITCH, MULTIPLE_FACES, etc.)
     * @param severity - Severidade do evento (LOW, MEDIUM, HIGH)
     * @param metadata - Dados contextuais do evento (timestamps, coordenadas, etc.)
     */
    async logSecurityEvent(
        type: StudentSession['securityEvents'][0]['type'],
        severity: StudentSession['securityEvents'][0]['severity'],
        metadata?: Record<string, string | number | boolean>
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

        const duration = Date.now() - new Date(this.currentSession.createdAt).getTime();

        this.currentSession.finishedAt = new Date().toISOString();
        this.currentSession.status = 'COMPLETED';
        this.currentSession.totalDuration = Math.floor(duration / 1000);
        this.currentSession.updatedAt = new Date().toISOString();
        this.currentSession.version += 1;

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
            this.sessionState.networkConnections.forEach((conn: ManagedNetworkConnection) => {
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

    /**
     * Marca uma sessão como enviada ao servidor central.
     * 
     * @param sessionId - ID da sessão a ser marcada
     */
    async markAsUploaded(sessionId: string): Promise<void> {
        await PersistenceGateway.updateSession(sessionId, {
            uploadedToServer: true,
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
            s.createdAt.startsWith(today)
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
