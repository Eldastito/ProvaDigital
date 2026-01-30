import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, RefreshCw, AlertCircle } from 'lucide-react';
import { Item } from '../../../types';

interface SimulationRendererProps {
    item: Item;
    onInteraction?: (data: any) => void;
}

export const SimulationRenderer: React.FC<SimulationRendererProps> = ({ item, onInteraction }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const config = item.simulationConfig;

    useEffect(() => {
        // Reset state when item changes
        setLoading(true);
        setError(false);
    }, [item.id]);

    useEffect(() => {
        if (!config?.communicationType || config.communicationType === 'NONE') return;

        const handleMessage = (event: MessageEvent) => {
            // Security check: validate origin if possible, though for generic tools it's hard
            // For now, checks if it comes from the iframe source
            if (config.url && !config.url.includes(event.origin) && event.origin !== 'null') {
                // Relaxed check for sandboxed iframes or generic tools
            }

            if (event.data?.type === 'SIMULATION_RESULT' || event.data?.type === 'SCORM_INTERACTION') {
                console.log('📡 Simulation Data:', event.data);
                if (onInteraction) {
                    onInteraction(event.data.payload || event.data);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [config, onInteraction]);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    const reloadSimulation = () => {
        setLoading(true);
        setError(false);
        if (iframeRef.current) {
            iframeRef.current.src = iframeRef.current.src;
        }
    };

    if (!config || !config.url) {
        return (
            <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-2" />
                    <p>Configuração de simulação inválida.</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-all ${isFullscreen ? 'p-0' : 'mb-6'}`}
            style={isFullscreen ? { zIndex: 50 } : {}}
        >
            {/* Header / Controls */}
            <div className={`flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${isFullscreen ? 'absolute top-0 left-0 right-0 z-10 opacity-0 hover:opacity-100 transition-opacity' : ''}`}>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Laboratório Virtual
                </span>

                <div className="flex items-center gap-2">
                    <button
                        onClick={reloadSimulation}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                        title="Recarregar"
                    >
                        <RefreshCw size={16} />
                    </button>

                    {config.allowFullScreen !== false && (
                        <button
                            onClick={toggleFullscreen}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                        >
                            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Simulation Viewport */}
            <div className="relative w-full bg-slate-100 aspect-video md:aspect-[16/9] lg:h-[500px]">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
                    </div>
                )}

                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600">
                        <div className="text-center">
                            <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                            <p>Falha ao carregar a simulação.</p>
                            <button onClick={reloadSimulation} className="mt-2 text-sm underline">Tentar novamente</button>
                        </div>
                    </div>
                ) : (
                    <iframe
                        ref={iframeRef}
                        src={config.url}
                        className="w-full h-full relative z-10"
                        title={`Simulação: ${item.id}`}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        allowFullScreen
                        onLoad={() => setLoading(false)}
                        onError={() => setError(true)}
                    />
                )}
            </div>

            {/* Footer / Caption */}
            {!isFullscreen && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span>Interaja com o elemento acima para responder.</span>
                    {config.parameters && (
                        <span className="font-mono opacity-50">Params: {Object.keys(config.parameters).length}</span>
                    )}
                </div>
            )}
        </div>
    );
};
