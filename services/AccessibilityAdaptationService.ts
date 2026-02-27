import { generateContent } from './geminiService';

export interface AccessibilityConfig {
    fontFamily: string;
    fontSizeBase: number;
    titleSize: number;
    lineSpacing: number;
    theme: 'light' | 'dark' | 'sepia' | 'high-contrast';
    readingSpeed?: number;
    textToSpeech?: boolean;
    librasVideoUrl?: string | null;
    letterSpacing?: number;
}

export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
    fontFamily: 'helvetica',
    fontSizeBase: 10,
    titleSize: 14,
    lineSpacing: 1.15,
    theme: 'light',
    readingSpeed: 1,
    textToSpeech: false,
    librasVideoUrl: null,
    letterSpacing: 0
};

const PROMPT_ACCESSIBILITY_ADAPTATION = (specialNeeds: string[]) => `
    Você é um Especialista em Educação Especial e Adaptação de Materiais Didáticos.
    Sua tarefa é definir os parâmetros ideais de tipografia e layout para um documento PDF, 
    visando a máxima acessibilidade para um aluno com as seguintes necessidades/condições:
    
    PERFIL DO ALUNO: ${specialNeeds.join(', ')}

    REGRAS DE ADAPTAÇÃO:
    - DISLEXIA: font 'courier' ou similar sem serifa pesada, espaçamento entre linhas (lineSpacing) maior (ex: 1.5 a 1.8), letterSpacing leve.
    - TDAH: font clara 'helvetica', fontSizeBase moderado (12), espaçamento (lineSpacing) alto para evitar blocos densos (1.5).
    - VISUAL / BAIXA VISÃO: fontSizeBase grande (14 a 18), titleSize (18 a 22), lineSpacing (1.3 a 1.5).
    - TEA (Transtorno do Espectro Autista): fonts consolidadas, sem excessos, espaçamento limpo (1.3).
    - GERAL / NEUROTÍPICO: helvetica, fontSizeBase 10, lineSpacing 1.15.

    Caso haja múltiplas condições (ex: TDAH e VISUAL), combine as regras priorizando o aspecto mais limitante (no caso, aumentar a fonte pela baixa visão).

    RETORNO ESPERADO (Apenas JSON, sem markdown extras):
    {
        "fontFamily": "helvetica" | "courier" | "times",
        "fontSizeBase": number,
        "titleSize": number,
        "lineSpacing": number,
        "theme": "light" | "high-contrast" | "sepia",
        "letterSpacing": number
    }
`;

export class AccessibilityAdaptationService {
    /**
     * Usa IA para recomendar a formatação ideal do documento (PDF ou UI) 
     * com base nas necessidades especiais do perfil do aluno.
     */
    static async getDynamicPdfStyles(specialNeeds: string[]): Promise<AccessibilityConfig> {
        if (!specialNeeds || specialNeeds.length === 0) {
            return DEFAULT_ACCESSIBILITY_CONFIG;
        }

        try {
            const prompt = PROMPT_ACCESSIBILITY_ADAPTATION(specialNeeds);
            const response = await generateContent(prompt);

            // O geminiService.generateContent tenta fazer parse de JSON nativamente em alguns métodos, 
            // mas como é texto cru (string), nós precisamos converter ou confiar no que foi programado na skill.
            // Para maior robustez, validamos o response aqui usando RegEx ou tentativa de parse direto.

            try {
                // Tentar extrair json se vier com blocos de markdown ```json ... ```
                let jsonStr = response;
                const match = jsonStr.match(/```json\n([\s\S]*?)\n```/);
                if (match) {
                    jsonStr = match[1];
                }
                const parsed = JSON.parse(jsonStr) as Partial<AccessibilityConfig>;

                return {
                    fontFamily: parsed.fontFamily || DEFAULT_ACCESSIBILITY_CONFIG.fontFamily,
                    fontSizeBase: parsed.fontSizeBase || DEFAULT_ACCESSIBILITY_CONFIG.fontSizeBase,
                    titleSize: parsed.titleSize || DEFAULT_ACCESSIBILITY_CONFIG.titleSize,
                    lineSpacing: parsed.lineSpacing || DEFAULT_ACCESSIBILITY_CONFIG.lineSpacing,
                    theme: parsed.theme || DEFAULT_ACCESSIBILITY_CONFIG.theme,
                    letterSpacing: parsed.letterSpacing || DEFAULT_ACCESSIBILITY_CONFIG.letterSpacing,
                    readingSpeed: 1,
                    textToSpeech: false,
                    librasVideoUrl: null
                };

            } catch (parseError) {
                console.warn("[AccessibilityAdaptationSkill] Falha ao fazer parse do JSON do modelo, caindo para fallback.", parseError);
                return this.getFallbackStyles(specialNeeds);
            }

        } catch (error) {
            console.error("[AccessibilityAdaptationSkill] Falha ao chamar a IA:", error);
            return this.getFallbackStyles(specialNeeds);
        }
    }

    /**
     * Fallback local offline/rápido caso a IA falhe.
     */
    private static getFallbackStyles(needs: string[]): AccessibilityConfig {
        const needsUpper = needs.map(n => n.toUpperCase());

        if (needsUpper.includes('VISUAL')) {
            return { ...DEFAULT_ACCESSIBILITY_CONFIG, fontSizeBase: 16, titleSize: 20, lineSpacing: 1.5, theme: 'high-contrast' };
        }
        if (needsUpper.includes('DISLEXIA')) {
            return { ...DEFAULT_ACCESSIBILITY_CONFIG, fontSizeBase: 12, titleSize: 16, lineSpacing: 1.6, fontFamily: 'courier' };
        }
        if (needsUpper.includes('TDAH') || needsUpper.includes('TEA')) {
            return { ...DEFAULT_ACCESSIBILITY_CONFIG, fontSizeBase: 12, titleSize: 16, lineSpacing: 1.4, fontFamily: 'helvetica' };
        }
        return DEFAULT_ACCESSIBILITY_CONFIG;
    }
}
