
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log('--- USER LIST ---');
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, children_ids');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
        console.log(`- [${u.id}] ${u.name} <${u.email}> (${u.role}) Children: ${JSON.stringify(u.children_ids)}`);
    });
    console.log('--- END ---');
    process.exit(0);
}

inspectData().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
