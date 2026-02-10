import { useAppStore } from '../store/useAppStore';

export interface RiskAnalysis {
    studentId: string;
    studentName: string;
    riskScore: number; // 0-100
    riskFactors: string[];
    predictedOutcome: 'dropout' | 'retention' | 'promotion';
    trend: 'improving' | 'stable' | 'declining';
}

export const predictiveService = {
    /**
     * Calculates dropout risk based on attendance, grades, and engagement
     */
    analyzeDropoutRisk: (students: any[], logs: any[]): RiskAnalysis[] => {
        return students.map(student => {
            // Mock logic for prediction (would use linear regression or ML model in real scenario)
            const attendanceRate = student.attendance || 0.85; // Default if missing
            const averageGrade = student.averageGrade || 6.5;

            let riskScore = 0;
            const riskFactors = [];

            if (attendanceRate < 0.75) {
                riskScore += 40;
                riskFactors.push('Baixa Frequência');
            }
            if (averageGrade < 5.0) {
                riskScore += 30;
                riskFactors.push('Baixo Desempenho');
            }
            // Check for engagement logs
            const studentLogs = logs.filter(l => l.user_id === student.id);
            if (studentLogs.length < 5) {
                riskScore += 20;
                riskFactors.push('Baixo Engajamento Digital');
            }

            let predictedOutcome: 'dropout' | 'retention' | 'promotion' = 'promotion';
            if (riskScore > 70) predictedOutcome = 'dropout';
            else if (riskScore > 40) predictedOutcome = 'retention';

            return {
                studentId: student.id,
                studentName: student.name,
                riskScore,
                riskFactors,
                predictedOutcome,
                trend: (Math.random() > 0.5 ? 'declining' : 'stable') as 'declining' | 'stable' | 'improving' // Mock trend
            };
        }).sort((a, b) => b.riskScore - a.riskScore);
    },

    /**
     * Predicts future performance trend based on historical exam results
     */
    forecastPerformance: (history: number[]) => {
        if (history.length < 2) return null;

        // Simple Linear Regression
        const n = history.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += history[i];
            sumXY += i * history[i];
            sumXX += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const nextValue = slope * n + intercept;
        return {
            slope,
            intercept,
            nextValue: Math.min(10, Math.max(0, nextValue)), // Clamp 0-10
            direction: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat'
        };
    }
};
