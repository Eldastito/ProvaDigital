import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AnalyticsService } from '../../services/analyticsService';
import { Users, FileText, Mic, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { generateAssessmentReport, predictStudentOutcome, generateCouncilMinutes } from '../../services/geminiService';

export const ClassCouncilView: React.FC = () => {
    const state = useAppStore();
    const analytics = useMemo(() => new AnalyticsService(state), [state]);

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [loadingAI, setLoadingAI] = useState(false);

    // --- FILTERS ---
    const availableClasses = state.classes;
    const classStudents = useMemo(() => {
        if (!selectedClassId) return [];
        return state.users.filter(u => u.role === 'STUDENT' && u.classId === selectedClassId);
    }, [selectedClassId, state.users]);

    // --- ACTIONS ---
    const handleAnalyzeStudent = async (studentId: string) => {
        setLoadingAI(true);
        setSelectedStudentId(studentId);

        // Mock data gathering - In production, pull from gradebook
        const historyMock = {
            grades: [7.5, 8.0, 6.5],
            attendance: 92,
            behavior: "Participativo, mas conversa muito."
        };

        try {
            const prediction = await predictStudentOutcome(JSON.stringify(historyMock));
            setAiAnalysis(prediction);
        } catch (e) {
            console.error(e);
            alert("Erro ao analisar aluno.");
        } finally {
            setLoadingAI(false);
        }
    };

    // --- SPEECH RECOGNITION (WEB API) ---
    const startRecording = () => {
        if (!('webkitSpeechRecognition' in window)) {
            return alert("Seu navegador não suporta transcrição de áudio.");
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);

        recognition.onresult = (event: any) => {
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                }
            }
            if (final) setTranscription(prev => prev + ' ' + final);
        };

        recognition.start();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-brand-primary" /> Conselho de Classe Digital
                    </h1>
                    <p className="text-slate-500">Assistente de tomada de decisão com IA e Transcrição</p>
                </div>

                <select
                    className="p-2 border rounded-lg bg-white shadow-sm"
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                >
                    <option value="">Selecione uma Turma...</option>
                    {availableClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.series})</option>
                    ))}
                </select>
            </header>

            {selectedClassId ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT: Student List */}
                    <div className="bg-white p-4 rounded-xl shadow border border-slate-200 h-[600px] overflow-y-auto">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Users size={18} /> Alunos ({classStudents.length})
                        </h3>
                        <div className="space-y-2">
                            {classStudents.map(student => (
                                <div
                                    key={student.id}
                                    onClick={() => handleAnalyzeStudent(student.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition hover:bg-slate-50 ${selectedStudentId === student.id ? 'border-brand-primary bg-indigo-50' : 'border-slate-100'} `}
                                >
                                    <div className="font-medium text-slate-800">{student.name}</div>
                                    <div className="text-xs text-slate-400">Clique para analisar</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MIDDLE: AI Analysis */}
                    <div className="lg:col-span-2 space-y-6">
                        {selectedStudentId && aiAnalysis ? (
                            <div className="bg-white p-6 rounded-xl shadow border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Dossiê do Aluno</h2>
                                        <div className="flex gap-2 mt-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${aiAnalysis.trend === 'UP' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} `}>
                                                Tendência: {aiAnalysis.trend === 'UP' ? '📈 Evolução' : '📉 Queda'}
                                            </span>
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700">
                                                Risco Evasão: {aiAnalysis.evasionRiskProbability}%
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-brand-primary hover:underline text-sm font-bold">
                                        Ver Histórico Completo
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                            <CheckCircle size={16} className="text-emerald-500" /> Parecer da IA
                                        </h4>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {aiAnalysis.aiInsight}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                        <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                                            <AlertTriangle size={16} /> Intervenção Sugerida
                                        </h4>
                                        <p className="text-amber-900 text-sm">
                                            {aiAnalysis.recommendedIntervention}
                                        </p>
                                    </div>
                                </div>

                                {/* TRANSCRIPTION ZONE */}
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                            <Mic size={18} className={isRecording ? "text-red-500 animate-pulse" : "text-slate-400"} />
                                            Transcrição do Conselho
                                        </h3>
                                        <button
                                            onClick={startRecording}
                                            className={`px-4 py-2 rounded-full text-sm font-bold transition flex items-center gap-2 ${isRecording ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} `}
                                        >
                                            {isRecording ? '🛑 Parar Gravação' : '🎙️ Iniciar Gravação'}
                                        </button>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 min-h-[100px] text-sm text-slate-600 italic">
                                        {transcription || "O áudio capturado aparecerá aqui..."}
                                    </div>

                                    {transcription && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={handleGenerateMinutes}
                                                disabled={loadingAI}
                                                className="btn-primary flex items-center gap-2"
                                            >
                                                {loadingAI ? 'Gerando...' : <><FileText size={16} /> Gerar Ata Formal com IA</>}
                                            </button>
                                        </div>
                                    )}

                                    {aiAnalysis?.minutes && (
                                        <div className="mt-6 p-6 bg-white border border-slate-200 rounded-xl shadow-sm animate-in fade-in">
                                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                                <h3 className="font-bold text-lg text-slate-800">Ata de Deliberação</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${aiAnalysis.minutes.decision === 'APROVADO' ? 'bg-green-100 text-green-700' :
                                                    aiAnalysis.minutes.decision === 'RETIDO' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {aiAnalysis.minutes.decision}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm mb-4 text-justify leading-relaxed">
                                                {aiAnalysis.minutes.summary}
                                            </p>

                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <strong className="text-xs text-slate-500 uppercase block mb-2">Encaminhamentos:</strong>
                                                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                                                    {aiAnalysis.minutes.actions.map((act: string, idx: number) => (
                                                        <li key={idx}>{act}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                {loadingAI ? (
                                    <div className="animate-spin text-4xl">⏳</div>
                                ) : (
                                    <>
                                        <Users size={48} className="mb-4 opacity-20" />
                                        <p>Selecione um aluno para iniciar a análise</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Selecione uma turma acima para iniciar o Conselho.</p>
                </div>
            )}
        </div>
    );
};
