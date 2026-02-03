
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Fallback if .env.local didn't load (common in some environments)
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

console.log("---------------------------------------------------");
console.log("🔍 DIAGNÓSTICO GEMINI API");
console.log("---------------------------------------------------");
console.log(`🔑 Chave Encontrada: ${apiKey ? 'SIM (' + apiKey.substring(0, 5) + '...)' : 'NÃO'}`);

if (!apiKey) {
    console.error("❌ ERRO: Nenhuma chave de API encontrada.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function checkModels() {
    try {
        console.log("📡 Conectando ao Google para listar modelos...");
        const response = await ai.models.list();

        console.log("✅ Conexão bem-sucedida!");
        console.log("📋 Modelos Disponíveis:");

        const models = (response as any).models || response;

        if (Array.isArray(models)) {
            const logContent = models.map((m: any) => `   - ${m.name} (${m.version || 'v?'})`).join('\n');
            require('fs').writeFileSync('models_log.txt', logContent);
            console.log("✅ Models saved to models_log.txt");
        } else {
            console.log("Format not array:", models);
        }

    } catch (error: any) {
        require('fs').appendFileSync('models_log.txt', `❌ ERRO: ${error.message}\n`);
        console.error("❌ ERRO AO LISTAR MODELOS:", error.message);
    }
}

checkModels();
