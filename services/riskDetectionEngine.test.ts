import { describe, it, expect } from 'vitest';
import { calculateRiskScore, calculateBatchRisk } from '../services/riskDetectionEngine';
import { RiskLevel } from '../types';

describe('Risk Detection Engine', () => {
    describe('calculateRiskScore', () => {
        it('deve retornar risco ALTO para aluno com frequência < 75%', () => {
            const student = {
                id: 'risk-student-1', // ID especial para forçar frequência baixa
                name: 'João Silva',
                registrationNumber: '12345',
                classId: 'class-1',
                schoolId: 'school-1',
                tenantId: 'tenant-1'
            };

            const results: any[] = [];

            const assessment = calculateRiskScore(student, results);

            expect(assessment.riskLevel).toBe(RiskLevel.HIGH);
            expect(assessment.riskScore).toBeGreaterThanOrEqual(40);
            expect(assessment.factors.length).toBeGreaterThan(0);
            expect(assessment.evasionProbability).toBe('CRITICA');
            expect(assessment.factors[0].name).toContain('Frequência');
        });

        it('deve retornar risco BAIXO para aluno com bom desempenho', () => {
            const student = {
                id: 'good-student-1',
                name: 'Maria Santos',
                registrationNumber: '67890',
                classId: 'class-1',
                schoolId: 'school-1',
                tenantId: 'tenant-1'
            };

            const results = [
                {
                    id: 'result-1',
                    examId: 'exam-1',
                    studentId: 'good-student-1',
                    totalScore: 8.5,
                    answers: [],
                    gradedAt: new Date().toISOString()
                },
                {
                    id: 'result-2',
                    examId: 'exam-2',
                    studentId: 'good-student-1',
                    totalScore: 9.0,
                    answers: [],
                    gradedAt: new Date().toISOString()
                }
            ];

            const assessment = calculateRiskScore(student, results);

            expect(assessment.riskLevel).toBe(RiskLevel.LOW);
            expect(assessment.riskScore).toBeLessThan(20);
        });

        it('deve identificar queda abrupta de desempenho', () => {
            const student = {
                id: 'declining-student',
                name: 'Pedro Costa',
                registrationNumber: '11111',
                classId: 'class-1',
                schoolId: 'school-1',
                tenantId: 'tenant-1'
            };

            const results = [
                {
                    id: 'result-1',
                    examId: 'exam-1',
                    studentId: 'declining-student',
                    totalScore: 8.0,
                    answers: [],
                    gradedAt: '2026-01-01T00:00:00Z'
                },
                {
                    id: 'result-2',
                    examId: 'exam-2',
                    studentId: 'declining-student',
                    totalScore: 4.5, // Queda de 3.5 pontos
                    answers: [],
                    gradedAt: '2026-01-08T00:00:00Z'
                }
            ];

            const assessment = calculateRiskScore(student, results);

            const hasTrendFactor = assessment.factors.some(f =>
                f.name.includes('Queda')
            );

            expect(hasTrendFactor).toBe(true);
        });

        it('deve incluir recomendações de intervenção', () => {
            const student = {
                id: 'risk-student-2',
                name: 'Ana Oliveira',
                registrationNumber: '22222',
                classId: 'class-1',
                schoolId: 'school-1',
                tenantId: 'tenant-1'
            };

            const results: any[] = [];

            const assessment = calculateRiskScore(student, results);

            if (assessment.riskLevel === RiskLevel.HIGH || assessment.riskLevel === RiskLevel.MEDIUM) {
                expect(assessment.factors.length).toBeGreaterThan(0);

                assessment.factors.forEach(factor => {
                    expect(factor).toHaveProperty('recommendation');
                    expect(factor.recommendation).toBeTruthy();
                });
            }
        });
    });

    describe('calculateBatchRisk', () => {
        it('deve calcular risco para múltiplos alunos', () => {
            const students = [
                {
                    id: 'student-1',
                    name: 'Aluno 1',
                    registrationNumber: '001',
                    classId: 'class-1',
                    schoolId: 'school-1',
                    tenantId: 'tenant-1'
                },
                {
                    id: 'student-2',
                    name: 'Aluno 2',
                    registrationNumber: '002',
                    classId: 'class-1',
                    schoolId: 'school-1',
                    tenantId: 'tenant-1'
                }
            ];

            const state = {
                results: [],
                students,
                // ... outros campos do AppState
            } as any;

            const assessments = calculateBatchRisk(students, state);

            expect(assessments.length).toBe(2);
            expect(assessments[0]).toHaveProperty('riskScore');
            expect(assessments[0]).toHaveProperty('riskLevel');
            expect(assessments[0]).toHaveProperty('factors');
        });

        it('deve ordenar por risco (maior primeiro)', () => {
            const students = [
                {
                    id: 'good-student',
                    name: 'Bom Aluno',
                    registrationNumber: '001',
                    classId: 'class-1',
                    schoolId: 'school-1',
                    tenantId: 'tenant-1'
                },
                {
                    id: 'risk-student-high',
                    name: 'Aluno em Risco',
                    registrationNumber: '002',
                    classId: 'class-1',
                    schoolId: 'school-1',
                    tenantId: 'tenant-1'
                }
            ];

            const state = {
                results: [],
                students,
            } as any;

            const assessments = calculateBatchRisk(students, state);

            // Primeiro deve ser o de maior risco
            expect(assessments[0].riskScore).toBeGreaterThanOrEqual(assessments[1].riskScore);
        });
    });
});
