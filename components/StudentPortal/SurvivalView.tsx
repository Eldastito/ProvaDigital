
import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Shield, Zap, Flame, Trophy, Coins, SkipForward, AlertTriangle, ArrowRight, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { AppState, User, QuestionType, UserProfileExtended, Item, DifficultyLevel, ItemOrigin } from '../../types';

import { useAppStore } from '../../store/useAppStore';

// Fallback questions for the demo if store is empty
const SURVIVAL_MOCK_QUESTIONS: Item[] = [
    { id: 'surv1', tenantId: 'mock', ownerId: 'system', knowledgeArea: 'Geral', subject: 'Geografia', type: QuestionType.MULTIPLE_CHOICE, statement: 'Qual o maior país do mundo em área territorial?', alternatives: [{ id: 'a', text: 'Rússia', isCorrect: true }, { id: 'b', text: 'China', isCorrect: false }, { id: 'c', text: 'EUA', isCorrect: false }, { id: 'd', text: 'Brasil', isCorrect: false }], correctAnswerJustification: '', difficulty: DifficultyLevel.EASY, score: 1, origin: ItemOrigin.MANUAL, tags: [], usageCount: 0, createdAt: new Date().toISOString() },
    { id: 'surv2', tenantId: 'mock', ownerId: 'system', knowledgeArea: 'Geral', subject: 'Ciências', type: QuestionType.MULTIPLE_CHOICE, statement: 'A água ferve a quantos graus Celsius ao nível do mar?', alternatives: [{ id: 'a', text: '90°C', isCorrect: false }, { id: 'b', text: '100°C', isCorrect: true }, { id: 'c', text: '110°C', isCorrect: false }, { id: 'd', text: '120°C', isCorrect: false }], correctAnswerJustification: '', difficulty: DifficultyLevel.EASY, score: 1, origin: ItemOrigin.MANUAL, tags: [], usageCount: 0, createdAt: new Date().toISOString() },
    { id: 'surv3', tenantId: 'mock', ownerId: 'system', knowledgeArea: 'Geral', subject: 'História', type: QuestionType.MULTIPLE_CHOICE, statement: 'Em que ano o homem pisou na Lua pela primeira vez?', alternatives: [{ id: 'a', text: '1959', isCorrect: false }, { id: 'b', text: '1969', isCorrect: true }, { id: 'c', text: '1979', isCorrect: false }, { id: 'd', text: '1989', isCorrect: false }], correctAnswerJustification: '', difficulty: DifficultyLevel.MEDIUM, score: 1, origin: ItemOrigin.MANUAL, tags: [], usageCount: 0, createdAt: new Date().toISOString() },
    { id: 'surv4', tenantId: 'mock', ownerId: 'system', knowledgeArea: 'Geral', subject: 'Português', type: QuestionType.MULTIPLE_CHOICE, statement: 'Qual é o plural de "cidadão"?', alternatives: [{ id: 'a', text: 'Cidadões', isCorrect: false }, { id: 'b', text: 'Cidadãos', isCorrect: true }, { id: 'c', text: 'Cidadães', isCorrect: false }, { id: 'd', text: 'Cidadaos', isCorrect: false }], correctAnswerJustification: '', difficulty: DifficultyLevel.MEDIUM, score: 1, origin: ItemOrigin.MANUAL, tags: [], usageCount: 0, createdAt: new Date().toISOString() },
    { id: 'surv5', tenantId: 'mock', ownerId: 'system', knowledgeArea: 'Geral', subject: 'Matemática', type: QuestionType.MULTIPLE_CHOICE, statement: 'Raiz quadrada de 144?', alternatives: [{ id: 'a', text: '10', isCorrect: false }, { id: 'b', text: '12', isCorrect: true }, { id: 'c', text: '14', isCorrect: false }, { id: 'd', text: '11', isCorrect: false }], correctAnswerJustification: '', difficulty: DifficultyLevel.EASY, score: 1, origin: ItemOrigin.MANUAL, tags: [], usageCount: 0, createdAt: new Date().toISOString() },
];

