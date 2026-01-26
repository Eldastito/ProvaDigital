import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { useAppStore } from '../../../store/useAppStore';
import { uuidv4 } from '../../../utils/helpers';

interface LiveDemoSetupProps {
    onSessionCreated: (classId: string, examId: string) => void;
}

export const LiveDemoSetup = ({ onSessionCreated }: LiveDemoSetupProps) => {
    const state = useAppStore();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        className: 'Turma Demo - Evento Ao Vivo',
        capacity: 50,
        selectedExamId: ''
    });

    // Ensure exams are loaded
    useEffect(() => {
        state.loadRemoteData();
    }, []);

    const handleCreateSession = async () => {
        if (!config.className || config.capacity < 1) return alert("Configure a turma.");
        setLoading(true);

        try {
            const tenantId = 't1';
            const creatorId = state.currentUser?.id || 'demo-creator';

            // 1. Determine which items to use
            let itemIds: string[] = [];

            if (config.selectedExamId) {
                // Load items from selected exam
                await state.fetchExamItems(config.selectedExamId);
                const selectedExam = state.exams.find(e => e.id === config.selectedExamId);
                if (selectedExam?.items) {
                    itemIds = selectedExam.items.map(item => item.itemId);
                }
            }

            // If no items selected, use default quiz items
            if (itemIds.length === 0) {
                itemIds = ['q1', 'q2', 'q3'];

                // Ensure mock items exist in database
                const mockItemsToInsert = [
                    { id: 'q1', tenant_id: tenantId, owner_id: 'system', type: 'MULTIPLE_CHOICE', statement: 'Qual a capital do Brasil?', alternatives: [{ id: 'a', text: 'Brasília', isCorrect: true }, { id: 'b', text: 'Rio de Janeiro', isCorrect: false }], difficulty: 'FACIL', score: 1, subject: 'Geografia' },
                    { id: 'q2', tenant_id: tenantId, owner_id: 'system', type: 'MULTIPLE_CHOICE', statement: 'Quanto é 2 + 2?', alternatives: [{ id: 'a', text: '4', isCorrect: true }, { id: 'b', text: '5', isCorrect: false }], difficulty: 'FACIL', score: 1, subject: 'Matemática' },
                    { id: 'q3', tenant_id: tenantId, owner_id: 'system', type: 'MULTIPLE_CHOICE', statement: 'O sol é uma estrela?', alternatives: [{ id: 'a', text: 'Sim', isCorrect: true }, { id: 'b', text: 'Não', isCorrect: false }], difficulty: 'FACIL', score: 1, subject: 'Ciências' }
                ];
                await supabase.from('items').upsert(mockItemsToInsert);
            }

            // 2. Generate session code (short, readable)
            const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();

            // 3. Create LiveQuizSession
            const newSession = {
                id: uuidv4(),
                tenantId,
                creatorId,
                title: 'Quiz Interativo - Ao Vivo',
                className: config.className,
                maxParticipants: config.capacity,
                sessionCode,
                itemIds,
                shuffleQuestions: true,
                status: 'WAITING' as const,
                participants: [],
                createdAt: new Date().toISOString(),
                metadata: {}
            };

            await state.addLiveQuizSession(newSession);

            // 4. Create class for backward compatibility with existing Live Demo logic
            const classId = uuidv4();
            const { error: classError } = await supabase.from('classes').insert({
                id: classId,
                school_id: 's1',
                name: config.className,
                series: 'Demo Live',
                shift: 'NOITE',
                capacity: config.capacity,
                status: 'WAITING_PROFESSOR'
            });

            if (classError) throw classError;

            // Pass session ID as examId for backward compatibility
            // (LiveDemoLobby will be updated to use session instead)
            onSessionCreated(classId, newSession.id);

        } catch (error: any) {
            console.error("Erro ao criar sessão:", error);
            alert("Erro ao conectar com o servidor da demo: " + error.message);
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

                    <div className="mb-8">
                        <label className="block text-slate-400 text-sm font-bold mb-2 uppercase tracking-wider">Selecionar Prova (Opcional)</label>
                        <select
                            value={config.selectedExamId}
                            onChange={e => setConfig({ ...config, selectedExamId: e.target.value })}
                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition font-medium appearance-none"
                        >
                            <option value="">Usar Quiz Padrão (Conhecimentos Gerais)</option>
                            {state.exams.filter(e => (e.status === 'PUBLISHED' as any) || (e.status === 'PUBLICADA' as any)).map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.title} ({exam.subject})</option>
                            ))}
                        </select>
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
