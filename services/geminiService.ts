
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, DifficultyLevel, AssessmentType, VocationalProfile, BloomTaxonomy, CognitiveAxis } from "../types";

// --- Configuration ---
const DEFAULT_MODEL = 'gemini-2.5-flash';

// --- Prompts ---
const PROMPTS = {
    GENERATE_QUESTIONS: (qty: number, subject: string, type: QuestionType, difficulty: string, context: string) => `
        Você é um Especialista em Elaboração de Itens para Avaliações de Larga Escala(INEP/ SAEB / ENEM), com profundo conhecimento da BNCC e Teoria de Resposta ao Item (TRI).

        OBJETIVO: Construir um banco de itens de ALTA PRECISÃO PEDAGÓGICA, seguindo rigorosamente as fases de elaboração técnica.
        
        TEXTO DE CONTEXTO:
"${context.substring(0, 15000)}"
        
        ESTRUTURA OBRIGATÓRIA DO ITEM(Modelo INEP):
1. TEXTO - BASE(Suporte): Deve ser motivador e necessário para a resolução.Se usar imagem, descreva - a(Acessibilidade).
        2. ENUNCIADO(Comando): Deve ser uma oração incompleta ou pergunta direta, clara e livre de ambiguidades.O comando deve exigir a mobilização da habilidade cognitiva, NÃO apenas memorização.
        3. ALTERNATIVAS:
- 1 GABARITO(Resposta correta): Incontestável.
           - 4 DISTRATORES(Respostas incorretas): Devem ser plausíveis para quem não domina a habilidade(erros construtivos).NÃO USE "pegadinhas" ou absurdos óbvios.
           - HOMOGENEIDADE: Mesmo comprimento, estrutura gramatical e campo semântico.
           - OBJETIVIDADE: Se o comando pedir para identificar um termo, classificação ou objeto (ex: "Qual é o verbo..."), as alternativas devem conter APENAS o alvo (ex: "Correr"), SEM frases completas ou repetições desnecessárias.
        
        DIRETRIZES BNCC & TRI:
- Defina a Competência e Habilidade BNCC exata(ex: EF05MA03).
        - Estime os Parâmetros da TRI:
- Dificuldade(b): -3(Muito Fácil) a + 3(Muito Difícil).
           - Discriminação(a): Capacidade de diferenciar alunos proficientes(Ideal > 1.0).
           - Acerto Casual(c): Probabilidade de chute(Ideal < 0.20).
        - Classifique na Taxonomia de Bloom Revisada(Lembrar, Entender, Aplicar, Analisar, Avaliar, Criar).
        - Classifique o Eixo Cognitivo (ENEM): DOMINAR_LINGUAGENS, COMPREENDER_FENOMENOS, ENFRENTAR_SITUACOES, CONSTRUIR_ARGUMENTACAO, ELABORAR_PROPOSTAS.

    ESPECIFICAÇÕES:
- Matéria: ${subject}
- Tipo: ${type} (Se MULTIPLE_CHOICE, siga risca os distratores.Se OPEN, defina grade de correção).
- Dificuldade Alvo: ${difficulty}
        
        Retorne a resposta estritamente em JSON conforme o schema.O campo 'justification' deve explicar o gabarito E o erro de cada distrator.
    `,
    GRADE_ESSAY: (question: string, expected: string, answer: string, score: number) => `
        Você é um professor corretor experiente.Avalie a resposta do aluno para uma questão discursiva.

    Questão: "${question}"
        Gabarito Esperado / Critérios: "${expected}"
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
        Se o tipo for "TRIAGEM_TDAH" ou "TRIAGEM_AUTISMO", aja como um especialista em psicopedagogia clínica realizando uma triagem inicial(screening).
        NÃO dê diagnóstico médico fechado.Use termos como "Indicativos", "Sinais de alerta", "Compatível com".

    Tarefa:
1. Defina o arquétipo / resultado principal(ex: "Perfil Neurotípico", "Indicativo de Alta Atenção", "Sinais de Hiperatividade").
        2. Escreva um relatório detalhado.Para triagens clínicas, seja formal, acolhedor e recomende avaliação profissional se houver muitos sinais.
        3. Liste 3 pontos fortes / características marcantes.
        4. Liste 3 pontos de desenvolvimento / atenção.
    `,
    TUTOR_SYSTEM: (name: string, context: string, forbidden: string[]) => `
System: Você é o Corujão, um tutor de IA amigável, sábio e encorajador para estudantes.
        Nome do Aluno: ${name}
        Contexto do Aluno: ${context}
        
        REGRAS:
1. Seja conciso, didático e use emojis ocasionalmente 🦉.
2. NÃO forneça respostas diretas para perguntas de prova.Ajude a raciocinar.
        3. Tópicos PROIBIDOS(Em prova agora): ${forbidden.join(', ')}. Se o aluno perguntar sobre isso, recuse educadamente e deseje boa sorte na prova.
    `,
    IMPROVE_STATEMENT: (statement: string) => `
        Você é um especialista em avaliação educacional(INEP / SAEB). 
        Melhore o enunciado abaixo para torná - lo mais claro, objetivo e gramaticalmente correto, mantendo o sentido original.
    Original: "${statement}"
        Retorne apenas o texto melhorado.
    `,
    GENERATE_DISTRACTORS: (statement: string, correct: string) => `
        Gere 4 distratores(alternativas incorretas) plausíveis para a questão abaixo.
    Enunciado: "${statement}"
        Resposta Correta: "${correct}"
Requisitos:
- Os distratores devem ser baseados em erros comuns de raciocínio.
        - Devem ter tamanho e estilo similar à resposta correta.
        - Evite "todas as anteriores" ou "nenhuma das anteriores".
        Retorne um array JSON de strings.
    `,
    SUGGEST_BNCC: (statement: string) => `
        Com base no enunciado abaixo, identifique o código BNCC(Base Nacional Comum Curricular) mais adequado.
    Enunciado: "${statement}"
        Retorne apenas o código(ex: EF09HI01) e uma breve descrição do porquê.
        Formato JSON: { "code": "...", "reason": "..." }
`,
    CLONE_AND_VARIATE: (item: string) => `
        Você é um Professor Especialista em Avaliação. 
        Sua tarefa é criar uma VARIAÇÃO de uma questão existente para evitar colas.
        
        QUESTÃO ORIGINAL: ${item}

REGRAS:
1. Mantenha a mesma HABILIDADE BNCC e DIFICULDADE.
        2. Mude o CENÁRIO, os VALORES NUMÉRICOS(se houver) e os NOMES.
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
        - TDAH: Enunciados curtos, pontos - chave em negrito, uma informação por vez.
        - VISUAL: Descrições detalhadas de imagens(Alt text), redundância sonora sugerida.
        - GERAL: Linguagem simples(Easy - to - read), sem ambiguidades.
        
        Retorne em JSON adicionando campos 'isAccessible: true' e 'accessibilityInstructions'.
    `,
    BATCH_GRADE: (items: string) => `
        Você é um corretor de provas especialista.Receba um lote de respostas de alunos e avalie cada uma.
        
        ITENS PARA CORREÇÃO(JSON):
        ${items}

Critérios:
1. Compare a "studentAnswer" com a "expectedAnswer".
        2. Atribua uma nota de 0 até "maxScore" baseada na precisão.
        3. Gere um feedback curto(1 frase) e construtivo.
        
        RETORNE APENAS UM ARRAY JSON com objetos contendo: { "id": "...", "score": number, "feedback": "string" }
`,
    GENERATE_JUSTIFICATION: (statement: string, correct: string) => `
        Você é um professor especialista.Escreva uma justificativa clara, pedagógica e concisa para a resposta correta da questão abaixo.
    Enunciado: "${statement}"
        Resposta Correta: "${correct}"
        Retorne apenas o texto da justificativa, sem prefixos como "Justificativa:".
    `,
    EXTRACT_ITEM_FROM_IMAGE: () => `
        Você é um Assistente de Digitalização de Materiais Didáticos.sua tarefa é ler a imagem fornecida(foto de livro ou apostila) e extrair uma questão de avaliação completa.

    REQUISITOS:
1. ENUNCIADO: Extraia o texto completo, incluindo qualquer texto - base ou comando.
        2. ALTERNATIVAS: Identifique as opções (A a E) e qual é a correta.
        3. TIPO: Identifique se é MULTIPLE_CHOICE ou ESSAY.
        4. JUSTIFICATIVA: Crie uma breve explicação pedagógica se não houver uma.
        5. DIFICULDADE: Estime como FACIL, MEDIO ou DIFICIL.
        
        Retorne estritamente em JSON conforme o schema de GeneratedQuestion.
    `,
    AUDIT_ITEM: (itemJson: string) => `
        Você é um Analista Pedagógico Especialista em Avaliação(INEP / BNCC). 
        Sua tarefa é auditar a questão abaixo e fornecer um relatório técnico de qualidade.
        
        QUESTÃO PARA AUDITORIA:
        ${itemJson}
        
        CRITÉRIOS DE ANÁLISE:
1. INEDITISMO: Verifique se esta questão é inédita.Se você reconhecê - la como uma questão de vestibular conhecido(ENEM, FUVEST, etc.), você DEVE penalizar o score e sugerir uma variação.
        2. ENUNCIADO: Está claro ? Contém comandos ambíguos ? Segue o padrão INEP(Texto - base -> Comando) ?
    3. ALTERNATIVAS: São homogêneas ? Os distratores são baseados em erros comuns ou são "absurdos" ?
        4. BNCC: O código indicado é coerente com a habilidade exigida ?
            5. BLOOM: Qual o nível na Taxonomia de Bloom(Lembrar, Entender, Aplicar, Analisar, Avaliar, Criar) ?
            6. EIXO COGNITIVO: Qual o Eixo Cognitivo (ENEM) principal exigido?

                RETORNO :
                - Score Geral(0 a 100).
        - Lista de Pontos Positivos.
        - Lista de Melhorias Sugeridas.
        - Veredito da BNCC(Correto ou Sugestão de troca).
        
        Retorne estritamente em JSON:
{
    "score": number,
        "pros": string[],
            "improvements": string[],
                "bnccVerdict": string,
                    "bnccVerdict": string,
                    "bloomLevel": string,
                    "cognitiveAxis": string
}
`,
    REVIEW_EXAM: (itemsJson: string) => `
        Você é um Auditor Sênior de Avaliações Educacionais em Larga Escala. 
        Sua tarefa é realizar uma REVISÃO GERAL(8 Estágios) em uma prova completa.
        
        ITENS DA PROVA(JSON):
        ${itemsJson}
        
        ESTÁGIOS DE AUDITORIA:
1. ESTRUTURAL: Verifique duplicação de temas, contradições entre questões e clareza técnica.
        2. BNCC / SAEB: Valide se a distribuição de habilidades está equilibrada.
        3. ACESSIBILIDADE: Identifique barreiras para PCD / Neurodivergentes(TEA / TDAH / VISUAL).
        4. TEXTUAIS: Melhore a fluidez, gramática e elimine ambiguidades(Polimento).
        5. ANTI - COLA: Sugira variações para itens críticos.
        6. TRI: Reequilibre os parâmetros de dificuldade(b), discriminação(a) e acerto casual(c).

    RETORNO:
- Relatório de cada estágio.
        - Versão "Polida" dos itens(se houver melhoria textual).
        - Sugestões de variantes.
        
        Retorne em JSON:
{
    "stages": {
        "structural": { "status": "OK" | "WARN", "feedback": "..." },
        "pedagogical": { "status": "OK" | "WARN", "feedback": "..." },
        "accessibility": { "status": "OK" | "WARN", "feedback": "..." },
        "antiCheat": { "status": "OK" | "WARN", "feedback": "..." }
    },
    "overallScore": number,
        "polishedItems": any[],
            "variantsSuggested": any[]
}
`,
    GENERATE_SYLLABUS: (subject: string, grade: string, topic: string) => `
        Atue como Coordenador Pedagógico alinhado à BNCC(Brasil).
        Crie um Plano de Aula(Syllabus) estruturado para:
Disciplina: ${subject}
Ano / Série: ${grade}
        Tópico Central: ${topic}

REQUISITOS:
1. Identifique as Habilidades BNCC(Códigos) pertinentes.
        2. Estruture em 4 Semanas(Módulos).
        3. Para cada semana, defina: Tema, Objetivo e 1 Atividade Prática sugestiva.
        
        Retorne JSON: { "bnccCodes": string[], "overview": string, "weeks": [{ "week": number, "theme": string, "objective": string, "activity": string }] }
`,
    GENERATE_TEXT_ASSET: (theme: string, genre: string) => `
        Atue como um Autor de Material Didático Profissional.
        Escreva um TEXTO ORIGINAL e INÉDITO para ser usado como "Texto-Base" em uma prova.

    Tema: ${theme}
        Gênero Textual: ${genre} (ex: Notícia, Poema, Crônica, Texto Científico).

Diretrizes:
1. O texto deve ser rico em vocabulário e adequado para avaliação de interpretação.
        2. Deve ser totalmente livre de plágio(Copyright Free).
        3. Tamanho: Entre 3 a 5 parágrafos(aprox. 300 palavras).
        4. Inclua um Título criativo e uma "Fonte Fictícia" realista no final.
        
        Retorne JSON: { "title": string, "body": string, "source": string, "readingTime": string }
`,
    GENERATE_ESSAY: (subject: string, theme: string) => `
        Você é um Professor Especialista em Redação e Linguagens.
        Crie uma PROPOSTA DE REDAÇÃO completa e inédita.

    TEMA: ${theme}
ÁREA: ${subject}

REQUISITOS:
1. TEXTO MOTIVADOR: Crie um texto base(3 - 4 parágrafos) que forneça contexto e reflexão sobre o tema.
        2. COMANDO: Escreva a instrução da redação(ex: "Desenvolva um texto dissertativo-argumentativo...").
        3. CRITÉRIOS DE AVALIAÇÃO: Defina 5 competências(ex: Domínio da norma culta, Proposta de intervenção) e o que se espera em cada uma.
        4. BNCC: Indique o código BNCC relacionado à produção de texto para esta série.
        
        Retorne JSON: {
    "title": string,
        "motivationalText": string,
            "instruction": string,
                "criteria": [{ "name": string, "description": string, "maxPoints": number }],
                    "bnccCode": string
}
`,
    GENERATE_MULTIMODAL_DESCRIPTION: (context: string) => `
        Analise o contexto pedagógico abaixo e sugira um RECURSO VISUAL(Gráfico, Mapa, Imagem ou Infográfico) que enriqueceria a questão.

    CONTEXTO: "${context}"

TAREFA:
1. Descreva DETALHADAMENTE o que deve conter nessa imagem(ex: "Um gráfico de barras mostrando a evolução do PIB...").
        2. Explique como esse recurso ajuda a resolver a questão.
        3. Forneça o "Prompt de Geração" que o professor poderia usar em uma IA de imagem(DALL - E / Midjourney).
        
        Retorne JSON: { "visualType": string, "description": string, "pedagogicalValue": string, "imageGeneratorPrompt": string }
`,
    VOCATIONAL_ANALYSIS: (grades: string, assessments: string, interests: string) => `
        Você é um Orientador Vocacional de Alto Nível e Especialista em "Design de Vida"(Life Design), inspirado na metodologia "Comece pelo Porquê" de Simon Sinek e no conceito de IKIGAI.
        
        DADOS DO ALUNO:
- Desempenho Acadêmico(O QUE faz bem): "${grades}"
    - Perfil Comportamental(COMO age): "${assessments}"
        - Interesses Pessoais(O QUE ama): "${interests}"

TAREFA:
1. Golden Circle(Simon Sinek): Identifique o "PORQUÊ"(Causa / Crença) do aluno.O que motiva ele profundamente ?
    2. Analise os dados para encontrar o "Ponto Doce" do Ikigai.
        3. Escreva uma "Declaração de Propósito"(Why Statement) impactante.Ex: "Inspirar pessoas a superar limites através da tecnologia."
4. Sugira 3 Carreiras Modernas alinhadas a esse PORQUÊ.
        
        Retorne estritamente em JSON conforme o schema de VocationalProfile.O campo 'purposeStatement' deve ser o 'Manifesto do Porquê'.
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

export interface GeneratedEssay {
    title: string;
    motivationalText: string;
    instruction: string;
    criteria: { name: string; description: string; maxPoints: number }[];
    bnccCode: string;
}

export interface VisualSuggestion {
    visualType: string;
    description: string;
    pedagogicalValue: string;
    imageGeneratorPrompt: string;
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

    let attempt = 0;
    const maxRetries = 3;
    const baseDelay = 1000;

    while (attempt < maxRetries) {
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
            console.error(`[GeminiService] Tentativa ${attempt + 1}/${maxRetries} falhou:`, error.message);

            const isRetryable = error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('Overloaded');

            if (isRetryable && attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`[GeminiService] Aguardando ${delay}ms antes de tentar novamente...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
                continue;
            }

            // Se não for retryable ou acabou as tentativas, loga e retorna fallback
            (globalThis as any).LAST_GEMINI_ERROR = error.message || "Erro desconhecido na API do Gemini";
            return fallbackValue;
        }
    }

    return fallbackValue;
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
                        bloomTaxonomy: { type: Type.STRING, enum: ["LEMBRAR", "ENTENDER", "APLICAR", "ANALISAR", "AVALIAR", "CRIAR"] },
                        cognitiveAxis: { type: Type.STRING, enum: ["DOMINAR_LINGUAGENS", "COMPREENDER_FENOMENOS", "ENFRENTAR_SITUACOES", "CONSTRUIR_ARGUMENTACAO", "ELABORAR_PROPOSTAS"] }
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

