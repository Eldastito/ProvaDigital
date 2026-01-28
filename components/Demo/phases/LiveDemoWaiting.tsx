import React from 'react';
import { Lock } from 'lucide-react';
import { getQrUrl } from '../../../utils/helpers';

interface LiveDemoWaitingProps {
    classId: string;
    examId: string;
    securityPin: string;
}

export const LiveDemoWaiting = ({ classId, examId, securityPin }: LiveDemoWaitingProps) => {
    // Smart URL: Use env var for local network, or window.location.origin for production
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const professorUrl = `${baseUrl}/apps/demo?mode=mobile&role=PROFESSOR&classId=${classId}&examId=${examId}&action=CONTROL`;

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit.png')] opacity-5"></div>

            <div className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl shadow-purple-500/20 mb-8 animate-in zoom-in duration-500">
                <div className="absolute -top-4 -left-4 bg-purple-600 text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg transform -rotate-12 border-2 border-slate-900">
                    ACESSO PROFESSOR
                </div>
                <img src={getQrUrl(professorUrl)} alt="QR Code Professor" className="w-64 h-64 mix-blend-multiply" />
            </div>

            <h1 className="text-4xl font-bold text-white mb-2 relative z-10">Escaneie para assumir o controle</h1>

            <div className="mt-4 mb-8 bg-slate-800 border border-slate-700 p-4 rounded-xl inline-block relative z-10 animate-pulse">
                <div className="text-xs text-slate-400 uppercase font-bold mb-1">PIN DE SEGURANÇA</div>
                <div className="text-3xl font-mono font-black text-brand-secondary tracking-[0.5em]">{securityPin}</div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-purple-400 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-500/30 relative z-10">
                <Lock size={18} />
                <span className="text-sm font-mono font-bold">SALA BLOQUEADA PARA ALUNOS</span>
            </div>
        </div>
    );
};
