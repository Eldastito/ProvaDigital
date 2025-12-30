
import React, { useState, useEffect } from 'react';
import { X, Smartphone, Users, QrCode, Wifi, Play, UserPlus, AlertTriangle, CheckCircle, Lock, Unlock, ShieldCheck, BarChart2, Trophy, Zap, Award, PieChart } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { uuidv4 } from '../../utils/helpers';
import { DEMO_ANSWER_KEY } from '../../utils/demoData';

const QUESTIONS_LABELS: Record<string, string> = {
    'q1': 'Tecnologia: Estilização Web',
    'q2': 'Lógica: Sequência Familiar',
    'q3': 'Cultura: Sigla IA'
};

const QUESTIONS_OPTIONS: Record<string, any[]> = {
    'q1': [{id:'a', label:'HTML'}, {id:'b', label:'Python'}, {id:'c', label:'CSS (Correto)'}, {id:'d', label:'Java'}],
    'q2': [{id:'a', label:'Lulu'}, {id:'b', label:'Maria (Correto)'}, {id:'c', label:'Joana'}, {id:'d', label:'Laura'}],
    'q3': [{id:'a', label:'Internet Aberta'}, {id:'b', label:'Inteligência Artificial (Correto)'}, {id:'c', label:'Interação'}, {id:'d', label:'Inovação'}]
};

