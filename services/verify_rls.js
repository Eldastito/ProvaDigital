
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRLS() {
    console.log('🔍 Verificando Acessibilidade após Atualização do Schema...');

    // 1. Testar se a tabela students agora é legível (RLS 'Read students' para 'authenticated')
    // Nota: Como o script usa a anon key sem login, ele pode retornar vazio se o Supabase
    // for rigoroso com 'authenticated', mas vamos ver o que ele retorna.
    const { data: students, error: studentsError, count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: false });

    if (studentsError) {
        console.error('❌ Erro ao ler tabela (students):', studentsError.message);
    } else {
        console.log(`✅ Tabela students acessível! (${students?.length || 0} registros encontrados)`);
    }

    // 2. Testar exam_results
    const { data: results, error: resultsError } = await supabase
        .from('exam_results')
        .select('*')
        .limit(1);

    if (resultsError) {
        console.log('ℹ️ Acesso a exam_results restrito (esperado para anon):', resultsError.message);
    } else {
        console.log('✅ Tabela exam_results acessível! Registros:', results?.length || 0);
    }

    // 3. Testar users
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(5);

    if (usersError) {
        console.error('❌ Erro ao ler tabela (users):', usersError.message);
    } else {
        console.log('✅ Tabela users acessível! Usuários encontrados:', users?.length || 0);
        if (users && users.length > 0) {
            console.log('Amostra de usuários:', users.map(u => ({ email: u.email, role: u.role })));
        }
    }

    process.exit(0);
}

verifyRLS();
