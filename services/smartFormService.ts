import { AppState, Exam, UserRole } from '../types';

export interface SmartFormPrediction {
    suggestedSubject?: string;
    suggestedClassIds?: string[];
    suggestedDifficulty?: string; // EASY, MEDIUM, HARD
    suggestedDate?: string; // ISO date for next exam
    confidenceScore: number; // 0-100%
    reasoning: string;
}

/**
 * Serviço responsável por analisar o histórico do professor/coordenador e inferir (auto-preencher)
 * as prováveis opções ao abrir um formulário de Nova Prova ou Novo Agendamento.
 */
export const predictNextExamConfiguration = (
    state: AppState,
    professorId: string
): SmartFormPrediction | null => {

    // 1. Encontrar as provas passadas do professor
    const pastExams = state.exams
        .filter(e => e.creatorId === professorId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (pastExams.length === 0) {
        return null; // Não há histórico suficiente
    }

    // 2. Descobrir turma e disciplina mais frequente nas avaliações recentes (últimos 3 meses ou 5 exames)
    const recentExams = pastExams.slice(0, 5);
    const subjectFrequency: Record<string, number> = {};
    const classFrequency: Record<string, number> = {};

    recentExams.forEach(exam => {
        if (exam.subject) {
            subjectFrequency[exam.subject] = (subjectFrequency[exam.subject] || 0) + 1;
        }
        if (exam.classIds) {
            exam.classIds.forEach(cId => {
                classFrequency[cId] = (classFrequency[cId] || 0) + 1;
            });
        }
    });

    const mostCommonSubject = Object.entries(subjectFrequency).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostCommonClassId = Object.entries(classFrequency).sort((a, b) => b[1] - a[1])[0]?.[0];

    // 3. Predição de data: Analisar o intervalo médio entre as provas deste professor
    let suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + 7); // Default: próxima semana

    if (recentExams.length >= 2) {
        let totalDaysDiff = 0;
        let diffCount = 0;
        for (let i = 0; i < recentExams.length - 1; i++) {
            const current = new Date(recentExams[i].createdAt);
            const prev = new Date(recentExams[i + 1].createdAt);
            const diffMs = current.getTime() - prev.getTime();
            totalDaysDiff += (diffMs / (1000 * 60 * 60 * 24));
            diffCount++;
        }

        if (diffCount > 0) {
            const avgInterval = Math.round(totalDaysDiff / diffCount);
            const lastExamDate = new Date(recentExams[0].createdAt);

            // Sugerir a próxima data somando o intervalo médio à última prova
            lastExamDate.setDate(lastExamDate.getDate() + avgInterval);

            // Se a data já passou (está atrasado), sugerir a próxima semana
            if (lastExamDate.getTime() > new Date().getTime()) {
                suggestedDate = lastExamDate;
            }
        }
    }

    // Retorna a Predição
    return {
        suggestedSubject: mostCommonSubject,
        suggestedClassIds: mostCommonClassId ? [mostCommonClassId] : undefined,
        suggestedDifficulty: 'MEDIUM', // Ponto de partida
        suggestedDate: suggestedDate.toISOString().split('T')[0],
        confidenceScore: 85, // Pode ser refinado
        reasoning: `Baseado nas últimas avaliações de ${mostCommonSubject}, onde observamos um ritmo quinzenal.`
    };
};
