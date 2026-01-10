
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, DifficultyLevel, AssessmentType } from "../types";

// --- Configuration ---
const DEFAULT_MODEL = 'gemini-2.5-flash';

// --- Prompts ---
const PROMPTS = {
    GENERATE_QUESTIONS: (qty: number, subject: string, type: QuestionType, difficulty: string, context: string) => `
        Você é um Professor Especialista em Avaliação Educacional, seguindo rigorosamente os manuais do INEP (SAEB/ENEM) e as diretrizes da BNCC.
        
        OBJETIVO: Gerar exatamente ${qty} itens de avaliação de ALTA QUALIDADE baseados no texto de contexto abaixo.
        
        TEXTO DE CONTEXTO:
        "${context.substring(0, 15000)}"
        
        DIRETRIZES TÉCNICAS (PADRÃO INEP):
        1. ENUNCIADO: Deve ser claro, objetivo e conter todos os elementos necessários para a resolução. Use um "Texto-Base" se necessário. Evite termos negativos ("Exceto", "Não").
        2. ALTERNATIVAS (Para MULTIPLE_CHOICE): Sempre gere exatamente 5 alternativas (A, B, C, D, E).
        3. HOMOGENEIDADE: Todas as alternativas devem ter extensão e estrutura gramatical similares.
        4. DISTRATORES: Não devem ser "pegadinhas". Devem representar erros de raciocínio lógico ou interpretações parciais plausíveis.
        5. JUSTIFICATIVA: Obrigatória para cada item. Explique por que a correta é a correta e qual o erro pedagógico por trás dos distratores.
        6. TRI (Teoria de Resposta ao Item): Estime o grau de dificuldade (Fácil, Médio, Difícil) e a complexidade cognitiva (Taxonomia de Bloom).
        
        ESPECIFICAÇÕES:
        - Matéria: ${subject}
        - Tipo: ${type}
        - Dificuldade Alvo: ${difficulty}
        
        Retorne a resposta estritamente em JSON conforme o schema.
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
    CLONE_AND_VARIATE: (item: string) => `
        Você é um Professor Especialista em Avaliação. 
        Sua tarefa é criar uma VARIAÇÃO de uma questão existente para evitar colas.
        
        QUESTÃO ORIGINAL: ${item}
        
        REGRAS:
        1. Mantenha a mesma HABILIDADE BNCC e DIFICULDADE.
        2. Mude o CENÁRIO, os VALORES NUMÉRICOS (se houver) e os NOMES.
        3. Mude a ordem e o conteúdo das alternativas, mantendo a coerência.
        4. O objetivo é que quem resolveu a orignal não consiga simplesmente "decorar" a resposta da nova.
        
        Retorne em JSON seguindo o schema de GeneratedQuestion.
    `,
    ADAPT_FOR_ACCESSIBILITY: (item: string, profile: 'TEA' | 'TDAH' | 'VISUAL' | 'GERAL') => `
        Você é um Especialista em Educação Especial e Inclusiva. 
        Adapte a questão abaixo para o perfil: ${profile}.
        
        QUESTÃO ORIGINAL: ${item}
        
        DIRETRIZES:
        - TEA: Linguagem literal, sem metáforas, comandos diretos, suporte visual descrito.
        - TDAH: Enunciados curtos, pontos-chave em negrito, uma informação por vez.
        - VISUAL: Descrições detalhadas de imagens (Alt text), redundância sonora sugerida.
        - GERAL: Linguagem simples (Easy-to-read), sem ambiguidades.
        
        Retorne em JSON adicionando campos 'isAccessible: true' e 'accessibilityInstructions'.
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
// ... Interface atualizada com suporte a TRI
interface GeneratedQuestion {
    statement: string;
    alternatives: { text: string; isCorrect: boolean }[];
    justification: string;
    difficulty: string;
    bnccCode?: string;
    triParams?: {
        difficulty: number; // -3 a +3
        discrimination: number; // 0 a 2
        guessing: number; // 0 a 0.25
        bloomTaxonomy: string;
    };
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
        const ai = new GoogleGenAI({
            apiKey
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

        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: formattedContents,
            config: config
        });

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
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.list();
        console.log("[GeminiService] Resposta bruta de listModels:", response);

        // Acesso ultra-resiliente
        let models: any[] = [];
        if (Array.isArray(response)) {
            models = response;
        } else if (response && typeof response === 'object') {
            models = (response as any).models || (response as any).candidates || Object.values(response).find(v => Array.isArray(v)) || [];
        }

        return models;
    } catch (error: any) {
        console.error("[GeminiService] Error listing models:", error);
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
                statement: { type: Type.STRING, description: "O enunciado completo da questão" },
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
                justification: { type: Type.STRING, description: "Justificativa pedagógica detalhada do gabarito e distratores" },
                difficulty: { type: Type.STRING, enum: ["FACIL", "MEDIO", "DIFICIL"] },
                bnccCode: { type: Type.STRING, description: "Código BNCC (ex: EF01MA01)" },
                triParams: {
                    type: Type.OBJECT,
                    properties: {
                        difficulty: { type: Type.NUMBER },
                        discrimination: { type: Type.NUMBER },
                        guessing: { type: Type.NUMBER },
                        bloomTaxonomy: { type: Type.STRING }
                    }
                }
            },
            required: ["statement", "alternatives", "justification", "difficulty"]
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

export const variateItem = async (itemJson: string): Promise<GeneratedQuestion> => {
    const prompt = PROMPTS.CLONE_AND_VARIATE(itemJson);
    const schema = {
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
            bnccCode: { type: Type.STRING },
            triParams: {
                type: Type.OBJECT,
                properties: {
                    difficulty: { type: Type.NUMBER },
                    discrimination: { type: Type.NUMBER },
                    guessing: { type: Type.NUMBER },
                    bloomTaxonomy: { type: Type.STRING }
                }
            }
        },
        required: ["statement", "alternatives", "justification"]
    };
    return callGeminiAPI<GeneratedQuestion>(prompt, schema, JSON.parse(itemJson));
};

