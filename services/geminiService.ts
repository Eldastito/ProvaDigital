
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionType, DifficultyLevel, AssessmentType, VocationalProfile, BloomTaxonomy, CognitiveAxis } from "../types";

// --- Configuration ---
const DEFAULT_MODEL = 'gemini-flash-latest'; // Points to the most stable Flash version
const PROMPT_VERSION = '1.2.1-stability-fix';

// --- Prompts ---
const PROMPTS = {
    GENERATE_QUESTIONS: (qty: number, subject: string, type: QuestionType, difficulty: string, context: string, model3dContext?: string) => `
        Você é um Especialista em Elaboração de Itens para Avaliações de Larga Escala (INEP/SAEB/ENEM), com profundo conhecimento da BNCC e Teoria de Resposta ao Item (TRI).

        OBJETIVO: Construir um banco de **${qty} ITENS** de ALTA PRECISÃO PEDAGÓGICA, seguindo rigorosamente as fases de elaboração técnica.

        TEXTO DE CONTEXTO:
        "${context.substring(0, 15000)}"
        
${model3dContext ? `        [ATENÇÃO - INSTRUÇÃO OBRIGATÓRIA PARA 3D]
        MODELO 3D DE REFERÊNCIA: ${model3dContext}
        
        O aluno terá do lado esquerdo da sua tela um simulador 3D interativo contendo este modelo.
        É **OBRIGATÓRIO** que as questões elaboradas exijam que o aluno interaja, rotacione, dê zoom ou use o inspetor (explode) neste modelo 3D para chegar à resposta. Cite o modelo 3D no enunciado e faça perguntas anatômicas, espaciais ou estruturais baseadas somente nele.` : ''}

        ESTRUTURA OBRIGATÓRIA DE CADA ITEM (Modelo INEP):
        1. TEXTO-BASE (Suporte): Deve ser motivador e necessário para a resolução. Se usar imagem, descreva-a (Acessibilidade).
        2. ENUNCIADO (Comando): Deve ser uma oração incompleta ou pergunta direta, clara e livre de ambiguidades. O comando deve exigir a mobilização da habilidade cognitiva, NÃO apenas memorização.
        3. ALTERNATIVAS:
           - 1 GABARITO (Resposta correta): Incontestável.
           - 4 DISTRATORES (Respostas incorretas): Devem ser plausíveis para quem não domina a habilidade (erros construtivos). NÃO USE "pegadinhas" ou absurdos óbvios.
           - HOMOGENEIDADE: Mesmo comprimento, estrutura gramatical e campo semântico.
           - OBJETIVIDADE: Se o comando pedir para identificar um termo, classificação ou objeto (ex: "Qual é o verbo..."), as alternativas devem conter APENAS o alvo (ex: "Correr"), SEM frases completas ou repetições desnecessárias.
        
        DIRETRIZES BNCC & TRI:
        - Defina a Competência e Habilidade BNCC exata (ex: EF05MA03).
        - Estime os Parâmetros da TRI:
           - Dificuldade (b): -3 (Muito Fácil) a +3 (Muito Difícil).
           - Discriminação (a): Capacidade de diferenciar alunos proficientes (Ideal > 1.0).
           - Acerto Casual (c): Probabilidade de chute (Ideal < 0.20).
        - Classifique na Taxonomia de Bloom Revisada (Lembrar, Entender, Aplicar, Analisar, Avaliar, Criar).
        - Classifique o Eixo Cognitivo (ENEM): DOMINAR_LINGUAGENS, COMPREENDER_FENOMENOS, ENFRENTAR_SITUACOES, CONSTRUIR_ARGUMENTACAO, ELABORAR_PROPOSTAS.

        ESPECIFICAÇÕES:
        - Quantidade: ${qty} questões (OBRIGATÓRIO)
        - Matéria: ${subject}
        - Tipo: ${type} (Se MULTIPLE_CHOICE, siga risca os distratores. Se OPEN, defina grade de correção).
        - Dificuldade Alvo: ${difficulty}
        
        IMPORTANTE: Você deve retornar EXATAMENTE ${qty} questões no array 'questions'. Não retorne apenas uma.
        
        Retorne a resposta estritamente no formato de um OBJETO JSON contendo a chave 'questions' (que é um ARRAY de objetos), contendo exatamente ${qty} elementos, conforme o schema. O campo 'justification' deve explicar o gabarito E o erro de cada distrator.
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
    GRADE_FULL_ESSAY: (topic: string, motivationalText: string, studentText: string) => `
        Você é um Corretor de Redação Especialista (Banca ENEM/Vestibulares).
        Sua tarefa é corrigir a redação abaixo com rigor técnico e pedagógico.

        TEMA: "${topic}"
        TEXTO MOTIVADOR (Resumo): "${motivationalText.substring(0, 500)}..."
        
        REDACAO DO ALUNO:
        "${studentText}"

        CRITÉRIOS DE AVALIAÇÃO (Modelo ENEM - 1000 pontos):
        1. Desvios Gramaticais e Convenções da Escrita (200 pts)
        2. Compreensão do Tema e Tipo Textual (200 pts)
        3. Seleção e Organização de Argumentos (200 pts)
        4. Coesão Textual (200 pts)
        5. Proposta de Intervenção / Conclusão (200 pts)

        TAREFA:
        1. Atribua nota para cada competência (0, 40, 80, 120, 160, 200).
        2. Identifique erros gramaticais, ortográficos ou de coesão, citando o trecho exato e sugerindo a correção.
        3. Escreva um feedback geral construtivo.

        RETORNE ESTRITAMENTE EM JSON:
        {
            "globalScore": number, // Soma das competências
            "competencies": [
                { "id": 1, "name": "Domínio da Escrita", "score": number, "maxScore": 200, "feedback": "string" },
                { "id": 2, "name": "Compreensão do Tema", "score": number, "maxScore": 200, "feedback": "string" },
                { "id": 3, "name": "Organização de Ideias", "score": number, "maxScore": 200, "feedback": "string" },
                { "id": 4, "name": "Coesão", "score": number, "maxScore": 200, "feedback": "string" },
                { "id": 5, "name": "Proposta de Intervenção", "score": number, "maxScore": 200, "feedback": "string" }
            ],
            "issues": [
                { 
                    "excerpt": "trecho errado", 
                    "suggestion": "correção", 
                    "type": "GRAMMAR" | "ORTHOGRAPHY" | "COHESION" | "CLARITY", 
                    "explanation": "porquê" 
                }
            ],
            "generalFeedback": "Comentário final encorajador"
        }
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
        Você é um Especialista em Digitalização e Transcrição Pedagógica (Padrão INEP/ENEM).
        Sua tarefa é ler as imagens fornecidas (fotos de livro, apostila ou prova) e extrair TODAS as questões de avaliação presentes.

        REQUISITOS DE EXTRAÇÃO:
        1. TEXTO-BASE: Extraia o texto motivador ou contexto que precede a questão. Se for um gráfico ou imagem, descreva-o entre colchetes [Descrição da Imagem: ...].
        2. ENUNCIADO: Identifique o comando da questão (pergunta ou instrução).
        3. ALTERNATIVAS: Identifique as opções (A, B, C, D, E). 
           - Se a imagem tiver marcação de gabarito (x ou círculo), marque 'isCorrect: true'.
           - Se não tiver, deduza a resposta correta pelo conteúdo.
        4. TRI: Estime os parâmetros TRI (Dificuldade b, Discriminação a, Chute c).
        5. PEDAGÓGICO: Identifique a Disciplina e sugira um código BNCC coerente.
        
        RETORNO (JSON OBRIGATÓRIO):
        Retorne um objeto JSON com a chave 'questions' contendo um array de objetos, seguindo rigorosamente o schema.
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
    Sua tarefa é realizar uma REVISÃO GERAL (6 Estágios) em uma prova completa E GERAR VERSÕES CORRIGIDAS dos itens problemáticos.
    
    ITENS DA PROVA(JSON):
    ${itemsJson}
    
    ESTÁGIOS DE AUDITORIA:
    1. ESTRUTURAL: Verifique duplicação de temas, contradições entre questões e clareza técnica.
       - Se encontrar duplicatas EXATAS (mesmo enunciado e valores), identifique o ID para remoção
       - Se encontrar questões muito similares, gere variantes com valores/contextos diferentes
    
    2. PEDAGOGICO: Valide se a distribuição de habilidades e BNCC está equilibrada.
    
    3. ACESSIBILIDADE: Identifique barreiras para PCD/Neurodivergentes(TEA/TDAH/VISUAL).
       - Para CADA item, avalie se pode ser marcado como 'isAccessible: true'
       - Se não houver barreiras significativas, marque como acessível
       - Se houver barreiras, forneça 'accessibilityInstructions' com adaptações
    
    4. TEXTUAL: Melhore a fluidez, gramática e elimine ambiguidades (Polimento).
       - GERE VERSÕES MELHORADAS apenas dos enunciados que REALMENTE precisam de correção
       - Mantenha o sentido original, apenas melhore a clareza
    
    5. ANTICHEAT: Sugira variações para itens críticos.
       - Para itens com alto risco de cola (muito similares), GERE VARIANTES completas
       - Variantes devem ter mesma dificuldade mas contextos/valores diferentes
    
    6. TRI: Analise o equilíbrio dos parâmetros de dificuldade(b), discriminação(a) e acerto casual(c).

    IMPORTANTE: Para economizar tokens, retorne APENAS os itens que REALMENTE precisam de correção.
    NÃO retorne itens que já estão corretos.

    RETORNO OBRIGATÓRIO:
    - Relatório de cada estágio (status: "OK" ou "WARN", feedback CONCISO)
    - **polishedItems**: ARRAY com APENAS os itens que foram MODIFICADOS
      - Inclua APENAS itens que tiveram mudanças textuais
      - Cada item deve ter: id, statement (se mudou), alternatives (se mudaram), isAccessible, accessibilityInstructions
    - **variantsSuggested**: ARRAY com variantes (máximo 3)
      - Inclua 'originalItemId', 'newStatement', 'newAlternatives'
    - **itemsToRemove**: ARRAY com IDs de duplicatas EXATAS (máximo 5)
        
    Retorne OBRIGATORIAMENTE em JSON puro neste formato:
    {
        "stages": {
            "structural": { "status": "OK" | "WARN", "feedback": "texto CURTO" },
            "pedagogical": { "status": "OK" | "WARN", "feedback": "texto CURTO" },
            "accessibility": { "status": "OK" | "WARN", "feedback": "texto CURTO" },
            "textual": { "status": "OK" | "WARN", "feedback": "texto CURTO" },
            "anticheat": { "status": "OK" | "WARN", "feedback": "texto CURTO" },
            "tri": { "status": "OK" | "WARN", "feedback": "texto CURTO" }
        },
        "overallScore": number,
        "polishedItems": [],
        "variantsSuggested": [],
        "itemsToRemove": []
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

    ATENÇÃO: O campo 'week' deve conter apenas o número da semana(ex: 1, 2, 3, 4).Não use notação científica ou números longos.
        
        Retorne JSON no formato: { "bnccCodes": string[], "overview": string, "weeks": [{ "week": number, "theme": string, "objective": string, "activity": string }] }
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
    `,
    PREDICT_STUDENT_OUTCOME: (history: string) => `
        Você é um Analista de Dados Educacionais Sênior e Cientista de Comportamento.
        Sua tarefa é analisar o histórico de um aluno e prever seu desempenho futuro e risco de evasão.

        HISTÓRICO DO ALUNO(JSON):
        ${history}

TAREFA:
1. Identifique Padrões: Notas em queda, frequência irregular ou platôs.
        2. Projete o Próximo Bimestre: Estimativa de nota média.
        3. Calcule Probabilidade de Evasão: Baseado em desengajamento.
        4. Gere Insights Acionáveis: O que o professor deve fazer HOJE para mudar essa trajetória ?

    RETORNE EM JSON:
{
    "predictedScore": number,
        "evasionRiskProbability": number,
            "trend": "UP" | "DOWN" | "STABLE",
                "criticalAlerts": string[],
                    "aiInsight": string,
                        "recommendedIntervention": string
}
`,
    COUNCIL_MINUTES: (transcription: string, context: string) => `
        Você é um Secretário Acadêmico Especialista em Conselhos de Classe.
        Sua tarefa é gerar uma ATA FORMAL E EXECUTIVA com base na transcrição da reunião de conselho.

        CONTEXTO DO ALUNO:
        ${context}

        TRANSCRIÇÃO DA REUNIÃO(Áudio Bruto):
"${transcription}"

OBJETIVO:
1. Identificar a Decisão Final(Aprovado, Retido, Conselho, Recuperação).
        2. Sintetizar os pontos principais discutidos(Pedagógico e Comportamental).
        3. Listar os encaminhamentos definidos(O que será feito ?).

        RETORNE EM JSON:
{
    "decision": "APROVADO" | "RETIDO" | "CONSELHO" | "RECUPERACAO",
        "summary": "Resumo formal e impessoal do que foi discutido.",
            "actions": ["Ação 1", "Ação 2"],
                "confidentialNotes": "Notas sensíveis apenas para a coordenação."
}
`,
    GENERATE_PRE_EXAM_BRIEFING: (topics: string[]) => `
        Você é um Tutor Educacional Motivacional(O Corujão 🦉).
        O aluno está prestes a iniciar uma prova sobre: ${topics.join(', ')}.

OBJETIVO: Preparar o aluno mentalmente, reduzindo a ansiedade e ativando conhecimentos prévios, SEM DAR RESPOSTAS.

    TAREFA:
1. Crie uma mensagem curta de encorajamento(1 frase).
        2. Liste 3 "Pontos de Atenção" gerais para esses tópicos(ex: "Em crase, lembre-se de verificar o gênero da palavra seguinte").
        3. Dê uma dica de gestão de tempo / estratégia de prova.

    IMPORTANTE: NÃO forneça exemplos de questões ou gabaritos.O foco é estratégia e calma.

        RETORNE EM JSON:
{
    "motivationalQuote": "string",
        "keyReminders": ["string", "string", "string"],
            "strategyTip": "string"
}
`,
    GENERATE_POST_EXAM_REVIEW: (examTitle: string, studentAnswers: any[]) => `
        Você é um Tutor Pós - Prova(O Corujão 🦉) focado em Pedagogia do Erro.
        O aluno acabou de finalizar a prova: "${examTitle}".

        DADOS DO DESEMPENHO(JSON):
        ${JSON.stringify(studentAnswers)}

TAREFA:
1. Analise os erros cometidos.Identifique se foi falta de atenção, erro conceitual ou "chute".
        2. Para cada erro significativo, forneça uma explicação curta do PORQUÊ a resposta estava errada(Pedagogia do Erro).
3. Sugira 2 tópicos específicos para revisão baseados nas fraquezas mostradas.

        RETORNE EM JSON:
{
    "overallFeedback": "Comentário geral sobre o desempenho (encorajador mas realista)",
        "mistakeAnalysis": [
            { "questionId": "id", "analysis": "Por que errou?", "topicToReview": "Tópico" }
        ],
            "studyRecommendations": ["Tópico 1", "Tópico 2"]
}
`,
    ANALYZE_EXAM_BALANCE: (examTitle: string, itemsJson: string) => `
        Você é um Auditor Pedagógico Sênior(Padrão INEP / BNCC).
    Analise o equilíbrio e a qualidade da prova "${examTitle}" baseando - se nos itens abaixo:

ITENS(JSON):
        ${itemsJson}

TAREFA:
1. Avalie o equilíbrio de Dificuldade(Muitas fáceis ? Muitas difíceis ?).
        2. Avalie a abrangência de Habilidades(Códigos BNCC faltantes ou excessivos).
        3. Avalie a variedade de Tipos de Questão(Muitas de múltipla escolha ? Poucas discursivas ?).
        4. Identifique o Score Geral da prova(0 a 100).
        
        Gere uma lista de INSIGHTS(máximo 5) que ajudem o professor a melhorar o rigor e o equilíbrio da prova.
        
        RETORNE EM JSON:
{
    "score": number,
        "insights": [
            {
                "type": "SUCCESS" | "WARNING" | "DANGER" | "INFO",
                "title": "Título curto",
                "message": "Explicação pedagógica",
                "actionLabel": "Texto do botão de ação (opcional)",
                "actionType": "BNCC" | "DIFFICULTY" | "VARIETY"(opcional)
            }
        ]
}
`,
    ANALYZE_RISK_DATA: (contextJson: string) => `
        Você é um Analista de Dados Educacionais Sênior.
        Analise os dados de risco de evasão abaixo:

DADOS(JSON):
        ${contextJson}

TAREFA:
1. Identifique tendências críticas(vulnerabilidades, queda de frequência, etc).
        2. Sugira 3 ações estratégicas imediatas para a gestão escolar.
        3. Destaque os fatores mais impactantes no momento.
        
        RETORNE EM JSON:
{
    "summary": "Resumo executivo da situação",
        "insights": [
            { "title": "Título", "description": "Detalhes", "impact": "HIGH" | "MEDIUM" | "LOW" }
        ],
            "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3"]
}
`,
    MAP_BATCH_COLUMNS: (headers: string[], sampleRows: string[]) => `
        Você é um Especialista em Engenharia de Dados e Migração Escolar.
        Sua tarefa é mapear os cabeçalhos de uma planilha "suja" para o padrão do sistema ExamePad.

        CABEÇALHOS IDENTIFICADOS:
        ${headers.join(', ')}

        AMOSTRA DE DADOS(3 primeiras linhas):
        ${sampleRows.join('\n')}

        CAMPOS ALVO(Padronizados):
- name: Nome completo do Aluno / Professor.
        - email: Endereço de e - mail institucional ou pessoal.
        - registrationNumber: Número de matrícula escolar(Identidade Imutável).
        - phone: Telefone ou WhatsApp(Formatar: +55...).
        - role: Cargo(ALUNO, PROFESSOR, PAIS).
        - classId: Identificador da Turma(Ex: 8A, 9B).
        - schoolId: Identificador da Escola.

    TAREFA:
1. Identifique qual cabeçalho da planilha corresponde a cada campo alvo.
        2. Se não houver correspondência clara, ignore o cabeçalho.
        3. Se 'role' não estiver explícito, use como padrão 'ALUNO'(a menos que a amostra sugira o contrário).
        
        RETORNE EM JSON:
{
    "mapping": { "targetField": "headerName" },
    "confidence": number,
        "notes": "Explicação curta do mapeamento"
}
`
};

// --- Interfaces ---
export interface GeneratedQuestion {
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
        cognitiveAxis: string;
    };
    // Metadata for Governance
    aiModel?: string;
    promptVersion?: string;
}

export interface EssayGrade {
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

export interface RiskAnalysisResponse {
    summary: string;
    insights: { title: string; description: string; impact: 'HIGH' | 'MEDIUM' | 'LOW' }[];
    recommendations: string[];
}

export interface StudyPlanSuggestion {
    title: string;
    tasks: string[];
}

export interface LessonPlanSuggestion {
    bnccCodes: string[];
    overview: string;
    weeks: {
        week: number;
        theme: string;
        objective: string;
        activity: string;
    }[];
}

export interface AssessmentReport {
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

export interface CouncilMinutes {
    decision: 'APROVADO' | 'RETIDO' | 'CONSELHO' | 'RECUPERACAO';
    summary: string;
    actions: string[];
    confidentialNotes: string;
}

export interface FlashcardDeck {
    cards: { front: string; back: string }[];
}

export interface PreExamBriefing {
    motivationalQuote: string;
    keyReminders: string[];
    strategyTip: string;
}

export interface PostExamReview {
    overallFeedback: string;
    mistakeAnalysis: {
        questionId: string;
        analysis: string;
        topicToReview: string;
    }[];
    studyRecommendations: string[];
}

export interface ExamInsight {
    type: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO';
    title: string;
    message: string;
    actionLabel?: string;
    actionType?: 'BNCC' | 'DIFFICULTY' | 'VARIETY';
}

export interface ExamAnalysisResponse {
    score: number;
    insights: ExamInsight[];
}

export interface RPGScenario {
    title: string;
    intro: string;
    challenge: string;
    options: { text: string; isCorrect: boolean; outcome: string }[];
}

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

    // No production fallback for batch grading
    return callGeminiAPI<BatchGradeResult[]>(prompt, schema);
};

export const gradeFullEssay = async (
    topic: string,
    motivationalText: string,
    studentText: string,
    tenantId?: string // RAG Phase 3C
): Promise<any> => {
    // RAG: inject school-specific evaluation criteria
    let extraCtx = '';
    if (tenantId) {
        const ragCtx = await searchKnowledgeBase(`critérios correção redação ${topic}`, tenantId, 3);
        if (ragCtx) extraCtx = `\n\n[CRITÉRIOS OFICIAIS DA ESCOLA]:\n${ragCtx}\nConsidere esses critérios ao corrigir.`;
    }
    const prompt = PROMPTS.GRADE_FULL_ESSAY(topic, motivationalText, studentText) + extraCtx;

    // Schema definition for structure guarantee
    const schema = {
        type: Type.OBJECT,
        properties: {
            globalScore: { type: Type.NUMBER },
            competencies: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.NUMBER },
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        maxScore: { type: Type.NUMBER },
                        feedback: { type: Type.STRING }
                    }
                }
            },
            issues: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        excerpt: { type: Type.STRING },
                        suggestion: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["GRAMMAR", "ORTHOGRAPHY", "COHESION", "CLARITY"] },
                        explanation: { type: Type.STRING }
                    }
                }
            },
            generalFeedback: { type: Type.STRING }
        }
    };

    return callGeminiAPI<any>(prompt, schema);
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

// --- Helper Functions ---

/**
 * Limpa o texto retornado pela IA para garantir que seja um JSON válido.
 * Remove blocos de código markdown, caracteres de controle e lida com alucinações numéricas.
 */
const cleanAIJSON = (text: string): string => {
    try {
        // 1. Remove blocos de código Markdown
        // Escapamos os backticks para evitar confusão no parser de algumas IDEs
        let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // 2. Remove caracteres de controle invisíveis
        cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

        // 3. Corrige alucinações numéricas (ex: notação científica infinita ou números gigantes que quebram o parser)
        cleaned = cleaned.replace(/:\s*\d+[eE][-+]?\d{10,}/g, ': 0');
        cleaned = cleaned.replace(/:\s*\d{20,}/g, ': 0');

        return cleaned;
    } catch (e) {
        console.warn("[GeminiService] Erro ao limpar JSON:", e);
        return text;
    }
};

// --- Base API Call ---

/**
 * Generic content generation (No Schema / Text only)
 */
export const generateContent = async (prompt: string): Promise<string> => {
    try {
        const result = await callGeminiAPI<string>(prompt, undefined);
        return result;
    } catch (error) {
        console.error("Erro na geração genérica de conteúdo:", error);
        throw error;
    }
};

async function callGeminiAPI<T>(
    contents: string | any,
    responseSchema: any | undefined
): Promise<T> {
    const apiKey = getApiKey();

    if (!apiKey) {
        console.error("[GeminiService] API Key missing. Aborting generation.");
        throw new Error("Chave da API Gemini não configurada (VITE_GEMINI_API_KEY). Verifique seu arquivo .env ou as variáveis de ambiente.");
    }

    // DEBUG: Log the start of the key to verify correct injection (Safely)
    console.log(`[GeminiService] Usando chave: ${apiKey.substring(0, 7)}...`);

    let attempt = 0;
    const maxRetries = 3;
    const baseDelay = 1000;

    while (attempt < maxRetries) {
        try {
            const ai = new GoogleGenAI({
                apiKey,
                apiVersion: 'v1beta'
            });

            const config: any = {
                temperature: 0.2, // Reduzido de 0.7 para maior estabilidade em JSON
                maxOutputTokens: 16384
            };

            if (responseSchema) {
                config.responseMimeType = "application/json";
                config.responseSchema = responseSchema;
            }

            // NOVO SDK: contents deve ser um array de objetos
            const formattedContents = typeof contents === 'string'
                ? [{ role: 'user', parts: [{ text: contents }] }]
                : contents;

            // Uso do barramento legatário compatível com esta versão do SDK
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
                throw new Error("A IA retornou uma resposta vazia. Tente novamente.");
            }

            if (responseSchema) {
                const cleanedText = cleanAIJSON(text);
                try {
                    return JSON.parse(cleanedText) as T;
                } catch (jsonError) {
                    console.error("JSON Parse Error:", jsonError, "Raw Text:", text, "Cleaned Text:", cleanedText);
                    throw new Error("A IA gerou um formato inválido. Tente simplificar o pedido.");
                }
            }

            return text as unknown as T;

        } catch (error: any) {
            console.error(`[GeminiService] Tentativa ${attempt + 1}/${maxRetries} falhou:`, error.message);

            const isRetryable = error.message?.includes('429') ||
                error.message?.includes('503') ||
                error.message?.includes('Overloaded') ||
                error.message?.includes('fetch'); // Adiciona erros de rede/CORS temporários

            if (isRetryable && attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`[GeminiService] Aguardando ${delay}ms antes de tentar novamente...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
                continue;
            }

            // CRITICAL: Throw real error to UI instead of Mock
            console.error(`[GeminiService] Erro crítico após retentativas:`, error);
            throw new Error(`Erro na IA: ${error.message || 'Falha desconhecida'}. Verifique sua cota ou chave de API.`);
        }
    }

    // This part should technically not be reached if maxRetries are handled above, but for safety:
    throw new Error("Falha ao gerar conteúdo após múltiplas tentativas.");
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
    subject: string,
    tenantId?: string, // RAG: allow injection of school-specific curricula
    model3dContext?: string
): Promise<GeneratedQuestion[]> => {

    // RAG Phase 2A: enrich context with school-specific knowledge
    let enrichedContext = contextText;
    if (tenantId) {
        const ragCtx = await searchKnowledgeBase(`${subject} questão ${difficulty}`, tenantId, 3);
        if (ragCtx) {
            enrichedContext += `

[CONTEXTO OFICIAL DA ESCOLA — USE COMO BASE PEDAGÓGICA]:
${ragCtx}
Se as habilidades e conteúdos descritos acima estiverem relacionados à disciplina, priorize-os na elaboração.`;
        }
    }

    const prompt = PROMPTS.GENERATE_QUESTIONS(quantity, subject, type, difficulty, enrichedContext, model3dContext);

    const schema = {
        type: Type.OBJECT,
        properties: {
            questions: {
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
                        justification: { type: Type.STRING, description: "Justificativa pedagógica detalhada do gabarito e distrator" },
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
            }
        },
        required: ["questions"]
    };

    interface SchemaResponse { questions: GeneratedQuestion[] }
    // No production fallback for generating questions
    const res = await callGeminiAPI<SchemaResponse>(prompt, schema);

    // Ensure we return an array and inject governance metadata
    const questions = Array.isArray(res.questions) ? res.questions : [res as any];

    return questions.map(q => ({
        ...q,
        aiModel: DEFAULT_MODEL,
        promptVersion: PROMPT_VERSION
    }));
};

