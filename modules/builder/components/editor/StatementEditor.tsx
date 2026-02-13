import React from 'react';
import { Sparkles, Loader2, GripVertical, Brain, Video, Music, Wifi, Upload, ImageIcon } from 'lucide-react';
import { RichTextEditor } from '../../../../components/RichTextEditor';
import { QuestionType } from '../../../../types';
import { fileSecurityService } from '../../../../services/fileSecurityService';

interface StatementEditorProps {
    form: any;
    setForm: (form: any) => void;
    handleImproveStatement: () => void;
    isImproving: boolean;
    handleVariate: () => void;
    isVariating: boolean;
    handleAccessibility: (profile: 'TEA' | 'TDAH' | 'VISUAL' | 'GERAL') => void;
    isAdapting: boolean;
}

export const StatementEditor: React.FC<StatementEditorProps> = ({
    form,
    setForm,
    handleImproveStatement,
    isImproving,
    handleVariate,
    isVariating,
    handleAccessibility,
    isAdapting
}) => {
    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                        {form.type === QuestionType.REDACTION ? 'Proposta da Redação / Texto de Apoio' : 'Enunciado da Questão'}
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={handleImproveStatement}
                            disabled={isImproving}
                            className="text-xs flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100 hover:bg-purple-100 transition font-bold"
                        >
                            {isImproving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            Aprimorar Texto
                        </button>
                        <button
                            onClick={handleVariate}
                            disabled={isVariating}
                            className="text-xs flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-100 hover:bg-amber-100 transition font-bold"
                            title="Criar uma variação desta questão para evitar colas"
                        >
                            {isVariating ? <Loader2 size={12} className="animate-spin" /> : <GripVertical size={12} />}
                            Variar Anti-Cola
                        </button>
                        <div className="relative group">
                            <button
                                type="button"
                                disabled={isAdapting}
                                className="text-xs flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 hover:bg-emerald-100 transition font-bold"
                            >
                                {isAdapting ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                                Adaptar PCD
                            </button>
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                                <button onClick={() => handleAccessibility('TEA')} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 font-medium border-b border-slate-100">TEA (Autismo)</button>
                                <button onClick={() => handleAccessibility('TDAH')} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 font-medium border-b border-slate-100">TDAH</button>
                                <button onClick={() => handleAccessibility('VISUAL')} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 font-medium border-b border-slate-100">Def. Visual</button>
                                <button onClick={() => handleAccessibility('GERAL')} className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 font-medium">Linguagem Simples</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* INFORMAÇÕES DE ACESSIBILIDADE SE ATIVO */}
                {(form as any).isAccessible && (
                    <div className="mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-100 animate-in slide-in-from-top-2">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Instruções de Acessibilidade (IA)</p>
                        <p className="text-xs text-emerald-800 italic">{(form as any).accessibilityInstructions || 'A questão foi adaptada para melhor compreensão.'}</p>
                    </div>
                )}

                {/* RICH TEXT EDITOR FOR STATEMENT */}
                <RichTextEditor
                    value={form.statement}
                    onChange={(val) => setForm({ ...form, statement: val })}
                    placeholder={form.type === QuestionType.REDACTION ? "Insira os textos motivadores e o tema da redação..." : "Digite o enunciado. Use **negrito**, $$fórmulas$$..."}
                    height="h-64"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Imagem de Capa (URL)</label>
                    <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={16} />
                        <input
                            className="w-full border rounded-lg pl-9 p-2 text-sm"
                            value={form.imageUrl}
                            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                            placeholder="https://exemplo.com/imagem.jpg"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Áudio/Vídeo de Apoio (URL)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary">
                                {(form as any).multimedia?.[0]?.type === 'VIDEO' ? <Video size={16} /> : <Music size={16} />}
                            </div>
                            <input
                                className={`w-full border rounded-lg pl-9 p-2 text-sm ${(form as any).multimedia?.[0]?.url?.includes('youtube.com') || (form as any).multimedia?.[0]?.url?.includes('youtu.be') ? 'border-amber-400 bg-amber-50' : ''}`}
                                placeholder="Link do YouTube ou MP3/MP4"
                                onChange={e => {
                                    const val = e.target.value;
                                    const type = val.toLowerCase().includes('youtube') || val.toLowerCase().includes('vimeo') || val.toLowerCase().endsWith('.mp4') ? 'VIDEO' : 'AUDIO';
                                    setForm({
                                        ...form,
                                        multimedia: val ? [{ type, url: val }] : []
                                    });
                                }}
                                value={(form as any).multimedia?.[0]?.url || ''}
                            />
                            {((form as any).multimedia?.[0]?.url?.includes('youtube.com') || (form as any).multimedia?.[0]?.url?.includes('youtu.be')) && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded animate-pulse">
                                    <Wifi size={10} /> REQUER INTERNET
                                </div>
                            )}
                        </div>
                        <label className="flex-shrink-0 cursor-pointer flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition border border-slate-200" title="Upload de Arquivo (Para uso offline)">
                            <Upload size={18} />
                            <input
                                type="file"
                                className="hidden"
                                accept="video/mp4,audio/mpeg,image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    let finalFile = file;

                                    // Global Security Layer: Sanitização de Imagens
                                    if (file.type.startsWith('image/')) {
                                        try {
                                            const sanitizedBlob = await fileSecurityService.sanitizeImage(file);
                                            finalFile = new File([sanitizedBlob], file.name, { type: sanitizedBlob.type });
                                        } catch (err) {
                                            console.error("Segurança: Falha na sanitização da imagem:", err);
                                            alert("Este arquivo foi rejeitado pelo Porteiro de Segurança IA.");
                                            return;
                                        }
                                    }

                                    // Em prod enviaria para Supabase Storage. Aqui usamos Blob URL p/ demo.
                                    const objectUrl = URL.createObjectURL(finalFile);
                                    const type = finalFile.type.startsWith('video') ? 'VIDEO' : finalFile.type.startsWith('audio') ? 'AUDIO' : 'IMAGE';
                                    setForm({
                                        ...form,
                                        multimedia: [{ type, url: objectUrl, description: `Arquivo offline: ${finalFile.name}` }]
                                    });
                                    alert("Arquivo carregado com sucesso! Este recurso estará disponível offline no tablet.");
                                }}
                            />
                        </label>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                        Use arquivos locais (MP4/MP3) para garantir que a mídia funcione sem internet. Links externos como YouTube podem falhar offline.
                    </p>
                </div>
            </div>
        </div>
    );
};
