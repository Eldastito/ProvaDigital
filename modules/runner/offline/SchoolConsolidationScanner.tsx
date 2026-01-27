/**
 * School Consolidation Scanner - Coordenador escaneia QR Codes dos professores
 * 
 * Componente simplificado baseado no QRScannerModal.
 * Permite ao coordenador escanear QR Codes consolidados de múltiplas salas.
 * 
 * Fluxo:
 * 1. Professor mostra QR Code consolidado da sala (CLASSROOM_BATCH)
 * 2. Coordenador escaneia
 * 3. Sistema valida HMAC
 * 4. Consolidar múltiplas salas → SCHOOL_BATCH
 * 5. Sincronizar com servidor ou gerar QR final
 */

import React, { useState, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, Layers, Upload, QrCode } from 'lucide-react';
import { E2EEncryptionService, SignedPayload } from '../../../services/security/e2eEncryptionService';
import { QRDataTransfer } from '../../../services/qrCodecService';
import { QRCodeSVG } from 'qrcode.react';
import { QRScannerService } from '../../../services/qrScannerService';


interface SchoolConsolidationScannerProps {
    schoolId: string;
    eventId: string;
    onClose: () => void;
    onSync?: (schoolBatch: any) => void; // Callback para sincronizar com servidor
}

interface ClassroomData {
    classId: string;
    totalStudents: number;
    students: any[];
    scannedAt: string;
    validated: boolean;
}