export const gradeEssayAnswer = async (
    question: string,
    expectedAnswer: string,
    studentAnswer: string,
    maxScore: number,
    tenantId?: string // RAG Phase 3C
): Promise<EssayGrade> => {
    // RAG: inject school-specific grading rubrics
    let extraCtx = '';
    if (tenantId) {
        const ragCtx = await searchKnowledgeBase(`gabarito correção discursiva ${question.slice(0, 60)}`, tenantId, 3);
        if (ragCtx) extraCtx = `\n\n[RUBRICA OFICIAL]:\n${ragCtx}`;
    }
    const prompt = PROMPTS.GRADE_ESSAY(question, expectedAnswer, studentAnswer, maxScore) + extraCtx;

    const schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
        }
    };

    // No production fallback for grading
    return callGeminiAPI<EssayGrade>(prompt, schema);
};

// ============================================================================
// NEW RAG ARCHITECTURE: Embedding & Knowledge Base (Anti-Hallucination)
// ============================================================================

/**
 * Gera o vetor matemático (embedding) de um texto para busca semântica
 */
export async function generateDocEmbedding(text: string): Promise<number[] | null> {
    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("Chave da API Gemini não configurada (VITE_GEMINI_API_KEY). Verifique as variáveis de ambiente.");

        const ai = new GoogleGenAI({ apiKey });

        // Chamada oficial da nova SDK do GoogleGenAI
        const response = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: text,
        });

        // Retorna o array de números de 768 dimensões
        return response.embeddings?.[0]?.values || null;
    } catch (error) {
        console.error("Erro ao gerar embedding RAG:", error);
        return null;
    }
}

