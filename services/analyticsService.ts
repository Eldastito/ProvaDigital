/**
 * Analytics Service
 * 
 * Responsável por agregar dados para os dashboards.
 * Usamos processamento no cliente para MVP para evitar queries complexas no banco por enquanto.
 */

import { supabase } from './supabaseClient';

export interface PerformanceData {
    examTitle: string;
    date: string;
    average: number;
    highest: number;
    lowest: number;
}

export interface AttendanceData {
    status: 'Presente' | 'Ausente' | 'Justificado';
    count: number;
    fill: string; // cor para o gráfico
    [key: string]: any; // Recharts compatibility
}

export interface DifficultyItem {
    topic: string;
    errorRate: number; // 0-100
    questionCount: number;
}

export interface GlobalStats {
    totalExams: number;
    totalStudents: number;
    averageScore: number;
    completionRate: number;
}

export class AnalyticsService {
    /**
     * Buscar estatísticas globais
     */
    async getGlobalStats(): Promise<GlobalStats> {
        try {
            // Tentar buscar do banco real
            const { count: totalExams } = await supabase
                .from('exams')
                .select('*', { count: 'exact', head: true });

            const { count: totalStudents } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });

            // Média de notas (amostra dos últimos 100 resultados)
            const { data: results } = await supabase
                .from('exam_results')
                .select('score, max_score')
                .limit(100);

            let averageScore = 0;
            if (results && results.length > 0) {
                const percentageSum = results.reduce((acc, r) => {
                    return acc + ((r.score / (r.max_score || 100)) * 100);
                }, 0);
                averageScore = Math.round(percentageSum / results.length);
            }

            return {
                totalExams: totalExams || 12,
                totalStudents: totalStudents || 450,
                averageScore: averageScore || 72,
                completionRate: 88 // Mock por enquanto
            };
        } catch (error) {
            console.error('Erro no analytics global:', error);
            // Fallback
            return {
                totalExams: 12,
                totalStudents: 450,
                averageScore: 72,
                completionRate: 88
            };
        }
    }

    /**
     * Buscar dados de desempenho ao longo do tempo
     */
    async getPerformanceHistory(): Promise<PerformanceData[]> {
        // Mock data para visualização bonita
        return [
            { examTitle: 'Matemática P1', date: '2024-02-10', average: 65, highest: 90, lowest: 40 },
            { examTitle: 'Português P1', date: '2024-02-15', average: 72, highest: 95, lowest: 50 },
            { examTitle: 'História P1', date: '2024-02-20', average: 78, highest: 98, lowest: 60 },
            { examTitle: 'Matemática P2', date: '2024-03-10', average: 68, highest: 92, lowest: 45 },
            { examTitle: 'Geografia P1', date: '2024-03-15', average: 82, highest: 100, lowest: 65 },
            { examTitle: 'Ciências P1', date: '2024-03-20', average: 75, highest: 94, lowest: 55 },
        ];
    }

    /**
     * Buscar dados de comparecimento
     */
    async getAttendanceStats(): Promise<AttendanceData[]> {
        return [
            { status: 'Presente', count: 380, fill: '#22c55e' }, // green-500
            { status: 'Ausente', count: 45, fill: '#ef4444' },   // red-500
            { status: 'Justificado', count: 25, fill: '#eab308' } // yellow-500
        ];
    }

    /**
     * Análise de pontos fracos (Dificuldade por tópico)
     */
    async getWeakSpots(): Promise<DifficultyItem[]> {
        return [
            { topic: 'Equações de 2º Grau', errorRate: 68, questionCount: 15 },
            { topic: 'Interpretação de Texto', errorRate: 45, questionCount: 22 },
            { topic: 'Revolução Francesa', errorRate: 42, questionCount: 10 },
            { topic: 'Geometria Plana', errorRate: 38, questionCount: 12 },
            { topic: 'Gramática - Sintaxe', errorRate: 35, questionCount: 18 },
        ];
    }
    /**
     * Obter estatísticas individuais do aluno (Mock)
     */
    getStudentStats(studentId: string) {
        // Simulação baseada no ID para consistência visual
        const pseudoRandom = (seed: string) => {
            let val = 0;
            for (let j = 0; j < seed.length; j++) val += seed.charCodeAt(j);
            return val;
        };

        const seedValue = pseudoRandom(studentId);

        return {
            id: studentId,
            idgScore: (seedValue % 50) / 10 + 4, // 4.0 - 9.0
            examAverage: (seedValue % 40) / 10 + 5, // 5.0 - 9.0
            projectAverage: (seedValue % 30) / 10 + 6, // 6.0 - 9.0
            bonusPoints: (seedValue % 100),
            examsTaken: (seedValue % 20) + 1,
            attendanceRate: 75 + (seedValue % 25),
            riskLevel: (seedValue % 3) === 0 ? 'HIGH' : (seedValue % 3) === 1 ? 'MEDIUM' : 'LOW',
            missingPointsForApproval: 10 - ((seedValue % 50) / 10 + 4),
            strongestSubject: 'Matemática',
            weakestSubject: 'História',
            // attendance: JSON.stringify({ present: 80, absent: 20 }), // Legacy field removal if needed, or keep for compatibility
            attendance: JSON.stringify({ present: 80, absent: 20 }),
            lastAccess: new Date().toISOString()
        };
    }

    /**
     * Obter estatísticas da rede (Mock)
     */
    getNetworkStats() {
        return {
            avgIDG: 6.8,
            totalStudents: 12500,
            riskPercentage: 12,
            connectivity: 98
        };
    }

    /**
     * Obter quebra por disciplina (Mock)
     */
    getSubjectBreakdown() {
        return [
            { label: 'Matemática', value: 6.5, color: '#3b82f6' },
            { label: 'Português', value: 7.2, color: '#8b5cf6' },
            { label: 'História', value: 7.8, color: '#f59e0b' },
            { label: 'Ciências', value: 6.9, color: '#10b981' }
        ];
    }
}

export const analyticsService = new AnalyticsService();
