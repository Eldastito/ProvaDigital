import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { AccessibilityConfig, DEFAULT_ACCESSIBILITY_CONFIG } from './types';
import { ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { Exam, Item, StudentAnswer } from '../../types';

interface OnlineExamRunnerProps {
    examId: string;
    studentId: string;
    onExit: () => void;
    onComplete: (answers: StudentAnswer[]) => void;
}

export const OnlineExamRunner = ({ examId, studentId, onExit, onComplete }: OnlineExamRunnerProps) => {
    const state = useAppStore();

    // --- ACCESSIBILITY STATE ---
    const [a11y, setA11y] = useState<AccessibilityConfig>(DEFAULT_ACCESSIBILITY_CONFIG);

    // --- EXAM DATA ---
    const exam = state.exams.find(e => e.id === examId);
    const examItems = useMemo(() => {
        if (!exam) return [];
        // Map ItemConfigs to Real Items
        return exam.items.map(config => {
            const item = state.items.find(i => i.id === config.itemId);
            return item ? { ...item, ...config } : null;
        }).filter(Boolean) as Item[];
    }, [exam, state.items]);

    // --- SESSION STATE ---
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // itemId -> selectedAlternativeId
    const [timeLeft, setTimeLeft] = useState(exam ? exam.durationMinutes * 60 : 0);

    // --- ACCESSIBILITY STYLES COMPUTED ---
    const containerStyle = {
        fontSize: `${a11y.fontSize}%`,
        lineHeight: a11y.lineHeight,
        letterSpacing: `${a11y.letterSpacing}px`,
        fontFamily: a11y.fontType === 'dyslexic' ? 'OpenDyslexic, sans-serif' : a11y.fontType === 'serif' ? 'serif' : 'sans-serif',
    };

    const getThemeClasses = () => {
        switch (a11y.theme) {
            case 'dark': return 'bg-slate-900 text-slate-100';
            case 'sepia': return 'bg-[#f4e4bc] text-[#4f3e1e]';
            case 'high-contrast': return 'bg-black text-yellow-400';
            default: return 'bg-slate-50 text-slate-900';
        }
    };

    // --- LOGIC ---
    const handleAnswer = (itemId: string, alternativeId: string) => {
        setAnswers(prev => ({ ...prev, [itemId]: alternativeId }));
    };

    if (!exam) return <div className="p-8 text-center">Prova não encontrada.</div>;

    const currentItem = examItems[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === examItems.length - 1;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${getThemeClasses()} flex flex-col`} style={containerStyle}>

            {/* TOOLBAR (Floating) */}
            <AccessibilityToolbar config={a11y} onChange={setA11y} />

            {/* HEADER */}
            <header className={`px-6 py-4 flex justify-between items-center border-b ${a11y.theme === 'high-contrast' ? 'border-yellow-400' : 'border-slate-200 dark:border-slate-700'}`}>
                <div>
                    <h1 className="text-xl font-bold">{exam.title}</h1>
                    {!a11y.focusMode && <p className="text-sm opacity-70">Questão {currentQuestionIndex + 1} de {examItems.length}</p>}
                </div>

                {/* TIMER & CONTROLS */}
                <div className="flex items-center gap-4">
                    {!a11y.hideTimer && (
                        <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded ${a11y.theme === 'high-contrast' ? 'border border-yellow-400' : 'bg-slate-200 dark:bg-slate-800'}`}>
                            <Clock size={20} />
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    )}
                    <button onClick={onExit} className="px-4 py-2 opacity-50 hover:opacity-100 uppercase text-sm font-bold tracking-wider">
                        Sair
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT Area */}
            <main className={`flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center ${a11y.focusMode ? 'justify-center' : ''}`}>

                {/* QUESTION CONTAINER */}
                <div className={`w-full max-w-4xl transition-all ${a11y.focusMode ? '' : 'bg-white/5 p-6 rounded-3xl border border-current/10'}`}>

                    {/* Item Statement */}
                    <div className="text-2xl font-medium mb-8 leading-relaxed">
                        {currentItem.statement}
                    </div>

                    {/* Alternatives */}
                    <div className="space-y-4">
                        {currentItem.alternatives.map((alt) => {
                            const isSelected = answers[currentItem.id] === alt.id;
                            let btnClass = "";

                            if (a11y.theme === 'high-contrast') {
                                btnClass = isSelected
                                    ? "bg-yellow-400 text-black border-4 border-yellow-400 font-bold"
                                    : "bg-black text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-900";
                            } else {
                                btnClass = isSelected
                                    ? "bg-brand-primary text-white shadow-lg transform scale-[1.01]"
                                    : "bg-white/50 dark:bg-slate-800 border border-current/10 hover:bg-black/5 dark:hover:bg-white/5";
                            }

                            return (
                                <button
                                    key={alt.id}
                                    onClick={() => handleAnswer(currentItem.id, alt.id)}
                                    className={`w-full p-6 rounded-xl text-left transition-all flex items-center gap-4 text-lg ${btnClass}`}
                                >
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-current' : 'border-current/50'}`}>
                                        {isSelected && <div className="w-4 h-4 rounded-full bg-current" />}
                                    </div>
                                    {alt.text}
                                </button>
                            );
                        })}
                    </div>

                </div>

            </main>

            {/* FOOTER NAVIGATION */}
            <footer className={`p-6 border-t ${a11y.theme === 'high-contrast' ? 'border-yellow-400' : 'border-slate-200 dark:border-slate-700'} flex justify-center gap-4`}>
                <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-8 py-4 rounded-xl font-bold flex items-center gap-2 disabled:opacity-30 hover:bg-current/10 transition"
                >
                    <ChevronLeft /> Anterior
                </button>

                {isLastQuestion ? (
                    <button
                        onClick={() => onComplete([])} // TODO: Map answers
                        className={`px-12 py-4 rounded-xl font-bold flex items-center gap-2 shadow-xl ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black hover:bg-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                    >
                        <CheckCircle /> Finalizar Prova
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentQuestionIndex(Math.min(examItems.length - 1, currentQuestionIndex + 1))}
                        className={`px-12 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg ${a11y.theme === 'high-contrast' ? 'bg-yellow-400 text-black hover:bg-white' : 'bg-brand-primary text-white hover:bg-blue-600'}`}
                    >
                        Próxima <ChevronRight />
                    </button>
                )}
            </footer>

            {/* FOCUS MODE OVERLAY (Ruler) */}
            {a11y.focusMode && (
                <div className="fixed inset-0 pointer-events-none z-10 hidden md:block">
                    <div className="absolute top-0 left-0 right-0 h-[40vh] bg-black/80 backdrop-blur-sm" />
                    <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-black/80 backdrop-blur-sm" />
                </div>
            )}
        </div>
    );
};