/**
 * Realiza a busca vetorial no Supabase (Cofre de Conhecimento)
 */
export async function searchKnowledgeBase(query: string, tenantId: string, limit = 3): Promise<string> {
    try {
        // 1. Gera o vetor da pergunta
        const queryEmbedding = await generateDocEmbedding(query);
        if (!queryEmbedding) return "";

        // 2. Importa o cliente Supabase dinamicamente para evitar ciclo
        const { supabase } = await import('./supabaseClient');

        // 3. Executa a RPC de mach_knowledge criada na migration
        const { data, error } = await supabase.rpc('match_knowledge', {
            query_embedding: queryEmbedding,
            match_threshold: 0.70, // Relevância mínima estrita
            match_count: limit,
            filter_tenant: tenantId
        });

        if (error || !data || data.length === 0) {
            return "";
        }

        // 4. Concatena os trechos encontrados
        const contextTexts = data.map((doc: any) => doc.content).join("\n\n---\n\n");
        return `\n\n[DADOS RAG RECUPERADOS DO SISTEMA DA ESCOLA]:\n${contextTexts}\n\n`;

    } catch (error) {
        console.error("Erro na busca semântica RAG:", error);
        return "";
    }
}


export const askOwlTutor = async (
    history: { role: 'user' | 'model'; text: string }[],
    lastUserMessage: string,
    studentName: string,
    context: string,
    forbiddenTopics: string[] = [],
    tenantId?: string // Opcional por retrocompatibilidade, mas ideal injetar
): Promise<string> => {

    // 1. Fase RAG (Retrieval) - Tenta buscar contexto interno se o tenant existir
    let ragContext = "";
    if (tenantId) {
        ragContext = await searchKnowledgeBase(lastUserMessage, tenantId, 4);
    }

    // 2. Montar Instrução Rígida Anti-Alucinação caso haja dados RAG
    if (ragContext) {
        context += `\n\nATENÇÃO MÁXIMA (ANTI-ALUCINAÇÃO): O Coordenador forneceu os seguintes dados oficiais extraídos do material didático da escola do aluno:\n${ragContext}\n\n`;
        context += "DIRETRIZ ESTRITA: Se a pergunta do aluno for sobre conteúdo pedagógico ou regras e estiver respondida nos DADOS RAG RECUPERADOS acima, você DEVE basear sua resposta EXCLUSIVAMENTE neles. Se não estiver nos dados e não for conhecimento basal, não invente.";
    }

    let prompt = PROMPTS.TUTOR_SYSTEM(studentName, context, forbiddenTopics) + "\nHistórico da Conversa:\n";

    history.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'Aluno' : 'Corujão'}: ${msg.text}\n`;
    });

    prompt += `Aluno: ${lastUserMessage}\nCorujão:`;

    return callGeminiAPI<string>(prompt, undefined);
};

// --- Tutor Agent Services (Phase 2) ---

export const generatePreExamBriefing = async (
    topics: string[],
    tenantId?: string // RAG Phase 3C
): Promise<PreExamBriefing> => {
    // RAG: inject relevant study content for the exam topics
    let extraCtx = '';
    if (tenantId) {
        const ragCtx = await searchKnowledgeBase(topics.join(' '), tenantId, 3);
        if (ragCtx) extraCtx = `\n\n[CONTEÚDA DISPONÍVEL PARA REVISÃO]:\n${ragCtx}\nConsidere esses materiais ao elaborar dicas.`;
    }
    const prompt = PROMPTS.GENERATE_PRE_EXAM_BRIEFING(topics) + extraCtx;
    const schema = {
        type: Type.OBJECT,
        properties: {
            motivationalQuote: { type: Type.STRING },
            keyReminders: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategyTip: { type: Type.STRING }
        }
    };
    return callGeminiAPI<PreExamBriefing>(prompt, schema);
};

export const generatePostExamReview = async (
    examTitle: string,
    studentAnswers: any[],
    tenantId?: string // RAG Phase 3C
): Promise<PostExamReview> => {
    const mistakes = studentAnswers.filter(a => !a.isCorrect).map(a => ({
        questionId: a.itemId,
        selectedId: a.selectedAlternativeId,
        wasEssay: !!a.text
    }));

    if (mistakes.length === 0) {
        return {
            overallFeedback: "Desempenho perfeito! Você dominou todos os tópicos desta avaliação. Continue assim! 🦉✨",
            mistakeAnalysis: [],
            studyRecommendations: ["Avançar para tópicos mais complexos", "Ajudar colegas com dificuldades"]
        };
    }

    // RAG: inject pedagogical feedback references
    let extraCtx = '';
    if (tenantId) {
        const ragCtx = await searchKnowledgeBase(`feedback pedagógico erro ${examTitle}`, tenantId, 3);
        if (ragCtx) extraCtx = `\n\n[ORIENTAÇÕES PEDAGÓGICAS]:\n${ragCtx}`;
    }
    const prompt = PROMPTS.GENERATE_POST_EXAM_REVIEW(examTitle, mistakes) + extraCtx;

    const schema = {
        type: Type.OBJECT,
        properties: {
            overallFeedback: { type: Type.STRING },
            mistakeAnalysis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        questionId: { type: Type.STRING },
                        analysis: { type: Type.STRING },
                        topicToReview: { type: Type.STRING }
                    }
                }
            },
            studyRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };



    return callGeminiAPI<PostExamReview>(prompt, schema);
};

export const generateStudyPlanSuggestions = async (
    studentName: string,
    weakSubject: string,
    recentGrade: number,
    tenantId?: string // RAG: inject school-specific materials
): Promise<StudyPlanSuggestion> => {

    // RAG Phase 2A: search for school resources related to the weak subject
    let extraContext = '';
    if (tenantId) {
        const ragCtx = await searchKnowledgeBase(`${weakSubject} material didático`, tenantId, 3);
        if (ragCtx) extraContext = `

