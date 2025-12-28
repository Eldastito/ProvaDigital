
import { createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { Item, Exam, ExamResult, User, Student, School, SchoolClass, Tenant, ExamRegistration, Announcement, ChatMessage, ChatGroup, OwlSession, LessonPlan, StudyPlan, UserProfileExtended, GamifiedEvent, StudentProfile, Resource, DailyAttendance } from '../types';

// --- CONFIGURAÇÃO DE PRODUÇÃO ---
const env = (import.meta as any).env ?? {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: true,
            retry: 2,
        },
    },
});

export const checkConnection = async () => {
    if (SUPABASE_URL.includes('placeholder')) return false;
    try {
        const { error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });
        if (error) return false;
        return true;
    } catch (e) {
        return false;
    }
};

// --- FUNÇÕES DE FETCHING ---

export const fetchItems = async (): Promise<Item[]> => {
    const { data, error } = await supabase.from('items').select('*');
    if (error) throw error;
    return (data || []).map((i: any) => ({
        id: i.id,
        tenantId: i.tenant_id,
        schoolId: i.school_id,
        ownerId: i.owner_id ?? 'system',
        knowledgeArea: i.knowledge_area ?? 'Geral',
        subject: i.subject,
        type: i.type,
        statement: i.statement,
        imageUrl: i.image_url,
        alternatives: i.alternatives,
        correctAnswerJustification: i.correct_answer_justification,
        difficulty: i.difficulty,
        score: i.score ?? 1.0,
        origin: i.origin,
        tags: i.tags || [],
        bnccCode: i.bncc_code,
        minLines: i.min_lines,
        maxLines: i.max_lines,
        showWordCount: i.show_word_count,
        usageCount: i.usage_count ?? 0,
        createdAt: i.created_at,
    }));
};

export const fetchExams = async (): Promise<Exam[]> => {
    const { data, error } = await supabase.from('exams').select('*');
    if (error) throw error;
    return (data || []).map((e: any) => ({
        id: e.id,
        tenantId: e.tenant_id,
        schoolId: e.school_id,
        creatorId: e.creator_id ?? 'system',
        title: e.title,
        description: e.description,
        subject: e.subject,
        model: e.model,
        durationMinutes: e.duration_minutes,
        targetQuestionCount: e.target_question_count,
        status: e.status,
        items: e.items,
        classIds: e.class_ids,
        createdAt: e.created_at,
        scheduledDate: e.scheduled_date,
    }));
};

export const fetchResults = async (): Promise<ExamResult[]> => {
    const { data, error } = await supabase.from('exam_results').select('*');
    if (error) throw error;
    return (data || []).map((r: any) => ({
        id: r.id,
        examId: r.exam_id,
        studentId: r.student_id,
        answers: r.answers,
        totalScore: r.total_score,
        gradedAt: r.graded_at,
        violationCount: r.violation_count,
        securityFlags: r.security_flags,
    }));
};

export const fetchUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        nickname: u.nickname,
        email: u.email,
        role: u.role,
        tenantId: u.tenant_id,
        schoolId: u.school_id,
        classIds: u.class_ids,
        childrenIds: u.children_ids,
    }));
};

export const fetchStudents = async (): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        registrationNumber: s.registration_number,
        classId: s.class_id,
        schoolId: s.school_id,
        tenantId: s.tenant_id,
    }));
};

export const fetchSchools = async (): Promise<School[]> => {
    const { data, error } = await supabase.from('schools').select('*');
    if (error) throw error;
    return (data || []).map((s: any) => ({
        id: s.id,
        tenantId: s.tenant_id,
        name: s.name,
        inep: s.inep,
        resources: s.resources,
    }));
};

export const fetchClasses = async (): Promise<SchoolClass[]> => {
    const { data, error } = await supabase.from('classes').select('*');
    if (error) throw error;
    return (data || []).map((c: any) => ({
        id: c.id,
        schoolId: c.school_id,
        name: c.name,
        series: c.series,
        shift: c.shift,
        capacity: c.capacity
    }));
};

