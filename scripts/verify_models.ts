
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const apiKey = "AIzaSyDv0eOvpTMnOWwXRo9XiSEWI7C5SccsuFQ";

if (!apiKey) {
    console.error("API Key not found!");
    process.exit(1);
}

async function diagnose() {
    const v = 'v1beta';
    try {
        console.log(`\n--- Testing Version: ${v} ---`);
        const ai = new GoogleGenAI({ apiKey, apiVersion: v });

        console.log("Attempting direct generation with gemini-1.5-flash...");
        const result = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: 'user', parts: [{ text: "Diga 'OK' se você estiver funcionando." }] }]
        });

        const text = (result as any).text || result.response?.text?.() || "SUCCESS (Text not extractable)";
        console.log("SUCCESS! Generation result:", text);

        fs.appendFileSync('api_diagnosis.log', `\nNew Key SUCCESS with ${v}: ${text}\n`);
    } catch (e: any) {
        console.error(`Error on version ${v}:`, e.message);
    }
}

diagnose();
