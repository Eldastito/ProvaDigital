
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, DifficultyLevel, AssessmentType } from "../types";

// --- Configuration ---
const DEFAULT_MODEL = 'gemini-3-flash-preview';

// --- Prompts ---
const PROMPTS = {
    GENERATE_QUESTIONS: (qty: number, subject: string, type: string, difficulty: string, context: string, instructions: string) => `
        Você é um professor especialista alinhado com a BNCC (Brasil). 
        Gere ${qty} questões de avaliação para a disciplina de ${subject}.
        
        FORMATO SOLICITADO: ${type}
        DIFICULDADE: ${difficulty}

        INSTRUÇÕES ADICIONAIS DO USUÁRIO:
        "${instructions}"

        REGRAS MANDATÓRIAS:
        - Se for MULTIPLE_CHOICE_4: Gere exatamente 4 alternativas (A, B, C, D).
        - Se for MULTIPLE_CHOICE_5: Gere exatamente 5 alternativas (A, B, C, D, E).
        - Se for TRUE_FALSE: Gere 2 alternativas ("Verdadeiro" e "Falso").
        - OBRIGATÓRIO: Forneça o código da BNCC correspondente para cada questão (ex: EF09HI02).
        - OBRIGATÓRIO: Forneça uma justificativa pedagógica para a resposta correta.

        CONTEÚDO BASE:
        "${context.substring(0, 15000)}" 
        
        Retorne estritamente em JSON.
    `,
    SUGGEST_BNCC: (statement: string, subject: string) => `
        Dada a seguinte questão de ${subject}, identifique o código da BNCC (Base Nacional Comum Curricular) mais adequado.
        Questão: "${statement}"
        Retorne APENAS o código (ex: EF01MA01).
    `,
    GRADE_ESSAY: (question: string, expected: string, answer: string, score: number) => `
        Avalie a resposta do aluno para uma questão discursiva.
        Questão: "${question}"
        Gabarito Esperado: "${expected}"
        Resposta do Aluno: "${answer}"
        Valor Máximo: ${score} pontos.
        Retorne JSON com nota e feedback.
    `,
    STUDY_PLAN: (name: string, subject: string, grade: number) => `
        Crie um plano de estudo para ${name}. Assunto: ${subject}. Nota: ${grade}.
        Gere título e tarefas práticas em JSON.
    `,
    LESSON_PLAN: (topic: string, subject: string, classLevel: string, contextContent: string) => `
        Crie um plano de aula completo para o tópico ${topic} (${subject}) nível ${classLevel}.
        Use o contexto se fornecido: ${contextContent.substring(0, 5000)}.
    `,
    ASSESSMENT_REPORT: (name: string, type: string, answers: string) => `
        Gere um relatório de perfil ${type} para ${name}. Respostas: ${answers}.
        Retorne JSON com resultado, relatório, pontos fortes e fracos.
    `,
    TUTOR_SYSTEM: (name: string, context: string, forbidden: string[]) => `
        Você é o Corujão, tutor IA. Aluno: ${name}. Contexto: ${context}.
        Não forneça respostas diretas. Tópicos bloqueados: ${forbidden.join(', ')}.
    `
};

async function callGeminiAPI<T>(
    contents: any,
    responseSchema: any | undefined,
    fallbackValue: T
): Promise<T> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const config: any = {};
        if (responseSchema) {
            config.responseMimeType = "application/json";
            config.responseSchema = responseSchema;
        }

        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: contents,
            config: config
        });

        let text = response.text;
        if (!text) throw new Error("Resposta vazia");

        if (responseSchema) {
            return JSON.parse(text) as T;
        }
        return text as unknown as T;
    } catch (error) {
        console.error("[GeminiService] Erro:", error);
        return fallbackValue;
    }
}

export const generateQuestionsWithAI = async (
  context: string,
  quantity: number,
  format: string,
  difficulty: DifficultyLevel,
  subject: string,
  instructions: string,
  fileData?: { data: string, mimeType: string }
): Promise<any[]> => {
  const prompt = PROMPTS.GENERATE_QUESTIONS(quantity, subject, format, difficulty, context, instructions);
  
  const contents: any = { parts: [{ text: prompt }] };
  if (fileData) {
      contents.parts.push({
          inlineData: {
              data: fileData.data,
              mimeType: fileData.mimeType
          }
      });
  }

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        statement: { type: Type.STRING },
        alternatives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              isCorrect: { type: Type.BOOLEAN }
            }
          }
        },
        justification: { type: Type.STRING },
        difficulty: { type: Type.STRING },
        bnccCode: { type: Type.STRING }
      }
    }
  };
  return callGeminiAPI<any[]>(contents, schema, []);
};

export const suggestBnccCode = async (statement: string, subject: string): Promise<string> => {
    const prompt = PROMPTS.SUGGEST_BNCC(statement, subject);
    return callGeminiAPI<string>(prompt, undefined, "");
};

export const gradeEssayAnswer = async (
    question: string,
    expectedAnswer: string,
    studentAnswer: string,
    maxScore: number
): Promise<any> => {
    const prompt = PROMPTS.GRADE_ESSAY(question, expectedAnswer, studentAnswer, maxScore);
    const schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
        }
    };
    return callGeminiAPI<any>(prompt, schema, { score: 0, feedback: 'Erro de análise' });
};

export const askOwlTutor = async (
    history: { role: 'user' | 'model'; text: string }[],
    lastUserMessage: string,
    studentName: string,
    context: string,
    forbiddenTopics: string[] = []
): Promise<string> => {
    let prompt = PROMPTS.TUTOR_SYSTEM(studentName, context, forbiddenTopics) + "\nHistórico:\n";
    history.forEach(msg => prompt += `${msg.role}: ${msg.text}\n`);
    prompt += `user: ${lastUserMessage}\nmodel:`;
    return callGeminiAPI<string>(prompt, undefined, "🦉 Desculpe, estou em manutenção agora.");
};

export const generateStudyPlanSuggestions = async (
    studentName: string,
    weakSubject: string,
    recentGrade: number
): Promise<any> => {
    const prompt = PROMPTS.STUDY_PLAN(studentName, weakSubject, recentGrade);
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };
    return callGeminiAPI<any>(prompt, schema, { title: 'Plano de Estudos', tasks: [] });
};

export const generateLessonPlanSuggestions = async (
    topic: string,
    subject: string,
    classLevel: string,
    contextContent: string
): Promise<string> => {
    const prompt = PROMPTS.LESSON_PLAN(topic, subject, classLevel, contextContent);
    return callGeminiAPI<string>(prompt, undefined, "Erro ao gerar plano.");
};

export const generateAssessmentReport = async (
    userName: string,
    testType: AssessmentType,
    answers: { question: string; answer: string }[]
): Promise<any> => {
    const prompt = PROMPTS.ASSESSMENT_REPORT(userName, testType, JSON.stringify(answers));
    const schema = {
        type: Type.OBJECT,
        properties: {
            resultType: { type: Type.STRING },
            report: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };
    return callGeminiAPI<any>(prompt, schema, { resultType: 'Análise Geral', report: '', strengths: [], weaknesses: [] });
};
