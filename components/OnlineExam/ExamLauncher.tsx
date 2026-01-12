import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { Play, FileText, Clock, AlertTriangle, Accessibility } from 'lucide-react';
import { ExamStatus } from '../../types';

export const ExamLauncher = () => {
    const { exams, currentUser, getRecommendedVariant } = useAppStore();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const availableExams = exams.filter(e =>
        e.status === ExamStatus.ACTIVE || e.status === ExamStatus.DRAFT
    ).filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isJoinable = (exam: any) => {
        if (!exam.scheduledDate) return true;
        const start = new Date(exam.scheduledDate).getTime();
        const now = Date.now();
        const end = start + (exam.durationMinutes * 60 * 1000);
        return now >= start && now <= end;
    };

    const handleLaunch = async (exam: any) => {
        if (!isJoinable(exam)) {
            alert("Esta prova não está disponível no momento. Verifique o horário agendado.");
            return;
        }

        if (!currentUser) return;

        try {
            const variantId = await getRecommendedVariant(currentUser.id, exam.id);
            const url = variantId
                ? `/online-exam/${exam.id}?variantId=${variantId}`
                : `/online-exam/${exam.id}`;
            navigate(url);
        } catch (e) {
            console.error("Error finding recommended variant:", e);
            navigate(`/online-exam/${exam.id}`);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <Accessibility className="text-brand-primary" size={32} />
                    Aplicação de Prova (Modo Inclusivo)
                </h1>
                <p className="text-slate-500">
                    Selecione uma prova abaixo para iniciar o ambiente seguro com suporte a PCD e Neurodivergência.
                </p>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Buscar prova..."
                    className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map(exam => (
                    <div key={exam.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-brand-primary rounded-lg">
                                <FileText size={24} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${exam.status === ExamStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {exam.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{exam.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{exam.subject}</p>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                    <Clock size={14} /> {exam.durationMinutes} min
                                </div>
                                {exam.scheduledDate && (
                                    <div className="text-[10px] text-brand-primary font-bold">
                                        {new Date(exam.scheduledDate).toLocaleString('pt-BR')}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleLaunch(exam)}
                                disabled={!isJoinable(exam)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center gap-2 ${isJoinable(exam)
                                    ? 'bg-brand-primary text-white hover:bg-brand-dark'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <Play size={16} /> {isJoinable(exam) ? 'Iniciar' : 'Aguarde'}
                            </button>
                        </div>
                    </div>
                ))}

                {availableExams.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <AlertTriangle className="mx-auto mb-2 opacity-50" size={32} />
                        <p>Nenhuma prova encontrada.</p>
                        <button onClick={() => navigate('/exams/new')} className="text-brand-primary font-bold hover:underline mt-2">
                            Criar nova prova
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
