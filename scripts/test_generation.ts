
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ NO KEY");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Testing BOTH models to see which one works
const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-pro', 'gemini-1.0-pro'];

async function test() {
    console.log("🚀 Testing Models...");

    for (const modelName of modelsToTest) {
        console.log(`\nTesting: ${modelName} ...`);
        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts: [{ text: "Say hello" }] }]
            });
            require('fs').appendFileSync('test_results.txt', `✅ SUCCESS with ${modelName}\n`);
            console.log(`✅ SUCCESS with ${modelName}`);
        } catch (e: any) {
            require('fs').appendFileSync('test_results.txt', `❌ FAILED with ${modelName}: ${e.message}\n`);
            console.error(`❌ FAILED with ${modelName}:`, e.message);
        }
    }
}

test();
