import { AppState, SchoolClass, ScheduledExam, ExamScheduleStatus, ExamStatus } from '../types';

export interface TabletProjection {
    schoolId: string;
    totalStudents: number;
    maxSimultaneousStudents: number;
    recommendedMinTablets: number;
    potentialReuseRate: number; // 0-1 (ex: 0.5 = 50%)
}

export interface SchedulingCampaign {
    type: 'EFFICIENCY' | 'CAPACITY_WARNING' | 'REUSE_SUCCESS';
    message: string;
    suggestedSlots: Date[];
    priority: number;
}

export const logisticsAIService = {
    /**
     * Projeta o reuso de tablets baseado na grade de aulas e turnos.
     * Objetivo: Identificar o pico de alunos simultâneos APÓS otimização de horários.
     */
    projectTabletReuse: (state: AppState, schoolId: string): TabletProjection => {
        const schoolClasses = state.classes.filter(c => c.schoolId === schoolId);

        // Agrupa alunos por turno (Manhã, Tarde, Noite)
        const studentsByShift = {
            MANHA: 0,
            TARDE: 0,
            NOITE: 0
        };

        schoolClasses.forEach(cls => {
            const studentCount = state.students.filter(s => s.classId === cls.id).length || 25; // Default 25 if empty
            studentsByShift[cls.shift] += studentCount;
        });

        const maxSimultaneous = Math.max(studentsByShift.MANHA, studentsByShift.TARDE, studentsByShift.NOITE);
        const totalPotentialStudents = Object.values(studentsByShift).reduce((a, b) => a + b, 0);

        // Taxa de reuso: quão mais eficiente é o estoque em relação ao total de alunos
        const potentialReuseRate = totalPotentialStudents > 0
            ? (totalPotentialStudents - maxSimultaneous) / totalPotentialStudents
            : 0;

        return {
            schoolId,
            totalStudents: totalPotentialStudents,
            maxSimultaneousStudents: maxSimultaneous,
            recommendedMinTablets: Math.ceil(maxSimultaneous * 1.1), // 10% de margem de segurança
            potentialReuseRate
        };
    },

    /**
     * Gera campanhas proativas para o professor.
     */
    generateSchedulingCampaigns: (state: AppState, professorId: string, schoolId: string): SchedulingCampaign[] => {
        const campaigns: SchedulingCampaign[] = [];
        const projection = logisticsAIService.projectTabletReuse(state, schoolId);

        // 1. Campanha de Eficiência (Reuso entre turnos)
        if (projection.potentialReuseRate > 0.4) {
            campaigns.push({
                type: 'EFFICIENCY',
                message: `Sua escola é excelente no reuso de equipamentos! Agendando sua prova para o turno da ${projection.maxSimultaneousStudents === state.classes.filter(c => c.shift === 'MANHA').length ? 'Tarde' : 'Manhã'}, você ajuda a manter nosso estoque mínimo de ${projection.recommendedMinTablets} tablets saudável.`,
                suggestedSlots: [], // Logica de horários livres viria aqui
                priority: 1
            });
        }

        // 2. Alerta de Pico de Capacidade
        // (Verifica se já existem muitos agendamentos pro mesmo dia/turno)
        const upcomingSchedules = state.exams.filter(e => e.schoolId === schoolId && e.status === ExamStatus.PUBLISHED);
        // ... lógica simplificada para o MVP

        return campaigns;
    }
};
