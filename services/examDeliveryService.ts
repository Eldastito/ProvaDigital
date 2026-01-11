import { ExamVariant, ExamVersion, Student } from '../types';
import { useAppStore } from '../store/useAppStore';

/**
 * Lógica Determinística de Delivery de Provas:
 * Seleciona a variante correta da prova com base na condição do aluno (PCD/Neuro).
 * Garante auditabilidade e equidade.
 */
export const resolveExamVariant = (
    examId: string,
    studentId: string,
    state: any
): { variant: ExamVariant | null, version: ExamVersion | null } => {
    // 1. Encontra a versão ativa mais recente da prova
    const versions = state.examVersions.filter((v: any) => v.examId === examId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (versions.length === 0) return { variant: null, version: null };
    const latestVersion = versions[0];

    // 2. Verifica o perfil do aluno para identificar necessidade de acessibilidade
    const student = state.students.find((s: any) => s.id === studentId);
    if (!student) return { variant: null, version: latestVersion };

    // 3. Busca variantes específicas para a condição do aluno (ex: TEA, TDAH)
    // Se o aluno tiver uma condição cadastrada (mocked for now)
    const conditionCode = student.metadata?.conditionCode; // Ex: 'TEA'

    if (conditionCode) {
        const variant = state.examVariants.find((v: any) =>
            v.examVersionId === latestVersion.id &&
            v.conditionCode === conditionCode
        );

        if (variant) {
            console.log(`[DELIVERY] Serving VARIANT for student ${studentId} (Condition: ${conditionCode})`);
            return { variant, version: latestVersion };
        }
    }

    // 4. Fallback para a versão padrão (Standard)
    console.log(`[DELIVERY] Serving STANDARD version for student ${studentId}`);
    return { variant: null, version: latestVersion };
};
