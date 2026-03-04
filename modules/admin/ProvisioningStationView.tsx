import React, { useState, useEffect } from 'react';
import {
    Zap,
    Smartphone,
    RefreshCw,
    ShieldCheck,
    Package,
    Link,
    Monitor,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FileJson,
    Save
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { generateBlindPackage } from '../../services/examDeliveryService';

interface ProvisioningNode {
    id: string;
    serial: string;
    model: string;
    battery: number;
    status: 'IDLE' | 'PROVISIONING' | 'COMPLETED' | 'ERROR';
    progress: number;
    assignedTo?: string; // Student ID
}

export const ProvisioningStationView: React.FC = () => {
    const { exams, schools, students } = useAppStore();
    const [devices, setDevices] = useState<ProvisioningNode[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<string>('');
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [bulkMode, setBulkMode] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<'provisioning' | 'suitcase'>('provisioning');

    // Suitcase Packing States
    const [currentCaseNumber, setCurrentCaseNumber] = useState(`MALA-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`);
    const [scanInput, setScanInput] = useState('');
    const [scannedDevices, setScannedDevices] = useState<ProvisioningNode[]>([]);
    const [packingStatus, setPackingStatus] = useState<'IDLE' | 'PACKING' | 'LOCKED'>('IDLE');

    // Simulação de detecção de dispositivos via USB/Mesh
    const scanDevices = () => {
        setIsScanning(true);
        setTimeout(() => {
            const mockDevices: ProvisioningNode[] = [
                { id: 'dev-1', serial: 'EXP-2026-001', model: 'LogicTab Pro X', battery: 98, status: 'IDLE', progress: 0 },
                { id: 'dev-2', serial: 'EXP-2026-002', model: 'LogicTab Pro X', battery: 85, status: 'IDLE', progress: 0 },
                { id: 'dev-3', serial: 'EXP-2026-045', model: 'LogicTab Lite', battery: 100, status: 'IDLE', progress: 0 },
                { id: 'dev-4', serial: 'EXP-2026-089', model: 'LogicTab Pro X', battery: 42, status: 'IDLE', progress: 0 },
            ];
            setDevices(mockDevices);
            setIsScanning(false);
        }, 1500);
    };

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanInput) return;

        // Simular busca de dispositivo por serial
        const device: ProvisioningNode = {
            id: `dev-${Math.random().toString(36).substr(2, 5)}`,
            serial: scanInput.toUpperCase(),
            model: 'LogicTab Pro X',
            battery: 100,
            status: 'COMPLETED',
            progress: 100
        };

        setScannedDevices(prev => [device, ...prev]);
        setScanInput('');
        setPackingStatus('PACKING');
    };

    const startBulkProvisioning = async () => {
        if (!selectedExam || !selectedSchool) return;

        setDevices(prev => prev.map(d => ({ ...d, status: 'PROVISIONING', progress: 0 })));

        try {
            // Gerar o Pacote Blindado (.epkg) e lista de recursos
            const blindPackage = await generateBlindPackage(selectedExam, selectedSchool, useAppStore.getState());
            console.log("📦 Blind Package Generated:", blindPackage.packageInfo);
            console.log("🔗 Resources to Cache:", blindPackage.resourceList);

            // Simular progresso de envio para cada dispositivo
            devices.forEach((device) => {
                let p = 0;
                const interval = setInterval(() => {
                    // Simular download de recursos antes do envio do pacote
                    const stage = p < 40 ? "Baixando Mídias..." : p < 80 ? "Enviando Pacote..." : "Blindando...";

                    p += Math.random() * 20;
                    if (p >= 100) {
                        p = 100;
                        setDevices(current => current.map(d => d.id === device.id ? { ...d, status: 'COMPLETED', progress: 100 } : d));
                        clearInterval(interval);
                    } else {
                        setDevices(current => current.map(d => d.id === device.id ? { ...d, progress: p, model: stage } : d));
                    }
                }, 400 + Math.random() * 400);
            });
        } catch (error) {
            console.error("Provisioning failed:", error);
            setDevices(prev => prev.map(d => ({ ...d, status: 'ERROR', progress: 0 })));
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-sans">
            {/* Header Estilizado */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Zap className="text-amber-500 fill-amber-500" size={32} />
                        Logística de Sede <span className="text-indigo-600">ExamePad</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Provisionamento blindado e montagem de malas.</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border-2 border-slate-100 shadow-sm">
                    <button
                        onClick={() => setActiveSubTab('provisioning')}
                        className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeSubTab === 'provisioning' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <ShieldCheck size={18} className="inline mr-2" />
                        Carga em Lote
                    </button>
                    <button
                        onClick={() => setActiveSubTab('suitcase')}
                        className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeSubTab === 'suitcase' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Package size={18} className="inline mr-2" />
                        Montagem de Mala
                    </button>
                </div>
            </div>

            {activeSubTab === 'provisioning' ? (
                <div className="flex justify-end gap-3 mb-10 animate-in fade-in slide-in-from-top-4">
                    <button
                        onClick={scanDevices}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isScanning ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                        Detectar via USB
                    </button>
                    <button
                        onClick={startBulkProvisioning}
                        disabled={devices.length === 0 || !selectedExam}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50"
                    >
                        <ShieldCheck size={20} />
                        Disparar Carga
                    </button>
                </div>
            ) : (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleScan} className="flex gap-3 max-w-2xl">
                        <div className="flex-1 relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Escaneie o Serial do Tablet ou digite..."
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                value={scanInput}
                                onChange={e => setScanInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                            Vincular à Mala
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Painel de Configuração */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Monitor size={20} className="text-indigo-500" />
                            Parâmetros da Carga
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Escola de Destino</label>
                                <select
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all"
                                    value={selectedSchool}
                                    onChange={(e) => setSelectedSchool(e.target.value)}
                                >
                                    <option value="">Selecione a Escola</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Evento / Prova</label>
                                <select
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all"
                                    value={selectedExam}
                                    onChange={(e) => setSelectedExam(e.target.value)}
                                >
                                    <option value="">Selecione o Pacote</option>
                                    {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                </select>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <div
                                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${bulkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    onClick={() => setBulkMode(!bulkMode)}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${bulkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-sm font-bold text-slate-600">Distribuição Automática (Inteligente)</span>
                            </div>
                        </div>
                    </section>

                    <section className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Package size={24} />
                            </div>
                            <h3 className="text-lg font-bold">Resumo da Mala Digitial</h3>
                        </div>
                        <div className="space-y-2 text-sm opacity-90">
                            <div className="flex justify-between">
                                <span>Tablets Detectados:</span>
                                <span className="font-bold">{devices.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Prontos para Mala:</span>
                                <span className="font-bold">{devices.filter(d => d.status === 'COMPLETED').length}</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-3 bg-white text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">
                            Gerar Etiqueta da Mala
                        </button>
                    </section>
                </div>

                {/* Lista de Dispositivos Conectados / Malas */}
                <div className="lg:col-span-2 space-y-4">
                    {activeSubTab === 'provisioning' ? (
                        <>
                            <div className="flex justify-between items-center px-2">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Smartphone size={20} className="text-indigo-500" />
                                    Status dos Dispositivos ({devices.length})
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <span className="w-2 h-2 bg-slate-300 rounded-full"></span> Aguardando
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Concluído
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {devices.map(device => (
                                    <div
                                        key={device.id}
                                        className={`bg-white p-5 rounded-3xl border-2 transition-all ${device.status === 'COMPLETED' ? 'border-emerald-100' : device.status === 'PROVISIONING' ? 'border-indigo-100' : 'border-slate-50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-3">
                                                <div className={`p-3 rounded-2xl ${device.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    <Smartphone size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">{device.serial}</p>
                                                    <h4 className={`font-bold ${device.status === 'PROVISIONING' ? 'text-indigo-600 animate-pulse' : 'text-slate-800'}`}>
                                                        {device.status === 'PROVISIONING' ? device.model : 'LogicTab Pro X'}
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${device.battery > 20 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                                                    {device.battery}% BAT
                                                </span>
                                            </div>
                                        </div>

                                        {device.status === 'PROVISIONING' ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-bold text-indigo-600 uppercase">
                                                    <span>Enviando Pacote Blindado...</span>
                                                    <span>{Math.round(device.progress)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-600 transition-all duration-300"
                                                        style={{ width: `${device.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : device.status === 'COMPLETED' ? (
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                                <CheckCircle2 size={18} />
                                                Carga Finalizada - Pronto para Mala
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm bg-slate-50 p-3 rounded-xl">
                                                <RefreshCw size={18} className="opacity-50" />
                                                Aguardando Início
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {devices.length === 0 && !isScanning && (
                                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                        <Link size={48} className="mb-4 opacity-20" />
                                        <p className="font-bold">Nenhum dispositivo detectado.</p>
                                        <p className="text-sm">Conecte os tablets via USB ou Mesh HQ.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center px-2">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Package size={20} className="text-indigo-500" />
                                    Conteúdo da {currentCaseNumber} ({scannedDevices.length} tablets)
                                </h3>
                                <button className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-lg hover:bg-rose-100" onClick={() => setScannedDevices([])}>
                                    Limpar Mala
                                </button>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl border-2 border-indigo-100 text-indigo-600">
                                            <Monitor size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase">Status da Montagem</p>
                                            <p className="font-bold text-slate-800">
                                                {scannedDevices.length === 0 ? 'Aguardando primeiro tablet...' : `Mala com ${scannedDevices.length} unidades`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        disabled={scannedDevices.length === 0}
                                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-100"
                                    >
                                        Finalizar & Lacrar Mala
                                    </button>
                                </div>

                                <div className="divide-y divide-slate-50 h-[400px] overflow-y-auto custom-scrollbar">
                                    {scannedDevices.map((device, idx) => (
                                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors animate-in slide-in-from-left-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-black text-slate-300 w-6">#{idx + 1}</span>
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                                                    <Smartphone size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{device.serial}</p>
                                                    <p className="font-bold text-slate-800">Tablet Provisionado</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black uppercase">
                                                    Verificado
                                                </span>
                                                <button
                                                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                    onClick={() => setScannedDevices(prev => prev.filter((_, i) => i !== idx))}
                                                >
                                                    <AlertCircle size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {scannedDevices.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                            <Smartphone size={48} className="opacity-10 mb-4" />
                                            <p className="font-medium">Escaneie o serial do tablet para vincular.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
