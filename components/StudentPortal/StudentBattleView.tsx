
import React, { useState, useEffect, useMemo } from 'react';
import { Swords, Trophy, Users, Timer, CheckCircle, XCircle, Brain, Star, Coins, ArrowRight, Zap, Play, UserPlus, Check, User as UserIcon, Shuffle, LogOut } from 'lucide-react';
import { AppState, User, QuestionType, UserProfileExtended, Item, DifficultyLevel, ItemOrigin } from '../../types';
import { uuidv4 } from '../../utils/helpers';

interface StudentBattleViewProps {
    state: AppState;
    user: User;
    onUpdateProfile: (p: UserProfileExtended) => void;
}

type GameState = 'LOBBY' | 'MATCHMAKING' | 'PLAYING' | 'RESULT_REVEAL' | 'GAME_OVER';

interface Player {
    id: string;
    name: string;
    avatar: string;
    isBot: boolean;
    score: number;
    currentAnswer: string | null; // Null if thinking
    answeredAt: number | null;
}

// Fallback questions if store is empty
const MOCK_QUESTIONS: Item[] = [
    { 
        id: 'mq1', 
        tenantId: 'mock',
        ownerId: 'system',
        knowledgeArea: 'Geral',
        subject: 'Geografia',
        type: QuestionType.MULTIPLE_CHOICE,
        statement: 'Qual é a capital do Brasil?', 
        alternatives: [{id:'a', text:'Brasília', isCorrect:true}, {id:'b', text:'Rio de Janeiro', isCorrect:false}, {id:'c', text:'São Paulo', isCorrect:false}, {id:'d', text:'Salvador', isCorrect:false}],
        correctAnswerJustification: 'Brasília é a capital federal.',
        difficulty: DifficultyLevel.EASY,
        score: 10,
        origin: ItemOrigin.MANUAL,
        tags: [],
        usageCount: 0,
        createdAt: new Date().toISOString()
    },
    { 
        id: 'mq2', 
        tenantId: 'mock',
        ownerId: 'system',
        knowledgeArea: 'Exatas',
        subject: 'Matemática',
        type: QuestionType.MULTIPLE_CHOICE,
        statement: 'Quanto é 7 x 8?', 
        alternatives: [{id:'a', text:'54', isCorrect:false}, {id:'b', text:'56', isCorrect:true}, {id:'c', text:'48', isCorrect:false}, {id:'d', text:'64', isCorrect:false}],
        correctAnswerJustification: 'Tabuada do 7.',
        difficulty: DifficultyLevel.EASY,
        score: 10,
        origin: ItemOrigin.MANUAL,
        tags: [],
        usageCount: 0,
        createdAt: new Date().toISOString()
    },
    { 
        id: 'mq3', 
        tenantId: 'mock',
        ownerId: 'system',
        knowledgeArea: 'Humanas',
        subject: 'Artes',
        type: QuestionType.MULTIPLE_CHOICE,
        statement: 'Quem pintou a Mona Lisa?', 
        alternatives: [{id:'a', text:'Van Gogh', isCorrect:false}, {id:'b', text:'Da Vinci', isCorrect:true}, {id:'c', text:'Picasso', isCorrect:false}, {id:'d', text:'Michelangelo', isCorrect:false}],
        correctAnswerJustification: 'Leonardo da Vinci.',
        difficulty: DifficultyLevel.MEDIUM,
        score: 10,
        origin: ItemOrigin.MANUAL,
        tags: [],
        usageCount: 0,
        createdAt: new Date().toISOString()
    },
    { 
        id: 'mq4', 
        tenantId: 'mock',
        ownerId: 'system',
        knowledgeArea: 'Ciências',
        subject: 'Química',
        type: QuestionType.MULTIPLE_CHOICE,
        statement: 'Qual o elemento químico O?', 
        alternatives: [{id:'a', text:'Ouro', isCorrect:false}, {id:'b', text:'Oxigênio', isCorrect:true}, {id:'c', text:'Ósmio', isCorrect:false}, {id:'d', text:'Oliva', isCorrect:false}],
        correctAnswerJustification: 'Oxigênio.',
        difficulty: DifficultyLevel.EASY,
        score: 10,
        origin: ItemOrigin.MANUAL,
        tags: [],
        usageCount: 0,
        createdAt: new Date().toISOString()
    },
    { 
        id: 'mq5', 
        tenantId: 'mock',
        ownerId: 'system',
        knowledgeArea: 'Ciências',
        subject: 'Geografia',
        type: QuestionType.MULTIPLE_CHOICE,
        statement: 'A Terra é:', 
        alternatives: [{id:'a', text:'Plana', isCorrect:false}, {id:'b', text:'Redonda (Geoide)', isCorrect:true}, {id:'c', text:'Quadrada', isCorrect:false}, {id:'d', text:'Triangular', isCorrect:false}],
        correctAnswerJustification: 'Formato Geoide.',
        difficulty: DifficultyLevel.EASY,
        score: 10,
        origin: ItemOrigin.MANUAL,
        tags: [],
        usageCount: 0,
        createdAt: new Date().toISOString()
    },
];