export const fetchAttendance = async (date: string): Promise<DailyAttendance[]> => {
    const { data, error } = await supabase.from('attendance').select('*').eq('date', date);
    if (error) throw error;
    return (data || []).map((a: any) => ({
        id: a.id,
        studentId: a.student_id,
        classId: a.class_id,
        professorId: a.professor_id,
        date: a.date,
        status: a.status,
        timestamp: a.timestamp
    }));
};

export const fetchTenants = async (): Promise<Tenant[]> => {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        cnpj: t.cnpj,
        disabledResources: t.disabled_resources,
    }));
};

export const fetchRegistrations = async (): Promise<ExamRegistration[]> => {
    const { data, error } = await supabase.from('exam_registrations').select('*');
    if (error) throw error;
    return (data || []).map((r: any) => ({
        id: r.id,
        examId: r.exam_id,
        studentId: r.student_id,
        classId: r.class_id,
        status: r.status,
    }));
};

export const fetchUserProfiles = async (): Promise<UserProfileExtended[]> => {
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error) throw error;
    return (data || []).map((p: any) => ({
        userId: p.user_id,
        avatarUrl: p.avatar_url,
        bio: p.bio,
        assessments: p.assessments || [],
        owlCoins: p.owl_coins || 0,
        badges: p.badges || [],
        academicAchievements: p.academic_achievements || [],
    }));
};

export const fetchLessonPlans = async (): Promise<LessonPlan[]> => {
    const { data, error } = await supabase.from('lesson_plans').select('*');
    if (error) throw error;
    return (data || []).map((l: any) => ({
        id: l.id,
        professorId: l.professor_id,
        classId: l.class_id,
        subject: l.subject,
        topic: l.topic,
        objectives: l.objectives,
        content: l.content,
        date: l.date,
    }));
};

export const fetchMessages = async (): Promise<ChatMessage[]> => {
    const { data, error } = await supabase.from('chat_messages').select('*');
    if (error) throw error;
    return (data || []).map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        groupId: m.group_id,
        content: m.content,
        attachment: m.attachment,
        timestamp: m.timestamp,
        isRead: m.is_read,
        isReported: m.is_reported,
    }));
};

export const fetchStudentProfiles = async (): Promise<StudentProfile[]> => {
    const { data, error } = await supabase.from('student_profiles').select('*');
    if (error) throw error;
    return (data || []).map((p: any) => ({
        studentId: p.student_id,
        learningChannel: p.learning_channel,
        discProfile: p.disc_profile,
        topStrengths: p.top_strengths || [],
        lastUpdated: p.last_updated,
    }));
};

export const fetchStudyPlans = async (): Promise<StudyPlan[]> => {
    const { data, error } = await supabase.from('study_plans').select('*');
    if (error) throw error;
    return (data || []).map((s: any) => ({
        id: s.id,
        studentId: s.student_id,
        generatedBy: s.generated_by,
        title: s.title,
        tasks: s.tasks || [],
        createdAt: s.created_at,
    }));
};

export const fetchGamifiedEvents = async (): Promise<GamifiedEvent[]> => {
    const { data, error } = await supabase.from('gamified_events').select('*');
    if (error) throw error;
    return (data || []).map((e: any) => ({
        id: e.id,
        schoolId: e.school_id,
        creatorId: e.creator_id,
        title: e.title,
        type: e.type,
        subject: e.subject,
        description: e.description,
        rules: e.rules,
        eventDate: e.event_date,
        registrationDeadline: e.registration_deadline,
        status: e.status,
        rewardCoins: e.reward_coins,
        participants: e.participants || [],
    }));
};

// --- AÇÕES DE ESCRITA ---

export const upsertAttendance = async (attendance: DailyAttendance[]) => {
    const payload = attendance.map(a => ({
        id: a.id,
        student_id: a.studentId,
        class_id: a.classId,
        professor_id: a.professorId,
        date: a.date,
        status: a.status,
        timestamp: a.timestamp
    }));
    const { error } = await supabase.from('attendance').upsert(payload);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
};

