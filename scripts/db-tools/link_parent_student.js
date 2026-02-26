
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function linkParentToStudents() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Uso: node services/link_parent_student.js <email_do_pai> <id_aluno_1> [id_aluno_2] ...');
        console.log('Exemplo: node services/link_parent_student.js eldastito@gmail.com 02639b80-6a72-428b-8671-51d3ceaac9d2');
        process.exit(1);
    }

    const parentEmail = args[0];
    const studentIds = args.slice(1);

    console.log(`🔗 Vinculando Pai (${parentEmail}) aos Alunos:`, studentIds);

    // 1. Buscar o ID do usuário pelo email (ou criar um mock se soubermos o ID externo)
    // Nota: Para criar, idealmente o usuário já deve ter feito login uma vez
    // ou precisamos do ID do Supabase Auth. 
    // Se o usuário não existir, vamos tentar encontrar um aluno para pegar o tenant_id.

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, children_ids')
        .eq('email', parentEmail);

    if (userError || !user || user.length === 0) {
        console.error('❌ Usuário não encontrado no banco público.');
        console.log('   Dica: Peça para o usuário fazer login uma vez ou use o Dashboard para ver o ID.');
        process.exit(1);
    }

    const targetUser = user[0];
    console.log(`✅ Usuário encontrado: ${targetUser.name} (${targetUser.id})`);

    // 2. Atualizar a coluna children_ids (mesclando se necessário ou substituindo)
    const newChildrenIds = [...new Set([...(targetUser.children_ids || []), ...studentIds])];

    const { error: updateError } = await supabase
        .from('users')
        .update({ children_ids: newChildrenIds })
        .eq('id', targetUser.id);

    if (updateError) {
        console.error('❌ Erro ao atualizar vínculos:', updateError.message);
        process.exit(1);
    }

    console.log('🚀 Sucesso! Os alunos foram vinculados ao perfil do responsável.');
    console.log('   Dica: Recarregue o Dashboard para ver os novos dados.');
    process.exit(0);
}

linkParentToStudents().catch(err => {
    console.error('💥 Erro fatal:', err);
    process.exit(1);
});
