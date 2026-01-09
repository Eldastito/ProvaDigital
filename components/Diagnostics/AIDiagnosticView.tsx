import React, { useState } from 'react';
import { Brain, ShieldCheck, ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import { improveItemStatement } from '../../services/geminiService';

export const AIDiagnosticView: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [debugInfo, setDebugInfo] = useState<any>({});

    const runTest = async () => {
        setStatus('loading');
        setErrorMsg('');

        const info: any = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            env: {
                VITE_GEMINI_API_KEY: (import.meta as any).env?.VITE_GEMINI_API_KEY ? `Presente (${(import.meta as any).env.VITE_GEMINI_API_KEY.substring(0, 7)}...) ✅` : 'AUSENTE ❌',
                GEMINI_API_KEY: (import.meta as any).env?.GEMINI_API_KEY ? 'Presente ✅' : 'AUSENTE ❌',
                process_env_GEMINI: (typeof process !== 'undefined' && (process as any).env?.VITE_GEMINI_API_KEY) ? 'Presente ✅' : 'AUSENTE ❌',
                global_key: (globalThis as any).GEMINI_API_KEY ? 'Presente ✅' : 'AUSENTE ❌'
            }
        };
        setDebugInfo(info);

        try {
            const testText = "O gato subiu no telhado.";

            // Tentar listar modelos primeiro para depuração
            const models = await listAvailableModels();
            console.log("[AIDiagnosticView] Modelos disponíveis:", models);
            (globalThis as any).AVAILABLE_MODELS = models;

            const result = await improveItemStatement(testText);

            console.log("[AIDiagnosticView] Resultado do teste:", result);

            // Validação rigorosa:
            const isFallback = (result === testText) ||
                result.toLowerCase().includes("offline") ||
                result.includes("EF00MOCK");

            if (result && result.length > 5 && !isFallback) {
                setStatus('success');
            } else {
                const lastError = (globalThis as any).LAST_GEMINI_ERROR;
                throw new Error(lastError || "A IA não processou o texto (fallback ativado). Verifique os logs do console.");
            }
        } catch (err: any) {
            setStatus('error');
            const globalErr = (globalThis as any).LAST_GEMINI_ERROR;
            setErrorMsg(globalErr || err.message || "Erro desconhecido ao chamar API.");
            console.error("DIAGNOSTICO IA FAILED:", err);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto h-full overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                        <Brain size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Diagnóstico de IA</h1>
                        <p className="text-slate-500">Teste de conectividade com Google Gemini</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-lg font-mono text-xs space-y-2">
                        <p className="font-bold text-slate-700">DEBUG INFO:</p>
                        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>

                    <button
                        onClick={runTest}
                        disabled={status === 'loading'}
                        className="w-full py-4 btn-gradient rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {status === 'loading' ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        {status === 'loading' ? 'Testando...' : 'Executar Teste de Conexão'}
                    </button>

                    {status === 'success' && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                            <ShieldCheck className="text-emerald-500 shrink-0" />
                            <div>
                                <p className="font-bold text-emerald-800">IA Conectada com Sucesso!</p>
                                <p className="text-sm text-emerald-600">O sistema conseguiu se comunicar com o Google Gemini.</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                            <ShieldAlert className="text-red-500 shrink-0" />
                            <div>
                                <p className="font-bold text-red-800">Falha na Conexão</p>
                                <p className="text-sm text-red-600">{errorMsg}</p>
                                <p className="mt-2 text-xs text-red-400">Verifique os logs do console para mais detalhes técnicos.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
