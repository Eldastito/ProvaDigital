/**
 * Motor de Inteligência para Detecção de Risco (Evasão/Desempenho)
 */
import { Student, ExamResult } from '../types';

export enum RiskLevel {
    LOW = 'LOW',         // Sem risco (Verde)
    MEDIUM = 'MEDIUM',   // Atenção (Amarelo)
    HIGH = 'HIGH',       // Risco Crítico - Evasão provável (Vermelho)
}

export interface RiskFactor {
    name: string;
    severity: RiskLevel;
    value: string;
    message: string;
}

export interface RiskAssessment {
    studentId: string;
    studentName: string;
    schoolId?: string;
    classId: string;
    riskScore: number; // 0 a 100
    riskLevel: RiskLevel;
    factors: RiskFactor[];
    generatedAt: string;
    simulatedAttendance: number; // Porcentagem de presença (0-100)
}

/**
 * Simula dados de frequência (já que não temos no backend ainda)
 * Usa o hash do ID para manter consistência (o mesmo aluno sempre terá a mesma frequência simulada)
 */
const getSimulatedAttendance = (studentId: string): number => {
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
        hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Normaliza para 60-100% (maioria dos alunos tem presença ok, alguns baixo)
    const normalized = Math.abs(hash % 41) + 60;

    // Forçar alguns alunos específicos a ter frequência critica para teste
    if (studentId.includes('risk') || studentId.includes('evasion')) return 65;

    return normalized;
};

export const calculateRiskScore = (student: Student, results: ExamResult[]): RiskAssessment => {
    const factors: RiskFactor[] = [];
    let riskScore = 0;

    // 1. ANÁLISE DE FREQUÊNCIA (Peso: 40 points)
    const attendance = getSimulatedAttendance(student.id);

    if (attendance < 75) {
        riskScore += 40;
        factors.push({
            name: 'Frequência Crítica',
            severity: RiskLevel.HIGH,
            value: `${attendance}%`,
            message: 'Aluno com alto nº de faltas. Risco iminente de reprovação por falta.'
        });
    } else if (attendance < 85) {
        riskScore += 15;
        factors.push({
            name: 'Frequência em Queda',
            severity: RiskLevel.MEDIUM,
            value: `${attendance}%`,
            message: 'Faltas aumentando. Acompanhar.'
        });
    }

    // 2. ANÁLISE ACADÊMICA (Peso: 60 points)
    const avgScore = results.length > 0
        ? results.reduce((sum, r) => sum + r.totalScore, 0) / results.length
        : 0;

    if (results.length > 0) {
        if (avgScore < 5.0) {
            riskScore += 40; // Risco acadêmico grave
            factors.push({
                name: 'Desempenho Insuficiente',
                severity: RiskLevel.HIGH,
                value: avgScore.toFixed(1),
                message: 'Média geral abaixo de 5.0. Necessita reforço urgente.'
            });
        } else if (avgScore < 7.0) {
            riskScore += 20;
            factors.push({
                name: 'Desempenho em Alerta',
                severity: RiskLevel.MEDIUM,
                value: avgScore.toFixed(1),
                message: 'Média abaixo de 7.0. Monitorar.'
            });
        }

        // Tendência de Queda (últimas 2 provas)
        if (results.length >= 2) {
            // Assumindo que results estão não ordenados, pegamos os últimos adicionados (mock)
            // Em prod, ordenaríamos por data
            const last = results[results.length - 1].totalScore;
            const prev = results[results.length - 2].totalScore;

            if (last < prev - 2.0) { // Caiu mais de 2 pontos
                riskScore += 15;
                factors.push({
                    name: 'Queda Abrupta',
                    severity: RiskLevel.MEDIUM,
                    value: `${prev.toFixed(1)} -> ${last.toFixed(1)}`,
                    message: 'Nota caiu significativamente na última avaliação.'
                });
            }
        }
    } else {
        // Sem notas ainda
        riskScore += 0;
    }

    // CÁLCULO FINAL DO NÍVEL
    let riskLevel = RiskLevel.LOW;
    if (riskScore >= 50) riskLevel = RiskLevel.HIGH;
    else if (riskScore >= 20) riskLevel = RiskLevel.MEDIUM;

    return {
        studentId: student.id,
        studentName: student.name,
        classId: student.classId,
        schoolId: student.schoolId,
        riskScore: Math.min(riskScore, 100),
        riskLevel,
        factors,
        simulatedAttendance: attendance,
        generatedAt: new Date().toISOString()
    };
};
