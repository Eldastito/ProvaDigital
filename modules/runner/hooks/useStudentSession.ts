/**
 * useStudentSession Hook
 * 
 * Hook customizado que encapsula o sessionIsolationService
 * para uso no StudentApp com isolamento multi-login.
 * 
 * Segue arquitetura modular do projeto.
 */

import { useState, useEffect, useCallback } from 'react';
import { getSessionService, StudentSession } from '../../../services/sessionIsolationService';
import { nativeBridge } from '../../../services/nativeBridgeService';

export interface UseStudentSessionProps {
    examId: string;
    eventId: string;
}

export interface UseStudentSessionReturn {
    // Session estado
    currentSession: StudentSession | null;
    isSessionActive: boolean;
    isHydrating: boolean;

    // Actions
    startSession: (studentId: string, studentName: string, attemptId?: string) => Promise<void>;
    saveAnswer: (questionId: number, answer: string | string[]) => Promise<void>;
    logSecurityEvent: (type: string, severity: 'LOW' | 'MEDIUM' | 'HIGH', metadata?: any) => Promise<void>;
    updateTelemetry: (data: any) => Promise<void>;
    finishSession: () => Promise<StudentSession>;
    logout: () => void;

    // Helpers
    getPendingSessions: () => Promise<StudentSession[]>;
    generateDailyReport: () => Promise<string>;
}

