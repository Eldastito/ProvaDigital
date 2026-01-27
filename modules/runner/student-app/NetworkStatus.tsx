/**
 * Network Status Component
 * 
 * Indicador visual de conexão com a rede mesh para o aluno.
 * 
 * Sprint 2 - Fase 6
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { getMeshNetwork } from '../../../services/meshNetworkService';

interface NetworkStatusProps {
    showDetails?: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
    showDetails = false
}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectedNodes, setConnectedNodes] = useState(0);
    const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
    const [showTooltip, setShowTooltip] = useState(false);

    const mesh = getMeshNetwork();

    // Verificar status a cada 2 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            const stats = mesh.getStats();

            setIsConnected(stats.connectedNodes > 0);
            setConnectedNodes(stats.connectedNodes);

            // Determinar qualidade baseado em nodes conectados
            if (stats.connectedNodes >= 3) {
                setQuality('excellent');
            } else if (stats.connectedNodes >= 2) {
                setQuality('good');
            } else if (stats.connectedNodes === 1) {
                setQuality('fair');
            } else {
                setQuality('poor');
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const getIcon = () => {
        if (!isConnected) {
            return <WifiOff size={20} className="text-red-500" />;
        }

        return <Wifi size={20} className={getColorClass()} />;
    };

    const getColorClass = () => {
        if (!isConnected) return 'text-red-500';

        switch (quality) {
            case 'excellent':
                return 'text-green-500';
            case 'good':
                return 'text-blue-500';
            case 'fair':
                return 'text-yellow-500';
            case 'poor':
                return 'text-orange-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusText = () => {
        if (!isConnected) return 'Desconectado';

        switch (quality) {
            case 'excellent':
                return 'Excelente';
            case 'good':
                return 'Boa';
            case 'fair':
                return 'Regular';
            case 'poor':
                return 'Fraca';
            default:
                return 'Desconhecido';
        }
    };

    const getSignalBars = () => {
        const bars = [];
        const barCount = quality === 'excellent' ? 4 : quality === 'good' ? 3 : quality === 'fair' ? 2 : 1;

        for (let i = 0; i < 4; i++) {
            bars.push(
                <div
                    key={i}
                    className={`w-1 rounded-full ${i < barCount ? getColorClass().replace('text-', 'bg-') : 'bg-gray-300'}`}
                    style={{ height: `${(i + 1) * 4}px` }}
                ></div>
            );
        }

        return bars;
    };

    if (!showDetails) {
        // Versão compacta (ícone apenas)
        return (
            <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className="flex items-center gap-1">
                    {getIcon()}
                </div>

                {showTooltip && (
                    <div className="absolute top-full right-0 mt-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 shadow-lg">
                        <div className="font-medium">{getStatusText()}</div>
                        <div className="text-xs text-gray-300">
                            {connectedNodes} {connectedNodes === 1 ? 'dispositivo' : 'dispositivos'}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Versão detalhada
    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Status da Rede</h3>
                {getIcon()}
            </div>

            <div className="space-y-3">
                {/* Qualidade de Sinal */}
                <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Qualidade do Sinal</span>
                        <span className={`font-bold ${getColorClass()}`}>{getStatusText()}</span>
                    </div>

                    <div className="flex items-end gap-1 h-5">
                        {getSignalBars()}
                    </div>
                </div>

                {/* Dispositivos Conectados */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Dispositivos</span>
                    <span className="font-bold text-gray-900">{connectedNodes}</span>
                </div>

                {/* Status */}
                <div className="pt-3 border-t border-gray-200">
                    {isConnected ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Conectado à rede mesh</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="font-medium">Sem conexão</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Versão inline compacta (para header)
 */
export const NetworkStatusInline: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');

    const mesh = getMeshNetwork();

    useEffect(() => {
        const interval = setInterval(() => {
            const stats = mesh.getStats();
            setIsConnected(stats.connectedNodes > 0);

            if (stats.connectedNodes >= 3) setQuality('excellent');
            else if (stats.connectedNodes >= 2) setQuality('good');
            else if (stats.connectedNodes === 1) setQuality('fair');
            else setQuality('poor');
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const getColorClass = () => {
        if (!isConnected) return 'text-red-500';
        if (quality === 'excellent') return 'text-green-500';
        if (quality === 'good') return 'text-blue-500';
        if (quality === 'fair') return 'text-yellow-500';
        return 'text-orange-500';
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm">
            {isConnected ? (
                <Wifi size={16} className={getColorClass()} />
            ) : (
                <WifiOff size={16} className="text-red-500" />
            )}
            <span className={`text-sm font-medium ${getColorClass()}`}>
                {isConnected ? 'Mesh' : 'Offline'}
            </span>
        </div>
    );
};
