
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

        let totalScore = 0;
        let maxPossibleScore = 0;
        const subjectScores: Record<string, { obtained: number; total: number }> = {};

        studentResults.forEach(result => {
            const exam = this.state.exams.find(e => e.id === result.examId);
            if (!exam) return;

            // Calculate max score for this exam
            const examMax = exam.items.reduce((acc, item) => acc + (item.customScore || 0), 0); // Assuming customScore is hydrated or use logic
            // Note: In mock data, hydration happens in UI. Here we might need to lookup items.
            // Simplified: Assume totalScore in result is correct and max is 10 for all exams for MVP.
            
            totalScore += result.totalScore;
            maxPossibleScore += 10; // Mock max

            // Subject Breakdown
            if (!subjectScores[exam.subject]) subjectScores[exam.subject] = { obtained: 0, total: 0 };
            subjectScores[exam.subject].obtained += result.totalScore;
            subjectScores[exam.subject].total += 10;
        });

        const averageGrade = examsTaken > 0 ? (totalScore / maxPossibleScore) * 10 : 0;

        // Attendance (Simulated based on Registration Status)
        const registrations = this.state.registrations.filter(r => r.studentId === studentId);
        const absences = registrations.filter(r => r.status === 'AUSENTE').length;
        const attendanceRate = registrations.length > 0 ? ((registrations.length - absences) / registrations.length) * 100 : 100;

        // Risk Logic
        let riskLevel = RiskLevel.LOW;
        if (averageGrade < 5 || attendanceRate < 75) riskLevel = RiskLevel.HIGH;
        else if (averageGrade < 7 || attendanceRate < 85) riskLevel = RiskLevel.MEDIUM;

        // Projection (Assuming passing grade is 6.0 average)
        // If AVG is 4.0 after 1 exam, needs 8.0 in next to avg 6.0
        const missingPointsForApproval = Math.max(0, (6 * (examsTaken + 1)) - totalScore);

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
            averageGrade,
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
        return stats.sort((a, b) => b.averageGrade - a.averageGrade);
    }
}
