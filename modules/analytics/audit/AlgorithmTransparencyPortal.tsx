import React, { useState } from 'react';
import { 
    Search, 
    ShieldCheck, 
    Zap, 
    Lock, 
    Fingerprint, 
    TrendingUp, 
    BarChart3,
    Clock,
    UserCircle,
    Copy,
    ExternalLink
} from 'lucide-react';

/**
 * AlgorithmTransparencyPortal - MVP
 * Foco: Auditabilidade Psicométrica e Privacy by Design
 */
export const AlgorithmTransparencyPortal = () => {
    const [searchId, setSearchId] = useState('');
    const [auditData, setAuditData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = () => {
        if (!searchId) return;
        setLoading(true);
        // Simulação de busca de trajetória auditável
        // Em prod, carregaria do banco 'audit_session_data' (hashes e trajetórias)
        setTimeout(() => {
            setAuditData({
              sessionId: 'ses_82739410',
              studentHash: 'user_u8172X_mask', // Pseudonimização
              examId: 'math_diag_2031_01',
              finalTheta: 1.42,
              finalSEE: 0.28,
              convergenceHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              steps: [
                { item: 'it_001', theta: 0.0, see: 1.0, resp: 'CORRECT' },
                { item: 'it_052', theta: 0.8, see: 0.65, resp: 'CORRECT' },
                { item: 'it_112', theta: 1.2, see: 0.45, resp: 'WRONG' },
                { item: 'it_089', theta: 1.1, see: 0.38, resp: 'CORRECT' },
                { item: 'it_095', theta: 1.3, see: 0.32, resp: 'CORRECT' },
                { item: 'it_150', theta: 1.42, see: 0.28, resp: 'STOP' }
              ]
            });
            setLoading(false);
        }, 800);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen bg-slate-50">
            {/* Header de Segurança */}
            <div className="mb-10 flex items-center justify-between bg-brand-dark/5 p-6 rounded-2xl border border-brand-dark/10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ShieldCheck className="text-brand-primary" size={36} />
                        Portal de Transparência do Algoritmo
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Evidência matemática de precisão e auditabilidade psicométrica (CAT).
                    </p>
                </div>
                <div className="flex flex-col items-end text-sm text-slate-500">
                    <span className="flex items-center gap-2">
                        <Lock size={14} /> Dados Mascarados (Privacy by Design)
                    </span>
                    <span className="mt-1">Padrão Nacional FORGE 2031 v1.5</span>
                </div>
            </div>

            {/* Busca Auditável */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-10">
                <label className="block text-sm font-bold text-slate-500 uppercase mb-3">
                    ID da Sessão ou Hash de Aluno
                </label>
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 font-mono"
                            placeholder="Ex: ses_8273..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-8 bg-brand-primary hover:bg-brand-dark text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2"
                    >
                        {loading ? 'Consultando Ledger...' : 'Verificar Trajetória'}
                    </button>
                </div>
            </div>

            {auditData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    {/* Resumo da Evidência */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Fingerprint className="text-brand-primary" size={20} />
                                Certidão da Sessão
                            </h2>
                            <div className="space-y-4">
                                <AuditItem label="ID Sessão" value={auditData.sessionId} copy />
                                <AuditItem label="Pseudônimo" value={auditData.studentHash} />
                                <AuditItem label="Precisão Final (SEE)" value={auditData.finalSEE} special="text-emerald-600 font-bold" />
                                <AuditItem label="Proficiência (θ)" value={auditData.finalTheta} />
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl text-white">
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                <Clock size={16} /> Hash de Integridade
                            </h3>
                            <p className="text-[10px] font-mono break-all text-slate-400 bg-black/30 p-3 rounded-lg border border-white/10">
                                {auditData.convergenceHash}
                            </p>
                            <button className="mt-4 text-xs flex items-center gap-1 text-brand-light hover:underline font-bold">
                                <ExternalLink size={12} /> Validar no Ledger Público
                            </button>
                        </div>
                    </div>

                    {/* Gráfico/Trajetória (Simulado) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="text-emerald-500" />
                                    Convergência de Proficiência
                                </h2>
                                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-100 italic">
                                    SEE Alvo Atingido: 0.28 <= 0.30
                                </span>
                            </div>

                            <div className="relative h-64 w-full bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                {/* Visualização Simplificada da Trajetória */}
                                <div className="absolute inset-0 flex items-end justify-between px-10 pb-10">
                                  {auditData.steps.map((s: any, i: number) => (
                                    <div 
                                      key={i} 
                                      className="flex flex-col items-center gap-2"
                                      style={{ height: `${(s.theta + 2) * 20}%` }}
                                    >
                                      <div className={`w-3 rounded-full ${s.resp === 'CORRECT' ? 'bg-emerald-400' : s.resp === 'STOP' ? 'bg-brand-primary scale-125' : 'bg-red-400'}`} style={{ height: '100%', minHeight: '8px' }}></div>
                                      <span className="text-[8px] font-bold text-slate-400">Step {i+1}</span>
                                    </div>
                                  ))}
                                </div>
                                <span className="z-10 text-slate-400 text-sm italic">Trajetória Estocástica Auditável</span>
                            </div>
                        </div>

                        {/* Tabela de Passos */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                              <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase">Passo</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase">Item ID</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase">Theta Est.</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase">Precisão (SEE)</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase">Resposta</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {auditData.steps.map((step: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-400">#{idx + 1}</td>
                                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{step.item}</td>
                                  <td className="px-6 py-4 font-bold text-slate-800">{step.theta.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-slate-500">{step.see.toFixed(2)}</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                      step.resp === 'CORRECT' ? 'bg-emerald-100 text-emerald-700' :
                                      step.resp === 'STOP' ? 'bg-brand-dark text-white' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {step.resp}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AuditItem = ({ label, value, copy, special }: any) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-center justify-between mt-1">
            <span className={`text-slate-800 font-medium ${special || ''}`}>{value}</span>
            {copy && <Copy size={12} className="text-slate-400 cursor-pointer hover:text-brand-primary" />}
        </div>
    </div>
);
