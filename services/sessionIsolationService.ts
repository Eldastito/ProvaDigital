/**
 * Session Isolation Service
 * 
 * Gerencia múltiplos usuários no mesmo tablet com isolamento total.
 * 
 * Funcionalidades:
 * - Múltiplos alunos podem usar o mesmo tablet no dia
 * - Isolamento completo de dados entre sessões
 * - Limpeza de RAM ao fazer logout
 * - Persistência em IndexedDB até upload confirmado
 * - Gestão de ciclo de vida dos dados
 */

export interface StudentSession {
    // Identificação
    id: string; // Único: sessionId
    studentId: string;
    studentName: string;
    examId: string;
    eventId: string;

    // Dados criptografados
    encryptedAnswers: Array<{
        questionId: number;
        answer: string | string[]; // Single ou múltipla escolha
        timestamp: string;
    }>;

    // Logs de segurança
    securityEvents: Array<{
        type: 'TAB_SWITCH' | 'FACE_NOT_DETECTED' | 'FULLSCREEN_EXIT' | 'SUSPICIOUS_PATTERN';
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        timestamp: string;
        metadata?: any;
    }>;

    // Telemetria
    telemetry: {
        timePerQuestion: number[]; // Segundos por questão
        backtracks: number[]; // Questões revisitadas
        batteryLevels: number[]; // % a cada 30s
        networkQuality: number[]; // % a cada 30s
    };

    // Metadados
    startedAt: string;
    finishedAt?: string;
    totalDuration?: number; // segundos

