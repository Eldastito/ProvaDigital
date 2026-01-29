import React from 'react';
import { X, BarChart3, Search, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface AuditReportViewProps {
    auditReport: any;
    setAuditReport: (report: any) => void;
    handleMagicPolish: () => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({ auditReport, setAuditReport, handleMagicPolish }) => {
    if (!auditReport) return null;

    return (
        <div className="mb-8 bg-slate-900 text-white rounded-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-700 shadow-2xl">
            <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <BarChart3 className="text-rose-400" size={20} />
                    <h3 className="font-bold text-lg">Relatório de Auditoria Pedagógica</h3>
                </div>
                <button onClick={() => setAuditReport(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700 relative overflow-hidden group">
                        <div className={`text-4xl font-black mb-1 ${auditReport.score >= 80 ? 'text-emerald-400' : auditReport.score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {auditReport.score}%
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Search size={10} className="text-brand-primary" /> Ineditismo & Qualidade
                        </div>
                        <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="text-xl font-bold text-blue-400 mb-1">{auditReport.bloomLevel}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxonomia de Bloom</div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="text-sm font-bold text-purple-400 mb-1 truncate px-2">{auditReport.bnccVerdict}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Veredito BNCC</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                            <CheckCircle2 size={16} /> Pontos Fortes
                        </h4>
                        <ul className="space-y-2">
                            {auditReport.pros.map((p: string, i: number) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                                    <span className="text-emerald-500 mt-1">•</span> {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                            <AlertCircle size={16} /> Sugestões de Melhoria
                        </h4>
                        <ul className="space-y-2">
                            {auditReport.improvements.map((p: string, i: number) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                                    <span className="text-rose-500 mt-1">•</span> {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <button
                        onClick={() => {
                            setAuditReport(null);
                            handleMagicPolish();
                        }}
                        className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-brand-dark transition shadow-lg flex items-center gap-2 mx-auto"
                    >
                        <Sparkles size={18} /> Aplicar Melhorias Automaticamente
                    </button>
                </div>
            </div>
        </div>
    );
};
