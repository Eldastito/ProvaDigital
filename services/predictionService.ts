/**
 * Serviço de Predição Acadêmica (v1.0)
 * Utiliza IA (Gemini) para prever desempenho e identificar riscos de evasão.
 */
import { AppState, Student, ExamResult } from '../types';
import * as ai from './geminiService';

export interface PredictionResult {
    studentId: string;
    studentName: string;
    predictedScore: number;
    evasionRiskProbability: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    criticalAlerts: string[];
    aiInsight: string;
    recommendedIntervention: string;
    generatedAt: string;
}

/**
 * Realiza uma análise preditiva completa para um aluno
 */
export const predictForStudent = async (studentId: string, state: AppState): Promise<PredictionResult | null> => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return null;

    // 1. Coletar Histórico: Resultados de Prova + Frequência Simulada
    const results = state.results.filter(r => r.studentId === studentId);

    // Simplificamos o histórico para a IA
    const history = {
        student: {
            name: student.name,
            registration: student.registrationNumber
        },
        recentResults: results.map(r => ({
            examId: r.examId,
            score: r.totalScore,
            maxScore: 10, // Base padrão
            date: r.gradedAt || r.submittedAt
        })),
        attendance: 85 // Mock: No futuro viria do Diário de Classe
    };

    // 2. Chamar IA para Predição
    const aiResponse = await ai.predictStudentOutcome(history);

    if (!aiResponse) return null;

    return {
        studentId: student.id,
        studentName: student.name,
        ...aiResponse,
        generatedAt: new Date().toISOString()
    };
};

/**
 * Análise em lote para uma turma (Batch Prediction)
 * Útil para o Dashboard de Diretores
 */
export const predictBatch = async (studentIds: string[], state: AppState): Promise<PredictionResult[]> => {
    const predictions = await Promise.all(
        studentIds.map(id => predictForStudent(id, state))
    );

    return predictions.filter((p): p is PredictionResult => p !== null);
};

/**
 * Agrega dados de predição para nível Escola
 */
export const getSchoolPredictionSummary = (predictions: PredictionResult[]) => {
    if (predictions.length === 0) return null;

    const highRiskCount = predictions.filter(p => p.evasionRiskProbability > 0.7).length;
    const avgPredictedScore = predictions.reduce((sum, p) => sum + p.predictedScore, 0) / predictions.length;

    const trends = {
        UP: predictions.filter(p => p.trend === 'UP').length,
        DOWN: predictions.filter(p => p.trend === 'DOWN').length,
        STABLE: predictions.filter(p => p.trend === 'STABLE').length,
    };

    return {
        highRiskCount,
        avgPredictedScore,
        trends,
        totalAnalyzed: predictions.length
    };
};