export function useStudentSession({ examId, eventId }: UseStudentSessionProps): UseStudentSessionReturn {
    const [currentSession, setCurrentSession] = useState<StudentSession | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isHydrating, setIsHydrating] = useState(true);

    const service = getSessionService();

    /**
     * Inicia nova sessão para o aluno (ou reativa local existente)
     */
    const startSession = useCallback(async (studentId: string, studentName: string, attemptId?: string, requestId?: string) => {
        try {
            const session = await service.startSession(
                studentId,
                studentName,
                examId,
                eventId,
                attemptId,
                requestId
            );

            setCurrentSession(session);
            setIsSessionActive(true);

            console.log(`✅ Sessão ${session.status === 'ACTIVE' && session.version > 1 ? 'reativada' : 'iniciada'}: ${studentName}`);

        } catch (error) {
            console.error('❌ Erro ao iniciar sessão:', error);
            throw error;
        }
    }, [examId, eventId]);

    /**
     * Salva resposta de uma questão
     */
    const saveAnswer = useCallback(async (questionId: number, answer: string | string[]) => {
        if (!isSessionActive) {
            console.warn('Nenhuma sessão ativa');
            return;
        }

        try {
            await service.saveAnswer(questionId, answer);

            // Atualizar estado local
            const updatedSession = service.getCurrentSession();
            setCurrentSession(updatedSession);

            // [E2] Double-Write SQLite (Redundância Nativa)
            if (updatedSession) {
                nativeBridge.saveNativeAnswer({
                    examId: updatedSession.examId,
                    studentId: updatedSession.studentId,
                    questionId: String(questionId),
                    value: typeof answer === 'string' ? answer : JSON.stringify(answer),
                    requestId: updatedSession.requestId || `REQ-${Date.now()}`,
                    savedAt: new Date().toISOString()
                }).catch((e: any) => console.warn('⚠️ Double-Write failed:', e));
            }

        } catch (error) {
            console.error('❌ Erro ao salvar resposta:', error);
            throw error;
        }
    }, [isSessionActive]);

    /**
     * Registra evento de segurança
     */
    const logSecurityEvent = useCallback(async (
        type: string,
        severity: 'LOW' | 'MEDIUM' | 'HIGH',
        metadata?: any
    ) => {
        if (!isSessionActive) return;

        try {
            await service.logSecurityEvent(type as any, severity, metadata);

            // Atualizar estado local
            const updatedSession = service.getCurrentSession();
            setCurrentSession(updatedSession);

        } catch (error) {
            console.error('❌ Erro ao registrar evento de segurança:', error);
        }
    }, [isSessionActive]);

    /**
     * Atualiza telemetria
     */
    const updateTelemetry = useCallback(async (data: any) => {
        if (!isSessionActive) return;

        try {
            await service.updateTelemetry(data);
        } catch (error) {
            console.error('❌ Erro ao atualizar telemetria:', error);
        }
    }, [isSessionActive]);

    /**
     * Finaliza sessão (aluno termina prova)
     */
    const finishSession = useCallback(async (): Promise<StudentSession> => {
        if (!isSessionActive) {
            throw new Error('Nenhuma sessão ativa');
        }

        try {
            const completedSession = await service.finishSession();

            // NÃO faz logout automaticamente - aguarda QR Code
            console.log(`✅ Sessão finalizada: ${completedSession.sessionId}`);

            return completedSession;

        } catch (error) {
            console.error('❌ Erro ao finalizar sessão:', error);
            throw error;
        }
    }, [isSessionActive]);

    /**
     * Logout - limpa RAM mas mantém dados no IndexedDB
     */
    const logout = useCallback(() => {
        if (!isSessionActive) {
            console.warn('Nenhuma sessão ativa para logout');
            return;
        }

        service.logout();
        setCurrentSession(null);
        setIsSessionActive(false);

        console.log('🚪 Logout completo. RAM limpa.');
    }, [isSessionActive]);

    /**
     * Obtém sessões pendentes de upload
     */
    const getPendingSessions = useCallback(async (): Promise<StudentSession[]> => {
        try {
            return await service.getPendingSessions();
        } catch (error) {
            console.error('❌ Erro ao buscar sessões pendentes:', error);
            return [];
        }
    }, []);

    /**
     * Gera relatório do dia do tablet
     */
    const generateDailyReport = useCallback(async (): Promise<string> => {
        try {
            return await service.generateDailyReport();
        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error);
            return 'Erro ao gerar relatório';
        }
    }, []);

    /**
     * ❄️ Cold Boot Recovery (Fase 2)
     * Recupera sessão via Context Pointer (O(1)) com fallback para Dual-Read.
     */
    useEffect(() => {
        const recoverSession = async () => {
            if (isSessionActive || currentSession) {
                setIsHydrating(false);
                return;
            }

            try {
                // 1. Primário: Lookup via Ponteiro Ativo (O(1))
                console.log('❄️ [COLD BOOT] Buscando ponteiro ativo...');
                let session = await service.findActiveAttemptByContext(eventId, '', examId);

                // 2. Fallback: Dual-Read p/ Migração de Legado (Varredura Ampla)
                if (!session) {
                    console.log('📡 [DUAL-READ] Ponteiro não encontrado ou inconsistente. Iniciando varredura de legado...');
                    const allSessions = await service.getAllSessions();
                    const legacySession = allSessions.find(s => 
                        s.examId === examId && 
                        s.eventId === eventId && 
                        s.status === 'ACTIVE'
                    );

                    if (legacySession) {
                        console.log('♻️ [MIGRATION] Sessão legada encontrada. Convertendo para modelo canônico...');
                        session = await service.startSession(
                            legacySession.studentId,
                            legacySession.studentName,
                            legacySession.examId,
                            legacySession.eventId,
                            legacySession.attempt_id,
                            legacySession.requestId
                        );
                        
                        // Adicionar metadado de migração
                        session.origin = 'LEGACY_MIGRATED';
                        session.migrationMetadata = {
                            migratedAt: new Date().toISOString(),
                            source: 'cold_boot_dual_read',
                            version: 'phase2_v1'
                        };
                    }
                }

                if (session) {
                    console.log(`✅ [COLD BOOT] Sessão recuperada: ${session.sessionId}`);
                    setCurrentSession(session);
                    setIsSessionActive(true);
                }

            } catch (err) {
                console.warn('⚠️ Erro na recuperação de Cold Boot:', err);
            } finally {
                setIsHydrating(false);
            }
        };

        // Só tenta recuperar se soubermos os IDs básicos (depende do contexto da prova)
        if (examId && eventId) {
            recoverSession();
        } else {
            setIsHydrating(false);
        }
    }, [examId, eventId, isSessionActive]);

    /**
     * Sincroniza estado RAM ao remontar componente (Nível 0)
     */
    useEffect(() => {
        const existingSession = service.getCurrentSession();
        if (existingSession) {
            setCurrentSession(existingSession);
            setIsSessionActive(true);
            setIsHydrating(false);
            console.log('🔄 Sessão em RAM detectada:', existingSession.studentName);
        }
    }, []);

    return {
        currentSession,
        isSessionActive,
        isHydrating,
        startSession,
        saveAnswer,
        logSecurityEvent,
        updateTelemetry,
        finishSession,
        logout,
        getPendingSessions,
        generateDailyReport
    };
}
