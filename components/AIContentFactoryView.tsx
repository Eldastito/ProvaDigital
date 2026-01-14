import React, { useState } from 'react';
import { generateSyllabus, generateTextAsset, Syllabus, TextAsset } from '../services/geminiService';
import { BookOpen, FileText, Sparkles, Download, Copy, Loader2, Check, Clock } from 'lucide-react';

export const AIContentFactoryView = () => {
    const [mode, setMode] = useState<'SYLLABUS' | 'TEXT'>('SYLLABUS');
    const [loading, setLoading] = useState(false);

    // Syllabus State
    const [sylInput, setSylInput] = useState({ subject: 'História', grade: '9º Ano', topic: 'Guerra Fria' });
    const [syllabus, setSyllabus] = useState<Syllabus | null>(null);

    // Text State
    const [txtInput, setTxtInput] = useState({ theme: 'Sustentabilidade Urbana', genre: 'Artigo de Opinião' });
    const [textAsset, setTextAsset] = useState<TextAsset | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            if (mode === 'SYLLABUS') {
                const res = await generateSyllabus(sylInput.subject, sylInput.grade, sylInput.topic);
                setSyllabus(res);
            } else {
                const res = await generateTextAsset(txtInput.theme, txtInput.genre);
                setTextAsset(res);
            }
        } catch (e) {
            alert("Erro ao gerar conteúdo: " + e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen bg-slate-50">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Sparkles className="text-brand-primary" /> Fábrica de Conteúdo IA
                </h1>
                <p className="text-slate-500">Gere planejamentos e materiais didáticos originais em segundos.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                            <button
                                onClick={() => setMode('SYLLABUS')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === 'SYLLABUS' ? 'bg-white shadow text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <BookOpen size={16} className="inline mr-2" /> Ementas
                            </button>
                            <button
                                onClick={() => setMode('TEXT')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === 'TEXT' ? 'bg-white shadow text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText size={16} className="inline mr-2" /> Textos
                            </button>
                        </div>

                        {mode === 'SYLLABUS' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Disciplina</label>
                                    <input value={sylInput.subject} onChange={e => setSylInput({ ...sylInput, subject: e.target.value })} className="w-full mt-1 p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Ano/Série</label>
                                    <input value={sylInput.grade} onChange={e => setSylInput({ ...sylInput, grade: e.target.value })} className="w-full mt-1 p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tópico Central</label>
                                    <input value={sylInput.topic} onChange={e => setSylInput({ ...sylInput, topic: e.target.value })} className="w-full mt-1 p-2 border rounded-lg" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tema</label>
                                    <input value={txtInput.theme} onChange={e => setTxtInput({ ...txtInput, theme: e.target.value })} className="w-full mt-1 p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Gênero Textual</label>
                                    <select value={txtInput.genre} onChange={e => setTxtInput({ ...txtInput, genre: e.target.value })} className="w-full mt-1 p-2 border rounded-lg bg-white">
                                        <option>Artigo de Opinião</option>
                                        <option>Notícia / Reportagem</option>
                                        <option>Crônica Narrativa</option>
                                        <option>Poema</option>
                                        <option>Texto Científico</option>
                                        <option>Conto</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full mt-8 py-3 bg-brand-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/90 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                            {loading ? 'Gerando...' : 'Gerar Conteúdo'}
                        </button>
                    </div>
                </div>

                {/* RIGHT: Output */}
                <div className="lg:col-span-2">
                    {syllabus && mode === 'SYLLABUS' && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-start mb-6 border-b pb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{sylInput.topic}</h2>
                                    <div className="flex gap-2 mt-2">
                                        {syllabus.bnccCodes.map(code => (
                                            <span key={code} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono font-bold rounded">
                                                {code}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-primary">
                                    <Copy size={20} />
                                </button>
                            </div>

                            <p className="text-slate-600 mb-8 italic">"{syllabus.overview}"</p>

                            <div className="space-y-4">
                                {syllabus.weeks.map(week => (
                                    <div key={week.week} className="border border-slate-100 rounded-xl p-4 hover:border-brand-primary/20 transition bg-slate-50/50">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center font-bold text-brand-primary shadow-sm border border-slate-100">
                                                {week.week}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{week.theme}</h4>
                                                <p className="text-sm text-slate-500 mt-1">🎯 {week.objective}</p>
                                                <div className="mt-3 text-xs font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">
                                                    💡 Atividade: {week.activity}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {textAsset && mode === 'TEXT' && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">{txtInput.genre}</span>
                                    <h2 className="text-2xl font-bold text-slate-900 mt-1">{textAsset.title}</h2>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                        <Clock size={12} /> Leitura: {textAsset.readingTime}
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-primary">
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="prose prose-slate max-w-none mb-8 font-serif leading-relaxed text-lg text-slate-700">
                                {textAsset.body.split('\n').map((p, i) => (
                                    <p key={i} className="mb-4">{p}</p>
                                ))}
                            </div>

                            <div className="border-t pt-4 text-xs text-slate-400 flex justify-between">
                                <span>Fonte: {textAsset.source}</span>
                                <span>Gerado por IA • Copyright Free</span>
                            </div>
                        </div>
                    )}

                    {!syllabus && !textAsset && !loading && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl">
                            <Sparkles size={48} className="mb-4 opacity-20" />
                            <p>Configure os parâmetros ao lado para gerar conteúdo.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
                            <Loader2 size={48} className="animate-spin text-brand-primary mb-4" />
                            <p className="animate-pulse">Criando conteúdo exclusivo...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
