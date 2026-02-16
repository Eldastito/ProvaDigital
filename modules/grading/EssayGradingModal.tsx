import React, { useState } from 'react';
import { X, Brain, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, BookOpen, PenTool } from 'lucide-react';
import { gradeFullEssay } from '../../services/geminiService';
import { StudentAnswer } from '../../types';

interface EssayGradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    examTitle: string;
    questionStatement: string;
    motivationalText: string; // Texto de apoio para a IA
    initialText: string;
    onSave: (score: number, feedback: string, fullCorrection: any) => void;
}

export const EssayGradingModal: React.FC<EssayGradingModalProps> = ({
    isOpen, onClose, studentName, examTitle, questionStatement, motivationalText, initialText, onSave
}) => {
    const [text, setText] = useState(initialText);
    const [isGrading, setIsGrading] = useState(false);
    const [correction, setCorrection] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'COMPETENCIES' | 'GRAMMAR'>('COMPETENCIES');
    const [hoveredIssue, setHoveredIssue] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleGrade = async () => {
        if (!text || text.length < 10) {
            alert("O texto é muito curto para ser corrigido.");
            return;
        }

        setIsGrading(true);
        try {
            const result = await gradeFullEssay(examTitle + ": " + questionStatement, motivationalText, text);
            setCorrection(result);
            setActiveTab('COMPETENCIES'); // Switch to results view
        } catch (error) {
            console.error("Erro na correção:", error);
            alert("Erro ao corrigir redação. Verifique sua conexão e tente novamente.");
        } finally {
            setIsGrading(false);
        }
    };

    const handleConfirm = () => {
        if (!correction) return;
        onSave(correction.globalScore, correction.generalFeedback, correction);
        onClose();
    };

    // Helper to render text with highlights
    const renderHighlightedText = () => {
        if (!correction?.issues || correction.issues.length === 0) return <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-serif">{text}</p>;

        let lastIndex = 0;
        const elements: React.ReactNode[] = [];
        const sortedIssues = [...correction.issues].sort((a: any, b: any) => {
            // Simple heuristic match since we don't have exact positions from LLM reliably yet.
            // We will scan the text for the excerpt.
            return text.indexOf(a.excerpt) - text.indexOf(b.excerpt);
        });

        // Dedup issues to avoid overlapping mess
        const uniqueIssues = sortedIssues.filter((issue, index, self) =>
            index === self.findIndex((t) => t.excerpt === issue.excerpt)
        );

        // Simple replace logic (MVP) - In prod we need perfect offsets
        // For MVP we will just split by unique excerpts found

        let currentText = text;
        const parts: { text: string; issue?: any }[] = [];

        // This is a naive implementation, robust one requires exact indices from AI or diff-match-patch
        // We will just try to highlight the FIRST occurrence of each issue excerpt

        // Better UX: Just render text, and if user hovers an issue card, we highlight the excerpt dynamically?
        // Or simple regex match. Let's do regex match for display.

        return (
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-serif text-lg">
                {text.split(/(\s+)/).map((word, idx) => {
                    // Try to match issues roughly (Very naive)
                    // Let's implement full text rendering instead
                    return <span key={idx}>{word}</span>
                })}
            </div>
        );
    };

    // Robuster Highlight Render
    const HighlightedText = () => {
        if (!correction) return <textarea
            className="w-full h-full p-6 text-lg font-serif leading-relaxed border-none focus:ring-0 resize-none bg-white text-slate-800"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Digite ou cole a redação do aluno aqui..."
        />;

        // If corrected, show read-only with highlights
        return (
            <div className="relative w-full h-full p-6 overflow-y-auto bg-slate-50">
                {correction.issues?.map((issue: any, idx: number) => {
                    // This is still tricky without exact positions. 
                    // For this MVP, we will list issues on the right and user has to find them, 
                    // or we can try to simple string match highlighting.
                    return null;
                })}
                <p className="whitespace-pre-wrap text-slate-800 font-serif text-lg leading-relaxed">
                    {text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line.split(' ').map((word, w) => {
                                // Check if this word is part of any issue excerpt
                                const issueIdx = correction.issues.findIndex((iss: any) => iss.excerpt.includes(word) && word.length > 3);
                                const isHovered = hoveredIssue === issueIdx;

                                if (issueIdx >= 0) {
                                    return (
                                        <span key={w}
                                            className={`cursor-help border-b-2 ${isHovered ? 'bg-yellow-200 border-yellow-500' : 'border-yellow-300 hover:bg-yellow-100'} transition-all px-0.5 rounded`}
                                            onMouseEnter={() => setHoveredIssue(issueIdx)}
                                            onMouseLeave={() => setHoveredIssue(null)}
                                        >
                                            {word}{' '}
                                        </span>
                                    )
                                }
                                return <span key={w}>{word} </span>
                            })}
                            <br />
                        </React.Fragment>
                    ))}
                </p>
            </div>
        )
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-secondary/20 p-2 rounded-lg">
                            <PenTool size={24} className="text-brand-secondary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                Corretor de Redação com IA
                                <span className="bg-brand-secondary text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">Beta</span>
                            </h2>
                            <p className="text-slate-400 text-sm">{studentName} • {examTitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition p-2 hover:bg-white/10 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left: Text Input/View */}
                    <div className="flex-1 flex flex-col border-r border-slate-200 relative bg-slate-50/50">
                        <div className="absolute top-2 right-2 z-10 opacity-50 hover:opacity-100 transition">
                            {correction && (
                                <button onClick={() => setCorrection(null)} className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 hover:bg-slate-300">
                                    Editar Texto
                                </button>
                            )}
                        </div>
                        <HighlightedText />
                    </div>

                    {/* Right: Tools & Results */}
                    <div className="w-[400px] bg-slate-50 flex flex-col shrink-0 border-l border-slate-200 shadow-xl z-10">
                        {!correction ? (
                            <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-6">
                                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4 relative group cursor-pointer" onClick={handleGrade}>
                                    <div className="absolute inset-0 bg-purple-400 rounded-full opacity-20 animate-ping group-hover:opacity-40"></div>
                                    <Brain size={48} className={`text-purple-600 ${isGrading ? 'animate-pulse' : ''}`} />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-slate-800">Pronto para corrigir?</h3>
                                    <p className="text-slate-500 text-sm max-w-[280px]">
                                        A IA analisará gramática, coesão, argumentação e dará nota baseada nos critérios do ENEM.
                                    </p>
                                </div>

                                <button
                                    onClick={handleGrade}
                                    disabled={isGrading}
                                    className="w-full max-w-[200px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isGrading ? (
                                        <>Corrigindo...</>
                                    ) : (
                                        <>
                                            <Brain size={20} /> Corrigir Agora
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full bg-white">
                                {/* Score Board */}
                                <div className="p-6 bg-slate-900 text-white text-center shrink-0">
                                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                                        {correction.globalScore}
                                    </div>
                                    <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Nota estimada ENEM</div>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-slate-200">
                                    <button
                                        onClick={() => setActiveTab('COMPETENCIES')}
                                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'COMPETENCIES' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Competências
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('GRAMMAR')}
                                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'GRAMMAR' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Correções ({correction.issues.length})
                                    </button>
                                </div>

                                {/* Scrollable List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {activeTab === 'COMPETENCIES' && (
                                        <div className="space-y-4">
                                            {correction.competencies.map((comp: any) => (
                                                <div key={comp.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50 hover:bg-white hover:shadow-md transition">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Competência {comp.id}</span>
                                                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${comp.score >= 160 ? 'bg-green-100 text-green-700' : comp.score >= 120 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                            {comp.score}/{comp.maxScore}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{comp.name}</h4>
                                                    <p className="text-xs text-slate-600 leading-relaxed">{comp.feedback}</p>
                                                </div>
                                            ))}
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                                                <h4 className="flex items-center gap-2 font-bold text-blue-900 text-sm mb-2">
                                                    <Brain size={14} /> Parecer Geral
                                                </h4>
                                                <p className="text-xs text-blue-800 leading-relaxed italic">
                                                    "{correction.generalFeedback}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'GRAMMAR' && (
                                        <div className="space-y-3">
                                            {correction.issues.length === 0 ? (
                                                <div className="text-center py-8 text-slate-400">
                                                    <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                                                    <p>Nenhum erro encontrado!</p>
                                                </div>
                                            ) : (
                                                correction.issues.map((issue: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className={`border-l-4 rounded-r-lg p-3 text-sm transition cursor-pointer ${hoveredIssue === idx ? 'bg-yellow-50 border-yellow-500 shadow-md transform -translate-x-1' : 'bg-white border-yellow-300 shadow-sm'}`}
                                                        onMouseEnter={() => setHoveredIssue(idx)}
                                                        onMouseLeave={() => setHoveredIssue(null)}
                                                    >
                                                        <div className="flex items-start gap-2 mb-1">
                                                            <div className="bg-yellow-100 text-yellow-700 p-1 rounded">
                                                                <AlertTriangle size={12} />
                                                            </div>
                                                            <div>
                                                                <p className="font-mono text-xs text-red-500 line-through decoration-red-300">{issue.excerpt}</p>
                                                                <p className="font-bold text-green-700">{issue.suggestion}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1 pl-7">{issue.explanation}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2 shrink-0">
                                    <button
                                        onClick={handleConfirm}
                                        className="flex-1 bg-brand-primary text-white py-2 rounded-lg font-bold hover:bg-brand-primary-dark transition shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Aceitar Nota
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
