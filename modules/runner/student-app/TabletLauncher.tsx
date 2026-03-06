import React, { useState, useEffect, useRef } from 'react';
import { meshService } from '../../../services/localMeshService';
import { nativeBridge } from '../../../services/nativeBridgeService';
import { QrCode, ArrowLeft, ShieldCheck, Wifi, RefreshCcw } from 'lucide-react';
import { useSafeAppStore } from '../../../store/useAppStore';

interface TabletLauncherProps {
    onSelectApp: (app: 'COORDINATOR' | 'PROFESSOR' | 'STUDENT', payload?: any) => void;
    onBack: () => void;
}

export const TabletLauncher = ({ onSelectApp, onBack }: TabletLauncherProps) => {
    const state = useSafeAppStore();
    const [provisioningStatus, setProvisioningStatus] = useState<string>('Aguardando sinal da rede...');
    const [hasProvisioned, setHasProvisioned] = useState(false);

    // Usamos refs para evitar loops de renderização e capturar estado atual em closures
    const isConnectingRef = useRef(false);
    const statusRef = useRef(provisioningStatus);

    useEffect(() => {
        statusRef.current = provisioningStatus;
    }, [provisioningStatus]);

    useEffect(() => {
        // Evita que montagens duplicadas disparem múltiplos fluxos
        if (isConnectingRef.current) return;
        isConnectingRef.current = true;

        console.log('[DEBUG] 🏁 Iniciando ciclo de vida do TabletLauncher...');

        const initDiscovery = async () => {
            try {
                const deviceId = await nativeBridge.getDeviceId();
                console.log(`[DEBUG] 🆔 Device ID: ${deviceId}`);

                // Listener de mensagens
                meshService.onMessage(async (msg) => {
                    // Proteção contra processamento redundante se já provisionou
                    if (hasProvisioned) return;

                    console.log(`[DEBUG] 📩 Mensagem Mesh: ${msg.type}`);

                    if (msg.type === 'BIN_VERSION_CHECK') {
                        const { requiredVersion } = msg.payload;
                        const currentVersion = "2.5.0";

                        if (currentVersion !== requiredVersion) {
                            setProvisioningStatus(`Atualizando App para v${requiredVersion}...`);
                            await nativeBridge.downloadUpdateAPK(requiredVersion);
                            window.location.reload();
                        } else {
                            setProvisioningStatus('Dispositivo íntegro. Aguardando dados...');
                            const health = await nativeBridge.checkSecurityHealth();
                            meshService.sendTo(msg.sender.id, 'SECURITY_REPORT', {
                                ...health,
                                serialNumber: deviceId,
                                timestamp: Date.now()
                            });
                        }
                    }

                    if (msg.type === 'PROVISION_CMD') {
                        setHasProvisioned(true);
                        setProvisioningStatus(`Configurando como ${msg.payload.targetRole}...`);

                        // Transição final
                        setTimeout(() => {
                            onSelectApp(msg.payload.targetRole, {
                                source: 'ZERO_TOUCH_PROVISIONING',
                                name: msg.payload.assignedName,
                                exams: msg.payload.exams
                            });
                        }, 1500);
                    }
                });

                // Entra na rede
                meshService.join(deviceId, `Tablet-${deviceId.substring(0, 4)}`, 'UNASSIGNED', state.currentUser?.tenantId);

            } catch (err) {
                console.error('[DEBUG] 💀 Erro no initDiscovery:', err);
                setProvisioningStatus('Erro ao conectar na rede.');
            }
        };

        initDiscovery();

        // Intervalo de retry seguro (não depende de estado re-renderizado)
        const retryInterval = setInterval(() => {
            if (statusRef.current.includes('Aguardando sinal') && !hasProvisioned) {
                nativeBridge.getDeviceId().then(id => {
                    console.log('[DEBUG] 🔄 Retry DISCOVERY...');
                    meshService.broadcast('DISCOVERY', { serialNumber: id });
                });
            }
        }, 8000);

        return () => {
            console.log('[DEBUG] 🛑 Limpando TabletLauncher...');
            clearInterval(retryInterval);
            meshService.disconnect();
            isConnectingRef.current = false;
        };
    }, []); // Array de dependência vazio garante inicialização única

    return (
        <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-8 text-white">
            <div className="absolute top-8 right-8 flex items-center gap-4 text-slate-400">
                <Wifi className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">Rede Ativa</span>
            </div>

            <div className="relative mb-12">
                <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full" />
                <div className="relative w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
                    <ShieldCheck className="w-16 h-16 text-brand-primary" />
                </div>
            </div>

            <h1 className="text-3xl font-bold mb-2 text-center">Provisionamento Inteligente</h1>
            <p className="text-slate-400 mb-8 text-center max-w-md">
                O seu dispositivo está sendo configurado automaticamente pelo Centro de Comando.
            </p>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 w-full max-w-md backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                    <RefreshCcw className="w-5 h-5 text-brand-primary animate-spin" />
                    <span className="font-medium">{provisioningStatus}</span>
                </div>

                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-primary h-full transition-all duration-500" style={{ width: hasProvisioned ? '100%' : '40%' }} />
                </div>
            </div>

            <p className="mt-12 text-slate-500 text-xs font-mono tracking-widest uppercase">
                Protocolo Zero-Touch v2.6 • Estável
            </p>
        </div>
    );
};
