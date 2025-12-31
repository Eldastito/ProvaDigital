import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Auth state change will be caught by App.tsx listener
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Falha ao realizar login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1d2e] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header / Logo */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-brand-primary/20 rotate-3 hover:rotate-6 transition-transform">
                        <span className="text-3xl font-black text-white tracking-widest">E</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">ExamePad</h1>
                    <p className="text-slate-400 font-medium tracking-wide">Acesso Administrativo</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500">

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
                                    Autenticando...
                                </>
                            ) : (
                                <>
                                    Entrar na Plataforma
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Esqueceu sua senha?</a>
                    </div>
                </div>

                <p className="text-center text-slate-500 text-xs mt-8 opacity-60">
                    &copy; 2024 ExamePad SaaS. Sistema Seguro.
                </p>

            </div>
        </div>
    );
};
