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

export interface UseStudentSessionProps {
    examId: string;
    eventId: string;
}

export interface UseStudentSessionReturn {
    // Session estado
    currentSession: StudentSession | null;
    isSessionActive: boolean;

    // Actions
    startSession: (studentId: string, studentName: string) => Promise<void>;
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

    const service = getSessionService();

    /**
     * Inicia nova sessão para o aluno
     */
    const startSession = useCallback(async (studentId: string, studentName: string) => {
        try {
            const session = await service.startSession(
                studentId,
                studentName,
                examId,
                eventId
            );

            setCurrentSession(session);
            setIsSessionActive(true);

            console.log(`✅ Sessão iniciada: ${studentName}`);

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
            console.log(`✅ Sessão finalizada: ${completedSession.id}`);

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
     * Sincroniza estado ao remontar componente
     */
    useEffect(() => {
        const existingSession = service.getCurrentSession();
        if (existingSession) {
            setCurrentSession(existingSession);
            setIsSessionActive(true);
            console.log('🔄 Sessão existente detectada:', existingSession.studentName);
        }
    }, []);

    /**
     * Cleanup ao desmontar
     */
    useEffect(() => {
        return () => {
            // NÃO faz logout automático ao desmontar
            // Sessão continua até logout explícito
        };
    }, []);

    return {
        currentSession,
        isSessionActive,
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