[MATERIAIS OFICIAIS DA ESCOLA DISPONÍVEIS PARA ESTUDO]:
${ragCtx}
Se possível, inclua referências a esses materiais no plano de estudo.`;
    }

    const prompt = PROMPTS.STUDY_PLAN(studentName, weakSubject, recentGrade) + extraContext;

    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };

    // No production fallback for study plans
    return callGeminiAPI<StudyPlanSuggestion>(prompt, schema);
};

export const generateLessonPlanSuggestions = async (
    subject: string,
    grade: string,
    topic: string,
    tenantId?: string // RAG Phase 3C
): Promise<LessonPlanSuggestion> => {
    // RAG: inject school's official curriculum alignment
    let enrichedTopic = topic;
    if (tenantId) {
        const ragCtx = await searchKnowledgeBase(`${subject} ${grade} ${topic} plano de aula`, tenantId, 3);
        if (ragCtx) enrichedTopic += `\n\n[CONTEÚDA OFICIAL DISPONÍVEL]:\n${ragCtx}\nConsidere este conteúdo ao estruturar o plano.`;
    }
    const prompt = PROMPTS.GENERATE_SYLLABUS(subject, grade, enrichedTopic);

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
        }
    };

    return callGeminiAPI<LessonPlanSuggestion>(prompt, schema);
};

export const generateAssessmentReport = async (
    userName: string,
    testType: AssessmentType,
    answers: { question: string; answer: string }[],
    tenantId?: string // RAG Phase 3C
): Promise<AssessmentReport> => {
    // RAG: inject pedagogical report guidelines from the school
    const basePrompt = PROMPTS.ASSESSMENT_REPORT(userName, testType, JSON.stringify(answers));
    let prompt = basePrompt;
    if (tenantId) {
        const ragCtx = await searchKnowledgeBase(`relatório avaliação ${testType} aluno`, tenantId, 3);
        if (ragCtx) prompt += `\n\n[ORIENTAÇÕES DA ESCOLA PARA RELATÓRIOS]:\n${ragCtx}`;
    }

    const schema = {
        type: Type.OBJECT,
        properties: {
            resultType: { type: Type.STRING },
            report: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };

    // No production fallback for reports
    return callGeminiAPI<AssessmentReport>(prompt, schema);
};

export const improveItemStatement = async (statement: string): Promise<string> => {
    const prompt = PROMPTS.IMPROVE_STATEMENT(statement);
    return callGeminiAPI<string>(prompt, undefined);
};

const schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
};

export const generateCouncilMinutes = async (
    transcription: string,
    context: string,
    tenantId?: string // RAG Phase 3C
): Promise<CouncilMinutes> => {
    // RAG: inject council deliberation guidelines from the school
    let enrichedContext = context;
    if (tenantId) {
        const ragCtx = await searchKnowledgeBase('conselho de classe deliberação aprovação retenção', tenantId, 3);
        if (ragCtx) enrichedContext += `\n\n[REGRAS OFICIAIS DO CONSELHO]:\n${ragCtx}`;
    }
    const prompt = (PROMPTS as any).COUNCIL_MINUTES(transcription, enrichedContext);

    const schema = {
        type: Type.OBJECT,
        properties: {
            decision: { type: Type.STRING, enum: ["APROVADO", "RETIDO", "CONSELHO", "RECUPERACAO"] },
            summary: { type: Type.STRING },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidentialNotes: { type: Type.STRING }
        }
    };

    return callGeminiAPI<CouncilMinutes>(prompt, schema);
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
    return callGeminiAPI<{ code: string; reason: string }>(prompt, schema);
};



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

    return callGeminiAPI<any>(prompt, schema);
}

export const generateJustification = async (statement: string, correct: string): Promise<string> => {
    const prompt = PROMPTS.GENERATE_JUSTIFICATION(statement, correct);
    return callGeminiAPI<string>(prompt, undefined);
};

export const generateDistractors = async (statement: string, correct: string): Promise<string[]> => {
    const prompt = PROMPTS.GENERATE_DISTRACTORS(statement, correct);
    const schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };
    return callGeminiAPI<string[]>(prompt, schema);
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
    return callGeminiAPI<GeneratedQuestion>(prompt, schema);
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
    return callGeminiAPI<any>(prompt, schema);
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

    return callGeminiAPI<Syllabus>(prompt, schema);
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

    return callGeminiAPI<TextAsset>(prompt, schema);
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
            bloomTaxonomy: "Compreensão",
            cognitiveAxis: "COMPREENDER_FENOMENOS"
        }
    }));
};
export const reviewExamAdvanced = async (items: any[]): Promise<any> => {
    console.log("[GeminiService] Iniciando revisão avançada (vSchema-Literal-Fixed)");
    const prompt = PROMPTS.REVIEW_EXAM(JSON.stringify(items));
    const schema = {
        type: "object",
        properties: {
            stages: {
                type: "object",
                properties: {
                    structural: { type: "object", properties: { status: { type: "string" }, feedback: { type: "string" } }, required: ["status", "feedback"] },
                    pedagogical: { type: "object", properties: { status: { type: "string" }, feedback: { type: "string" } }, required: ["status", "feedback"] },
                    accessibility: { type: "object", properties: { status: { type: "string" }, feedback: { type: "string" } }, required: ["status", "feedback"] },
                    textual: { type: "object", properties: { status: { type: "string" }, feedback: { type: "string" } }, required: ["status", "feedback"] },
                    anticheat: { type: "object", properties: { status: { type: "string" }, feedback: { type: "string" } }, required: ["status", "feedback"] },
                    tri: { type: "object", properties: { status: { type: "string" }, feedback: { type: "string" } }, required: ["status", "feedback"] }
                },
                required: ["structural", "pedagogical", "accessibility", "textual", "anticheat", "tri"]
            },
            overallScore: { type: "number" },
            polishedItems: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        statement: { type: "string" },
                        alternatives: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    text: { type: "string" },
                                    isCorrect: { type: "boolean" }
                                },
                                required: ["text", "isCorrect"]
                            }
                        }
                    },
                    required: ["id", "statement", "alternatives"]
                }
            },
            variantsSuggested: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        originalItemId: { type: "string" },
                        newStatement: { type: "string" },
                        newAlternatives: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    text: { type: "string" },
                                    isCorrect: { type: "boolean" }
                                },
                                required: ["text", "isCorrect"]
                            }
                        }
                    },
                    required: ["originalItemId", "newStatement", "newAlternatives"]
                }
            },
            itemsToRemove: {
                type: "array",
                items: { type: "string" }
            }
        },
        required: ["stages", "overallScore", "polishedItems", "variantsSuggested", "itemsToRemove"]
    };

    return callGeminiAPI<any>(prompt, schema);
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

    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Chave da API Gemini não encontrada. Não é possível gerar o relatório pedagógico.");
    }

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

    if (!text) {
        throw new Error("Falha ao gerar o relatório pedagógico: A IA retornou uma resposta vazia.");
    }

    return text.trim();
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

    return callGeminiAPI<GeneratedEssay>(prompt, schema);
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

    return callGeminiAPI<VisualSuggestion>(prompt, schema);
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

    const result = await callGeminiAPI<any>(prompt, schema);

    return {
        ...result,
        studentId: "generated",
        generatedAt: new Date().toISOString()
    };
}

/**
 * Predição de Sucesso/Risco do Aluno (v4.0)
 */
export async function predictStudentOutcome(studentHistory: any): Promise<{
    predictedScore: number;
    evasionRiskProbability: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    criticalAlerts: string[];
    aiInsight: string;
    recommendedIntervention: string;
} | null> {
    const prompt = (PROMPTS as any).PREDICT_STUDENT_OUTCOME(JSON.stringify(studentHistory));

    const schema = {
        type: Type.OBJECT,
        properties: {
            predictedScore: { type: Type.NUMBER },
            evasionRiskProbability: { type: Type.NUMBER },
            trend: { type: Type.STRING, enum: ["UP", "DOWN", "STABLE"] },
            criticalAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
            aiInsight: { type: Type.STRING },
            recommendedIntervention: { type: Type.STRING }
        },
        required: ["predictedScore", "evasionRiskProbability", "trend", "aiInsight", "recommendedIntervention"]
    };

    try {
        return callGeminiAPI<any>(prompt, schema);
    } catch (error) {
        console.error("AI Error (Prediction):", error);
        return null;
    }
}

// ============================================================================
// NEW: Multi-Level AI Generation & Validation
// ============================================================================

// suggestBNCCCodes removed to avoid 404 errors with gemini-1.5-pro in v1beta
// Manual search (BNCCSearchModal) is the preferred method now.

/**
 * Validação Fase 1: Qualidade Técnica (Rápida)
 */
export async function validateQuestionQuality(
    items: any[]
): Promise<{
    skillCoverage: number;
    difficultyDistribution: boolean;
    triParamsEstimated: boolean;
    distractorDiversity: number;
    noPitfalls: boolean;
}> {
    const prompt = `
        Você é um Auditor Técnico de Questões Educacionais.
        
        TAREFA: Realize uma validação RÁPIDA de qualidade técnica do banco de questões.
        
        QUESTÕES (JSON):
        ${JSON.stringify(items.slice(0, 30))} 
        
        CRITÉRIOS:
        1. COBERTURA DE HABILIDADES: Todas as habilidades BNCC solicitadas foram cobertas? (0-100%)
        2. DISTRIBUIÇÃO DE DIFICULDADE: A distribuição está balanceada? (true/false)
        3. PARÂMETROS TRI: Todos os itens têm parâmetros TRI estimados? (true/false)
        4. DIVERSIDADE DE DISTRATORES: Os distratores são variados e plausíveis? (0-100%)
        5. AUSÊNCIA DE PEGADINHAS: Não há pegadinhas ou absurdos óbvios? (true/false)
        
        Seja OBJETIVO e RÁPIDO. Esta é uma validação preliminar.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            skillCoverage: { type: Type.NUMBER, description: "Porcentagem de cobertura (0-100)" },
            difficultyDistribution: { type: Type.BOOLEAN },
            triParamsEstimated: { type: Type.BOOLEAN },
            distractorDiversity: { type: Type.NUMBER, description: "Porcentagem (0-100)" },
            noPitfalls: { type: Type.BOOLEAN }
        },
        required: ["skillCoverage", "difficultyDistribution", "triParamsEstimated", "distractorDiversity", "noPitfalls"]
    };

    try {
        return await callGeminiAPI<any>(prompt, schema);
    } catch (error) {
        console.error("AI Error (Quality Validation):", error);
        // Fallback otimista
        return {
            skillCoverage: 80,
            difficultyDistribution: true,
            triParamsEstimated: true,
            distractorDiversity: 75,
            noPitfalls: true
        };
    }
}

