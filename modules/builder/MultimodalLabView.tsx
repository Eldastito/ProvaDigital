import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Plus, Loader2, X, AlertCircle } from 'lucide-react';
import { extractItemsFromMultipleImages, GeneratedQuestion } from '../../services/geminiService';
import { useAppStore } from '../../store/useAppStore';
import { DifficultyLevel, QuestionType } from '../../types';

export const MultimodalLabView: React.FC = () => {
    const [images, setImages] = useState<string[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedItems, setExtractedItems] = useState<GeneratedQuestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { addItem } = useAppStore();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleExtract = async () => {
        if (images.length === 0) return;
        setIsExtracting(true);
        setError(null);
        try {
            const items = await extractItemsFromMultipleImages(images);
            setExtractedItems(items);
        } catch (err) {
            setError("Falha ao extrair itens. Verifique a conexão e tente novamente.");
            console.error(err);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleImport = (item: GeneratedQuestion) => {
        addItem({
            ...item,
            id: crypto.randomUUID(),
            tenantId: 'demo-tenant', // Seria injetado pelo contexto
            ownerId: 'demo-user',
            knowledgeArea: 'Geral',
            subject: 'Geral',
            type: QuestionType.MULTIPLE_CHOICE,
            difficulty: item.difficulty as DifficultyLevel || DifficultyLevel.MEDIUM,
            score: 1,
            origin: 'IA' as any,
            tags: ['Multimodal'],
            usageCount: 0,
            createdAt: new Date().toISOString(),
            alternatives: item.alternatives.map(a => ({ ...a, id: crypto.randomUUID() }))
        } as any);
        setExtractedItems(prev => prev.filter(i => i !== item));
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-amber-500 w-8 h-8" />
                        Laboratório Multimodal IA
                    </h1>
                    <p className="text-slate-500">Transforme fotos de livros e apostilas em questões estruturadas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 transition-colors cursor-pointer relative group">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 py-4">
                            <Upload className="w-10 h-10 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            <span className="font-semibold text-slate-600">Adicionar Imagens</span>
                            <span className="text-xs text-slate-400">Arraste ou clique para selecionar</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl space-y-4 max-h-[400px] overflow-y-auto">
                        <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Imagens Selecionadas ({images.length})</h3>
                        {images.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Nenhuma imagem carregada</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                                    <img src={img} className="w-full h-full object-cover" alt="Preview" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleExtract}
                        disabled={images.length === 0 || isExtracting}
                        className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                        {isExtracting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Sparkles className="w-5 h-5" />
                        )}
                        {isExtracting ? 'Processando com Gemini...' : 'Extrair Questões'}
                    </button>
                </div>

                {/* Results Section */}
                <div className="md:col-span-2 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {extractedItems.length > 0 ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                Itens Encontrados
                                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">{extractedItems.length}</span>
                            </h2>
                            <div className="space-y-4">
                                {extractedItems.map((item, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800 leading-relaxed mb-4">{item.statement}</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {item.alternatives.map((alt, aidx) => (
                                                        <div key={aidx} className={`p-3 rounded-lg text-sm border ${alt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                            {String.fromCharCode(65 + aidx)}) {alt.text}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleImport(item)}
                                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase">Importar</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase tracking-tighter">
                                                {item.difficulty}
                                            </span>
                                            <span className="text-[10px] font-bold bg-blue-50 px-2 py-1 rounded text-blue-600 uppercase tracking-tighter">
                                                {item.bnccCode || 'SEM BNCC'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-slate-50/50 rounded-3xl border border-slate-100">
                            <Sparkles className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-lg font-medium opacity-40">Aguardando extração...</p>
                            <p className="text-sm opacity-30">Faça o upload de fotos e clique em Extrair</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
