
import React, { useState } from 'react';
import { User, Camera, Mail, Brain, Activity, Smile, Zap, Lock, Play, CheckCircle, BarChart2, Stethoscope, FileText, Printer, Trophy, Medal, Star, Target, Shield, BookOpen } from 'lucide-react';
import { AppState, User as UserType, UserProfileExtended, AssessmentType, AssessmentResult, UserRole } from '../../types';
import { AssessmentRunner } from './AssessmentRunner';
import { ScreeningReportModal } from '../NeuroScreening/ScreeningReportModal';
import { uuidv4 } from '../../utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { fetchUserProfiles } from '../../services/supabaseClient';

interface UserProfileViewProps {
    state: AppState;
    user: UserType;
    onUpdateProfile: (p: UserProfileExtended) => void;
    setView: (v: string) => void;
}

export const UserProfileView = ({ state, user, onUpdateProfile, setView }: UserProfileViewProps) => {
    const { data: allUserProfiles, isLoading: profilesLoading } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });

    const userProfile: UserProfileExtended = allUserProfiles?.find(p => p.userId === user.id) || {
        userId: user.id,
        avatarUrl: '',
        bio: '',
        assessments: [],
        owlCoins: 0,
        badges: []
    };

    const [activeTest, setActiveTest] = useState<AssessmentType | null>(null);
    const [selectedReport, setSelectedReport] = useState<AssessmentResult | null>(null);

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
        const otherAssessments = userProfile.assessments.filter(a => a.type !== resultData.type);
        const newProfile = {
            ...userProfile,
            assessments: [...otherAssessments, newAssessment]
        };
        onUpdateProfile(newProfile);
        setActiveTest(null);
    };

    if (profilesLoading) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Carregando seus dados...</div>;

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
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in">
            {/* Header: RPG Style Character Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-0 flex flex-col relative overflow-hidden">
                <div className="h-48 bg-[#0f1d2e] relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute top-6 right-8 bg-amber-400 text-slate-900 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg">
                        Membro Elite
                    </div>
                </div>
                
                <div className="px-10 pb-10 flex flex-col md:flex-row items-end md:items-center gap-8 -mt-16 relative z-10">
                    <div className="w-40 h-40 rounded-[2.5rem] border-8 border-white shadow-2xl bg-slate-100 flex items-center justify-center overflow-hidden relative group flex-shrink-0 rotate-2">
                        {userProfile.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-6xl font-black">
                                {user.name.charAt(0)}
                            </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white font-bold text-xs flex-col gap-1">
                            <Camera size={20} />
                            <span>Trocar Skin</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                                <p className="text-slate-500 font-bold mt-1">@{user.nickname || 'explorador_ep'}</p>
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                        <Medal size={14} className="text-indigo-600"/>
                                        <span className="text-[10px] font-black text-indigo-700 uppercase">{user.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
                                        <Star size={14} className="text-amber-600" fill="currentColor"/>
                                        <span className="text-[10px] font-black text-amber-700 uppercase">{userProfile.owlCoins} Moedas</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center min-w-[100px]">
                                    <div className="text-2xl font-black text-slate-800">{userProfile.badges.length}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase">Insígnias</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center min-w-[100px]">
                                    <div className="text-2xl font-black text-emerald-600">A+</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase">Reputação</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lado Esquerdo: Conquistas e Medalhas */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Status de Atributos (Gamificado) */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                            <BarChart2 size={24} className="text-indigo-600"/> Meus Atributos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <AttributeBar label="Humanas" value={85} color="bg-rose-500" />
                                <AttributeBar label="Exatas" value={65} color="bg-blue-500" />
                                <AttributeBar label="Natureza" value={72} color="bg-emerald-500" />
                                <AttributeBar label="Linguagens" value={92} color="bg-amber-500" />
                            </div>
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-md mb-4">
                                    <Zap size={40} fill="currentColor"/>
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-xs mb-1">Classe Especialista</h4>
                                <p className="text-xs text-slate-500 font-medium">Seu maior poder está em <strong>Linguagens</strong>. Use isso para ajudar seus colegas na Arena!</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                            <Trophy size={24} className="text-amber-500"/> Minhas Medalhas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userProfile.academicAchievements?.map(ach => (
                                <div key={ach.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-5 hover:border-indigo-500 transition-colors group">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                        <Trophy size={32} fill="currentColor"/>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{ach.type}</div>
                                        <div className="font-black text-slate-800 leading-tight">{ach.title}</div>
                                        <div className="text-[10px] text-indigo-600 font-bold mt-2">+{ach.bonusPoints} IDG Bonus</div>
                                    </div>
                                </div>
                            ))}
                            {(!userProfile.academicAchievements || userProfile.academicAchievements.length === 0) && (
                                <div className="col-span-2 text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-sm font-bold text-slate-400">Nenhuma medalha conquistada ainda. Participe dos eventos!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                            <Brain size={24} className="text-indigo-600"/> Skill Tree (Autoavaliações)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[AssessmentType.DISC, AssessmentType.LEARNING_STYLE].map(type => {
                                const res = userProfile.assessments.find(a => a.type === type);
                                return (
                                    <div key={type} className={`p-6 rounded-3xl border-2 transition-all ${res ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${res ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-300'}`}>
                                                <Brain size={24}/>
                                            </div>
                                            {res ? <CheckCircle size={20} className="text-emerald-500"/> : <button onClick={() => setActiveTest(type)} className="text-[10px] font-black uppercase text-indigo-600 bg-white px-3 py-1 rounded-lg border border-indigo-100">Iniciar</button>}
                                        </div>
                                        <div className="font-black text-slate-800 uppercase text-xs mb-1">{type.replace('_', ' ')}</div>
                                        <div className="text-sm text-slate-500">{res ? `Resultado: ${res.resultType}` : 'Desbloqueie para entender seu perfil.'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Info de Login e Segurança */}
                <div className="space-y-8">
                    <div className="bg-[#0f172a] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                        <Shield size={100} className="absolute -right-8 -bottom-8 opacity-5"/>
                        <h3 className="font-black text-xs uppercase tracking-widest mb-6">Info da Conta</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Email Cadastrado</div>
                                <div className="text-sm font-bold truncate">{user.email}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Senha</div>
                                <div className="text-sm font-bold">••••••••••••</div>
                                <button className="text-[10px] font-black text-indigo-400 uppercase mt-2 border-b border-indigo-400">Alterar Senha</button>
                            </div>
                            <div className="pt-6 border-t border-white/5">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Status de Rede</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-sm font-bold">Conectado ao Cloud EP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Activity size={32}/>
                        </div>
                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-2">Relatórios Oficiais</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6">Acesse seus laudos psicopedagógicos e resultados de triagens aqui.</p>
                        <button onClick={() => setView('NEURO_SCREENING')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">Abrir Prontuário</button>
                    </div>
                </div>
            </div>

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

const AttributeBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{label}</span>
            <span className="text-xs font-black text-slate-400">{value}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);
