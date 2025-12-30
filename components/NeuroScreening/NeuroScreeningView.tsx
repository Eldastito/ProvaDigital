import React, { useState } from 'react';
// @-fix: Added 'Calendar' to the lucide-react imports.
import { Stethoscope, Users, Search, Play, FileText, AlertTriangle, CheckCircle, Brain, Activity, X, Loader2, Calendar } from 'lucide-react';
import { AppState, AssessmentType, UserProfileExtended, AssessmentResult, Student, SchoolClass, UserRole } from '../../types';
import { AssessmentRunner } from '../Profile/AssessmentRunner';
import { ScreeningReportModal } from './ScreeningReportModal';
import { uuidv4 } from '../../utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { fetchStudents, fetchUserProfiles, fetchClasses } from '../../services/supabaseClient';

interface NeuroScreeningViewProps {
    state: AppState;
    onUpdateProfile: (p: UserProfileExtended) => void;
}

export const NeuroScreeningView = ({ state, onUpdateProfile }: NeuroScreeningViewProps) => {
    const { currentUser } = state;
    const isParent = currentUser?.role === UserRole.PAIS;

    const { data: allStudents, isLoading: loadingStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allUserProfiles, isLoading: loadingProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });
    const { data: allClasses } = useQuery<SchoolClass[]>({ queryKey: ['classes'], queryFn: fetchClasses, initialData: [] });

    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTest, setActiveTest] = useState<AssessmentType | null>(null);
    const [selectedReport, setSelectedReport] = useState<AssessmentResult | null>(null);

    // FILTRO CRÍTICO: Se for pai, só vê os filhos. Se for staff, vê todos (filtrado por busca).
    const filteredStudents = (allStudents || []).filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.registrationNumber.includes(searchTerm);
        if (isParent) {
            return currentUser?.childrenIds?.includes(s.id) && matchesSearch;
        }
        return matchesSearch;
    });

    const selectedStudent = (allStudents || []).find(s => s.id === selectedStudentId);
    const studentProfile = selectedStudentId ? (allUserProfiles || []).find(p => p.userId === selectedStudentId) : null;

    // Garante que o perfil seja inicializado se não existir no banco
    const safeProfile: UserProfileExtended = studentProfile || {
        userId: selectedStudentId || '',
        avatarUrl: '',
        bio: '',
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

    if (loadingStudents || loadingProfiles) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-400">
                <Loader2 size={48} className="animate-spin mb-4 text-indigo-500"/>
                <p className="font-black uppercase tracking-widest text-sm">Carregando Prontuários Clínicos...</p>
            </div>
        );
    }

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
        <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-brand-dark flex items-center gap-3 tracking-tighter uppercase italic">
                        <Stethoscope size={32} className="text-rose-600"/> 
                        Resultados Clínicos
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Acompanhamento de TDAH, TEA e Dificuldades de Aprendizagem.</p>
                </div>
            </div>

            <div className="flex flex-1 gap-8 overflow-hidden">
                {/* Left: Student List */}
                <div className="w-1/3 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                            {isParent ? 'Seus Filhos' : 'Busca de Estudante'}
                        </h3>
                        {!isParent && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                <input 
                                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-50 rounded-xl text-sm font-bold focus:border-indigo-600 transition-all outline-none"
                                    placeholder="Nome ou Matrícula..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                        {filteredStudents.map(student => {
                            const profile = (allUserProfiles || []).find(p => p.userId === student.id);
                            const hasAlert = profile?.assessments && profile.assessments.length > 0;
                            
                            return (
                                <div 
                                    key={student.id}
                                    onClick={() => setSelectedStudentId(student.id)}
                                    className={`p-5 cursor-pointer hover:bg-slate-50 transition flex justify-between items-center ${selectedStudentId === student.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'bg-white'}`}
                                >
                                    <div>
                                        <div className="font-black text-slate-800">{student.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">RM: {student.registrationNumber}</div>
                                    </div>
                                    {hasAlert && <div className="p-1.5 bg-rose-50 rounded-lg"><Activity size={14} className="text-rose-500 animate-pulse"/></div>}
                                </div>
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <div className="p-10 text-center text-slate-300 flex flex-col items-center">
                                <Search size={32} className="mb-2 opacity-20"/>
                                <p className="text-[10px] font-black uppercase">Nenhum aluno encontrado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Assessment Panel */}
                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
                    {selectedStudent ? (
                        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-indigo-600 shadow-sm border border-slate-100">
                                        {selectedStudent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedStudent.name}</h2>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                            Turma: {allClasses?.find(c=>c.id===selectedStudent.classId)?.name || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                                    <FileText size={16} className="text-indigo-600"/>
                                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{safeProfile.assessments.length} Laudos</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-6">
                                    <ScreeningCard 
                                        type={AssessmentType.TDAH_SCREENING}
                                        title="Triagem TDAH & Funções Executivas"
                                        desc="Análise baseada em TDE e critérios DSM-5 para desatenção e hiperatividade."
                                        profile={safeProfile}
                                        onRun={() => handleRunTest(AssessmentType.TDAH_SCREENING)}
                                        onViewReport={(result) => setSelectedReport(result)}
                                        isParent={isParent}
                                    />

                                    <ScreeningCard 
                                        type={AssessmentType.AUTISM_SCREENING}
                                        title="Rastreio de Espectro Autista (TEA)"
                                        desc="Investigação de pragmática, rigidez cognitiva e integração social."
                                        profile={safeProfile}
                                        onRun={() => handleRunTest(AssessmentType.AUTISM_SCREENING)}
                                        onViewReport={(result) => setSelectedReport(result)}
                                        isParent={isParent}
                                    />

                                    <ScreeningCard 
                                        type={AssessmentType.LEARNING_SCREENING}
                                        title="Dificuldades de Aprendizagem"
                                        desc="Foco em dislexia, discalculia e processamento fonológico."
                                        profile={safeProfile}
                                        onRun={() => handleRunTest(AssessmentType.LEARNING_SCREENING)}
                                        onViewReport={(result) => setSelectedReport(result)}
                                        isParent={isParent}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                            <Users size={80} strokeWidth={1} className="mb-4 opacity-10"/>
                            <h3 className="text-lg font-black uppercase tracking-[0.2em] text-slate-400">Seleção de Prontuário</h3>
                            <p className="text-sm font-medium mt-2">Escolha um estudante na lista para gerenciar triagens.</p>
                        </div>
                    )}
                </div>
            </div>

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

const ScreeningCard = ({ type, title, desc, profile, onRun, onViewReport, isParent }: any) => {
    const result = (profile.assessments || []).find((a: any) => a.type === type);
    
    return (
        <div className={`p-6 rounded-3xl border-2 transition-all ${result ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-50 hover:border-slate-200'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-2xl flex-shrink-0 ${result ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                        {result ? <CheckCircle size={28}/> : <Brain size={28}/>}
                    </div>
                    <div>
                        <h4 className="font-black text-lg text-slate-800 tracking-tight leading-none mb-2">{title}</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xl">{desc}</p>
                        {result && (
                            <div className="mt-3 text-[9px] font-black text-emerald-600 bg-white inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                                <Calendar size={12}/> {new Date(result.date).toLocaleDateString('pt-BR')}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="w-full md:w-auto flex flex-col gap-2">
                    {result ? (
                        <button 
                            onClick={() => onViewReport(result)}
                            className="w-full md:w-auto px-6 py-3 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition shadow-sm flex items-center justify-center gap-2"
                        >
                            <FileText size={16}/> Visualizar Laudo
                        </button>
                    ) : (
                        !isParent ? (
                            <button onClick={onRun} className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 shadow-lg flex items-center justify-center gap-2 transition-all">
                                <Play size={16} fill="white"/> Iniciar Teste
                            </button>
                        ) : (
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">Aguardando Avaliação</div>
                        )
                    )}
                    {result && !isParent && (
                        <button onClick={onRun} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors text-center">
                            Refazer Triagem
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}