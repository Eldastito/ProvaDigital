
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SEGURA (Variáveis de Ambiente) ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DEBUG: Log das variáveis (mascarando a key por segurança)
console.log('🔧 Supabase Config:', {
    url: SUPABASE_URL,
    keyPresent: !!SUPABASE_KEY,
    keyLength: SUPABASE_KEY?.length || 0,
    keyPrefix: SUPABASE_KEY?.substring(0, 10) + '...',
    env: import.meta.env.MODE
});

// Validação: Garantir que as variáveis estão configuradas
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
    console.error('📝 Crie o arquivo .env.local baseado em .env.example');
    console.error('🔍 Variáveis recebidas:', {
        VITE_SUPABASE_URL: SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: SUPABASE_KEY ? '[PRESENTE]' : '[AUSENTE]'
    });
    throw new Error('Supabase credentials missing. Check .env.local file or build arguments.');
}

// Validar formato da URL
if (!SUPABASE_URL.startsWith('https://')) {
    console.error('❌ ERRO: URL do Supabase inválida!', SUPABASE_URL);
    throw new Error('Supabase URL must start with https://');
}

console.log('✅ Criando cliente Supabase para:', SUPABASE_URL);

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper para verificar conexão e listar tabelas ativas (Debug)
export const checkConnection = async () => {
    try {
        console.log("🔌 Iniciando conexão com Supabase...");
        const { data, error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("❌ Erro Supabase:", error.message);
            return false;
        }

        console.log("✅ Supabase Conectado! Tenants disponíveis.");
        return true;
    } catch (e) {
        console.warn("⚠️ Falha crítica na conexão Supabase:", e);
        return false;
    }
};
