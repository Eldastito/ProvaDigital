import React, { useState, useRef } from 'react';
import {
    FileUp,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Table
} from 'lucide-react';
import { batchImportService, ImportCandidate } from '../../../services/batchImportService';
import { mapImportColumns } from '../../../services/geminiService';
import { useAppStore } from '../../../store/useAppStore';
import { UserRole } from '../../../types';
import { useToast } from '../../../components/ui/Toast';

interface BatchImportModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'IMPORTING' | 'SUCCESS';

export const BatchImportModal = ({ onClose, onSuccess }: BatchImportModalProps) => {
    const { tenants, currentUser } = useAppStore();
    const currentTenant = tenants.find(t => t.id === currentUser?.tenantId);
    const [step, setStep] = useState<Step>('UPLOAD');
    const toast = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [mapping, setMapping] = useState<any>(null);
    const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ success: 0, failed: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setLoading(true);
        try {
            setFile(uploadedFile);
            const { headers, rows } = await batchImportService.parseFile(uploadedFile);
            setHeaders(headers);
            setRows(rows);

            // AI Mapping
            const aiMapping = await mapImportColumns(headers, rows.slice(0, 3));
            setMapping(aiMapping.mapping);
            setStep('MAPPING');
        } catch (err) {
            toast.error('Erro ao ler arquivo', (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const startAnalysis = async () => {
        if (!currentTenant || !mapping) return;
        setLoading(true);
        try {
            const prepared = await batchImportService.prepareBatch(
                rows,
                mapping,
                currentTenant.id,
                currentTenant.type
            );
            setCandidates(prepared);
            setStep('PREVIEW');
        } catch (err) {
            toast.error('Erro na análise', (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const executeImport = async () => {
        setLoading(true);
        setStep('IMPORTING');
        try {
            const result = await batchImportService.commitBatch(candidates);
            setStats(result);
            setStep('SUCCESS');
        } catch (err) {
            toast.error('Erro na importação', (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <FileUp className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">Porteiro de Dados por IA</h2>
                            <p className="text-slate-500 text-sm flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-emerald-600" />
                                Importação Segura com Reconstrução de Dados
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">

                    {step === 'UPLOAD' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-3xl p-12 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                            >
                                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    {loading ? <Loader2 className="animate-spin text-indigo-600" size={40} /> : <FileUp className="text-indigo-600" size={40} />}
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">Selecione sua Planilha</h3>
                                <p className="text-slate-500 text-sm mb-6">Arraste e solte ou clique para selecionar<br />Formatos suportados: .CSV, .XLSX, .XLS</p>
                                <div className="bg-white rounded-xl py-2 px-4 shadow-sm border border-slate-100 inline-block text-slate-600 font-medium">
                                    {loading ? "Processando..." : "Selecionar Arquivo"}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileUpload}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    {step === 'MAPPING' && mapping && (
                        <div className="animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-2 mb-6">
                                <Sparkles className="text-indigo-600 animate-pulse" size={20} />
                                <h3 className="text-lg font-bold text-slate-900">Mapeamento Inteligente</h3>
                            </div>
                            <p className="text-slate-600 mb-8 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                A IA identificou automaticamente as colunas da sua planilha. Revise se o mapeamento abaixo está correto antes de prosseguir.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {Object.keys(mapping).map((field) => (
                                    <div key={field} className="p-4 bg-slate-50 rounded-2xl border flex flex-col gap-1">
                                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{field}</span>
                                        <select
                                            value={mapping[field]}
                                            onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                                            className="bg-white border rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-200 outline-none"
                                        >
                                            <option value="">(Ignorar)</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setStep('UPLOAD')}
                                    className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={startAnalysis}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                                >
                                    Confirmar Mapeamento
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'PREVIEW' && (
                        <div className="animate-in slide-in-from-right duration-300 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Pré-visualização dos Dados Sanitizados</h3>
                                    <p className="text-slate-500 text-sm">Validamos {candidates.length} registros para importação.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                                        {candidates.filter(c => c.status === 'VALID').length} Válidos
                                    </div>
                                    <div className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-100">
                                        {candidates.filter(c => c.status === 'ERROR').length} Erros
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 border rounded-2xl overflow-hidden mb-6">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-slate-50 sticky top-0 border-b">
                                        <tr>
                                            <th className="p-3 font-bold text-slate-600">ID / Nome</th>
                                            <th className="p-3 font-bold text-slate-600">E-mail</th>
                                            <th className="p-3 font-bold text-slate-600">Matrícula</th>
                                            <th className="p-3 font-bold text-slate-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidates.map((c, i) => (
                                            <tr key={i} className="border-b hover:bg-slate-50 transition-colors">
                                                <td className="p-3">
                                                    <div className="font-bold text-slate-800">{c.normalizedData.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{c.normalizedData.role}</div>
                                                </td>
                                                <td className="p-3 text-slate-600">{c.normalizedData.email}</td>
                                                <td className="p-3 text-slate-500 font-mono tracking-tighter">{c.normalizedData.registrationNumber}</td>
                                                <td className="p-3">
                                                    {c.status === 'VALID' ? (
                                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-rose-600" title={c.errors.join(', ')}>
                                                            <AlertCircle size={18} />
                                                            <span className="text-[10px] font-bold">ERRO</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setStep('MAPPING')}
                                    className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={executeImport}
                                    disabled={loading || candidates.filter(c => c.status === 'VALID').length === 0}
                                    className="bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    Importar Agora
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'IMPORTING' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Loader2 className="animate-spin text-indigo-600 mb-6" size={60} />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Processando Importação</h3>
                            <p className="text-slate-500">Estamos higienizando e salvando os registros de forma segura. Por favor, aguarde...</p>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                <CheckCircle2 className="text-emerald-600" size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Importação Concluída!</h3>
                            <p className="text-slate-500 mb-8 max-w-md">
                                Parabéns! A IA processou e sanitizou os dados com sucesso. Todos os usuários importados agora são protegidos pelo fluxo de resgate seguro.
                            </p>

                            <div className="grid grid-cols-2 gap-6 mb-12 w-full max-w-sm">
                                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
                                    <div className="text-3xl font-black text-emerald-700">{stats.success}</div>
                                    <div className="text-xs font-bold text-emerald-600/60 uppercase">Sucesso</div>
                                </div>
                                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
                                    <div className="text-3xl font-black text-rose-700">{stats.failed}</div>
                                    <div className="text-xs font-bold text-rose-600/60 uppercase">Falhas</div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    onSuccess();
                                    onClose();
                                }}
                                className="bg-slate-900 hover:bg-black text-white px-12 py-4 rounded-2xl font-bold shadow-xl transition-all"
                            >
                                Voltar para Lista
                            </button>
                        </div>
                    )}

                </div>

                {/* Footer info for protection */}
                <div className="px-8 py-3 bg-slate-900 text-slate-400 text-[10px] flex items-center justify-between uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-indigo-400" />
                        Recriação de Dados Ativa
                    </div>
                    <div>AES-256 + Gemini Sanitizer</div>
                </div>
            </div>
        </div>
    );
};
