
import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Monitor, UserCheck, QrCode, CheckCircle, Lock, UserPlus, XSquare, Layers, AlertTriangle, Unlock, Play, Smartphone, KeyRound, BarChart2 } from 'lucide-react';
import { AppState } from '../../types';
import { QRDataTransfer } from '../../services/qrCodecService';
import { supabase } from '../../services/supabaseClient';

import { useSafeAppStore } from '../../store/useAppStore';

interface ProfessorAppProps {
    onBack: () => void;
}

export const ProfessorApp = ({ onBack }: ProfessorAppProps) => {
    const state = useSafeAppStore();
    // Check URL params for Live Controller Mode
    const params = new URLSearchParams(window.location.search);
    const isLiveController = params.get('action') === 'CONTROL';
    const liveClassId = params.get('classId');

    // Dados recebidos do Coordenador (Modo Normal)
    const [classData, setClassData] = useState<any>(null);

    // Controle de Sessão
    const [view, setView] = useState<'DASHBOARD' | 'ATTENDANCE' | 'DISTRIBUTE_STUDENT_QR' | 'LIVE_CONTROLLER'>('DASHBOARD');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentStatuses, setStudentStatuses] = useState<Record<string, 'PENDING' | 'ACTIVE' | 'FINISHED'>>({});
    const [attendanceLocked, setAttendanceLocked] = useState(false);

    // Live Controller States
    const [liveStatus, setLiveStatus] = useState<'WAITING' | 'OPEN' | 'FINISHED'>('WAITING');
    const [liveStudents, setLiveStudents] = useState<any[]>([]);
    const [liveResultsCount, setLiveResultsCount] = useState(0);
    const [pinInput, setPinInput] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Novo: Proteção por PIN

    // QR States
    const [qrChunks, setQrChunks] = useState<string[]>([]);
    const [currentQrIndex, setCurrentQrIndex] = useState(0);
    const [attendanceQrChunks, setAttendanceQrChunks] = useState<string[]>([]);

    useEffect(() => {
        if (isLiveController && liveClassId) {
            setView('LIVE_CONTROLLER');

            // 1. Listen for students joining
            const channelStudents = supabase
                .channel('public:students')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students', filter: `class_id=eq.${liveClassId}` }, (payload) => {
                    setLiveStudents(prev => [payload.new, ...prev]);
                })
                .subscribe();

            // 2. Listen for exam submissions (Realtime Count)
            const channelResults = supabase
                .channel('public:exam_results')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exam_results' }, (payload) => {
                    // In a real app we'd filter by exam ID, but for demo simplicity assume session
                    setLiveResultsCount(prev => prev + 1);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channelStudents);
                supabase.removeChannel(channelResults);
            };
        } else {
            // --- REAL DATA LOADING (Restored) ---
            const currentUser = state.currentUser;
            if (!currentUser) return;

            // 1. Find Professor's Classes
            // If user has specific classIds (e.g. specialized teacher), use them. Otherwise fallback to all classes in school.
            const professorClassIds = currentUser.classIds || [];
            const availableClasses = state.classes.filter(c =>
                (professorClassIds.length > 0 ? professorClassIds.includes(c.id) : c.schoolId === currentUser.schoolId)
            );

            if (availableClasses.length === 0) {
                console.warn("Professor sem turmas vinculadas.");
                return;
            }

            // 2. Find Active Exam for these classes
            // For MVP, we select the first class that has an exam available or just the first class.
            // Ideally, we would have a ClassSelector UI here.
            const selectedClass = availableClasses[0]; // Logic could be improved to pick 'next' class
            const activeExam = state.exams.find(e => e.classIds.includes(selectedClass.id) && e.status === 'ACTIVE')
                || state.exams.find(e => e.classIds.includes(selectedClass.id)); // or draft

            // 3. Populate Data
            const classStudents = state.students.filter(s => s.classId === selectedClass.id);

            // Persist status if switching views
            const st: any = { ...studentStatuses };
            classStudents.forEach(s => {
                if (!st[s.id]) st[s.id] = 'PENDING';
            });

            setClassData({
                classId: selectedClass.id,
                className: selectedClass.name,
                students: classStudents.map(s => ({ id: s.id, name: s.name, reg: s.registrationNumber })),
                examTitle: activeExam?.title || 'Aula Regular (Sem Prova)',
                key: activeExam ? `key_${activeExam.id}` : 'no_exam_key'
            });
            setStudentStatuses(st);
        }
    }, [isLiveController, liveClassId, state.currentUser, state.classes, state.exams, state.students]);

    // QR Animation Loop
    useEffect(() => {
        let interval: any;
        if ((view === 'DISTRIBUTE_STUDENT_QR' || view === 'ATTENDANCE') && (qrChunks.length > 0 || attendanceQrChunks.length > 0)) {
            interval = setInterval(() => {
                setCurrentQrIndex(prev => {
                    const total = view === 'ATTENDANCE' ? attendanceQrChunks.length : qrChunks.length;
                    return (prev + 1) % (total || 1);
                });
            }, 250);
        }
        return () => clearInterval(interval);
    }, [view, qrChunks, attendanceQrChunks]);

    const handleDeliverToStudent = (studentId: string) => {
        const student = classData.students.find((s: any) => s.id === studentId);
        if (!student) return;

        // Payload específico para este aluno
        const payload = {
            type: 'STUDENT_PACKAGE',
            studentId: student.id,
            studentName: student.name,
            registrationNumber: student.reg,
            examKey: classData.key, // Chave para abrir a prova
            eventId: `evt_${classData.classId}_${new Date().toISOString().split('T')[0]}` // Event ID para controlar sessão
        };

        const chunks = QRDataTransfer.compressAndChunk(payload);
        setQrChunks(chunks);
        setSelectedStudentId(studentId);
        setView('DISTRIBUTE_STUDENT_QR');
    };

    const handleStudentReceived = () => {
        if (selectedStudentId) {
            setStudentStatuses(prev => ({ ...prev, [selectedStudentId]: 'ACTIVE' }));
            setView('DASHBOARD');
            setSelectedStudentId(null);
        }
    };

    const getStats = () => {
        if (!classData) return { present: 0, absent: 0, surplus: 0 };
        const presentCount = Object.values(studentStatuses).filter(s => s === 'ACTIVE' || s === 'FINISHED').length;
        const totalStudents = classData.students.length;
        const absentCount = totalStudents - presentCount;
        return { present: presentCount, absent: absentCount, surplus: absentCount };
    };

    const handleFinalizeAttendance = () => {
        const { present, absent, surplus } = getStats();
        if (!confirm(`Confirmar chamada?`)) return;
        setAttendanceLocked(true);
        const report = {
            type: 'ATTENDANCE_REPORT',
            classId: classData.classId,
            className: classData.className,
            totalStudents: classData.students.length,
            presentCount: present,
            absentCount: absent,
            surplusTablets: surplus
        };
        const chunks = QRDataTransfer.compressAndChunk(report);
        setAttendanceQrChunks(chunks);
    };

    // --- LIVE CONTROLLER ACTIONS ---

    const handleAuth = () => {
        if (pinInput === '1234') {
            setIsAuthenticated(true);
        } else {
            alert("PIN Incorreto. Olhe para o telão do evento.");
            setPinInput('');
        }
    };

    const handleUnlockClass = async () => {
        if (!liveClassId) return;
        await supabase.from('classes').update({ status: 'OPEN' }).eq('id', liveClassId);
        setLiveStatus('OPEN');
    };

    const handleFinishSession = async () => {
        if (!liveClassId) return;
        if (!confirm("Isso encerrará a prova para todos e exibirá o pódio no telão. Confirmar?")) return;

        await supabase.from('classes').update({ status: 'FINISHED' }).eq('id', liveClassId);
        setLiveStatus('FINISHED');
    };

    // --- VIEW: LIVE CONTROLLER ---
    if (view === 'LIVE_CONTROLLER') {
        if (!isAuthenticated) {
            return (
                <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
                    <div className="max-w-sm w-full bg-white rounded-3xl p-8 shadow-2xl">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <KeyRound size={32} className="text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Segurança do Professor</h2>
                        <p className="text-slate-500 text-sm mb-6">Digite o PIN exibido no telão para confirmar que você é o apresentador.</p>

                        <input
                            type="tel"
                            maxLength={4}
                            className="w-full text-center text-3xl font-mono tracking-[0.5em] border-2 border-slate-200 rounded-xl py-4 mb-6 focus:border-purple-600 outline-none text-slate-800"
                            value={pinInput}
                            onChange={e => setPinInput(e.target.value)}
                            placeholder="0000"
                        />

                        <button
                            onClick={handleAuth}
                            className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
                        >
                            Confirmar Identidade
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="max-w-md w-full">
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50">
                            <Smartphone size={40} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-2">Controle Remoto</h1>
                        <p className="text-slate-400">Comando da Sessão Ao Vivo</p>
                    </div>

                    {liveStatus === 'WAITING' ? (
                        <div className="bg-white/10 border border-white/20 p-8 rounded-3xl backdrop-blur-md animate-in zoom-in">
                            <Lock size={64} className="mx-auto text-white/50 mb-6" />
                            <h2 className="text-xl font-bold text-white mb-4">A sala está bloqueada</h2>
                            <p className="text-slate-300 text-sm mb-8">
                                A plateia está vendo seu QR Code. Pressione o botão para liberar o acesso.
                            </p>
                            <button
                                onClick={handleUnlockClass}
                                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-xl shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Unlock size={28} /> LIBERAR PLATEIA
                            </button>
                        </div>
                    ) : liveStatus === 'OPEN' ? (
                        <div className="bg-emerald-900/50 border border-emerald-500/30 p-6 rounded-3xl backdrop-blur-md h-[60vh] flex flex-col animate-in fade-in">
                            <div className="flex justify-between items-start mb-6">
                                <div className="text-left">
                                    <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Ao Vivo
                                    </div>
                                    <div className="text-3xl font-black text-white">{liveStudents.length} Alunos</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Entregas</div>
                                    <div className="text-3xl font-black text-white">{liveResultsCount}</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-black/20 rounded-xl p-4 space-y-2 text-left custom-scrollbar border border-white/5 mb-6">
                                {liveStudents.map((s, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-white border-b border-white/10 pb-2 mb-2 last:mb-0 last:pb-0 animate-in slide-in-from-bottom-2">
                                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xs">{s.name.charAt(0)}</div>
                                        <span className="font-medium truncate">{s.name}</span>
                                        <CheckCircle size={14} className="ml-auto text-emerald-400" />
                                    </div>
                                ))}
                                {liveStudents.length === 0 && <p className="text-white/30 text-center text-sm mt-10">Aguardando leituras...</p>}
                            </div>

                            <button
                                onClick={handleFinishSession}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-rose-500/30 transition flex items-center justify-center gap-2"
                            >
                                <BarChart2 size={24} /> ENCERRAR & CORRIGIR
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-800 p-8 rounded-3xl animate-in zoom-in">
                            <CheckCircle size={64} className="mx-auto text-emerald-500 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Sessão Finalizada</h2>
                            <p className="text-slate-400">Os resultados estão sendo exibidos no telão principal.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!classData) return <div className="flex items-center justify-center h-screen text-white bg-slate-900">Carregando dados da turma...</div>;

    const stats = getStats();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-purple-800 text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="font-bold text-lg">{classData.className}</h2>
                        <p className="text-xs opacity-80">{classData.examTitle}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setView('DASHBOARD')} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${view === 'DASHBOARD' ? 'bg-white text-purple-900' : 'bg-purple-900/50 hover:bg-purple-700'}`}>
                        Aplicação
                    </button>
                    <button onClick={() => setView('ATTENDANCE')} className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${view === 'ATTENDANCE' ? 'bg-white text-purple-900' : 'bg-purple-900/50 hover:bg-purple-700'}`}>
                        <UserCheck size={16} /> Chamada {attendanceLocked && <Lock size={12} />}
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
                {view === 'DASHBOARD' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2"><Users className="text-purple-600" /> Distribuição de Tablets</h3>
                            <div className="flex gap-2">
                                <span className="text-xs font-bold text-slate-500 bg-white px-3 py-2 rounded border">
                                    Ativos: {stats.present} / {classData.students.length}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {classData.students.map((s: any) => {
                                const status = studentStatuses[s.id];
                                return (
                                    <div key={s.id} className={`p-4 rounded-xl border-2 flex flex-col gap-3 transition-all ${status === 'ACTIVE' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                                        <div>
                                            <div className="font-bold text-slate-800">{s.name}</div>
                                            <div className="text-xs text-slate-500">{s.reg}</div>
                                        </div>
                                        {status === 'PENDING' && (
                                            <button
                                                onClick={() => handleDeliverToStudent(s.id)}
                                                className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-700"
                                            >
                                                <UserPlus size={16} /> Entregar Tablet
                                            </button>
                                        )}
                                        {status === 'ACTIVE' && (
                                            <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm py-2 bg-emerald-100 rounded-lg">
                                                <Monitor size={16} /> Em Prova
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {view === 'ATTENDANCE' && (
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-xl">Conferência Automática</h3>
                                <p className="text-slate-500 text-sm">Presença detectada via ativação dos tablets.</p>
                            </div>
                            <div className="flex gap-4 text-sm">
                                <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold">Presentes: {stats.present}</div>
                                <div className="px-4 py-2 bg-rose-100 text-rose-800 rounded-lg font-bold">Ausentes: {stats.absent}</div>
                            </div>
                        </div>

                        {!attendanceLocked ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 max-h-[400px] overflow-y-auto">
                                    {classData.students.map((s: any) => {
                                        const status = studentStatuses[s.id];
                                        const isPresent = status === 'ACTIVE' || status === 'FINISHED';
                                        return (
                                            <div key={s.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isPresent ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200 opacity-70'}`}>
                                                <div>
                                                    <div className={`font-bold ${!isPresent ? 'text-rose-800' : 'text-slate-800'}`}>{s.name}</div>
                                                    <div className="text-xs text-slate-500">{s.reg}</div>
                                                </div>
                                                <div>
                                                    {isPresent ? (
                                                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm"><Monitor size={16} /> Ativo</div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm"><XSquare size={16} /> Ausente</div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <button onClick={handleFinalizeAttendance} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 flex items-center justify-center gap-2">
                                    <Lock size={20} /> Confirmar Chamada
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">Chamada Finalizada</h2>
                                    <p className="text-slate-500 mt-2">QR Code de sincronização gerado.</p>
                                </div>
                                {attendanceQrChunks.length > 0 && (
                                    <div className="bg-white p-4 rounded-xl border-4 border-slate-900 shadow-2xl mb-4">
                                        <QrCode size={250} className="text-slate-900" />
                                    </div>
                                )}
                                <div className="font-mono font-bold text-slate-400 mb-8">Parte {currentQrIndex + 1} / {attendanceQrChunks.length}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Modal de Entrega de Tablet */}
                {view === 'DISTRIBUTE_STUDENT_QR' && selectedStudentId && (
                    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-6">
                        <div className="text-white text-center mb-6">
                            <h2 className="text-3xl font-bold mb-2">Entregando para:</h2>
                            <h1 className="text-4xl font-black text-brand-secondary">
                                {classData.students.find((s: any) => s.id === selectedStudentId)?.name}
                            </h1>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-2xl mb-8">
                            <QrCode size={320} className="text-black" />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setView('DASHBOARD')} className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 font-bold">Cancelar</button>
                            <button onClick={handleStudentReceived} className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 shadow-lg">Confirmar Entrega</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
