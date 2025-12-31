
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, DifficultyLevel, AssessmentType } from "../types";

// --- Configuration ---
const DEFAULT_MODEL = 'gemini-2.5-flash';

// --- Prompts ---
const PROMPTS = {
    GENERATE_QUESTIONS: (qty: number, subject: string, type: QuestionType, difficulty: string, context: string) => `
        You are an expert teacher aligned with the Brazilian curriculum (BNCC). Generate ${qty} exam questions based on the following text.
        
        Subject: ${subject}
        Type: ${type} (If MULTIPLE_CHOICE, provide 4 or 5 alternatives. If TRUE_FALSE, provide 2 options. If ESSAY, provide empty alternatives but a clear expected answer in justification).
        Target Difficulty: ${difficulty}

        IMPORTANT: For each question, suggest the most appropriate BNCC code (Base Nacional Comum Curricular) if applicable (e.g., EF09HI02).

        Context Text:
        "${context.substring(0, 10000)}" 
        
        Return the response strictly in JSON format conforming to the schema.
    `,
    GRADE_ESSAY: (question: string, expected: string, answer: string, score: number) => `
        Você é um professor corretor experiente. Avalie a resposta do aluno para uma questão discursiva.
        
        Questão: "${question}"
        Gabarito Esperado/Critérios: "${expected}"
        Resposta do Aluno: "${answer}"
        Valor da Questão: ${score} pontos.

        Tarefa:
        1. Atribua uma nota justa baseada na similaridade semântica e completude da resposta.
        2. Forneça um feedback curto e construtivo para o aluno.

        Retorne JSON.
    `,
    STUDY_PLAN: (name: string, subject: string, grade: number) => `
        Crie um plano de estudo personalizado e motivador para o aluno ${name}.
        Dificuldade principal identificada: ${subject}.
        Nota recente: ${grade}.
        
        Gere um título inspirador e 3 a 5 tarefas práticas, específicas e curtas para recuperar essa nota.
    `,
    ASSESSMENT_REPORT: (name: string, type: string, answers: string) => `
        Analise as respostas do teste de perfil "${type}" do usuário ${name}.
        Respostas: ${answers}
        
        CONTEXTO IMPORTANTE:
        Se o tipo for "TRIAGEM_TDAH" ou "TRIAGEM_AUTISMO", aja como um especialista em psicopedagogia clínica realizando uma triagem inicial (screening).
        NÃO dê diagnóstico médico fechado. Use termos como "Indicativos", "Sinais de alerta", "Compatível com".
        
        Tarefa:
        1. Defina o arquétipo/resultado principal (ex: "Perfil Neurotípico", "Indicativo de Alta Atenção", "Sinais de Hiperatividade").
        2. Escreva um relatório detalhado. Para triagens clínicas, seja formal, acolhedor e recomende avaliação profissional se houver muitos sinais.
        3. Liste 3 pontos fortes/características marcantes.
        4. Liste 3 pontos de desenvolvimento/atenção.
    `,
    TUTOR_SYSTEM: (name: string, context: string, forbidden: string[]) => `
        System: Você é o Corujão, um tutor de IA amigável, sábio e encorajador para estudantes.
        Nome do Aluno: ${name}
        Contexto do Aluno: ${context}
        
        REGRAS:
        1. Seja conciso, didático e use emojis ocasionalmente 🦉.
        2. NÃO forneça respostas diretas para perguntas de prova. Ajude a raciocinar.
        3. Tópicos PROIBIDOS (Em prova agora): ${forbidden.join(', ')}. Se o aluno perguntar sobre isso, recuse educadamente e deseje boa sorte na prova.
    `
};

// --- Helper: Safe Env Access ---
// This function is critical for stability in Web Containers where 'process' is undefined.
const getApiKey = (): string | undefined => {
  // 1. Browser / Web Container: Global variable injection
  const globalKey = (globalThis as any)?.GEMINI_API_KEY;
  if (typeof globalKey === 'string' && globalKey.trim().length > 0) {
    return globalKey;
  }

  // 2. Vite Environment Variable
  const meta = import.meta as any;
  if (meta && meta.env && meta.env.VITE_API_KEY) {
    return meta.env.VITE_API_KEY;
  }
  
  // 3. Safe Process Check (Node/Server environment)
  try {
      // @ts-ignore
      if (typeof process !== 'undefined' && process?.env?.API_KEY) {
          // @ts-ignore
          return process.env.API_KEY;
      }
  } catch (e) {
      // Ignore reference errors
  }

  return undefined;
};

// --- Interfaces ---
interface GeneratedQuestion {
  statement: string;
  alternatives: { text: string; isCorrect: boolean }[];
  justification: string;
  difficulty: string;
  bnccCode?: string;
}

interface EssayGrade {
    score: number;
    feedback: string;
}

interface StudyPlanSuggestion {
    title: string;
    tasks: string[];
}

interface AssessmentReport {
    resultType: string;
    report: string;
    strengths: string[];
    weaknesses: string[];
}

// --- Helper Functions ---