export const SchoolConsolidationScanner: React.FC<SchoolConsolidationScannerProps> = ({
    schoolId,
    eventId,
    onClose,
    onSync
}) => {
    const [classrooms, setClassrooms] = useState<ClassroomData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [consolidated, setConsolidated] = useState(false);
    const [scanning, setScanning] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerRef = useRef<QRScannerService | null>(null);

    // Feedback sonoro/vibração quando detectar QR
    const playSuccessSound = () => {
        // Vibração (se disponível)
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }

        // Som de beep (Web Audio API)
        try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // 800Hz
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log('Áudio não disponível');
        }
    };

    const startScanner = async () => {
        try {
            if (!videoRef.current) return;

            scannerRef.current = new QRScannerService();

            await scannerRef.current.start({
                videoElement: videoRef.current,
                useFrontCamera: false,
                scanInterval: 100,
                showDebugOverlay: process.env.NODE_ENV === 'development',
                onDetected: (qrData) => {
                    console.log('📱 QR Code de sala detectado!');
                    playSuccessSound();
                    handleManualInput(qrData);
                },
                onError: (err) => {
                    setError(err.message);
                }
            });

            setScanning(true);
        } catch (err) {
            setError('Erro ao iniciar câmera');
            setScanning(false);
        }
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop();
            scannerRef.current = null;
        }
        setScanning(false);
    };


    const handleManualInput = async (qrData: string) => {
        try {
            setError(null);

            // Parse chunk (pode ser multi-chunk)
            const chunk = QRDataTransfer.parseChunk(qrData);

            // Por simplicidade, assumir single chunk (em produção fazer reassembly completo)
            const reassembled = JSON.parse(qrData);

            await processClassroomBatch(reassembled);

        } catch (err) {
            console.error('Erro ao processar QR:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
    };

    const processClassroomBatch = async (signedPayload: SignedPayload) => {
        try {
            // 1. Validar HMAC
            const isValid = await E2EEncryptionService.validateSignedPayload(
                signedPayload,
                eventId
            );

            if (!isValid) {
                throw new Error('❌ QR Code de sala adulterado! HMAC inválido.');
            }

            console.log('✅ HMAC validado com sucesso');

            // 2. Extrair dados
            const { payload } = signedPayload;

            if (payload.type !== 'CLASSROOM_BATCH') {
                throw new Error('Tipo de QR Code inválido. Esperado: CLASSROOM_BATCH');
            }

            // 3. Verificar se já foi escaneado
            if (classrooms.some(c => c.classId === payload.examId)) {
                throw new Error(`Sala ${payload.examId} já foi escaneada`);
            }

            // 4. Armazenar dados da sala (mantém criptografado)
            const classroom: ClassroomData = {
                classId: payload.examId || 'classroom-unknown',
                totalStudents: payload.totalStudents,
                students: payload.students,
                scannedAt: new Date().toISOString(),
                validated: true
            };

            setClassrooms(prev => [...prev, classroom]);
            console.log(`✅ Sala adicionada (${classroom.totalStudents} alunos)`);

        } catch (err) {
            console.error('Erro ao processar QR da sala:', err);
            setError(err instanceof Error ? err.message : 'Erro ao validar QR Code');
            throw err;
        }
    };

    const handleConsolidateSchool = async () => {
        try {
            setError(null);

            if (classrooms.length === 0) {
                throw new Error('Nenhuma sala escaneada para consolidar');
            }

            // Criar payload consolidado da escola
            const schoolBatch = {
                type: 'SCHOOL_BATCH' as const,
                schoolId,
                eventId,
                classrooms: classrooms.map(c => ({
                    classId: c.classId,
                    students: c.students,
                    totalStudents: c.totalStudents,
                    scannedAt: c.scannedAt
                })),
                totalClassrooms: classrooms.length,
                totalStudents: classrooms.reduce((sum, c) => sum + c.totalStudents, 0),
                consolidatedAt: new Date().toISOString()
            };

            console.log(`✅ Escola consolidada: ${classrooms.length} salas, ${schoolBatch.totalStudents} alunos`);

            // Callback para sync (pode ser upload direto ao servidor)
            if (onSync) {
                onSync(schoolBatch);
            }

            setConsolidated(true);

        } catch (err) {
            console.error('Erro ao consolidar escola:', err);
            setError(err instanceof Error ? err.message : 'Erro ao consolidar');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Layers size={32} />
                        <div>
                            <h2 className="text-2xl font-bold">Consolidação de Escola</h2>
                            <p className="text-sm opacity-90">Scanner de salas (modo offline)</p>
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

                    {!consolidated && (
                        <>
                            {/* Scanner Automático */}
                            <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200 mb-4">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <QrCode size={20} />
                                    Scanner Automático
                                </h3>

                                <video
                                    ref={videoRef}
                                    className="w-full rounded-lg bg-black mb-3"
                                    style={{ maxHeight: '300px' }}
                                    autoPlay
                                    playsInline
                                    muted
                                />

                                <div className="flex gap-3">
                                    {!scanning ? (
                                        <button
                                            onClick={startScanner}
                                            className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2"
                                        >
                                            <QrCode size={20} />
                                            Iniciar Scanner
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopScanner}
                                            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
                                        >
                                            Parar Scanner
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Manual Input */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-900 font-medium mb-2">
                                    📱 Modo Manual (desenvolvimento/fallback)
                                </p>
                                <input
                                    type="text"
                                    placeholder="Cole o conteúdo do QR Code do professor..."
                                    className="w-full p-3 border-2 border-blue-300 rounded-lg text-sm"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            handleManualInput((e.target as HTMLInputElement).value);
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }}
                                />
                            </div>

                            {/* Classrooms List */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Layers size={20} className="text-slate-600" />
                                        <h3 className="font-bold text-slate-900">
                                            Salas Coletadas ({classrooms.length})
                                        </h3>
                                    </div>

                                    {classrooms.length > 0 && (
                                        <button
                                            onClick={handleConsolidateSchool}
                                            className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                                        >
                                            <Upload size={16} />
                                            Consolidar Escola
                                        </button>
                                    )}
                                </div>

                                {classrooms.length === 0 ? (
                                    <p className="text-center text-slate-500 py-8">
                                        Nenhuma sala escaneada ainda
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {classrooms.map((classroom, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle className="text-emerald-500" size={20} />
                                                    <div>
                                                        <p className="font-semibold text-slate-900">Sala {idx + 1}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {classroom.totalStudents} alunos • {new Date(classroom.scannedAt).toLocaleTimeString()}
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
                        </>
                    )}

                    {/* Consolidated State */}
                    {consolidated && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                            <div className="text-center mb-4">
                                <CheckCircle className="mx-auto text-purple-600 mb-4" size={64} />
                                <h3 className="text-2xl font-bold text-purple-900 mb-2">
                                    🎉 Escola Consolidada!
                                </h3>
                                <p className="text-sm text-purple-700 mb-4">
                                    {classrooms.length} salas • {classrooms.reduce((sum, c) => sum + c.totalStudents, 0)} alunos
                                </p>
                                <p className="text-xs text-slate-600">
                                    Os dados foram consolidados e estão prontos para sincronização com o servidor.
                                </p>
                            </div>

                            <div className="bg-white rounded-lg p-4 space-y-2">
                                <h4 className="font-bold text-slate-900 text-sm mb-2">Resumo das Salas:</h4>
                                {classrooms.map((classroom, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-slate-600">Sala {idx + 1}</span>
                                        <span className="font-semibold text-slate-900">{classroom.totalStudents} alunos</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition"
                    >
                        {consolidated ? 'Fechar' : 'Cancelar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
