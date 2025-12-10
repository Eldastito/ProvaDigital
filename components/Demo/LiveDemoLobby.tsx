
import React, { useState, useEffect } from 'react';
import { X, Smartphone, Users, ShieldCheck, GraduationCap, Wifi } from 'lucide-react';

interface LiveDemoLobbyProps {
    onClose: () => void;
}

export const LiveDemoLobby = ({ onClose }: LiveDemoLobbyProps) => {
    // Generate a Random Session ID for this Demo Instance
    const [sessionId] = useState(() => {
        const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const numbers = "23456789";
        const rL = () => letters[Math.floor(Math.random() * letters.length)];
        const rN = () => numbers[Math.floor(Math.random() * numbers.length)];
        return `DEMO-${rL()}${rL()}${rN()}${rN()}`;
    });

    // Generate current base URL
    const baseUrl = window.location.href.split('?')[0];
    
    // Construct URLs for each role with Session ID
    const studentUrl = `${baseUrl}?mode=mobile&role=STUDENT&session=${sessionId}`;
    const professorUrl = `${baseUrl}?mode=mobile&role=PROFESSOR&session=${sessionId}`;

    // Helper to get QR API URL
    const getQrUrl = (data: string) => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;

    return (
        <div className="fixed inset-0 bg-[#0f1d2e] z-[100] flex flex-col animate-in fade-in duration-500 overflow-y-auto">
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-50"
            >
                <X size={32} />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-screen">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-1 rounded-full border border-emerald-500/30 mb-4 animate-pulse font-mono font-bold">
                        <Wifi size={16}/> SESSÃO ATIVA: {sessionId}
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
                        ExamePad <span className="text-brand-secondary">Live Experience</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        Transforme seu celular em um tablet escolar agora.
                        <br/>
                        Aponte a câmera e entre na <strong>Turma de Demonstração</strong>.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full max-w-5xl">
                    
                    {/* STUDENT CARD */}
                    <div className="bg-slate-800/50 border-4 border-emerald-500 rounded-3xl p-8 flex flex-col items-center text-center hover:bg-slate-800 transition transform hover:scale-105 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                        
                        <div className="bg-emerald-500 text-white p-4 rounded-full mb-6 shadow-lg z-10">
                            <GraduationCap size={48} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 z-10">Sou Aluno</h2>
                        <p className="text-emerald-200 mb-6 text-sm z-10 max-w-xs">Entre na turma, receba a prova e responda em tempo real.</p>
                        
                        <div className="bg-white p-3 rounded-xl shadow-inner mb-6 z-10">
                            <img src={getQrUrl(studentUrl)} alt="QR Aluno" className="w-64 h-64 mix-blend-multiply" />
                        </div>
                        
                        <div className="px-4 py-2 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs break-all z-10 border border-slate-700">
                            ID: {sessionId}
                        </div>
                    </div>

                    {/* PROFESSOR CARD */}
                    <div className="bg-slate-800/50 border-4 border-purple-500 rounded-3xl p-8 flex flex-col items-center text-center hover:bg-slate-800 transition transform hover:scale-105 shadow-[0_0_50px_rgba(168,85,247,0.2)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition"></div>

                        <div className="bg-purple-600 text-white p-4 rounded-full mb-6 shadow-lg z-10">
                            <Users size={48} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 z-10">Sou Professor</h2>
                        <p className="text-purple-200 mb-6 text-sm z-10 max-w-xs">Controle a aplicação, monitore a presença e colete os resultados.</p>
                        
                        <div className="bg-white p-3 rounded-xl shadow-inner mb-6 z-10">
                            <img src={getQrUrl(professorUrl)} alt="QR Professor" className="w-64 h-64 mix-blend-multiply" />
                        </div>

                        <div className="px-4 py-2 bg-slate-900 rounded-lg text-purple-400 font-mono text-xs break-all z-10 border border-slate-700">
                            ID: {sessionId}
                        </div>
                    </div>

                </div>

                <div className="mt-12 flex items-center gap-4 text-slate-500 text-sm bg-black/20 px-6 py-3 rounded-full border border-white/5">
                    <Smartphone size={20} className="animate-pulse text-white"/>
                    <span>Funciona em iOS e Android • Não requer instalação</span>
                </div>
            </div>
        </div>
    );
};
