import { StateCreator } from 'zustand';
import { Exam, ExamVariant, ExamVariantOverride, ExamVersion, ExamStatus, ExamModel, ScheduledExam, ExamScheduleStatus } from '../../types';
import { AppStore } from '../useAppStore';
import { supabase } from '../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface ExamSlice {
    exams: Exam[];
    networkExams: Exam[];
    examVariants: ExamVariant[];
    variantOverrides: ExamVariantOverride[];
    examVersions: ExamVersion[];
    examAttempts: any[]; // Using any for large complex types
    examAttemptEvents: any[];
    liveQuizSessions: any[];
    liveQuizResults: any[];
    examEncryptionKey: any | null;
    schedules: ScheduledExam[];

    addExam: (exam: Exam) => void;
    // ... rest of methods
    loadExams: () => Promise<void>;
    loadSchedules: () => Promise<void>;
    sealExam: (examId: string) => Promise<any>;
    addExamVersion: (version: ExamVersion) => Promise<void>;
    addExamVariant: (variant: ExamVariant) => Promise<void>;
    loadExamVariants: (examId: string) => Promise<void>;
    saveOverride: (override: any) => Promise<void>;
    getRecommendedVariant: (examId: string, studentId: string) => Promise<string | null>;
    startExamAttempt: (data: { examId: string; examVersionId: string; studentId: string }) => Promise<string>;
    logSecurityEvent: (data: { attemptId: string; eventType: any; severity: any; eventData: any }) => Promise<void>;
    submitExamAttempt: (attemptId: string, status?: string) => Promise<void>;
    reopenExamAttempt: (attemptId: string) => Promise<void>;
    saveExamProgress: (attemptId: string, answers: any, metadata?: any) => Promise<void>;
    initializeExamEvents: (examId?: string) => Promise<void>;
    leaveExamChannel: (examId?: string) => void;
    calculateAndSaveResult: (examId: string, studentId: string) => Promise<void>;
    updatePedagogicalFeedback: (resultId: string, feedback: string) => Promise<void>;
    updateExamAllocation: (examId: string, classIds: string[]) => Promise<void>;
}

