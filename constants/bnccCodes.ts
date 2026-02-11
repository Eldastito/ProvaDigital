// Base de dados local de códigos BNCC
// Fonte: Base Nacional Comum Curricular (MEC)

export interface BNCCCode {
    code: string;
    description: string;
    subject: string;
    stage: 'EF1' | 'EF2' | 'EM'; // Ensino Fundamental I, II, Ensino Médio
    year: string;
    keywords: string[];
}

// Códigos BNCC de Matemática - Ensino Fundamental Anos Finais
const MATEMATICA_EF2: BNCCCode[] = [
    {
        code: 'EF06MA01',
        description: 'Comparar, ordenar, ler e escrever números naturais e números racionais cuja representação decimal é finita, fazendo uso da reta numérica.',
        subject: 'Matemática',
        stage: 'EF2',
        year: '6º',
        keywords: ['números', 'naturais', 'racionais', 'reta numérica', 'ordenar', 'comparar']
    },
    {
        code: 'EF06MA03',
        description: 'Resolver e elaborar problemas que envolvam cálculos (mentais ou escritos, exatos ou aproximados) com números naturais, por meio de estratégias variadas.',
        subject: 'Matemática',
        stage: 'EF2',
        year: '6º',
        keywords: ['problemas', 'cálculos', 'números naturais', 'estratégias']
    },
    {
        code: 'EF07MA10',
        description: 'Comparar e ordenar números racionais em diferentes contextos e associá-los a pontos da reta numérica.',
        subject: 'Matemática',
        stage: 'EF2',
        year: '7º',
        keywords: ['números racionais', 'ordenar', 'reta numérica', 'comparar']
    },
    {
        code: 'EF08MA01',
        description: 'Efetuar cálculos com potências de expoentes inteiros e aplicar esse conhecimento na representação de números em notação científica.',
        subject: 'Matemática',
        stage: 'EF2',
        year: '8º',
        keywords: ['potências', 'expoentes', 'notação científica', 'cálculos']
    },
    {
        code: 'EF09MA01',
        description: 'Reconhecer que, uma vez fixada uma unidade de comprimento, existem segmentos de reta cujo comprimento não é expresso por número racional.',
        subject: 'Matemática',
        stage: 'EF2',
        year: '9º',
        keywords: ['números irracionais', 'comprimento', 'segmentos', 'racionais']
    },
    {
        code: 'EF09MA09',
        description: 'Compreender os processos de fatoração de expressões algébricas, com base em suas relações com os produtos notáveis.',
        subject: 'Matemática',
        stage: 'EF2',
        year: '9º',
        keywords: ['fatoração', 'expressões algébricas', 'produtos notáveis', 'álgebra']
    }
];

// Códigos BNCC de Português - Ensino Fundamental Anos Finais
const PORTUGUES_EF2: BNCCCode[] = [
    {
        code: 'EF67LP01',
        description: 'Analisar a estrutura e funcionamento dos hiperlinks em textos noticiosos publicados na Web e vislumbrar possibilidades de uma escrita hipertextual.',
        subject: 'Português',
        stage: 'EF2',
        year: '6º-7º',
        keywords: ['hiperlinks', 'textos noticiosos', 'web', 'hipertexto', 'internet']
    },
    {
        code: 'EF67LP08',
        description: 'Identificar os efeitos de sentido devidos à escolha de imagens estáticas, sequenciação ou sobreposição de imagens, definição de figura/fundo, ângulo, profundidade e foco.',
        subject: 'Português',
        stage: 'EF2',
        year: '6º-7º',
        keywords: ['imagens', 'efeitos de sentido', 'visual', 'fotografia', 'composição']
    },
    {
        code: 'EF69LP01',
        description: 'Diferenciar liberdade de expressão de discursos de ódio, posicionando-se contrariamente a esse tipo de discurso e vislumbrando possibilidades de denúncia.',
        subject: 'Português',
        stage: 'EF2',
        year: '6º-9º',
        keywords: ['liberdade de expressão', 'discurso de ódio', 'ética', 'cidadania']
    },
    {
        code: 'EF89LP01',
        description: 'Analisar os interesses que movem o campo jornalístico, os efeitos das novas tecnologias no campo e as condições que fazem da informação uma mercadoria.',
        subject: 'Português',
        stage: 'EF2',
        year: '8º-9º',
        keywords: ['jornalismo', 'tecnologia', 'informação', 'mídia', 'comunicação']
    }
];

// Códigos BNCC de Ciências - Ensino Fundamental Anos Finais
const CIENCIAS_EF2: BNCCCode[] = [
    {
        code: 'EF06CI01',
        description: 'Classificar como homogênea ou heterogênea a mistura de dois ou mais materiais.',
        subject: 'Ciências',
        stage: 'EF2',
        year: '6º',
        keywords: ['misturas', 'homogênea', 'heterogênea', 'materiais', 'classificação']
    },
    {
        code: 'EF06CI05',
        description: 'Explicar a organização básica das células e seu papel como unidade estrutural e funcional dos seres vivos.',
        subject: 'Ciências',
        stage: 'EF2',
        year: '6º',
        keywords: ['células', 'seres vivos', 'organização celular', 'biologia']
    },
    {
        code: 'EF07CI06',
        description: 'Discutir e avaliar mudanças econômicas, culturais e sociais, tanto na vida cotidiana quanto no mundo do trabalho, decorrentes do desenvolvimento de novos materiais e tecnologias.',
        subject: 'Ciências',
        stage: 'EF2',
        year: '7º',
        keywords: ['tecnologia', 'materiais', 'sociedade', 'trabalho', 'mudanças']
    },
    {
        code: 'EF08CI01',
        description: 'Identificar e classificar diferentes fontes (renováveis e não renováveis) e tipos de energia utilizados em residências, comunidades ou cidades.',
        subject: 'Ciências',
        stage: 'EF2',
        year: '8º',
        keywords: ['energia', 'fontes renováveis', 'sustentabilidade', 'recursos']
    },
    {
        code: 'EF09CI05',
        description: 'Investigar os principais mecanismos envolvidos na transmissão e herança de características hereditárias.',
        subject: 'Ciências',
        stage: 'EF2',
        year: '9º',
        keywords: ['genética', 'hereditariedade', 'transmissão', 'características', 'DNA']
    }
];

