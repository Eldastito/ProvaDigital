
import React, { useState, useEffect, useMemo } from 'react';
import { Swords, Trophy, Users, Timer, CheckCircle, XCircle, Brain, Star, Coins, ArrowRight, Zap, Play, UserPlus, Check, User as UserIcon, Shuffle, LogOut } from 'lucide-react';
import { AppState, User, QuestionType, UserProfileExtended, Item, DifficultyLevel, ItemOrigin, Student } from '../../types';
import { uuidv4 } from '../../utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { fetchItems, fetchStudents, fetchUserProfiles } from '../../services/supabaseClient';

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
    currentAnswer: string | null; 
    answeredAt: number | null;
}

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
    const { data: allItems } = useQuery<Item[]>({ queryKey: ['items'], queryFn: fetchItems, initialData: [] });
    const { data: allStudents } = useQuery<Student[]>({ queryKey: ['students'], queryFn: fetchStudents, initialData: [] });
    const { data: allUserProfiles } = useQuery<UserProfileExtended[]>({ queryKey: ['userProfiles'], queryFn: fetchUserProfiles, initialData: [] });

    const student = allStudents?.find(s => s.id === user.id);
    const userProfile = allUserProfiles?.find(p => p.userId === user.id);
    
    const [gameState, setGameState] = useState<GameState>('LOBBY');
    const [subject, setSubject] = useState('Geral');
    const [players, setPlayers] = useState<Player[]>([]);
    const [questions, setQuestions] = useState<Item[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timer, setTimer] = useState(15);
    const [userAnswer, setUserAnswer] = useState<string | null>(null);
    const [correctAnswerId, setCorrectAnswerId] = useState<string | null>(null);
    const [isSoloMode, setIsSoloMode] = useState(false);
    const [selectedOpponentIds, setSelectedOpponentIds] = useState<string[]>([]);

    const classmates = useMemo(() => {
        return allStudents?.filter(s => s.classId === student?.classId && s.id !== student?.id) || [];
    }, [allStudents, student]);

    // @-fix: Implemented 'handleQuit' to return to lobby state.
    const handleQuit = () => {
        if (confirm("Deseja sair da batalha?")) {
            setGameState('LOBBY');
        }
    };

    const setupMatch = (mode: 'FRIENDS' | 'RANDOM' | 'SOLO') => {
        setGameState('MATCHMAKING');
        
        const humanPlayer: Player = {
            id: user.id,
            name: 'Você',
            avatar: '🦉',
            isBot: false,
            score: 0,
            currentAnswer: null,
            answeredAt: null
        };

        const opponents: Player[] = [];
        if (mode !== 'SOLO') {
            setIsSoloMode(false);
            let targetStudents: any[] = [];

            if (mode === 'FRIENDS') {
                if (selectedOpponentIds.length === 0) {
                    alert("Selecione amigos para desafiar.");
                    setGameState('LOBBY');
                    return;
                }
                targetStudents = classmates.filter(c => selectedOpponentIds.includes(c.id));
            } else {
                const shuffled = [...classmates].sort(() => 0.5 - Math.random());
                targetStudents = shuffled.slice(0, 3);
            }

            targetStudents.forEach((t, i) => {
                opponents.push({
                    id: t.id,
                    name: t.name.split(' ')[0],
                    avatar: ['🦁', '🐯', '🐼', '🦊'][i % 4],
                    isBot: true,
                    score: 0,
                    currentAnswer: null,
                    answeredAt: null
                });
            });

            while(opponents.length < 3) {
                opponents.push({
                    id: `bot_${opponents.length}`,
                    name: `Bot ${opponents.length + 1}`,
                    avatar: '🤖',
                    isBot: true,
                    score: 0,
                    currentAnswer: null,
                    answeredAt: null
                });
            }
        } else {
            setIsSoloMode(true);
        }

        setPlayers([humanPlayer, ...opponents]);

        let loadedQuestions = (allItems || [])?.filter(i => 
            (subject === 'Geral' || i.subject === subject) && 
            (i.type === QuestionType.MULTIPLE_CHOICE || i.type === QuestionType.TRUE_FALSE)
        );
        
        if (loadedQuestions.length < 5) {
            loadedQuestions = [...loadedQuestions, ...MOCK_QUESTIONS].slice(0, 5);
        } else {
            loadedQuestions = loadedQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
        }
        
        setQuestions(loadedQuestions);
        setCurrentQIndex(0);

        setTimeout(() => {
            setGameState('PLAYING');
            startRound();
        }, 2000);
    };

    const startRound = () => {
        setTimer(15);
        setUserAnswer(null);
        setCorrectAnswerId(null);
        setPlayers(prev => prev.map(p => ({ ...p, currentAnswer: null, answeredAt: null })));
        
        if (!isSoloMode) {
            players.forEach((p) => {
                if (p.isBot) {
                    setTimeout(() => {
                        setPlayers(current => current.map(currP => {
                            if (currP.id === p.id) return { ...currP, currentAnswer: 'HIDDEN', answeredAt: Date.now() };
                            return currP;
                        }));
                    }, 3000 + Math.random() * 8000);
                }
            });
        }
    };

    useEffect(() => {
        let interval: any;
        if (gameState === 'PLAYING' && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (gameState === 'PLAYING' && timer === 0) {
            handleRoundEnd();
        }
        return () => clearInterval(interval);
    }, [gameState, timer]);

    const handleUserAnswer = (altId: string) => {
        if (userAnswer || gameState !== 'PLAYING') return;
        setUserAnswer(altId);
        setPlayers(prev => prev.map(p => p.id === user.id ? { ...p, currentAnswer: altId, answeredAt: Date.now() } : p));
    };

    const handleRoundEnd = () => {
        if (gameState !== 'PLAYING') return;
        setGameState('RESULT_REVEAL');
        
        const currentQ = questions[currentQIndex];
        const correctId = currentQ?.alternatives.find((a: any) => a.isCorrect)?.id;
        setCorrectAnswerId(correctId || null);

        const updatedPlayers = players.map(p => {
            let points = 0;
            let finalChoice = p.isBot ? (Math.random() > 0.4 ? correctId : 'wrong') : p.currentAnswer;

            if (finalChoice === correctId && correctId) {
                points = 100 + (timer * 2); 
            }
            return { ...p, score: p.score + points };
        });

        setPlayers(updatedPlayers.sort((a, b) => b.score - a.score));

        setTimeout(() => {
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(prev => prev + 1);
                setGameState('PLAYING');
                startRound();
            } else {
                setGameState('GAME_OVER');
                const coins = updatedPlayers.findIndex(p => p.id === user.id) === 0 ? 50 : 10;
                if (userProfile) onUpdateProfile({ ...userProfile, owlCoins: (userProfile.owlCoins || 0) + coins });
            }
        }, 4000);
    };

    const currentQ = questions[currentQIndex];

    if (gameState === 'LOBBY') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in">
                <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-brand-primary p-12 text-center relative overflow-hidden flex flex-col md:flex-row gap-12">
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="w-20 h-20 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-primary">
                            <Swords size={48}/>
                        </div>
                        <h1 className="text-4xl font-black text-slate-800 mb-4 uppercase italic tracking-tighter">Batalha de Turma</h1>
                        <p className="text-slate-500 mb-10 text-lg">Teste seus conhecimentos contra seus colegas em tempo real!</p>
                        
                        <div className="space-y-4 mb-10 text-left">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Matéria da Arena</label>
                            <select className="w-full p-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-brand-primary outline-none" value={subject} onChange={(e) => setSubject(e.target.value)}>
                                <option value="Geral">Conhecimentos Gerais</option>
                                <option value="Matemática">Matemática</option>
                                <option value="História">História</option>
                                <option value="Ciências">Ciências</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={() => setupMatch('RANDOM')} className="py-5 bg-brand-primary text-white rounded-2xl font-black text-xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-3">
                                <Shuffle size={24}/> Partida Rápida
                            </button>
                            <button onClick={() => setupMatch('SOLO')} className="py-4 border-2 border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition">
                                Treino Solo
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-50 rounded-3xl p-6 border-2 border-slate-100 flex flex-col">
                        <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 flex justify-between">
                            Colegas Online <span>{classmates.length}</span>
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {classmates.map(friend => (
                                <div key={friend.id} onClick={() => setSelectedOpponentIds(prev => prev.includes(friend.id) ? prev.filter(i => i !== friend.id) : [...prev].slice(-2).concat(friend.id))} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedOpponentIds.includes(friend.id) ? 'border-brand-primary bg-white shadow-md' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-50">{friend.name.charAt(0)}</div>
                                        <span className="font-bold text-slate-700">{friend.name}</span>
                                    </div>
                                    {selectedOpponentIds.includes(friend.id) && <Check size={20} className="text-brand-primary"/>}
                                </div>
                            ))}
                        </div>
                        {selectedOpponentIds.length > 0 && (
                            <button onClick={() => setupMatch('FRIENDS')} className="mt-4 py-3 bg-brand-secondary text-white rounded-xl font-bold shadow-lg">
                                Desafiar Selecionados
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'MATCHMAKING') {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-pulse">
                <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mb-8">
                    <Swords size={64} className="text-brand-primary animate-bounce"/>
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase italic">Sincronizando Arena...</h2>
                <p className="text-slate-400 mt-4 font-medium">Aguardando oponentes entrarem na sala.</p>
            </div>
        );
    }

    if (gameState === 'GAME_OVER') {
        const userRank = players.findIndex(p => p.id === user.id) + 1;
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in">
                <Trophy size={100} className={`mb-6 ${userRank === 1 ? 'text-yellow-400' : 'text-slate-300'}`}/>
                <h1 className="text-6xl font-black text-slate-800 mb-2">{userRank}º Lugar</h1>
                <p className="text-2xl text-slate-500 mb-10">Parabéns! Você mandou muito bem.</p>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-6 mb-12">
                    <div className="text-center">
                        <div className="text-xs font-black text-slate-400 uppercase mb-1">Moedas</div>
                        <div className="text-3xl font-black text-amber-500 flex items-center gap-2"><Coins/> +{userRank === 1 ? 50 : 10}</div>
                    </div>
                    <div className="w-px h-12 bg-slate-100"></div>
                    <div className="text-center">
                        <div className="text-xs font-black text-slate-400 uppercase mb-1">XP Ganho</div>
                        <div className="text-3xl font-black text-brand-primary flex items-center gap-2"><Star/> +250</div>
                    </div>
                </div>
                <button onClick={() => setGameState('LOBBY')} className="px-12 py-4 bg-brand-dark text-white rounded-2xl font-black text-lg hover:bg-brand-primary transition shadow-xl">
                    Voltar ao Lobby
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto p-6 relative">
            <div className="flex justify-between items-center mb-8">
                <div className="flex gap-3">
                    {players.map((p, i) => (
                        <div key={p.id} className={`flex flex-col items-center transition-all ${p.id === user.id ? 'scale-110' : 'opacity-60'}`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-4 ${p.currentAnswer ? 'border-emerald-400 bg-emerald-50' : 'border-white bg-white shadow-md'}`}>
                                {p.avatar}
                            </div>
                            <span className="text-[10px] font-black text-slate-500 mt-1 uppercase truncate w-16 text-center">{p.name}</span>
                            <span className="text-xs font-black text-brand-primary">{p.score}</span>
                        </div>
                    ))}
                </div>
                
                <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-brand-primary flex flex-col items-center w-24">
                    <div className="text-[10px] font-black text-slate-400 uppercase">Tempo</div>
                    <div className={`text-3xl font-black ${timer < 5 ? 'text-rose-500 animate-pulse' : 'text-slate-800'}`}>{timer}</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full">
                <div className="bg-white rounded-[2.5rem] shadow-2xl border-b-[12px] border-slate-100 p-10 mb-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-primary"></div>
                    <span className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 inline-block">Questão {currentQIndex + 1} de 5</span>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">{currentQ?.statement}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ?.alternatives.map((alt: any) => {
                        const isCorrectRevealed = gameState === 'RESULT_REVEAL' && alt.id === correctAnswerId;
                        const isWrongRevealed = gameState === 'RESULT_REVEAL' && userAnswer === alt.id && alt.id !== correctAnswerId;
                        
                        let statusClass = "bg-white border-2 border-slate-100 text-slate-600 hover:border-brand-primary hover:bg-sky-50";
                        if (userAnswer === alt.id) statusClass = "bg-brand-primary border-brand-primary text-white scale-[1.02] shadow-lg";
                        if (isCorrectRevealed) statusClass = "bg-emerald-500 border-emerald-500 text-white animate-bounce shadow-xl";
                        if (isWrongRevealed) statusClass = "bg-rose-500 border-rose-500 text-white opacity-60";

                        return (
                            <button key={alt.id} disabled={userAnswer !== null || gameState === 'RESULT_REVEAL'} onClick={() => handleUserAnswer(alt.id)} className={`p-6 rounded-[1.5rem] font-black text-xl transition-all duration-200 flex items-center justify-between group ${statusClass}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black border-2 ${userAnswer === alt.id ? 'bg-white text-brand-primary border-white' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:border-brand-primary'}`}>
                                        {alt.id.toUpperCase()}
                                    </div>
                                    {alt.text}
                                </div>
                                {isCorrectRevealed && <CheckCircle size={28}/>}
                                {isWrongRevealed && <XCircle size={28}/>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="absolute top-4 right-4">
                <button onClick={handleQuit} className="p-3 bg-white/50 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-colors text-slate-400">
                    <LogOut size={24}/>
                </button>
            </div>
        </div>
    );
};
