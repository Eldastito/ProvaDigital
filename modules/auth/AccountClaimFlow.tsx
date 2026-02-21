import React, { useState } from 'react';
import {
    ShieldCheck,
    Mail,
    KeyRound,
    CheckCircle2,
    Loader2,
    Lock,
    ArrowRight,
    Fingerprint,
    AlertCircle,
    User,
    CalendarSearch
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface AccountClaimFlowProps {
    email: string;
    onSuccess: () => void;
    onCancel: () => void;
}

type ClaimStep = 'IDENTIFY_EMAIL' | 'VERIFY_KBA' | 'VERIFY_OTP' | 'SET_PASSWORD' | 'SUCCESS';

export const AccountClaimFlow = ({ email: initialEmail, onSuccess, onCancel }: AccountClaimFlowProps) => {
    const [step, setStep] = useState<ClaimStep>('IDENTIFY_EMAIL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Identify
    const [email, setEmail] = useState(initialEmail);
    const [claimRole, setClaimRole] = useState<string>('');

    // KBA Fields (Staff)
    const [registrationNumber, setRegistrationNumber] = useState('');

    // KBA Fields (Parent)
    const [childName, setChildName] = useState('');
    const [childRegistration, setChildRegistration] = useState('');
    const [childDob, setChildDob] = useState('');

    // OTP & Password
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Check if email exists in public.users to see which role it is
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, status, role')
                .eq('email', email)
                .single();

            if (userError || !user) {
                throw new Error("E-mail não encontrado na base de dados importada pela Secretaria/Escola.");
            }

            if (user.status === 'ACTIVE') {
                throw new Error("Esta conta já está ativa no sistema. Tente fazer login normalmente na tela inicial.");
            }

            setClaimRole(user.role);
            setStep('VERIFY_KBA');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyKBA = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (claimRole === 'PAIS') {
                // Verify Child Data
                if (!childName || !childRegistration || !childDob) {
                    throw new Error("Preencha todos os dados solicitados para comprovar sua identidade e parentalidade.");
                }

                // 1) Find the parent user to get children_ids
                const { data: parentRecord, error: parentError } = await supabase
                    .from('users')
                    .select('children_ids')
                    .eq('email', email)
                    .single();

                if (parentError || !parentRecord) throw new Error("Erro de infraestrutura ao buscar registro de responsável.");

                // 2) Look up the student based on KBA input
                const { data: studentRecords, error: studentError } = await supabase
                    .from('students')
                    .select('id')
                    .ilike('name', `%${childName.trim()}%`)
                    .eq('registration_number', childRegistration)
                    .eq('birth_date', childDob);

                if (studentError || !studentRecords || studentRecords.length === 0) {
                    throw new Error("Dados de Aluno não encontrados no sistema. Verifique nome (exato), matrícula e data de nascimento.");
                }

                const childId = studentRecords[0].id;
                const hasLink = parentRecord.children_ids && parentRecord.children_ids.includes(childId);

                if (!hasLink) {
                    throw new Error("❌ Acesso Bloqueado: Este aluno existe, mas NÃO está nativamente vinculado ao seu e-mail como responsável formal dele.");
                }

            } else {
                // Verify Staff/Teacher Data
                const { data: staff, error: authError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', email)
                    .eq('registration_number', registrationNumber)
                    .single();

                if (authError || !staff) {
                    throw new Error("A respectiva Matrícula/SIAPE informada NÃO corresponde a este e-mail institucional na base do governo.");
                }
            }

            // Successfully Verified DB KBA, Send OTP Real via Supabase Auth
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: true }
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
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });

            if (verifyError) throw verifyError;
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
            const { error: pwdError } = await supabase.auth.updateUser({
                password: password
            });

            if (pwdError) throw pwdError;

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
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">

                <div className="bg-indigo-600 p-8 text-center text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Resgate de Conta</h2>
                    <p className="text-indigo-100 text-sm font-medium opacity-80">Acesso Restrito: Infraestrutura Escolar</p>
                </div>

                <div className="p-8">
                    {step === 'IDENTIFY_EMAIL' && (
                        <form onSubmit={handleCheckEmail} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Seu E-mail Cadastrado na Escola</label>
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
                                        placeholder="voce@exemplo.com"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-start gap-2 border border-rose-100">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Buscar Cadastro no Município"}
                                <ArrowRight size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={onCancel}
                                className="w-full text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
                            >
                                Cancelar Autenticação
                            </button>
                        </form>
                    )}

                    {step === 'VERIFY_KBA' && (
                        <form onSubmit={handleVerifyKBA} className="space-y-6">
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center mb-6">
                                <p className="text-xs font-bold text-indigo-700">Verificação de Identidade Rigorosa (KBA)</p>
                                <p className="text-[10px] text-indigo-500">Perfil Localizado: <strong>{claimRole}</strong></p>
                            </div>

                            {claimRole === 'PAIS' ? (
                                <>
                                    <h4 className="font-bold text-sm text-slate-700 mb-2">Comprovação de Responsabilidade Legal</h4>
                                    <p className="text-xs text-slate-500 mb-4">Para liberar seu acesso, precisamos confirmar quem é o seu filho/dependente matriculado na escola.</p>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Nome Completo do Aluno</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                    <User size={16} />
                                                </div>
                                                <input type="text" required value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="João Silva Souza" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 outline-none focus:border-indigo-600 text-sm" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Nº da Matrícula do Aluno</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                    <Fingerprint size={16} />
                                                </div>
                                                <input type="text" required value={childRegistration} onChange={(e) => setChildRegistration(e.target.value)} placeholder="12345XYZ" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 outline-none focus:border-indigo-600 text-sm" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Data de Nascimento do Aluno</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                    <CalendarSearch size={16} />
                                                </div>
                                                <input type="date" required value={childDob} onChange={(e) => setChildDob(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 outline-none focus:border-indigo-600 text-sm text-slate-700" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h4 className="font-bold text-sm text-slate-700 mb-2">Comprovação de Vínculo Funcional</h4>
                                    <p className="text-xs text-slate-500 mb-4">Para liberar o acesso administrativo, informe o seu número de prontuário, matrícula ou SIAPE oficial.</p>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Sua Matrícula Institucional</label>
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
                                    </div>
                                </>
                            )}

                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-start gap-2 border border-rose-100">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span className="leading-snug">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Comprovar e Receber Código"}
                                <ArrowRight size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep('IDENTIFY_EMAIL'); setError(null); }}
                                className="w-full text-slate-400 text-sm font-bold mt-2"
                            >
                                Voltar
                            </button>
                        </form>
                    )}

                    {step === 'VERIFY_OTP' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                                <p className="text-xs font-bold text-emerald-700">Identidade Biográfica Comprovada!</p>
                                <p className="text-[10px] text-emerald-600">Um código de segurança foi enviado para: <strong>{email}</strong></p>
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

                            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Validar Código Dispositivo"}
                            </button>
                        </form>
                    )}

                    {step === 'SET_PASSWORD' && (
                        <form onSubmit={handleFinalize} className="space-y-6">
                            <div className="text-center mb-6">
                                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-slate-900">Propriedade Confirmada</h3>
                                <p className="text-slate-500 text-sm">Crie sua senha de acesso definitiva para prosseguir e ativar sua conta.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nova Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={20} />
                                    </div>
                                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-600 transition-all" placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Confirmar Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={20} />
                                    </div>
                                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-600 transition-all" placeholder="••••••••" />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Finalizar e Acessar Plataforma"}
                            </button>
                        </form>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center py-6 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} className="text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Conta Ativada!</h3>
                            <p className="text-slate-500 mb-8 text-sm">
                                Resgate blindado concluído. Sua conta agora é privada e acessível.
                            </p>
                            <button onClick={onSuccess} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all w-full">
                                Ir para o Dashboard e Fazer Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
