import { generateContent, searchKnowledgeBase } from './geminiService';
import { StudentReportData, ClassReportData } from '../types';

/**
 * Narrative Report Skill
 * Automatically generates pedagogical narratives based on quantitative data.
 */
export const generatePedagogicalNarrative = async (
    data: StudentReportData | ClassReportData,
    type: 'STUDENT' | 'CLASS',
    tenantId?: string
): Promise<string> => {

    // RAG Phase: Fetch school-specific pedagogical guidelines
    let ragContext = "";
    if (tenantId) {
        const query = type === 'STUDENT'
            ? "diretrizes para parecer pedagógico individual do aluno"
            : "modelo e diretrizes de relatório de desempenho de turma gestão escolar";
        ragContext = await searchKnowledgeBase(query, tenantId, 2);
    }

    const prompt = type === 'STUDENT'
        ? constructStudentPrompt(data as StudentReportData, ragContext)
        : constructClassPrompt(data as ClassReportData, ragContext);

    try {
        const response = await generateContent(prompt);
        return response || "Não foi possível gerar a narrativa pedagógica automática no momento.";
    } catch (error) {
        console.error("Erro ao gerar narrativa de IA:", error);
        return "Erro ao processar análise pedagógica inteligente.";
    }
};

const constructStudentPrompt = (data: StudentReportData, ragContext?: string): string => {
    let prompt = `
        Aja como um Coordenador Pedagógico sênior.
        Analise os seguintes dados de desempenho do aluno ${data.student.name} e escreva um parecer pedagógico curto (máximo 4 parágrafos).
        
        Dados:
        - Média Geral: ${data.overallMetrics.averageScore.toFixed(1)}%
        - Taxa de Conclusão: ${data.overallMetrics.completionRate.toFixed(1)}%
        - Disciplinas: ${data.subjectPerformance.map(s => `${s.subject} (${s.averageScore.toFixed(1)}%)`).join(', ')}
        - Competências BNCC (Top): ${data.bnccCompetencies.slice(0, 3).map(b => b.code).join(', ')}
    `;

    if (ragContext) {
        prompt += `\n[DIRETRIZES DA ESCOLA (RAG)]:\n${ragContext}\n\nIMPORTANTE: Siga rigorosamente o tom e os termos técnicos encontrados nas diretrizes acima.`;
    }

    prompt += `
        O parecer deve ser encorajador, focar em pontos fortes e sugerir áreas de melhoria de forma construtiva. 
        Evite jargões técnicos excessivos, fale com os pais.
        Responda apenas com o texto do parecer.
    `;
    return prompt;
};

const constructClassPrompt = (data: ClassReportData, ragContext?: string): string => {
    let prompt = `
        Aja como um Consultor Educacional.
        Analise os dados da turma ${data.class.name} e escreva um relatório executivo para o Diretor da Escola.
        
        Dados:
        - Média da Turma: ${data.overallMetrics.averageScore.toFixed(1)}%
        - Desvio Padrão: ${data.overallMetrics.standardDeviation.toFixed(1)}
        - Alunos em Risco: ${data.atRiskStudents.length}
        - Melhores Matérias: ${data.subjectBreakdown.sort((a, b) => b.averageScore - a.averageScore).slice(0, 2).map(s => s.subject).join(', ')}
    `;

    if (ragContext) {
        prompt += `\n[REGRAS DE GESTÃO DA ESCOLA (RAG)]:\n${ragContext}\n\nIMPORTANTE: Considere estas regras e termos ao sugerir estratégias.`;
    }

    prompt += `
        Identifique se a turma está homogênea ou se há disparidades críticas. Sugira uma estratégia macro para o próximo bimestre.
        Máximo 5 parágrafos.
        Responda apenas com o texto do relatório.
    `;
    return prompt;
};
