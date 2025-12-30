
import React, { useState } from 'react';
import { Trophy, Plus, Calendar, Users, Target, Save, Play, CheckCircle, X, Award, Coins, Zap, ArrowRight, Star, Info, Timer, LayoutList } from 'lucide-react';
import { AppState, GamifiedEvent, GamifiedEventStatus, User, GamifiedEventType, Student, UserRole } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { uuidv4 } from '../../utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { fetchGamifiedEvents, fetchStudents } from '../../services/supabaseClient';

interface GamifiedEventsManagerProps {
    state: AppState;
    user: User;
}

export const GamifiedEventsManager = ({ state, user }: GamifiedEventsManagerProps) => {
    const isStudent = user.role === UserRole.ALUNO;
    const { addGamifiedEvent, updateGamifiedEvent, registerStudentToEvent } = useAppStore();
    
    const { data: allGamifiedEvents, isLoading: eventsLoading } = useQuery<GamifiedEvent[]>({ 
        queryKey: ['gamifiedEvents'], 
        queryFn: fetchGamifiedEvents 
    });
    const { data: allStudents } = useQuery<Student[]>({ 
        queryKey: ['students'], 
        queryFn: fetchStudents 
    });

    const [view, setView] = useState<'LIST' | 'CREATE' | 'MANAGE' | 'LIVE' | 'DETAIL'>('LIST');
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [loadingRegistration, setLoadingRegistration] = useState(false);
    
    const [form, setForm] = useState<Partial<GamifiedEvent>>({
        title: '',
        type: 'QUIZ_SHOW' as GamifiedEventType,
        subject: '',
        description: '',
        rules: '',
        eventDate: '',
        registrationDeadline: '',
        rewardCoins: 100
    });

    const [scoreInputs, setScoreInputs] = useState<Record<string, number>>({});

    const safeGamifiedEvents = allGamifiedEvents || [];
    const safeStudents = allStudents || [];

    // Lógica de filtragem: 
    // Aluno vê eventos da sua escola. Professor vê eventos que criou ou da sua escola.
    const myEvents = safeGamifiedEvents.filter(e => e.schoolId === user.schoolId);
    const selectedEvent = safeGamifiedEvents.find(e => e.id === selectedEventId);

    const handleCreate = () => {
        if (!form.title || !form.eventDate || !form.subject) return alert("Preencha os campos obrigatórios.");
        
        const newEvent: GamifiedEvent = {
            id: uuidv4(),
            schoolId: user.schoolId || 's1',
            creatorId: user.id,
            title: form.title || '',
            type: form.type as GamifiedEventType,
            subject: form.subject || '',
            description: form.description || '',
            rules: form.rules || '',
            eventDate: form.eventDate || '',
            registrationDeadline: form.registrationDeadline || '',
            status: GamifiedEventStatus.OPEN,
            rewardCoins: form.rewardCoins || 100,
            participants: []
        };
        
        addGamifiedEvent(newEvent);
        setView('LIST');
    };

    const handleRegister = async () => {
        if (!selectedEvent || !isStudent) return;
        setLoadingRegistration(true);
        try {
            await registerStudentToEvent(selectedEvent.id, user.id, selectedEvent.participants);
            alert("Inscrição realizada com sucesso! Prepare-se para o desafio.");
        } catch (e) {
            console.error(e);
            alert("Erro ao se inscrever.");
        } finally {
            setLoadingRegistration(false);
        }
    };

    const handleSaveScores = () => {
        if (!selectedEvent) return;
        
        const updatedParticipants = selectedEvent.participants.map(p => ({
            ...p,
            score: scoreInputs[p.studentId] !== undefined ? scoreInputs[p.studentId] : p.score,
            status: 'CONCLUIDO' as const
        }));

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
        
        alert("Evento finalizado e resultados publicados!");
        setView('LIST');
    };

    if (eventsLoading) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Acessando mural de eventos...</div>;

    if (view === 'LIST') {
        return (
            <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-brand-dark tracking-tighter uppercase italic flex items-center gap-3">
                            <Trophy className="text-yellow-500" size={40}/> Eventos e Prêmios
                        </h1>
                        <p className="text-slate-500 font-medium text-lg mt-1">
                            {isStudent ? 'Desafie-se, suba no ranking e ganhe moedas!' : 'Crie competições e engaje seus alunos.'}
                        </p>
                    </div>
                    {!isStudent && (
                        <button onClick={() => { setForm({}); setView('CREATE'); }} className="btn-premium px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-sm uppercase tracking-widest shadow-xl">
                            <Plus size={20}/> Novo Evento
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myEvents.map(evt => {
                        const isRegistered = evt.participants.some(p => p.studentId === user.id);
                        const isFinished = evt.status === GamifiedEventStatus.FINISHED;
                        const myResult = isFinished ? evt.participants.find(p => p.studentId === user.id) : null;

                        return (
                            <div key={evt.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full">
                                <div className="h-32 bg-[#0f1d2e] relative overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                    <div className="relative z-10 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                        {evt.type === 'OLIMPIADA' ? <Award className="text-amber-400" size={32}/> : evt.type === 'SOLETRANDO' ? <Zap className="text-indigo-400" size={32}/> : <Target className="text-emerald-400" size={32}/>}
                                    </div>
                                    <div className="absolute top-4 right-6 bg-amber-400 text-slate-900 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">
                                        <div className="flex items-center gap-1"><Coins size={12}/> {evt.rewardCoins}</div>
                                    </div>
                                </div>
                                
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{evt.subject}</div>
                                        <div className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${evt.status === 'ABERTO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {evt.status}
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-black text-slate-800 text-xl leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{evt.title}</h3>
                                    <p className="text-sm text-slate-400 font-medium mb-6 line-clamp-2">{evt.description}</p>
                                    
                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                                            <div className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500"/> {new Date(evt.eventDate).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-1.5"><Users size={14} className="text-indigo-500"/> {evt.participants.length} Inscritos</div>
                                        </div>

                                        {isStudent ? (
                                            <div className="pt-4 border-t border-slate-50 flex gap-3">
                                                {isFinished ? (
                                                    <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Seu Resultado</span>
                                                        <span className="font-black text-indigo-600">{myResult ? `${myResult.rank}º Lugar` : 'Não Participou'}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => { setSelectedEventId(evt.id); setView('DETAIL'); }}
                                                            className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition shadow-sm border border-slate-100"
                                                        >
                                                            Detalhes
                                                        </button>
                                                        {isRegistered ? (
                                                            <div className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                                                                <CheckCircle size={14}/> Inscrito
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => { setSelectedEventId(evt.id); setView('DETAIL'); }}
                                                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                                                            >
                                                                Participar
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="pt-4 border-t border-slate-50 flex gap-3">
                                                <button onClick={() => { setSelectedEventId(evt.id); setView('MANAGE'); }} className="flex-1 border-2 border-slate-100 text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-200 transition">Gerenciar</button>
                                                <button onClick={() => { setSelectedEventId(evt.id); setView('LIVE'); }} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition shadow-lg">Executar</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {myEvents.length === 0 && (
                        <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                             <Trophy size={64} className="mx-auto mb-4 text-slate-200 opacity-20"/>
                             <p className="text-slate-400 font-black uppercase tracking-widest">Nenhum evento ativo no momento.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'DETAIL' && selectedEvent) {
        const isRegistered = selectedEvent.participants.some(p => p.studentId === user.id);
        const deadlinePassed = new Date(selectedEvent.registrationDeadline) < new Date();

        return (
            <div className="max-w-4xl mx-auto animate-in zoom-in-95 space-y-8">
                <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest text-[10px]">
                    <X size={16}/> Cancelar e Voltar
                </button>

                <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="h-64 bg-[#0f1d2e] relative flex items-center justify-center p-12">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="text-center relative z-10">
                            <div className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Prêmio Especial</div>
                            <h2 className="text-5xl font-black text-white tracking-tighter mb-2 italic uppercase">{selectedEvent.title}</h2>
                            <div className="flex justify-center gap-8 mt-6">
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Recompensa</div>
                                    <div className="text-2xl font-black text-amber-400 flex items-center gap-2 justify-center"><Coins size={20}/> {selectedEvent.rewardCoins}</div>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Inscritos</div>
                                    <div className="text-2xl font-black text-white flex items-center gap-2 justify-center"><Users size={20}/> {selectedEvent.participants.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="md:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={14}/> Sobre o Evento</h3>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium">{selectedEvent.description}</p>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2"><LayoutList size={14}/> Regras e Formato</h3>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedEvent.rules}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                <Timer size={120} className="absolute -right-8 -bottom-8 opacity-5"/>
                                <h3 className="font-black text-xs uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Agenda</h3>
                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Data da Prova</div>
                                        <div className="text-xl font-black">{new Date(selectedEvent.eventDate).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Fim das Inscrições</div>
                                        <div className="text-xl font-black">{new Date(selectedEvent.registrationDeadline).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            {isStudent && (
                                <div className="pt-4">
                                    {isRegistered ? (
                                        <div className="bg-emerald-500 p-6 rounded-[2rem] text-white text-center shadow-xl shadow-emerald-200">
                                            <CheckCircle size={40} className="mx-auto mb-4"/>
                                            <div className="text-xl font-black uppercase tracking-tighter">Você está inscrito!</div>
                                            <p className="text-xs text-emerald-100 mt-2 font-medium">Aguarde o dia do evento para participar.</p>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleRegister}
                                            disabled={loadingRegistration || deadlinePassed}
                                            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-indigo-700 transition shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                                        >
                                            {loadingRegistration ? 'Inscrito...' : deadlinePassed ? 'Prazo Encerrado' : 'Quero Participar!'}
                                            <ArrowRight size={24}/>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'LIVE' && selectedEvent) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
                <div className="bg-[#0f1d2e] text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Painel de Execução</div>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic">{selectedEvent.title}</h2>
                    </div>
                    <button onClick={handleSaveScores} className="relative z-10 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition flex items-center gap-2">
                        <CheckCircle size={18}/> Encerrar & Publicar
                    </button>
                </div>
                
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center font-black text-[10px] text-slate-400 uppercase tracking-widest">
                        <span>Nome do Participante</span>
                        <span>Pontuação Final (0-100)</span>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {selectedEvent.participants.map(p => {
                            const student = safeStudents.find(s => s.id === p.studentId);
                            return (
                                <div key={p.studentId} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-sm">
                                            {student?.name?.charAt(0)}
                                        </div>
                                        <div className="font-black text-slate-800 text-lg">{student?.name || 'Desconhecido'}</div>
                                    </div>
                                    <div className="relative">
                                        <Star size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"/>
                                        <input 
                                            type="number" 
                                            className="w-32 border-2 border-slate-100 rounded-2xl py-4 pl-10 pr-4 text-center font-black text-xl text-brand-dark focus:border-indigo-600 outline-none transition-all" 
                                            placeholder="0"
                                            defaultValue={p.score} 
                                            onChange={(e) => setScoreInputs(prev => ({ ...prev, [p.studentId]: parseFloat(e.target.value) || 0 }))} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {selectedEvent.participants.length === 0 && (
                            <div className="p-20 text-center text-slate-400 italic font-medium">Nenhum participante inscrito para lançamento.</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'CREATE') {
        return (
            <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-6 duration-500">
                <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                            <Plus className="text-indigo-600" size={32}/> Configurar Evento
                        </h2>
                        <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-slate-600 p-2"><X size={28}/></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Evento</label>
                                <input className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: I Olimpíada de Matemática" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Formato</label>
                                <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 bg-slate-50 focus:border-brand-primary outline-none transition-all appearance-none" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                                    <option value="OLIMPIADA">Olimpíada Acadêmica</option>
                                    <option value="SOLETRANDO">Soletrando Digital</option>
                                    <option value="QUIZ_SHOW">Quiz Show Interativo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Matéria / Disciplina</label>
                                <input className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Ex: Matemática" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data do Evento</label>
                                    <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all" value={form.eventDate} onChange={e => setForm({...form, eventDate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Limite Inscrição</label>
                                    <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:border-brand-primary outline-none transition-all" value={form.registrationDeadline} onChange={e => setForm({...form, registrationDeadline: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Moedas de Recompensa</label>
                                <div className="relative">
                                    <Coins size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"/>
                                    <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 pl-12 font-black text-brand-dark focus:border-brand-primary outline-none transition-all" value={form.rewardCoins} onChange={e => setForm({...form, rewardCoins: parseInt(e.target.value) || 0})} />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição e Chamada</label>
                                <textarea className="w-full border-2 border-slate-100 rounded-[1.5rem] p-5 font-medium text-slate-600 focus:border-brand-primary outline-none transition-all h-24" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Escreva um texto motivador para os alunos..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Regras Detalhadas</label>
                                <textarea className="w-full border-2 border-slate-100 rounded-[1.5rem] p-5 font-medium text-slate-600 focus:border-brand-primary outline-none transition-all h-24" value={form.rules} onChange={e => setForm({...form, rules: e.target.value})} placeholder="Quais as regras da competição?" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button onClick={() => setView('LIST')} className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition">Descartar</button>
                        <button onClick={handleCreate} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition">Criar Evento Agora</button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'MANAGE' && selectedEvent) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <ArrowRight className="rotate-180" size={16}/> Voltar para Lista
                    </button>
                    <div className="text-right">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedEvent.title}</h2>
                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Administração do Evento</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-8 bg-slate-50/50 border-b flex justify-between items-center font-black text-[10px] text-slate-400 uppercase tracking-widest">
                                <span>Participantes Inscritos</span>
                                <span>Status</span>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {selectedEvent.participants.map(p => {
                                    const student = safeStudents.find(s => s.id === p.studentId);
                                    return (
                                        <div key={p.studentId} className="p-6 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-indigo-600 shadow-sm">
                                                    {student?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800">{student?.name || 'Desconhecido'}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Matrícula: {student?.registrationNumber}</div>
                                                </div>
                                            </div>
                                            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full font-black text-[10px] uppercase tracking-widest">
                                                {p.status}
                                            </div>
                                        </div>
                                    );
                                })}
                                {selectedEvent.participants.length === 0 && (
                                    <div className="p-20 text-center text-slate-400 italic font-medium">Nenhum aluno inscrito ainda.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#0f1d2e] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                            <Target size={120} className="absolute -right-8 -bottom-8 opacity-5"/>
                            <h3 className="font-black text-xs uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Status da Aplicação</h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Capacidade Escolar</span>
                                    <span className="font-black text-lg">{safeStudents.length}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Adesão</span>
                                    <span className="font-black text-lg text-emerald-400">{((selectedEvent.participants.length / (safeStudents.length || 1)) * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setView('LIVE')}
                                className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-2xl shadow-indigo-200 flex items-center justify-center gap-2"
                            >
                                <Play size={16} fill="white"/> Iniciar Coleta de Resultados
                            </button>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Plus size={32}/>
                            </div>
                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest mb-2">Convidar Turma</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6 italic">Envie uma notificação para todos os alunos sobre este evento.</p>
                            <button className="w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-600 transition-all">Enviar Alerta Geral</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
