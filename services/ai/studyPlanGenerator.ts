import { ExamResult, Exam, StudyPlan, StudyTask, QuestionType } from '../../types';
import { uuidv4 } from '../../utils/helpers';

/**
 * Serviço responsável por fechar o ciclo de aprendizagem (Closing the Loop).
 * Analisa o desempenho na avaliação e gera intervenções automáticas.
 */
export const StudyPlanGenerator = {

    /**
     * Analisa o resultado e gera um plano de estudos se necessário.
     * @param result Resultado da prova
     * @param exam Dados da prova
     * @param minScoreThreshold Nota mínima (percentual) para considerar "dominado". Default 60%.
     */
    generate: (result: ExamResult, exam: Exam, minScoreThreshold: number = 60): StudyPlan | null => {

        const maxScore = exam.maxScore || 100;
        const percentage = (result.totalScore / maxScore) * 100;

        // Se o aluno foi bem, não gera plano de recuperação imediato
        // (Poderia gerar um plano de "aprofundamento", mas vamos focar em recuperação agora)
        if (percentage >= minScoreThreshold) {
            return null;
        }

        // Identificar lacunas por área/tag
        // Mock simples: Se errou, gera tarefa para a área da questão
        const tasks: StudyTask[] = [];
        const gapAreas = new Set<string>();

        // Analisar erros (assumindo que temos acesso a quais itens foram errados)
        // Como result.answers é um Record<itemId, itemsCoded>, precisamos iterar
        // TODO: Em produção, isso usaria a análise detalhada do backend

        // Gerar tarefas genéricas baseadas no assunto da prova para a DEMO
        if (exam.subject) {
            tasks.push({
                id: uuidv4(),
                title: `Revisão de Fundamentos: ${exam.subject}`,
                description: `Detectamos dificuldades nos conceitos base de ${exam.subject}. Assista a esta aula de revisão.`,
                type: 'VIDEO',
                contentUrl: 'https://youtube.com/video-aula-exemplo',
                estimatedMinutes: 15,
                completed: false,
                rewardSafe: 20 // OwlCoins
            });

            tasks.push({
                id: uuidv4(),
                title: `Lista de Exercícios: ${exam.subject} - Nível Básico`,
                description: 'Pratique com estes 5 exercícios focados em fixação.',
                type: 'EXERCISE',
                contentUrl: '/exercises/fixacao-1',
                estimatedMinutes: 20,
                completed: false,
                rewardSafe: 30
            });
        }

        if (tasks.length === 0) return null;

        const studyPlan: StudyPlan = {
            id: uuidv4(),
            studentId: result.studentId,
            title: `Plano de Recuperação: ${exam.title}`,
            generatedBy: 'AI_RECOVERY_BOT',
            createdAt: new Date().toISOString(),
            tasks: tasks,
            status: 'PENDING',
            relatedExamId: exam.id
        };

        return studyPlan;
    }
};