export const StudentBattleView = ({ state, user, onUpdateProfile }: StudentBattleViewProps) => {
    const student = state.students.find(s => s.id === user.id);
    const userProfile = state.userProfiles?.find(p => p.userId === user.id);
    
    // --- GAME STATE ---
    const [gameState, setGameState] = useState<GameState>('LOBBY');
    const [subject, setSubject] = useState('Geral');
    const [players, setPlayers] = useState<Player[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timer, setTimer] = useState(15);
    const [userAnswer, setUserAnswer] = useState<string | null>(null);
    const [correctAnswerId, setCorrectAnswerId] = useState<string | null>(null);
    const [isSoloMode, setIsSoloMode] = useState(false);
    
    // Opponent Selection State
    const [selectedOpponentIds, setSelectedOpponentIds] = useState<string[]>([]);

    const classmates = useMemo(() => {
        return state.students.filter(s => s.classId === student?.classId && s.id !== student?.id);
    }, [state.students, student]);

    const toggleOpponent = (id: string) => {
        if (selectedOpponentIds.includes(id)) {
            setSelectedOpponentIds(prev => prev.filter(oid => oid !== id));
        } else {
            if (selectedOpponentIds.length < 3) {
                setSelectedOpponentIds(prev => [...prev, id]);
            } else {
                alert("Você pode desafiar no máximo 3 amigos por vez.");
            }
        }
    };

    const handleQuit = () => {
        if (confirm("Tem certeza que deseja abandonar a partida? Todo o progresso será perdido.")) {
            setGameState('LOBBY');
        }
    };

    // Configura os jogadores (Real + Bots simulando os amigos selecionados)
    const setupMatch = (mode: 'FRIENDS' | 'RANDOM' | 'SOLO') => {
        setGameState('MATCHMAKING');
        
        // 1. Configura Jogador Humano
        const humanPlayer: Player = {
            id: user.id,
            name: 'Você',
            avatar: '🦉',
            isBot: false,
            score: 0,
            currentAnswer: null,
            answeredAt: null
        };

        // 2. Configura Oponentes
        const opponents: Player[] = [];

        if (mode === 'SOLO') {
            setIsSoloMode(true);
            // No opponents
        } else {
            setIsSoloMode(false);
            let targetStudents: any[] = [];

            if (mode === 'FRIENDS') {
                if (selectedOpponentIds.length === 0) {
                    alert("Selecione os amigos na lista ou escolha Partida Rápida.");
                    setGameState('LOBBY');
                    return;
                }
                targetStudents = classmates.filter(c => selectedOpponentIds.includes(c.id));
            } else if (mode === 'RANDOM') {
                // Shuffle and pick 3 random classmates
                const shuffled = [...classmates].sort(() => 0.5 - Math.random());
                targetStudents = shuffled.slice(0, 3);
            }

            // Se não tiver alunos suficientes (turma vazia), preenche com Bots
            const slotsNeeded = 3 - targetStudents.length;
            
            // Add Real Classmates (Simulated Online)
            targetStudents.forEach((t, i) => {
                opponents.push({
                    id: t.id,
                    name: t.name.split(' ')[0],
                    avatar: ['🦁', '🐯', '🐼', '🦊'][i % 4],
                    isBot: true, // In this mock, they are bots logic-wise
                    score: 0,
                    currentAnswer: null,
                    answeredAt: null
                });
            });

            // Fill remaining with generic bots if needed
            for(let i=0; i<slotsNeeded; i++) {
                opponents.push({
                    id: `bot_${i}`,
                    name: `Aluno ${i+1}`,
                    avatar: '🤖',
                    isBot: true,
                    score: 0,
                    currentAnswer: null,
                    answeredAt: null
                });
            }
        }

        setPlayers([humanPlayer, ...opponents]);

        // 3. Load Questions
        let loadedQuestions = state.items.filter(i => 
            (subject === 'Geral' || i.subject === subject) && 
            (i.type === QuestionType.MULTIPLE_CHOICE || i.type === QuestionType.TRUE_FALSE)
        );
        
        if (loadedQuestions.length < 5) {
            // Fill with mocks if needed
            loadedQuestions = [...loadedQuestions, ...MOCK_QUESTIONS.slice(0, 5 - loadedQuestions.length)];
        }
        
        setQuestions(loadedQuestions.slice(0, 5)); // 5 Questions per match
        setCurrentQIndex(0);

        setTimeout(() => {
            setGameState('PLAYING');
            startRound();
        }, mode === 'SOLO' ? 1000 : 2500); // Faster start for Solo
    };

    const startRound = () => {
        setTimer(15);
        setUserAnswer(null);
        setCorrectAnswerId(null);
        
        // Reset bot answers visual
        setPlayers(prev => prev.map(p => ({ ...p, currentAnswer: null, answeredAt: null })));
        
        // Bot Logic (Only if not Solo)
        if (!isSoloMode) {
            players.forEach((p) => {
                if (p.isBot) {
                    const reactionTime = 3000 + Math.random() * 8000; // 3s to 11s
                    setTimeout(() => {
                        if (gameState === 'GAME_OVER') return; 
                        
                        setPlayers(currentPlayers => {
                            return currentPlayers.map(currP => {
                                if (currP.id === p.id) {
                                    return { ...currP, currentAnswer: 'HIDDEN', answeredAt: Date.now() };
                                }
                                return currP;
                            });
                        });
                    }, reactionTime);
                }
            });
        }
    };

    // Main Game Timer
    useEffect(() => {
        let interval: any;
        if (gameState === 'PLAYING' && timer > 0) {
            interval = setInterval(() => {
                setTimer(t => t - 1);
            }, 1000);
        } else if (gameState === 'PLAYING' && timer === 0) {
            handleRoundEnd();
        }
        return () => clearInterval(interval);
    }, [gameState, timer]);

    // Check if everyone answered
    useEffect(() => {
        if (gameState === 'PLAYING') {
            const allAnswered = players.every(p => p.currentAnswer !== null || (p.isBot && p.currentAnswer === 'HIDDEN'));
            
            if (allAnswered) {
                // Short delay to show the "selected" state before reveal
                setTimeout(() => handleRoundEnd(), 500);
            }
        }
    }, [players, gameState]);

    const handleUserAnswer = (altId: string) => {
        if (userAnswer) return; // Already answered
        setUserAnswer(altId);
        setPlayers(prev => prev.map(p => p.id === user.id ? { ...p, currentAnswer: altId, answeredAt: Date.now() } : p));
        
        // If solo, finish immediately
        if (isSoloMode) {
            // handleRoundEnd called by useEffect due to allAnswered=true
        }
    };

    const handleRoundEnd = () => {
        setGameState('RESULT_REVEAL');
        
        const currentQ = questions[currentQIndex];
        const correctId = currentQ.alternatives.find((a: any) => a.isCorrect)?.id;
        setCorrectAnswerId(correctId);

        // Calculate Scores
        const updatedPlayers = players.map(p => {
            let points = 0;
            // Bot simulation of correctness
            let botChoice = '';
            if (p.isBot) {
                // 70% chance correct
                const isCorrect = Math.random() > 0.3;
                botChoice = isCorrect ? correctId : 'wrong_id';
            } else {
                botChoice = p.currentAnswer || '';
            }

            if (botChoice === correctId) {
                // Score = Base (100) + Time Bonus
                points = 100 + (p.answeredAt ? Math.max(0, Math.floor((15000 - (Date.now() - (Date.now() - (15 - timer)*1000))) / 100)) : 0); 
                // Simplified scoring
                points = 100 + (timer * 2); 
            }

            return { ...p, score: p.score + points };
        });

        setPlayers(updatedPlayers.sort((a, b) => b.score - a.score));

        // Next round delay
        setTimeout(() => {
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(prev => prev + 1);
                setGameState('PLAYING');
                startRound();
            } else {
                endGame(updatedPlayers);
            }
        }, 4000);
    };

    const endGame = (finalPlayers: Player[]) => {
        setGameState('GAME_OVER');
        
        // Rewards
        const userRank = finalPlayers.findIndex(p => p.id === user.id) + 1;
        let rewardCoins = 0;
        
        if (isSoloMode) {
            // Reward based on accuracy, not rank
            const correctCount = finalPlayers.find(p => p.id === user.id)?.score ? Math.floor(finalPlayers[0].score / 100) : 0;
            rewardCoins = Math.min(20, correctCount * 2);
        } else {
            if (userRank === 1) rewardCoins = 50;
            else if (userRank === 2) rewardCoins = 30;
            else if (userRank === 3) rewardCoins = 15;
            else rewardCoins = 5;
        }

        if (userProfile) {
            onUpdateProfile({
                ...userProfile,
                owlCoins: (userProfile.owlCoins || 0) + rewardCoins
            });
        }
    };

    // --- RENDERERS ---

    if (gameState === 'LOBBY') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-95 overflow-y-auto">
                <div className="max-w-5xl w-full bg-white rounded-2xl shadow-xl border-4 border-brand-primary p-8 text-center relative overflow-hidden flex flex-col md:flex-row gap-8">
                    
                    {/* Left: Settings */}
                    <div className="flex-1 flex flex-col justify-center">
                        <Swords size={64} className="mx-auto text-brand-secondary mb-4"/>
                        <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase italic tracking-wider">Desafio de Turma</h1>
                        <p className="text-slate-500 mb-8">Escolha seu modo de jogo e teste seus conhecimentos!</p>
                        
                        <div className="space-y-4 mb-8 text-left">
                            <label className="block text-xs font-bold text-slate-400 uppercase">Matéria do Desafio</label>
                            <select 
                                className="w-full p-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 bg-slate-50 focus:border-brand-primary outline-none transition"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            >
                                <option value="Geral">Conhecimentos Gerais (Mix)</option>
                                <option value="Matemática">Matemática</option>
                                <option value="História">História</option>
                                <option value="Ciências">Ciências</option>
                                <option value="Português">Português</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            {/* SOLO */}
                            <button 
                                onClick={() => setupMatch('SOLO')}
                                className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-400 transition flex items-center justify-center gap-3"
                            >
                                <UserIcon size={20} className="text-slate-500"/> Treino Individual (Solo)
                            </button>

                            {/* RANDOM MATCHMAKING */}
                            <button 
                                onClick={() => setupMatch('RANDOM')}
                                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-black text-lg shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-3"
                            >
                                <Shuffle size={20} className="text-white"/> Partida Rápida (Aleatório)
                            </button>

                            {/* FRIENDS (ONLY IF SELECTED) */}
                            <button 
                                onClick={() => setupMatch('FRIENDS')}
                                disabled={selectedOpponentIds.length === 0}
                                className="w-full py-4 bg-brand-primary text-white rounded-xl font-black text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Swords size={20} fill="white"/> Desafiar Amigos ({selectedOpponentIds.length})
                            </button>
                        </div>
                    </div>

                    {/* Right: Friends List */}
                    <div className="flex-1 bg-slate-50 rounded-xl border-2 border-slate-200 p-4 flex flex-col h-[450px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18}/> Colegas de Turma</h3>
                            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600 font-bold">{selectedOpponentIds.length}/3</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {classmates.length === 0 ? (
                                <div className="text-center text-slate-400 py-12 flex flex-col items-center">
                                    <Users size={32} className="opacity-20 mb-2"/>
                                    <p className="text-sm">Nenhum colega encontrado.</p>
                                </div>
                            ) : (
                                classmates.map(friend => {
                                    const isSelected = selectedOpponentIds.includes(friend.id);
                                    return (
                                        <div 
                                            key={friend.id}
                                            onClick={() => toggleOpponent(friend.id)}
                                            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${isSelected ? 'border-brand-primary bg-sky-50 shadow-sm' : 'border-white bg-white hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                    {friend.name.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <div className={`font-bold text-sm ${isSelected ? 'text-brand-dark' : 'text-slate-700'}`}>{friend.name}</div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-slate-300'}`}>
                                                {isSelected ? <Check size={14} className="text-white"/> : <UserPlus size={14} className="text-slate-300"/>}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4 text-center italic">
                            Selecione para desafiar ou clique em "Partida Rápida".
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'MATCHMAKING') {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                {isSoloMode ? (
                    <>
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Brain size={40} className="text-slate-400"/>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-600">Preparando treino individual...</h2>
                    </>
                ) : (
                    <>
                        <div className="flex gap-4 mb-8">
                            {players.map((p, i) => (
                                <div key={i} className="flex flex-col items-center animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>
                                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-3xl border-4 border-white shadow-md relative">
                                        {p.avatar}
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div className="mt-2 font-bold text-slate-700 bg-white px-3 py-1 rounded-full text-xs shadow-sm">{p.name}</div>
                                </div>
                            ))}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-600 animate-pulse">Sincronizando sala...</h2>
                        <p className="text-slate-400 mt-2 text-sm">Encontrando oponentes...</p>
                    </>
                )}
            </div>
        );
    }

    if (gameState === 'GAME_OVER') {
        const userRank = players.findIndex(p => p.id === user.id);
        
        let coinsEarned = 0;
        if (isSoloMode) {
            coinsEarned = Math.floor(players[0].score / 100) * 2;
        } else {
            coinsEarned = [50, 30, 15, 5][userRank] || 5;
        }

        return (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in">
                <div className="text-center mb-8">
                    {isSoloMode ? (
                        <Star size={80} className="mx-auto text-yellow-400 drop-shadow-lg mb-4"/>
                    ) : (
                        <Trophy size={80} className="mx-auto text-yellow-400 drop-shadow-lg mb-4"/>
                    )}
                    <h1 className="text-4xl font-black text-slate-800 uppercase">{isSoloMode ? 'Treino Concluído!' : 'Fim de Jogo!'}</h1>
                </div>

                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                    {players.map((p, idx) => (
                        <div key={p.id} className={`flex items-center justify-between p-4 border-b last:border-0 ${p.id === user.id ? 'bg-yellow-50' : 'bg-white'}`}>
                            <div className="flex items-center gap-4">
                                <div className="font-black text-slate-400 text-lg">#{idx + 1}</div>
                                <div className="text-2xl">{p.avatar}</div>
                                <div className="font-bold text-slate-800">{p.name} {p.id === user.id && '(Você)'}</div>
                            </div>
                            <div className="font-black text-brand-primary">{p.score} pts</div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-col items-center">
                    <div className="text-sm font-bold text-slate-500 uppercase mb-2">Sua Recompensa</div>
                    <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-6 py-3 rounded-full font-black text-xl border border-amber-200 shadow-sm">
                        <Coins size={24} className="text-amber-600"/> +{coinsEarned} Owl Coins
                    </div>
                </div>

                <button onClick={() => setGameState('LOBBY')} className="mt-12 text-slate-500 hover:text-brand-primary font-bold underline">
                    Voltar ao Lobby
                </button>
            </div>
        );
    }

    const currentQ = questions[currentQIndex];

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto p-4 relative">
            
            {/* QUIT BUTTON */}
            <button 
                onClick={handleQuit}
                className="absolute top-4 right-4 z-20 text-slate-400 hover:text-rose-500 flex items-center gap-1 font-bold text-xs bg-white/80 p-2 rounded-full shadow-sm hover:shadow-md transition"
                title="Abandonar Partida"
            >
                <LogOut size={16} /> <span className="hidden md:inline">Sair</span>
            </button>

            {/* Header: Score & Timer */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-8">
                <div className="flex gap-4">
                    {players.map(p => (
                        <div key={p.id} className={`flex flex-col items-center transition-opacity ${p.currentAnswer === null && gameState === 'PLAYING' ? 'opacity-100' : 'opacity-100'}`}>
                            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${p.currentAnswer ? 'border-emerald-500 bg-emerald-100' : 'border-slate-200 bg-slate-100'}`}>
                                {p.avatar}
                                {p.currentAnswer && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>}
                            </div>
                            <div className="text-[10px] font-bold mt-1">{p.score}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 text-2xl font-black text-slate-800 font-mono">
                        <Timer size={24} className={timer < 5 ? "text-rose-500 animate-pulse" : "text-slate-400"}/>
                        {timer}s
                    </div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Rodada {currentQIndex + 1} / 5</div>
                </div>
            </div>

            {/* Question Card */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-800 leading-snug">{currentQ.statement}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.alternatives.map((alt: any) => {
                        let btnClass = "bg-white border-2 border-slate-200 hover:border-brand-secondary hover:bg-slate-50";
                        
                        if (gameState === 'RESULT_REVEAL') {
                            if (alt.isCorrect) btnClass = "bg-emerald-500 border-emerald-600 text-white shadow-md transform scale-105"; // Correct
                            else if (userAnswer === alt.id && !alt.isCorrect) btnClass = "bg-rose-500 border-rose-600 text-white opacity-50"; // Wrong pick
                            else btnClass = "bg-slate-100 border-slate-200 text-slate-400 opacity-50"; // Others
                        } else if (userAnswer === alt.id) {
                            btnClass = "bg-brand-primary border-brand-primary text-white shadow-md"; // Selected waiting
                        } else if (userAnswer) {
                            btnClass = "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"; // Disabled
                        }

                        return (
                            <button
                                key={alt.id}
                                disabled={userAnswer !== null}
                                onClick={() => handleUserAnswer(alt.id)}
                                className={`p-6 rounded-xl font-bold text-lg transition-all duration-200 ${btnClass} flex items-center justify-between`}
                            >
                                {alt.text}
                                {gameState === 'RESULT_REVEAL' && alt.isCorrect && <CheckCircle size={24} className="text-white"/>}
                                {gameState === 'RESULT_REVEAL' && userAnswer === alt.id && !alt.isCorrect && <XCircle size={24} className="text-white"/>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Waiting Message */}
            {userAnswer && gameState === 'PLAYING' && !isSoloMode && (
                <div className="mt-8 text-center p-4 bg-slate-800 text-white rounded-xl animate-pulse flex items-center justify-center gap-3">
                    <Users size={20}/>
                    <span className="font-bold">Aguardando outros jogadores...</span>
                </div>
            )}
        </div>
    );
};