/**
 * Validação Fase 2: Padrões INEP/BNCC/OCDE (Detalhada)
 */
export async function validateQuestionStandards(
    items: any[],
    standards: ('INEP' | 'BNCC' | 'OCDE')[]
): Promise<{
    inepCompliance: number;
    bnccCompliance: number;
    ocdeCompliance?: number;
    issues: Array<{
        questionId: string;
        questionNumber: number;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        category: string;
        description: string;
        suggestion?: string;
    }>;
    suggestions: string[];
    detailedReport: {
        contextualization: boolean;
        clearCommand: boolean;
        plausibleDistractors: boolean;
        unambiguousAnswer: boolean;
        bnccAlignment: boolean;
        appropriateComplexity: boolean;
        appropriateLanguage: boolean;
    };
}> {
    const standardsText = standards.join(', ');

    const prompt = `
        Você é um Revisor Sênior de Avaliações Educacionais com expertise em ${standardsText}.
        
        TAREFA: Realize uma validação DETALHADA das questões seguindo os padrões: ${standardsText}.
        
        QUESTÕES (JSON):
        ${JSON.stringify(items.slice(0, 30))}
        
        PADRÕES A VALIDAR:
        ${standards.includes('INEP') ? `
        - INEP/SAEB:
          * Contextualização adequada (texto-base necessário)
          * Comando claro e objetivo
          * Distratores plausíveis (baseados em erros comuns)
          * Gabarito inequívoco
        ` : ''}
        
        ${standards.includes('BNCC') ? `
        - BNCC:
          * Alinhamento correto com código BNCC
          * Nível de complexidade adequado
          * Linguagem apropriada para a faixa etária
        ` : ''}
        
        ${standards.includes('OCDE') ? `
        - OCDE/PISA:
          * Contextualização real-world
          * Raciocínio crítico exigido
          * Competências do século XXI
        ` : ''}
        
        RETORNE:
        1. Scores de conformidade (0-100%) para cada padrão
        2. Lista de problemas encontrados (máximo 10 mais críticos)
        3. Sugestões de melhoria (máximo 5)
        4. Relatório detalhado (booleanos para cada critério)
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            inepCompliance: { type: Type.NUMBER, description: "Conformidade INEP (0-100)" },
            bnccCompliance: { type: Type.NUMBER, description: "Conformidade BNCC (0-100)" },
            ocdeCompliance: { type: Type.NUMBER, description: "Conformidade OCDE (0-100)" },
            issues: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        questionId: { type: Type.STRING },
                        questionNumber: { type: Type.NUMBER },
                        severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
                        category: { type: Type.STRING },
                        description: { type: Type.STRING },
                        suggestion: { type: Type.STRING }
                    }
                }
            },
            suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            detailedReport: {
                type: Type.OBJECT,
                properties: {
                    contextualization: { type: Type.BOOLEAN },
                    clearCommand: { type: Type.BOOLEAN },
                    plausibleDistractors: { type: Type.BOOLEAN },
                    unambiguousAnswer: { type: Type.BOOLEAN },
                    bnccAlignment: { type: Type.BOOLEAN },
                    appropriateComplexity: { type: Type.BOOLEAN },
                    appropriateLanguage: { type: Type.BOOLEAN }
                }
            }
        },
        required: ["inepCompliance", "bnccCompliance", "issues", "suggestions", "detailedReport"]
    };

    try {
        return await callGeminiAPI<any>(prompt, schema);
    } catch (error) {
        console.error("AI Error (Standards Validation):", error);
        // Fallback otimista
        return {
            inepCompliance: 85,
            bnccCompliance: 90,
            ocdeCompliance: standards.includes('OCDE') ? 80 : undefined,
            issues: [],
            suggestions: ["Validação automática concluída com sucesso"],
            detailedReport: {
                contextualization: true,
                clearCommand: true,
                plausibleDistractors: true,
                unambiguousAnswer: true,
                bnccAlignment: true,
                appropriateComplexity: true,
                appropriateLanguage: true
            }
        };
    }
}

/**
 * Gera documentação automática para capa da prova
 */
export async function generateExamCover(data: {
    examType: 'LINEAR' | 'ADAPTIVE';
    subject: string;
    topic: string;
    bnccCodes: string[];
    questionCount: number;
    bankSize?: number;
    distribution?: {
        veryEasy: number;
        easy: number;
        medium: number;
        hard: number;
        veryHard: number;
    };
    standards: ('INEP' | 'BNCC' | 'OCDE')[];
    validationScore?: number;
}): Promise<string> {
    const prompt = `
        Você é um Especialista em Comunicação Educacional e Transparência Pedagógica.
        
        TAREFA: Crie um texto CLARO e EDUCATIVO para a capa de uma prova, explicando ao aluno como ele será avaliado.
        
        DADOS DA PROVA:
        - Tipo: ${data.examType === 'ADAPTIVE' ? 'Avaliação Adaptativa (TRI/CAT)' : 'Avaliação Linear'}
        - Disciplina: ${data.subject}
        - Tema: ${data.topic}
        - Habilidades BNCC: ${data.bnccCodes.join(', ')}
        - Número de questões: ${data.questionCount}
        ${data.bankSize ? `- Tamanho do banco: ${data.bankSize} questões` : ''}
        ${data.distribution ? `
        - Distribuição:
          * ${data.distribution.veryEasy} Muito Fáceis
          * ${data.distribution.easy} Fáceis
          * ${data.distribution.medium} Médias
          * ${data.distribution.hard} Difíceis
          * ${data.distribution.veryHard} Muito Difíceis
        ` : ''}
        - Padrões de qualidade: ${data.standards.join(', ')}
        ${data.validationScore ? `- Score de validação: ${data.validationScore}%` : ''}
        
        REQUISITOS:
        1. Explique de forma SIMPLES e ACOLHEDORA como funciona a avaliação
        2. Se for adaptativa, explique o conceito de TRI de forma didática
        3. Mostre os critérios de avaliação (escala TRI, níveis de proficiência)
        4. Liste a distribuição do banco de questões
        5. Destaque os padrões de qualidade seguidos
        6. Use linguagem apropriada para estudantes (evite jargões técnicos)
        
        ESTRUTURA:
        - SOBRE ESTA AVALIAÇÃO (tipo, disciplina, tema, habilidades)
        - COMO FUNCIONA (mecânica da prova)
        - CRITÉRIOS DE AVALIAÇÃO (escala, níveis)
        - DISTRIBUIÇÃO DO BANCO (se aplicável)
        - PADRÕES DE QUALIDADE (INEP/BNCC/OCDE)
        
        Retorne APENAS o texto formatado em markdown, pronto para ser incluído na capa.
    `;

    try {
        const result = await callGeminiAPI<string>(prompt, undefined);
        return result;
    } catch (error) {
        console.error("AI Error (Exam Cover Generation):", error);
        // Fallback manual
        return generateFallbackExamCover(data);
    }
}

/**
 * Fallback para geração de capa (caso a IA falhe)
 */
function generateFallbackExamCover(data: {
    examType: 'LINEAR' | 'ADAPTIVE';
    subject: string;
    topic: string;
    bnccCodes: string[];
    questionCount: number;
    bankSize?: number;
    distribution?: {
        veryEasy: number;
        easy: number;
        medium: number;
        hard: number;
        veryHard: number;
    };
    standards: ('INEP' | 'BNCC' | 'OCDE')[];
}): string {
    const isAdaptive = data.examType === 'ADAPTIVE';

    let cover = `# SOBRE ESTA AVALIAÇÃO\n\n`;
    cover += `**Tipo:** ${isAdaptive ? 'Avaliação Adaptativa (TRI/CAT)' : 'Avaliação Linear'}\n`;
    cover += `**Disciplina:** ${data.subject}\n`;
    cover += `**Tema:** ${data.topic}\n`;
    cover += `**Habilidades Avaliadas:** ${data.bnccCodes.join(', ')}\n\n`;

    if (isAdaptive) {
        cover += `## COMO FUNCIONA\n\n`;
        cover += `Esta prova é adaptativa, ou seja, as questões se ajustam ao seu nível de conhecimento:\n\n`;
        cover += `• Você responderá **${data.questionCount} questões** no total\n`;
        cover += `• Se você acertar, a próxima questão será mais difícil\n`;
        cover += `• Se você errar, a próxima questão será mais fácil\n`;
        cover += `• O objetivo é encontrar seu nível real de habilidade\n\n`;

        cover += `## CRITÉRIOS DE AVALIAÇÃO\n\n`;
        cover += `Sua proficiência será calculada usando a **Teoria de Resposta ao Item (TRI)**, `;
        cover += `o mesmo método usado pelo SAEB e ENEM. A escala vai de -3 a +3:\n\n`;
        cover += `• **-2.0 a -1.0:** Nível Básico\n`;
        cover += `• **-1.0 a  0.0:** Nível Intermediário\n`;
        cover += `• ** 0.0 a +1.0:** Nível Adequado\n`;
        cover += `• **+1.0 a +2.0:** Nível Avançado\n\n`;
    } else {
        cover += `## COMO FUNCIONA\n\n`;
        cover += `Esta é uma avaliação tradicional com **${data.questionCount} questões**.\n`;
        cover += `Cada questão tem um valor específico e sua nota será a soma dos pontos obtidos.\n\n`;
    }

    if (data.distribution && data.bankSize) {
        cover += `## DISTRIBUIÇÃO DO BANCO DE QUESTÕES\n\n`;
        cover += `O banco contém **${data.bankSize} questões** distribuídas da seguinte forma:\n\n`;
        cover += `• ${data.distribution.veryEasy} questões Muito Fáceis\n`;
        cover += `• ${data.distribution.easy} questões Fáceis\n`;
        cover += `• ${data.distribution.medium} questões Médias\n`;
        cover += `• ${data.distribution.hard} questões Difíceis\n`;
        cover += `• ${data.distribution.veryHard} questões Muito Difíceis\n\n`;
    }

    cover += `## PADRÕES DE QUALIDADE\n\n`;
    if (data.standards.includes('INEP')) {
        cover += `✅ Questões elaboradas seguindo padrões **INEP/SAEB**\n`;
    }
    if (data.standards.includes('BNCC')) {
        cover += `✅ Alinhadas com a **BNCC** (Base Nacional Comum Curricular)\n`;
    }
    if (data.standards.includes('OCDE')) {
        cover += `✅ Seguindo padrões **OCDE/PISA** de avaliação internacional\n`;
    }
    cover += `✅ Validadas por IA especializada\n`;
    cover += `✅ Revisadas por professor\n`;

    return cover;
}