/**
 * OCR Inteligente: Converte imagem em questão estruturada
 */
export async function extractItemFromImage(base64Image: string): Promise<GeneratedQuestion | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const contents = [
            {
                role: 'user',
                parts: [
                    { text: (PROMPTS as any).EXTRACT_ITEM_FROM_IMAGE() },
                    {
                        inlineData: {
                            data: base64Image.split(',')[1],
                            mimeType: "image/jpeg"
                        }
                    }
                ]
            }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: contents,
            config: { responseMimeType: "application/json" }
        });

        let text = "";
        if (typeof (response as any).text === 'function') {
            text = (response as any).text();
        } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            text = response.candidates[0].content.parts[0].text;
        }

        const cleanJson = text.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleanJson) as GeneratedQuestion;
    } catch (error) {
        console.error("AI Error (OCR extraction):", error);
        return null;
    }
}

/**
 * Auditoria Pedagógica: Analisa a qualidade técnica e pedagógica do item
 */
export async function auditPedagogicalItem(itemJson: string): Promise<{
    score: number;
    pros: string[];
    improvements: string[];
    bnccVerdict: string;
    bloomLevel: string;
} | null> {
    const prompt = (PROMPTS as any).AUDIT_ITEM(itemJson);
    const schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            bnccVerdict: { type: Type.STRING },
            bloomLevel: { type: Type.STRING }
        },
        required: ["score", "pros", "improvements", "bnccVerdict", "bloomLevel"]
    };

    const fallback = {
        score: 70,
        pros: ["Análise offline: Verifique conexão"],
        improvements: ["Não foi possível realizar auditoria profunda em modo offline."],
        bnccVerdict: "Indefinido",
        bloomLevel: "Não definido"
    };

    return callGeminiAPI<any>(prompt, schema, fallback);
}

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
            isAccessible: { type: Type.BOOLEAN },
            accessibilityInstructions: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            bnccCode: { type: Type.STRING }
        },
        required: ["statement", "alternatives", "isAccessible", "accessibilityInstructions"]
    };
    return callGeminiAPI<any>(prompt, schema, { ...JSON.parse(itemJson), isAccessible: true, accessibilityInstructions: "Modo Offline" });
}

