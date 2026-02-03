
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    fs.writeFileSync('curl_log.txt', "NO KEY");
    process.exit(1);
}

// Using v1beta as per the error message from the SDK
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Fetching via RAW HTTP...`);

async function run() {
    try {
        const res = await fetch(url);
        const data = await res.json();
        const output = {
            status: res.status,
            statusText: res.statusText,
            data: data
        };
        fs.writeFileSync('curl_log.txt', JSON.stringify(output, null, 2));
        console.log("Result saved to curl_log.txt");
    } catch (e: any) {
        fs.writeFileSync('curl_log.txt', `FETCH ERROR: ${e.message}`);
    }
}

run();
