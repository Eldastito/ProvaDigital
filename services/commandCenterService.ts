/**
 * Command Center Service
 * 
 * Gerencia sessões de provas ativas e ações centralizadas.
 * Sprint 0 - Parte 2
 */

import { supabase } from './supabaseClient';

// Tipos
export interface ExamSession {
    id: string;
    examId: string;
    examTitle: string;
    classId: string;
    className: string;
    startedAt: Date;
    endsAt: Date;
    studentsTotal: number;
    studentsConnected: number;
    studentsCompleted: number;
    averageProgress: number;
    violationsCount: number;
    networkMode: 'ONLINE' | 'OFFLINE';
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    createdBy: string;
    config?: any;
}

export interface SessionStats {
    totalStudents: number;
    connected: number;
    completed: number;
    inProgress: number;
    averageProgress: number;
    averageScore: number;
    violationsTotal: number;
    timeRemaining: number;
}

export interface BroadcastMessage {
    sessionId: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'ALERT';
    sentBy: string;
    sentAt: Date;
}

/**
 * Service para central de comando
 */
export class CommandCenterService {
    /**
     * Buscar todas as sessões ativas
     */
    async getActiveSessions(): Promise<ExamSession[]> {
        try {
            // Buscar de exam_events (provas ao vivo)
            const { data: events, error } = await supabase
                .from('exam_events')
                .select(`
          *,
          exam:exams(*),
          class:classes(*)
        `)
                .in('status', ['ACTIVE', 'PAUSED'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            const sessions: ExamSession[] = [];

            for (const event of events || []) {
                // Contar alunos
                const { count: totalStudents } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'ALUNO')
                    .contains('class_ids', [event.class_id]);

                // Contar alunos conectados (sessions ativas)
                const { count: connectedStudents } = await supabase
                    .from('exam_attempts')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event.id)
                    .eq('status', 'IN_PROGRESS');

                // Contar completados
                const { count: completedStudents } = await supabase
                    .from('exam_attempts')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event.id)
                    .eq('status', 'COMPLETED');

                // Calcular progresso médio
                const { data: attempts } = await supabase
                    .from('exam_attempts')
                    .select('answers_data')
                    .eq('event_id', event.id)
                    .eq('status', 'IN_PROGRESS');

                let avgProgress = 0;
                if (attempts && attempts.length > 0) {
                    const totalProgress = attempts.reduce((sum, attempt) => {
                        const answersCount = attempt.answers_data
                            ? Object.keys(attempt.answers_data).length
                            : 0;
                        return sum + answersCount;
                    }, 0);
                    avgProgress = Math.round((totalProgress / attempts.length / (event.exam?.items?.length || 1)) * 100);
                }

                // Contar violações
                const { count: violations } = await supabase
                    .from('security_events')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event.id);

                sessions.push({
                    id: event.id,
                    examId: event.exam_id,
                    examTitle: event.exam?.title || 'Sem título',
                    classId: event.class_id,
                    className: event.class?.name || 'Sem turma',
                    startedAt: new Date(event.created_at),
                    endsAt: new Date(new Date(event.created_at).getTime() + (event.duration || 60) * 60000),
                    studentsTotal: totalStudents || 0,
                    studentsConnected: connectedStudents || 0,
                    studentsCompleted: completedStudents || 0,
                    averageProgress: avgProgress,
                    violationsCount: violations || 0,
                    networkMode: event.meta_info?.networkMode || 'ONLINE',
                    status: event.status,
                    createdBy: event.created_by || 'unknown',
                    config: event.meta_info
                });
            }

