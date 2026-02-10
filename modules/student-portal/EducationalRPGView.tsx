import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateRPGScenario, RPGScenario } from '../../services/geminiService';
import { Map, Scroll, Sword, Crown, ArrowRight, Dna } from 'lucide-react';

export const EducationalRPGView: React.FC = () => {
    const { currentUser } = useAppStore();
    const [topic, setTopic] = useState('');
    const [scenario, setScenario] = useState<RPGScenario | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [outcome, setOutcome] = useState<string | null>(null);

    const handleStart = async () => {
        if (!topic) return alert('Escolha um tema para sua aventura!');
        setLoading(true);
        setScenario(null);
        setOutcome(null);
        setSelectedOption(null);

        try {
            const grade = currentUser?.classIds?.length ? 'Série Atual' : 'Ensino Médio';
            const adventure = await generateRPGScenario(topic, grade);
            setScenario(adventure);
        } catch (e) {
            console.error(e);
            alert("A magia falhou... Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleChoice = (index: number) => {
        if (!scenario || !scenario.options || !scenario.options[index]) return;
        setSelectedOption(index);
        const choice = scenario.options[index];

        if (choice.isCorrect) {
            setOutcome(`🎉 SUCESSO! ${choice.outcome}`);
        } else {
            setOutcome(`💀 FALHA! ${choice.outcome}`);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto min-h-screen bg-[#0f172a] text-slate-100 rounded-3xl font-serif">
            <header className="flex justify-between items-center border-b border-slate-700 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-amber-500">
                        <Sword className="fill-amber-900" /> RPG Educacional
                    </h1>
                    <p className="text-slate-400">Transforme conhecimento em aventura.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-800 p-2 px-4 rounded-full border border-slate-700 flex items-center gap-2">
                        <Crown size={16} className="text-yellow-500" /> Nível 12
                    </div>
                </div>
            </header>

            {!scenario ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in zoom-in-95">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-slate-900 p-8 rounded-2xl border border-slate-700 max-w-lg w-full">
                            <h2 className="text-2xl font-bold mb-4 text-center">Inicie sua Jornada</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-400">Qual o tema da missão?</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        placeholder="Ex: Segunda Guerra, Ecossistemas, Trigonometria..."
                                        className="w-full mt-2 p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleStart}
                                    disabled={loading}
                                    className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Conjurando Mundo...' : <><Scroll size={20} /> Começar Aventura</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4">
                    {/* NARRATIVE */}
                    <div className="space-y-6">
                        <div className="prose prose-invert max-w-none">
                            <h2 className="text-4xl font-bold text-amber-100 mb-6 font-serif">{scenario.title}</h2>
                            <p className="text-lg leading-relaxed text-slate-300 border-l-4 border-amber-700 pl-4 italic">
                                "{scenario.intro}"
                            </p>

                            <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
                                <h3 className="font-bold text-amber-500 flex items-center gap-2 mb-3">
                                    <Dna /> O Desafio
                                </h3>
                                <p className="text-xl font-medium">{scenario.challenge}</p>
                            </div>
                        </div>
                    </div>

                    {/* INTERACTION */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Escolha seu destino</h3>

                        {outcome ? (
                            <div className={`p-8 rounded-2xl border mb-6 ${outcome.includes('SUCESSO') ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-red-900/30 border-red-500/50'} animate-in zoom-in-95`}>
                                <h3 className={`text-2xl font-bold mb-4 ${outcome.includes('SUCESSO') ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {outcome.split('!')[0]}!
                                </h3>
                                <p className="text-lg opacity-90">{outcome.split('!')[1]}</p>
                                <button
                                    onClick={() => setScenario(null)}
                                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition"
                                >
                                    Jogar Novamente
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {scenario.options && scenario.options.length > 0 ? (
                                    scenario.options.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleChoice(idx)}
                                            className="w-full text-left p-5 rounded-xl bg-slate-800 border-2 border-slate-700 hover:border-amber-500 hover:bg-slate-750 transition group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400 group-hover:bg-amber-500 group-hover:text-amber-900 transition">
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <span className="text-lg">{opt.text}</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-center">
                                        Erro ao carregar opções. Tente gerar uma nova aventura.
                                        <button
                                            onClick={() => setScenario(null)}
                                            className="block mx-auto mt-2 text-sm underline hover:text-white"
                                        >
                                            Voltar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
