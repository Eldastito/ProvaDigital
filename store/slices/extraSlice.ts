import { StateCreator } from 'zustand';
import { Announcement, ChatMessage, ChatGroup, GamifiedEvent, ArcadeGame, LessonPlan, StudyPlan, MentorshipRequest, NeuroReportDelivery, DiaryEntry } from '../../types';
import { AppStore } from '../useAppStore';
import { supabase } from '../../services/supabaseClient';

export interface ExtraSlice {
    announcements: Announcement[];
    messages: ChatMessage[];
    chatGroups: ChatGroup[];
    gamifiedEvents: GamifiedEvent[];
    arcadeGames: ArcadeGame[];
    lessonPlans: LessonPlan[];
    studyPlans: StudyPlan[];
    mentorshipRequests: MentorshipRequest[];
    mentorships: any[];
    neuroReportDeliveries: NeuroReportDelivery[];
    diaryEntries: DiaryEntry[];

    addAnnouncement: (anc: Announcement) => void;
    addGamifiedEvent: (event: GamifiedEvent) => void;
    updateGamifiedEvent: (event: GamifiedEvent) => void;
    addLessonPlan: (plan: LessonPlan) => void;
    addStudyPlan: (plan: StudyPlan) => void;
    updateStudyPlan: (plan: StudyPlan) => void;
    addArcadeGame: (game: ArcadeGame) => void;
    updateArcadeGame: (game: ArcadeGame) => void;
    deleteArcadeGame: (id: string) => void;
    updateMessages: (messages: ChatMessage[]) => void;
    updateChatGroups: (groups: ChatGroup[]) => void;
    addDiaryEntries: (entries: DiaryEntry[]) => Promise<void>;
    loadDiaryEntries: (userId: string, role: string) => Promise<void>;
    addNeuroReportDelivery: (delivery: NeuroReportDelivery) => Promise<void>;
    addMentorshipRequest: (request: MentorshipRequest) => void;
    acceptMentorshipRequest: (requestId: string) => Promise<void>;
    confirmMentorship: (mentorshipId: string) => Promise<void>;
    registerStudentToEvent: (eventId: string, studentId: string) => Promise<void>;
}

export const createExtraSlice: StateCreator<AppStore, [], [], ExtraSlice> = (set, get) => ({
    announcements: [],
    messages: [],
    chatGroups: [],
    gamifiedEvents: [],
    arcadeGames: [],
    lessonPlans: [],
    studyPlans: [],
    mentorshipRequests: [],
    mentorships: [],
    neuroReportDeliveries: [],
    diaryEntries: [],

    addAnnouncement: (anc) => set((state) => ({ announcements: [...state.announcements, anc] })),
    addGamifiedEvent: (event) => set((state) => ({ gamifiedEvents: [...state.gamifiedEvents, event] })),
    updateGamifiedEvent: (event) => set((state) => ({
        gamifiedEvents: state.gamifiedEvents.map(e => e.id === event.id ? event : e)
    })),
    addLessonPlan: (plan) => set((state) => ({ lessonPlans: [...state.lessonPlans, plan] })),
    addStudyPlan: (plan) => set((state) => ({ studyPlans: [...state.studyPlans, plan] })),
    updateStudyPlan: (plan) => set((state) => ({
        studyPlans: state.studyPlans.map(p => p.id === plan.id ? plan : p)
    })),
    addArcadeGame: (game) => set((state) => ({ arcadeGames: [...state.arcadeGames, game] })),
    updateArcadeGame: (game) => set((state) => ({
        arcadeGames: state.arcadeGames.map(g => g.id === game.id ? game : g)
    })),
    deleteArcadeGame: (id) => set((state) => ({
        arcadeGames: state.arcadeGames.filter(g => g.id !== id)
    })),
    updateMessages: (messages) => set({ messages }),
    updateChatGroups: (groups) => set({ chatGroups: groups }),
    addDiaryEntries: async (entries) => {
        const { error } = await supabase.from('diary_entries').insert(
            entries.map(e => ({
                id: e.id,
                student_id: e.studentId,
                class_id: e.classId,
                teacher_id: e.teacherId,
                date: e.date,
                attendance: e.attendance,
                occurrences: e.occurrences
            }))
        );

        if (error) {
            console.error("Error saving diary entries:", error);
            throw error;
        }

        set((state) => ({ diaryEntries: [...state.diaryEntries, ...entries] }));
    },
    loadDiaryEntries: async (userId, role) => {
        // O RLS já filtra os dados corretos com base no userId/role
        const { data, error } = await supabase.from('diary_entries').select('*');

        if (error) {
            console.error("Error loading diary entries:", error);
            return;
        }

        if (data) {
            const formatted = data.map(e => ({
                id: e.id,
                studentId: e.student_id,
                classId: e.class_id,
                teacherId: e.teacher_id,
                date: e.date,
                attendance: e.attendance as any,
                occurrences: e.occurrences
            })) as DiaryEntry[];

            set({ diaryEntries: formatted });
        }
    },
    addNeuroReportDelivery: async (delivery) => set((state) => ({ neuroReportDeliveries: [...state.neuroReportDeliveries, delivery] })),
    addMentorshipRequest: (request) => set((state) => ({ mentorshipRequests: [...state.mentorshipRequests, request] })),
    acceptMentorshipRequest: async (requestId) => {
        set((state) => ({
            mentorshipRequests: state.mentorshipRequests.map(r => r.id === requestId ? { ...r, status: 'ACCEPTED' as any } : r)
        }));
    },
    confirmMentorship: async (id) => {
        set((state) => ({
            mentorships: state.mentorships.map(m => m.id === id ? { ...m, status: 'CONFIRMED' } : m)
        }));
    },
    registerStudentToEvent: async (eventId, studentId) => {
        console.log(`Student ${studentId} registered to event ${eventId}`);
    }
});
