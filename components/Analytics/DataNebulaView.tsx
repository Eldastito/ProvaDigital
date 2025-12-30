import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface DataNebulaViewProps {
    level: 'FEDERAL' | 'STATE' | 'MUNICIPAL';
    dataPoints: {
        id: string;
        x: number;
        y: number;
        label: string;
        status: 'NORMAL' | 'WARNING' | 'CRITICAL';
        value: number;
    }[];
    onSelect?: (id: string) => void;
}

export const DataNebulaView = ({ level, dataPoints, onSelect }: DataNebulaViewProps) => {
    const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
    const [positionedPoints, setPositionedPoints] = useState<any[]>([]);

    const getStatusColor = (status: string) => {
        if (status === 'CRITICAL') return 'text-rose-500 bg-rose-500 shadow-rose-500/50';
        if (status === 'WARNING') return 'text-amber-400 bg-amber-400 shadow-amber-400/50';
        return 'text-emerald-400 bg-emerald-400 shadow-emerald-400/50';
    };

    useEffect(() => {
        const newPositions = dataPoints.map(point => {
            const baseX = point.x || Math.random() * 80 + 10;
            const baseY = point.y || Math.random() * 80 + 10;
            const jitterX = (Math.random() - 0.5) * 10;
            const jitterY = (Math.random() - 0.5) * 10;
            return {
                ...point,
                x: Math.max(5, Math.min(95, baseX + jitterX)),
                y: Math.max(5, Math.min(95, baseY + jitterY)),
            };
        });
        setPositionedPoints(newPositions);
    }, [dataPoints]);

    const nebulaStyles = `
        @keyframes float-nebula {
            0% { transform: translate(0, 0); }
            50% { transform: translate(0, -5px); }
            100% { transform: translate(0, 0); }
        }
        .animate-float-nebula {
            animation: float-nebula 3s ease-in-out infinite;
        }
    `;

    return (
        <div className="relative w-full h-full bg-[#0f1d2e] rounded-xl overflow-hidden shadow-2xl border border-slate-700 group">
            <style dangerouslySetInnerHTML={{ __html: nebulaStyles }} />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f1d2e] via-[#162a42] to-[#0f1d2e] opacity-90 pointer-events-none"></div>
            
            <div className="absolute top-6 left-6 z-10 bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-700 shadow-xl pointer-events-none">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Status da Rede</div>
                <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Meta Atingida (6.0+)</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Alerta (5.0 - 5.9)</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Crítico (Abaixo 5.0)</div>
                </div>
            </div>

            {positionedPoints.map(point => (
                <div 
                    key={point.id}
                    className="absolute cursor-pointer animate-float-nebula"
                    style={{ left: `${point.x}%`, top: `${point.y}%`, animationDelay: `${Math.random() * 2}s` }}
                    onMouseEnter={() => setHoveredPoint(point.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => onSelect?.(point.id)}
                >
                    <div className={`rounded-full h-3 w-3 border-2 border-[#0f1d2e] shadow-lg ${getStatusColor(point.status).split(' ')[1]}`}></div>
                    {hoveredPoint === point.id && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-700 rounded-lg p-2 z-30 shadow-xl pointer-events-none">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{point.label}</div>
                            <div className="text-lg font-black text-white">{point.value.toFixed(1)}</div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};