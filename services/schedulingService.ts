/**
 * Scheduling Service
 * 
 * Gerencia agendamento de provas para turmas.
 * Sprint 0 - Parte 1
 */

import { supabase } from './supabaseClient';

// Tipos
import { ScheduledExam, ScheduleConflict as Conflict, ExamScheduleStatus, ScheduleFilters } from '../types';

/**
 * Service para gerenciar agendamentos de provas
 */
export class SchedulingService {
    /**
     * Criar novo agendamento
     */
    async createSchedule(data: Omit<ScheduledExam, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduledExam> {
        try {
            // Verificar conflitos antes de criar
            const conflicts = await this.checkConflicts(data.classIds, data.scheduledFor, data.duration);

            if (conflicts.length > 0) {
                throw new Error(`Conflitos detectados: ${conflicts.map(c => c.message).join(', ')}`);
            }

            const schedule: ScheduledExam = {
                ...data,
                id: crypto.randomUUID(),
                createdAt: new Date()
            };

            const { data: created, error } = await supabase
                .from('exam_schedules')
                .insert({
                    id: schedule.id,
                    exam_id: schedule.examId,
                    exam_title: schedule.examTitle,
                    class_ids: schedule.classIds,
                    scheduled_for: schedule.scheduledFor.toISOString(),
                    duration: schedule.duration,
                    mode: schedule.mode,
                    config: schedule.config,
                    status: schedule.status,
                    created_by: schedule.createdBy,
                    created_at: schedule.createdAt.toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Agendamento criado:', schedule.id);

            // Enviar notificações
            await this.sendNotifications(schedule.id);

            return this.mapFromDB(created);
        } catch (error) {
            console.error('❌ Erro ao criar agendamento:', error);
            throw error;
        }
    }

    /**
     * Atualizar agendamento existente
     */
    async updateSchedule(id: string, data: Partial<ScheduledExam>): Promise<ScheduledExam> {
        try {
            const updates: any = {
                updated_at: new Date().toISOString()
            };

            if (data.examId) updates.exam_id = data.examId;
            if (data.examTitle) updates.exam_title = data.examTitle;
            if (data.classIds) updates.class_ids = data.classIds;
            if (data.scheduledFor) updates.scheduled_for = data.scheduledFor.toISOString();
            if (data.duration) updates.duration = data.duration;
            if (data.mode) updates.mode = data.mode;
            if (data.config) updates.config = data.config;
            if (data.status) updates.status = data.status;

            const { data: updated, error } = await supabase
                .from('exam_schedules')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Agendamento atualizado:', id);

            return this.mapFromDB(updated);
        } catch (error) {
            console.error('❌ Erro ao atualizar agendamento:', error);
            throw error;
        }
    }

    /**
     * Deletar agendamento
     */
    async deleteSchedule(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('exam_schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('✅ Agendamento deletado:', id);
        } catch (error) {
            console.error('❌ Erro ao deletar agendamento:', error);
            throw error;
        }
    }

    /**
     * Cancelar agendamento (soft delete)
     */
    async cancelSchedule(id: string): Promise<ScheduledExam> {
        return this.updateSchedule(id, { status: ExamScheduleStatus.CANCELLED });
    }

    /**
     * Buscar agendamentos com filtros
     */
    async getSchedules(filters: ScheduleFilters = {}): Promise<ScheduledExam[]> {
        try {
            let query = supabase.from('exam_schedules').select('*');

            if (filters.classId) {
                query = query.contains('class_ids', [filters.classId]);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.mode) {
                query = query.eq('mode', filters.mode);
            }

            if (filters.dateFrom) {
                query = query.gte('scheduled_for', filters.dateFrom.toISOString());
            }

            if (filters.dateTo) {
                query = query.lte('scheduled_for', filters.dateTo.toISOString());
            }

            const { data, error } = await query.order('scheduled_for', { ascending: true });

            if (error) throw error;

            return (data || []).map(this.mapFromDB);
        } catch (error) {
            console.error('❌ Erro ao buscar agendamentos:', error);
            return [];
        }
    }

    /**
     * Buscar agendamento por ID
     */
    async getScheduleById(id: string): Promise<ScheduledExam | null> {
        try {
            const { data, error } = await supabase
                .from('exam_schedules')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return data ? this.mapFromDB(data) : null;
        } catch (error) {
            console.error('❌ Erro ao buscar agendamento:', error);
            return null;
        }
    }

    /**
     * Verificar conflitos de horário
     */
    async checkConflicts(
        classIds: string[],
        scheduledFor: Date,
        duration: number
    ): Promise<Conflict[]> {
        try {
            const conflicts: Conflict[] = [];
            const endTime = new Date(scheduledFor.getTime() + duration * 60000);

            // Buscar agendamentos existentes para as turmas
            const existingSchedules = await this.getSchedules({
                dateFrom: new Date(scheduledFor.getTime() - 24 * 60 * 60 * 1000), // 1 dia antes
                dateTo: new Date(scheduledFor.getTime() + 24 * 60 * 60 * 1000) // 1 dia depois
            });

            for (const existing of existingSchedules) {
                // Ignorar agendamentos cancelados
                if (existing.status === 'CANCELLED') continue;

                // Verificar sobreposição de turmas
                const hasClassOverlap = existing.classIds.some(id => classIds.includes(id));

                if (hasClassOverlap) {
                    const existingEnd = new Date(
                        existing.scheduledFor.getTime() + existing.duration * 60000
                    );

                    // Verificar sobreposição de horário
                    const hasTimeOverlap = (
                        (scheduledFor >= existing.scheduledFor && scheduledFor < existingEnd) ||
                        (endTime > existing.scheduledFor && endTime <= existingEnd) ||
                        (scheduledFor <= existing.scheduledFor && endTime >= existingEnd)
                    );

                    if (hasTimeOverlap) {
                        conflicts.push({
                            type: 'EXAM_OVERLAP',
                            message: `Conflito com "${existing.examTitle}" agendado para ${existing.scheduledFor.toLocaleString()}`,
                            conflictingSchedule: existing
                        });
                    }
                }
            }

            return conflicts;
        } catch (error) {
            console.error('❌ Erro ao verificar conflitos:', error);
            return [];
        }
    }

    /**
     * Enviar notificações
     */
    async sendNotifications(scheduleId: string): Promise<void> {
        try {
            const schedule = await this.getScheduleById(scheduleId);
            if (!schedule) return;

            console.log(`📧 Enviando notificações para agendamento: ${schedule.examTitle}`);

            // TODO: Implementar envio real de email/push
            // Por enquanto, apenas log
            console.log(`   → Turmas: ${schedule.classIds.join(', ')}`);
            console.log(`   → Data: ${schedule.scheduledFor.toLocaleString()}`);
            console.log(`   → Modo: ${schedule.mode}`);
        } catch (error) {
            console.error('❌ Erro ao enviar notificações:', error);
        }
    }

    /**
     * Marcar como ativa (quando começar)
     */
    async activateSchedule(id: string): Promise<ScheduledExam> {
        return this.updateSchedule(id, { status: ExamScheduleStatus.ACTIVE });
    }

    /**
     * Marcar como completa (quando terminar)
     */
    async completeSchedule(id: string): Promise<ScheduledExam> {
        return this.updateSchedule(id, { status: ExamScheduleStatus.COMPLETED });
    }

    /**
     * Buscar próximos agendamentos (próximas 24h)
     */
    async getUpcoming(): Promise<ScheduledExam[]> {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        return this.getSchedules({
            status: ExamScheduleStatus.SCHEDULED,
            dateFrom: now,
            dateTo: tomorrow
        });
    }

    /**
     * Mapear do formato DB para o formato da aplicação
     */
    private mapFromDB(data: any): ScheduledExam {
        return {
            id: data.id,
            examId: data.exam_id,
            examTitle: data.exam_title,
            classIds: data.class_ids || [],
            scheduledFor: new Date(data.scheduled_for),
            duration: data.duration,
            mode: data.mode,
            config: data.config || {
                proctoring: true,
                shuffle: true,
                timeLimit: data.duration,
                allowReview: false
            },
            status: data.status,
            createdBy: data.created_by,
            createdAt: new Date(data.created_at),
            updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
        };
    }
}

// Export singleton
export const schedulingService = new SchedulingService();
