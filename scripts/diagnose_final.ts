
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    fs.writeFileSync('final_log.txt', "❌ NO API KEY FOUND");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function diagnose() {
    try {
        console.log("Listing models...");
        const response = await ai.models.list();

        let models: any[] = [];
        // Handle different response structures from different SDK versions
        if (Array.isArray(response)) {
            models = response;
        } else if ((response as any).models) {
            models = (response as any).models;
        } else if ((response as any).data) { // Some versions wrap in data
            models = (response as any).data;
        }

        const modelNames = models.map((m: any) => m.name || m.id).join('\n');

        fs.writeFileSync('final_log.txt', `✅ MODELS AVAILABLE:\n${modelNames}`);
        console.log("Log written to final_log.txt");

    } catch (e: any) {
        fs.writeFileSync('final_log.txt', `❌ ERROR LISTING MODELS: ${e.message}\nJSON: ${JSON.stringify(e)}`);
        console.error("Error:", e.message);
    }
}

diagnose();
