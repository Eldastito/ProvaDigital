import React from 'react';
import { X, FileText, Calendar, User, Cpu, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { Item } from '../../../types';

export interface QuestionMetadata {
    // Fonte
    source?: {
        type: 'manual' | 'ai_upload' | 'ai_context' | 'ai_topic';
        fileName?: string;
        fileType?: string;
        uploadDate?: Date;
        pageRange?: string;
        extractedContext?: string;
    };

    // Geração
    generatedBy: 'professor' | 'ai';
    aiModel?: string;
    promptVersion?: string;
    generatedAt: Date;

    // Uso
    timesUsed?: number;
    lastUsedAt?: Date;
    usedInExams?: Array<{
        examId: string;
        examName: string;
        date: Date;
        studentsCount: number;
    }>;
}

interface QuestionAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: Item;
    metadata?: QuestionMetadata;
}

export const QuestionAuditModal: React.FC<QuestionAuditModalProps> = ({
    isOpen,
    onClose,
    question,
    metadata
}) => {
    if (!isOpen) return null;

    const getSourceIcon = (type?: string) => {
        switch (type) {
            case 'ai_upload':
                return <FileText size={20} className="text-blue-600" />;
            case 'ai_context':
                return <Cpu size={20} className="text-purple-600" />;
            case 'manual':
                return <User size={20} className="text-green-600" />;
            default:
                return <FileText size={20} className="text-slate-600" />;
        }
    };

    const getSourceLabel = (type?: string) => {
        switch (type) {
            case 'ai_upload':
                return 'Gerada a partir de arquivo enviado';
            case 'ai_context':
                return 'Gerada a partir de contexto/tema';
            case 'manual':
                return 'Criada manualmente pelo professor';
            default:
                return 'Origem desconhecida';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 size={20} className="text-brand-primary" />
                        Informações da Questão
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Fonte da Questão */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            📄 Fonte da Questão
                        </h3>
                        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                {getSourceIcon(metadata?.source?.type)}
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {getSourceLabel(metadata?.source?.type)}
                                    </p>
                                    {metadata?.source?.fileName && (
                                        <p className="text-sm text-slate-600 mt-1">
                                            📁 Arquivo: <span className="font-mono">{metadata.source.fileName}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {metadata?.source?.pageRange && (
                                <div className="text-sm text-slate-600">
                                    📄 Páginas: {metadata.source.pageRange}
                                </div>
                            )}

                            {metadata?.source?.uploadDate && (
                                <div className="text-sm text-slate-600 flex items-center gap-2">
                                    <Calendar size={14} />
                                    Upload: {new Date(metadata.source.uploadDate).toLocaleString('pt-BR')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trecho Utilizado */}
                    {metadata?.source?.extractedContext && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 mb-3">
                                📝 Trecho Utilizado
                            </h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-slate-700 italic leading-relaxed">
                                    "{metadata.source.extractedContext}"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Informações de Geração */}
                    {metadata?.generatedBy === 'ai' && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                🤖 Geração por IA
                            </h3>
                            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                                {metadata.aiModel && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Cpu size={14} className="text-purple-600" />
                                        <span className="text-slate-600">Modelo:</span>
                                        <span className="font-mono font-medium text-slate-900">
                                            {metadata.aiModel}
                                        </span>
                                    </div>
                                )}
                                {metadata.generatedAt && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock size={14} className="text-purple-600" />
                                        <span className="text-slate-600">Data:</span>
                                        <span className="font-medium text-slate-900">
                                            {new Date(metadata.generatedAt).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                )}
                                {metadata.promptVersion && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 size={14} className="text-purple-600" />
                                        <span className="text-slate-600">Versão do Prompt:</span>
                                        <span className="font-mono text-slate-900">
                                            {metadata.promptVersion}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Histórico de Uso */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            📊 Histórico de Uso
                        </h3>
                        <div className="bg-green-50 rounded-lg p-4">
                            {metadata?.timesUsed ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Usada em:</span>
                                        <span className="font-bold text-lg text-green-700">
                                            {metadata.timesUsed} {metadata.timesUsed === 1 ? 'prova' : 'provas'}
                                        </span>
                                    </div>
                                    {metadata.lastUsedAt && (
                                        <div className="text-sm text-slate-600">
                                            Última vez: {new Date(metadata.lastUsedAt).toLocaleDateString('pt-BR')}
                                        </div>
                                    )}
                                    {metadata.usedInExams && metadata.usedInExams.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium text-slate-700">Provas:</p>
                                            {metadata.usedInExams.map((exam, idx) => (
                                                <div key={idx} className="text-xs bg-white rounded p-2 border border-green-200">
                                                    <p className="font-medium text-slate-900">{exam.examName}</p>
                                                    <p className="text-slate-600">
                                                        {new Date(exam.date).toLocaleDateString('pt-BR')} • {exam.studentsCount} alunos
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-sm text-slate-600">
                                        ✨ Esta questão ainda não foi utilizada em nenhuma prova
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        (Questão inédita)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview da Questão */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3">
                            👁️ Preview da Questão
                        </h3>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-sm text-slate-700 mb-3">
                                <strong>Enunciado:</strong> {question.statement.substring(0, 200)}
                                {question.statement.length > 200 && '...'}
                            </p>
                            {question.type === 'MULTIPLE_CHOICE' && question.options && (
                                <div className="text-xs text-slate-600">
                                    <strong>Alternativas:</strong> {question.options.length} opções
                                </div>
                            )}
                            <div className="mt-2 flex gap-2 text-xs">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {question.subject}
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                    {question.difficulty}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
