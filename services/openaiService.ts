/**
 * OpenAI Service - Geração de Imagens (DALL-E 3)
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

const getApiKey = (): string | undefined => {
    // @ts-ignore
    return import.meta.env?.VITE_OPENAI_API_KEY;
};

export interface GeneratedImage {
    url: string;
    revisedPrompt: string;
}

/**
 * Gera uma imagem usando DALL-E 3
 * @param prompt O descritivo da imagem (gerado previamente pelo Gemini)
 */
export const generateDalleImage = async (prompt: string): Promise<GeneratedImage | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn("[OpenAIService] API Key não encontrada. Use VITE_OPENAI_API_KEY.");
        return null;
    }

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard", // "hd" costs more
                response_format: "url"
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || response.statusText);
        }

        const data = await response.json();
        const result = data.data[0];

        return {
            url: result.url,
            revisedPrompt: result.revised_prompt
        };

    } catch (error: any) {
        console.error("[OpenAIService] Erro ao gerar imagem:", error);
        // Expor erro global para diagnóstico se necessário
        (globalThis as any).LAST_OPENAI_ERROR = error.message;
        throw error;
    }
};
