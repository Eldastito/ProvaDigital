
import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Monitor, UserCheck, QrCode, CheckCircle, Lock, UserPlus, XSquare, Layers, AlertTriangle, Unlock, Play, Smartphone, KeyRound, BarChart2, ClipboardCheck, Pause, Trophy } from 'lucide-react';
import { AppState, Student, ExamResult, SchoolClass } from '../../types';
import { QRDataTransfer } from '../../services/qrCodecService';
import { supabase } from '../../services/supabaseClient';
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { fetchStudents, fetchClasses, fetchResults } from '../../services/supabaseClient'; // Import fetching functions

interface ProfessorAppProps {
    state: AppState; // Keep state prop for currentUser access if needed in future
    onBack: () => void;
}

export const ProfessorApp = ({ state, onBack }: ProfessorAppProps) => { // Keep state prop
    // Check URL params for Live Controller Mode
    const params = new URLSearchParams(window.location.search);
    const isLiveController = params.get('action') === 'CONTROL';
    const liveClassId = params.get('classId');

    // Fetch data using useQuery
    // @fix: Updated useQuery to use object-based syntax
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allClasses } = useQuery<SchoolClass[]>({ queryKey: ['classes'], queryFn: fetchClasses, initialData: [] });
    const { data: allResults } = useQuery<ExamResult[]>({ queryKey: ['results'], queryFn: fetchResults, initialData: [] });

    // Dados recebidos do Coordenador (Modo Normal)
    const [classData, setClassData] = useState<any>(null);
    
    // Controle de Sessão
    const [view, setView] = useState<'DASHBOARD' | 'ATTENDANCE' | 'DISTRIBUTE_STUDENT_QR' | 'LIVE_CONTROLLER'>('DASHBOARD');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentStatuses, setStudentStatuses] = useState<Record<string, 'PENDING' | 'ACTIVE' | 'FINISHED'>>({});
    const [attendanceLocked, setAttendanceLocked] = useState(false);
    
    // Live Controller States
    const [liveStatus, setLiveStatus] = useState<'WAITING' | 'OPEN' | 'FINISHED'>('WAITING');
    const [liveStudents, setLiveStudents] = useState<any[]>([]); // This will be updated by Supabase Realtime
    const [liveResultsCount, setLiveResultsCount] = useState(0); // This will be updated by Supabase Realtime
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
            // Mock reception of Class 9A data (Normal Mode)
            // This would normally come from a QR code scan by the coordinator
            setTimeout(() => {
                const mockData = {
                    classId: 'c1',
                    className: 'Turma 9A',
                    // @-fix: Added optional chaining and a fallback array to safely call .filter() on data from useQuery.
                    students: allStudents?.filter(s => s.classId === 'c1').map(s => ({ id: s.id, name: s.name, reg: s.registrationNumber })) || [], // Use allStudents
                    examTitle: 'Avaliação de História',
                    key: 'mock_key_123'
                };
                setClassData(mockData);
                
                // Init statuses
                const st: any = {};
                mockData.students.forEach((s: any) => {
                    st[s.id] = 'PENDING';
                });
                setStudentStatuses(st);
            }, 500);
        }
    }, [isLiveController, liveClassId, allStudents]); // Add allStudents to dependencies

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
        }
    };

    const handleLiveControl = async (action: 'OPEN' | 'PAUSE' | 'FINISHED') => {
        if (!liveClassId) return;

        const { error } = await supabase.from('classes').update({ status: action }).eq('id', liveClassId);
        if (error) {
            console.error("Erro ao atualizar status da turma ao vivo:", error);
            alert("Erro no controle ao vivo: " + error.message);
        } else {
            // @-fix: Typo 'FINISH' corrected to 'FINISHED' to match state type.
            setLiveStatus(action === 'PAUSE' ? 'WAITING' : action); // Assuming PAUSE sets it to WAITING
        }
    };

    const calculateLiveResults = async () => {
        if (!liveClassId || !allResults) return;

        // @fix: Changed student_id to studentId to match ExamResult interface
        const resultsForClass = allResults.filter(r => liveStudents.some(s => s.id === r.studentId));
        if (resultsForClass.length === 0) {
            alert("Nenhum resultado para calcular ainda.");
            return;
        }
        
        // This is where you'd trigger the lobby to show results based on `liveClassId`
        // For this demo, we'll just log and suggest manually navigating the lobby
        console.log("Resultados ao vivo para cálculo:", resultsForClass);
        alert("Resultados coletados! O Lobby de Demo irá processar e exibir. Sugira ao operador do Lobby para 'Finalizar Sessão'.");
    };


    if (!classData && !isLiveController) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <QrCode size={64} className="mb-4 opacity-20"/>
                <p>Aguardando dados da turma. Escaneie o QR Code do Coordenador.</p>
            </div>
        );
    }

    // --- LIVE CONTROLLER MODE ---
    if (isLiveController) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-white">
                <header className="bg-[#0f1d2e] p-4 shadow-md flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Monitor size={24} className="text-brand-primary"/>
                        <h2 className="font-bold text-lg leading-tight">Controle de Sala Ao Vivo</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-slate-400">Turma: {liveClassId?.slice(0, 6)}</span>
                        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft size={20}/></button>
                    </div>
                </header>
                
                {!isAuthenticated ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <Lock size={64} className="text-red-500 mb-6 animate-shake"/>
                        <h1 className="text-3xl font-bold mb-4">Acesso Restrito</h1>
                        <p className="text-slate-400 mb-8">Digite o PIN de segurança para assumir o controle da sessão.</p>
                        <div className="relative w-full max-w-sm">
                            <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/>
                            <input 
                                type="password" 
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-10 pr-4 text-white text-lg focus:border-brand-primary outline-none"
                                placeholder="Sua senha do SaaS"
                                value={pinInput}
                                onChange={e => setPinInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAuth()}
                            />
                        </div>
                        <button onClick={handleAuth} className="mt-8 bg-brand-primary text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-brand-dark transition shadow-lg">
                            Autenticar
                        </button>
                        <p className="text-xs text-slate-500 mt-4">O PIN é exibido no Telão da Sessão.</p>
                    </div>
                ) : (
                    <main className="flex-1 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                                <div className="text-slate-400 text-xs uppercase font-bold mb-2">Alunos Conectados</div>
                                <div className="text-5xl font-black text-emerald-400 flex items-center justify-center gap-2">
                                    {liveStudents.length} <Smartphone size={32} className="text-emerald-500"/>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                                <div className="text-slate-400 text-xs uppercase font-bold mb-2">Provas Entregues</div>
                                <div className="text-5xl font-black text-white flex items-center justify-center gap-2">
                                    {liveResultsCount} <ClipboardCheck size={32} className="text-blue-400"/>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                                <div className="text-slate-400 text-xs uppercase font-bold mb-2">Status Atual</div>
                                <div className={`text-4xl font-black mt-1 ${liveStatus === 'OPEN' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {liveStatus === 'OPEN' ? 'AO VIVO' : 'PAUSADO'}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-8">
                            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                                <Play size={20} className="text-brand-primary"/> Controles da Sessão
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <button 
                                    onClick={() => handleLiveControl('OPEN')} 
                                    disabled={liveStatus === 'OPEN'}
                                    className="py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    <Play size={20} fill="white"/> Iniciar / Liberar
                                </button>
                                <button 
                                    onClick={() => handleLiveControl('PAUSE')} 
                                    disabled={liveStatus !== 'OPEN'}
                                    className="py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    <Pause size={20} fill="white"/> Pausar
                                </button>
                                <button 
                                    onClick={() => handleLiveControl('FINISHED')} 
                                    disabled={liveStatus === 'FINISHED'}
                                    className="py-4 bg-rose-600 text-white rounded-xl font-bold text-lg hover:bg-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    <XSquare size={20} fill="white"/> Encerrar Prova
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-4 text-center">
                                Clicar em 'Encerrar Prova' irá coletar todos os resultados e finalizar a sessão.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                                <BarChart2 size={20} className="text-yellow-400"/> Análise Rápida
                            </h3>
                            <p className="text-slate-400 text-sm">
                                Após encerrar, clique abaixo para ver um painel de resultados detalhado no Telão.
                            </p>
                            <button onClick={calculateLiveResults} className="mt-4 bg-blue-600 text-white py-3 px-6 rounded-xl font-bold text-md hover:bg-blue-700 transition flex items-center gap-2">
                                <Trophy size={18}/> Ver Pódio & Estatísticas
                            </button>
                        </div>
                    </main>
                )}
            </div>
        );
    }

    // --- NORMAL PROFESSOR APP MODE ---
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
            <header className="bg-[#0f1d2e] text-white p-4 shadow-md flex justify-between items-center">
                <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft size={20}/></button>
                     <div>
                         <h2 className="font-bold text-lg leading-tight">{classData.className}</h2>
                         <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Users size={12} /> Professor (Sessão Online)
                         </div>
                     </div>
                </div>
                {attendanceLocked && (
                    <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1 animate-pulse">
                        <Lock size={12}/> CHAMADA BLOQUEADA
                    </span>
                )}
            </header>

            {/* Tab Bar */}
            <div className="bg-white border-b flex">
                <button onClick={() => setView('DASHBOARD')} className={`flex-1 py-4 font-bold text-sm border-b-4 transition ${view === 'DASHBOARD' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    Dashboard
                </button>
                <button onClick={() => setView('ATTENDANCE')} className={`flex-1 py-4 font-bold text-sm border-b-4 transition ${view === 'ATTENDANCE' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500'}`}>
                    Chamada
                </button>
            </div>

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
                {view === 'DASHBOARD' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                                <div className="text-slate-400 text-xs uppercase font-bold mb-2">Alunos Conectados</div>
                                <div className="text-5xl font-black text-emerald-600">{getStats().present}</div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm text-center">
                                <div className="text-slate-400 text-xs uppercase font-bold mb-2">Alunos Ausentes</div>
                                <div className="text-5xl font-black text-rose-600">{getStats().absent}</div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={20}/> Lista de Alunos</h3>
                            <div className="space-y-2">
                                {classData.students.map((student: any) => (
                                    <div key={student.id} className={`p-4 border rounded-xl flex justify-between items-center transition ${studentStatuses[student.id] === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${studentStatuses[student.id] === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                {studentStatuses[student.id] === 'ACTIVE' ? <UserCheck size={18}/> : <UserPlus size={18}/>}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{student.name}</div>
                                                <div className="text-xs text-slate-500">Matrícula: {student.reg}</div>
                                            </div>
                                        </div>
                                        {studentStatuses[student.id] === 'PENDING' ? (
                                            <button 
                                                onClick={() => handleDeliverToStudent(student.id)}
                                                className="bg-brand-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-dark"
                                            >
                                                Entregar Prova
                                            </button>
                                        ) : (
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${studentStatuses[student.id] === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {studentStatuses[student.id] === 'ACTIVE' ? 'PROVA ATIVA' : 'FINALIZADO'}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'ATTENDANCE' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><UserCheck size={20}/> Resumo da Chamada</h3>
                            <div className="grid grid-cols-3 gap-4 text-center mb-6">
                                <div className="bg-emerald-50 p-4 rounded-lg">
                                    <div className="text-xl font-bold text-emerald-700">{getStats().present}</div>
                                    <div className="text-xs text-emerald-600 uppercase">Presentes</div>
                                </div>
                                <div className="bg-rose-50 p-4 rounded-lg">
                                    <div className="text-xl font-bold text-rose-700">{getStats().absent}</div>
                                    <div className="text-xs text-rose-600 uppercase">Ausentes</div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-xl font-bold text-blue-700">{getStats().surplus}</div>
                                    <div className="text-xs text-blue-600 uppercase">Tablets de Sobra</div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleFinalizeAttendance}
                                disabled={attendanceLocked}
                                className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {attendanceLocked ? 'Chamada Finalizada' : <><CheckCircle size={16}/> Finalizar Chamada</>}
                            </button>
                            {attendanceLocked && attendanceQrChunks.length > 0 && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-lg border text-center">
                                    <h4 className="text-sm font-bold text-slate-800 mb-2">QR de Coleta para Coordenador</h4>
                                    <div className="bg-white p-4 rounded-xl border-4 border-slate-900 inline-block shadow-lg">
                                        <QrCode size={150} className="text-slate-900"/>
                                    </div>
                                    <div className="font-mono font-bold mt-2">Parte {currentQrIndex + 1} / {attendanceQrChunks.length}</div>
                                    <p className="text-xs text-slate-400 mt-1">Coordenador deve escanear este QR</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === 'DISTRIBUTE_STUDENT_QR' && (
                    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Entregar Prova para Aluno</h2>
                        <p className="text-slate-500 mb-8 text-center max-w-md">Aluno <strong>{classData.students.find((s:any)=>s.id===selectedStudentId)?.name}</strong> deve escanear este QR com o tablet dele.</p>
                        
                        <div className="bg-white p-4 rounded-xl border-4 border-slate-900 shadow-2xl">
                            <QrCode size={300} className="text-slate-900"/>
                        </div>
                        <div className="font-mono font-bold mt-4 text-lg">Parte {currentQrIndex + 1} / {qrChunks.length}</div>
                        <p className="text-xs text-slate-400 mt-2">Mantenha a tela brilhante</p>

                        <button onClick={handleStudentReceived} className="mt-12 px-8 py-4 bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-2">
                            <XSquare size={20}/> Concluído
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};
