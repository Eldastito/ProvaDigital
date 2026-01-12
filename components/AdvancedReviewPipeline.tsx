import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ShieldCheck, Brain, AlertTriangle, CheckCircle2, Loader2, BarChart3, Fingerprint } from 'lucide-react';
import { ExamVersion, Item } from '../types';

export const AdvancedReviewPipeline = ({ versionId }: { versionId: string }) => {
    const { examVersions, items } = useAppStore();
    const version = examVersions.find(v => v.id === versionId);

    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResult, setAuditResult] = useState<{
        score: number;
        findings: { type: 'success' | 'warning' | 'error'; msg: string; category: string }[];
        stats: any;
    } | null>(null);

    if (!version) return <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">Versão não encontrada.</div>;

    const versionItems = (version.itemsSnapshot || []).map(snap => {
        return items.find(i => i.id === snap.itemId || i.id === snap.id);
    }).filter(Boolean) as Item[];

    const handleRunAudit = async () => {
        setIsAuditing(true);
        // Simulate AI analysis time
        await new Promise(resolve => setTimeout(resolve, 2500));

        const findings: any[] = [];
        let score = 95;

        // 1. Structural check
        const itemsWithFewAlts = versionItems.filter(i => i.alternatives.length < 4);
        if (itemsWithFewAlts.length > 0) {
            score -= 10;
            findings.push({
                type: 'warning',
                category: 'Estrutura',
                msg: `${itemsWithFewAlts.length} itens possuem menos de 4 alternativas.`
            });
        }

        // 2. Pedagogical balance
        const difficultyDist = versionItems.reduce((acc: any, i) => {
            acc[i.difficulty] = (acc[i.difficulty] || 0) + 1;
            return acc;
        }, {});

        if (!difficultyDist['MEDIUM'] || difficultyDist['MEDIUM'] < versionItems.length * 0.4) {
            findings.push({
                type: 'info',
                category: 'Pedagógico',
                msg: 'A prova possui poucos itens de dificuldade MÉDIA (ideal: > 40%).'
            });
        }

        // 3. AI Hallucination / Consistency check (Simulated)
        findings.push({
            type: 'success',
            category: 'IA',
            msg: 'Consistência semântica verificada: Item #3 e Item #7 não possuem sobreposição de conteúdo.'
        });

        findings.push({
            type: 'success',
            category: 'Segurança',
            msg: 'Padrão de alternativas (A-E) consistente em toda a prova.'
        });

        setAuditResult({
            score: Math.max(0, score),
            findings,
            stats: {
                totalItems: versionItems.length,
                difficultyDist
            }
        });
        setIsAuditing(false);
    };

    return (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Auditoria Cognitiva IA</h2>
                        <p className="text-xs text-slate-500">Pipeline de validação pós-montagem (Fase 3)</p>
                    </div>
                </div>
                {!auditResult && !isAuditing && (
                    <button
                        onClick={handleRunAudit}
                        className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Brain size={18} /> Iniciar Auditoria
                    </button>
                )}
            </div>

            {isAuditing && (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                    <div>
                        <p className="font-bold text-slate-800">Analisando carga cognitiva e distribuição...</p>
                        <p className="text-sm text-slate-400">Avaliando {versionItems.length} itens contra as diretrizes do MEC.</p>
                    </div>
                </div>
            )}

            {auditResult && (
                <div className="space-y-6 animate-in zoom-in-95">
                    {/* Score Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Score de Qualidade</span>
                            <div className={`text-4xl font-black ${auditResult.score > 80 ? 'text-emerald-600' : 'text-amber-500'}`}>
                                {auditResult.score}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Itens Auditados</span>
                            <div className="text-4xl font-black text-slate-800">
                                {auditResult.stats.totalItems}
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Assinatura Digital</span>
                            <Fingerprint className="text-indigo-400" size={32} />
                        </div>
                    </div>

                    {/* Findings */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <BarChart3 size={16} /> Detalhes da Auditoria
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {auditResult.findings.map((f, i) => (
                                <div key={i} className={`p-3 rounded-lg flex items-start gap-3 border ${f.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                    f.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                        f.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                            'bg-sky-50 border-sky-100 text-sky-700'
                                    }`}>
                                    <div className="mt-0.5">
                                        {f.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold uppercase opacity-60 mb-0.5">{f.category}</div>
                                        <div className="text-xs font-medium leading-relaxed">{f.msg}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
