import React, { useState, useEffect, useRef } from 'react';
import { meshService } from '../../../services/localMeshService';
import { nativeBridge } from '../../../services/nativeBridgeService';
import { QrCode, ArrowLeft, ShieldCheck, Wifi, RefreshCcw, Activity } from 'lucide-react';
import { useSafeAppStore } from '../../../store/useAppStore';

interface TabletLauncherProps {
    onSelectApp: (app: 'COORDINATOR' | 'PROFESSOR' | 'STUDENT', payload?: any) => void;
    onBack: () => void;
}

export const TabletLauncher = ({ onSelectApp, onBack }: TabletLauncherProps) => {
    const state = useSafeAppStore();
    const [provisioningStatus, setProvisioningStatus] = useState<string>('Aguardando sinal da rede...');
    const [hasProvisioned, setHasProvisioned] = useState(false);
    const [telemetry, setTelemetry] = useState<string[]>([]);

    // MASTER REFS: Única fonte de verdade para closures assíncronas
    const isConnectingRef = useRef(false);
    const statusRef = useRef('Aguardando sinal da rede...');
    const provisionedRef = useRef(false);
    const deviceIdRef = useRef('');

    const addLog = (msg: string) => {
        setTelemetry(prev => [msg, ...prev].slice(0, 3));
        console.log(`[TABLET-LOG] ${msg}`);
    };

    useEffect(() => {
        if (isConnectingRef.current) return;
        isConnectingRef.current = true;

        const initDiscovery = async () => {
            try {
                const deviceId = await nativeBridge.getDeviceId();
                deviceIdRef.current = deviceId;
                addLog(`Device ID: ${deviceId.substring(0, 8)}...`);

                meshService.onMessage(async (msg) => {
                    // Proteção contra stale state: SEMPRE usar a Ref
                    if (provisionedRef.current) return;

                    if (msg.type === 'BIN_VERSION_CHECK') {
                        addLog('📩 Recebido: Check de Versão');
                        const { requiredVersion } = msg.payload;
                        const currentVersion = "2.5.0";

                        if (currentVersion !== requiredVersion) {
                            addLog(`⚠️ Versão incorreta (v${requiredVersion})`);
                            setProvisioningStatus(`Atualizando para v${requiredVersion}...`);
                            statusRef.current = `Atualizando para v${requiredVersion}...`;
                            await nativeBridge.downloadUpdateAPK(requiredVersion);
                            window.location.reload();
                        } else {
                            addLog('✅ Versão OK. Enviando Integridade...');
                            setProvisioningStatus('Verificando integridade...');
                            statusRef.current = 'Verificando integridade...';
                            const health = await nativeBridge.checkSecurityHealth();
                            meshService.sendTo(msg.sender.id, 'SECURITY_REPORT', {
                                ...health,
                                serialNumber: deviceId,
                                timestamp: Date.now()
                            });
                        }
                    }

                    if (msg.type === 'PROVISION_CMD') {
                        addLog('📥 Recebido: Comando de Carga!');
                        provisionedRef.current = true;
                        setHasProvisioned(true);
                        setProvisioningStatus(`Configurado como ${msg.payload.targetRole}`);
                        statusRef.current = `Configurado como ${msg.payload.targetRole}`;

                        setTimeout(() => {
                            onSelectApp(msg.payload.targetRole, {
                                source: 'ZERO_TOUCH_PROVISIONING',
                                name: msg.payload.assignedName,
                                exams: msg.payload.exams
                            });
                        }, 1000);
                    }
                });

                meshService.join(deviceId, `Tablet-${deviceId.substring(0, 4)}`, 'UNASSIGNED', state.currentUser?.tenantId);
                addLog('🌐 Conectado ao canal global.');

            } catch (err) {
                addLog('❌ Erro na inicialização.');
                setProvisioningStatus('Erro de rede.');
            }
        };

        initDiscovery();

        const retryInterval = setInterval(() => {
            if (statusRef.current.includes('Aguardando sinal') && !provisionedRef.current) {
                if (deviceIdRef.current) {
                    addLog('🔄 Re-enviando sinal (Retry)...');
                    meshService.broadcast('DISCOVERY', { serialNumber: deviceIdRef.current });
                }
            }
        }, 8000);

        return () => {
            clearInterval(retryInterval);
            meshService.disconnect();
            isConnectingRef.current = false;
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-[#0a0f1d] flex flex-col items-center justify-center p-8 text-white">
            {/* Glossy Background Effect */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

            <div className="relative mb-12">
                <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full" />
                <div className="relative w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center border-2 border-brand-primary/30 shadow-[0_0_50px_rgba(37,99,235,0.2)]">
                    <ShieldCheck className="w-16 h-16 text-brand-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-900 p-2 rounded-xl border border-white/10">
                    <Wifi className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
            </div>

            <h1 className="text-4xl font-black mb-2 text-center tracking-tight">Provisionamento</h1>
            <p className="text-slate-400 mb-12 text-center max-w-sm text-sm font-medium leading-relaxed">
                Aguardando autorização segura do <span className="text-white font-bold">Centro de Comando</span> local.
            </p>

            <div className="w-full max-w-md space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="p-3 bg-brand-primary/10 rounded-2xl">
                            <RefreshCcw className="w-6 h-6 text-brand-primary animate-spin-slow" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Status do Processo</p>
                            <p className="font-bold text-lg text-white">{provisioningStatus}</p>
                        </div>
                    </div>

                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden mb-2">
                        <div
                            className="bg-brand-primary h-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                            style={{ width: hasProvisioned ? '100%' : '35%' }}
                        />
                    </div>
                </div>

                {/* Telemetry Display */}
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 font-mono text-[10px]">
                    <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold uppercase tracking-wider">
                        <Activity size={12} /> Live Telemetry
                    </div>
                    <div className="space-y-1.5 opacity-80">
                        {telemetry.map((log, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="text-brand-primary">›</span> {log}
                            </div>
                        ))}
                        {telemetry.length === 0 && <div className="text-slate-600 italic">Sincronizando canais de rádio...</div>}
                    </div>
                </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-2">
                <p className="text-[#334155] text-[10px] font-black uppercase tracking-[0.4em]">
                    Forge Protocol Zero-Touch v2.7
                </p>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 h-1 rounded-full bg-brand-primary/20" />
                    ))}
                </div>
            </div>
        </div>
    );
};