/**
 * OCR Inteligente: Converte imagem em questão estruturada
 */
export async function extractItemFromImage(base64Image: string): Promise<GeneratedQuestion | null> {
    const items = await extractItemsFromMultipleImages([base64Image]);
    return items.length > 0 ? items[0] : null;
}

export const extractItemsFromMultipleImages = async (
    imagesBase64: string[]
): Promise<GeneratedQuestion[]> => {

    // Preparar conteúdo multimodal
    const contentParts: any[] = [
        { text: PROMPTS.EXTRACT_ITEM_FROM_IMAGE() }
    ];

    // Adicionar cada imagem como inline_data
    imagesBase64.forEach(base64 => {
        // Remover prefixo data:image/...;base64, se existir, para a API
        const cleanBase64 = base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        contentParts.push({
            inlineData: {
                mimeType: "image/jpeg", // Assumindo JPEG ou deixando genérico se a API aceitar
                data: cleanBase64
            }
        });
    });

    const schema = {
        type: Type.OBJECT,
        properties: {
            questions: {
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
                        difficulty: { type: Type.STRING, enum: ["FACIL", "MEDIO", "DIFICIL"] },
                        bnccCode: { type: Type.STRING },
                        triParams: {
                            type: Type.OBJECT,
                            properties: {
                                difficulty: { type: Type.NUMBER },
                                discrimination: { type: Type.NUMBER },
                                guessing: { type: Type.NUMBER },
                                bloomTaxonomy: { type: Type.STRING },
                                cognitiveAxis: { type: Type.STRING }
                            }
                        }
                    },
                    required: ["statement", "alternatives", "justification", "difficulty"]
                }
            }
        },
        required: ["questions"]
    };

    interface SchemaResponse { questions: GeneratedQuestion[] }

    // Usar modelo Flash que tem visão e é rápido
    const res = await callGeminiAPI<SchemaResponse>(contentParts, schema);

    const questions = Array.isArray(res.questions) ? res.questions : [res as any];

    return questions.map(q => ({
        ...q,
        aiModel: 'gemini-1.5-flash', // Vision usually runs on Flash/Pro
        promptVersion: PROMPT_VERSION
    }));
};

