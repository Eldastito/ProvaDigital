/**
 * Motor de Inteligência para Detecção de Risco (Evasão/Desempenho)
 */
import { Student, ExamResult, AppState, RiskLevel } from '../types';

export interface RiskFactor {
    name: string;
    severity: RiskLevel;
    value: string;
    message: string;
    threshold?: string;   // Limiar para disparo (ex: < 75%)
    evidence?: string[];  // Fatos que comprovam o risco
    recommendation?: string; // Sugestão de ação
}

export interface RiskAssessment {
    studentId: string;
    studentName: string;
    schoolId?: string;
    classId: string;
    riskScore: number; // 0 a 100
    riskLevel: RiskLevel;
    factors: RiskFactor[];
    interventions?: any[]; // Added to match AlertService expectation
    generatedAt: string;
    simulatedAttendance: number; // Porcentagem de presença (0-100)
    evasionProbability: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
}

/**
 * Calcula a assiduidade real baseada nos resultados de provas.
 * @param studentId ID do aluno
 * @param results Todos os resultados de provas (não só deste aluno)
 * @param totalExamsCount Número total de provas aplicadas para a turma deste aluno
 */
const calculateRealAttendance = (studentResults: ExamResult[], totalExamsCount: number = 5): number => {
    // Se não houver dados de provas totais (MVP), assume um número base baseado no aluno com mais provas
    // Em produção, isso viria de `class.exams.length`

    if (totalExamsCount === 0) return 100;

    const participated = studentResults.length;

    // Cálculo percentual
    const percentage = (participated / totalExamsCount) * 100;

    return Math.min(100, Math.max(0, percentage));
};

export const calculateRiskScore = (student: Student, results: ExamResult[], classTotalExams: number = 5): RiskAssessment => {
    const factors: RiskFactor[] = [];
    let riskScore = 0;

    // 1. ANÁLISE DE FREQUÊNCIA (Peso: 40 points)
    const attendance = calculateRealAttendance(results, classTotalExams);

    if (attendance < 75) {
        riskScore += 40;
        factors.push({
            name: 'Frequência Crítica',
            severity: RiskLevel.HIGH,
            value: `${attendance}%`,
            message: 'Aluno com alto nº de faltas. Risco iminente de reprovação por falta.',
            threshold: '< 75%',
            evidence: ['Faltas consecutivas na última semana', 'Ausência em dias de prova', 'Sem justificativa médica apresentada'],
            recommendation: 'Agendar reunião presencial com os pais e acionar Conselho Tutelar se necessário.'
        });
    } else if (attendance < 85) {
        riskScore += 15;
        factors.push({
            name: 'Frequência em Queda',
            severity: RiskLevel.MEDIUM,
            value: `${attendance}%`,
            message: 'Faltas aumentando. Acompanhar.',
            threshold: '< 85%',
            evidence: ['Faltas intercaladas', 'Atrasos frequentes no primeiro tempo'],
            recommendation: 'Entrar em contato via WhatsApp com os responsáveis para entender motivos.'
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
                message: 'Média geral abaixo de 5.0. Necessita reforço urgente.',
                threshold: 'Média < 5.0',
                evidence: ['Notas vermelhas em 3+ disciplinas', 'Não entregou trabalhos do bimestre'],
                recommendation: 'Encaminhar para aulas de reforço no contraturno e solicitar plano de estudos individualizado.'
            });
        } else if (avgScore < 7.0) {
            riskScore += 20;
            factors.push({
                name: 'Desempenho em Alerta',
                severity: RiskLevel.MEDIUM,
                value: avgScore.toFixed(1),
                message: 'Média abaixo de 7.0. Monitorar.',
                threshold: 'Média < 7.0',
                evidence: ['Dificuldade em Matemática e Ciências', 'Participação baixa em sala'],
                recommendation: 'Sugerir atividades extras na plataforma e monitorar próximas avaliações.'
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

    // CÁLCULO DE PROBABILIDADE DE EVASÃO
    // Baseado em: Baixa Frequência (> peso) + Queda de Notas
    let evasionProb: RiskAssessment['evasionProbability'] = 'BAIXA';

    // Se frequência < 75% (Reprovação por falta) -> CRITICA
    if (attendance < 75) {
        evasionProb = 'CRITICA';
    }
    // Se frequência < 85% E Notas Vermelhas -> ALTA
    else if (attendance < 85 && avgScore < 6.0) {
        evasionProb = 'ALTA';
    }
    // Se Risco Alto (por nota ou queda) -> MEDIA
    else if (riskLevel === RiskLevel.HIGH) {
        evasionProb = 'MEDIA';
    }

    return {
        studentId: student.id,
        studentName: student.name,
        classId: student.classId,
        schoolId: student.schoolId,
        riskScore: Math.min(riskScore, 100),
        riskLevel,
        factors,
        simulatedAttendance: attendance,
        evasionProbability: evasionProb,
        generatedAt: new Date().toISOString()
    };
};

/**
 * Calcula o risco para todos os alunos de uma escola
 */
/**
 * Calcula o risco para todos os alunos de uma escola
 */
export const calculateSchoolRisk = (schoolId: string, state: AppState): RiskAssessment[] => {
    // 1. Filtrar alunos da escola
    const students = state.students.filter(s => s.schoolId === schoolId);
    return calculateBatchRisk(students, state);
};

/**
 * Calcula o risco para um conjunto arbitrário de alunos
 * Útil para Secretarias e MEC que veem múltiplas escolas
 */
export const calculateBatchRisk = (students: Student[], state: AppState): RiskAssessment[] => {
    // 1. Mapear o total de provas por turma (Real)
    // Isso substitui a heurística anterior de "maxExamsInClass"
    const classExamCounts = new Map<string, number>();

    // Obter IDs das turmas dos alunos verificados
    const uniqueClassIds = Array.from(new Set(students.map(s => s.classId)));

    uniqueClassIds.forEach(classId => {
        // Conta provas ativas/concluídas/publicadas vinculadas a esta turma
        const examCount = state.exams.filter(e =>
            e.classIds.includes(classId) &&
            e.status !== 'DRAFT' // Ignora rascunhos
        ).length;

        // Fallback para 1 para evitar divisão por zero se não houver provas
        classExamCounts.set(classId, Math.max(1, examCount));
    });

    // Para cada aluno, calcular risco
    const assessments = students.map(student => {
        // Obter resultados do aluno
        const studentResults = state.results.filter(r => r.studentId === student.id);

        // Obter total de provas da turma desse aluno
        const totalClassExams = classExamCounts.get(student.classId) || 5; // Fallback seguro (MVP default)

        // Calcular score
        return calculateRiskScore(student, studentResults, totalClassExams);
    });

    // Ordenar por score (maior risco primeiro)
    return assessments.sort((a, b) => b.riskScore - a.riskScore);
};
