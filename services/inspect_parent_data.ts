
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    const email = 'eldastito@gmail.com';
    console.log(`🔍 Inspecting data for user: ${email}`);

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (userError) {
        console.error('❌ User not found or error:', userError);
        return;
    }

    console.log('✅ User id:', user.id);
    console.log('✅ User name:', user.name);
    console.log('✅ User role:', user.role);
    console.log('✅ User children_ids:', user.children_ids);

    if (user.children_ids && Array.isArray(user.children_ids) && user.children_ids.length > 0) {
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select('id, name')
            .in('id', user.children_ids);

        if (studentError) {
            console.error('❌ Error fetching students:', studentError);
        } else {
            console.log(`✅ Found ${students?.length || 0} students for these IDs:`);
            students?.forEach(s => console.log(`   - [${s.id}] ${s.name}`));
        }
    } else {
        console.log('⚠️ No children_ids linked to this user (NULL or empty array).');
    }
}

inspectData().catch(err => console.error(err));