export const createExamSlice: StateCreator<AppStore, [], [], ExamSlice> = (set, get) => ({
    exams: [],
    networkExams: [],
    examVariants: [],
    variantOverrides: [],
    examVersions: [],
    examAttempts: [],
    examAttemptEvents: [],
    liveQuizSessions: [],
    liveQuizResults: [],
    examEncryptionKey: null,
    schedules: [],

    addExam: async (exam) => {
        set((state) => ({ exams: [...state.exams, exam] }));
        try {
            await supabase.from('exams').insert({
                id: exam.id,
                title: exam.title,
                tenant_id: exam.tenantId,
                school_id: exam.schoolId,
                creator_id: exam.creatorId,
                subject: exam.subject,
                status: exam.status,
                items_config: exam.items,
                class_ids: exam.classIds,
                model: exam.model,
                duration_minutes: exam.durationMinutes,
                max_score: exam.maxScore,
                scheduled_date: exam.scheduledDate,
                created_at: exam.createdAt
            });
        } catch (e) {
            console.error("Error adding exam:", e);
        }
    },

    updateExam: async (exam) => {
        set((state) => ({ exams: state.exams.map(e => e.id === exam.id ? exam : e) }));
        // Mock update in Supabase
        try {
            await supabase.from('exams').update({
                title: exam.title,
                status: exam.status,
                // ... update fields
            }).eq('id', exam.id);
        } catch (e) {
            console.error(e);
        }
    },

    deleteExam: async (id) => set((state) => ({
        exams: state.exams.filter(e => e.id !== id)
    })),

    activateExam: async (id) => {
        // ...
    },

    distributeOECDExam: async (examId) => {
        // ...
    },

    fetchExamItems: async (examId) => {
        // ...
    },

    fetchNetworkExams: async () => {
        // ...
    },

    loadExams: async () => {
        console.log("Fetching Exams from Supabase...");
        const { data, error } = await supabase.from('exams').select('*');
        if (error) {
            console.error("Error loading exams:", error);
            return;
        }
        if (data) {
            const parsedExams = data.map(exam => ({
                id: exam.id,
                title: exam.title,
                tenantId: exam.tenant_id,
                schoolId: exam.school_id,
                creatorId: exam.creator_id,
                subject: exam.subject,
                status: exam.status,
                items: exam.items_config || [], // Ajustado para array de {itemId, customScore} e outras props
                classIds: exam.class_ids || [],
                model: exam.model,
                durationMinutes: exam.duration_minutes,
                maxScore: exam.max_score,
                scheduledDate: exam.scheduled_date,
                createdAt: exam.created_at,
                description: exam.description || '',
                shuffleItems: exam.shuffle_items || true,
                targetQuestionCount: exam.target_question_count || (exam.items_config ? exam.items_config.length : 0),
            }));
            set({ exams: parsedExams as Exam[] });
        }
    },

    loadSchedules: async () => {
        console.log("Fetching Exam Schedules from Supabase...");
        const { data, error } = await supabase.from('exam_schedules').select('*');
        if (error) {
            console.error("Error loading schedules:", error);
            return;
        }
        if (data) {
            const parsedSchedules = data.map(schedule => ({
                id: schedule.id,
                examId: schedule.exam_id,
                examTitle: schedule.exam_title,
                classIds: schedule.class_ids || [],
                scheduledFor: new Date(schedule.scheduled_for),
                duration: schedule.duration,
                mode: schedule.mode,
                config: schedule.config || {},
                status: schedule.status as ExamScheduleStatus,
                createdBy: schedule.created_by,
                createdAt: new Date(schedule.created_at),
                updatedAt: schedule.updated_at ? new Date(schedule.updated_at) : undefined,
                tenantId: schedule.tenant_id
            }));
            set({ schedules: parsedSchedules as ScheduledExam[] });
        }
    },

    sealExam: async (examId) => {
        // ...
    },

    addExamVersion: async (version) => set((state) => ({
        examVersions: [...state.examVersions, version]
    })),

    addExamVariant: async (variant) => set((state) => ({
        examVariants: [...state.examVariants, variant]
    })),

    loadExamVariants: async (examId) => {
        const { data } = await supabase.from('exam_variants').select('*').eq('exam_id', examId);
        if (data) set({ examVariants: data });
    },

    saveOverride: async (override) => {
        set((state) => ({ variantOverrides: [...state.variantOverrides, override] }));
        await supabase.from('exam_variant_overrides').insert(override);
    },

    getRecommendedVariant: async (examId, studentId) => {
        // Logic would go here (RAG/AI matching)
        return null;
    },

    startExamAttempt: async (data) => {
        const attempt = { id: uuidv4(), ...data, status: 'started', startedAt: new Date().toISOString() };
        set((state) => ({ examAttempts: [...state.examAttempts, attempt] }));
        return attempt.id;
    },

    logSecurityEvent: async (data) => {
        const securityEvent = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
        set((state) => ({ examAttemptEvents: [...state.examAttemptEvents, securityEvent] }));
    },

    submitExamAttempt: async (attemptId, status = 'submitted') => {
        set((state) => ({
            examAttempts: state.examAttempts.map(a => a.id === attemptId ? { ...a, status, submittedAt: new Date().toISOString() } : a)
        }));
    },

    reopenExamAttempt: async (attemptId) => {
        set((state) => ({
            examAttempts: state.examAttempts.map(a => a.id === attemptId ? { ...a, status: 'started' } : a)
        }));
    },

    saveExamProgress: async (attemptId, answers, metadata) => {
        set((state) => ({
            examAttempts: state.examAttempts.map(a => a.id === attemptId ? { ...a, metadata: { ...(a.metadata || {}), savedAnswers: answers, ...metadata } } : a)
        }));
    },

    initializeExamEvents: async (examId) => {
        console.log(`Realtime channel initialized for exam ${examId}`);
    },

    leaveExamChannel: (examId) => {
        console.log(`Left channel for exam ${examId}`);
    },

    calculateAndSaveResult: async (examId, studentId) => {
        // ... calculation logic
    },

    updatePedagogicalFeedback: async (resultId, feedback) => {
        set((state) => ({
            results: state.results.map(r => r.id === resultId ? { ...r, pedagogicalFeedback: feedback } : r)
        }));
        try {
            await supabase.from('exam_results').update({ pedagogical_feedback: feedback }).eq('id', resultId);
        } catch (e) {
            console.error(e);
        }
    },

    updateExamAllocation: async (examId, classIds) => {
        set((state) => ({
            exams: state.exams.map(e => e.id === examId ? { ...e, classIds } : e)
        }));
        await supabase.from('exams').update({ class_ids: classIds }).eq('id', examId);
    }
});
