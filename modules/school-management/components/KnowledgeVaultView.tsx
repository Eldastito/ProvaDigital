import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Upload, Trash2, FileText, CheckCircle, AlertCircle, Loader, Plus, RefreshCw } from 'lucide-react';
import { ragSeederService, KnowledgeDoc } from '../../../services/ragSeederService';
import { useAppStore } from '../../../store/useAppStore';

export const KnowledgeVaultView: React.FC = () => {
    const { currentUser } = useAppStore();
    const tenantId = currentUser?.tenantId || 'SYSTEM';

    const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDocs = async () => {
        setLoading(true);
        const result = await ragSeederService.listDocuments(tenantId);
        setDocs(result);
        setLoading(false);
    };

    useEffect(() => {
        loadDocs();
    }, [tenantId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
        const content = await file.text();
        setText(content);
        setShowForm(true);
        e.target.value = '';
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
        try {
            const ok = await ragSeederService.seedFromText(tenantId, title.trim(), text.trim());
            if (ok) {
                setUploadStatus('success');
                setStatusMessage(`Documento "${title}" indexado com sucesso no Cofre!`);
                setTitle('');
                setText('');
                setShowForm(false);
                await loadDocs();
            } else {
                setUploadStatus('error');
                setStatusMessage('Erro ao indexar o documento. Verifique o console.');
            }
        } catch (err: any) {
            setUploadStatus('error');
            setStatusMessage(err?.message || 'Erro inesperado.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docTitle: string) => {
        if (!confirm(`Remover "${docTitle}" do Cofre de Conhecimento?\n\nOs vetores relacionados serão excluídos permanentemente.`)) return;
        await ragSeederService.deleteDocument(tenantId, docTitle);
        await loadDocs();
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-brand-primary" size={22} /> Cofre de Conhecimento (RAG)
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Documentos indexados aqui são usados pela IA para responder com dados reais da sua escola.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadDocs}
                        className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition"
                        title="Recarregar lista"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition"
                    >
                        <Upload size={16} /> Subir arquivo TXT/PDF
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 btn-gradient px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <Plus size={16} /> Novo documento
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>

            {/* Status Banner */}
            {uploadStatus !== 'idle' && (
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
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Título do documento (ex: Regimento Interno 2025)"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition"
                    />
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        rows={8}
                        placeholder="Cole o conteúdo aqui. A IA irá dividir e indexar automaticamente por trechos semânticos..."
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-primary transition resize-y font-mono"
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">
                            {text.length.toLocaleString('pt-BR')} caracteres · ~{Math.ceil(text.length / 500)} blocos estimados
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowForm(false); setTitle(''); setText(''); }}
                                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={uploading || !title || !text}
                                className="px-4 py-2 text-sm btn-gradient rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? <><Loader size={14} className="animate-spin" /> Indexando...</> : <><CheckCircle size={14} /> Indexar no Cofre</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Documents List */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                    <Loader size={20} className="animate-spin" />
                    <span className="text-sm">Carregando documentos...</span>
                </div>
            ) : docs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-500">Cofre vazio</p>
                    <p className="text-sm mt-1">Adicione documentos para que a IA passe a usar dados reais da escola.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{docs.length} documento{docs.length !== 1 ? 's' : ''} indexado{docs.length !== 1 ? 's' : ''}</p>
                    {docs.map((doc, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-primary/30 hover:shadow-sm transition group">
                            <div className="bg-brand-light p-2.5 rounded-lg text-brand-primary flex-shrink-0">
                                <FileText size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-800 truncate">{doc.title}</div>
                                <div className="text-xs text-slate-400 mt-0.5 flex gap-3">
                                    <span>{doc.chunkCount} blocos vetorizados</span>
                                    {doc.updatedAt && <span>· atualizado em {new Date(doc.updatedAt).toLocaleDateString('pt-BR')}</span>}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(doc.title)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                title="Remover documento"
                            >
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
                    <strong>Como funciona:</strong> Ao indexar um documento, o texto é dividido em blocos semânticos e convertido em vetores matemáticos (embeddings).
                    Quando um aluno faz uma pergunta ao Coruja Mentor, o sistema busca os trechos mais relevantes e os injeta no contexto da IA — garantindo respostas baseadas em dados reais da escola.
                </div>
            </div>
        </div>
    );
};
