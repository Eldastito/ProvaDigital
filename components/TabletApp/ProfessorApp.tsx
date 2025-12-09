
import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Monitor, UserCheck, QrCode, CheckCircle, Lock, UserPlus, XSquare, Layers, AlertTriangle } from 'lucide-react';
import { AppState } from '../../types';
import { QRDataTransfer } from '../../services/qrCodecService';

interface ProfessorAppProps {
    state: AppState;
    onBack: () => void;
}

export const ProfessorApp = ({ state, onBack }: ProfessorAppProps) => {
    // Dados recebidos do Coordenador
    const [classData, setClassData] = useState<any>(null);
    
    // Controle de Sessão
    const [view, setView] = useState<'DASHBOARD' | 'ATTENDANCE' | 'DISTRIBUTE_STUDENT_QR'>('DASHBOARD');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentStatuses, setStudentStatuses] = useState<Record<string, 'PENDING' | 'ACTIVE' | 'FINISHED'>>({});
    const [attendanceLocked, setAttendanceLocked] = useState(false);
    
    // QR States
    const [qrChunks, setQrChunks] = useState<string[]>([]);
    const [currentQrIndex, setCurrentQrIndex] = useState(0);
    const [attendanceQrChunks, setAttendanceQrChunks] = useState<string[]>([]);

    // Simula recepção inicial (Normalmente viria do scanner do Launcher)
    useEffect(() => {
        // Mocking reception of Class 9A data
        setTimeout(() => {
            const mockData = {
                classId: 'c1',
                className: 'Turma 9A',
                students: state.students.filter(s => s.classId === 'c1').map(s => ({ id: s.id, name: s.name, reg: s.registrationNumber })),
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
    }, []);

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

    // Lógica Automática de Presença
    const getStats = () => {
        if (!classData) return { present: 0, absent: 0, surplus: 0 };
        
        const presentCount = Object.values(studentStatuses).filter(s => s === 'ACTIVE' || s === 'FINISHED').length;
        const totalStudents = classData.students.length;
        const absentCount = totalStudents - presentCount;
        
        return {
            present: presentCount,
            absent: absentCount,
            surplus: absentCount // Sobra exatamente quem não pegou tablet
        };
    };

    const handleFinalizeAttendance = () => {
        const { present, absent, surplus } = getStats();
        
        const confirmMsg = `CONFIRMAÇÃO AUTOMÁTICA\n\n` +
            `- Tablets Ativos (Presentes): ${present}\n` +
            `- Sem Tablet (Ausentes): ${absent}\n` +
            `- Estoque para Devolução: ${surplus}\n\n` +
            `O sistema assumirá que os alunos sem tablet estão FALTOSOS. Confirma?`;

        if (!confirm(confirmMsg)) return;
        
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

    if (!classData) return <div className="flex items-center justify-center h-screen text-white bg-slate-900">Carregando dados da turma...</div>;

    const stats = getStats();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-purple-800 text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft size={20}/></button>
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
                        <UserCheck size={16}/> Chamada Automática {attendanceLocked && <Lock size={12}/>}
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
                
                {view === 'DASHBOARD' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2"><Users className="text-purple-600"/> Distribuição de Tablets</h3>
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
                                                <UserPlus size={16}/> Entregar Tablet
                                            </button>
                                        )}
                                        
                                        {status === 'ACTIVE' && (
                                            <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm py-2 bg-emerald-100 rounded-lg">
                                                <Monitor size={16}/> Em Prova
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
                                <p className="text-slate-500 text-sm">Presença detectada via ativação dos tablets. Sem edição manual.</p>
                            </div>
                            <div className="flex gap-4 text-sm">
                                <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold">Presentes: {stats.present}</div>
                                <div className="px-4 py-2 bg-rose-100 text-rose-800 rounded-lg font-bold">Ausentes: {stats.absent}</div>
                                <div className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold flex items-center gap-2">
                                    <Layers size={16}/> Devolução: {stats.surplus} Tablets
                                </div>
                            </div>
                        </div>

                        {!attendanceLocked ? (
                            <>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-sm text-blue-800 mb-6 flex items-center gap-3">
                                    <AlertTriangle size={20}/>
                                    <div>
                                        <strong>Atenção:</strong> Esta lista é gerada automaticamente. 
                                        Alunos com status "Ausente" são aqueles que <strong>não receberam</strong> um tablet na aba "Aplicação".
                                        Se um aluno chegou atrasado, volte e entregue o tablet antes de fechar.
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 max-h-[400px] overflow-y-auto">
                                    {classData.students.map((s: any) => {
                                        const status = studentStatuses[s.id];
                                        const isPresent = status === 'ACTIVE' || status === 'FINISHED';
                                        
                                        return (
                                            <div 
                                                key={s.id} 
                                                className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isPresent ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200 opacity-70'}`}
                                            >
                                                <div>
                                                    <div className={`font-bold ${!isPresent ? 'text-rose-800' : 'text-slate-800'}`}>{s.name}</div>
                                                    <div className="text-xs text-slate-500">{s.reg}</div>
                                                </div>
                                                <div>
                                                    {isPresent ? (
                                                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                                            <Monitor size={16}/> Tablet Ativo
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                                                            <XSquare size={16}/> Sem Tablet
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <button 
                                    onClick={handleFinalizeAttendance}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 flex items-center justify-center gap-2"
                                >
                                    <Lock size={20}/> Confirmar Chamada & Gerar QR
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                                        <CheckCircle size={32}/>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">Chamada Finalizada</h2>
                                    <p className="text-slate-500 mt-2">Mostre este QR Code ao Coordenador para a coleta de dados e tablets.</p>
                                </div>

                                {attendanceQrChunks.length > 0 && (
                                    <div className="bg-white p-4 rounded-xl border-4 border-slate-900 shadow-2xl mb-4">
                                        <QrCode size={250} className="text-slate-900"/>
                                    </div>
                                )}
                                <div className="font-mono font-bold text-slate-400 mb-8">Parte {currentQrIndex + 1} / {attendanceQrChunks.length}</div>

                                <div className="grid grid-cols-2 gap-8 w-full max-w-md text-center">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="text-3xl font-black text-slate-800">{stats.present}</div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">Alunos em Prova</div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <div className="text-3xl font-black text-emerald-600">{stats.surplus}</div>
                                        <div className="text-xs font-bold text-emerald-700 uppercase">Tablets P/ Recolher</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Modal de Entrega de Tablet (Mesmo código anterior) */}
                {view === 'DISTRIBUTE_STUDENT_QR' && selectedStudentId && (
                    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-6">
                        <div className="text-white text-center mb-6">
                            <h2 className="text-3xl font-bold mb-2">Entregando para:</h2>
                            <h1 className="text-4xl font-black text-brand-secondary">
                                {classData.students.find((s: any) => s.id === selectedStudentId)?.name}
                            </h1>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl shadow-2xl mb-8">
                            <QrCode size={320} className="text-black"/>
                        </div>
                        
                        <p className="text-slate-400 mb-8 animate-pulse">Aguardando leitura pelo tablet do aluno...</p>

                        <div className="flex gap-4">
                            <button onClick={() => setView('DASHBOARD')} className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 font-bold">Cancelar</button>
                            <button onClick={handleStudentReceived} className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/50">
                                Confirmar Entrega (Manual)
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};
