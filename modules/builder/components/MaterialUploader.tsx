import React, { useState, useCallback } from 'react';
import { Upload, File as FileIcon, FileText, Image as ImageIcon, Table, X, Eye, Loader2 } from 'lucide-react';
import { fileSecurityService } from '../../../services/fileSecurityService';

export interface MaterialSource {
    type: 'pdf' | 'image' | 'docx' | 'xlsx' | 'txt';
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
    extractedText?: string;
    pageRange?: { start: number; end: number };
    totalPages?: number;
    imageUrls?: string[];
    file: File;
}

interface MaterialUploaderProps {
    onMaterialUploaded: (material: MaterialSource) => void;
    onRemove?: () => void;
    currentMaterial?: MaterialSource | null;
}

const ACCEPTED_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const MaterialUploader: React.FC<MaterialUploaderProps> = ({
    onMaterialUploaded,
    onRemove,
    currentMaterial
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageRange, setPageRange] = useState({ start: 1, end: 1 });

    const getFileType = (file: File): MaterialSource['type'] | null => {
        const type = file.type;
        const name = file.name.toLowerCase();

        if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
        if (type.includes('wordprocessingml') || name.endsWith('.docx')) return 'docx';
        if (type.includes('spreadsheetml') || name.endsWith('.xlsx')) return 'xlsx';
        if (type === 'text/plain' || name.endsWith('.txt')) return 'txt';
        if (type.startsWith('image/')) return 'image';

        return null;
    };

    const getFileIcon = (type: MaterialSource['type']) => {
        switch (type) {
            case 'pdf':
                return <FileText className="text-red-600" size={24} />;
            case 'docx':
                return <FileText className="text-blue-600" size={24} />;
            case 'xlsx':
                return <Table className="text-green-600" size={24} />;
            case 'txt':
                return <FileIcon className="text-slate-600" size={24} />;
            case 'image':
                return <ImageIcon className="text-purple-600" size={24} />;
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        setIsProcessing(true);

        try {
            // Validar tamanho
            if (file.size > MAX_FILE_SIZE) {
                throw new Error(`Arquivo muito grande. Tamanho máximo: ${formatFileSize(MAX_FILE_SIZE)}`);
            }

            // Validar tipo
            const fileType = getFileType(file);
            if (!fileType) {
                throw new Error('Tipo de arquivo não suportado');
            }

            let finalFile = file;

            // Global Security Layer: Sanitização Ativa
            if (fileType === 'image') {
                const blob = await fileSecurityService.sanitizeImage(file);
                finalFile = new File([blob], file.name, { type: blob.type });
            } else if (fileType === 'txt' || fileType === 'pdf') {
                // Para PDF, por enquanto validamos apenas a integridade estrutural/raw
                // futuramente podemos reconstrur o PDF se tivermos biblioteca local
                await fileSecurityService.validateRawData(file);
            }

            // Criar material source
            const material: MaterialSource = {
                type: fileType,
                fileName: finalFile.name,
                fileSize: finalFile.size,
                uploadedAt: new Date(),
                file: finalFile
            };

            // Para PDFs, detectar número de páginas (será implementado no processamento)
            if (fileType === 'pdf') {
                material.totalPages = 1; // Placeholder, será atualizado no processamento
                material.pageRange = { start: 1, end: 1 };
            }

            onMaterialUploaded(material);
        } catch (err) {
            console.error("Erro na segurança do arquivo:", err);
            setError(err instanceof Error ? err.message : 'Erro ao processar arquivo por segurança');
        } finally {
            setIsProcessing(false);
        }
    }, [onMaterialUploaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handlePageRangeChange = (field: 'start' | 'end', value: number) => {
        const newRange = { ...pageRange, [field]: value };
        setPageRange(newRange);

        if (currentMaterial && currentMaterial.type === 'pdf') {
            onMaterialUploaded({
                ...currentMaterial,
                pageRange: newRange
            });
        }
    };

    if (currentMaterial) {
        return (
            <div className="border-2 border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    {getFileIcon(currentMaterial.type)}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-slate-900">{currentMaterial.fileName}</h4>
                            {onRemove && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                                    title="Remover arquivo"
                                >
                                    <X size={16} className="text-slate-600" />
                                </button>
                            )}
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                            {formatFileSize(currentMaterial.fileSize)} • Enviado em {currentMaterial.uploadedAt.toLocaleTimeString()}
                        </div>

                        {/* Page Range Selector for PDFs */}
                        {currentMaterial.type === 'pdf' && currentMaterial.totalPages && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    📑 Selecionar Páginas
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-slate-600">Da página:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={currentMaterial.totalPages}
                                            value={pageRange.start}
                                            onChange={(e) => handlePageRangeChange('start', parseInt(e.target.value) || 1)}
                                            className="w-16 border border-slate-300 rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                    <span className="text-slate-400">até</span>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-slate-600">página:</label>
                                        <input
                                            type="number"
                                            min={pageRange.start}
                                            max={currentMaterial.totalPages}
                                            value={pageRange.end}
                                            onChange={(e) => handlePageRangeChange('end', parseInt(e.target.value) || 1)}
                                            className="w-16 border border-slate-300 rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        (Total: {currentMaterial.totalPages} páginas)
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Image Preview */}
                        {currentMaterial.type === 'image' && (
                            <div className="mt-3">
                                <img
                                    src={URL.createObjectURL(currentMaterial.file)}
                                    alt="Preview"
                                    className="max-w-full h-auto max-h-48 rounded border border-slate-200"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-slate-300 hover:border-slate-400'
                    }`}
            >
                {isProcessing ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="text-brand-primary animate-spin" />
                        <p className="text-sm text-slate-600">Processando arquivo...</p>
                    </div>
                ) : (
                    <>
                        <Upload size={32} className="text-slate-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-700 mb-1">
                            Arraste um arquivo aqui ou clique para selecionar
                        </p>
                        <p className="text-xs text-slate-500 mb-4">
                            PDF, DOCX, TXT, Imagens (JPG, PNG) ou Excel (XLSX)
                        </p>
                        <input
                            type="file"
                            onChange={handleFileInput}
                            accept={Object.values(ACCEPTED_TYPES).flat().join(',')}
                            className="hidden"
                            id="material-upload"
                        />
                        <label
                            htmlFor="material-upload"
                            className="inline-block px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-brand-primary/90 transition-colors"
                        >
                            Selecionar Arquivo
                        </label>
                        <p className="text-xs text-slate-400 mt-3">
                            Tamanho máximo: {formatFileSize(MAX_FILE_SIZE)}
                        </p>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <X size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}
        </div>
    );
};
