import React, { useState } from 'react';
import {
    Scan,
    Package,
    ShieldCheck,
    CheckCircle,
    AlertTriangle,
    Camera,
    History,
    ArrowRight,
    Info
} from 'lucide-react';
import { QRScannerModal } from '../runner/offline/QRScannerModal';

interface CustodyChecklistProps {
    type: 'DELIVERY' | 'COLLECTION';
    onComplete: (data: any) => void;
}

export const CustodyChecklist: React.FC<CustodyChecklistProps> = ({ type, onComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [showScanner, setShowScanner] = useState(false);
    const [data, setData] = useState({
        caseId: '',
        sealId: '',
        confirmedQuantity: 0,
        expectedQuantity: 40,
        incidentReported: false,
        incidentNotes: '',
        evidencePhoto: null as string | null
    });

    const handleScanCase = (qr: string) => {
        setData(prev => ({ ...prev, caseId: qr }));
        setShowScanner(false);
        setStep(2);
    };

    const handleScanSeal = (qr: string) => {
        setData(prev => ({ ...prev, sealId: qr }));
        setShowScanner(false);
        setStep(3);
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col p-6 animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800">Ritual de Custódia</h1>
                <p className="text-slate-500 text-sm">
                    {type === 'DELIVERY' ? 'Entrega de Malas na Unidade' : 'Coleta de Malas para a Base'}
                </p>
            </div>

            {/* Progress Stepper */}
            <div className="flex gap-2 mb-8">
                {[1, 2, 3].map(s => (
                    <div
                        key={s}
                        className={`flex-1 h-2 rounded-full transition-all duration-500 ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    />
                ))}
            </div>

            <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 flex flex-col">
                {step === 1 && (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Package size={40} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Identificar Mala</h2>
                            <p className="text-slate-500 text-sm mt-2">Bipe o QR Code frontal da mala para iniciar o checklist.</p>
                        </div>

                        {data.caseId ? (
                            <div className="w-full p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                                <span className="font-mono text-green-700">{data.caseId}</span>
                                <CheckCircle className="text-green-500" size={18} />
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowScanner(true)}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition"
                            >
                                <Scan size={20} />
                                Abrir Scanner
                            </button>
                        )}

                        {data.caseId && (
                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 mt-4"
                            >
                                Avançar <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={40} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Verificar Lacre</h2>
                            <p className="text-slate-500 text-sm mt-2">Bipe o ID do lacre físico aplicado na mala.</p>
                        </div>

                        {data.sealId ? (
                            <div className="w-full p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                                <span className="font-mono text-green-700">{data.sealId}</span>
                                <CheckCircle className="text-green-500" size={18} />
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowScanner(true)}
                                className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 active:scale-95 transition"
                            >
                                <Scan size={20} />
                                Scan Lacre
                            </button>
                        )}

                        <div className="w-full pt-4">
                            <button
                                onClick={() => setData(prev => ({ ...prev, incidentReported: true, step: 3 } as any))}
                                className="text-amber-600 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-50 p-2 rounded-lg transition overflow-hidden"
                            >
                                <AlertTriangle size={14} /> Lacre Violado ou Ausente
                            </button>
                        </div>

                        {data.sealId && (
                            <button
                                onClick={() => setStep(3)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 mt-4"
                            >
                                Avançar <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Conferência de Carga</h2>
                            <p className="text-slate-500 text-sm mt-2">Valide a quantidade física de tablets dentro da mala.</p>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400">Esperado</p>
                                <p className="text-2xl font-black text-slate-800">{data.expectedQuantity}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setData(prev => ({ ...prev, confirmedQuantity: Math.max(0, prev.confirmedQuantity - 1) }))}
                                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xl shadow-sm active:bg-slate-100"
                                >
                                    -
                                </button>
                                <span className="text-3xl font-black text-indigo-600 w-12 text-center">{data.confirmedQuantity}</span>
                                <button
                                    onClick={() => setData(prev => ({ ...prev, confirmedQuantity: prev.confirmedQuantity + 1 }))}
                                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xl shadow-sm active:bg-slate-100"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {data.confirmedQuantity !== data.expectedQuantity && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 animate-in slide-in-from-top-2">
                                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                                <div>
                                    <p className="text-xs font-bold text-amber-800">Divergência Detectada</p>
                                    <p className="text-[10px] text-amber-700 mt-1">O sistema registrará um incidente, mas permitirá o prosseguimento.</p>
                                </div>
                            </div>
                        )}

                        {data.confirmedQuantity !== data.expectedQuantity && (
                            <div className="space-y-4">
                                <textarea
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm focus:border-indigo-600 outline-none transition"
                                    placeholder="Descreva a divergência aqui..."
                                    value={data.incidentNotes}
                                    onChange={(e) => setData(prev => ({ ...prev, incidentNotes: e.target.value }))}
                                    rows={3}
                                />
                                <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition">
                                    <Camera size={24} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Anexar Evidência</span>
                                </button>
                            </div>
                        )}

                        <div className="mt-auto">
                            <button
                                onClick={() => onComplete(data)}
                                className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-600/20 active:scale-95 transition flex items-center justify-center gap-2"
                            >
                                {data.confirmedQuantity === data.expectedQuantity ? 'Confirmar Entrega' : 'Finalizar com Ressalva'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Geolocalização Ativa (Auditável)</span>
            </div>

            {showScanner && (
                <QRScannerModal
                    examId="logistics-temp"
                    eventId="custody-op"
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};
