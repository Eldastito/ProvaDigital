
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('URL length:', supabaseUrl.length);
console.log('Key length:', supabaseKey.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    const email = 'eldastito@gmail.com';
    console.log('--- START DIAGNOSTIC ---');
    console.log('Email:', email);

    console.log('Fetching user...');
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, role, children_ids')
        .eq('email', email);

    console.log('Query finished.');

    if (userError) {
        console.error('Error:', userError.message);
        return;
    }

    if (!user || user.length === 0) {
        console.log('No user found with this email.');
        return;
    }

    const u = user[0];
    console.log('Found:', u.name, '[', u.id, ']');
    console.log('Role:', u.role);
    console.log('Children IDs:', u.children_ids);
    console.log('Children IDs Type:', typeof u.children_ids);

    if (u.children_ids && u.children_ids.length > 0) {
        console.log('Attempting to fetch students...');
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select('id, name')
            .in('id', u.children_ids);

        if (studentError) {
            console.error('Student Error:', studentError.message);
        } else {
            console.log('Students Found:', students.length);
            students.forEach(s => console.log(' -', s.name, '(', s.id, ')'));
        }
    }

    console.log('--- END DIAGNOSTIC ---');
    process.exit(0);
}

inspectData().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