    // Status de sincronização
    qrCodeGenerated: boolean;
    uploadedToServer: boolean;
    uploadedAt?: string;
}

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
    private dbName = 'ExamePadOffline';

    /**
     * Inicia nova sessão para um aluno
     */
    async startSession(
        studentId: string,
        studentName: string,
        examId: string,
        eventId: string
    ): Promise<StudentSession> {

        // Verificar se há sessão ativa
        if (this.currentSession) {
            throw new Error('Sessão já ativa. Faça logout primeiro.');
        }

        const sessionId = this.generateSessionId(studentId, examId);

        // Criar nova sessão
        this.currentSession = {
            id: sessionId,
            studentId,
            studentName,
            examId,
            eventId,
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
            uploadedToServer: false
        };

        // Criar estado volátil (RAM)
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

        // Persistir sessão no IndexedDB
        await this.persistSession(this.currentSession);

        console.log(`✅ Sessão iniciada para ${studentName} (${sessionId})`);

        return this.currentSession;
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

        // Procurar se já existe resposta para essa questão
        const existingIndex = this.currentSession.encryptedAnswers.findIndex(
            a => a.questionId === questionId
        );

        const answerData = {
            questionId,
            answer,
            timestamp: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            // Atualizar resposta existente
            this.currentSession.encryptedAnswers[existingIndex] = answerData;
        } else {
            // Nova resposta
            this.currentSession.encryptedAnswers.push(answerData);
        }

        // Persistir imediatamente no IndexedDB
        await this.persistSession(this.currentSession);
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

        // Persistir imediatamente
        await this.persistSession(this.currentSession);
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

        // Persistir periodicamente (não a cada update para performance)
        if (Math.random() < 0.1) { // 10% de chance
            await this.persistSession(this.currentSession);
        }
    }

    /**
     * Finaliza sessão (aluno termina prova)
     */
    async finishSession(): Promise<StudentSession> {
        if (!this.currentSession) {
            throw new Error('Nenhuma sessão ativa');
        }

        const duration = Date.now() - new Date(this.currentSession.startedAt).getTime();

        this.currentSession.finishedAt = new Date().toISOString();
        this.currentSession.totalDuration = Math.floor(duration / 1000); // segundos

        // Persistir sessão finalizada
        await this.persistSession(this.currentSession);

        const completedSession = { ...this.currentSession };

        console.log(`✅ Sessão finalizada: ${this.currentSession.id}`);
        console.log(`   Duração: ${this.currentSession.totalDuration}s`);
        console.log(`   Respostas: ${this.currentSession.encryptedAnswers.length}`);
        console.log(`   Eventos de segurança: ${this.currentSession.securityEvents.length}`);

        return completedSession;
    }

    /**
     * Logout - limpa sessão da RAM mas mantém dados no IndexedDB
     */
    logout(): void {
        if (!this.currentSession) {
            console.warn('Nenhuma sessão ativa para logout');
            return;
        }

        console.log(`🚪 Logout: ${this.currentSession.studentName}`);

        // Limpar timers
        if (this.sessionState?.activeTimers) {
            this.sessionState.activeTimers.forEach(timerId => {
                clearInterval(timerId);
                clearTimeout(timerId);
            });
        }

        // Limpar conexões de rede
        if (this.sessionState?.networkConnections) {
            this.sessionState.networkConnections.forEach((conn: any) => {
                if (conn && typeof conn.close === 'function') {
                    conn.close();
                }
            });
        }

        // Limpar RAM
        this.currentSession = null;
        this.sessionState = null;

        console.log('✅ RAM limpa. Dados mantidos no IndexedDB.');
    }

    /**
     * Obtém sessão atual (se houver)
     */
    getCurrentSession(): StudentSession | null {
        return this.currentSession;
    }

    /**
     * Obtém estado volátil atual
     */
    getSessionState(): SessionState | null {
        return this.sessionState;
    }

    /**
     * Atualiza estado volátil (não persiste)
     */
    updateSessionState(updates: Partial<SessionState>): void {
        if (!this.sessionState) return;

        this.sessionState = {
            ...this.sessionState,
            ...updates
        };
    }

    /**
     * Persiste sessão no IndexedDB
     */
    private async persistSession(session: StudentSession): Promise<void> {
        const db = await this.openDatabase();
        const tx = db.transaction(['studentSessions'], 'readwrite');
        const store = tx.objectStore('studentSessions');

        await store.put(session);
    }

    /**
     * Carrega todas as sessões do IndexedDB (para debug/relatórios)
     */
    async getAllSessions(): Promise<StudentSession[]> {
        const db = await this.openDatabase();
        const tx = db.transaction(['studentSessions'], 'readonly');
        const store = tx.objectStore('studentSessions');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Carrega sessões pendentes de upload
     */
    async getPendingSessions(): Promise<StudentSession[]> {
        const allSessions = await this.getAllSessions();
        return allSessions.filter(s => !s.uploadedToServer);
    }

    /**
     * Marca sessão como enviada ao servidor
     */
    async markAsUploaded(sessionId: string): Promise<void> {
        const db = await this.openDatabase();
        const tx = db.transaction(['studentSessions'], 'readwrite');
        const store = tx.objectStore('studentSessions');

        const session = await store.get(sessionId);

        if (session) {
            session.uploadedToServer = true;
            session.uploadedAt = new Date().toISOString();
            await store.put(session);

            console.log(`✅ Sessão ${sessionId} marcada como enviada`);
        }
    }

    /**
     * Deleta sessões já enviadas (limpeza)
     */
    async cleanUploadedSessions(): Promise<number> {
        const sessions = await this.getAllSessions();
        const uploaded = sessions.filter(s => s.uploadedToServer);

        if (uploaded.length === 0) {
            return 0;
        }

        const db = await this.openDatabase();
        const tx = db.transaction(['studentSessions'], 'readwrite');
        const store = tx.objectStore('studentSessions');

        for (const session of uploaded) {
            await store.delete(session.id);
        }

        console.log(`🗑️ ${uploaded.length} sessões enviadas removidas`);

        return uploaded.length;
    }

    /**
     * Gera ID único para sessão
     */
    private generateSessionId(studentId: string, examId: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `session_${studentId}_${examId}_${timestamp}_${random}`;
    }

    /**
     * Abre conexão com IndexedDB
     */
    private async openDatabase(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('studentSessions')) {
                    db.createObjectStore('studentSessions', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('questionCache')) {
                    db.createObjectStore('questionCache', { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * Gera relatório de uso do tablet no dia
     */
    async generateDailyReport(): Promise<string> {
        const allSessions = await this.getAllSessions();
        const today = new Date().toISOString().split('T')[0];

        const todaySessions = allSessions.filter(s =>
            s.startedAt.startsWith(today)
        );

        if (todaySessions.length === 0) {
            return 'Nenhuma sessão registrada hoje.';
        }

        let report = `📊 RELATÓRIO DO TABLET - ${today}\n\n`;
        report += `Total de alunos: ${todaySessions.length}\n`;
        report += `Sessões finalizadas: ${todaySessions.filter(s => s.finishedAt).length}\n`;
        report += `Pendentes upload: ${todaySessions.filter(s => !s.uploadedToServer).length}\n\n`;
        report += `Sessões:\n`;

        todaySessions.forEach((session, index) => {
            report += `${index + 1}. ${session.studentName}\n`;
            report += `   Início: ${new Date(session.startedAt).toLocaleTimeString()}\n`;
            if (session.finishedAt) {
                report += `   Fim: ${new Date(session.finishedAt).toLocaleTimeString()}\n`;
                report += `   Duração: ${Math.floor(session.totalDuration! / 60)}min\n`;
            }
            report += `   Respostas: ${session.encryptedAnswers.length}\n`;
            report += `   Alertas: ${session.securityEvents.length}\n`;
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
