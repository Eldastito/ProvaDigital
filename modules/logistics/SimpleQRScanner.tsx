/**
 * Simple QR Scanner - Apenas lê o conteúdo do QR Code e retorna
 */
import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Camera } from 'lucide-react';
import { QRScannerService } from '../../services/qrScannerService';

interface SimpleQRScannerProps {
    title: string;
    onScan: (data: string) => void;
    onClose: () => void;
}

export const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({ title, onScan, onClose }) => {
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scannerRef = useRef<QRScannerService | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            if (!videoRef.current) return;
            scannerRef.current = new QRScannerService();
            await scannerRef.current.start({
                videoElement: videoRef.current,
                canvasElement: canvasRef.current || undefined,
                useFrontCamera: false,
                scanInterval: 200,
                onDetected: (qrData) => {
                    onScan(qrData);
                },
                onError: (err) => {
                    setError(err.message);
                }
            });
        } catch (err) {
            setError('Câmera indisponível');
        }
    };

    const stopCamera = () => {
        if (scannerRef.current) {
            scannerRef.current.stop();
            scannerRef.current = null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col z-[100] animate-in fade-in duration-300">
            <div className="p-6 flex items-center justify-between text-white border-b border-white/10">
                <div className="flex items-center gap-3">
                    <QrCode className="text-indigo-400" />
                    <div>
                        <h2 className="font-bold">{title}</h2>
                        <p className="text-[10px] opacity-60 uppercase tracking-widest">Aponte para o QR Code</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scan Area Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div className="w-64 h-64 border-2 border-indigo-400 rounded-3xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -translate-x-1 -translate-y-1 rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white translate-x-1 -translate-y-1 rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -translate-x-1 translate-y-1 rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white translate-x-1 translate-y-1 rounded-br-xl" />

                        {/* Scanning Line */}
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent absolute top-1/2 left-0 shadow-[0_0_15px_rgba(129,140,248,0.8)] animate-pulse" />
                    </div>
                </div>

                {error && (
                    <div className="absolute bottom-10 left-6 right-6 p-4 bg-red-500/90 text-white rounded-2xl text-center text-sm font-bold shadow-xl backdrop-blur-md">
                        {error}
                    </div>
                )}
            </div>

            <div className="p-10 bg-black flex flex-col items-center gap-4">
                <div className="w-16 h-1 bg-white/20 rounded-full mb-2" />
                <p className="text-white/40 text-xs text-center">
                    O scanner captura automaticamente ao detectar o código.<br />
                    Mantenha o celular estável.
                </p>
            </div>
        </div>
    );
};