export const SurvivalView = () => {
    const state = useAppStore();
    const { currentUser: user, updateUserProfile: onUpdateProfile } = state;

    if (!user) return null;
    // User Profile for Coins
    const userProfile: UserProfileExtended = state.userProfiles?.find(p => p.userId === user.id) || {
        userId: user.id,
        avatarUrl: '',
        bio: '',
        assessments: [],
        owlCoins: 100, // Default coins if new
        badges: []
    };

    // Game State
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER'>('START');
    const [lives, setLives] = useState(3);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [questionsQueue, setQuestionsQueue] = useState<Item[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);

    // Question Interaction State
    const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [eliminatedAlts, setEliminatedAlts] = useState<string[]>([]); // For 50/50 power-up

    // Init Game
    const startGame = () => {
        // Mix real items with mocks to ensure infinite play feel
        const pool = [...state.items.filter(i => i.type === QuestionType.MULTIPLE_CHOICE), ...SURVIVAL_MOCK_QUESTIONS];
        // Shuffle pool
        const shuffled = pool.sort(() => 0.5 - Math.random());

        setQuestionsQueue(shuffled);
        setCurrentQIndex(0);
        setLives(3);
        setScore(0);
        setStreak(0);
        setSelectedAlt(null);
        setIsCorrect(null);
        setEliminatedAlts([]);
        setGameState('PLAYING');
    };

    const handleQuit = () => {
        if (confirm("Deseja desistir? Você perderá o progresso desta sessão.")) {
            setGameState('START');
        }
    };

    const handleAnswer = (altId: string) => {
        if (selectedAlt) return; // Prevent double click

        setSelectedAlt(altId);
        const currentQ = questionsQueue[currentQIndex];
        const correctAlt = currentQ.alternatives.find((a: any) => a.isCorrect);
        const correct = correctAlt?.id === altId;

        setIsCorrect(correct);

        if (correct) {
            setScore(s => s + 10 + (streak * 2)); // Bonus for streak
            setStreak(s => s + 1);
        } else {
            setLives(l => l - 1);
            setStreak(0);
        }

        // Delay for next question or game over
        setTimeout(() => {
            if (!correct && lives <= 1) {
                setGameState('GAME_OVER');
            } else {
                nextQuestion();
            }
        }, 1500);
    };

    const nextQuestion = () => {
        if (currentQIndex >= questionsQueue.length - 1) {
            // Loop questions if run out (simulating infinite)
            const reshuffled = [...questionsQueue].sort(() => 0.5 - Math.random());
            setQuestionsQueue(q => [...q, ...reshuffled]);
        }
        setCurrentQIndex(prev => prev + 1);
        setSelectedAlt(null);
        setIsCorrect(null);
        setEliminatedAlts([]);
    };

    // --- POWER-UPS LOGIC ---

    const buyHeart = () => {
        if (userProfile.owlCoins < 50) return alert("Moedas insuficientes!");
        if (lives >= 3) return alert("Vida cheia!");

        updateCoins(-50);
        setLives(l => l + 1);
    };

    const buySkip = () => {
        if (userProfile.owlCoins < 30) return alert("Moedas insuficientes!");

        updateCoins(-30);
        nextQuestion();
    };

    const buy5050 = () => {
        if (userProfile.owlCoins < 40) return alert("Moedas insuficientes!");
        if (eliminatedAlts.length > 0) return; // Already active

        const currentQ = questionsQueue[currentQIndex];
        const correctId = currentQ.alternatives.find((a: any) => a.isCorrect)?.id;
        const wrongIds = currentQ.alternatives.filter((a: any) => a.id !== correctId).map((a: any) => a.id);

        // Eliminate 2 wrong answers
        const toEliminate = wrongIds.slice(0, 2);

        updateCoins(-40);
        setEliminatedAlts(toEliminate);
    };

    const updateCoins = (amount: number) => {
        const newProfile = { ...userProfile, owlCoins: userProfile.owlCoins + amount };
        onUpdateProfile(newProfile);
    };

    const currentQ = questionsQueue[currentQIndex];

    // --- RENDER ---

    if (gameState === 'START') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-95">
                <div className="max-w-md w-full bg-slate-900 text-white rounded-3xl shadow-2xl border-4 border-slate-700 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="relative z-10">
                        <Flame size={80} className="mx-auto text-orange-500 mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-pulse" />
                        <h1 className="text-4xl font-black mb-2 uppercase tracking-widest italic">Sobrevivência</h1>
                        <p className="text-slate-400 mb-8 font-medium">Responda corretamente para manter a chama acesa. 3 erros e fim de jogo.</p>

                        <div className="flex justify-center gap-4 mb-8 text-sm font-bold text-slate-300">
                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
                                <Heart size={16} className="text-rose-500" fill="currentColor" /> 3 Vidas
                            </div>
                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
                                <Zap size={16} className="text-yellow-400" fill="currentColor" /> Streak Bonus
                            </div>
                        </div>

                        <button
                            onClick={startGame}
                            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black text-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
                        >
                            INICIAR DESAFIO
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'GAME_OVER') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-slate-800 rounded-full mb-4 border-4 border-slate-700">
                        <Trophy size={64} className="text-yellow-500" />
                    </div>
                    <h1 className="text-5xl font-black text-slate-800 uppercase mb-2">Fim de Jogo!</h1>
                    <p className="text-xl text-slate-500">Você sobreviveu por <span className="font-bold text-slate-800">{score} pontos</span>.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border-2 border-slate-200 w-full max-w-sm text-center mb-8 shadow-sm">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Recompensa Total</div>
                    <div className="flex items-center justify-center gap-2 text-3xl font-black text-amber-500">
                        <Coins size={32} /> +{Math.floor(score / 5)}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Moedas adicionadas à sua conta.</p>
                </div>

                <button
                    onClick={() => {
                        updateCoins(Math.floor(score / 5)); // Add earned coins
                        setGameState('START');
                    }}
                    className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition"
                >
                    Voltar ao Menu
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col max-w-3xl mx-auto p-4 relative">

            {/* QUIT BUTTON */}
            <button
                onClick={handleQuit}
                className="absolute top-4 right-4 z-20 text-slate-400 hover:text-rose-500 flex items-center gap-1 font-bold text-xs bg-white/80 p-2 rounded-full shadow-sm hover:shadow-md transition"
                title="Desistir"
            >
                <LogOut size={16} /> <span className="hidden md:inline">Desistir</span>
            </button>

            {/* HUD */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg mb-6 flex justify-between items-center border border-slate-700 relative overflow-hidden mt-8">
                <div className="flex items-center gap-2 z-10">
                    {[1, 2, 3].map(i => (
                        <Heart
                            key={i}
                            size={28}
                            className={`transition-all duration-300 ${i <= lives ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-slate-700'}`}
                            fill={i <= lives ? "currentColor" : "none"}
                        />
                    ))}
                </div>

                <div className="flex flex-col items-center z-10">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</div>
                    <div className="text-2xl font-black font-mono text-white leading-none">{score}</div>
                </div>

                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 z-10">
                    <Coins size={16} className="text-amber-400" />
                    <span className="font-bold text-amber-400">{userProfile.owlCoins}</span>
                </div>

                {/* Streak Fire Effect */}
                {streak > 2 && (
                    <div className="absolute right-20 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-20">
                        <Flame size={60} className="text-orange-500" />
                        <span className="text-4xl font-black italic">{streak}x</span>
                    </div>
                )}
            </div>

            {/* Question Area */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="bg-white rounded-2xl shadow-xl border-b-8 border-slate-200 p-8 mb-6 text-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 bg-slate-800 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                        {currentQ.subject}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 leading-snug mt-2">{currentQ.statement}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.alternatives.map((alt: any) => {
                        const isSelected = selectedAlt === alt.id;
                        const isEliminated = eliminatedAlts.includes(alt.id);

                        let btnClass = "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"; // Default

                        if (isEliminated) {
                            btnClass = "bg-slate-100 border-slate-200 text-slate-300 opacity-50 cursor-not-allowed";
                        } else if (selectedAlt) {
                            if (alt.isCorrect) btnClass = "bg-emerald-500 border-emerald-600 text-white shadow-md scale-[1.02]";
                            else if (isSelected && !alt.isCorrect) btnClass = "bg-rose-500 border-rose-600 text-white opacity-80 shake";
                            else btnClass = "bg-slate-50 border-slate-200 text-slate-300 opacity-50";
                        }

                        return (
                            <button
                                key={alt.id}
                                disabled={selectedAlt !== null || isEliminated}
                                onClick={() => handleAnswer(alt.id)}
                                className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-between shadow-sm active:scale-95 ${btnClass}`}
                            >
                                {alt.text}
                                {selectedAlt && alt.isCorrect && <CheckCircle size={24} className="text-white" />}
                                {isSelected && !alt.isCorrect && <XCircle size={24} className="text-white" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Power-ups Shop (Bottom Bar) */}
            <div className="mt-8 flex justify-center gap-4">
                <PowerUpButton
                    icon={Heart}
                    label="Vida Extra"
                    cost={50}
                    onClick={buyHeart}
                    disabled={lives >= 3 || userProfile.owlCoins < 50 || selectedAlt !== null}
                    color="rose"
                />
                <PowerUpButton
                    icon={SkipForward}
                    label="Pular"
                    cost={30}
                    onClick={buySkip}
                    disabled={userProfile.owlCoins < 30 || selectedAlt !== null}
                    color="blue"
                />
                <PowerUpButton
                    icon={Shield}
                    label="50/50"
                    cost={40}
                    onClick={buy5050}
                    disabled={userProfile.owlCoins < 40 || eliminatedAlts.length > 0 || selectedAlt !== null}
                    color="purple"
                />
            </div>
        </div>
    );
};

// Sub-component for Power-up Buttons
const PowerUpButton = ({ icon: Icon, label, cost, onClick, disabled, color }: any) => {
    const colorClasses: any = {
        rose: 'hover:bg-rose-50 hover:border-rose-300 text-rose-700',
        blue: 'hover:bg-blue-50 hover:border-blue-300 text-blue-700',
        purple: 'hover:bg-purple-50 hover:border-purple-300 text-purple-700',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center p-3 rounded-xl border-2 border-slate-200 bg-white transition-all w-24 ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : `hover:-translate-y-1 shadow-sm ${colorClasses[color]}`}`}
        >
            <Icon size={24} className="mb-1" />
            <span className="text-[10px] font-bold uppercase">{label}</span>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full mt-1 border border-amber-100">
                <Coins size={10} /> {cost}
            </div>
        </button>
    );
};
