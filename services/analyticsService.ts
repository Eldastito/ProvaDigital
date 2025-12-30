
import { RiskLevel, StudentStats, ExamResult, Exam, Student, ExamRegistration, UserProfileExtended } from "../types";

export class AnalyticsService {
    
    constructor() {}

    public getStudentStats(
        studentId: string,
        allStudents: Student[],
        allResults: ExamResult[],
        allExams: Exam[],
        allRegistrations: ExamRegistration[],
        allUserProfiles: UserProfileExtended[]
    ): StudentStats | null {
        const student = allStudents.find(s => s.id === studentId);
        if (!student) return null;

        const studentResults = allResults.filter(r => r.studentId === studentId);
        const examsTaken = studentResults.length;

        // --- IDG Calculation Logic ---
        let sumExamScores = 0;
        let countExams = 0;
        let sumProjectScores = 0;
        let countProjects = 0;

        const subjectScores: Record<string, { obtained: number; total: number }> = {};

        studentResults.forEach(result => {
            const exam = allExams.find(e => e.id === result.examId);
            if (!exam) return;

            const isProject = exam.title.toLowerCase().includes('trabalho') || 
                              exam.title.toLowerCase().includes('projeto') ||
                              exam.title.toLowerCase().includes('pesquisa');

            if (isProject) {
                sumProjectScores += result.totalScore;
                countProjects++;
            } else {
                sumExamScores += result.totalScore;
                countExams++;
            }

            if (!subjectScores[exam.subject]) subjectScores[exam.subject] = { obtained: 0, total: 0 };
            subjectScores[exam.subject].obtained += result.totalScore;
            subjectScores[exam.subject].total += 10;
        });

        const examAverage = countExams > 0 ? sumExamScores / countExams : 0;
        const projectAverage = countProjects > 0 ? sumProjectScores / countProjects : 0;

        const registrations = allRegistrations.filter(r => r.studentId === studentId);
        const absences = registrations.filter(r => r.status === 'AUSENTE').length;
        const attendanceRate = registrations.length > 0 ? ((registrations.length - absences) / registrations.length) * 100 : 100;
        const attendanceScore = attendanceRate / 10;

        const userProfile = allUserProfiles?.find(p => p.userId === studentId);
        const bonusPoints = userProfile?.academicAchievements?.reduce((acc, ach) => acc + ach.bonusPoints, 0) || 0;

        let idgScore = (examAverage * 0.6) + (projectAverage * 0.3) + (attendanceScore * 0.1) + bonusPoints;
        
        if (countProjects === 0 && countExams > 0) {
            idgScore = (examAverage * 0.9) + (attendanceScore * 0.1) + bonusPoints;
        } else if (countExams === 0 && countProjects === 0) {
            idgScore = 0;
        }

        let riskLevel = RiskLevel.LOW;
        if (idgScore < 5 || attendanceRate < 75) riskLevel = RiskLevel.HIGH;
        else if (idgScore < 7 || attendanceRate < 85) riskLevel = RiskLevel.MEDIUM;

        const missingPointsForApproval = Math.max(0, 6 - idgScore);

        let strongest = { subject: '-', score: -1 };
        let weakest = { subject: '-', score: 11 };

        Object.entries(subjectScores).forEach(([subj, scores]) => {
            const avg = scores.obtained / (scores.total / 10);
            if (avg > strongest.score) strongest = { subject: subj, score: avg };
            if (avg < weakest.score) weakest = { subject: subj, score: avg };
        });

        return {
            studentId,
            idgScore,
            examAverage,
            projectAverage,
            bonusPoints,
            examsTaken,
            attendanceRate,
            riskLevel,
            missingPointsForApproval,
            strongestSubject: strongest.subject,
            weakestSubject: weakest.subject
        };
    }

    public getRankings(
        studentId: string,
        allStudents: Student[],
        allResults: ExamResult[],
        allExams: Exam[],
        allRegistrations: ExamRegistration[],
        allUserProfiles: UserProfileExtended[]
    ) {
        const student = allStudents.find(s => s.id === studentId);
        if (!student) return { class: 0, school: 0, global: 0 };

        const computeScore = (sid: string) => this.getStudentStats(sid, allStudents, allResults, allExams, allRegistrations, allUserProfiles)?.idgScore || 0;

        // Class Rank
        const classRanking = allStudents
            .filter(s => s.classId === student.classId)
            .map(s => ({ id: s.id, score: computeScore(s.id) }))
            .sort((a, b) => b.score - a.score);
        
        // School Rank
        const schoolRanking = allStudents
            .filter(s => s.schoolId === student.schoolId)
            .map(s => ({ id: s.id, score: computeScore(s.id) }))
            .sort((a, b) => b.score - a.score);

        // Global (Tenant) Rank
        const globalRanking = allStudents
            .filter(s => s.tenantId === student.tenantId)
            .map(s => ({ id: s.id, score: computeScore(s.id) }))
            .sort((a, b) => b.score - a.score);

        return {
            class: classRanking.findIndex(r => r.id === studentId) + 1,
            school: schoolRanking.findIndex(r => r.id === studentId) + 1,
            global: globalRanking.findIndex(r => r.id === studentId) + 1
        };
    }

    public getClassRanking(
        classId: string,
        allStudents: Student[],
        allResults: ExamResult[],
        allExams: Exam[],
        allRegistrations: ExamRegistration[],
        allUserProfiles: UserProfileExtended[]
    ): StudentStats[] {
        const students = allStudents.filter(s => s.classId === classId);
        const stats = students.map(s => this.getStudentStats(s.id, allStudents, allResults, allExams, allRegistrations, allUserProfiles)).filter(Boolean) as StudentStats[];
        return stats.sort((a, b) => b.idgScore - a.idgScore);
    }
}