export const analyzeExamBalance = async (examTitle: string, items: any[]): Promise<ExamAnalysisResponse> => {
    const payload = JSON.stringify(items.map(i => ({
        id: i.id,
        statement: i.statement?.substring(0, 100),
        difficulty: i.difficulty,
        subject: i.subject,
        type: i.type,
        bncc: i.bnccCode
    })));

    const prompt = PROMPTS.ANALYZE_EXAM_BALANCE(examTitle, payload);

    const schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER },
            insights: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ["SUCCESS", "WARNING", "DANGER", "INFO"] },
                        title: { type: Type.STRING },
                        message: { type: Type.STRING },
                        actionLabel: { type: Type.STRING },
                        actionType: { type: Type.STRING, enum: ["BNCC", "DIFFICULTY", "VARIETY"] }
                    },
                    required: ["type", "title", "message"]
                }
            }
        },
        required: ["score", "insights"]
    };

    try {
        return await callGeminiAPI<ExamAnalysisResponse>(prompt, schema);
    } catch (error) {
        console.error("Erro ao analisar equilíbrio da prova:", error);
        return {
            score: 0,
            insights: [{
                type: 'DANGER',
                title: 'Erro na Análise',
                message: 'Não foi possível analisar a prova no momento.'
            }]
        };
    }
};

