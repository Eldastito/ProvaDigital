
import React, { useState, useEffect } from 'react';
import { QrCode, ArrowLeft, Users, Server, FileText, CheckCircle, X, AlertTriangle, Layers, Scan, MapPin, User } from 'lucide-react';
import { AppState, ExamEvent, EventStatus } from '../../types';
import { encryptPackage, generateEventKey } from '../../services/cryptoService';
import { QRDataTransfer } from '../../services/qrCodecService';

import { useAppStore } from '../../store/useAppStore';

interface CoordinatorAppProps {
    initialPayload?: any; // Contains schoolId, userId, userName
    onBack: () => void;
    onSyncUp: (events: ExamEvent[]) => void;
}

interface RoundData {
    checked: boolean;
    surplus: number;
    absent: number;
}

export const CoordinatorApp = ({ initialPayload, onBack, onSyncUp }: CoordinatorAppProps) => {
    const state = useAppStore();
    // Extract data passed from Launcher
    // Extract data passed from Launcher or Current User context
    const coordinatorSchoolId = initialPayload?.schoolId || state.currentUser?.schoolId || 's1'; // Prioritize payload, then user, then dev fallback
    const coordinatorName = initialPayload?.userName || 'Coordenador';

    const school = state.schools.find(s => s.id === coordinatorSchoolId);

    const [view, setView] = useState<'LIST' | 'ROUNDS' | 'DISTRIBUTE_QR' | 'SCAN_ATTENDANCE'>('LIST');
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [qrChunks, setQrChunks] = useState<string[]>([]);
    const [currentQrIndex, setCurrentQrIndex] = useState(0);

    // Filter data for THIS school only
    const schoolClasses = state.classes.filter(c => c.schoolId === coordinatorSchoolId);
    const schoolExams = state.exams.filter(e => e.schoolId === coordinatorSchoolId);

    // Attendance Tracking State
    const [roundsData, setRoundsData] = useState<Record<string, RoundData>>({});

    useEffect(() => {
        // Init rounds data
        const initRounds: Record<string, RoundData> = {};
        schoolClasses.forEach(c => {
            initRounds[c.id] = { checked: false, surplus: 0, absent: 0 };
        });
        setRoundsData(initRounds);
    }, [coordinatorSchoolId]); // Reset if school changes (unlikely in session but good practice)

    useEffect(() => {
        // QR Loop Animation
        let interval: any;
        if (qrChunks.length > 0) {
            interval = setInterval(() => {
                setCurrentQrIndex(prev => (prev + 1) % qrChunks.length);
            }, 300);
        }
        return () => clearInterval(interval);
    }, [qrChunks]);

    const handleDistributeToProfessor = async (classId: string) => {
        const targetClass = schoolClasses.find(c => c.id === classId);
        const exam = schoolExams.find(e => e.classIds.includes(classId));

        if (!exam || !targetClass) return alert("Nenhuma prova agendada para esta turma.");

        // 1. Generate Key for this Class Session
        const eventId = `${exam.id}_${classId}`;
        const keyPair = await generateEventKey(eventId);

        // 2. Create Payload for Professor Tablet
        const students = state.students.filter(s => s.classId === classId);

        const payload = {
            type: 'CLASS_PACKAGE',
            schoolName: school?.name,
            className: targetClass.name,
            eventId: eventId,
            key: keyPair.keyMaterial, // Professor gets the key to distribute
            students: students.map(s => ({ id: s.id, name: s.name, reg: s.registrationNumber })),
            examContent: exam // In real scenario, this might be encrypted too or just config
        };

        // 3. Generate QR
        const chunks = QRDataTransfer.compressAndChunk(payload);
        setQrChunks(chunks);
        setSelectedClassId(classId);
        setView('DISTRIBUTE_QR');
    };

    // Simulação de Scan de Presença (Mock)
    const simulateScanAttendance = (classId: string) => {
        // Em produção, isso seria o parser do QR Code lido pela câmera
        const mockReport = {
            classId: classId,
            absentCount: 3,
            surplusTablets: 3
        };

        setRoundsData(prev => ({
            ...prev,
            [classId]: { checked: true, surplus: mockReport.surplusTablets, absent: mockReport.absentCount }
        }));
        setView('ROUNDS');
    };

    // Totals - Explicitly typed for TypeScript safety
    const totalSurplus = Object.values(roundsData).reduce((acc: number, r: RoundData) => acc + r.surplus, 0);
    const roomsChecked = Object.values(roundsData).filter((r: RoundData) => r.checked).length;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
            <header className="bg-[#0f1d2e] text-white p-4 shadow-md flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">{school?.name || 'Escola Desconhecida'}</h2>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <User size={12} /> {coordinatorName} (Coordenação)
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Bar */}
            <div className="bg-white border-b flex">
                <button onClick={() => setView('LIST')} className={`flex-1 py-4 font-bold text-sm border-b-4 transition ${view === 'LIST' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'}`}>
                    Distribuição (Início)
                </button>
                <button onClick={() => setView('ROUNDS')} className={`flex-1 py-4 font-bold text-sm border-b-4 transition ${view === 'ROUNDS' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500'}`}>
                    Ronda & Coleta (Fim)
                </button>
            </div>

            <main className="flex-1 p-6 max-w-4xl mx-auto w-full">

                {view === 'LIST' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={20} /> Turmas & Aplicação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {schoolClasses.map(cls => {
                                    const hasExam = schoolExams.some(e => e.classIds.includes(cls.id));
                                    return (
                                        <div key={cls.id} className="p-4 border rounded-xl flex justify-between items-center hover:border-brand-primary transition bg-slate-50">
                                            <div>
                                                <div className="font-bold text-slate-800">{cls.name}</div>
                                                <div className="text-xs text-slate-500">{cls.series} • {cls.shift}</div>
                                                {hasExam ? (
                                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle size={12} /> Prova Disponível</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 mt-1">Sem prova hoje</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDistributeToProfessor(cls.id)}
                                                disabled={!hasExam}
                                                className="bg-brand-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Gerar Carga
                                            </button>
                                        </div>
                                    );
                                })}
                                {schoolClasses.length === 0 && <div className="col-span-2 text-center text-slate-400">Nenhuma turma cadastrada para esta escola.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'ROUNDS' && (
                    <div className="space-y-6">
                        {/* Dashboard de Estoque */}
                        <div className="bg-emerald-900 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
                            <div>
                                <div className="text-xs font-bold text-emerald-300 uppercase mb-1">Estoque de Reserva Total</div>
                                <div className="text-4xl font-black flex items-center gap-2">
                                    {totalSurplus} <span className="text-lg font-medium opacity-70">tablets</span>
                                </div>
                                <div className="text-xs text-emerald-200 mt-2">Baseado em {roomsChecked} de {schoolClasses.length} salas verificadas</div>
                            </div>
                            <div className="h-12 w-12 bg-emerald-800 rounded-full flex items-center justify-center border-2 border-emerald-600">
                                <Layers size={24} />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={20} /> Roteiro de Coleta</h3>
                            <div className="space-y-3">
                                {schoolClasses.map(cls => {
                                    const data = roundsData[cls.id];
                                    return (
                                        <div key={cls.id} className={`p-4 border rounded-xl flex justify-between items-center transition ${data.checked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${data.checked ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                    {data.checked ? <CheckCircle size={18} /> : <Scan size={18} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{cls.name}</div>
                                                    {data.checked ? (
                                                        <div className="text-xs font-bold text-emerald-700">
                                                            Coletado • Sobra: {data.surplus}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400">Pendente</div>
                                                    )}
                                                </div>
                                            </div>
                                            {!data.checked && (
                                                <button
                                                    onClick={() => simulateScanAttendance(cls.id)} // In real app: Opens camera
                                                    className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-700 flex items-center gap-2"
                                                >
                                                    <Scan size={16} /> Ler QR Sala
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'DISTRIBUTE_QR' && (
                    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Entregar para Professor</h2>
                        <p className="text-slate-500 mb-8 text-center max-w-md">Peça para o Professor escanear este código com o tablet dele para receber os dados da turma <strong>{schoolClasses.find(c => c.id === selectedClassId)?.name}</strong>.</p>

                        <div className="bg-white p-4 rounded-xl border-4 border-slate-900 shadow-2xl">
                            <QrCode size={300} className="text-slate-900" />
                        </div>
                        <div className="font-mono font-bold mt-4 text-lg">Parte {currentQrIndex + 1} / {qrChunks.length}</div>
                        <p className="text-xs text-slate-400 mt-2">Mantenha a tela brilhante</p>

                        <button onClick={() => setView('LIST')} className="mt-12 px-8 py-4 bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-2">
                            <X size={20} /> Fechar / Concluído
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
};
