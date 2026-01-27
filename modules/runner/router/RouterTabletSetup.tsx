/**
 * Router Tablet Setup Component
 * 
 * Interface para configurar tablet como roteador Wi-Fi
 * para rede mesh offline.
 * 
 * Sprint 2 - Fase 1
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Server, Users, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { wifiHotspotService, HotspotConfig, HotspotStatus } from '../../../services/wifiHotspotService';
import { getLocalServer } from '../../../services/localServerService';

interface RouterTabletSetupProps {
    eventId: string;
    schoolId: string;
    onReady?: () => void;
}

export const RouterTabletSetup: React.FC<RouterTabletSetupProps> = ({
    eventId,
    schoolId,
    onReady
}) => {
    const [step, setStep] = useState<'SETUP' | 'STARTING' | 'ACTIVE'>('SETUP');
    const [hotspotStatus, setHotspotStatus] = useState<HotspotStatus | null>(null);
    const [ssid, setSSID] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [serverStats, setServerStats] = useState<any>(null);

    // Gerar SSID e senha ao montar
    useEffect(() => {
        const generatedSSID = wifiHotspotService.constructor.generateSSID(schoolId, eventId);
        const generatedPassword = wifiHotspotService.constructor.generatePassword();

        setSSID(generatedSSID);
        setPassword(generatedPassword);
    }, [eventId, schoolId]);

    // Verificar status a cada 5s quando ativo
    useEffect(() => {
        if (step !== 'ACTIVE') return;

        const interval = setInterval(async () => {
            const status = await wifiHotspotService.getStatus();
            setHotspotStatus(status);

            // Atualizar stats do servidor
            const server = getLocalServer();
            const stats = server.getStats();
            setServerStats(stats);
        }, 5000);

        return () => clearInterval(interval);
    }, [step]);

    /**
     * Iniciar hotspot e servidor
     */
    const handleStart = async () => {
        try {
            setStep('STARTING');
            setError(null);

            // 1. Criar hotspot
            const config: HotspotConfig = {
                ssid,
                password,
                band: '2.4GHz',
                maxConnections: 40
            };

            const status = await wifiHotspotService.createHotspot(config);
            setHotspotStatus(status);

            // 2. Iniciar servidor local
            const server = getLocalServer();
            await server.start({ port: 8080, corsOrigins: ['*'] });

            // 3. Marcar como ativo
            setStep('ACTIVE');

            if (onReady) {
                onReady();
            }

        } catch (err: any) {
            console.error('Erro ao iniciar:', err);
            setError(err.message || 'Erro desconhecido');
            setStep('SETUP');
        }
    };

    /**
     * Parar hotspot e servidor
     */
    const handleStop = async () => {
        try {
            setError(null);

            // Parar servidor
            const server = getLocalServer();
            await server.stop();

            // Parar hotspot
            await wifiHotspotService.stopHotspot();

            setStep('SETUP');
            setHotspotStatus(null);
            setServerStats(null);

        } catch (err: any) {
            console.error('Erro ao parar:', err);
            setError(err.message || 'Erro ao parar');
        }
    };

    /**
     * Copiar credenciais
     */
    const handleCopyCredentials = () => {
        const text = `Rede: ${ssid}\nSenha: ${password}`;
        navigator.clipboard.writeText(text);
        alert('Credenciais copiadas!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-700 p-6">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            {step === 'ACTIVE' ? (
                                <Wifi className="text-orange-600" size={32} />
                            ) : (
                                <WifiOff className="text-orange-400" size={32} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Tablet Roteador</h1>
                            <p className="text-gray-600">Configure este tablet como ponto de acesso Wi-Fi</p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex gap-2">
                        {step === 'SETUP' && (
                            <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                ⚪ Aguardando Configuração
                            </span>
                        )}
                        {step === 'STARTING' && (
                            <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-2">
                                <RefreshCw size={16} className="animate-spin" />
                                🟡 Iniciando...
                            </span>
                        )}
                        {step === 'ACTIVE' && (
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                🟢 Ativo e Funcionando
                            </span>
                        )}
                    </div>
                </div>

                {/* Setup Card */}
                {step === 'SETUP' && (
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Credenciais da Rede</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome da Rede (SSID)
                                </label>
                                <input
                                    type="text"
                                    value={ssid}
                                    onChange={(e) => setSSID(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none font-mono text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Senha
                                </label>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none font-mono text-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-red-800">Erro</p>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleStart}
                                disabled={!ssid || !password || password.length < 8}
                                className="flex-1 bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                <Wifi size={24} />
                                Iniciar Hotspot
                            </button>

                            <button
                                onClick={handleCopyCredentials}
                                className="px-6 py-4 border-2 border-orange-600 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors"
                            >
                                Copiar
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                            <p className="text-sm text-blue-800">
                                <strong>ℹ️ Como funciona:</strong> Este tablet criará uma rede Wi-Fi local. Outros tablets (professor e alunos) devem se conectar a esta rede para participar da prova offline.
                            </p>
                        </div>
                    </div>
                )}

                {/* Active Card */}
                {step === 'ACTIVE' && hotspotStatus && (
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Rede Ativa</h2>
                            <button
                                onClick={handleStop}
                                className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                            >
                                Parar Hotspot
                            </button>
                        </div>

                        {/* Credenciais */}
                        <div className="bg-gradient-to-r from-orange-100 to-orange-50 p-6 rounded-xl mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Nome da Rede</p>
                                    <p className="font-mono text-xl font-bold text-orange-900">{hotspotStatus.ssid}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Senha</p>
                                    <p className="font-mono text-xl font-bold text-orange-900">{password}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCopyCredentials}
                                className="mt-4 w-full py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                            >
                                Copiar Credenciais
                            </button>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-xl text-center">
                                <div className="flex justify-center mb-2">
                                    <Users className="text-gray-600" size={32} />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{serverStats?.peersCount || 0}</p>
                                <p className="text-sm text-gray-600">Conectados</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl text-center">
                                <div className="flex justify-center mb-2">
                                    <Server className="text-gray-600" size={32} />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {hotspotStatus.ipAddress || '192.168.43.1'}
                                </p>
                                <p className="text-sm text-gray-600">IP do Servidor</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl text-center">
                                <div className="flex justify-center mb-2">
                                    <Check className="text-green-600" size={32} />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {Math.floor((serverStats?.uptime || 0) / 60)}m
                                </p>
                                <p className="text-sm text-gray-600">Tempo Ativo</p>
                            </div>
                        </div>

                        {/* Lista de Peers */}
                        {serverStats?.peers && serverStats.peers.length > 0 && (
                            <div>
                                <h3 className="font-bold text-lg mb-3">Dispositivos Conectados</h3>
                                <div className="space-y-2">
                                    {serverStats.peers.map((peer: any) => (
                                        <div
                                            key={peer.id}
                                            className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">{peer.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {peer.type} • Há {Math.floor((Date.now() - peer.connectedAt) / 1000)}s
                                                </p>
                                            </div>
                                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Instruções */}
                        <div className="mt-6 p-4 bg-green-50 rounded-xl">
                            <p className="text-sm text-green-800">
                                <strong>✅ Hotspot ativo!</strong> Outros tablets podem se conectar à rede <strong>{hotspotStatus.ssid}</strong> usando a senha acima.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
