
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, DifficultyLevel, AssessmentType } from "../types";

// --- Configuration ---
const DEFAULT_MODEL = 'gemini-1.5-flash';

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
    `,
    IMPROVE_STATEMENT: (statement: string) => `
        Você é um especialista em avaliação educacional (INEP/SAEB). 
        Melhore o enunciado abaixo para torná-lo mais claro, objetivo e gramaticalmente correto, mantendo o sentido original.
        Original: "${statement}"
        Retorne apenas o texto melhorado.
    `,
    GENERATE_DISTRACTORS: (statement: string, correct: string) => `
        Gere 4 distratores (alternativas incorretas) plausíveis para a questão abaixo.
        Enunciado: "${statement}"
        Resposta Correta: "${correct}"
        Requisitos:
        - Os distratores devem ser baseados em erros comuns de raciocínio.
        - Devem ter tamanho e estilo similar à resposta correta.
        - Evite "todas as anteriores" ou "nenhuma das anteriores".
        Retorne um array JSON de strings.
    `,
    SUGGEST_BNCC: (statement: string) => `
        Com base no enunciado abaixo, identifique o código BNCC (Base Nacional Comum Curricular) mais adequado.
        Enunciado: "${statement}"
        Retorne apenas o código (ex: EF09HI01) e uma breve descrição do porquê.
        Formato JSON: { "code": "...", "reason": "..." }
    `,
    BATCH_GRADE: (items: string) => `
        Você é um corretor de provas especialista. Receba um lote de respostas de alunos e avalie cada uma.
        
        ITENS PARA CORREÇÃO (JSON):
        ${items}
        
        Critérios:
        1. Compare a "studentAnswer" com a "expectedAnswer".
        2. Atribua uma nota de 0 até "maxScore" baseada na precisão.
        3. Gere um feedback curto (1 frase) e construtivo.
        
        RETORNE APENAS UM ARRAY JSON com objetos contendo: { "id": "...", "score": number, "feedback": "string" }
    `,
    GENERATE_JUSTIFICATION: (statement: string, correct: string) => `
        Você é um professor especialista. Escreva uma justificativa clara, pedagógica e concisa para a resposta correta da questão abaixo.
        Enunciado: "${statement}"
        Resposta Correta: "${correct}"
        Retorne apenas o texto da justificativa, sem prefixos como "Justificativa:".
    `
};

// ... (Rest of imports and helpers remain)

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

export interface AnswerContext {
    id: string;
    question: string;
    expectedAnswer: string;
    studentAnswer: string;
    maxScore: number;
}

export interface BatchGradeResult {
    id: string;
    score: number;
    feedback: string;
}

// ... (Rest of existing interfaces)

// ... (Inside Exported Services)

export const batchGradeAnswers = async (answers: AnswerContext[]): Promise<BatchGradeResult[]> => {
    // Otimização: Se lista vazia, retorna vazio
    if (answers.length === 0) return [];

    const payload = JSON.stringify(answers.map(a => ({
        id: a.id,
        q: a.question,
        expected: a.expectedAnswer,
        answer: a.studentAnswer,
        maxContext: a.maxScore
    })));

    const prompt = PROMPTS.BATCH_GRADE(payload);

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                score: { type: Type.NUMBER },
                feedback: { type: Type.STRING }
            }
        }
    };

    // Fallback Mock
    const fallback: BatchGradeResult[] = answers.map(a => ({
        id: a.id,
        score: a.maxScore * 0.7,
        feedback: "Correção offline (Simulada). Verifique conexão."
    }));

    return callGeminiAPI<BatchGradeResult[]>(prompt, schema, fallback);
};


// --- Helper: Safe Env Access ---
// This function is critical for stability in Web Containers where 'process' is undefined.
const getApiKey = (): string | undefined => {
    // 1. Vite Environment Variable (Static access is required for build injection)
    // @ts-ignore
    const viteKey = import.meta.env?.VITE_GEMINI_API_KEY;
    if (viteKey && viteKey.trim().length > 0) {
        console.log("[GeminiService] Chave detectada via import.meta.env.VITE_GEMINI_API_KEY");
        return viteKey;
    }

    // 2. Global Window Check (Injection via Easypanel/HTML)
    const win = globalThis as any;
    if (win.VITE_GEMINI_API_KEY) {
        console.log("[GeminiService] Chave detectada via globalThis.VITE_GEMINI_API_KEY");
        return win.VITE_GEMINI_API_KEY;
    }
    if (win.GEMINI_API_KEY) {
        console.log("[GeminiService] Chave detectada via globalThis.GEMINI_API_KEY");
        return win.GEMINI_API_KEY;
    }

    // 3. Safe Process Check (Vite Defined or Node)
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env) {
            // @ts-ignore
            if (process.env.VITE_GEMINI_API_KEY) {
                console.log("[GeminiService] Chave detectada via process.env.VITE_GEMINI_API_KEY");
                return process.env.VITE_GEMINI_API_KEY;
            }
            // @ts-ignore
            if (process.env.GEMINI_API_KEY) {
                console.log("[GeminiService] Chave detectada via process.env.GEMINI_API_KEY");
                return process.env.GEMINI_API_KEY;
            }
        }
    } catch (e) {
        // Ignore reference errors
    }

    console.error("[GeminiService] Nenhuma chave de API encontrada em nenhuma fonte!");
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

    // DEBUG: Log the start of the key to verify correct injection (Safely)
    console.log(`[GeminiService] Usando chave: ${apiKey.substring(0, 7)}...`);

    try {
        // @ts-ignore - Forçando v1 para evitar erros de v1beta (404 not found)
        const ai = new GoogleGenAI({
            apiKey,
            apiVersion: 'v1'
        });

        const config: any = {};
        if (responseSchema) {
            config.responseMimeType = "application/json";
            config.responseSchema = responseSchema;
        }

        // NOVO SDK: contents deve ser um array de objetos
        const formattedContents = typeof contents === 'string'
            ? [{ role: 'user', parts: [{ text: contents }] }]
            : contents;

        console.log("[GeminiService] Enviando prompt para o modelo:", DEFAULT_MODEL);

        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: formattedContents,
            config: config
        });

        console.log("[GeminiService] Resposta bruta recebida:", response);

        // Extrair texto de forma resiliente
        let text = "";
        if (typeof response.text === 'string') {
            text = response.text;
        } else if (typeof (response as any).text === 'function') {
            text = (response as any).text();
        } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            text = response.candidates[0].content.parts[0].text;
        }

        if (!text) {
            console.error("[GeminiService] Falha ao extrair texto da resposta:", response);
            throw new Error("Não foi possível extrair o texto da resposta da IA.");
        }

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

    } catch (error: any) {
        console.error("[GeminiService] API Error:", error);
        // If it's a critical error (like safety or API key), we might want to know
        const errorMessage = error.message || "Erro desconhecido na API do Gemini";

        // Em vez de apenas o fallback, vamos logar o erro de forma que o Diagnóstico capture
        (globalThis as any).LAST_GEMINI_ERROR = errorMessage;

        return fallbackValue;
    }
}

export const listAvailableModels = async (): Promise<any[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    try {
        // @ts-ignore
        const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1' });
        const response = await ai.models.list();
        const models = (response as any).models || (Array.isArray(response) ? response : []);
        return models;
    } catch (error: any) {
        console.error("[GeminiService] Error listing models:", error);
        // Retornamos um objeto de erro para mostrar na tela
        return [{ name: `ERRO: ${error.message || 'Falha na listagem'}` }];
    }
};

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

export const improveItemStatement = async (statement: string): Promise<string> => {
    const prompt = PROMPTS.IMPROVE_STATEMENT(statement);
    return callGeminiAPI<string>(prompt, undefined, statement);
};

export const generateDistractors = async (statement: string, correct: string): Promise<string[]> => {
    const prompt = PROMPTS.GENERATE_DISTRACTORS(statement, correct);
    const schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };
    return callGeminiAPI<string[]>(prompt, schema, [
        "Distrator Automático 1 (Modo Offline)",
        "Distrator Automático 2 (Modo Offline)",
        "Distrator Automático 3 (Modo Offline)",
        "Distrator Automático 4 (Modo Offline)"
    ]);
};

export const suggestBNCC = async (statement: string): Promise<{ code: string; reason: string }> => {
    const prompt = PROMPTS.SUGGEST_BNCC(statement);
    const schema = {
        type: Type.OBJECT,
        properties: {
            code: { type: Type.STRING },
            reason: { type: Type.STRING }
        }
    };
    return callGeminiAPI<{ code: string; reason: string }>(prompt, schema, {
        code: "EF00MOCK",
        reason: "Modo offline habilitado."
    });
};

export const generateJustification = async (statement: string, correct: string): Promise<string> => {
    const prompt = PROMPTS.GENERATE_JUSTIFICATION(statement, correct);
    return callGeminiAPI<string>(prompt, undefined, "Justificativa gerada em modo offline.");
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