            console.log(`📊 ${sessions.length} sessões ativas encontradas`);
            return sessions;
        } catch (error) {
            console.error('❌ Erro ao buscar sessões ativas:', error);
            return [];
        }
    }

    /**
     * Buscar sessão por ID
     */
    async getSessionById(sessionId: string): Promise<ExamSession | null> {
        try {
            const sessions = await this.getActiveSessions();
            return sessions.find(s => s.id === sessionId) || null;
        } catch (error) {
            console.error('❌ Erro ao buscar sessão:', error);
            return null;
        }
    }

    /**
     * Pausar sessão
     */
    async pauseSession(sessionId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('exam_events')
                .update({ status: 'PAUSED' })
                .eq('id', sessionId);

            if (error) throw error;

            console.log(`⏸️ Sessão pausada: ${sessionId}`);

            // Broadcast para alunos
            await this.broadcastMessage(sessionId, {
                message: 'Prova pausada pelo professor. Aguarde instruções.',
                type: 'WARNING',
                sentBy: 'system',
                sentAt: new Date()
            });
        } catch (error) {
            console.error('❌ Erro ao pausar sessão:', error);
            throw error;
        }
    }

    /**
     * Retomar sessão
     */
    async resumeSession(sessionId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('exam_events')
                .update({ status: 'ACTIVE' })
                .eq('id', sessionId);

            if (error) throw error;

            console.log(`▶️ Sessão retomada: ${sessionId}`);

            // Broadcast para alunos
            await this.broadcastMessage(sessionId, {
                message: 'Prova retomada. Você pode continuar.',
                type: 'INFO',
                sentBy: 'system',
                sentAt: new Date()
            });
        } catch (error) {
            console.error('❌ Erro ao retomar sessão:', error);
            throw error;
        }
    }

    /**
     * Estender tempo de uma sessão
     */
    async extendTime(sessionId: string, minutes: number): Promise<void> {
        try {
            // Buscar evento atual
            const { data: event, error: fetchError } = await supabase
                .from('exam_events')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (fetchError) throw fetchError;

            const newDuration = (event.duration || 60) + minutes;

            const { error } = await supabase
                .from('exam_events')
                .update({ duration: newDuration })
                .eq('id', sessionId);

            if (error) throw error;

            console.log(`⏱️ Tempo estendido em ${minutes}min para sessão: ${sessionId}`);

            // Broadcast para alunos
            await this.broadcastMessage(sessionId, {
                message: `Tempo estendido em ${minutes} minutos.`,
                type: 'INFO',
                sentBy: 'system',
                sentAt: new Date()
            });
        } catch (error) {
            console.error('❌ Erro ao estender tempo:', error);
            throw error;
        }
    }

    /**
     * Enviar mensagem broadcast
     */
    async broadcastMessage(sessionId: string, message: Omit<BroadcastMessage, 'sessionId'>): Promise<void> {
        try {
            // Salvar no banco (opcional, para histórico)
            const { error } = await supabase
                .from('broadcast_messages')
                .insert({
                    id: crypto.randomUUID(),
                    session_id: sessionId,
                    message: message.message,
                    type: message.type,
                    sent_by: message.sentBy,
                    sent_at: message.sentAt.toISOString()
                });

            if (error) console.warn('Aviso ao salvar broadcast:', error);

            // Enviar via Realtime
            const channel = supabase.channel(`exam:${sessionId}`);
            await channel.send({
                type: 'broadcast',
                event: 'message',
                payload: message
            });

            console.log(`📢 Broadcast enviado para sessão: ${sessionId}`);
        } catch (error) {
            console.error('❌ Erro ao enviar broadcast:', error);
            throw error;
        }
    }

    /**
     * Encerrar sessão antecipadamente
     */
    async endSession(sessionId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('exam_events')
                .update({ status: 'COMPLETED' })
                .eq('id', sessionId);

            if (error) throw error;

            console.log(`🏁 Sessão encerrada: ${sessionId}`);

            // Broadcast para alunos
            await this.broadcastMessage(sessionId, {
                message: 'Prova encerrada pelo professor.',
                type: 'ALERT',
                sentBy: 'system',
                sentAt: new Date()
            });

            // Finalizar tentativas ativas
            await supabase
                .from('exam_attempts')
                .update({
                    status: 'COMPLETED',
                    finished_at: new Date().toISOString()
                })
                .eq('event_id', sessionId)
                .eq('status', 'IN_PROGRESS');
        } catch (error) {
            console.error('❌ Erro ao encerrar sessão:', error);
            throw error;
        }
    }

    /**
     * Buscar estatísticas detalhadas de uma sessão
     */
    async getSessionStats(sessionId: string): Promise<SessionStats> {
        try {
            const session = await this.getSessionById(sessionId);
            if (!session) {
                throw new Error('Sessão não encontrada');
            }

            // Buscar resultados para calcular média
            const { data: results } = await supabase
                .from('exam_results')
                .select('score, max_score')
                .eq('event_id', sessionId);

            let averageScore = 0;
            if (results && results.length > 0) {
                const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
                const totalMax = results.reduce((sum, r) => sum + (r.max_score || 100), 0);
                averageScore = Math.round((totalScore / totalMax) * 100);
            }

            const timeRemaining = Math.max(
                0,
                Math.floor((session.endsAt.getTime() - Date.now()) / 60000)
            );

            return {
                totalStudents: session.studentsTotal,
                connected: session.studentsConnected,
                completed: session.studentsCompleted,
                inProgress: session.studentsConnected - session.studentsCompleted,
                averageProgress: session.averageProgress,
                averageScore,
                violationsTotal: session.violationsCount,
                timeRemaining
            };
        } catch (error) {
            console.error('❌ Erro ao buscar stats:', error);
            throw error;
        }
    }

    /**
     * Buscar visão geral global (todas as sessões)
     */
    async getGlobalOverview(): Promise<{
        totalActiveSessions: number;
        totalStudentsConnected: number;
        totalViolations: number;
        averageProgress: number;
    }> {
        try {
            const sessions = await this.getActiveSessions();

            return {
                totalActiveSessions: sessions.length,
                totalStudentsConnected: sessions.reduce((sum, s) => sum + s.studentsConnected, 0),
                totalViolations: sessions.reduce((sum, s) => sum + s.violationsCount, 0),
                averageProgress: sessions.length > 0
                    ? Math.round(sessions.reduce((sum, s) => sum + s.averageProgress, 0) / sessions.length)
                    : 0
            };
        } catch (error) {
            console.error('❌ Erro ao buscar overview global:', error);
            return {
                totalActiveSessions: 0,
                totalStudentsConnected: 0,
                totalViolations: 0,
                averageProgress: 0
            };
        }
    }

    /**
     * Forçar sincronização de dados
     */
    async forceSync(sessionId: string): Promise<void> {
        try {
            console.log(`🔄 Forçando sincronização para sessão: ${sessionId}`);

            // Broadcast para alunos sincronizarem
            await this.broadcastMessage(sessionId, {
                message: 'Sincronizando dados...',
                type: 'INFO',
                sentBy: 'system',
                sentAt: new Date()
            });
        } catch (error) {
            console.error('❌ Erro ao forçar sync:', error);
            throw error;
        }
    }
}

// Export singleton
export const commandCenterService = new CommandCenterService();
