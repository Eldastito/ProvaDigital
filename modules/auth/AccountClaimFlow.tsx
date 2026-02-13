import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Mail,
    KeyRound,
    CheckCircle2,
    Loader2,
    Lock,
    ArrowRight,
    Fingerprint,
    UserCheck,
    AlertCircle
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { enrollmentService } from '../../services/enrollmentService';

interface AccountClaimFlowProps {
    email: string;
    onSuccess: () => void;
    onCancel: () => void;
}

type ClaimStep = 'IDENTIFY' | 'VERIFY_OTP' | 'SET_PASSWORD' | 'SUCCESS';

export const AccountClaimFlow = ({ email: initialEmail, onSuccess, onCancel }: AccountClaimFlowProps) => {
    const [step, setStep] = useState<ClaimStep>('IDENTIFY');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fields
    const [email, setEmail] = useState(initialEmail);
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [otp, setOtp] = useState('');

    // Password Fields
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleIdentify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. KBA: Verificar se o número de matrícula coincide na tabela pública
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, status')
                .eq('email', email)
                .eq('registration_number', registrationNumber)
                .single();

            if (userError || !user) {
                throw new Error("Identidade não confirmada para este e-mail. Verifique a matrícula.");
            }

            if (user.status === 'ACTIVE') {
                throw new Error("Esta conta já está ativa. Tente fazer login normalmente.");
            }

            // 2. Disparar OTP Real via Supabase Auth
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true // Garante que será criado no Auth se for importado apenas no DB
                }
            });

            if (otpError) throw otpError;

            setStep('VERIFY_OTP');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 3. Validar OTP contra o servidor
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });

            if (verifyError) throw verifyError;

            // Se passou, o usuário já está logado na sessão autêntica
            setStep('SET_PASSWORD');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        setLoading(true);
        try {
            // 4. Definir senha definitiva
            const { error: pwdError } = await supabase.auth.updateUser({
                password: password
            });

            if (pwdError) throw pwdError;

            // 5. Ativar no banco público
            const { error: activeError } = await supabase
                .from('users')
                .update({ status: 'ACTIVE' })
                .eq('email', email);

            if (activeError) throw activeError;

            setStep('SUCCESS');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">

                {/* Top Banner */}
                <div className="bg-indigo-600 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Resgate de Conta</h2>
                    <p className="text-indigo-100 text-sm font-medium opacity-80">Segurança Educacional Ativa</p>
                </div>

                <div className="p-8">
                    {step === 'IDENTIFY' && (
                        <form onSubmit={handleIdentify} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Seu E-mail Institucional/Cadastrado</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-bold"
                                        placeholder="voce@escola.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Número de Matrícula (KBA)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Fingerprint size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={registrationNumber}
                                        onChange={(e) => setRegistrationNumber(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-mono"
                                        placeholder="Ex: MUN2024ABCD"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 ml-1 italic">* Identidade fornecida pela sua instituição para validar seu acesso.</p>
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border border-rose-100">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Verificar Matrícula e Enviar E-mail"}
                                <ArrowRight size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={onCancel}
                                className="w-full text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
                            >
                                Cancelar Resgate
                            </button>
                        </form>
                    )}

                    {step === 'VERIFY_OTP' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                                <p className="text-xs font-bold text-indigo-700">Enviamos um código para seu e-mail!</p>
                                <p className="text-[10px] text-indigo-500">{email}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Código de 6 Dígitos</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <KeyRound size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-center tracking-[0.5em] font-black"
                                        placeholder="000000"
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border border-rose-100">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Validar Código"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('IDENTIFY')}
                                className="w-full text-slate-400 text-sm font-bold"
                            >
                                Voltar
                            </button>
                        </form>
                    )}

                    {step === 'SET_PASSWORD' && (
                        <form onSubmit={handleFinalize} className="space-y-6">
                            <div className="text-center mb-6">
                                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-slate-900">Identidade Confirmada</h3>
                                <p className="text-slate-500 text-sm">Agora, defina sua senha de acesso definitiva.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nova Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-600 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Confirmar Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-600 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Finalizar e Acessar"}
                            </button>
                        </form>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center py-12 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} className="text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Conta Ativada!</h3>
                            <p className="text-slate-500 mb-8">
                                Pronto! Sua conta foi resgatada com sucesso. Você já pode utilizar todas as ferramentas do ExamePad.
                            </p>
                            <button
                                onClick={onSuccess}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all"
                            >
                                Ir para o Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
