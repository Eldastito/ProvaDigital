import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Upload, Trash2, FileText, CheckCircle, AlertCircle, Loader, Plus, RefreshCw, Package } from 'lucide-react';
import { ragSeederService, KnowledgeDoc } from '../../../services/ragSeederService';
import { extractTextFromPDF } from '../../../utils/pdfExtractor';
import { useAppStore } from '../../../store/useAppStore';

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME = ['text/plain', 'text/markdown', 'application/pdf'];
const ALLOWED_EXT = ['.txt', '.md', '.pdf'];

// Base platform documents baked into the project root (served as static assets)
const BASE_PLATFORM_DOCS = [
    { title: 'Manual de Questões INEP (v1)', url: '/Manual%20de%20quetao_21122025084435.PDF' },
    { title: 'Manual de Questões INEP (v2)', url: '/Manual%20de%20quetao1_21122025084521.PDF' },
    { title: 'Manual de Questões INEP (v3)', url: '/Manual%20de%20quetao1_21122025084549.PDF' },
    { title: 'Manual de Questões INEP (v4)', url: '/Manual%20de%20quetao1_21122025084608.PDF' },
    { title: 'Guia de Elaboração e Revisão de Itens', url: '/guia_de_elaboracao_e_revisao_de_itens.pdf' },
    { title: 'Guia INEP 2012 — Elaboração de Itens', url: '/guia_elaboracao_revisao_itens_2012_INEP.pdf' },
    { title: 'Manual do Usuário ExamePad', url: '/manual_do_usuario_examepad.md' },
];

interface ProgressState {
    phase: 'extracting' | 'indexing';
    current: number;
    total: number;
    docTitle: string;
}

