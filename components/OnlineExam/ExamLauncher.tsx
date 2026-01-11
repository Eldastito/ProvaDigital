import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { Play, FileText, Clock, AlertTriangle, Accessibility } from 'lucide-react';

export const ExamLauncher = () => {
    const { exams, currentUser } = useAppStore();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const availableExams = exams.filter(e =>
        e.status === 'ACTIVE' || e.status === 'PUBLICADA' || e.status === 'DRAFT'
    ).filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleLaunch = (examId: string) => {
        // In a real scenario, we might check for 'registrations' first.
        // For testing/demo, we launch directly for the current user.
        navigate(`/online-exam/${examId}`);
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
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${exam.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {exam.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{exam.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{exam.subject}</p>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                <Clock size={14} /> {exam.durationMinutes} min
                            </div>
                            <button
                                onClick={() => handleLaunch(exam.id)}
                                className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-brand-dark transition flex items-center gap-2"
                            >
                                <Play size={16} /> Iniciar
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
