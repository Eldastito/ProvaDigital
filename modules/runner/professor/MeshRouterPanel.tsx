/**
 * Mesh Router Panel
 * 
 * Interface para transformar o tablet em um roteador de rede local (Hotspot)
 * e servidor de sinalização (Signaling Server) para a rede mesh.
 * 
 * Sprint 2 - Fase 1/2
 */

import React, { useState, useEffect } from 'react';
import { Wifi, Server, Activity, Power, Shield, Users, AlertTriangle } from 'lucide-react';
import { wifiHotspotService, HotspotStatus, WifiHotspotService } from '../../../services/wifiHotspotService';
import { getLocalServer } from '../../../services/localServerService';
import { useToast } from '../../../components/ui/Toast';

interface MeshRouterPanelProps {
    schoolId: string;
    eventId: string;
}

export const MeshRouterPanel: React.FC<MeshRouterPanelProps> = ({ schoolId, eventId }) => {
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const [status, setStatus] = useState<HotspotStatus | null>(null);
    const [serverStats, setServerStats] = useState<any>(null);
    const [config, setConfig] = useState({
        ssid: WifiHotspotService.generateSSID(schoolId, eventId),
        password: WifiHotspotService.generatePassword()
    });

    const localServer = getLocalServer();

    // Carregar status inicial
    useEffect(() => {
        refreshStatus();
        const interval = setInterval(refreshStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const refreshStatus = async () => {
        const s = await wifiHotspotService.getStatus();
        setStatus(s);
        if (s.isActive) {
            setServerStats(localServer.getStats());
        }
    };

    const handleToggle = async () => {
        setLoading(true);
        try {
            if (status?.isActive) {
                // Desativar
                await localServer.stop();
                await wifiHotspotService.stopHotspot();
            } else {
                // Ativar
                await wifiHotspotService.createHotspot({
                    ssid: config.ssid,
                    password: config.password
                });

                await localServer.start({
                    port: 8080,
                    corsOrigins: ['*']
                });
            }
            await refreshStatus();
        } catch (error) {
            toast.error('Erro ao alterar estado do roteador');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="p-6 bg-slate-800 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${status?.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        <Wifi size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Roteador Mesh</h3>
                        <p className="text-sm text-slate-400">Modo de Distribuição Local</p>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition ${status?.isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        } disabled:opacity-50`}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <Power size={20} />
                    )}
                    {status?.isActive ? 'Desativar Roteador' : 'Ativar Roteador'}
                </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuração/Status */}
                <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Shield size={16} /> Credenciais da Rede
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <span className="text-slate-400 text-sm">SSID</span>
                                <span className="font-mono font-bold text-emerald-400">{config.ssid}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <span className="text-slate-400 text-sm">Senha</span>
                                <span className="font-mono font-bold text-emerald-400">{config.password}</span>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-500">
                            <AlertTriangle className="inline mr-1" size={12} />
                            Oriente os alunos a conectarem seus tablets nesta rede Wi-Fi antes de iniciar a prova.
                        </p>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Server size={16} /> Servidor de Sinalização
                        </h4>
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${status?.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium">
                                {status?.isActive ? 'Signaling Online (Porta 8080)' : 'Signaling Offline'}
                            </span>
                        </div>
                        {status?.isActive && (
                            <p className="mt-2 text-xs text-emerald-400/70 font-mono">
                                Endpoint: http://192.168.43.1:8080
                            </p>
                        )}
                    </div>
                </div>

                {/* Estatísticas em Tempo Real */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                            <Users className="mx-auto mb-2 text-blue-400" size={24} />
                            <div className="text-2xl font-bold">{serverStats?.peersCount || 0}</div>
                            <div className="text-xs text-slate-500 uppercase">Peers Conectados</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                            <Activity className="mx-auto mb-2 text-violet-400" size={24} />
                            <div className="text-2xl font-bold">{Math.floor((serverStats?.uptime || 0) / 60)}m</div>
                            <div className="text-xs text-slate-500 uppercase">Uptime Local</div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex-1">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Logs de Atividade</h4>
                        <div className="h-32 overflow-y-auto font-mono text-[10px] space-y-1 bg-black/30 p-2 rounded-lg">
                            <div className="text-slate-500">[SYSTEM] Painel inicializado</div>
                            {status?.isActive && (
                                <>
                                    <div className="text-emerald-400">[HOTSPOT] SSID {config.ssid} criado</div>
                                    <div className="text-emerald-400">[SERVER] Servidor Socket.io ativo na porta 8080</div>
                                    <div className="text-blue-400">[PEERS] Aguardando conexões de alunos...</div>
                                </>
                            )}
                            {serverStats?.peers?.map((p: any, i: number) => (
                                <div key={i} className="text-blue-300">[JOIN] Peer {p.name} conectado</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
