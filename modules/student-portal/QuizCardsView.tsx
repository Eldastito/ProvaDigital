import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateFlashcards, FlashcardDeck } from '../../services/geminiService';
import { Zap, RotateCw, CheckCircle, XCircle, Brain } from 'lucide-react';

export const QuizCardsView: React.FC = () => {
    const { currentUser } = useAppStore();
    const [topic, setTopic] = useState('');
    const [deck, setDeck] = useState<FlashcardDeck | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [score, setScore] = useState(0);

    const handleGenerate = async () => {
        if (!topic) return alert('Digite um tópico!');
        setLoading(true);
        setDeck(null);
        setScore(0);
        setCurrentIndex(0);
        setIsFlipped(false);
        try {
            // Assume 9º Ano se não houver turma definida, para demo
            const grade = currentUser?.classId ? 'Série Atual' : '9º Ano';
            const newDeck = await generateFlashcards(topic, grade);
            setDeck(newDeck);
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar cards. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = (hit: boolean) => {
        if (hit) setScore(s => s + 1);
        setIsFlipped(false);
        if (deck && currentIndex < deck.cards.length - 1) {
            setCurrentIndex(c => c + 1);
        } else {
            alert(`Fim do Baralho! Você acertou ${score + (hit ? 1 : 0)} de ${deck?.cards.length}.`);
            // Reset ou salvar pontuação futura
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                    <Zap className="text-yellow-500 fill-yellow-500" /> Quiz Cards
                </h1>
                <p className="text-slate-500">Gere baralhos de estudo instantâneos com IA.</p>
            </header>

            {/* GENERATOR */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-slate-700 mb-2">O que você quer estudar hoje?</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="Ex: Revolução Francesa, Leis de Newton, Verbos..."
                        className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-brand-primary outline-none transition"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="btn-primary h-[50px] px-8 rounded-xl font-bold flex items-center gap-2"
                >
                    {loading ? 'Criando...' : <><Brain size={20} /> Gerar Baralho</>}
                </button>
            </div>

            {/* CARD AREA */}
            {deck && (
                <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8">
                    <div className="w-full max-w-lg aspect-[3/2] perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                        <div className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                            {/* FRONT */}
                            <div className="absolute w-full h-full backface-hidden bg-white border-2 border-slate-200 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    Carta {currentIndex + 1} / {deck.cards.length}
                                </span>
                                <h3 className="text-2xl font-bold text-slate-800">{deck.cards[currentIndex].front}</h3>
                                <div className="mt-8 text-slate-400 text-sm flex items-center gap-2">
                                    <RotateCw size={14} /> Toque para virar
                                </div>
                            </div>

                            {/* BACK */}
                            <div className="absolute w-full h-full backface-hidden bg-brand-primary/10 border-2 border-brand-primary rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 rotate-y-180">
                                <span className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-4">
                                    Resposta
                                </span>
                                <p className="text-xl font-medium text-slate-800 leading-relaxed">
                                    {deck.cards[currentIndex].back}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CONTROLS (Only show when flipped to avoid cheating, or always show?) - Show always but act on flip */}
                    {isFlipped && (
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleNext(false)}
                                className="flex flex-col items-center gap-2 p-4 w-24 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition border border-red-200"
                            >
                                <XCircle size={32} />
                                <span className="text-xs font-bold">Errei</span>
                            </button>
                            <button
                                onClick={() => handleNext(true)}
                                className="flex flex-col items-center gap-2 p-4 w-24 rounded-2xl bg-green-50 text-green-500 hover:bg-green-100 transition border border-green-200"
                            >
                                <CheckCircle size={32} />
                                <span className="text-xs font-bold">Acertei</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
