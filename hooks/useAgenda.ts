import { useState, useEffect } from 'react';
import { useSafeAppStore } from '../store/useAppStore';
import { UserRole, Exam, GamifiedEventStatus, ScheduledExam } from '../types';
import { schedulingService } from '../services/schedulingService';
import { AgendaEvent } from '../components/Calendar/AgendaModal';

export const useAgenda = (targetStudentId?: string) => {
    const state = useSafeAppStore();
    const { currentUser: user } = state;

    // Default to current user or provided student (for parents)
    const studentId = targetStudentId || user?.id;
    if (!studentId) return {
        currentMonth: new Date(),
        showAgendaModal: false,
        setShowAgendaModal: () => {},
        changeMonth: () => {},
        getEventsForDay: () => [],
        getAllMonthEvents: () => [],
        daysInMonth: 0,
        firstDayOfMonth: 0
    };
    const student = state.students.find(s => s.id === studentId);

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showAgendaModal, setShowAgendaModal] = useState(false);
    const [schedules, setSchedules] = useState<ScheduledExam[]>([]);

    useEffect(() => {
        let mounted = true;
        schedulingService.getSchedules().then(data => {
            if (mounted) setSchedules(data);
        }).catch(console.error);
        return () => { mounted = false; };
    }, []);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay: firstDayOfMonth } = getDaysInMonth(currentMonth);

    // Exams specific to the student (if student profile exists)
    const myExams = student
        ? state.registrations
            .filter(r => r.studentId === student.id)
            .map(r => state.exams.find(e => e.id === r.examId))
            .filter(Boolean) as Exam[]
        : [];

    // Filter schedules for the student's class
    const studentSchedules = student
        ? schedules.filter(s => s.classIds.includes(student.classId) && s.status !== 'CANCELLED')
        : [];

    const getEventsForDay = (day: number) => {
        const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const schoolId = student?.schoolId || user?.schoolId;

        // Base Institutional Events (Available to all)
        const instEventsForDay: AgendaEvent[] = [];
        state.institutionalEvents?.forEach(e => {
            if (e.schoolId && e.schoolId !== schoolId) return;

            // Common Event (Holiday/Event)
            const start = e.startDate;
            const end = e.endDate || e.startDate;
            if (dateStr >= start && dateStr <= end) {
                instEventsForDay.push({
                    type: e.blocksScheduling ? 'FERIADO' : 'EVENTO',
                    title: e.title,
                    date: dateStr
                });
            }

            // Exam Period
            if (e.examsStartDate && e.examsEndDate && dateStr >= e.examsStartDate && dateStr <= e.examsEndDate) {
                instEventsForDay.push({
                    type: 'PROVA',
                    title: `Janela de Provas: ${e.title}`,
                    date: dateStr
                });
            }
        });

        // Student-specific exams
        const exams = myExams.filter(e => e.scheduledDate === dateStr);
        const scheduledExams = studentSchedules.filter(s => {
            const sy = s.scheduledFor.getFullYear();
            const sm = String(s.scheduledFor.getMonth() + 1).padStart(2, '0');
            const sd = String(s.scheduledFor.getDate()).padStart(2, '0');
            return `${sy}-${sm}-${sd}` === dateStr;
        });

        const announcements = state.announcements.filter(a => a.eventDate === dateStr);
        const gameEvents = student ? state.gamifiedEvents.filter(e =>
            e.participants?.some(p => p.studentId === student.id) &&
            e.eventDate.startsWith(dateStr)
        ) : [];

        return [
            ...exams.map(e => ({
                type: e.title.toLowerCase().includes('trabalho') ? 'TRABALHO' : 'PROVA',
                title: e.title,
                date: e.scheduledDate || ''
            })),
            ...scheduledExams.map(s => ({
                type: s.examTitle.toLowerCase().includes('trabalho') ? 'TRABALHO' : 'PROVA',
                title: s.examTitle,
                date: dateStr
            })),
            ...instEventsForDay,
            ...announcements.map(a => ({
                type: a.type === 'AVISO' ? 'OUTRO' : 'EVENTO',
                title: a.title,
                date: a.eventDate || ''
            })),
            ...gameEvents.map(e => ({
                type: 'COMPETICAO',
                title: e.title,
                date: e.eventDate || ''
            }))
        ];
    };

    const getAllMonthEvents = () => {
        const events = [];
        for (let i = 1; i <= days; i++) {
            const dayEvents = getEventsForDay(i);
            if (dayEvents.length > 0) events.push(...dayEvents.map(e => ({ ...e, day: i })));
        }
        return events;
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentMonth(newDate);
    };

    return {
        currentMonth,
        showAgendaModal,
        setShowAgendaModal,
        changeMonth,
        getEventsForDay,
        getAllMonthEvents,
        daysInMonth: days,
        firstDayOfMonth
    };
};
