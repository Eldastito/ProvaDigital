import { AppStore } from '../store/useAppStore';
import { TabletOptimizationService, ExamSchedule } from '../services/tabletOptimizationService';

/**
 * Adaptador que extrai dados reais da Agenda de Provas (exams) e converte 
 * para o formato do TabletOptimizationService.
 */
export const getRealLogisticsDemand = (state: AppStore) => {
    const { exams, classes, students, schools, users } = state;

    // 1. Filtrar provas agendadas (status PUBLISHED)
    const activeExams = exams.filter(e => e.status === 'PUBLISHED');

    if (activeExams.length === 0) {
        return null;
    }

    // 2. Mapear para o formato ExamSchedule do serviço de otimização
    const schedules: ExamSchedule[] = activeExams.map(exam => {
        const school = schools.find(s => s.id === exam.schoolId);
        const cls = classes.find(c => c.id === exam.classIds[0]); // Pega a primeira turma como referência de pico
        const professor = users.find(u => u.id === exam.creatorId);
        const studentCount = students.filter(s => exam.classIds.includes(s.classId)).length;

        return {
            id: exam.id,
            examId: exam.id,
            examName: exam.title,
            schoolId: exam.schoolId,
            schoolName: school?.name || 'Escola Indefinida',
            classId: exam.classIds[0] || 'c1',
            className: cls?.name || 'Turma Geral',
            studentCount: studentCount || exam.targetQuestionCount || 0,
            date: exam.scheduledDate || new Date().toISOString().split('T')[0],
            startTime: '08:00', // Mock: No futuro viria do agendamento detalhado
            duration: exam.durationMinutes || 60,
            professorId: exam.creatorId,
            professorName: professor?.name || 'Professor'
        };
    });

    // 3. Executar otimização real
    return TabletOptimizationService.optimizeDay(schedules);
};