export const insertItem = async (item: Item) => {
    const { error } = await supabase.from('items').insert({
        id: item.id,
        tenant_id: item.tenantId,
        school_id: item.schoolId,
        owner_id: item.ownerId,
        knowledge_area: item.knowledgeArea,
        subject: item.subject,
        type: item.type,
        statement: item.statement,
        image_url: item.imageUrl,
        alternatives: item.alternatives,
        correct_answer_justification: item.correctAnswerJustification,
        difficulty: item.difficulty,
        score: item.score,
        origin: item.origin,
        tags: item.tags,
        bncc_code: item.bnccCode,
        min_lines: item.minLines,
        max_lines: item.maxLines,
        show_word_count: item.showWordCount,
        usage_count: item.usageCount,
        created_at: item.createdAt,
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['items'] });
};

export const deleteItem = async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['items'] });
};

export const insertExam = async (exam: Exam) => {
    const { error } = await supabase.from('exams').insert({
        id: exam.id,
        title: exam.title,
        tenant_id: exam.tenantId,
        school_id: exam.schoolId,
        creator_id: exam.creatorId,
        subject: exam.subject,
        status: exam.status,
        items: exam.items,
        class_ids: exam.classIds,
        created_at: exam.createdAt,
        description: exam.description,
        model: exam.model,
        duration_minutes: exam.durationMinutes,
        target_question_count: exam.targetQuestionCount,
        scheduled_date: exam.scheduledDate,
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['exams'] });
};

export const deleteExam = async (id: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['exams'] });
};

export const upsertResults = async (results: ExamResult[]) => {
    const dbPayload = results.map((r: ExamResult) => ({
        id: r.id,
        exam_id: r.examId,
        student_id: r.studentId,
        answers: r.answers,
        total_score: r.totalScore,
        violation_count: r.violationCount,
        security_flags: r.securityFlags,
        graded_at: r.gradedAt,
    }));

    const { error } = await supabase.from('exam_results').upsert(dbPayload);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['results'] });
};

export const insertSchool = async (school: School) => {
    const { error } = await supabase.from('schools').insert({
        id: school.id,
        tenant_id: school.tenantId,
        name: school.name,
        inep: school.inep,
        resources: school.resources,
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['schools'] });
};

export const updateSchool = async (school: School) => {
    const { error } = await supabase.from('schools').update({
        name: school.name,
        inep: school.inep,
        resources: school.resources,
    }).eq('id', school.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['schools'] });
};

export const insertClass = async (cls: SchoolClass) => {
    const { error = null } = await supabase.from('classes').insert({
        id: cls.id,
        school_id: cls.schoolId,
        name: cls.name,
        series: cls.series,
        shift: cls.shift,
        capacity: cls.capacity
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['classes'] });
};

export const insertStudent = async (student: Student) => {
    const { data, error } = await supabase.from('students').insert({
        id: student.id,
        tenant_id: student.tenantId,
        school_id: student.schoolId,
        class_id: student.classId,
        name: student.name,
        registration_number: student.registrationNumber, // Corrigido de registration_number para match com Student interface
    }).select().single();
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['students'] });
    return data;
};

export const insertUser = async (user: User) => {
    const { error } = await supabase.from('users').insert({
        id: user.id,
        tenant_id: user.tenantId,
        school_id: user.schoolId,
        class_ids: user.classIds,
        name: user.name,
        email: user.email,
        role: user.role,
        nickname: user.nickname,
        children_ids: user.childrenIds,
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['users'] });
};

