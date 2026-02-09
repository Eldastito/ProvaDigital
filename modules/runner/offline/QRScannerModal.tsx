/**
 * QR Scanner Modal - Professor escaneia QR Codes dos alunos
 * 
 * Funcionalidades:
 * - Scanner de QR Code usando câmera do dispositivo
 * - Validação HMAC automática
 * - Suporte a múltiplos chunks (reassembly automático)
 * - Lista de alunos coletados
 * - Consolidação de sala
 * 
 * Fluxo:
 * 1. Professor abre scanner
 * 2. Escaneia QR Code de cada aluno
 * 3. Sistema valida HMAC
 * 4. Armazena dados criptografados
 * 5. Quando todos escaneados, gera QR consolidado da sala
 */

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, CheckCircle, AlertTriangle, Users, Download } from 'lucide-react';
import { E2EEncryptionService, SignedPayload } from '../../../services/security/e2eEncryptionService';
import { QRDataTransfer, QRChunk } from '../../../services/qrCodecService';
import { QRCodeSVG } from 'qrcode.react';
import { QRScannerService } from '../../../services/qrScannerService';


interface QRScannerModalProps {
    examId: string;
    eventId: string;
    onClose: () => void;
}

interface ScannedStudent {
    studentId: string;
    studentName: string;
    encryptedAnswers: any;
    totalQuestions: number;
    scannedAt: string;
    validated: boolean;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
    examId,
    eventId,
    onClose
}) => {
    const [scanning, setScanning] = useState(false);
    const [students, setStudents] = useState<ScannedStudent[]>([]);
    const [currentChunks, setCurrentChunks] = useState<Map<number, string>>(new Map());
    const [expectedChunks, setExpectedChunks] = useState<number>(0);
    const [transferId, setTransferId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [consolidatedQR, setConsolidatedQR] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scannerRef = useRef<QRScannerService | null>(null);

    useEffect(() => {
        if (scanning) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => stopCamera();
    }, [scanning]);

    const startCamera = async () => {
        try {
            if (!videoRef.current) {
                throw new Error('Elemento de vídeo não encontrado');
            }

            // Criar nova instância do scanner
            scannerRef.current = new QRScannerService();

            // Iniciar scanner com jsQR
            await scannerRef.current.start({
                videoElement: videoRef.current,
                canvasElement: canvasRef.current || undefined,
                useFrontCamera: false, // Câmera traseira
                scanInterval: 100, // 10fps
                showDebugOverlay: process.env.NODE_ENV === 'development',
                onDetected: (qrData) => {
                    console.log('📱 QR Code detectado automaticamente!');
                    handleManualInput(qrData);
                },
                onError: (err) => {
                    console.error('Erro no scanner:', err);
                    setError(err.message);
                }
            });

        } catch (err) {
            console.error('Erro ao acessar câmera:', err);
            setError('Não foi possível acessar a câmera. Verifique as permissões.');
            setScanning(false);
        }
    };

    const stopCamera = () => {
        if (scannerRef.current) {
            scannerRef.current.stop();
            scannerRef.current = null;
        }
    };


    const handleManualInput = async (qrData: string) => {
        try {
            setError(null);

            // 1. Parse chunk
            const chunk = QRDataTransfer.parseChunk(qrData);
            if (!chunk) {
                throw new Error('QR Code inválido');
            }

            // 2. Gerenciar chunks
            if (transferId && chunk.id !== transferId) {
                // Novo transfer, resetar
                setCurrentChunks(new Map());
                setExpectedChunks(chunk.total);
                setTransferId(chunk.id);
            } else if (!transferId) {
                setTransferId(chunk.id);
                setExpectedChunks(chunk.total);
            }

            // 3. Adicionar chunk
            const newChunks = new Map(currentChunks);
            newChunks.set(chunk.index, chunk.data);
            setCurrentChunks(newChunks);

            console.log(`✅ Chunk ${chunk.index + 1}/${chunk.total} coletado`);

            // 4. Tentar reassemblar se completo
            if (newChunks.size === chunk.total) {
                const reassembled = await QRDataTransfer.tryReassemble(newChunks, chunk.total);

                if (!reassembled) {
                    throw new Error('Erro ao reassemblar chunks');
                }

                await processStudentSubmission(reassembled);

                // Reset para próximo aluno
                setCurrentChunks(new Map());
                setTransferId('');
                setExpectedChunks(0);
            }

        } catch (err) {
            console.error('Erro ao processar QR:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
    };

    const processStudentSubmission = async (signedPayload: SignedPayload) => {
        try {
            // 1. Validar HMAC
            const isValid = await E2EEncryptionService.validateSignedPayload(
                signedPayload,
                eventId
            );

            if (!isValid) {
                throw new Error('❌ QR Code adulterado! HMAC inválido.');
            }

            console.log('✅ HMAC validado com sucesso');

            // 2. Extrair dados
            const { payload } = signedPayload;

            if (payload.type !== 'STUDENT_SUBMISSION') {
                throw new Error('Tipo de QR Code inválido');
            }

            // 3. Verificar se já foi escaneado
            if (students.some(s => s.studentId === payload.studentId)) {
                throw new Error(`Aluno ${payload.studentName} já foi escaneado`);
            }

            // 4. Armazenar (NÃO descriptografar - professor não tem a chave!)
            const newStudent: ScannedStudent = {
                studentId: payload.studentId,
                studentName: payload.studentName,
                encryptedAnswers: payload.encryptedAnswers,
                totalQuestions: payload.totalQuestions,
                scannedAt: new Date().toISOString(),
                validated: true
            };

            setStudents(prev => [...prev, newStudent]);
            console.log(`✅ Aluno ${payload.studentName} adicionado (${newStudent.totalQuestions} questões)`);

        } catch (err) {
            console.error('Erro ao processar submissão:', err);
            setError(err instanceof Error ? err.message : 'Erro ao validar QR Code');
            throw err;
        }
    };

    const handleConsolidate = async () => {
        try {
            setError(null);

            if (students.length === 0) {
                throw new Error('Nenhum aluno escaneado para consolidar');
            }

            // Criar payload consolidado da sala
            const classroomBatch = {
                type: 'CLASSROOM_BATCH' as const,
                examId,
                eventId,
                students: students.map(s => ({
                    studentId: s.studentId,
                    studentName: s.studentName,
                    encryptedAnswers: s.encryptedAnswers,
                    scannedAt: s.scannedAt
                })),
                totalStudents: students.length,
                consolidatedAt: new Date().toISOString()
            };

            // Assinar batch
            const signedBatch = await E2EEncryptionService.createSignedPayload(
                'CLASSROOM_BATCH',
                classroomBatch,
                eventId
            );

            // Gerar QR Code consolidado
            const qrData = JSON.stringify(signedBatch);
            const chunks = await QRDataTransfer.compressAndChunk(qrData);

            // Por simplicidade, usar apenas primeiro chunk (ou implementar carousel)
            setConsolidatedQR(chunks[0]);

            console.log(`✅ Sala consolidada: ${students.length} alunos`);

        } catch (err) {
            console.error('Erro ao consolidar sala:', err);
            setError(err instanceof Error ? err.message : 'Erro ao consolidar');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-primary to-brand-dark text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <QrCode size={32} />
                        <div>
                            <h2 className="text-2xl font-bold">Scanner de QR Codes</h2>
                            <p className="text-sm opacity-90">Coletar respostas dos alunos (offline)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-semibold text-red-900">Erro ao escanear</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Scanner Area */}
                    {!consolidatedQR && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                                <video
                                    ref={videoRef}
                                    className="w-full rounded-lg bg-black"
                                    style={{ maxHeight: '300px' }}
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                <div className="mt-4 flex gap-3">
                                    {!scanning ? (
                                        <button
                                            onClick={() => setScanning(true)}
                                            className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-dark transition flex items-center justify-center gap-2"
                                        >
                                            <QrCode size={20} />
                                            Iniciar Scanner
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setScanning(false)}
                                            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
                                        >
                                            Parar Scanner
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Manual Input (simulação) */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-900 font-medium mb-2">
                                    📱 Modo Manual (simulação - em produção use a câmera)
                                </p>
                                <input
                                    type="text"
                                    placeholder="Cole o conteúdo do QR Code aqui..."
                                    className="w-full p-3 border-2 border-blue-300 rounded-lg text-sm"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            handleManualInput((e.target as HTMLInputElement).value);
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }}
                                />
                            </div>

                            {/* Chunk Progress */}
                            {expectedChunks > 0 && (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                                    <p className="text-sm font-medium text-amber-900 mb-2">
                                        Coletando chunks: {currentChunks.size} / {expectedChunks}
                                    </p>
                                    <div className="w-full bg-amber-200 rounded-full h-2">
                                        <div
                                            className="bg-amber-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(currentChunks.size / expectedChunks) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Students List */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-slate-600" />
                                <h3 className="font-bold text-slate-900">
                                    Alunos Coletados ({students.length})
                                </h3>
                            </div>

                            {students.length > 0 && !consolidatedQR && (
                                <button
                                    onClick={handleConsolidate}
                                    className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition flex items-center gap-2"
                                >
                                    <Download size={16} />
                                    Consolidar Sala
                                </button>
                            )}
                        </div>

                        {students.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">
                                Nenhum aluno escaneado ainda
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {students.map(student => (
                                    <div
                                        key={student.studentId}
                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="text-emerald-500" size={20} />
                                            <div>
                                                <p className="font-semibold text-slate-900">{student.studentName}</p>
                                                <p className="text-xs text-slate-500">
                                                    {student.totalQuestions} questões • {new Date(student.scannedAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                                            ✓ Validado
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Consolidated QR */}
                    {consolidatedQR && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-bold text-emerald-900 mb-2">
                                    🎉 Sala Consolidada!
                                </h3>
                                <p className="text-sm text-emerald-700">
                                    Mostre este QR Code para o coordenador escanear
                                </p>
                            </div>

                            <div className="bg-white p-4 rounded-xl">
                                <QRCodeSVG
                                    value={consolidatedQR}
                                    size={300}
                                    level="M"
                                    includeMargin
                                    className="mx-auto"
                                />
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-xs text-slate-600">
                                    {students.length} alunos • Chunk 1/X
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