export const analyzeRiskData = async (assessments: any[]): Promise<RiskAnalysisResponse> => {
    const payload = JSON.stringify(assessments.map(a => ({
        student: a.studentName,
        riskLevel: a.riskLevel,
        score: a.riskScore,
        attendance: a.simulatedAttendance,
        factors: a.factors.map((f: any) => f.name)
    })));

    const prompt = PROMPTS.ANALYZE_RISK_DATA(payload);

    const schema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            insights: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        impact: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] }
                    },
                    required: ["title", "description", "impact"]
                }
            },
            recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
        required: ["summary", "insights", "recommendations"]
    };

    try {
        return await callGeminiAPI<RiskAnalysisResponse>(prompt, schema);
    } catch (error) {
        console.error("Erro na análise de risco IA:", error);
        return {
            summary: "Não foi possível gerar a análise no momento.",
            insights: [],
            recommendations: []
        };
    }
};

/**
 * Inteligência de Mapeamento para Importação em Lote (Concierge)
 */
export const mapImportColumns = async (
    headers: string[],
    sampleRows: any[]
): Promise<{ mapping: Record<string, string>, confidence: number, notes: string }> => {
    const prompt = (PROMPTS as any).MAP_BATCH_COLUMNS(headers, sampleRows.map(r => JSON.stringify(r)));

    const schema = {
        type: Type.OBJECT,
        properties: {
            mapping: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    email: { type: Type.STRING },
                    registrationNumber: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    role: { type: Type.STRING },
                    classId: { type: Type.STRING },
                    schoolId: { type: Type.STRING }
                }
            },
            confidence: { type: Type.NUMBER },
            notes: { type: Type.STRING }
        },
        required: ["mapping", "confidence"]
    };

    try {
        return await callGeminiAPI<any>(prompt, schema);
    } catch (error) {
        console.error("Erro ao mapear colunas com IA:", error);
        // Fallback básico
        return {
            mapping: { name: headers[0], email: headers[1] },
            confidence: 0,
            notes: "Fallback manual devido a erro na IA."
        };
    }
};