// --- NEW FEATURES: AI CONTENT PIPELINE ---

export interface Syllabus {
    bnccCodes: string[];
    overview: string;
    weeks: {
        week: number;
        theme: string;
        objective: string;
        activity: string;
    }[];
}

export interface TextAsset {
    title: string;
    body: string;
    source: string;
    readingTime: string;
}

export const generateSyllabus = async (subject: string, grade: string, topic: string): Promise<Syllabus> => {
    const prompt = (PROMPTS as any).GENERATE_SYLLABUS(subject, grade, topic);
    const schema = {
        type: Type.OBJECT,
        properties: {
            bnccCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
            overview: { type: Type.STRING },
            weeks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        week: { type: Type.NUMBER },
                        theme: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        activity: { type: Type.STRING }
                    }
                }
            }
        },
        required: ["bnccCodes", "weeks"]
    };

    const fallback: Syllabus = {
        bnccCodes: ["EF_OFFLINE"],
        overview: "Plano gerado localmente (Offline)",
        weeks: [
            { week: 1, theme: "Introdução (Offline)", objective: "Revisar conexão", activity: "Leitura" },
            { week: 2, theme: "Desenvolvimento (Offline)", objective: "Revisar conexão", activity: "Exercícios" }
        ]
    };

    return callGeminiAPI<Syllabus>(prompt, schema, fallback);
};

