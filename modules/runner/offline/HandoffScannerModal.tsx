
import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, CheckCircle, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import { QRDataTransfer } from '../../../services/qrCodecService';
import { QRScannerService } from '../../../services/qrScannerService';

interface HandoffScannerModalProps {
    onSuccess: (data: any) => void;
    onClose: () => void;
}

export const HandoffScannerModal: React.FC<HandoffScannerModalProps> = ({
    onSuccess,
    onClose
}) => {
    const [scanning, setScanning] = useState(true);
    const [currentChunks, setCurrentChunks] = useState<Map<number, string>>(new Map());
    const [expectedChunks, setExpectedChunks] = useState<number>(0);
    const [transferId, setTransferId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

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
            if (!videoRef.current) return;
            scannerRef.current = new QRScannerService();
            await scannerRef.current.start({
                videoElement: videoRef.current,
                canvasElement: canvasRef.current || undefined,
                useFrontCamera: false,
                onDetected: handleManualInput,
                onError: (err) => setError(err.message)
            });
        } catch (err) {
            setError('Câmera indisponível.');
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
            const chunk = QRDataTransfer.parseChunk(qrData);
            if (!chunk) throw new Error('QR Inválido');

            if (transferId && chunk.id !== transferId) {
                setCurrentChunks(new Map());
                setTransferId(chunk.id);
                setExpectedChunks(chunk.total);
            } else if (!transferId) {
                setTransferId(chunk.id);
                setExpectedChunks(chunk.total);
            }

            const newChunks = new Map(currentChunks);
            newChunks.set(chunk.index, chunk.data);
            setCurrentChunks(newChunks);

            if (newChunks.size === chunk.total) {
                const reassembled = await QRDataTransfer.tryReassemble(newChunks, chunk.total);
                if (reassembled) {
                    // O payload aqui é o CLASS_PACKAGE
                    onSuccess(reassembled);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro no processamento');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/20 rounded-lg">
                            <QrCode className="text-brand-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Receber Turma</h2>
                            <p className="text-slate-400 text-xs text-uppercase tracking-wider">Escaneie o Coordenador</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                            <AlertTriangle size={18} /> {error}
                        </div>
                    )}

                    <div className="relative aspect-square bg-black rounded-3xl overflow-hidden border border-white/10 mb-8">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 border-[40px] border-black/40">
                            <div className="w-full h-full border-2 border-brand-primary/50 rounded-xl animate-pulse" />
                        </div>
                    </div>

                    {expectedChunks > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span>Progresso da Carga</span>
                                <span>{Math.round((currentChunks.size / expectedChunks) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-brand-primary transition-all duration-300" 
                                    style={{ width: `${(currentChunks.size / expectedChunks) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white/5 text-center">
                    <p className="text-slate-500 text-[10px] leading-relaxed">
                        Aponte a câmera para o QR Code gerado no tablet do Coordenador.<br/>
                        Mantenha o tablet estável para garantir a leitura dos chunks.
                    </p>
                </div>
            </div>
        </div>
    );
};
