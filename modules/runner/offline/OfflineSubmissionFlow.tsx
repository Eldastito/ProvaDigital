/**
 * Offline Submission Flow - Aluno → QR Code Criptografado
 * 
 * Componente exibido após o aluno finalizar a prova offline.
 * Gera QR Code(s) criptografados com:
 * - Respostas criptografadas (E2E)
 * - HMAC signature (anti-adulteração)
 * - Chunking automático (se dados > 2KB)
 * 
 * Fluxo:
 * 1. Aluno finaliza prova
 * 2. Sistema criptografa respostas
 * 3. Gera payload assinado
 * 4. Cria QR Code(s)
 * 5. Exibe para professor escanear
 */

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, ChevronLeft, ChevronRight, Lock, AlertTriangle } from 'lucide-react';
import { E2EEncryptionService } from '../../../services/security/e2eEncryptionService';
import { QRDataTransfer } from '../../../services/qrCodecService';
import { StudentAnswer, Exam } from '../../../types';

interface OfflineSubmissionFlowProps {
    exam: Exam;
    answers: StudentAnswer[];
    studentData: {
        id: string;
        name: string;
        eventId: string;
        examId: string;
    };
    onComplete?: () => void;
}

export const OfflineSubmissionFlow: React.FC<OfflineSubmissionFlowProps> = ({
    exam,
    answers,
    studentData,
    onComplete
}) => {
    const [qrChunks, setQRChunks] = useState<string[]>([]);
    const [currentChunk, setCurrentChunk] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        generateSubmissionQR();
    }, []);

    const generateSubmissionQR = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔐 Iniciando criptografia de respostas...');

            // 1. Deriva chave única do aluno
            const key = await E2EEncryptionService.deriveStudentKey(
                studentData.eventId,
                studentData.id
            );

            // 2. Criptografa respostas
            const encryptedAnswers = await E2EEncryptionService.encryptAnswers(answers, key);

            console.log('✅ Respostas criptografadas com sucesso');

            // 3. Monta payload completo
            const payload = {
                type: 'STUDENT_SUBMISSION' as const,
                studentId: studentData.id,
                studentName: studentData.name,
                examId: studentData.examId,
                eventId: studentData.eventId,
                encryptedAnswers,
                totalQuestions: answers.length,
                timestamp: new Date().toISOString()
            };

            // 4. Assina com HMAC (anti-adulteração)
            const signedPayload = await E2EEncryptionService.createSignedPayload(
                'STUDENT_SUBMISSION',
                payload,
                studentData.eventId
            );

            console.log('✅ Payload assinado com HMAC');

            // 5. Chunking (divide em múltiplos QR se necessário)
            const dataStr = JSON.stringify(signedPayload);
            const chunks = QRDataTransfer.compressAndChunk(dataStr);

            console.log(`✅ Gerados ${chunks.length} QR Code(s)`);

            setQRChunks(chunks);
            setLoading(false);

        } catch (err) {
            console.error('❌ Erro ao gerar QR Code:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            setLoading(false);
        }
    };

    const handlePrevChunk = () => {
        setCurrentChunk(prev => Math.max(0, prev - 1));
    };

    const handleNextChunk = () => {
        setCurrentChunk(prev => Math.min(qrChunks.length - 1, prev + 1));
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6 z-50">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-primary border-t-transparent mb-4"></div>
                <p className="text-white text-lg font-semibold">Criptografando suas respostas...</p>
                <p className="text-slate-400 text-sm mt-2">🔒 Segurança E2E ativa</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-red-900 to-red-800 flex flex-col items-center justify-center p-6 z-50">
                <AlertTriangle className="text-white mb-4" size={64} />
                <h2 className="text-2xl font-bold text-white mb-2">Erro ao Gerar QR Code</h2>
                <p className="text-red-200 text-center max-w-md">{error}</p>
                <button
                    onClick={generateSubmissionQR}
                    className="mt-6 px-6 py-3 bg-white text-red-900 font-bold rounded-xl hover:bg-red-50 transition"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex flex-col items-center justify-center p-6 z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-emerald-600" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        🎉 Prova Finalizada!
                    </h2>
                    <p className="text-slate-600 text-sm">
                        {studentData.name}
                    </p>
                </div>

                {/* Instruções */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-900 font-medium text-center leading-relaxed">
                        📱 <strong>Entregue o tablet ao professor</strong> para escanear o QR Code abaixo.
                        {qrChunks.length > 1 && ` (Total: ${qrChunks.length} códigos)`}
                    </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-6 border-4 border-brand-primary rounded-2xl shadow-lg mb-6">
                    <QRCodeSVG
                        value={qrChunks[currentChunk]}
                        size={320}
                        level="M"
                        includeMargin
                        className="mx-auto"
                    />
                </div>

                {/* Chunk Navigator */}
                {qrChunks.length > 1 && (
                    <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-xl">
                        <button
                            onClick={handlePrevChunk}
                            disabled={currentChunk === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={20} />
                            Anterior
                        </button>

                        <div className="text-center">
                            <p className="text-xs text-slate-500 font-mono uppercase mb-1">QR Code</p>
                            <p className="text-2xl font-bold text-brand-primary">
                                {currentChunk + 1} <span className="text-slate-400">/</span> {qrChunks.length}
                            </p>
                        </div>

                        <button
                            onClick={handleNextChunk}
                            disabled={currentChunk === qrChunks.length - 1}
                            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            Próximo
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {/* Footer de Segurança */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold">
                        <Lock size={16} />
                        <span className="text-sm">Respostas Criptografadas</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        🔒 Suas respostas estão protegidas com criptografia E2E (AES-256-GCM).
                        Apenas o servidor pode descriptografá-las.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        ⚠️ Não é possível alterar as respostas após a geração do QR Code
                    </p>
                </div>

                {/* Botão de Conclusão (opcional) */}
                {onComplete && (
                    <button
                        onClick={onComplete}
                        className="w-full mt-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition text-sm"
                    >
                        Fechar
                    </button>
                )}
            </div>

            {/* Info técnica (debug) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
                    <p>EventID: {studentData.eventId}</p>
                    <p>StudentID: {studentData.id}</p>
                    <p>Answers: {answers.length}</p>
                    <p>Chunks: {qrChunks.length}</p>
                    <p>Current: {currentChunk + 1}</p>
                </div>
            )}
        </div>
    );
};
