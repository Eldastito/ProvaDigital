import { Student, ExamResult, StudentProfile } from '../../types';

export interface RiskRiskProfile {
    studentId: string;
    studentName: string;
    riskScore: number; // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[]; // e.g. ["Queda de Desempenho", "Baixa Frequência"]
    trend: 'STABLE' | 'WORSENING' | 'IMPROVING';
}

export const RiskDetectionService = {
    /**
     * Calcula o risco de evasão para uma lista de alunos.
     */
    analyzeClassRisk: async (
        students: Student[],
        examResults: ExamResult[],
        profiles: StudentProfile[]
    ): Promise<RiskRiskProfile[]> => {

        // Mock simulation of analysis
        const riskProfiles: RiskRiskProfile[] = students.map(student => {
            const studentResults = examResults
                .filter(r => r.studentId === student.id)
                .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

            let riskScore = 10; // Base risk
            const factors: string[] = [];

            // 1. Check Performance Drop
            if (studentResults.length >= 2) {
                const latest = studentResults[0].totalScore;
                const previous = studentResults[1].totalScore;

                if (latest < previous - 2) {
                    riskScore += 30;
                    factors.push("Queda brusca de notas");
                } else if (latest < 5) {
                    riskScore += 15;
                    factors.push("Baixo desempenho recorrente");
                }
            }

            // 2. Check Engagement (Mocked via metadata or profile)
            // In a real app, we would check login frequency, etc.
            // Randomly assign "Low Attendance" for demo purposes to some students
            const isLowAttendance = Math.random() > 0.8;
            if (isLowAttendance) {
                riskScore += 40;
                factors.push("Baixa frequência nas aulas/plataforma");
            }

            // 3. Behavioral Flags
            const violations = studentResults.reduce((acc, r) => acc + (r.violationCount || 0), 0);
            if (violations > 5) {
                riskScore += 10;
                factors.push("Comportamento de risco (Integridade)");
            }

            // Determine Level
            let riskLevel: RiskRiskProfile['riskLevel'] = 'LOW';
            if (riskScore >= 80) riskLevel = 'CRITICAL';
            else if (riskScore >= 60) riskLevel = 'HIGH';
            else if (riskScore >= 40) riskLevel = 'MEDIUM';

            return {
                studentId: student.id,
                studentName: student.name,
                riskScore: Math.min(100, riskScore),
                riskLevel,
                factors,
                trend: Math.random() > 0.5 ? 'WORSENING' : 'STABLE'
            };
        });

        return riskProfiles.sort((a, b) => b.riskScore - a.riskScore);
    }
};