export const generateTextAsset = async (theme: string, genre: string): Promise<TextAsset> => {
    const prompt = (PROMPTS as any).GENERATE_TEXT_ASSET(theme, genre);
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
            source: { type: Type.STRING },
            readingTime: { type: Type.STRING }
        },
        required: ["title", "body"]
    };

    const fallback: TextAsset = {
        title: "Texto Exemplo (Offline)",
        body: "Lorem ipsum dolor sit amet. Este é um texto simulado pois a IA está offline.",
        source: "Gerador Interno",
        readingTime: "1 min"
    };

    return callGeminiAPI<TextAsset>(prompt, schema, fallback);
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
export const reviewExamAdvanced = async (items: any[]): Promise<any> => {
    const prompt = PROMPTS.REVIEW_EXAM(JSON.stringify(items));
    const schema = {
        type: Type.OBJECT,
        properties: {
            stages: {
                type: Type.OBJECT,
                properties: {
                    structural: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } } },
                    pedagogical: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } } },
                    accessibility: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } } },
                    antiCheat: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, feedback: { type: Type.STRING } } }
                }
            },
            overallScore: { type: Type.NUMBER },
            polishedItems: { type: Type.ARRAY, items: { type: Type.OBJECT } },
            variantsSuggested: { type: Type.ARRAY, items: { type: Type.OBJECT } }
        }
    };

    const fallback = {
        stages: {
            structural: { status: "OK", feedback: "Simulação offline: Estrutura parece consistente." },
            pedagogical: { status: "OK", feedback: "Simulação offline: Alinhamento BNCC ok." },
            accessibility: { status: "OK", feedback: "Simulação offline: Sem barreiras detectadas." },
            antiCheat: { status: "OK", feedback: "Simulação offline: Baixo risco de cola." }
        },
        overallScore: 90,
        polishedItems: items,
        variantsSuggested: []
    };

    return callGeminiAPI<any>(prompt, schema, fallback);
};

