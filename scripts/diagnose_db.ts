
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env locally
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL;
const SUPABASE_KEY = envConfig.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Credentials missing in .env.local");
    process.exit(1);
}

console.log(`🔌 Connecting to ${SUPABASE_URL}...`);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tablesToCheck = [
    'users',
    'tenants',
    'schools',
    'students',
    'classes',
    'items',
    'exams',
    'exam_results',
    'risk_alerts',
    'audit_logs'
];

async function diagnose() {
    console.log("🔍 Diagnosing Tables...");

    for (const table of tablesToCheck) {
        process.stdout.write(`Checking '${table}'... `);
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ ERROR: ${error.message} (Code: ${error.code})`);
            if (error.code === '42P01') {
                console.log(`   -> Table '${table}' DOES NOT EXIST.`);
            }
        } else {
            console.log(`✅ OK (Count: ${data})`);
        }
    }

    // Check RLS on 'users' by trying to read without auth (should fail or return 0 if RLS is strict, but public anon read might be allowed depending on logic)
    // Actually, checking if we can read tenants is a good proxy for connection health.
}

diagnose();
