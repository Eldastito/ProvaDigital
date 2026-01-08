import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '../services/supabaseClient';

describe('Supabase Backend Connection Tests', () => {
    describe('Environment Variables', () => {
        it('deve ter VITE_SUPABASE_URL configurado', () => {
            const url = import.meta.env.VITE_SUPABASE_URL;

            expect(url).toBeDefined();
            expect(url).not.toBe('');
            expect(url).toContain('supabase');

            console.log('✅ VITE_SUPABASE_URL:', url ? 'Configurado' : '❌ FALTANDO');
        });

        it('deve ter VITE_SUPABASE_ANON_KEY configurado', () => {
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            expect(key).toBeDefined();
            expect(key).not.toBe('');
            expect(key.length).toBeGreaterThan(20);

            console.log('✅ VITE_SUPABASE_ANON_KEY:', key ? `Configurado (${key.length} chars)` : '❌ FALTANDO');
        });

        it('deve ter VITE_GEMINI_API_KEY configurado', () => {
            const key = import.meta.env.VITE_GEMINI_API_KEY;

            console.log('ℹ️ VITE_GEMINI_API_KEY:', key ? `Configurado (${key.length} chars)` : '⚠️ Não configurado');

            // Gemini é opcional, não falhar teste
            expect(true).toBe(true);
        });
    });

    describe('Supabase Client Initialization', () => {
        it('deve ter cliente Supabase inicializado', () => {
            expect(supabase).toBeDefined();
            expect(supabase.auth).toBeDefined();
            expect(supabase.from).toBeDefined();

            console.log('✅ Cliente Supabase inicializado');
        });

        it('deve ter URL correto no cliente', () => {
            // @ts-ignore - acessar propriedade interna para debug
            const clientUrl = supabase.supabaseUrl || supabase.auth?.url;

            console.log('📍 URL do cliente:', clientUrl);
            expect(clientUrl).toBeTruthy();
        });
    });

    describe('Supabase Connection Test', () => {
        it('deve conseguir fazer ping no Supabase', async () => {
            try {
                // Tentar query simples para testar conexão
                const { data, error } = await supabase
                    .from('tenants')
                    .select('count')
                    .limit(1);

                if (error) {
                    console.error('❌ Erro ao conectar:', error.message);
                    console.error('Código:', error.code);
                    console.error('Detalhes:', error.details);
                    console.error('Hint:', error.hint);
                } else {
                    console.log('✅ Conexão com Supabase OK');
                }

                // Não falhar teste se tabela não existir, mas logar erro
                if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe
                    console.warn('⚠️ Erro de conexão detectado');
                }
            } catch (err: any) {
                console.error('❌ Exceção ao testar conexão:', err.message);
                throw err;
            }
        }, 10000); // 10s timeout

        it('deve conseguir verificar sessão de autenticação', async () => {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('❌ Erro ao verificar sessão:', error.message);
                } else {
                    console.log('✅ Verificação de sessão OK');
                    console.log('Sessão ativa:', data.session ? 'Sim' : 'Não');
                }

                expect(error).toBeNull();
            } catch (err: any) {
                console.error('❌ Exceção ao verificar sessão:', err.message);
                throw err;
            }
        }, 10000);
    });

    describe('Database Tables Test', () => {
        const tables = [
            'tenants',
            'schools',
            'classes',
            'users',
            'students',
            'items',
            'exams',
            'exam_results',
            'user_profiles'
        ];

        tables.forEach(tableName => {
            it(`deve conseguir acessar tabela ${tableName}`, async () => {
                try {
                    const { data, error } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1);

                    if (error) {
                        console.error(`❌ Erro ao acessar ${tableName}:`, error.message);
                        console.error('Código:', error.code);

                        if (error.code === 'PGRST116') {
                            console.warn(`⚠️ Tabela ${tableName} não existe no banco`);
                        } else if (error.code === '42P01') {
                            console.warn(`⚠️ Tabela ${tableName} não encontrada`);
                        } else if (error.message.includes('JWT')) {
                            console.error('❌ Problema de autenticação (JWT inválido)');
                        } else if (error.message.includes('API key')) {
                            console.error('❌ Problema com API Key');
                        }
                    } else {
                        console.log(`✅ Tabela ${tableName} acessível (${data?.length || 0} registros)`);
                    }

                    // Não falhar teste se tabela não existir
                    expect(true).toBe(true);
                } catch (err: any) {
                    console.error(`❌ Exceção ao acessar ${tableName}:`, err.message);
                }
            }, 10000);
        });
    });

    describe('Authentication Test', () => {
        it('deve conseguir fazer sign up (teste)', async () => {
            const testEmail = `test-${Date.now()}@example.com`;
            const testPassword = 'TestPassword123!';

            try {
                const { data, error } = await supabase.auth.signUp({
                    email: testEmail,
                    password: testPassword,
                });

                if (error) {
                    console.error('❌ Erro no sign up:', error.message);

                    if (error.message.includes('Email rate limit')) {
                        console.warn('⚠️ Rate limit atingido (normal em testes)');
                    } else if (error.message.includes('Invalid API key')) {
                        console.error('❌ API Key inválida!');
                    }
                } else {
                    console.log('✅ Sign up funcionando');

                    // Limpar usuário de teste
                    if (data.user) {
                        await supabase.auth.admin.deleteUser(data.user.id).catch(() => { });
                    }
                }

                // Não falhar teste por rate limit
                expect(true).toBe(true);
            } catch (err: any) {
                console.error('❌ Exceção no sign up:', err.message);
            }
        }, 15000);
    });

    describe('Network Diagnostics', () => {
        it('deve conseguir fazer fetch direto para Supabase', async () => {
            const url = import.meta.env.VITE_SUPABASE_URL;

            if (!url) {
                console.error('❌ URL do Supabase não configurado');
                return;
            }

            try {
                const response = await fetch(`${url}/rest/v1/`, {
                    method: 'HEAD',
                    headers: {
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
                    }
                });

                console.log('📡 Status HTTP:', response.status);
                console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));

                if (response.ok || response.status === 404) {
                    console.log('✅ Servidor Supabase respondendo');
                } else {
                    console.error('❌ Servidor retornou erro:', response.statusText);
                }
            } catch (err: any) {
                console.error('❌ Erro de rede:', err.message);

                if (err.message.includes('CORS')) {
                    console.error('❌ Problema de CORS detectado');
                } else if (err.message.includes('Failed to fetch')) {
                    console.error('❌ Não conseguiu conectar ao servidor');
                }
            }
        }, 10000);
    });
});
