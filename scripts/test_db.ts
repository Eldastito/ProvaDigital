
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not found!");
    process.exit(1);
}

async function testDB() {
    console.log("Testing Supabase connection...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase.from('schools').select('id').limit(1);
        if (error) {
            console.error("Database connection failed:", error.message);
            fs.appendFileSync('api_diagnosis.log', `\nDatabase ERROR: ${error.message}\n`);
        } else {
            console.log("Database connection successful! Data retrieved:", data);
            fs.appendFileSync('api_diagnosis.log', `\nDatabase SUCCESS: Connection verified.\n`);
        }
    } catch (e: any) {
        console.error("Unexpected database error:", e.message);
        fs.appendFileSync('api_diagnosis.log', `\nDatabase UNEXPECTED ERROR: ${e.message}\n`);
    }
}

testDB();
