import React, { useState, useEffect } from 'react';
import { useToast } from '../../../components/ui/Toast';

import { Play, Globe, Search, CheckCircle, BookOpen, Sparkles } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { useAppStore } from '../../../store/useAppStore';
import { uuidv4 } from '../../../utils/helpers';
import { MOCK_TENANT_ID } from '../../../utils/mockData';

interface LiveDemoSetupProps {
    onSessionCreated: (classId: string, examId: string) => void;
}

export const LiveDemoSetup = ({ onSessionCreated }: LiveDemoSetupProps) => {
    const state = useAppStore();
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const [config, setConfig] = useState({
        className: 'Turma Demo - Evento Ao Vivo',
        capacity: 50,
        selectedExamId: ''
    });
    const [showNetworkExams, setShowNetworkExams] = useState(false);

    // Fetch networked exams on toggle
    useEffect(() => {
        if (showNetworkExams && state.networkExams?.length === 0) {
            state.fetchNetworkExams();
        }
    }, [showNetworkExams]);

    // Combinar exames (Locais + Rede se ativado)
    const availableExams = React.useMemo(() => {
        const localExams = state.exams.filter(e =>
            ((e.status === 'PUBLISHED' as any) || (e.status === 'PUBLICADA' as any) || e.status === 'ACTIVE') &&
            !e.title.toLowerCase().includes('quiz interativo')
        );

        if (!showNetworkExams) return localExams;

        // Merge evitando duplicatas localmente se já existirem
        const network = state.networkExams || [];
        const all = [...localExams];

        network.forEach(netExam => {
            if (!all.find(e => e.id === netExam.id)) {
                all.push(netExam);
            }
        });

        return all;
    }, [state.exams, state.networkExams, showNetworkExams]);

    // Ensure exams are loaded
    useEffect(() => {
        state.loadRemoteData();
    }, []);

    // Auto-select first real exam when exams load
    useEffect(() => {
        if (state.exams.length > 0 && !config.selectedExamId) {
            const firstRealExam = state.exams.find(e =>
                ((e.status === 'PUBLISHED' as any) || (e.status === 'PUBLICADA' as any) || e.status === 'ACTIVE')
                && !e.title.toLowerCase().includes('quiz interativo')
            );
            if (firstRealExam) {
                setConfig(prev => ({ ...prev, selectedExamId: firstRealExam.id }));
            }
        }
    }, [state.exams]);

    const handleCreateSession = async () => {
        if (!config.className || config.capacity < 1) return toast.warning("Configure a turma.");
        setLoading(true);

        try {
            // ...
            const tenantId = MOCK_TENANT_ID;
            const schoolId = 's1';

            // 1. Ensure exam items are loaded
            if (config.selectedExamId) {
                await state.fetchExamItems(config.selectedExamId);
            }

            const classId = uuidv4();
            let examId = config.selectedExamId;

            // If no exam selected, use or create default "Quiz Interativo"
            if (!examId) {
                const { data: existingExams } = await supabase
                    .from('exams')
                    .select('id')
                    .eq('title', 'Quiz Interativo - Ao Vivo')
                    .eq('status', 'PUBLICADA')
                    .limit(1);

                if (existingExams && existingExams.length > 0) {
                    examId = existingExams[0].id;
                } else {
                    examId = uuidv4();
                }
            }

            // Create Class
            const { error: classError } = await supabase.from('classes').insert({
                id: classId,
                school_id: schoolId,
                name: config.className,
                series: 'Demo Live',
                shift: 'NOITE',
                capacity: config.capacity,
                status: 'WAITING_PROFESSOR'
            });

            if (classError) throw classError;

            // Check/Create Exam
            const { data: checkExam } = await supabase.from('exams').select('id').eq('id', examId).single();

            if (!checkExam) {
                // Create Default Exam
                const { error: examError } = await supabase.from('exams').insert({
                    id: examId,
                    tenant_id: tenantId,
                    school_id: schoolId,
                    title: 'Quiz Interativo - Ao Vivo',
                    subject: 'Conhecimentos Gerais',
                    status: 'PUBLICADA',
                    items_config: [
                        { itemId: 'q1', order: 1 },
                        { itemId: 'q2', order: 2 },
                        { itemId: 'q3', order: 3 }
                    ],
                    class_ids: [classId]
                });

                // Insert Mock Items
                const mockItemsToInsert = [
                    { id: 'q1', tenant_id: tenantId, owner_id: 'system', type: 'MULTIPLE_CHOICE', statement: 'Qual a capital do Brasil?', alternatives: [{ id: 'a', text: 'Brasília', isCorrect: true }, { id: 'b', text: 'Rio de Janeiro', isCorrect: false }], difficulty: 'FACIL', score: 1 },
                    { id: 'q2', tenant_id: tenantId, owner_id: 'system', type: 'MULTIPLE_CHOICE', statement: 'Quanto é 2 + 2?', alternatives: [{ id: 'a', text: '4', isCorrect: true }, { id: 'b', text: '5', isCorrect: false }], difficulty: 'FACIL', score: 1 },
                    { id: 'q3', tenant_id: tenantId, owner_id: 'system', type: 'MULTIPLE_CHOICE', statement: 'O sol é uma estrela?', alternatives: [{ id: 'a', text: 'Sim', isCorrect: true }, { id: 'b', text: 'Não', isCorrect: false }], difficulty: 'FACIL', score: 1 }
                ];

                await supabase.from('items').upsert(mockItemsToInsert); // safe upsert
                if (examError) throw examError;
            } else {
                // Link class to existing exam
                const { error: updateError } = await supabase.rpc('append_class_to_exam', {
                    p_exam_id: examId,
                    p_class_id: classId
                });
                if (updateError) console.warn("RPC failed, relying on direct ID linkage if applicable.");
            }

            onSessionCreated(classId, examId!);

        } catch (error: any) {
            console.error("Erro ao criar sessão:", error);
            toast.error('Erro ao conectar', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col lg:flex-row">
            {/* Left: Hero */}
            <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center items-start text-left border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-br from-indigo-900 to-slate-900">
                <span className="bg-brand-secondary/20 text-brand-secondary px-3 py-1 rounded-full text-sm font-bold mb-6">Modo Apresentação v2.0</span>
                <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight">
                    Experiência <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-purple-400">Ao Vivo</span>
                </h1>
                <p className="text-xl text-slate-300 mb-8 max-w-lg leading-relaxed">
                    Simule uma aplicação de prova completa em tempo real. Crie uma sala, convide a plateia via QR Code e acompanhe os resultados instantaneamente.
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Realtime Database</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Proctoring IA</div>
                </div>
            </div>

            {/* Right: Config Form */}
            <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-slate-900">
                <div className="max-w-md w-full mx-auto">
                    <div className="mb-8">
                        <label className="block text-slate-400 text-sm font-bold mb-2 uppercase tracking-wider">Nome da Turma / Evento</label>
                        <input
                            type="text"
                            value={config.className}
                            onChange={e => setConfig({ ...config, className: e.target.value })}
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition font-medium"
                            placeholder="Ex: Workshop de Tecnologia"
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-slate-400 text-sm font-bold mb-2 uppercase tracking-wider">Capacidade Estimada</label>
                        <input
                            type="number"
                            value={config.capacity}
                            onChange={e => setConfig({ ...config, capacity: Number(e.target.value) })}
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition font-medium"
                        />
                    </div>

                    <div className="mb-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-1 border border-white/5">
                        <div className="p-4 pb-2 flex justify-between items-center">
                            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <BookOpen size={14} className="text-brand-primary" />
                                Selecionar Prova
                            </label>
                            <button
                                onClick={() => setShowNetworkExams(!showNetworkExams)}
                                className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${showNetworkExams ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'}`}
                            >
                                <Globe size={12} />
                                {showNetworkExams ? 'Rede Conectada' : 'Buscar na Rede'}
                            </button>
                        </div>

                        <div className="space-y-1 max-h-[240px] overflow-y-auto p-2 custom-scrollbar">
                            {availableExams.length === 0 ? (
                                <div className="text-center py-8 text-slate-600 text-sm">
                                    Nenhuma prova encontrada.
                                </div>
                            ) : availableExams.map(exam => {
                                const isSelected = config.selectedExamId === exam.id;
                                const isNetwork = (exam as any).isNetwork;

                                return (
                                    <div
                                        key={exam.id}
                                        onClick={() => setConfig({ ...config, selectedExamId: exam.id })}
                                        className={`group relative p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between
                                            ${isSelected
                                                ? 'bg-brand-primary/10 border-brand-primary shadow-lg shadow-indigo-900/20'
                                                : 'bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10'}
                                        `}
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                {isNetwork && <span className="text-[10px] bg-sky-900/50 text-sky-300 px-1.5 rounded border border-sky-700/50 flex gap-1 items-center"><Globe size={8} /> REDE</span>}
                                                <h4 className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                                    {exam.title}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                                <span>{exam.subject || 'Geral'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                <span className="truncate opacity-70 text-[10px]">{exam.id.slice(0, 8)}...</span>
                                            </p>
                                        </div>

                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary text-white scale-100' : 'bg-slate-800 text-slate-600 scale-90 group-hover:bg-slate-700'}`}>
                                            {isSelected ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-slate-600" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {showNetworkExams && (
                            <div className="px-4 py-2 text-center border-t border-white/5">
                                <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                    <Sparkles size={10} className="text-amber-400" />
                                    <span>Mostrando as 50 provas públicas mais recentes da rede.</span>
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCreateSession}
                        disabled={loading}
                        className="w-full bg-brand-primary hover:bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
                    >
                        {loading ? 'Criando Sessão...' : <><Play size={24} fill="currentColor" /> Criar Sessão Ao Vivo</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
