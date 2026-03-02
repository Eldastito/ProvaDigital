import { useState, useEffect } from 'react';
import { useSafeAppStore } from '../../../store/useAppStore';
import { AnalyticsService } from '../../../services/analyticsService';
import { UserRole, RiskLevel, Exam, ExamResult, GamifiedEventStatus, ScheduledExam } from '../../../types';
import { useFeatureFlag } from '../../../context/FeatureFlagContext';
import { MOCK_TENANT_ID } from '../../../utils/mockData';
import { schedulingService } from '../../../services/schedulingService';

export const useStudentDashboard = () => {
    const state = useSafeAppStore();
    const { currentUser: user, registerStudentToEvent, setOwlTutorContext } = state;
    const isParent = user.role === UserRole.PAIS;
    const { isEnabled } = useFeatureFlag();

    // Student Selection Logic
    let studentIdToView = user.id;
    if (isParent) {
        if (state.selectedChildId) {
            studentIdToView = state.selectedChildId;
        } else if (user.childrenIds && user.childrenIds.length > 0) {
            studentIdToView = user.childrenIds[0];
        }
    }

    const foundStudent = state.students.find(s => s.id === studentIdToView);

    // Graceful Degradation
    const student = foundStudent || {
        id: 'guest-' + user.id,
        name: user.name || 'Estudante',
        email: user.email,
        role: UserRole.ALUNO,
        tenantId: user.tenantId || MOCK_TENANT_ID,
        schoolId: '',
        classId: '',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    } as any;

    const analytics = new AnalyticsService(state);

    const realStats = foundStudent ? analytics.getStudentStats(foundStudent.id) : null;
    const stats = realStats || {
        studentId: student.id,
        examsTaken: 0,
        averageScore: 0,
        idgScore: 0,
        attendanceRate: 0,
        completionRate: 0,
        riskLevel: RiskLevel.LOW,
        missingPointsForApproval: 10,
        strengthSubjects: [],
        weaknessSubjects: [],
        examAverage: 0,
        projectAverage: 0,
        bonusPoints: 0
    };

    const profile = foundStudent ? state.studentProfiles?.find(p => p.studentId === foundStudent.id) : null;
    const extendedProfile = foundStudent ? state.userProfiles?.find(p => p.userId === foundStudent.id) : null;

    // State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [rankingMode, setRankingMode] = useState<'ACADEMIC' | 'XP'>('ACADEMIC');
    const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
    const [showAgendaModal, setShowAgendaModal] = useState(false);
    const [showEventRules, setShowEventRules] = useState<string | null>(null);
    const [schedules, setSchedules] = useState<ScheduledExam[]>([]);

    useEffect(() => {
        let mounted = true;
        schedulingService.getSchedules().then(data => {
            if (mounted) setSchedules(data);
        }).catch(console.error);
        return () => { mounted = false; };
    }, []);

    // Derived Data
    const recentResults = state.results
        .filter(r => r.studentId === student.id)
        .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

    const chartData = state.results
        .filter(r => r.studentId === student.id)
        .sort((a, b) => new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime())
        .map(r => {
            const exam = state.exams.find(e => e.id === r.examId);
            return {
                label: exam?.subject.slice(0, 3) || 'Av',
                value: r.totalScore
            };
        });

    const lastTwoResults = chartData.slice(-2);
    const trend = lastTwoResults.length === 2 ? lastTwoResults[1].value - lastTwoResults[0].value : 0;

    const availableEvents = state.gamifiedEvents.filter(e =>
        e.schoolId === student.schoolId &&
        e.status === GamifiedEventStatus.OPEN &&
        !e.participants?.some(p => p.studentId === student.id)
    );

    const myActiveEvents = state.gamifiedEvents.filter(e =>
        e.participants?.some(p => p.studentId === student.id) &&
        e.status !== GamifiedEventStatus.FINISHED
    );

    // Actions
    const handleAcceptEvent = (eventId: string) => {
        if (confirm("Você leu as regras e deseja se inscrever?")) {
            registerStudentToEvent(eventId, student.id);
            setShowEventRules(null);
        }
    };

    const calculateRanks = () => {
        const getMetric = (sId: string) => {
            if (rankingMode === 'ACADEMIC') {
                return analytics.getStudentStats(sId)?.idgScore || 0;
            } else {
                const p = state.userProfiles?.find(up => up.userId === sId);
                return p?.owlCoins || 0;
            }
        };

        const classStudents = state.students.filter(s => s.classId === student.classId);
        const sortedClass = classStudents.sort((a, b) => getMetric(b.id) - getMetric(a.id));
        const classRank = sortedClass.findIndex(s => s.id === student.id) + 1;

        const schoolStudents = state.students.filter(s => s.schoolId === student.schoolId);
        const sortedSchool = schoolStudents.sort((a, b) => getMetric(b.id) - getMetric(a.id));
        const schoolRank = sortedSchool.findIndex(s => s.id === student.id) + 1;

        const allStudents = state.students.filter(s => s.tenantId === student.tenantId);
        const sortedGeneral = allStudents.sort((a, b) => getMetric(b.id) - getMetric(a.id));
        const generalRank = sortedGeneral.findIndex(s => s.id === student.id) + 1;

        return { classRank, schoolRank, generalRank, totalClass: classStudents.length, totalSchool: schoolStudents.length, totalGeneral: allStudents.length };
    };

    const ranks = calculateRanks();

    // Calendar Helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay: firstDayOfMonth } = getDaysInMonth(currentMonth);

    const myExams = state.registrations
        .filter(r => r.studentId === student.id)
        .map(r => state.exams.find(e => e.id === r.examId))
        .filter(Boolean) as Exam[];

    const studentSchedules = schedules.filter(s => s.classIds.includes(student.classId) && s.status !== 'CANCELLED');

    const getEventsForDay = (day: number) => {
        const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const exams = myExams.filter(e => e.scheduledDate === dateStr);
        const scheduledExams = studentSchedules.filter(s => {
            const sy = s.scheduledFor.getFullYear();
            const sm = String(s.scheduledFor.getMonth() + 1).padStart(2, '0');
            const sd = String(s.scheduledFor.getDate()).padStart(2, '0');
            return `${sy}-${sm}-${sd}` === dateStr;
        });

        const announcements = state.announcements.filter(a => a.eventDate === dateStr);
        const gameEvents = state.gamifiedEvents.filter(e =>
            e.participants?.some(p => p.studentId === student.id) &&
            e.eventDate.startsWith(dateStr)
        );
        const studentSchoolId = student.schoolId || user.schoolId;
        const instEventsForDay: any[] = [];
        state.institutionalEvents?.forEach(e => {
            if (e.schoolId && e.schoolId !== studentSchoolId) return;

            // Evento comum (Feriado/Evento)
            const start = e.startDate;
            const end = e.endDate || e.startDate;
            if (dateStr >= start && dateStr <= end) {
                instEventsForDay.push({
                    type: e.blocksScheduling ? 'FERIADO' : 'EVENTO',
                    title: e.title,
                    date: dateStr
                });
            }

            // Janela de Provas (NOVO)
            if (e.examsStartDate && e.examsEndDate && dateStr >= e.examsStartDate && dateStr <= e.examsEndDate) {
                instEventsForDay.push({
                    type: 'PROVA',
                    title: `Janela de Provas: ${e.title}`,
                    date: dateStr
                });
            }
        });

        return [
            ...exams.map(e => ({
                type: e.title.toLowerCase().includes('trabalho') ? 'TRABALHO' : 'PROVA',
                title: e.title,
                date: e.scheduledDate
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
                date: a.eventDate
            })),
            ...gameEvents.map(e => ({
                type: 'COMPETICAO',
                title: e.title,
                date: e.eventDate
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
        user,
        student,
        isParent,
        stats,
        profile,
        extendedProfile,
        ranks,
        trend,
        chartData,
        recentResults,
        availableEvents,
        myActiveEvents,

        // State
        currentMonth,
        showRankingModal, setShowRankingModal,
        rankingMode, setRankingMode,
        selectedResult, setSelectedResult,
        showAgendaModal, setShowAgendaModal,
        showEventRules, setShowEventRules,

        // Actions
        handleAcceptEvent,
        changeMonth,
        getEventsForDay,
        getAllMonthEvents,
        daysInMonth: days,
        firstDayOfMonth,

        // Global
        state,
        isEnabled,
        setOwlTutorContext
    };
};