// --- Phase 9: Pedagogical Report Generation ---
export const generatePedagogicalReport = async (
    studentName: string,
    examTitle: string,
    totalScore: number,
    maxScore: number,
    correctCount: number,
    totalCount: number,
    subjectBreakdown: { subject: string; correct: number; total: number }[]
): Promise<string> => {
    const percentage = Math.round((totalScore / maxScore) * 100);
    const subjectSummary = subjectBreakdown
        .map(s => `${s.subject}: ${s.correct}/${s.total} acertos`)
        .join(', ');

    const prompt = `
        Você é um Tutor Pedagógico IA especializado em feedback construtivo e motivacional.
        
        CONTEXTO:
        - Aluno: ${studentName}
        - Prova: ${examTitle}
        - Nota Final: ${totalScore.toFixed(1)}/${maxScore} (${percentage}%)
        - Acertos: ${correctCount}/${totalCount} questões
        - Desempenho por Matéria: ${subjectSummary}
        
        TAREFA:
        Gere um feedback pedagógico personalizado, motivador e estruturado para o aluno usando Markdown.
        O feedback deve ser dividido EXATAMENTE nestas 3 seções:
        
        ### ✨ Seus Pontos Fortes
        (Destaque as matérias ou temas onde o aluno brilhou)
        
        ### 🎯 Onde Melhorar
        (Identifique de forma construtiva os pontos de atenção baseados nos erros)
        
        ### 🚀 Plano de Voo
        (Dê 2 ou 3 dicas práticas de estudo para os próximos dias)
        
        REGRAS:
        - Use um tom encorajador e positivo.
        - Mantenha o texto conciso e direto ao ponto.
        - Use negrito e listas para facilitar a leitura.
        - Retorne APENAS o texto formatado em Markdown, sem blocos de código (fences) ou introduções.
    `;

    const fallback = `Parabéns, ${studentName}! Você obteve ${percentage}% de aproveitamento. ${percentage >= 70
        ? 'Continue assim! Seu desempenho está excelente.'
        : 'Identifique os tópicos que você errou e revise-os com atenção. O Corujão está aqui para ajudar!'
        }`;

    try {
        const apiKey = getApiKey();
        if (!apiKey) return fallback;

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        let text = "";
        if (typeof response.text === 'string') {
            text = response.text;
        } else if (typeof (response as any).text === 'function') {
            text = (response as any).text();
        } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            text = response.candidates[0].content.parts[0].text;
        }

        return text.trim() || fallback;
    } catch (error) {
        console.error('[GeminiService] Error generating pedagogical report:', error);
        return fallback;
    }
};

