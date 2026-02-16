import React from 'react';

interface HighlightedEssayTextProps {
    text: string;
    correction: any;
    hoveredIssue: number | null;
    onHover: (index: number | null) => void;
    readOnly?: boolean;
    onTextChange?: (text: string) => void;
}

export const HighlightedEssayText: React.FC<HighlightedEssayTextProps> = ({
    text,
    correction,
    hoveredIssue,
    onHover,
    readOnly = true,
    onTextChange
}) => {
    if (!correction || !correction.issues) {
        if (readOnly) {
            return (
                <div className="w-full h-full p-6 overflow-y-auto bg-slate-50">
                    <p className="whitespace-pre-wrap text-slate-800 font-serif text-lg leading-relaxed select-text">
                        {text}
                    </p>
                </div>
            );
        }
        return (
            <textarea
                className="w-full h-full p-6 text-lg font-serif leading-relaxed border-none focus:ring-0 resize-none bg-white text-slate-800"
                value={text}
                onChange={e => onTextChange && onTextChange(e.target.value)}
                placeholder="Digite ou cole a redação do aluno aqui..."
            />
        );
    }

    // If corrected, show read-only with highlights
    return (
        <div className="relative w-full h-full p-6 overflow-y-auto bg-slate-50">
            <p className="whitespace-pre-wrap text-slate-800 font-serif text-lg leading-relaxed select-text">
                {text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                        {line.split(' ').map((word, w) => {
                            // Check if this word is part of any issue excerpt
                            // This matches words roughly. Ideally we'd use exact indices.
                            const issueIdx = correction.issues.findIndex((iss: any) => iss.excerpt.includes(word) && word.length > 3);
                            const isHovered = hoveredIssue === issueIdx;

                            if (issueIdx >= 0) {
                                return (
                                    <span key={w}
                                        className={`cursor-help border-b-2 ${isHovered ? 'bg-yellow-200 border-yellow-500' : 'border-yellow-300 hover:bg-yellow-100'} transition-all px-0.5 rounded`}
                                        onMouseEnter={() => onHover(issueIdx)}
                                        onMouseLeave={() => onHover(null)}
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
    );
};
