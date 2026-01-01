import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isSignUp, setIsSignUp] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("LOGIN PAGE VERSION: 2025-12-31 - FIX LOGO"); // Cache Buster
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;

                // Success Sign Up
                alert("Cadastro realizado com sucesso! \n\nSe o login não ocorrer automaticamente, utilize suas credenciais para entrar.");
                setIsSignUp(false); // Switch to login mode automatically
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;

                if (data.session) {
                    console.log("Login Successful:", data.user?.email);
                    // Force a check/redirect if App.tsx listener lags
                    window.location.hash = '/';
                }
            }
        } catch (err: any) {
            console.error("Login Error:", err);

            // --- EMERGENCY FALLBACK: Mock Login se Supabase falhar ---
            if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('network')) && email === 'eldastito@gmail.com') {
                console.warn("⚠️ MOCK LOGIN ATIVADO: Falha na conexão com Supabase. Permitindo acesso administrativo.");
                alert("⚠️ AVISO: Acesso em Modo de Compatibilidade (Mock)\n\nNão foi possível conectar ao banco de dados. Você está acessando uma versão local/offline.");

                // Simula sessão válida
                window.location.hash = '/';
                return;
            }
            // ---------------------------------------------------------

            setError(err.message || 'Falha na autenticação. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1d2e] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header / Logo */}
                <div className="text-center mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
                    <img
                        src="/examepad_logo.png"
                        alt="ExamePad"
                        className="h-20 md:h-28 mb-4 object-contain hover:scale-105 transition-transform drop-shadow-2xl"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            // Show the fallback sibling
                            const fallback = document.getElementById('logo-fallback');
                            if (fallback) fallback.style.display = 'flex';
                        }}
                    />
                    {/* Fallback Element (Hidden by default) */}
                    <div id="logo-fallback" style={{ display: 'none' }} className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-brand-primary to-emerald-500 rounded-2xl mb-6 items-center justify-center shadow-xl shadow-brand-primary/20">
                        <span className="text-3xl md:text-4xl font-black text-white tracking-widest">E</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">ExamePad</h1>
                    <p className="text-sm md:text-base text-slate-400 font-medium tracking-wide">Acesso Administrativo</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-6 md:p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500">
                    {/* ... (rest of the form remains same, mostly) ... */}

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm flex items-start gap-3">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-mail Corporativo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-primary transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-xl py-4 pl-12 pr-4 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-slate-600"
                                    placeholder="admin@escola.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Senha</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-primary transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-900/80 border border-slate-600 text-white rounded-xl py-4 pl-12 pr-4 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-brand-primary to-brand-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Processed...
                                </>
                            ) : (
                                <>
                                    {isSignUp ? 'Criar Conta' : 'Entrar na Plataforma'}
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                            className="text-sm font-bold text-brand-primary hover:text-emerald-400 transition-colors"
                        >
                            {isSignUp ? 'Já tem conta? Voltar para Login' : 'Não tem conta? Cadastrar-se (Primeiro Acesso)'}
                        </button>
                        {!isSignUp && <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Esqueceu sua senha?</a>}
                    </div>
                </div>

                <p className="text-center text-slate-500 text-xs mt-8 opacity-60">
                    &copy; 2024 ExamePad SaaS. Sistema Seguro.
                </p>

            </div>
        </div>
    );
};
