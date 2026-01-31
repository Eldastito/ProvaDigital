import React, { useState } from 'react';
import { Brain, Heart, Briefcase, Globe, Sparkles, ArrowRight, BookOpen, Target, Compass } from 'lucide-react';
import { generateVocationalAnalysis } from '../../services/geminiService';
import { VocationalProfile } from '../../types';

import { useAppStore } from '../../store/useAppStore';
import { AssessmentType, UserRole } from '../../types';

export const VocationalCompassView = () => {
    const [step, setStep] = useState<'INTRO' | 'SURVEY' | 'LOADING' | 'RESULT'>('INTRO');
    const [interests, setInterests] = useState('');
    const [profile, setProfile] = useState<VocationalProfile | null>(null);

    // Access Global State
    const { currentUser, results, userProfiles } = useAppStore();

    // 1. Calculate Real Academic Performance
    const studentResults = results.filter(r => r.studentId === currentUser?.id);
    const subjects = [...new Set(studentResults.map(r => {
        // Find exam metadata to get subject (Assuming exam details are joined or reachable)
        // For now, we'll try to extract subject from exam variant or use a mock subject distribution if missing
        return "Geral";
    }))];

    // Calculate stats
    const averageScore = studentResults.length > 0
        ? (studentResults.reduce((acc, curr) => acc + curr.totalScore, 0) / studentResults.length).toFixed(1)
        : "N/A";

    const statsSummary = `Média Geral: ${averageScore}. Provas Realizadas: ${studentResults.length}.`;

    // 2. Fetch User Profile & Assessments (DISC, Learning Style)
    const userProfile = userProfiles.find(p => p.userId === currentUser?.id);
    const assessments = userProfile?.assessments?.map(a => `${a.type}: ${a.resultType}`).join(", ") || "Perfil Comportamental não mapeado (Usar inferência indireta)";

    const handleAnalyze = async () => {
        setStep('LOADING');
        try {
            // Use Real Data
            const realGrades = statsSummary;

            console.log("Analysing with:", { realGrades, assessments, interests });

            const result = await generateVocationalAnalysis(realGrades, assessments, interests);
            setProfile(result);
            setStep('RESULT');
        } catch (error) {
            alert("Erro ao consultar o Oráculo Vocacional: " + error);
            setStep('INTRO');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">

            {/* HERDER */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
                        Bússola do Futuro <Compass className="text-purple-600 animate-pulse" size={32} />
                    </h1>
                    <p className="text-slate-500">Descubra seu Ikigai e o porquê você estuda.</p>
                </div>
            </div>

            {/* INTRO STEP */}
            {step === 'INTRO' && (
                <div className="bg-white rounded-3xl p-12 shadow-xl max-w-3xl text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-indigo-100 rounded-full">
                            <Sparkles className="text-indigo-600 w-12 h-12" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Você é muito mais que uma nota.</h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Nossa IA analisa suas forças, seu perfil emocional e seus paixões para encontrar
                        o <strong>trabalho dos seus sonhos</strong>.
                    </p>
                    <button
                        onClick={() => setStep('SURVEY')}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2 mx-auto"
                    >
                        Descobrir meu Propósito <ArrowRight />
                    </button>
                </div>
            )}

            {/* SURVEY STEP */}
            {step === 'SURVEY' && (
                <div className="bg-white rounded-3xl p-10 shadow-xl max-w-2xl w-full">
                    <h3 className="text-xl font-bold mb-2">O que faz seus olhos brilharem? ✨</h3>
                    <p className="text-slate-500 mb-6">Cite hobbies, assuntos que você ama ler sobre, jogos ou atividades que te fazem perder a noção do tempo.</p>

                    <textarea
                        className="w-full h-40 p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-lg"
                        placeholder="Ex: Eu amo desmontar coisas para ver como funcionam, gosto de Minecraft e de ajudar meus amigos com conselhos..."
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                    />

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={interests.length < 10}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition"
                        >
                            Revelar meu Futuro
                        </button>
                    </div>
                </div>
            )}

            {/* LOADING STEP */}
            {step === 'LOADING' && (
                <div className="text-center mt-20">
                    <div className="animate-spin mb-4 mx-auto w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                    <h3 className="text-xl font-medium text-indigo-800">Conectando pontos...</h3>
                    <p className="text-slate-500">Analisando suas notas, perfil DISC e interesses.</p>
                </div>
            )}

            {/* RESULTS STEP */}
            {step === 'RESULT' && profile && (
                <div className="w-full max-w-5xl space-y-8 animate-fade-in-up">

                    {/* PURPOSE STATEMENT CARD (GOLDEN CIRCLE) */}
                    <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden text-center">
                        <div className="relative z-10">
                            <h2 className="text-sm font-bold tracking-widest opacity-90 uppercase mb-4 border-b border-white/20 pb-2 inline-block">
                                SEU CÍRCULO DOURADO (O PORQUÊ)
                            </h2>
                            <p className="text-3xl md:text-5xl font-serif leading-tight mb-4">
                                "{profile.purposeStatement}"
                            </p>
                            <p className="text-white/80 text-sm max-w-2xl mx-auto">
                                "As pessoas não compram o que você faz, elas compram o porquê você faz." — Simon Sinek
                            </p>
                        </div>
                        {/* Golden Circles Decoration */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-[40px] border-white/5 rounded-full" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-[40px] border-white/10 rounded-full" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] bg-white/20 rounded-full blur-xl" />
                    </div>

                    {/* IKIGAI GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <IkigaiCard icon={Heart} title="O que você AMA" items={profile.ikigai.love} color="bg-pink-50 text-pink-700" />
                        <IkigaiCard icon={Brain} title="No que é BOM" items={profile.ikigai.goodAt} color="bg-blue-50 text-blue-700" />
                        <IkigaiCard icon={Globe} title="O mundo PRECISA" items={profile.ikigai.needs} color="bg-green-50 text-green-700" />
                        <IkigaiCard icon={Briefcase} title="Pode ser PAGO" items={profile.ikigai.paidFor} color="bg-yellow-50 text-yellow-700" />
                    </div>

                    {/* CAREER RECOMMENDATIONS */}
                    <h3 className="text-2xl font-bold mt-8 mb-4">Carreiras Compatíveis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {profile.careerMatches.map((career) => (
                            <div key={career.id} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition">
                                        <Briefcase className="text-indigo-600" />
                                    </div>
                                    <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                                        {career.matchScore}% Match
                                    </span>
                                </div>
                                <h4 className="text-xl font-bold mb-2">{career.title}</h4>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-3">{career.whyThisFits}</p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Target size={14} />
                                        <span>Skills: {career.requiredSkills.slice(0, 2).join(", ")}</span>
                                    </div>
                                </div>

                                <button className="w-full py-2 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium text-sm">
                                    Ver Trilha de Estudos
                                </button>
                            </div>
                        ))}
                    </div>

                </div>
            )}

        </div>
    );
};

const IkigaiCard = ({ icon: Icon, title, items, color }: any) => (
    <div className={`p-6 rounded-2xl ${color}`}>
        <div className="flex items-center gap-2 mb-4">
            <Icon size={20} />
            <h4 className="font-bold">{title}</h4>
        </div>
        <ul className="space-y-2">
            {items.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm opacity-90">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current" />
                    {item}
                </li>
            ))}
        </ul>
    </div>
);