/**
 * Gera uma proposta de redação completa com texto motivador e critérios.
 */
export const generateEssayQuestion = async (
    subject: string,
    theme: string
): Promise<GeneratedEssay> => {
    const prompt = PROMPTS.GENERATE_ESSAY(subject, theme);
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            motivationalText: { type: Type.STRING },
            instruction: { type: Type.STRING },
            criteria: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        maxPoints: { type: Type.NUMBER }
                    }
                }
            },
            bnccCode: { type: Type.STRING }
        },
        required: ["title", "motivationalText", "instruction", "criteria"]
    };

    return callGeminiAPI<GeneratedEssay>(prompt, schema, {
        title: "Tema de Redação Simulado",
        motivationalText: "Texto motivador offline...",
        instruction: "Instrução offline...",
        criteria: [{ name: "Competência 1", description: "Descrição...", maxPoints: 200 }],
        bnccCode: "OFFLINE"
    });
};

/**
 * Sugere um recurso visual (gráfico, mapa, etc) para uma questão.
 */
export const generateVisualSuggestion = async (
    context: string
): Promise<VisualSuggestion> => {
    const prompt = PROMPTS.GENERATE_MULTIMODAL_DESCRIPTION(context);
    const schema = {
        type: Type.OBJECT,
        properties: {
            visualType: { type: Type.STRING },
            description: { type: Type.STRING },
            pedagogicalValue: { type: Type.STRING },
            imageGeneratorPrompt: { type: Type.STRING }
        },
        required: ["visualType", "description", "imageGeneratorPrompt"]
    };

    return callGeminiAPI<VisualSuggestion>(prompt, schema, {
        visualType: "Gráfico",
        description: "Descrição offline...",
        pedagogicalValue: "Valor offline...",
        imageGeneratorPrompt: "Prompt offline..."
    });
};

