
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DE PRODUÇÃO ---
const SUPABASE_URL = 'https://donwkyyrqydogtgyzcar.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbndreXlycXlkb2d0Z3l6Y2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTEwMDgsImV4cCI6MjA4MDg2NzAwOH0.dRLPfDpWPqjdRGpa0FeP-qj2zJ5CFYROt3y2U6ql2Po';

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