export const updateUserProfileData = async (profile: UserProfileExtended) => {
    const { error } = await supabase.from('user_profiles').upsert({
        user_id: profile.userId,
        avatar_url: profile.avatarUrl,
        bio: profile.bio,
        assessments: profile.assessments,
        owl_coins: profile.owlCoins,
        badges: profile.badges,
        academic_achievements: profile.academicAchievements,
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
};

export const upsertExamRegistrations = async (registrations: ExamRegistration[]) => {
    const dbPayload = registrations.map(r => ({
        id: r.id,
        exam_id: r.examId,
        student_id: r.studentId,
        class_id: r.classId,
        status: r.status,
    }));
    const { error } = await supabase.from('exam_registrations').upsert(dbPayload);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['registrations'] });
};

export const insertChatMessage = async (message: ChatMessage) => {
    const { error } = await supabase.from('chat_messages').insert({
        id: message.id,
        sender_id: message.senderId,
        recipient_id: message.recipientId,
        group_id: message.groupId,
        content: message.content,
        attachment: message.attachment,
        timestamp: message.timestamp,
        is_read: message.isRead,
        is_reported: message.isReported,
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['messages'] });
};

export const deleteChatMessageById = async (id: string) => {
    const { error } = await supabase.from('chat_messages').delete().eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['messages'] });
};

export const insertLessonPlan = async (plan: LessonPlan) => {
    const { error } = await supabase.from('lesson_plans').insert({
        id: plan.id,
        professor_id: plan.professorId,
        class_id: plan.classId,
        subject: plan.subject,
        topic: plan.topic,
        objectives: plan.objectives,
        content: plan.content,
        date: plan.date,
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['lessonPlans'] });
};

export const insertGamifiedEvent = async (event: GamifiedEvent) => {
    const { error } = await supabase.from('gamified_events').insert({
        id: event.id,
        school_id: event.schoolId,
        creator_id: event.creatorId,
        title: event.title,
        type: event.type,
        subject: event.subject,
        description: event.description,
        rules: event.rules,
        event_date: event.eventDate,
        registration_deadline: event.registrationDeadline,
        status: event.status,
        reward_coins: event.rewardCoins,
        participants: event.participants,
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['gamifiedEvents'] });
};

export const updateGamifiedEventData = async (event: GamifiedEvent) => {
    const { error } = await supabase.from('gamified_events').update({
        title: event.title,
        type: event.type,
        subject: event.subject,
        description: event.description,
        rules: event.rules,
        event_date: event.eventDate,
        registration_deadline: event.registrationDeadline,
        status: event.status,
        reward_coins: event.rewardCoins,
        participants: event.participants,
    }).eq('id', event.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['gamifiedEvents'] });
};

export const updateTenantData = async (tenantId: string, disabled: Resource[]) => {
    const { error } = await supabase.from('tenants').update({
        disabled_resources: disabled
    }).eq('id', tenantId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
};

export const insertAnnouncement = async (anc: Announcement) => {
    const { error } = await supabase.from('announcements').insert({
        id: anc.id,
        tenant_id: anc.tenantId,
        school_id: anc.schoolId,
        author_id: anc.authorId,
        title: anc.title,
        content: anc.content,
        type: anc.type,
        created_at: anc.createdAt,
        event_date: anc.eventDate
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
};

export const removeAnnouncementById = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
};

export const insertStudyPlan = async (plan: StudyPlan) => {
    const { error } = await supabase.from('study_plans').insert({
        id: plan.id,
        student_id: plan.studentId,
        generated_by: plan.generatedBy,
        title: plan.title,
        tasks: plan.tasks,
        created_at: plan.createdAt
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
};

export const updateStudyPlanData = async (plan: StudyPlan) => {
    const { error } = await supabase.from('study_plans').update({
        title: plan.title,
        tasks: plan.tasks
    }).eq('id', plan.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
};

export const registerStudentToEventDB = async (eventId: string, studentId: string, currentParticipants: any[]) => {
    const newParticipants = [...currentParticipants, { studentId, status: 'INSCRITO', score: 0 }];
    const { error } = await supabase.from('gamified_events').update({
        participants: newParticipants
    }).eq('id', eventId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['gamifiedEvents'] });
};
