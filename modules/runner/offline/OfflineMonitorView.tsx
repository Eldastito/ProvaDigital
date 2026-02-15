/**
 * Offline Monitor View
 * 
 * Permite ao professor acompanhar quem já entregou a prova (escaneado)
 * e o progresso geral da sala sem necessidade de internet.
 */

import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, AlertCircle, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';
import { offlineConsolidationService, OfflineSubmission } from '../../../services/offlineConsolidationService';
import { useSafeAppStore } from '../../../store/useAppStore';

interface OfflineMonitorViewProps {
    classId: string;
    className: string;
    students: any[];
    eventId: string;
    onBack: () => void;
}

export const OfflineMonitorView: React.FC<OfflineMonitorViewProps> = ({
    classId,
    className,
    students,
    eventId,
    onBack
}) => {
    const [scannedSubmissions, setScannedSubmissions] = useState<OfflineSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        // Atualizar a cada 30s se a tela ficar aberta
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [eventId]);

    const loadData = async () => {
        try {
            const data = await offlineConsolidationService.getSubmissionsByEvent(eventId);
            setScannedSubmissions(data);
        } catch (err) {
            console.error('Erro ao carregar monitor offline:', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: students.length,
        delivered: scannedSubmissions.length,
        pending: students.length - scannedSubmissions.length,
        percent: Math.round((scannedSubmissions.length / (students.length || 1)) * 100)
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-600 font-bold hover:text-brand-primary transition"
                    >
                        <ArrowLeft size={20} /> Voltar ao Painel
                    </button>
                    <button
                        onClick={loadData}
                        className="p-2 text-slate-400 hover:text-brand-primary transition"
                        title="Atualizar"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-200">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-white">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-white/10 rounded-2xl">
                                <Users size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{className}</h1>
                                <p className="opacity-70">Monitoramento de Entrega Offline</p>
                            </div>
                        </div>

                        {/* Progress Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                                <p className="text-sm opacity-70 mb-1">Total Alunos</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <div className="bg-emerald-500/20 p-4 rounded-xl backdrop-blur-sm border border-emerald-500/20">
                                <p className="text-sm text-emerald-300 mb-1">Entregues</p>
                                <p className="text-2xl font-bold text-emerald-400">{stats.delivered}</p>
                            </div>
                            <div className="bg-orange-500/20 p-4 rounded-xl backdrop-blur-sm border border-orange-500/20">
                                <p className="text-sm text-orange-300 mb-1">Pendentes</p>
                                <p className="text-2xl font-bold text-orange-400">{stats.pending}</p>
                            </div>
                            <div className="bg-brand-primary/20 p-4 rounded-xl backdrop-blur-sm border border-brand-primary/20">
                                <p className="text-sm text-brand-primary mb-1">Progresso</p>
                                <p className="text-2xl font-bold text-brand-primary">{stats.percent}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-3">
                        <div
                            className="bg-emerald-500 h-full transition-all duration-1000 ease-out"
                            style={{ width: `${stats.percent}%` }}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={24} className="text-slate-400" />
                        Lista de Alunos
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {students.map((student: any) => {
                            const submission = scannedSubmissions.find(s => s.studentId === student.id);
                            return (
                                <div
                                    key={student.id}
                                    className={`p-4 rounded-2xl border-2 transition-all ${submission
                                            ? 'bg-emerald-50 border-emerald-100'
                                            : 'bg-white border-slate-100'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${submission ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${submission ? 'text-emerald-900' : 'text-slate-700'}`}>
                                                    {student.name}
                                                </p>
                                                {submission ? (
                                                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle size={12} />
                                                        Coletado às {new Date(submission.scannedAt).toLocaleTimeString()}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-slate-400">Aguardando entrega...</p>
                                                )}
                                            </div>
                                        </div>

                                        {!submission && (
                                            <div className="w-8 h-8 rounded-full border-2 border-slate-100 animate-pulse bg-slate-50" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {stats.pending === 0 && stats.total > 0 && (
                    <div className="mt-8 p-6 bg-emerald-100 border-2 border-emerald-200 rounded-3xl flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                            <CheckCircle size={32} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-emerald-900">Coleta concluída!</p>
                            <p className="text-emerald-700">Todos os alunos da sala foram escaneados com sucesso.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