export const KnowledgeVaultView: React.FC = () => {
    const { currentUser } = useAppStore();
    const tenantId = currentUser?.tenantId || 'SYSTEM';

    const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<ProgressState | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [seedingBase, setSeedingBase] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDocs = async () => {
        setLoading(true);
        const result = await ragSeederService.listDocuments(tenantId);
        setDocs(result);
        setLoading(false);
    };

    useEffect(() => { loadDocs(); }, [tenantId]);

    const validateFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Limite: ${MAX_FILE_SIZE_MB}MB.`;
        }
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            return `Tipo não permitido: ${ext}. Aceitos: PDF, TXT, MD.`;
        }
        return null;
    };

    const processFile = async (file: File): Promise<string> => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (ext === '.pdf') {
            setProgress({ phase: 'extracting', current: 0, total: 0, docTitle: file.name });
            return await extractTextFromPDF(file);
        }
        return await file.text();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const validationError = validateFile(file);
        if (validationError) {
            setUploadStatus('error');
            setStatusMessage(validationError);
            return;
        }

        try {
            setUploading(true);
            const content = await processFile(file);
            setTitle(file.name.replace(/\.[^/.]+$/, ''));
            setText(content);
            setShowForm(true);
            setProgress(null);
        } catch (err: any) {
            setUploadStatus('error');
            setStatusMessage(err?.message || 'Falha ao ler o arquivo.');
        } finally {
            setUploading(false);
            setProgress(null);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !text.trim()) {
            setUploadStatus('error');
            setStatusMessage('Preencha o título e o conteúdo do documento.');
            return;
        }
        setUploading(true);
        setUploadStatus('idle');
        setStatusMessage('');

        const chunks = ragSeederService.chunkText(text);
        setProgress({ phase: 'indexing', current: 0, total: chunks.length, docTitle: title });

        try {
            const ok = await ragSeederService.seedFromText(tenantId, title.trim(), text.trim(), (processed, total) => {
                setProgress({ phase: 'indexing', current: processed, total, docTitle: title });
            });

            if (ok) {
                setUploadStatus('success');
                setStatusMessage(`Documento "${title}" indexado com sucesso! ${chunks.length} blocos no Cofre.`);
                setTitle('');
                setText('');
                setShowForm(false);
                await loadDocs();
            } else {
                setUploadStatus('error');
                setStatusMessage('Erro ao indexar. Verifique o console e a chave de API.');
            }
        } catch (err: any) {
            setUploadStatus('error');
            setStatusMessage(err?.message || 'Erro inesperado.');
        } finally {
            setUploading(false);
            setProgress(null);
        }
    };

    const handleDelete = async (docTitle: string) => {
        if (!confirm(`Remover "${docTitle}" do Cofre?\n\nOs vetores serão excluídos permanentemente.`)) return;
        await ragSeederService.deleteDocument(tenantId, docTitle);
        await loadDocs();
    };

    const handleSeedBaseDocs = async () => {
        setSeedingBase(true);
        setUploadStatus('idle');
        let seededCount = 0;
        let missingCount = 0;

        for (const doc of BASE_PLATFORM_DOCS) {
            try {
                setProgress({ phase: 'extracting', current: 0, total: 0, docTitle: doc.title });
                const response = await fetch(doc.url);
                if (!response.ok) {
                    console.warn(`Pulando ${doc.title}: ${response.status} - Arquivo não encontrado no servidor.`);
                    missingCount++;
                    continue;
                }
                const blob = await response.blob();
                const file = new File([blob], doc.url.split('/').pop() || doc.title);
                const content = await processFile(file);
                if (!content.trim()) continue;

                const chunks = ragSeederService.chunkText(content);
                setProgress({ phase: 'indexing', current: 0, total: chunks.length, docTitle: doc.title });

                const ok = await ragSeederService.seedFromText(tenantId, doc.title, content, (processed, total) => {
                    setProgress({ phase: 'indexing', current: processed, total, docTitle: doc.title });
                });
                if (ok) seededCount++;
            } catch (err) {
                console.warn(`Erro ao processar ${doc.title}:`, err);
                missingCount++;
            }
        }

        setProgress(null);
        setSeedingBase(false);
        if (seededCount > 0) {
            setUploadStatus('success');
            setStatusMessage(`${seededCount} documento(s) base indexados com sucesso! ${missingCount > 0 ? `(${missingCount} não encontrados na pasta public do servidor)` : ''}`);
            await loadDocs();
        } else {
            setUploadStatus('error');
            setStatusMessage(`Falha. Verifique se copiou os PDFs originais do INEP para a pasta '/public' (Tentou ler ${BASE_PLATFORM_DOCS.length} arquivos, e 0 foram encontrados).`);
        }
    };

    const progressPercent = progress && progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : null;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-brand-primary" size={22} /> Cofre de Conhecimento (RAG)
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Documentos aqui são usados pela IA para responder com dados reais da escola. Máx: {MAX_FILE_SIZE_MB}MB por arquivo.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    <button onClick={loadDocs} disabled={loading} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition" title="Recarregar">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading || seedingBase}
                        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition disabled:opacity-50">
                        <Upload size={16} /> PDF / TXT / MD
                    </button>
                    <button onClick={() => setShowForm(true)} disabled={uploading || seedingBase}
                        className="flex items-center gap-2 btn-gradient px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                        <Plus size={16} /> Novo texto
                    </button>
                    <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" className="hidden" onChange={handleFileSelect} />
                </div>
            </div>

            {/* Base Docs Seeder Card */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                    <p className="font-bold text-indigo-800 text-sm flex items-center gap-2">
                        <Package size={16} /> Documentos Base da Plataforma
                    </p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                        Guias INEP, manuais de questões e manual do usuário já incluídos no sistema. Indexe uma única vez para ativar.
                    </p>
                </div>
                <button
                    onClick={handleSeedBaseDocs}
                    disabled={seedingBase || uploading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 whitespace-nowrap"
                >
                    {seedingBase ? <><Loader size={14} className="animate-spin" /> Indexando...</> : <><Package size={14} /> Carregar Documentos Base</>}
                </button>
            </div>

            {/* Progress Bar */}
            {(progress || uploading) && (
                <div className="bg-white border border-brand-primary/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 truncate max-w-[70%]">
                            {progress?.phase === 'extracting'
                                ? `📄 Extraindo texto de "${progress.docTitle}"...`
                                : progress?.phase === 'indexing'
                                    ? `🧠 Indexando "${progress.docTitle}"...`
                                    : '⏳ Processando...'}
                        </span>
                        {progressPercent !== null && (
                            <span className="font-bold text-brand-primary">{progressPercent}%</span>
                        )}
                    </div>
                    {progressPercent !== null && (
                        <>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className="bg-brand-primary rounded-full h-2 transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400">
                                Bloco {progress?.current} de {progress?.total} — processando em lotes para não sobrecarregar a API
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Status Banner */}
            {uploadStatus !== 'idle' && !progress && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${uploadStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    {uploadStatus === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {statusMessage}
                    <button onClick={() => setUploadStatus('idle')} className="ml-auto text-xs underline opacity-70 hover:opacity-100">fechar</button>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <h3 className="font-bold text-slate-700 text-sm">📄 Novo documento para indexação</h3>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="Título do documento (ex: Regimento Interno 2025)"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition" />
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
                        placeholder="Cole o conteúdo aqui. A IA irá dividir e indexar automaticamente por trechos semânticos..."
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition resize-y font-mono" />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">
                            {text.length.toLocaleString('pt-BR')} caracteres · ~{Math.ceil(text.length / 500)} blocos estimados
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowForm(false); setTitle(''); setText(''); }}
                                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition">
                                Cancelar
                            </button>
                            <button onClick={handleSubmit} disabled={uploading || !title || !text}
                                className="px-4 py-2 text-sm btn-gradient rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                {uploading ? <><Loader size={14} className="animate-spin" /> Indexando...</> : <><CheckCircle size={14} /> Indexar no Cofre</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Documents List */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                    <Loader size={20} className="animate-spin" /><span className="text-sm">Carregando documentos...</span>
                </div>
            ) : docs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-500">Cofre vazio</p>
                    <p className="text-sm mt-1">Carregue os Documentos Base acima ou adicione os próprios documentos da escola.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                        {docs.length} documento{docs.length !== 1 ? 's' : ''} indexado{docs.length !== 1 ? 's' : ''}
                    </p>
                    {docs.map((doc, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-primary/30 hover:shadow-sm transition group">
                            <div className="bg-brand-light p-2.5 rounded-lg text-brand-primary flex-shrink-0">
                                <FileText size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-800 truncate">{doc.title}</div>
                                <div className="text-xs text-slate-400 mt-0.5 flex gap-3">
                                    <span>{doc.chunkCount} blocos vetorizados</span>
                                    {doc.updatedAt && <span>· {new Date(doc.updatedAt).toLocaleDateString('pt-BR')}</span>}
                                </div>
                            </div>
                            <button onClick={() => handleDelete(doc.title)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100" title="Remover">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 flex gap-3">
                <BookOpen size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                    <strong>Segurança:</strong> Apenas arquivos PDF, TXT e MD são aceitos (máx. {MAX_FILE_SIZE_MB}MB).
                    O sistema extrai apenas <em>texto</em> dos arquivos — vírus e scripts maliciosos são ignorados automaticamente.
                    Cada escola só acessa seus próprios documentos (isolamento por tenant via RLS no banco de dados).
                </div>
            </div>
        </div>
    );
};