export const adaptItemForAccessibility = async (itemJson: string, profile: 'TEA' | 'TDAH' | 'VISUAL' | 'GERAL'): Promise<GeneratedQuestion & { isAccessible: boolean; accessibilityInstructions: string }> => {
    const prompt = PROMPTS.ADAPT_FOR_ACCESSIBILITY(itemJson, profile);
    const schema = {
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
            isAccessible: { type: Type.BOOLEAN },
            accessibilityInstructions: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            bnccCode: { type: Type.STRING }
        },
        required: ["statement", "alternatives", "isAccessible", "accessibilityInstructions"]
    };
    return callGeminiAPI<any>(prompt, schema, { ...JSON.parse(itemJson), isAccessible: true, accessibilityInstructions: "Modo Offline" });
};

// --- Internal Mock Generator (Fallback) ---
const mockGenerate = (qty: number, type: QuestionType, diff: DifficultyLevel): GeneratedQuestion[] => {
    return Array.from({ length: qty }).map((_, i) => ({
        statement: `(Mock AI) Questão ${i + 1} gerada localmente sobre o tema (Modo Offline). Dificuldade: ${diff}.`,
        alternatives: [
            { text: "Alternativa A (Correta)", isCorrect: true },
            { text: "Alternativa B (Distrator)", isCorrect: false },
            { text: "Alternativa C (Distrator)", isCorrect: false },
            { text: "Alternativa D (Distrator)", isCorrect: false },
            { text: "Alternativa E (Distrator)", isCorrect: false },
        ],
        justification: "Esta é a justificativa padrão para o modo offline, detalhando por que a A está correta e por que as outras opções servem como distratores pedagógicos.",
        difficulty: diff,
        bnccCode: "EF00MOCK",
        triParams: {
            difficulty: diff === 'DIFICIL' ? 2 : diff === 'MEDIO' ? 0 : -2,
            discrimination: 1.5,
            guessing: 0.2,
            bloomTaxonomy: "Compreensão"
        }
    }));
};
