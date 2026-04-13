import React, { useState } from 'react';
import { X, Brain, CheckCircle, PenTool } from 'lucide-react';
import { gradeFullEssay } from '../../services/geminiService';
import { HighlightedEssayText } from './components/HighlightedEssayText';
import { EssayFeedbackDisplay } from './components/EssayFeedbackDisplay';
import { useToast } from '../../components/ui/Toast';

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
    const toast = useToast();
    const [isGrading, setIsGrading] = useState(false);
    const [correction, setCorrection] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'COMPETENCIES' | 'GRAMMAR'>('COMPETENCIES');
    const [hoveredIssue, setHoveredIssue] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleGrade = async () => {
        if (!text || text.length < 10) {
            toast.info("O texto é muito curto para ser corrigido.");
            return;
        }

        setIsGrading(true);
        try {
            const result = await gradeFullEssay(examTitle + ": " + questionStatement, motivationalText, text);
            setCorrection(result);
            setActiveTab('COMPETENCIES'); // Switch to results view
        } catch (error) {
            console.error("Erro na correção:", error);
            toast.error("Erro ao corrigir redação. Verifique sua conexão e tente novamente.");
        } finally {
            setIsGrading(false);
        }
    };

    const handleConfirm = () => {
        if (!correction) return;
        onSave(correction.globalScore, correction.generalFeedback, correction);
        onClose();
    };

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
                        <HighlightedEssayText
                            text={text}
                            correction={correction}
                            hoveredIssue={hoveredIssue}
                            onHover={setHoveredIssue}
                            readOnly={!!correction}
                            onTextChange={setText}
                        />
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
                            <EssayFeedbackDisplay
                                correction={correction}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                hoveredIssue={hoveredIssue}
                                onHover={setHoveredIssue}
                            >
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 bg-brand-primary text-white py-2 rounded-lg font-bold hover:bg-brand-primary-dark transition shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} /> Aceitar Nota
                                </button>
                            </EssayFeedbackDisplay>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
