
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SEGURA (Variáveis de Ambiente) ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação: Garantir que as variáveis estão configuradas
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
    console.error('📝 Crie o arquivo .env.local baseado em .env.example');
    throw new Error('Supabase credentials missing. Check .env.local file.');
}

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
