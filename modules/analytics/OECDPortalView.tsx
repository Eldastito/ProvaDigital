import React, { useState } from 'react';
import { Globe, BookOpen, ShieldCheck, Download, Users, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Exam, ExamModel, ExamStatus } from '../../types';
import { useAppStore } from '../../store/useAppStore';

export const OECDPortalView = ({ onBack }: { onBack: () => void }) => {
    const state = useAppStore();
    const { exams } = state;

    // Filtrar apenas avaliações do padrão OCDE
    const oecdExams = exams.filter(e => e.model === ExamModel.OCDE_PISA || e.isOfficialStandard);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="bg-slate-100 p-2 rounded hover:bg-slate-200 transition">
                        <Globe size={20} className="text-brand-primary" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Portal de Excelência Internacional OCDE</h1>
                        <p className="text-xs text-slate-500 font-medium">Monitoramento de Padrões PISA e Literacias Globais</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100">
                        Nível: Gestão Estratégica
                    </span>
                </div>
            </div>

            <div className="p-8 max-w-[1400px] mx-auto space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <PortalStat card="Média PISA Prevista" value="482" trend="+12" icon={BarChart3} color="text-brand-primary" />
                    <PortalStat card="Adesão da Rede" value="94.2%" trend="+2.1%" icon={Users} color="text-emerald-600" />
                    <PortalStat card="Padrões Ativos" value={oecdExams.length.toString()} trend="Novo" icon={BookOpen} color="text-indigo-600" />
                    <PortalStat card="Índice de Qualidade" value="A+" trend="Stable" icon={ShieldCheck} color="text-amber-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Lista de Avaliações Oficiais */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Avaliações de Referência OCDE</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {oecdExams.length === 0 ? (
                                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4">
                                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                        <BookOpen className="text-slate-300" size={32} />
                                    </div>
                                    <h4 className="font-bold text-slate-400">Nenhuma avaliação padrão OCDE emitida.</h4>
                                    <p className="text-sm text-slate-400 max-w-sm mx-auto">O MEC ou a Secretaria Estadual podem emitir padrões globais para sincronização com a rede.</p>
                                </div>
                            ) : (
                                oecdExams.map(exam => (
                                    <div key={exam.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-brand-light text-brand-primary rounded-xl">
                                                    <Globe size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{exam.title}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        Soberania: {exam.isOfficialStandard ? 'Oficial (MEC)' : 'Regional'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 text-slate-400 hover:text-brand-primary transition"><Download size={18} /></button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`Deseja distribuir "${exam.title}" para toda a rede? Esta ação é irreversível.`)) {
                                                            state.distributeOECDExam(exam.id);
                                                            alert('Ação de distribuição iniciada com sucesso.');
                                                        }
                                                    }}
                                                    className="bg-brand-primary text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-brand-primary/20 hover:scale-105 transition flex items-center gap-2"
                                                >
                                                    Distribuir à Rede <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4 mt-4">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Domínio OCDE</p>
                                                <p className="text-sm font-medium text-slate-700">{exam.subject}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Meta de Desempenho</p>
                                                <p className="text-sm font-medium text-emerald-600">Level 4 (Proficient)</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Status de Sincronia</p>
                                                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                                    <CheckCircle2 size={12} className="text-emerald-500" /> {exam.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Insights de Gestão */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Telemetria de Gestão</h3>
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20 space-y-6">
                            <div>
                                <h4 className="font-bold text-indigo-400 text-sm mb-2">Resiliência Literária</h4>
                                <div className="space-y-3">
                                    <ProgressItem label="Literacia em Matemática" value={68} color="bg-brand-primary" />
                                    <ProgressItem label="Literacia em Leitura" value={74} color="bg-emerald-500" />
                                    <ProgressItem label="Ciências e Tecnologia" value={62} color="bg-indigo-500" />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <p className="text-[10px] text-white/50 uppercase font-black tracking-tighter mb-2">Recomendação da IA de Gestão</p>
                                <p className="text-xs text-white/80 leading-relaxed italic">
                                    "A rede apresenta convergência para o Nível 3 da OCDE. Recomendamos intensificar intervenções focadas em resolução de problemas complexos em Matemática para atingir o benchmark estatual."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PortalStat = ({ card, value, trend, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 bg-slate-50 ${color} rounded-2xl`}>
                <Icon size={22} />
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-light text-brand-primary'}`}>
                {trend}
            </span>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{card}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
);

const ProgressItem = ({ label, value, color }: any) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold">
            <span className="text-white/60">{label}</span>
            <span>{value}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
        </div>
    </div>
);
