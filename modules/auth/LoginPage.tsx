import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight, Chrome, ShieldCheck } from 'lucide-react';
import { AccountClaimFlow } from './AccountClaimFlow';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isSignUp, setIsSignUp] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimEmail, setClaimEmail] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) throw error;
            // OAuth will redirect, no need to handle success here
        } catch (err: any) {
            console.error("Google Login Error:", err);
            setError('Falha no login com Google. Tente novamente.');
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("LOGIN PAGE VERSION: 2025-12-31 - FIX LOGO"); // Cache Buster
        setLoading(true);
        setError(null);



        try {
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
        } catch (err: any) {
            console.error("Login Error:", err);

            // Mensagens de erro específicas e acionáveis
            let userMessage = 'Falha na autenticação. Tente novamente.';

            if (err.message) {
                if (err.message.includes('Invalid API key')) {
                    userMessage = '⚠️ Erro de Configuração: Chave de API inválida. Entre em contato com o suporte técnico.';
                } else if (err.message.includes('Invalid login credentials')) {
                    userMessage = '❌ Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
                } else if (err.message.includes('Email not confirmed')) {
                    userMessage = '📧 Email não confirmado. Verifique sua caixa de entrada e confirme seu email.';
                } else if (err.message.includes('Failed to fetch') || err.message.includes('network')) {
                    userMessage = '🌐 Erro de conexão. Verifique sua internet e tente novamente.';
                } else if (err.message.includes('User already registered')) {
                    userMessage = '👤 Este email já está cadastrado. Tente fazer login ou recuperar sua senha.';
                } else {
                    // Mostrar mensagem original se não for um erro conhecido
                    userMessage = `❌ ${err.message}`;
                }
            }

            setError(userMessage);
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
                                    Entrar na Plataforma
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-slate-800/50 text-slate-400 font-medium">ou continue com</span>
                            </div>
                        </div>

                        {/* Google OAuth Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:pointer-events-none border-2 border-gray-200"
                        >
                            <Chrome size={20} className="text-blue-600" />
                            <span>Entrar com Google</span>
                        </button>
                    </form>

                    <div className="mt-8 text-center flex flex-col gap-2">
                        {!isClaiming && (
                            <button
                                type="button"
                                onClick={() => { setIsClaiming(true); setClaimEmail(email); }}
                                className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 py-2 rounded-xl border border-indigo-500/20"
                            >
                                <ShieldCheck size={16} />
                                Resgatar Meu Acesso (Importado)
                            </button>
                        )}

                        <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Esqueceu sua senha?</a>
                    </div>
                </div>

                {isClaiming && (
                    <AccountClaimFlow
                        email={claimEmail || email}
                        onSuccess={() => {
                            setIsClaiming(false);
                            alert("Conta ativada! Agora você pode fazer login com sua nova senha.");
                        }}
                        onCancel={() => setIsClaiming(false)}
                    />
                )}

                <p className="text-center text-slate-500 text-xs mt-8 opacity-60">
                    &copy; 2024 ExamePad SaaS. Sistema Seguro.
                </p>

            </div>
        </div>
    );
};