export const LiveDemoLobby = ({ onClose }: { onClose: () => void }) => {
    const [step, setStep] = useState<'SETUP' | 'WAITING_PROFESSOR' | 'LOBBY_ACTIVE' | 'RESULTS'>('SETUP');
    const SECURITY_PIN = "1234";

    const [sessionConfig, setSessionConfig] = useState({ className: 'Apresentação Live ExamePad', capacity: 50 });
    const [loading, setLoading] = useState(false);
    const [activeClassId, setActiveClassId] = useState<string | null>(null);
    const [activeExamId, setActiveExamId] = useState<string | null>(null);
    const [joinedStudents, setJoinedStudents] = useState<any[]>([]);
    
    const [examStats, setExamStats] = useState<any>(null);
    const [detailedStats, setDetailedStats] = useState<any>(null);
    const [topPerformers, setTopPerformers] = useState<any[]>([]);
    const [resultView, setResultView] = useState<'OVERVIEW' | string>('OVERVIEW');

    const baseUrl = window.location.href.split('?')[0];
    const professorUrl = activeClassId ? `${baseUrl}?mode=mobile&role=PROFESSOR&classId=${activeClassId}&examId=${activeExamId}&action=CONTROL` : '';
    const studentUrl = activeClassId ? `${baseUrl}?mode=mobile&role=STUDENT&classId=${activeClassId}&examId=${activeExamId}` : '';

    const handleCreateSession = async () => {
        setLoading(true);
        try {
            const classId = uuidv4();
            const examId = uuidv4();

            await supabase.from('classes').insert({
                id: classId, school_id: 's1', name: sessionConfig.className, series: 'Demo Live', shift: 'NOITE', capacity: sessionConfig.capacity, status: 'WAITING_PROFESSOR' 
            });

            await supabase.from('exams').insert({
                id: examId, tenant_id: 't1', school_id: 's1', title: 'Quiz Interativo - Ao Vivo', subject: 'Geral', status: 'PUBLICADA', items: [], class_ids: [classId]
            });

            setActiveClassId(classId);
            setActiveExamId(examId);
            setStep('WAITING_PROFESSOR');
            subscribeToClassStatus(classId);
            subscribeToStudents(classId);
        } catch (error: any) {
            alert("Erro ao criar sessão: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToClassStatus = (classId: string) => {
        supabase.channel('class_status').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'classes', filter: `id=eq.${classId}` }, (payload) => {
            if (payload.new.status === 'OPEN') setStep('LOBBY_ACTIVE');
            else if (payload.new.status === 'FINISHED') calculateResults(classId, activeExamId!);
        }).subscribe();
    };

    const subscribeToStudents = (classId: string) => {
        supabase.channel('students_list').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students', filter: `class_id=eq.${classId}` }, (payload) => {
            setJoinedStudents(prev => [payload.new, ...prev]);
        }).subscribe();
    };

    const calculateResults = async (classId: string, examId: string) => {
        setLoading(true);
        const { data: results } = await supabase.from('exam_results').select('*').eq('exam_id', examId);
        if (!results) return;

        let questionCorrectCounts: any = { q1: 0, q2: 0, q3: 0 };
        let questionDistributions: any = { q1: { a: 0, b: 0, c: 0, d: 0 }, q2: { a: 0, b: 0, c: 0, d: 0 }, q3: { a: 0, b: 0, c: 0, d: 0 } };
        let studentScores: any[] = [];

        results.forEach((res: any) => {
            let correctCount = 0;
            res.answers.forEach((ans: any) => {
                if (questionDistributions[ans.itemId]) questionDistributions[ans.itemId][ans.selectedAlternativeId]++;
                if (DEMO_ANSWER_KEY[ans.itemId] === ans.selectedAlternativeId) {
                    questionCorrectCounts[ans.itemId]++;
                    correctCount++;
                }
            });
            studentScores.push({ name: res.student_name || 'Participante', score: correctCount });
        });

        setExamStats({
            total: results.length,
            q1: Math.round((questionCorrectCounts.q1 / (results.length || 1)) * 100),
            q2: Math.round((questionCorrectCounts.q2 / (results.length || 1)) * 100),
            q3: Math.round((questionCorrectCounts.q3 / (results.length || 1)) * 100),
        });
        setDetailedStats(questionDistributions);
        setTopPerformers(studentScores.sort((a, b) => b.score - a.score).slice(0, 3));
        setStep('RESULTS');
        setLoading(false);
    };

    const getQrUrl = (data: string) => `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data)}`;

    if (step === 'SETUP') return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0f1d2e] text-white">
            <div className="max-w-lg w-full bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-xl text-center">
                <Wifi size={64} className="mx-auto text-indigo-400 mb-6 animate-pulse"/>
                <h1 className="text-4xl font-black mb-4 tracking-tighter italic uppercase">Demo Lobby</h1>
                <p className="text-slate-400 mb-8 font-medium">Crie uma sala de experiência real para apresentar o ExamePad.</p>
                <div className="space-y-6 text-left">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Título da Turma Apresentada</label>
                        <input className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 font-bold text-white focus:border-indigo-500 outline-none" value={sessionConfig.className} onChange={e => setSessionConfig({...sessionConfig, className: e.target.value})} />
                    </div>
                    <button onClick={handleCreateSession} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition flex items-center justify-center gap-3">
                        <Play size={24} fill="white"/> Iniciar Infraestrutura
                    </button>
                </div>
            </div>
        </div>
    );

    if (step === 'WAITING_PROFESSOR') return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0f1d2e] text-white p-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl mb-8 animate-in zoom-in">
                <img src={getQrUrl(professorUrl)} className="w-72 h-72" alt="QR Professor"/>
                <div className="mt-6 text-center text-slate-900">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PIN DE CONTROLE</div>
                    <div className="text-4xl font-black tracking-[0.4em]">{SECURITY_PIN}</div>
                </div>
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Aguardando Mestre da Sala</h2>
            <p className="text-slate-400 mt-2">Escaneie o código acima com um tablet ou celular para assumir o controle da demo.</p>
        </div>
    );

    if (step === 'LOBBY_ACTIVE') return (
        <div className="flex-1 flex flex-col lg:flex-row bg-[#0f1d2e] text-white">
            <div className="lg:w-1/2 p-12 flex flex-col justify-center items-center text-center border-r border-white/5">
                <div className="mb-10">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">Sessão Ao Vivo</span>
                    <h1 className="text-6xl font-black mt-6 tracking-tighter uppercase italic leading-none">Entre na <br/><span className="text-indigo-400">Experiência</span></h1>
                </div>
                <div className="bg-white p-6 rounded-[3rem] shadow-2xl">
                    <img src={getQrUrl(studentUrl)} className="w-80 h-80 lg:w-[450px] lg:h-[450px]" alt="QR Alunos"/>
                </div>
                <p className="mt-8 text-xl text-slate-400 font-medium max-w-md">Aponte sua câmera e participe em tempo real.</p>
            </div>
            <div className="lg:w-1/2 p-12 bg-slate-900/50 backdrop-blur-3xl flex flex-col">
                <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="bg-slate-800/80 p-8 rounded-[2rem] border border-white/5">
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Participantes</div>
                        <div className="text-6xl font-black text-white">{joinedStudents.length}</div>
                    </div>
                    <div className="bg-emerald-600/20 p-8 rounded-[2rem] border border-emerald-500/20 flex flex-col justify-center">
                        <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">Status da Sala</div>
                        <div className="text-3xl font-black text-emerald-400 flex items-center gap-2"><Zap size={24}/> EM ANDAMENTO</div>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest mb-6">Mural de Presença</h3>
                    <div className="flex-1 overflow-y-auto pr-4 space-y-3 custom-scrollbar">
                        {joinedStudents.map((s, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4 animate-in slide-in-from-right">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white">{s.name.charAt(0)}</div>
                                <div className="font-bold text-white">{s.name}</div>
                            </div>
                        ))}
                        {joinedStudents.length === 0 && <div className="text-slate-600 italic">Aguardando primeiros acessos...</div>}
                    </div>
                </div>
            </div>
        </div>
    );

    if (step === 'RESULTS' && examStats) return (
        <div className="flex-1 bg-slate-900 p-12 flex flex-col items-center text-white overflow-y-auto">
            <div className="max-w-6xl w-full">
                <div className="text-center mb-16">
                    <Trophy size={80} className="text-amber-400 mx-auto mb-6 animate-bounce"/>
                    <h1 className="text-6xl font-black tracking-tighter uppercase italic">Resultados da Turma</h1>
                    <p className="text-slate-400 text-xl mt-2 font-medium">Correção instantânea e análise de desempenho.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {['q1', 'q2', 'q3'].map(q => (
                        <div key={q} className="bg-slate-800 p-8 rounded-[2.5rem] border border-white/5 text-center group hover:border-indigo-500 transition-all">
                            <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{QUESTIONS_LABELS[q]}</div>
                            <div className="text-6xl font-black text-white mb-2">{examStats[q]}%</div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Índice de Acertos</div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-black mb-12 uppercase italic text-indigo-400 tracking-widest">Pódio de Performance</h2>
                    <div className="flex items-end gap-6 md:gap-12">
                        {topPerformers[1] && (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-slate-400 rounded-full flex items-center justify-center text-3xl font-black text-white mb-4 shadow-xl">2</div>
                                <div className="h-40 w-36 bg-slate-800 rounded-t-3xl border-t-4 border-slate-400 flex flex-col items-center justify-center p-4">
                                    <span className="font-black text-white text-lg truncate w-full text-center">{topPerformers[1].name}</span>
                                </div>
                            </div>
                        )}
                        {topPerformers[0] && (
                            <div className="flex flex-col items-center">
                                <Trophy size={48} className="text-yellow-400 mb-2 drop-shadow-xl"/>
                                <div className="w-28 h-28 bg-yellow-400 rounded-full flex items-center justify-center text-5xl font-black text-slate-900 mb-4 shadow-2xl">1</div>
                                <div className="h-64 w-44 bg-slate-700 rounded-t-3xl border-t-4 border-yellow-400 flex flex-col items-center justify-center p-4">
                                    <span className="font-black text-white text-xl truncate w-full text-center">{topPerformers[0].name}</span>
                                </div>
                            </div>
                        )}
                        {topPerformers[2] && (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-amber-700 rounded-full flex items-center justify-center text-3xl font-black text-white mb-4 shadow-xl">3</div>
                                <div className="h-32 w-36 bg-slate-800 rounded-t-3xl border-t-4 border-amber-700 flex flex-col items-center justify-center p-4">
                                    <span className="font-black text-white text-lg truncate w-full text-center">{topPerformers[2].name}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return null;
};
