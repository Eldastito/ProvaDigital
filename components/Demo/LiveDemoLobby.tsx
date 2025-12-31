
import React, { useState, useEffect } from 'react';
import { X, Smartphone, Users, QrCode, Wifi, Play, UserPlus, AlertTriangle, CheckCircle, Lock, Unlock, ShieldCheck, BarChart2, Trophy, Zap, Award, PieChart } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { uuidv4 } from '../../utils/helpers';

interface LiveDemoLobbyProps {
    onClose: () => void;
}

// Gabarito da Prova Demo (Deve bater com os IDs do StudentApp)
const DEMO_ANSWER_KEY: Record<string, string> = {
    'q1': 'c', // CSS
    'q2': 'b', // Maria
    'q3': 'b'  // Inteligência Artificial
};

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

export const LiveDemoLobby = ({ onClose }: LiveDemoLobbyProps) => {
    // Estados do Fluxo
    const [step, setStep] = useState<'SETUP' | 'WAITING_PROFESSOR' | 'LOBBY_ACTIVE' | 'RESULTS'>('SETUP');
    
    // PIN de Segurança para o Professor (Fixo para a demo ou gerado)
    const SECURITY_PIN = "1234";

    // Configuração da Sessão
    const [sessionConfig, setSessionConfig] = useState({
        className: 'Turma Demo - Evento Ao Vivo',
        capacity: 50, 
    });
    const [loading, setLoading] = useState(false);
    
    // Dados da Sessão Ativa
    const [activeClassId, setActiveClassId] = useState<string | null>(null);
    const [activeExamId, setActiveExamId] = useState<string | null>(null);
    const [joinedStudents, setJoinedStudents] = useState<any[]>([]);
    
    // Resultados
    const [examStats, setExamStats] = useState<any>(null);
    const [detailedStats, setDetailedStats] = useState<any>(null); // New: Stats per question option
    const [topPerformers, setTopPerformers] = useState<any[]>([]);
    
    // Results View Mode (Overview vs Question Detail)
    const [resultView, setResultView] = useState<'OVERVIEW' | string>('OVERVIEW'); // 'OVERVIEW' or 'q1', 'q2'...

    // URLs
    const baseUrl = window.location.href.split('?')[0];
    const professorUrl = activeClassId ? `${baseUrl}?mode=mobile&role=PROFESSOR&classId=${activeClassId}&examId=${activeExamId}&action=CONTROL` : '';
    const studentUrl = activeClassId ? `${baseUrl}?mode=mobile&role=STUDENT&classId=${activeClassId}&examId=${activeExamId}` : '';

    // --- 1. SETUP: CRIAR A SALA NO BANCO ---
    const handleCreateSession = async () => {
        if (!sessionConfig.className || sessionConfig.capacity < 1) return alert("Configure a turma.");
        setLoading(true);

        try {
            const tenantId = 't1'; 
            const schoolId = 's1'; 
            const classId = uuidv4();
            const examId = uuidv4();

            // Criar Turma com status WAITING_PROFESSOR (Bloqueada)
            const { error: classError } = await supabase.from('classes').insert({
                id: classId,
                school_id: schoolId,
                name: sessionConfig.className,
                series: 'Demo Live',
                shift: 'NOITE',
                capacity: sessionConfig.capacity,
                status: 'WAITING_PROFESSOR' 
            });

            if (classError) throw classError;

            const { error: examError } = await supabase.from('exams').insert({
                id: examId,
                tenant_id: tenantId,
                school_id: schoolId,
                title: 'Quiz Interativo - Ao Vivo',
                subject: 'Conhecimentos Gerais',
                status: 'PUBLICADA',
                items_config: [], 
                class_ids: [classId]
            });

            if (examError) throw examError;

            setActiveClassId(classId);
            setActiveExamId(examId);
            setStep('WAITING_PROFESSOR'); 

            // Iniciar Listeners
            subscribeToClassStatus(classId);
            subscribeToStudents(classId);

        } catch (error: any) {
            console.error("Erro ao criar sessão:", error);
            alert("Erro ao conectar com o servidor da demo: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- 2. REALTIME: ESCUTAR STATUS DA TURMA (SEU COMANDO) ---
    const subscribeToClassStatus = (classId: string) => {
        const channel = supabase
            .channel('public:classes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'classes', filter: `id=eq.${classId}` }, (payload) => {
                const newStatus = payload.new.status;
                if (newStatus === 'OPEN') {
                    setStep('LOBBY_ACTIVE'); 
                } else if (newStatus === 'FINISHED') {
                    calculateResults(classId, activeExamId!);
                }
            })
            .subscribe();
    };

    // --- 3. REALTIME: ESCUTAR ALUNOS ---
    const subscribeToStudents = (classId: string) => {
        const channel = supabase
            .channel('public:students')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students', filter: `class_id=eq.${classId}` }, (payload) => {
                setJoinedStudents(prev => [payload.new, ...prev]);
            })
            .subscribe();
    };

    // --- 4. CORREÇÃO AUTOMÁTICA (SERVER-SIDE SIMULATION) ---
    const calculateResults = async (classId: string, examId: string) => {
        setLoading(true);
        
        // Buscar resultados reais do banco
        const { data: results, error } = await supabase
            .from('exam_results')
            .select('*')
            .eq('exam_id', examId);

        if (error || !results) {
            console.error("Erro ao buscar resultados", error);
            return;
        }

        // Processar Dados
        let totalSubmissions = results.length;
        let questionCorrectCounts: any = { q1: 0, q2: 0, q3: 0 };
        // New: Track distribution per option per question
        let questionDistributions: any = {
            q1: { a: 0, b: 0, c: 0, d: 0 },
            q2: { a: 0, b: 0, c: 0, d: 0 },
            q3: { a: 0, b: 0, c: 0, d: 0 }
        };

        let studentScores: any[] = [];

        // Buscar nomes dos alunos para o pódio
        const { data: students } = await supabase.from('students').select('id, name').in('id', results.map(r => r.student_id));

        results.forEach((res: any) => {
            let correctCount = 0;
            
            // Verifica cada resposta do aluno contra o gabarito
            res.answers.forEach((ans: any) => {
                const qId = ans.itemId;
                const selected = ans.selectedAlternativeId;
                
                // Update Distribution
                if (questionDistributions[qId] && questionDistributions[qId][selected] !== undefined) {
                    questionDistributions[qId][selected]++;
                }

                // Check Correctness
                if (DEMO_ANSWER_KEY[qId] === selected) {
                    questionCorrectCounts[qId]++;
                    correctCount++;
                }
            });

            const studentName = students?.find(s => s.id === res.student_id)?.name || 'Anônimo';
            studentScores.push({
                name: studentName,
                score: correctCount,
                timeBonus: Math.random() // Mock tie-breaker since we don't track exact time in this demo payload
            });
        });

        // Ordenar Pódio
        const podium = studentScores.sort((a, b) => b.score - a.score || b.timeBonus - a.timeBonus).slice(0, 3);

        setExamStats({
            total: totalSubmissions,
            q1: Math.round((questionCorrectCounts.q1 / (totalSubmissions || 1)) * 100),
            q2: Math.round((questionCorrectCounts.q2 / (totalSubmissions || 1)) * 100),
            q3: Math.round((questionCorrectCounts.q3 / (totalSubmissions || 1)) * 100),
        });
        setDetailedStats(questionDistributions);
        setTopPerformers(podium);
        setStep('RESULTS');
        setLoading(false);
    };

    const getQrUrl = (data: string) => `https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=000000&bgcolor=ffffff&data=${encodeURIComponent(data)}`;

    const presentCount = joinedStudents.length;
    const absentCount = Math.max(0, sessionConfig.capacity - presentCount);
    const fillPercentage = Math.min(100, (presentCount / sessionConfig.capacity) * 100);

    // Helper for Bar Chart
    const renderDistributionBar = (qId: string) => {
        if (!detailedStats) return null;
        const dist = detailedStats[qId];
        const options = QUESTIONS_OPTIONS[qId];
        const total = Object.values(dist).reduce((a: any, b: any) => a + b, 0) as number || 1;
        const correctOptId = DEMO_ANSWER_KEY[qId];

        return (
            <div className="flex items-end gap-8 h-64 w-full max-w-3xl mx-auto px-8">
                {options.map((opt) => {
                    const count = dist[opt.id] as number;
                    const percentage = (count / total) * 100;
                    const isCorrect = opt.id === correctOptId;
                    
                    return (
                        <div key={opt.id} className="flex-1 flex flex-col items-center group">
                            <div className="text-xl font-bold text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{count}</div>
                            <div className="w-full bg-slate-800 rounded-t-xl relative overflow-hidden flex flex-col justify-end h-full">
                                <div 
                                    className={`w-full transition-all duration-1000 ease-out relative ${isCorrect ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                    style={{ height: `${percentage}%` }}
                                >
                                    {isCorrect && <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white"><CheckCircle size={20}/></div>}
                                </div>
                            </div>
                            <div className={`mt-4 px-4 py-2 rounded-lg text-sm font-bold w-full text-center ${isCorrect ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                {opt.label}
                            </div>
                        </div>
                    )
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-[#0f1d2e] z-[100] flex flex-col animate-in fade-in duration-500 overflow-y-auto font-sans">
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-50"
            >
                <X size={32} />
            </button>

            {/* FASE 1: CONFIGURAÇÃO */}
            {step === 'SETUP' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="max-w-lg w-full bg-slate-800/50 border border-slate-700 p-8 rounded-3xl backdrop-blur-sm">
                        <div className="text-center mb-8">
                            <div className="bg-brand-primary/20 p-4 rounded-full inline-block mb-4 text-brand-secondary">
                                <Wifi size={40} />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Configurar Sessão Ao Vivo</h1>
                            <p className="text-slate-400">Defina os parâmetros para a plateia interagir.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome da Sessão / Turma</label>
                                <input 
                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:border-brand-primary outline-none"
                                    value={sessionConfig.className}
                                    onChange={e => setSessionConfig({...sessionConfig, className: e.target.value})}
                                    placeholder="Ex: Demo Evento Tech"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Capacidade Esperada (Espectadores)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:border-brand-primary outline-none"
                                    value={sessionConfig.capacity}
                                    onChange={e => setSessionConfig({...sessionConfig, capacity: parseInt(e.target.value)})}
                                />
                            </div>

                            <button 
                                onClick={handleCreateSession}
                                disabled={loading}
                                className="w-full py-4 bg-brand-primary hover:bg-brand-dark text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-primary/20 transition flex items-center justify-center gap-2"
                            >
                                {loading ? 'Criando Sala...' : <><Play size={20} fill="white"/> Gerar QR do Professor</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FASE 2: AGUARDANDO PROFESSOR (VOCÊ) */}
            {step === 'WAITING_PROFESSOR' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit.png')] opacity-5"></div>
                    
                    <div className="relative z-10 bg-white p-6 rounded-3xl shadow-2xl shadow-purple-500/20 mb-8 animate-in zoom-in duration-500">
                        <div className="absolute -top-4 -left-4 bg-purple-600 text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg transform -rotate-12 border-2 border-slate-900">
                            ACESSO PROFESSOR
                        </div>
                        <img src={getQrUrl(professorUrl)} alt="QR Code Professor" className="w-64 h-64 mix-blend-multiply" />
                    </div>
                    
                    <h1 className="text-4xl font-bold text-white mb-2 relative z-10">Escaneie para assumir o controle</h1>
                    
                    <div className="mt-4 mb-8 bg-slate-800 border border-slate-700 p-4 rounded-xl inline-block relative z-10 animate-pulse">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">PIN DE SEGURANÇA</div>
                        <div className="text-3xl font-mono font-black text-brand-secondary tracking-[0.5em]">{SECURITY_PIN}</div>
                    </div>
                    
                    <div className="mt-8 flex items-center gap-2 text-purple-400 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-500/30 relative z-10">
                        <Lock size={18} />
                        <span className="text-sm font-mono font-bold">SALA BLOQUEADA PARA ALUNOS</span>
                    </div>
                </div>
            )}

            {/* FASE 3: PLATEIA ENTRANDO */}
            {step === 'LOBBY_ACTIVE' && (
                <div className="flex-1 flex flex-col lg:flex-row">
                    {/* LEFT: QR CODE ALUNOS */}
                    <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center items-center text-center border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-br from-[#0f1d2e] to-[#1e293b]">
                        <div className="mb-8">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1 rounded-full text-sm font-bold animate-in slide-in-from-top-4 flex items-center gap-2 w-fit mx-auto">
                                <Unlock size={14}/> SESSÃO LIBERADA PELO PROFESSOR
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black text-white mt-4 leading-tight">
                                Entre na Turma<br/><span className="text-brand-secondary">Agora!</span>
                            </h1>
                            <p className="text-lg text-slate-400 mt-4 max-w-md mx-auto">
                                Aponte a câmera do seu celular para participar da experiência.
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-brand-primary/20 relative group animate-in zoom-in duration-500">
                            <img src={getQrUrl(studentUrl)} alt="QR Code Student" className="w-72 h-72 lg:w-96 lg:h-96 mix-blend-multiply" />
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-mono border border-slate-700 flex items-center gap-2 whitespace-nowrap">
                                <Smartphone size={14}/> Acesso Aluno
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: REALTIME DASHBOARD */}
                    <div className="lg:w-1/2 p-8 bg-slate-900 flex flex-col">
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                <div className="text-slate-400 text-xs uppercase font-bold mb-1">Alunos Presentes</div>
                                <div className="text-5xl font-black text-white flex items-center gap-3">
                                    {presentCount} 
                                    <span className="text-sm font-medium text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">de {sessionConfig.capacity}</span>
                                </div>
                                <div className="w-full bg-slate-900 h-2 rounded-full mt-4 overflow-hidden">
                                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${fillPercentage}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                                <div className="text-slate-400 text-xs uppercase font-bold mb-1">Status da Prova</div>
                                <div className="text-3xl font-black text-emerald-400 mt-2 flex items-center gap-2">
                                    <Zap size={24}/> EM ANDAMENTO
                                </div>
                                <div className="text-xs text-slate-500 mt-3 font-medium">
                                    O professor encerrará a sessão em breve.
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-white flex items-center gap-2"><Users size={18} className="text-brand-secondary"/> Lista de Chamada</h3>
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
                                        <UserPlus size={48} className="mb-2 opacity-20"/>
                                        <p>Aguardando alunos entrarem...</p>
                                    </div>
                                ) : (
                                    joinedStudents.map((student, idx) => (
                                        <div key={student.id || idx} className="bg-slate-700/50 p-3 rounded-xl flex items-center justify-between border border-slate-600 animate-in slide-in-from-left duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-blue-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
                                                    {student.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{student.name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">Mat: {student.registration_number || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                                <CheckCircle size={14}/> ONLINE
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FASE 4: RESULTADOS (DASHBOARD FINAL) */}
            {step === 'RESULTS' && examStats && (
                <div className="flex-1 bg-slate-900 p-8 flex flex-col items-center overflow-y-auto">
                    <div className="max-w-6xl w-full animate-in zoom-in duration-500">
                        {/* Navigation / Header */}
                        <div className="flex justify-center mb-8 gap-4">
                            <button 
                                onClick={() => setResultView('OVERVIEW')} 
                                className={`px-6 py-2 rounded-full font-bold transition ${resultView === 'OVERVIEW' ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Visão Geral
                            </button>
                            <button 
                                onClick={() => setResultView('q1')} 
                                className={`px-6 py-2 rounded-full font-bold transition ${resultView === 'q1' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Questão 1
                            </button>
                            <button 
                                onClick={() => setResultView('q2')} 
                                className={`px-6 py-2 rounded-full font-bold transition ${resultView === 'q2' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Questão 2
                            </button>
                            <button 
                                onClick={() => setResultView('q3')} 
                                className={`px-6 py-2 rounded-full font-bold transition ${resultView === 'q3' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                Questão 3
                            </button>
                        </div>

                        {resultView === 'OVERVIEW' ? (
                            <>
                                <div className="text-center mb-12">
                                    <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tight flex items-center justify-center gap-4">
                                        <Trophy size={48} className="text-yellow-400"/> Resultado da Turma
                                    </h1>
                                    <p className="text-slate-400 text-xl">Correção automática e processamento de dados concluídos.</p>
                                </div>

                                {/* Top Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                                        <div className="text-slate-400 text-sm font-bold uppercase mb-2">Total de Provas</div>
                                        <div className="text-5xl font-black text-white">{examStats.total}</div>
                                    </div>
                                    <div 
                                        className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center cursor-pointer hover:border-purple-500 transition"
                                        onClick={() => setResultView('q1')}
                                    >
                                        <div className="text-slate-400 text-sm font-bold uppercase mb-2">Acerto em Tecnologia</div>
                                        <div className={`text-5xl font-black ${examStats.q1 > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{examStats.q1}%</div>
                                        <div className="text-xs text-slate-500 mt-2">{QUESTIONS_LABELS['q1']}</div>
                                    </div>
                                    <div 
                                        className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center cursor-pointer hover:border-blue-500 transition"
                                        onClick={() => setResultView('q2')}
                                    >
                                        <div className="text-slate-400 text-sm font-bold uppercase mb-2">Acerto em Lógica</div>
                                        <div className={`text-5xl font-black ${examStats.q2 > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{examStats.q2}%</div>
                                        <div className="text-xs text-slate-500 mt-2">{QUESTIONS_LABELS['q2']}</div>
                                    </div>
                                    <div 
                                        className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center cursor-pointer hover:border-orange-500 transition"
                                        onClick={() => setResultView('q3')}
                                    >
                                        <div className="text-slate-400 text-sm font-bold uppercase mb-2">Acerto em Cultura</div>
                                        <div className={`text-5xl font-black ${examStats.q3 > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{examStats.q3}%</div>
                                        <div className="text-xs text-slate-500 mt-2">{QUESTIONS_LABELS['q3']}</div>
                                    </div>
                                </div>

                                {/* Podium */}
                                <div className="flex flex-col items-center">
                                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2"><Award className="text-yellow-400"/> Destaques da Sessão</h2>
                                    <div className="flex items-end gap-4 md:gap-8">
                                        {/* 2nd Place */}
                                        {topPerformers[1] && (
                                            <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
                                                <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-slate-400 flex items-center justify-center text-3xl font-bold text-slate-600 mb-4 shadow-lg">
                                                    {topPerformers[1].name.charAt(0)}
                                                </div>
                                                <div className="h-40 w-32 bg-slate-700 rounded-t-lg border-t-4 border-slate-400 flex flex-col items-center justify-end p-4 shadow-xl">
                                                    <span className="text-4xl font-black text-slate-400">2º</span>
                                                </div>
                                                <div className="mt-4 text-center">
                                                    <div className="font-bold text-white text-lg">{topPerformers[1].name.split(' ')[0]}</div>
                                                    <div className="text-emerald-400 font-bold">{topPerformers[1].score}/3</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 1st Place */}
                                        {topPerformers[0] && (
                                            <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-8 duration-700">
                                                <div className="w-32 h-32 rounded-full bg-yellow-100 border-4 border-yellow-400 flex items-center justify-center text-4xl font-bold text-yellow-600 mb-4 shadow-xl relative">
                                                    {topPerformers[0].name.charAt(0)}
                                                    <Trophy className="absolute -top-6 text-yellow-400 drop-shadow-lg" size={48} fill="currentColor"/>
                                                </div>
                                                <div className="h-56 w-40 bg-slate-700 rounded-t-lg border-t-4 border-yellow-400 flex flex-col items-center justify-end p-4 shadow-2xl">
                                                    <span className="text-6xl font-black text-yellow-400">1º</span>
                                                </div>
                                                <div className="mt-4 text-center">
                                                    <div className="font-bold text-white text-xl">{topPerformers[0].name.split(' ')[0]}</div>
                                                    <div className="text-emerald-400 font-bold text-lg">{topPerformers[0].score}/3</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 3rd Place */}
                                        {topPerformers[2] && (
                                            <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-500">
                                                <div className="w-24 h-24 rounded-full bg-orange-100 border-4 border-orange-400 flex items-center justify-center text-3xl font-bold text-orange-600 mb-4 shadow-lg">
                                                    {topPerformers[2].name.charAt(0)}
                                                </div>
                                                <div className="h-32 w-32 bg-slate-700 rounded-t-lg border-t-4 border-orange-400 flex flex-col items-center justify-end p-4 shadow-xl">
                                                    <span className="text-4xl font-black text-orange-400">3º</span>
                                                </div>
                                                <div className="mt-4 text-center">
                                                    <div className="font-bold text-white text-lg">{topPerformers[2].name.split(' ')[0]}</div>
                                                    <div className="text-emerald-400 font-bold">{topPerformers[2].score}/3</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="animate-in fade-in">
                                <div className="text-center mb-12">
                                    <div className="inline-block p-4 rounded-full bg-slate-800 mb-4">
                                        <PieChart size={40} className="text-brand-secondary"/>
                                    </div>
                                    <h2 className="text-4xl font-bold text-white">{QUESTIONS_LABELS[resultView]}</h2>
                                    <p className="text-slate-400 mt-2">Distribuição de Respostas da Turma</p>
                                </div>
                                {renderDistributionBar(resultView)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
