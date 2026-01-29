
import React, { useState } from 'react';
import { User, Camera, Mail, Brain, Activity, Smile, Zap, Lock, Play, CheckCircle, BarChart2, Stethoscope, FileText, Printer } from 'lucide-react';
import { AppState, User as UserType, UserProfileExtended, AssessmentType, AssessmentResult, UserRole } from '../../types';
import { AssessmentRunner } from './AssessmentRunner';
import { ScreeningReportModal } from '../neuro-screening/ScreeningReportModal';
import { uuidv4 } from '../../utils/helpers';

interface UserProfileViewProps {
    state: AppState;
    user: UserType;
    onUpdateProfile: (p: UserProfileExtended) => void;
}

import { useAppStore } from '../../store/useAppStore';

export const UserProfileView = () => {
    const state = useAppStore();
    const { currentUser: user, updateUserProfile: onUpdateProfile } = state;

    if (!user) return null;
    // Buscar perfil estendido ou criar um vazio se não existir
    const userProfile: UserProfileExtended = state.userProfiles?.find(p => p.userId === user.id) || {
        userId: user.id,
        avatarUrl: '',
        bio: '',
        assessments: [],
        owlCoins: 0,
        badges: []
    };

    const [activeTest, setActiveTest] = useState<AssessmentType | null>(null);
    const [selectedReport, setSelectedReport] = useState<AssessmentResult | null>(null);

    const isAdminOrManager = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.TENANT_ADMIN || user.role === UserRole.DIRETOR;

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newProfile = { ...userProfile, avatarUrl: reader.result as string };
                onUpdateProfile(newProfile);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTestComplete = (resultData: any) => {
        const newAssessment: AssessmentResult = {
            id: uuidv4(),
            ...resultData
        };

        // Remove previous result of same type if exists to update
        const otherAssessments = userProfile.assessments.filter(a => a.type !== resultData.type);

        const newProfile = {
            ...userProfile,
            assessments: [...otherAssessments, newAssessment]
        };

        onUpdateProfile(newProfile);
        setActiveTest(null);
    };

    const getAssessmentIcon = (type: AssessmentType) => {
        switch (type) {
            case AssessmentType.DISC: return <Activity size={32} className="text-blue-600" />;
            case AssessmentType.LEARNING_STYLE: return <Brain size={32} className="text-purple-600" />;
            case AssessmentType.POSITIVE_PSYCH: return <Zap size={32} className="text-amber-500" />;
            case AssessmentType.TEMPERAMENT: return <Smile size={32} className="text-emerald-600" />;
            case AssessmentType.TDAH_SCREENING: return <Activity size={32} className="text-rose-600" />;
            case AssessmentType.AUTISM_SCREENING: return <Stethoscope size={32} className="text-indigo-600" />;
            default: return <Activity size={32} />;
        }
    };

    const getAssessmentDescription = (type: AssessmentType) => {
        switch (type) {
            case AssessmentType.DISC: return "Descubra seu estilo de comportamento, liderança e comunicação.";
            case AssessmentType.LEARNING_STYLE: return "Entenda como seu cérebro absorve melhor novas informações.";
            case AssessmentType.POSITIVE_PSYCH: return "Identifique suas forças de caráter e virtudes principais.";
            case AssessmentType.TEMPERAMENT: return "Analise sua natureza emocional e reações instintivas.";
            case AssessmentType.TDAH_SCREENING: return "Triagem de indicativos de atenção e hiperatividade (Uso Clínico).";
            case AssessmentType.AUTISM_SCREENING: return "Rastreio de sinais de espectro autista e interação social.";
            default: return "Avaliação comportamental.";
        }
    };

    // Render Test Runner if active
    if (activeTest) {
        return (
            <div className="max-w-5xl mx-auto py-4 animate-in zoom-in-95">
                <AssessmentRunner
                    type={activeTest}
                    userName={user.name}
                    onComplete={handleTestComplete}
                    onCancel={() => setActiveTest(null)}
                />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-0 flex flex-col relative overflow-hidden print:hidden">
                {/* Banner Background */}
                <div className="h-40 bg-gradient-to-r from-[#0f1d2e] to-[#0077b6] relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                </div>

                <div className="px-8 pb-8 flex flex-col md:flex-row items-end md:items-center gap-6 -mt-12 relative z-10">
                    {/* Avatar */}
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center overflow-hidden relative group flex-shrink-0">
                        {userProfile.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={64} className="text-slate-300" />
                        )}
                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white font-bold text-xs flex-col gap-1">
                            <Camera size={20} />
                            <span>Alterar Foto</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left pt-2 md:pt-12 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900">{user.name}</h1>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-600 mt-1 text-sm font-medium">
                                    <Mail size={14} /> {user.email}
                                    <span className="text-slate-300">•</span>
                                    <span className="bg-brand-primary text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide shadow-sm">{user.role}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-center md:justify-end">
                                <div className="text-center px-4 border-r border-slate-200">
                                    <div className="text-2xl font-black text-slate-800">{userProfile.assessments.length}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Testes</div>
                                </div>
                                <div className="text-center px-4">
                                    <div className="text-2xl font-black text-emerald-600">100%</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Completo</div>
                                </div>
                            </div>
                        </div>
                        {userProfile.bio && <p className="mt-4 text-slate-600 max-w-2xl leading-relaxed border-t pt-3 border-slate-100">{userProfile.bio}</p>}
                    </div>
                </div>
            </div>

            {/* Assessments Grid */}
            <div className="print:hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-light rounded-lg text-brand-primary"><BarChart2 size={24} /></div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Central de Inteligência Comportamental</h2>
                        <p className="text-sm text-slate-500">Realize os testes abaixo para descobrir seus pontos fortes e áreas de desenvolvimento.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        AssessmentType.DISC,
                        AssessmentType.LEARNING_STYLE,
                        AssessmentType.POSITIVE_PSYCH,
                        AssessmentType.TEMPERAMENT
                    ].map((type) => {
                        const result = userProfile.assessments.find(a => a.type === type);

                        return (
                            <div key={type} className={`bg-white rounded-xl border p-6 transition-all duration-300 hover:shadow-lg group relative overflow-hidden ${result ? 'border-emerald-200' : 'border-slate-200 hover:border-brand-primary'}`}>
                                {result && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>}

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-50 rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                            {getAssessmentIcon(type)}
                                        </div>
                                        {result ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                                                <CheckCircle size={14} /> Concluído
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                                Pendente
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 mb-2">{type.replace(/_/g, ' ')}</h3>
                                    <p className="text-sm text-slate-600 mb-6 min-h-[40px] leading-relaxed">{getAssessmentDescription(type)}</p>

                                    {result ? (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Seu Resultado</div>
                                                <div className="text-slate-900 font-black text-2xl">{result.resultType}</div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedReport(result)}
                                                className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition text-sm flex items-center justify-center gap-2"
                                            >
                                                <Lock size={16} className="text-slate-400" /> Ver Relatório Completo
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setActiveTest(type)}
                                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-brand-primary shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
                                        >
                                            <Play size={20} fill="white" /> Iniciar Avaliação
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reusable Report Modal */}
            {selectedReport && (
                <ScreeningReportModal
                    report={selectedReport}
                    studentName={user.name}
                    studentId={user.id}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </div>
    );
};
