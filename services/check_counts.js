
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
    const tables = ['tenants', 'schools', 'classes', 'users', 'students', 'items', 'exams', 'exam_results'];
    console.log('--- TABLE COUNTS ---');
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`${table}: ERROR - ${error.message}`);
        } else {
            console.log(`${table}: ${count} records`);
        }
    }
    process.exit(0);
}

checkCounts();