async function callGeminiAPI<T>(
    contents: string | any,
    responseSchema: any | undefined,
    fallbackValue: T
): Promise<T> {
    const apiKey = getApiKey();

    if (!apiKey) {
        console.warn("[GeminiService] API Key missing. Returning fallback data (offline mode).");
        return fallbackValue;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
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
        if (!text) throw new Error("Empty response received from Gemini.");

        if (responseSchema) {
            // Sanitize Markdown code blocks if present
            if (text.startsWith('```json')) {
                text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (text.startsWith('```')) {
                text = text.replace(/^```\n/, '').replace(/\n```$/, '');
            }
            return JSON.parse(text) as T;
        }
        
        return text as unknown as T;

    } catch (error) {
        console.error("[GeminiService] API Error:", error);
        return fallbackValue;
    }
}

// --- Exported Services ---

export const generateQuestionsFromText = async (
  contextText: string,
  quantity: number,
  type: QuestionType,
  difficulty: DifficultyLevel,
  subject: string
): Promise<GeneratedQuestion[]> => {
    
  const prompt = PROMPTS.GENERATE_QUESTIONS(quantity, subject, type, difficulty, contextText);

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        statement: { type: Type.STRING, description: "The question text" },
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
        justification: { type: Type.STRING, description: "Why the answer is correct" },
        difficulty: { type: Type.STRING, enum: ["FACIL", "MEDIO", "DIFICIL"] },
        bnccCode: { type: Type.STRING, description: "The BNCC code (e.g., EF01MA01)" }
      }
    }
  };

  return callGeminiAPI<GeneratedQuestion[]>(prompt, schema, mockGenerate(quantity, type, difficulty));
};

export const gradeEssayAnswer = async (
    question: string,
    expectedAnswer: string,
    studentAnswer: string,
    maxScore: number
): Promise<EssayGrade> => {

    const prompt = PROMPTS.GRADE_ESSAY(question, expectedAnswer, studentAnswer, maxScore);

    const schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
        }
    };

    const fallback: EssayGrade = { 
        score: maxScore * 0.8, 
        feedback: "Simulação: Resposta parece correta, mas faltou detalhar X. (Modo Offline)" 
    };

    return callGeminiAPI<EssayGrade>(prompt, schema, fallback);
};

export const askOwlTutor = async (
    history: { role: 'user' | 'model'; text: string }[],
    lastUserMessage: string,
    studentName: string,
    context: string,
    forbiddenTopics: string[] = []
): Promise<string> => {
    
    let prompt = PROMPTS.TUTOR_SYSTEM(studentName, context, forbiddenTopics) + "\nHistórico da Conversa:\n";

    history.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'Aluno' : 'Corujão'}: ${msg.text}\n`;
    });

    prompt += `Aluno: ${lastUserMessage}\nCorujão:`;

    const fallback = "Olá! Estou operando em modo offline no momento. Verifique sua conexão ou a chave de API para conversarmos melhor! 🦉";

    return callGeminiAPI<string>(prompt, undefined, fallback);
};

export const generateStudyPlanSuggestions = async (
    studentName: string,
    weakSubject: string,
    recentGrade: number
): Promise<StudyPlanSuggestion> => {
    
    const prompt = PROMPTS.STUDY_PLAN(studentName, weakSubject, recentGrade);

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };

    const fallback: StudyPlanSuggestion = {
        title: `Plano de Recuperação: ${weakSubject}`,
        tasks: [
            `Revisar capítulo 4 de ${weakSubject} (Sugestão Automática)`,
            `Refazer exercícios da prova anterior`,
            `Assistir vídeo-aula sobre o tema`
        ]
    };

    return callGeminiAPI<StudyPlanSuggestion>(prompt, schema, fallback);
};

export const generateAssessmentReport = async (
    userName: string,
    testType: AssessmentType,
    answers: { question: string; answer: string }[]
): Promise<AssessmentReport> => {
    
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

    const fallback: AssessmentReport = {
        resultType: "Perfil Demo (Offline)",
        report: "Este é um relatório simulado pois a conexão com a IA não pôde ser estabelecida. Suas respostas foram salvas localmente.",
        strengths: ["Resiliência (Simulado)", "Proatividade (Simulado)", "Criatividade (Simulado)"],
        weaknesses: ["Organização (Simulado)", "Foco (Simulado)", "Paciência (Simulado)"]
    };

    return callGeminiAPI<AssessmentReport>(prompt, schema, fallback);
};

// --- Internal Mock Generator (Fallback) ---
const mockGenerate = (qty: number, type: QuestionType, diff: DifficultyLevel): GeneratedQuestion[] => {
  return Array.from({ length: qty }).map((_, i) => ({
    statement: `(Mock AI) Questão ${i + 1} gerada localmente sobre o tema (Modo Offline). Dificuldade: ${diff}.`,
    alternatives: [
      { text: "Alternativa Correta Exemplo", isCorrect: true },
      { text: "Distrator 1 incorreto", isCorrect: false },
      { text: "Distrator 2 incorreto", isCorrect: false },
      { text: "Distrator 3 incorreto", isCorrect: false },
    ],
    justification: "Esta é a resposta correta porque o sistema está em modo de fallback.",
    difficulty: diff,
    bnccCode: "EF00MOCK"
  }));
};
