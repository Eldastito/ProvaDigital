
import { AppState, RiskLevel, StudentStats, ExamResult, Exam, Student } from "../types";

export class AnalyticsService {

    private state: AppState;

    constructor(state: AppState) {
        this.state = state;
    }

    public getStudentStats(studentId: string): StudentStats | null {
        const student = this.state.students.find(s => s.id === studentId);
        if (!student) return null;

        const studentResults = this.state.results.filter(r => r.studentId === studentId);
        const examsTaken = studentResults.length;

        // --- IDG Calculation Logic ---
        let sumExamScores = 0;
        let countExams = 0;
        let sumProjectScores = 0;
        let countProjects = 0;

        const subjectScores: Record<string, { obtained: number; total: number }> = {};

        studentResults.forEach(result => {
            const exam = this.state.exams.find(e => e.id === result.examId);
            if (!exam) return;

            // Simple Heuristic: If title contains "Trabalho", "Projeto", "Feira", treat as Project (Weight 30%)
            // Otherwise treat as Exam (Weight 60%)
            const isProject = exam.title.toLowerCase().includes('trabalho') ||
                exam.title.toLowerCase().includes('projeto') ||
                exam.title.toLowerCase().includes('pesquisa');

            if (isProject) {
                sumProjectScores += result.totalScore; // Assuming score is 0-10
                countProjects++;
            } else {
                sumExamScores += result.totalScore;
                countExams++;
            }

            // Subject Breakdown
            if (!subjectScores[exam.subject]) subjectScores[exam.subject] = { obtained: 0, total: 0 };
            subjectScores[exam.subject].obtained += result.totalScore;
            subjectScores[exam.subject].total += 10; // Assuming 10 max
        });

        const examAverage = countExams > 0 ? sumExamScores / countExams : 0;
        const projectAverage = countProjects > 0 ? sumProjectScores / countProjects : 0;

        // Attendance (Simulated based on Registration Status)
        const registrations = this.state.registrations.filter(r => r.studentId === studentId);
        const absences = registrations.filter(r => r.status === 'AUSENTE').length;
        const attendanceRate = registrations.length > 0 ? ((registrations.length - absences) / registrations.length) * 100 : 100;
        const attendanceScore = attendanceRate / 10; // Normalize 0-10

        // Bonus Points from Achievements (Profile)
        const userProfile = this.state.userProfiles?.find(p => p.userId === studentId);
        const bonusPoints = userProfile?.academicAchievements?.reduce((acc, ach) => acc + ach.bonusPoints, 0) || 0;

        // --- GLOBAL SCORE FORMULA (IDG) ---
        // (Exam * 0.6) + (Project * 0.3) + (Attendance * 0.1) + Bonus
        // Base max is 10, bonus can push it higher (e.g., 10.5)
        let idgScore = (examAverage * 0.6) + (projectAverage * 0.3) + (attendanceScore * 0.1) + bonusPoints;

        // Simple fallback if no projects yet: Exams count for 90%
        if (countProjects === 0 && countExams > 0) {
            idgScore = (examAverage * 0.9) + (attendanceScore * 0.1) + bonusPoints;
        } else if (countExams === 0 && countProjects === 0) {
            idgScore = 0;
        }

        // Risk Logic
        let riskLevel = RiskLevel.LOW;
        if (idgScore < 5 || attendanceRate < 75) riskLevel = RiskLevel.HIGH;
        else if (idgScore < 7 || attendanceRate < 85) riskLevel = RiskLevel.MEDIUM;

        // Projection
        const missingPointsForApproval = Math.max(0, 6 - idgScore); // Simplified

        // Strongest/Weakest
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

    public getClassRanking(classId: string): StudentStats[] {
        const students = this.state.students.filter(s => s.classId === classId);
        const stats = students.map(s => this.getStudentStats(s.id)).filter(Boolean) as StudentStats[];
        return stats.sort((a, b) => b.idgScore - a.idgScore);
    }

    public getNetworkStats() {
        const allStats = this.state.students.map(s => this.getStudentStats(s.id)).filter(Boolean) as StudentStats[];

        const totalStudents = allStats.length;
        const avgIDG = totalStudents > 0
            ? allStats.reduce((acc, curr) => acc + curr.idgScore, 0) / totalStudents
            : 0;

        const highRiskCount = allStats.filter(s => s.riskLevel === RiskLevel.HIGH).length;
        const riskPercentage = totalStudents > 0 ? (highRiskCount / totalStudents) * 100 : 0;

        return {
            totalStudents,
            avgIDG,
            riskPercentage,
            highRiskCount
        };
    }

    public getSubjectBreakdown() {
        const subjectAgg: Record<string, { sum: number; count: number }> = {};

        this.state.results.forEach(result => {
            const exam = this.state.exams.find(e => e.id === result.examId);
            if (!exam) return;

            if (!subjectAgg[exam.subject]) subjectAgg[exam.subject] = { sum: 0, count: 0 };
            subjectAgg[exam.subject].sum += result.totalScore;
            subjectAgg[exam.subject].count++;
        });

        return Object.entries(subjectAgg).map(([subject, data]) => ({
            label: subject,
            value: data.count > 0 ? data.sum / data.count : 0,
            color: this.getSubjectColor(subject)
        }));
    }

    private getSubjectColor(subject: string): string {
        const colors: Record<string, string> = {
            'Matemática': '#2563eb',
            'Língua Portuguesa': '#3b82f6',
            'Ciências': '#1d4ed8',
            'História': '#1e40af',
            'Geografia': '#172554',
            'Artes': '#4338ca',
            'Educação Física': '#4f46e5'
        };
        return colors[subject] || '#64748b';
    }
}
