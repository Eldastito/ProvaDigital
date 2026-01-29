import React from 'react';
import { ShieldAlert, Maximize } from 'lucide-react';

interface LockdownOverlayProps {
    isVisible: boolean;
    violationCount?: number;
    onReEnter: () => void;
}

export const LockdownOverlay = ({ isVisible, violationCount = 0, onReEnter }: LockdownOverlayProps) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
            <div className="bg-red-500/10 p-6 rounded-full border-4 border-red-500 mb-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-pulse">
                <ShieldAlert size={64} className="text-red-500" />
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight uppercase">
                Modo de Segurança Ativo
            </h1>

            <p className="text-lg text-slate-300 max-w-lg mb-8 leading-relaxed">
                A prova foi interrompida porque você saiu do modo de tela cheia ou alternou de janela.
            </p>

            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl mb-8 flex items-center gap-3 text-red-400 font-bold">
                <span className="bg-red-500/20 px-2 py-1 rounded text-xs border border-red-500/50">ALERTA</span>
                {violationCount} infrações registradas
            </div>

            <button
                onClick={onReEnter}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-brand-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary hover:bg-brand-dark active:scale-95"
            >
                <Maximize size={24} className="group-hover:scale-110 transition-transform" />
                Retornar à Prova
            </button>

            <p className="mt-8 text-xs text-slate-500 uppercase tracking-widest font-bold">
                ExamePad Secure Browser Check
            </p>
        </div>
    );
};
