import React from 'react';
import { Smartphone, Unlock, Lock, Zap, Clock, Users, UserPlus, CheckCircle } from 'lucide-react';
import { getQrUrl } from '../../../utils/helpers';

interface LiveDemoActiveDashboardProps {
    classId: string;
    examId: string;
    capacity: number;
    joinedStudents: any[];
    presentCount: number;
    fillPercentage: number;
    isEntryLocked: boolean;
    timeLeftToLock: string;
    toleranceEndTime: number | null;
    onManualFinish: () => void;
    submissions: Set<string>;
    securityAlerts: Map<string, string>;
}

export const LiveDemoActiveDashboard = ({
    classId,
    examId,
    capacity,
    joinedStudents,
    presentCount,
    fillPercentage,
    isEntryLocked,
    timeLeftToLock,
    toleranceEndTime,
    onManualFinish,
    submissions,
    securityAlerts
}: LiveDemoActiveDashboardProps) => {

    const baseUrl = window.location.origin;
    const studentUrl = `${baseUrl}/apps/demo?mode=mobile&role=STUDENT&classId=${classId}&examId=${examId}`;

    return (
        <div className="flex-1 flex flex-col lg:flex-row">
            {/* LEFT: QR CODE ALUNOS */}
            <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center items-center text-center border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-br from-[#0f1d2e] to-[#1e293b]">
                <div className="mb-8">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1 rounded-full text-sm font-bold animate-in slide-in-from-top-4 flex items-center gap-2 w-fit mx-auto">
                        <Unlock size={14} /> SESSÃO LIBERADA PELO PROFESSOR
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mt-4 leading-tight">
                        Entre na Turma<br /><span className="text-brand-secondary">Agora!</span>
                    </h1>
                    <p className="text-lg text-slate-400 mt-4 max-w-md mx-auto">
                        Aponte a câmera do seu celular para participar da experiência.
                    </p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-brand-primary/20 relative group animate-in zoom-in duration-500">
                    <img src={getQrUrl(studentUrl)} alt="QR Code Student" className="w-72 h-72 lg:w-96 lg:h-96 mix-blend-multiply" />
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-mono border border-slate-700 flex items-center gap-2 whitespace-nowrap">
                        <Smartphone size={14} /> Acesso Aluno
                    </div>
                </div>
            </div>

            {/* RIGHT: REALTIME DASHBOARD */}
            <div className="lg:w-1/2 p-8 bg-slate-900 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                        <div className="text-slate-400 text-xs uppercase font-bold mb-1">Alunos Presentes</div>
                        <div className="text-5xl font-black text-white flex items-center gap-3">
                            {presentCount}
                            <span className="text-sm font-medium text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">de {capacity}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full mt-4 overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${fillPercentage}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                        <div className="text-slate-400 text-xs uppercase font-bold mb-1">Status da Prova</div>
                        <div className="text-3xl font-black text-emerald-400 mt-2 flex items-center justify-center gap-2">
                            {isEntryLocked ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-red-400 flex items-center gap-2"><Lock size={24} /> ENTRADA ENCERRADA</span>
                                    <span className="text-xs text-slate-500 mt-1">Apenas finalizando quem já entrou</span>
                                </div>
                            ) : toleranceEndTime ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-amber-400 flex items-center gap-2 animate-pulse"><Clock size={24} /> {timeLeftToLock}</span>
                                    <span className="text-xs text-slate-500 mt-1">Tempo Restante para Entrada</span>
                                </div>
                            ) : (
                                <span className="text-slate-500 text-base">Aguardando Início...</span>
                            )}
                        </div>

                        {/* MANUAL FINISH BUTTON */}
                        <button
                            onClick={() => {
                                if (confirm("Deseja realmente encerrar a prova para TODOS?")) {
                                    onManualFinish();
                                }
                            }}
                            className="mt-4 w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                        >
                            <CheckCircle size={16} /> Encerrar Agora
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><Users size={18} className="text-brand-secondary" /> Lista de Chamada</h3>
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Ao Vivo
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {joinedStudents.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                <UserPlus size={48} className="mb-2 opacity-20" />
                                <p>Aguardando alunos entrarem...</p>
                            </div>
                        ) : (
                            joinedStudents.map((student) => (
                                <div key={student.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-xl border border-slate-600 animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center font-bold text-xs text-slate-300">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{student.name}</div>
                                            <div className="text-xs text-slate-400">ID: {student.ra || '---'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Security Status Badge */}
                                        {securityAlerts.has(student.id) ? (
                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/50 flex items-center gap-1" title={securityAlerts.get(student.id)}>
                                                ⚠️ <span className="hidden md:inline">{securityAlerts.get(student.id)}</span>
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                                                Online
                                            </span>
                                        )}
                                        {/* Completion Status */}
                                        {submissions.has(student.id) && (
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/50 flex items-center gap-1">
                                                <CheckCircle size={10} /> Entregue
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