// Códigos BNCC de História - Ensino Fundamental Anos Finais
const HISTORIA_EF2: BNCCCode[] = [
    {
        code: 'EF06HI01',
        description: 'Identificar diferentes formas de compreensão da noção de tempo e de periodização dos processos históricos.',
        subject: 'História',
        stage: 'EF2',
        year: '6º',
        keywords: ['tempo', 'periodização', 'processos históricos', 'cronologia']
    },
    {
        code: 'EF07HI04',
        description: 'Identificar as principais características dos Humanismos e dos Renascimentos e analisar seus significados.',
        subject: 'História',
        stage: 'EF2',
        year: '7º',
        keywords: ['humanismo', 'renascimento', 'cultura', 'arte', 'europa']
    },
    {
        code: 'EF08HI01',
        description: 'Identificar os principais aspectos conceituais do iluminismo e do liberalismo e discutir a relação entre eles e a organização do mundo contemporâneo.',
        subject: 'História',
        stage: 'EF2',
        year: '8º',
        keywords: ['iluminismo', 'liberalismo', 'filosofia', 'política', 'modernidade']
    },
    {
        code: 'EF09HI01',
        description: 'Descrever e contextualizar os principais aspectos sociais, culturais, econômicos e políticos da emergência da República no Brasil.',
        subject: 'História',
        stage: 'EF2',
        year: '9º',
        keywords: ['república', 'brasil', 'política', 'sociedade', 'proclamação']
    }
];

// Códigos BNCC de Geografia - Ensino Fundamental Anos Finais
const GEOGRAFIA_EF2: BNCCCode[] = [
    {
        code: 'EF06GE01',
        description: 'Comparar modificações das paisagens nos lugares de vivência e os usos desses lugares em diferentes tempos.',
        subject: 'Geografia',
        stage: 'EF2',
        year: '6º',
        keywords: ['paisagens', 'modificações', 'tempo', 'espaço', 'lugares']
    },
    {
        code: 'EF07GE02',
        description: 'Analisar a influência dos fluxos econômicos e populacionais na formação socioeconômica e territorial do Brasil.',
        subject: 'Geografia',
        stage: 'EF2',
        year: '7º',
        keywords: ['fluxos', 'economia', 'população', 'brasil', 'território']
    },
    {
        code: 'EF08GE01',
        description: 'Descrever as rotas de dispersão da população humana pelo planeta e os principais fluxos migratórios em diferentes períodos da história.',
        subject: 'Geografia',
        stage: 'EF2',
        year: '8º',
        keywords: ['migração', 'população', 'dispersão', 'fluxos', 'história']
    },
    {
        code: 'EF09GE01',
        description: 'Analisar criticamente de que forma a hegemonia europeia foi exercida em várias regiões do planeta, notadamente em situações de conflito.',
        subject: 'Geografia',
        stage: 'EF2',
        year: '9º',
        keywords: ['europa', 'hegemonia', 'conflitos', 'colonização', 'poder']
    }
];

// Exportar todos os códigos
export const BNCC_CODES: BNCCCode[] = [
    ...MATEMATICA_EF2,
    ...PORTUGUES_EF2,
    ...CIENCIAS_EF2,
    ...HISTORIA_EF2,
    ...GEOGRAFIA_EF2
];

// Funções auxiliares para busca
export const searchBNCCCodes = (
    query: string,
    filters?: {
        subject?: string;
        stage?: string;
        year?: string;
    }
): BNCCCode[] => {
    const lowerQuery = query.toLowerCase();

    let results = BNCC_CODES.filter(code => {
        // Busca por código, descrição ou keywords
        const matchesQuery =
            code.code.toLowerCase().includes(lowerQuery) ||
            code.description.toLowerCase().includes(lowerQuery) ||
            code.keywords.some(kw => kw.toLowerCase().includes(lowerQuery));

        // Aplicar filtros
        const matchesSubject = !filters?.subject || code.subject === filters.subject;
        const matchesStage = !filters?.stage || code.stage === filters.stage;
        const matchesYear = !filters?.year || code.year === filters.year;

        return matchesQuery && matchesSubject && matchesStage && matchesYear;
    });

    return results;
};

export const getBNCCCodesBySubject = (subject: string): BNCCCode[] => {
    return BNCC_CODES.filter(code => code.subject === subject);
};

export const getAvailableSubjects = (): string[] => {
    return Array.from(new Set(BNCC_CODES.map(code => code.subject)));
};

export const getAvailableYears = (subject?: string): string[] => {
    const codes = subject ? getBNCCCodesBySubject(subject) : BNCC_CODES;
    return Array.from(new Set(codes.map(code => code.year))).sort();
};
