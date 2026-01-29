
import React, { useState } from 'react';
import { Stethoscope, Users, Search, Play, FileText, AlertTriangle, CheckCircle, Brain, Activity } from 'lucide-react';
import { AssessmentType, UserProfileExtended, AssessmentResult } from '../../types';
import { AssessmentRunner } from '../profile/AssessmentRunner';
import { ScreeningReportModal } from './ScreeningReportModal';
import { uuidv4 } from '../../utils/helpers';
import { useAppStore } from '../../store/useAppStore';

export const NeuroScreeningView = () => {
    const state = useAppStore();
    const { updateUserProfile: onUpdateProfile } = state;
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTest, setActiveTest] = useState<AssessmentType | null>(null);

    // State para visualizar o relatório (Laudo)
    const [selectedReport, setSelectedReport] = useState<AssessmentResult | null>(null);

    const filteredStudents = state.students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.registrationNumber.includes(searchTerm)
    );

    const selectedStudent = state.students.find(s => s.id === selectedStudentId);
    const studentProfile = selectedStudentId ? state.userProfiles?.find(p => p.userId === selectedStudentId) : null;

    // Se não existir perfil, cria objeto mock para não quebrar
    const safeProfile: UserProfileExtended = studentProfile || {
        userId: selectedStudentId || '',
        assessments: [],
        owlCoins: 0,
        badges: []
    };

    const handleRunTest = (type: AssessmentType) => {
        setActiveTest(type);
    };

    const handleTestComplete = (resultData: any) => {
        const newAssessment: AssessmentResult = {
            id: uuidv4(),
            ...resultData
        };

        const otherAssessments = safeProfile.assessments.filter(a => a.type !== resultData.type);

        const newProfile = {
            ...safeProfile,
            assessments: [...otherAssessments, newAssessment]
        };

        onUpdateProfile(newProfile);
        setActiveTest(null);
    };

    // 1. RENDERIZADOR DO TESTE (Se estiver rodando)
    if (activeTest && selectedStudent) {
        return (
            <div className="py-4 animate-in zoom-in-95 h-full">
                <AssessmentRunner
                    type={activeTest}
                    userName={selectedStudent.name}
                    onComplete={handleTestComplete}
                    onCancel={() => setActiveTest(null)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 flex-shrink-0 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark flex items-center gap-3">
                        <Stethoscope size={32} className="text-rose-600" />
                        Triagem Neuropsicopedagógica
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Avaliação clínica, rastreio de TDAH, TEA e Dificuldades de Aprendizagem.</p>
                </div>
            </div>

            <div className="flex flex-1 gap-8 overflow-hidden print:hidden">
                {/* Left: Student List */}
                <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="p-4 border-b bg-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                                placeholder="Buscar aluno..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredStudents.map(student => {
                            const profile = state.userProfiles.find(p => p.userId === student.id);
                            const hasAlert = profile?.assessments.some(a => a.type.includes('SCREENING'));

                            return (
                                <div
                                    key={student.id}
                                    onClick={() => setSelectedStudentId(student.id)}
                                    className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition flex justify-between items-center ${selectedStudentId === student.id ? 'bg-sky-50 border-l-4 border-l-brand-primary' : ''}`}
                                >
                                    <div>
                                        <div className="font-bold text-slate-800">{student.name}</div>
                                        <div className="text-xs text-slate-500">{student.registrationNumber}</div>
                                    </div>
                                    {hasAlert && <Activity size={16} className="text-rose-500" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Assessment Panel */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {selectedStudent ? (
                        <div className="flex-1 flex flex-col">
                            {/* Student Header */}
                            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-xl text-slate-600">
                                        {selectedStudent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h2>
                                        <p className="text-sm text-slate-500">Matrícula: {selectedStudent.registrationNumber} • Turma: {state.classes.find(c => c.id === selectedStudent.classId)?.name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-sm tracking-wider">
                                    <Brain size={18} className="text-brand-primary" /> Instrumentos Disponíveis
                                </h3>

                                <div className="grid grid-cols-1 gap-6">
                                    {/* TDAH Card */}
                                    <ScreeningCard
                                        type={AssessmentType.TDAH_SCREENING}
                                        title="Triagem TDAH & Funções Executivas"
                                        desc="Avalia desatenção, hiperatividade, memória operacional (ETNMO) e planejamento (Torre de Londres)."
                                        profile={safeProfile}
                                        onRun={() => handleRunTest(AssessmentType.TDAH_SCREENING)}
                                        onViewReport={(result) => setSelectedReport(result)}
                                    />

                                    {/* TEA Card */}
                                    <ScreeningCard
                                        type={AssessmentType.AUTISM_SCREENING}
                                        title="Rastreio de Espectro Autista (TEA)"
                                        desc="Foca em interação social, comunicação pragmática, rigidez cognitiva e processamento sensorial."
                                        profile={safeProfile}
                                        onRun={() => handleRunTest(AssessmentType.AUTISM_SCREENING)}
                                        onViewReport={(result) => setSelectedReport(result)}
                                    />

                                    {/* Learning Card */}
                                    <ScreeningCard
                                        type={AssessmentType.LEARNING_SCREENING}
                                        title="Habilidades de Aprendizagem (TDE/TDF)"
                                        desc="Investiga leitura, escrita, matemática e consciência fonológica para identificar dislexia/discalculia."
                                        profile={safeProfile}
                                        onRun={() => handleRunTest(AssessmentType.LEARNING_SCREENING)}
                                        onViewReport={(result) => setSelectedReport(result)}
                                    />
                                </div>

                                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-3">
                                    <AlertTriangle size={20} className="flex-shrink-0" />
                                    <div>
                                        <strong>Nota sobre Sessões:</strong> Estes instrumentos são extensos (30 itens). Recomenda-se aplicá-los em sessões separadas ou observar o aluno ao longo de uma semana antes de preencher. O sistema processará as respostas instantaneamente via IA.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Users size={64} className="mb-4 opacity-20" />
                            <p>Selecione um aluno na lista ao lado para iniciar a triagem.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE RELATÓRIO REUTILIZÁVEL */}
            {selectedReport && selectedStudent && (
                <ScreeningReportModal
                    report={selectedReport}
                    studentName={selectedStudent.name}
                    studentId={selectedStudent.registrationNumber}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </div>
    );
};

// Componente do Cartão de Triagem
const ScreeningCard = ({ type, title, desc, profile, onRun, onViewReport }: { type: AssessmentType, title: string, desc: string, profile: UserProfileExtended, onRun: () => void, onViewReport: (r: AssessmentResult) => void }) => {
    const result = profile.assessments.find(a => a.type === type);

    return (
        <div className={`p-6 rounded-xl border-2 transition-all ${result ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-brand-primary'}`}>
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${result ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {result ? <CheckCircle size={24} /> : <Activity size={24} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-800">{title}</h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-xl">{desc}</p>
                        {result && (
                            <div className="mt-3 text-xs font-bold text-emerald-700 bg-white inline-block px-3 py-1 rounded border border-emerald-100">
                                Relatório Gerado em {new Date(result.date).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>

                {result ? (
                    <button
                        onClick={() => onViewReport(result)}
                        className="px-4 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-lg font-bold text-sm hover:bg-emerald-50 flex items-center gap-2"
                    >
                        <FileText size={16} /> Ver Laudo
                    </button>
                ) : (
                    <button onClick={onRun} className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-brand-primary shadow-lg flex items-center gap-2">
                        <Play size={16} /> Iniciar Triagem
                    </button>
                )}
            </div>

            {result && (
                <div className="mt-4 pt-4 border-t border-emerald-200/50">
                    <p className="text-sm text-slate-700 italic line-clamp-2">"{result.report.substring(0, 150)}..."</p>
                </div>
            )}
        </div>
    );
}
