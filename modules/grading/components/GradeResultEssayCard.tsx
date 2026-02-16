import React, { useState } from 'react';
import { HighlightedEssayText } from './HighlightedEssayText';
import { EssayFeedbackDisplay } from './EssayFeedbackDisplay';

interface GradeResultEssayCardProps {
    text: string;
    correction: any;
    defaultExpanded?: boolean;
}

export const GradeResultEssayCard: React.FC<GradeResultEssayCardProps> = ({
    text,
    correction,
    defaultExpanded = false
}) => {
    const [activeTab, setActiveTab] = useState<'COMPETENCIES' | 'GRAMMAR'>('COMPETENCIES');
    const [hoveredIssue, setHoveredIssue] = useState<number | null>(null);

    // If no correction, just show text
    if (!correction) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Sua Resposta:</div>
                <p className="whitespace-pre-wrap text-slate-700 italic">{text}</p>
                <div className="mt-4 p-3 bg-slate-50 text-slate-500 text-sm rounded border border-slate-100 text-center">
                    Ainda não há correção detalhada disponível.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[600px]">
            {/* Left: Text */}
            <div className="flex-1 bg-slate-50 border-r border-slate-200 overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 bg-slate-100/80 p-2 z-10 border-b border-slate-200 backdrop-blur-sm flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
                    <span>Texto Enviado</span>
                    <span>{text.split(/\s+/).length} palavras</span>
                </div>
                <div className="pt-10 h-full">
                    <HighlightedEssayText
                        text={text}
                        correction={correction}
                        hoveredIssue={hoveredIssue}
                        onHover={setHoveredIssue}
                        readOnly={true}
                    />
                </div>
            </div>

            {/* Right: Feedback */}
            <div className="w-full md:w-[350px] shrink-0 bg-white flex flex-col border-t md:border-t-0 md:border-l border-slate-200">
                <EssayFeedbackDisplay
                    correction={correction}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    hoveredIssue={hoveredIssue}
                    onHover={setHoveredIssue}
                />
            </div>
        </div>
    );
};
