import { useAppStore } from '../store/useAppStore';

/**
 * Hook seguro que garante que arrays nunca sejam null/undefined
 * Previne erros de "Cannot read properties of null"
 */
export const useSafeAppStore = () => {
    const store = useAppStore();

    return {
        ...store,
        items: store.items || [],
        exams: store.exams || [],
        students: store.students || [],
        schools: store.schools || [],
        classes: store.classes || [],
        users: store.users || [],
        tenants: store.tenants || [],
        results: store.results || [],
        registrations: store.registrations || [],
        announcements: store.announcements || [],
        messages: store.messages || [],
        chatGroups: store.chatGroups || [],
        owlSessions: store.owlSessions || [],
        lessonPlans: store.lessonPlans || [],
        studyPlans: store.studyPlans || [],
        studentProfiles: store.studentProfiles || [],
        userProfiles: store.userProfiles || [],
        gamifiedEvents: store.gamifiedEvents || [],
        institutionalEvents: store.institutionalEvents || [],
        events: store.events || [],
    };
};
