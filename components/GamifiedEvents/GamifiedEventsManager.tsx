
import React, { useState } from 'react';
import { Trophy, Plus, Calendar, Users, Target, Save, Edit, Play, CheckCircle, Clock, X, Award, ChevronDown, ChevronUp, AlertCircle, Coins, Eye, Zap } from 'lucide-react';
import { AppState, GamifiedEvent, GamifiedEventStatus, User, UserRole, GamifiedEventType } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { uuidv4 } from '../../utils/helpers';

export const GamifiedEventsManager = () => {
    const state = useAppStore();
    const { currentUser: user, addGamifiedEvent, updateGamifiedEvent } = state;

    if (!user) return null;
    const [view, setView] = useState<'LIST' | 'CREATE' | 'MANAGE' | 'LIVE'>('LIST');
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // Create Form State
    const [form, setForm] = useState<Partial<GamifiedEvent>>({
        title: '',
        type: 'QUIZ_SHOW',
        subject: '',
        description: '',
        rules: '',
        eventDate: '',
        registrationDeadline: '',
        rewardCoins: 100
    });

    // Score Input State (for Live Mode)
    const [scoreInputs, setScoreInputs] = useState<Record<string, number>>({});

    // Safe filter: If admin (no schoolId), show all? Or just empty? Let's show all for Admin, filtered for others.
    const myEvents = (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.TENANT_ADMIN)
        ? state.gamifiedEvents
        : state.gamifiedEvents.filter(e => e.schoolId === user.schoolId);
    const selectedEvent = state.gamifiedEvents.find(e => e.id === selectedEventId);

    // --- ACTIONS ---

    const handleCreate = () => {
        if (!form.title || !form.eventDate || !form.subject) return alert("Preencha os campos obrigatórios.");

        const newEvent: GamifiedEvent = {
            id: uuidv4(),
            schoolId: user.schoolId || (state.schools[0]?.id || 'default_school'), // Fallback seguro
            creatorId: user.id,
            title: form.title || 'Novo Evento',
            type: form.type as GamifiedEventType,
            subject: form.subject || 'Geral',
            description: form.description || '',
            rules: form.rules || '',
            eventDate: form.eventDate || new Date().toISOString(),
            registrationDeadline: form.registrationDeadline || new Date().toISOString(),
            status: GamifiedEventStatus.OPEN,
            rewardCoins: form.rewardCoins || 100,
            participants: []
        };

        addGamifiedEvent(newEvent);
        setView('LIST');
    };

    const handleUpdateStatus = (status: GamifiedEventStatus) => {
        if (!selectedEvent) return;
        updateGamifiedEvent({ ...selectedEvent, status });
    };

    const handleSaveScores = () => {
        if (!selectedEvent) return;

        const updatedParticipants = selectedEvent.participants.map(p => ({
            ...p,
            score: scoreInputs[p.studentId] !== undefined ? scoreInputs[p.studentId] : p.score,
            status: 'CONCLUIDO' as const
        }));

        // Calculate Rank based on score
        const sorted = [...updatedParticipants].sort((a, b) => b.score - a.score);
        const rankedParticipants = updatedParticipants.map(p => {
            const rank = sorted.findIndex(s => s.studentId === p.studentId) + 1;
            return { ...p, rank };
        });

        updateGamifiedEvent({
            ...selectedEvent,
            participants: rankedParticipants,
            status: GamifiedEventStatus.FINISHED
        });

        alert("Evento finalizado e pontuações salvas!");
        setView('LIST');
    };

    // --- RENDERERS ---

    if (view === 'LIST') {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                            <Trophy className="text-yellow-500" /> Gestão de Eventos Gamificados
                        </h1>
                        <p className="text-slate-500">Crie olimpíadas, soletrandos e competições para engajar a escola.</p>
                    </div>
                    <button onClick={() => { setForm({}); setView('CREATE'); }} className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md">
                        <Plus size={18} /> Novo Evento
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myEvents.map(evt => (
                        <div key={evt.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
                            <div className={`h-2 w-full ${evt.status === GamifiedEventStatus.OPEN ? 'bg-emerald-500' : evt.status === GamifiedEventStatus.LIVE ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-brand-primary bg-brand-light px-2 py-1 rounded uppercase tracking-wide">{evt.type.replace('_', ' ')}</span>
                                    {evt.status === GamifiedEventStatus.LIVE && <span className="text-xs font-bold text-white bg-rose-500 px-2 py-1 rounded flex items-center gap-1"><Zap size={10} /> AO VIVO</span>}
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">{evt.title}</h3>
                                <p className="text-xs text-slate-500 mb-4 flex items-center gap-1"><Calendar size={12} /> {new Date(evt.eventDate).toLocaleDateString()}</p>

                                <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mb-4">
                                    <span className="flex items-center gap-1"><Users size={16} /> {evt.participants.length} Inscritos</span>
                                    <span className="flex items-center gap-1 font-bold text-amber-600"><Coins size={16} /> {evt.rewardCoins}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setSelectedEventId(evt.id); setView('MANAGE'); }}
                                        className="flex-1 border border-slate-300 text-slate-600 py-2 rounded-lg font-bold text-sm hover:bg-slate-50"
                                    >
                                        Gerenciar
                                    </button>
                                    {evt.status !== GamifiedEventStatus.FINISHED && (
                                        <button
                                            onClick={() => { setSelectedEventId(evt.id); setView('LIVE'); }}
                                            className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2"
                                        >
                                            <Play size={14} /> Executar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {myEvents.length === 0 && (
                        <div className="col-span-3 text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                            Nenhum evento criado. Comece agora!
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'CREATE') {
        return (
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Criar Novo Evento</h2>
                    <button onClick={() => setView('LIST')}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título do Evento</label>
                            <input className="w-full border rounded-lg p-3" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Soletrando 2024" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                            <select className="w-full border rounded-lg p-3 bg-white" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
                                <option value="OLIMPIADA">Olimpíada Acadêmica</option>
                                <option value="SOLETRANDO">Soletrando (Spelling Bee)</option>
                                <option value="QUIZ_SHOW">Quiz Show</option>
                                <option value="FEIRA_CIENCIAS">Feira de Ciências</option>
                                <option value="DEBATE">Debate / Oratória</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Matéria Principal</label>
                            <input className="w-full border rounded-lg p-3" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Matemática" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data do Evento</label>
                            <input type="date" className="w-full border rounded-lg p-3" value={form.eventDate ? new Date(form.eventDate).toISOString().split('T')[0] : ''} onChange={e => setForm({ ...form, eventDate: new Date(e.target.value).toISOString() })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deadline Inscrição</label>
                            <input type="date" className="w-full border rounded-lg p-3" value={form.registrationDeadline ? new Date(form.registrationDeadline).toISOString().split('T')[0] : ''} onChange={e => setForm({ ...form, registrationDeadline: new Date(e.target.value).toISOString() })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição (Convite)</label>
                        <textarea className="w-full border rounded-lg p-3 h-24" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva o evento para atrair os alunos..." />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Regras & Regulamento</label>
                        <textarea className="w-full border rounded-lg p-3 h-32 font-mono text-sm bg-slate-50" value={form.rules} onChange={e => setForm({ ...form, rules: e.target.value })} placeholder="Regras oficiais do evento..." />
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <Coins className="text-amber-500" size={24} />
                        <div>
                            <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Prêmio em Moedas (Vencedor)</label>
                            <input type="number" className="border rounded px-2 py-1 w-24" value={form.rewardCoins} onChange={e => setForm({ ...form, rewardCoins: parseInt(e.target.value) })} />
                        </div>
                        <p className="text-xs text-amber-700 ml-auto max-w-xs text-right">Estas moedas serão creditadas automaticamente ao vencedor após o encerramento.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button onClick={handleCreate} className="btn-gradient px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                            <Save size={18} /> Criar Evento
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'LIVE' && selectedEvent) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-xl flex justify-between items-center shadow-lg">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="bg-rose-600 px-2 py-0.5 rounded text-xs font-bold animate-pulse">LIVE MODE</span>
                            <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                        </div>
                        <p className="text-slate-400 text-sm">Painel de Arbitragem em Tempo Real</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setView('LIST')} className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800">Sair</button>
                        <button onClick={handleSaveScores} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg flex items-center gap-2">
                            <CheckCircle size={18} /> Encerrar & Publicar
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18} /> Participantes ({selectedEvent.participants.length})</h3>
                        <div className="text-xs text-slate-500">Insira a pontuação final de cada aluno</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {selectedEvent.participants.length === 0 && <div className="p-8 text-center text-slate-400">Nenhum participante inscrito.</div>}

                        {selectedEvent.participants.map(p => {
                            const student = state.students.find(s => s.id === p.studentId);
                            return (
                                <div key={p.studentId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                                            {student?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{student?.name}</div>
                                            <div className="text-xs text-slate-500">{student?.registrationNumber}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right mr-4">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pontuação</label>
                                            <input
                                                type="number"
                                                className="border-2 border-slate-300 rounded-lg px-3 py-2 w-24 text-center font-bold text-lg focus:border-brand-primary outline-none"
                                                placeholder="0.0"
                                                defaultValue={p.score}
                                                onChange={(e) => setScoreInputs(prev => ({ ...prev, [p.studentId]: parseFloat(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded hover:bg-rose-200">Desclassificar</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'MANAGE' && selectedEvent) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <button onClick={() => setView('LIST')} className="text-slate-500 hover:text-brand-primary flex items-center gap-2 font-medium mb-4">
                    <X size={18} /> Voltar para lista
                </button>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{selectedEvent.title}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(selectedEvent.eventDate).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Target size={14} /> {selectedEvent.subject}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedEvent.status === GamifiedEventStatus.OPEN ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {selectedEvent.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {selectedEvent.status === GamifiedEventStatus.OPEN && (
                            <button onClick={() => handleUpdateStatus(GamifiedEventStatus.CLOSED)} className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-200">
                                Encerrar Inscrições
                            </button>
                        )}
                        <button onClick={() => setView('LIVE')} className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-dark flex items-center justify-center gap-2">
                            <Play size={16} /> Iniciar Evento
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-slate-50">
                        <h3 className="font-bold text-slate-700">Inscritos ({selectedEvent.participants.length})</h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                        {selectedEvent.participants.length === 0 && <div className="p-6 text-center text-slate-400">Nenhum inscrito ainda.</div>}
                        {selectedEvent.participants.map(p => {
                            const student = state.students.find(s => s.id === p.studentId);
                            return (
                                <div key={p.studentId} className="p-4 flex justify-between items-center">
                                    <div className="font-medium text-slate-800">{student?.name}</div>
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">{p.status}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
