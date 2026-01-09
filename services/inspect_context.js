
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectContext() {
    console.log('--- DB DATA ---');

    const { data: tenants } = await supabase.from('tenants').select('id, name');
    console.log('Tenants:', tenants);

    const { data: students } = await supabase.from('students').select('id, name, tenant_id');
    console.log('Students:', students);

    process.exit(0);
}

inspectContext();