/**
 * Bússola Vocacional: Gera análise de carreira e Ikigai (Start with Why)
 */
export async function generateVocationalAnalysis(
    gradesSummary: string,
    assessmentResults: string,
    studentInterests: string
): Promise<VocationalProfile | null> {
    const prompt = (PROMPTS as any).VOCATIONAL_ANALYSIS(gradesSummary, assessmentResults, studentInterests);

    // Schema must match VocationalProfile exactly
    const schema = {
        type: Type.OBJECT,
        properties: {
            discArchetype: { type: Type.STRING },
            dominantIntelligences: { type: Type.ARRAY, items: { type: Type.STRING } },
            purposeStatement: { type: Type.STRING },
            ikigai: {
                type: Type.OBJECT,
                properties: {
                    love: { type: Type.ARRAY, items: { type: Type.STRING } },
                    goodAt: { type: Type.ARRAY, items: { type: Type.STRING } },
                    paidFor: { type: Type.ARRAY, items: { type: Type.STRING } },
                    needs: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            },
            careerMatches: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        matchScore: { type: Type.NUMBER },
                        description: { type: Type.STRING },
                        salaryRange: { type: Type.STRING },
                        requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        whyThisFits: { type: Type.STRING },
                        educationalPath: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        },
        required: ["discArchetype", "ikigai", "careerMatches", "purposeStatement"]
    };

    const fallback: VocationalProfile = {
        studentId: "demo",
        generatedAt: new Date().toISOString(),
        discArchetype: "Explorador Criativo (Offline)",
        dominantIntelligences: ["Lógico-Matemática"],
        purposeStatement: "Inspirar a próxima geração de solucionadores de problemas.",
        ikigai: {
            love: ["Tecnologia"], goodAt: ["Lógica"], paidFor: ["Engenharia"], needs: ["Inovação"]
        },
        careerMatches: [
            {
                id: "1", title: "Offline Demo Career", matchScore: 100,
                description: "Modo offline ativado.", salaryRange: "N/A",
                requiredSkills: ["N/A"], whyThisFits: "System Offline", educationalPath: []
            }
        ]
    };

    const result = await callGeminiAPI<any>(prompt, schema, fallback);

    return {
        ...result,
        studentId: "generated",
        generatedAt: new Date().toISOString()
    };
}
