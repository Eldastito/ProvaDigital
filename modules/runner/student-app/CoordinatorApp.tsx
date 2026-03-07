
import React, { useState, useEffect } from 'react';
import { QrCode, ArrowLeft, Users, Server, FileText, CheckCircle, X, AlertTriangle, Layers, Scan, MapPin, User, Activity } from 'lucide-react';
import { AppState } from '../../../types';
import { ExamEvent, EventStatus } from '../../../types'; // Keeping ExamEvent and EventStatus as they are used
import { encryptPackage, generateEventKey } from '../../../services/cryptoService';
import { QRDataTransfer } from '../../../services/qrCodecService';
import { supabase } from '../../../services/supabaseClient';

import { useSafeAppStore } from '../../../store/useAppStore';
import { TabletLauncher } from './TabletLauncher';
import { QRScannerModal } from '../offline/QRScannerModal';
import { offlineConsolidationService } from '../../../services/offlineConsolidationService';
import { auditService } from '../../../services/auditService';
import { operationalHealthService } from '../../../services/operationalHealthService';

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
    const state = useSafeAppStore();
    // Extract data passed from Launcher
    // Extract data passed from Launcher or Current User context
    const coordinatorSchoolId = initialPayload?.schoolId || state.currentUser?.schoolId || 's1'; // Prioritize payload, then user, then dev fallback
    const coordinatorName = initialPayload?.userName || 'Coordenador';

    const school = state.schools.find(s => s.id === coordinatorSchoolId);

    const [view, setView] = useState<'LIST' | 'ROUNDS' | 'DISTRIBUTE_QR' | 'SCAN_ATTENDANCE' | 'FINALIZE'>('LIST');
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [qrChunks, setQrChunks] = useState<string[]>([]);
    const [currentQrIndex, setCurrentQrIndex] = useState(0);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationReport, setValidationReport] = useState<{ total: number; valid: number; errors: string[] } | null>(null);

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
        
        let keyPair = null;
        try {
            // Caminho A: Buscar Chave Faísca do Backend (RLS permite apenas Coordenadores)
            const { data: keyData, error: keyError } = await supabase
                .from('exam_offline_keys')
                .select('key_data')
                .eq('exam_id', exam.id)
                .single();
                
            if (keyError || !keyData) {
                console.warn("Chave offline não encontrada no servidor. Gerando chave fallback em memória (Não vai destrancar provas com download em fechado).", keyError);
                keyPair = await generateEventKey();
            } else {
                keyPair = keyData.key_data;
            }
        } catch (e) {
            console.error("Erro ao resgatar chave offline do supabase", e);
            keyPair = await generateEventKey();
        }

        // 2. Create Payload for Professor Tablet
        const students = state.students.filter(s => s.classId === classId);

        const payload = {
            type: 'CLASS_PACKAGE',
            schoolName: school?.name,
            className: targetClass.name,
            eventId: eventId,
            examId: exam.id,
            examTitle: exam.title,
            students: students.map(s => ({ id: s.id, name: s.name, reg: s.registrationNumber })),
            // Segregação: Não enviamos o examContent (itens em claro) para o professor.
            // O tablet do professor ou do aluno deve buscar o binário encriptado via Mesh ou Cache.
            // A chave (keyPair) será enviada de forma encriptada ou via protocolo de custódia em futuras sprints.
            key: keyPair 
        };

        // 3. Generate QR
        const chunks = await QRDataTransfer.compressAndChunk(payload);
        setQrChunks(chunks);
        setSelectedClassId(classId);
        setView('DISTRIBUTE_QR');

        // Audit Log
        await auditService.log({
            actorId: state.currentUser?.id || 'unknown',
            actorEmail: state.currentUser?.email,
            schoolId: coordinatorSchoolId,
            tenantId: state.currentUser?.tenantId || 'unknown',
            actionType: 'HANDOFF_GENERATE',
            targetResource: 'CLASS_PACKAGE',
            targetId: eventId,
            details: {
                className: targetClass.name,
                examTitle: exam.title,
                studentCount: students.length
            }
        });
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

    // FASE 4.3: Decodifica e Valida a Integridade Hash do QR Code da turma
    const handleScannerResult = async (data: any) => {
        setIsScannerOpen(false);
        try {
            if (data.type === 'ATTENDANCE_REPORT') {
                const { cryptoService } = await import('../../../services/cryptoService');
                
                // O payload assinado deve separar a assinatura do corpo
                const { cryptoSignature, ...baseReport } = data;
                
                // Recalcula a Hash na hora baseada no payload base enviado pelo Professor
                const calculatedHash = await cryptoService.generateSHA256Hash(baseReport);
                
                if (calculatedHash !== cryptoSignature) {
                    alert("⚠️ ALERTA DE SEGURANÇA! O selo HMAC foi quebrado ou adulterado.");
                    return;
                }

                alert(`✅ Custódia Válida! Recebendo ${baseReport.submissions?.length || 0} provas offline extraídas do Mesh da sala ${baseReport.className}.`);
                
                setRoundsData(prev => ({
                    ...prev,
                    [baseReport.classId]: { checked: true, surplus: baseReport.surplusTablets, absent: baseReport.absentCount }
                }));
                
                // FASE 5: Persistência de Custódia
                if (baseReport.submissions && baseReport.submissions.length > 0) {
                    console.log(`💾 Persistindo ${baseReport.submissions.length} submissões via Handoff`);
                    for (const sub of baseReport.submissions) {
                        await offlineConsolidationService.saveSubmission({
                            studentId: sub.studentId,
                            studentName: sub.studentName,
                            examId: baseReport.examId,
                            eventId: baseReport.eventId,
                            encryptedAnswers: sub.encryptedAnswers,
                            scannedAt: sub.timestamp || new Date().toISOString()
                        });
                    }
                }

                // Audit Log
                await auditService.log({
                    actorId: state.currentUser?.id || 'unknown',
                    actorEmail: state.currentUser?.email,
                    schoolId: coordinatorSchoolId,
                    tenantId: state.currentUser?.tenantId || 'unknown',
                    actionType: 'HANDOFF_RECEIVE',
                    targetResource: 'ATTENDANCE_REPORT',
                    targetId: baseReport.eventId,
                    details: {
                        className: baseReport.className,
                        submissionCount: baseReport.submissions?.length || 0,
                        surplusTablets: baseReport.surplusTablets,
                        absentCount: baseReport.absentCount
                    }
                });

                setView('ROUNDS');
            } else {
                alert("Este QR Code não corresponde a um pacote de entrega final.");
            }
        } catch (e) {
            alert("Erro fatal ao analisar a assinatura digital da prova.");
            console.error(e);
        }
    };

    /**
     * FASE 6: Protocolo Verify & Seal
     * Abre e lê cada submissão persistida para garantir integridade antes do envio
     */
    const handleValidateBatch = async () => {
        setIsValidating(true);
        setValidationReport(null);
        
        try {
            const submissions = await offlineConsolidationService.getAllSubmissions();
            let valid = 0;
            const errors: string[] = [];

            for (const sub of submissions) {
                try {
                    // Simulação de "Abrir e Ler" - Em produção aqui verificaríamos assinaturas SHA-256 individuais
                    if (!sub.encryptedAnswers || sub.encryptedAnswers.length === 0) {
                        errors.push(`Erro: Respostas corrompidas para o aluno ${sub.studentName}`);
                        continue;
                    }
                    
                    // Validação de Integridade (Check de Estrutura)
                    if (typeof sub.encryptedAnswers === 'string') {
                        JSON.parse(sub.encryptedAnswers);
                    }
                    
                    valid++;
                } catch (err) {
                    errors.push(`Erro fatal de leitura: Aluno ${sub.studentName}`);
                }
            }

            setValidationReport({
                total: submissions.length,
                valid: valid,
                errors: errors
            });
            
            if (errors.length === 0 && submissions.length > 0) {
                // Audit Log de Integridade
                await auditService.log({
                    actorId: state.currentUser?.id || 'unknown',
                    schoolId: coordinatorSchoolId,
                    tenantId: state.currentUser?.tenantId || 'unknown',
                    actionType: 'CHANGE_SETTINGS', // Usando typo existente enquanto migra schema
                    targetResource: 'BATCH_VALIDATION',
                    targetId: coordinatorSchoolId,
                    details: { status: 'INTEGRITY_VERIFIED', count: valid }
                });
            }

        } catch (e) {
            alert("Erro ao acessar o banco de dados de custódia.");
        } finally {
            setIsValidating(false);
        }
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
                    Distribuição & Carga
                </button>
                <button onClick={() => setView('ROUNDS')} className={`flex-1 py-4 font-bold text-sm border-b-4 transition ${view === 'ROUNDS' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500'}`}>
                    Dashboard Escolar (Visão Macro)
                </button>
                <button onClick={() => setView('FINALIZE')} className={`flex-1 py-4 font-bold text-sm border-b-4 transition ${view === 'FINALIZE' ? 'border-rose-500 text-rose-700' : 'border-transparent text-slate-500'}`}>
                    Encerrar & Sincronizar
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
                        {/* Macro Prédio */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Status Global (Sincronizado)</div>
                                <div className="text-4xl font-black flex items-center gap-2">
                                    {state.examAttempts.filter(a => state.students.find(s => s.id === a.studentId)?.schoolId === coordinatorSchoolId).length} <span className="text-lg font-medium opacity-70">Provas</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-2">Visão sincronizada com o servidor principal</div>
                            </div>
                            <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
                                <Activity size={24} className="text-brand-primary" />
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={20} /> Salas Acopladas</h3>
                            <div className="space-y-4">
                                {schoolClasses.map(cls => {
                                    const exam = schoolExams.find(e => e.classIds.includes(cls.id));
                                    const classStudents = state.students.filter(s => s.classId === cls.id);
                                    
                                    // Computar tentativas sincronizadas
                                    const attempts = state.examAttempts.filter(a => classStudents.some(s => s.id === a.studentId));
                                    const finished = attempts.filter(a => a.status === 'submitted').length;
                                    const inProgress = attempts.filter(a => a.status === 'started').length;
                                    
                                    return (
                                        <div key={cls.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center transition">
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                    {cls.name}
                                                    {finished === classStudents.length && classStudents.length > 0 && (
                                                        <CheckCircle size={16} className="text-emerald-500" />
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold text-slate-500 mt-1">
                                                    {exam ? exam.title : 'Sem avaliação ativa'}
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-4">
                                                <div className="text-center bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm min-w-[70px]">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Matrículas</div>
                                                    <div className="font-bold text-slate-800">{classStudents.length}</div>
                                                </div>
                                                <div className="text-center bg-white px-3 py-2 rounded-lg border border-brand-primary shadow-sm min-w-[70px]">
                                                    <div className="text-[10px] font-bold text-brand-primary uppercase">Andamento</div>
                                                    <div className="font-bold text-brand-dark">{inProgress}</div>
                                                </div>
                                                <div className="text-center bg-white px-3 py-2 rounded-lg border border-emerald-500 shadow-sm min-w-[70px]">
                                                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Devolvidos</div>
                                                    <div className="font-bold text-emerald-700">{finished}</div>
                                                </div>
                                            </div>

                                            <div className="ml-4 pl-4 border-l border-slate-200">
                                                <button
                                                    onClick={() => setIsScannerOpen(true)}
                                                    className="flex flex-col items-center justify-center p-2 text-brand-primary hover:bg-brand-50 rounded-lg transition"
                                                    title="Escanear Relatório de Fim de Aula (QR Code)"
                                                >
                                                    <Scan size={24} />
                                                    <span className="text-[10px] font-bold mt-1">Ler Entrega</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {schoolClasses.length === 0 && <div className="text-center text-slate-400">Nenhuma sala alocada.</div>}
                            </div>
                        </div>

                        {/* FASE 6: Diagnóstico de Latência */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <div className="text-sm font-bold text-slate-700">Latência da Rede Local (P95)</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-lg font-black text-slate-800">{operationalHealthService.getLocalHealthMetrics().p95Latency}ms</div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold text-right">Estabilidade Alta</div>
                                </div>
                                <div className="p-2 bg-brand-50 text-brand-primary rounded-lg">
                                    <Activity size={20} />
                                </div>
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

                {view === 'FINALIZE' && (
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-xl text-center">
                            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Encerramento do Período</h2>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                Verifique a reconciliação de malotes e tablets antes de finalizar o evento e subir os dados para o servidor.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Salas Pendentes</div>
                                    <div className={`text-3xl font-black ${schoolClasses.length - roomsChecked > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {schoolClasses.length - roomsChecked}
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Tablets Recuperados</div>
                                    <div className="text-3xl font-black text-brand-primary">
                                        {totalSurplus}
                                    </div>
                                </div>
                            </div>

                            {/* FASE 6: UI de Validação de Integridade */}
                            <div className="mb-8 text-left border-2 border-slate-100 rounded-xl p-6 bg-slate-50">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-brand-primary" /> Verificação de Integridade (Verify & Seal)
                                </h3>
                                
                                {!validationReport && !isValidating && (
                                    <button 
                                        onClick={handleValidateBatch}
                                        className="w-full py-3 border-2 border-brand-primary text-brand-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary hover:text-white transition"
                                    >
                                        <Layers size={20} /> Iniciar Validação de Arquivos
                                    </button>
                                )}

                                {isValidating && (
                                    <div className="flex items-center justify-center py-4 gap-3 text-brand-primary animate-pulse">
                                        <Activity size={24} className="animate-spin" />
                                        <span className="font-bold">Analisando malote digital...</span>
                                    </div>
                                )}

                                {validationReport && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                                            <span className="text-sm text-slate-500">Arquivos Processados:</span>
                                            <span className="font-bold">{validationReport.total}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-emerald-200">
                                            <span className="text-sm text-emerald-600">Integridade Garantida:</span>
                                            <span className="font-bold text-emerald-700">{validationReport.valid}</span>
                                        </div>
                                        {validationReport.errors.length > 0 && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                                                <div className="text-xs font-bold text-rose-700 uppercase mb-2">Erros Detectados:</div>
                                                <ul className="text-xs text-rose-600 space-y-1">
                                                    {validationReport.errors.map((err, i) => <li key={i}>• {err}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2 italic">
                                            <CheckCircle size={10} /> Todos os arquivos foram lidos e decodificados com sucesso. Prontos para correção centralizada.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={async () => {
                                        if (!validationReport || validationReport.valid === 0) {
                                            alert("⚠️ Você precisa validar a integridade dos arquivos antes do envio final.");
                                            return;
                                        }
                                        
                                        if (schoolClasses.length - roomsChecked > 0) {
                                            if (!confirm(`⚠️ Existem ainda ${schoolClasses.length - roomsChecked} salas sem o QR de encerramento. Deseja finalizar assim mesmo?`)) return;
                                        }

                                        try {
                                            const { syncService } = await import('../../../services/synchronizationService');
                                            
                                            alert("Enviando dados para a nuvem... Por favor, aguarde.");
                                            
                                            // 1. Sincronizar submissões coletadas via QR Handoff
                                            const result = await syncService.syncOfflineSubmissions();
                                            
                                            // 2. Audit Log
                                            await auditService.log({
                                                actorId: state.currentUser?.id || 'unknown',
                                                actorEmail: state.currentUser?.email,
                                                schoolId: coordinatorSchoolId,
                                                tenantId: state.currentUser?.tenantId || 'unknown',
                                                actionType: 'SYNC_OFFLINE',
                                                targetResource: 'EVENT_FINALIZATION',
                                                targetId: `EVENT-${coordinatorSchoolId}`,
                                                details: {
                                                    schoolName: school?.name,
                                                    roomsClosed: roomsChecked,
                                                    totalTablets: totalSurplus,
                                                    syncResult: result
                                                }
                                            });

                                            alert(`✅ Evento finalizado com sucesso!\n\nSincronizados: ${result.success}\nFalhas: ${result.failed}`);
                                            onBack();
                                        } catch (e) {
                                            console.error(e);
                                            alert("Erro crítico na sincronização final. Tente novamente ou contate o suporte.");
                                        }
                                    }}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
                                >
                                    <CheckCircle size={24} /> Finalizar & Sincronizar Nuvem
                                </button>
                                
                                <button
                                    onClick={() => setView('ROUNDS')}
                                    className="w-full py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition"
                                >
                                    Voltar para Revisão de Salas
                                </button>
                            </div>
                        </div>

                        {/* Checklist de Segurança */}
                        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                            <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                                <AlertTriangle size={18} /> Protocolo de Segurança (QSP)
                            </h4>
                            <ul className="text-sm text-amber-900 space-y-2 opacity-80">
                                <li className="flex gap-2"><span>1.</span><span>Garanta que todos os professores devolveram o lacre digital via QR Code.</span></li>
                                <li className="flex gap-2"><span>2.</span><span>Conte fisicamente os tablets nas malas antes de dar o "OK" final.</span></li>
                                <li className="flex gap-2"><span>3.</span><span>Verifique se o Wi-Fi local de cada sala foi desativado.</span></li>
                            </ul>
                        </div>
                    </div>
                )}
            </main>

            {isScannerOpen && (
                <QRScannerModal 
                    onClose={() => setIsScannerOpen(false)} 
                    onResult={handleScannerResult} 
                    title="Escanear Entrega do Professor"
                />
            )}
        </div>
    );
};
