import React, { useState, useEffect } from 'react';
import { Item } from '../../../types';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface EssayQuestionRendererProps {
    item: Item;
    initialText: string;
    onTextChange: (text: string) => void;
    theme?: 'light' | 'dark' | 'high-contrast';
}

export const EssayQuestionRenderer: React.FC<EssayQuestionRendererProps> = ({ item, initialText, onTextChange, theme = 'light' }) => {
    const [text, setText] = useState(initialText || '');
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    // Sync with initialText if it changes externally (e.g. restoration)
    useEffect(() => {
        setText(initialText || '');
    }, [initialText]);

    useEffect(() => {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        setWordCount(words);
        setCharCount(text.length);
    }, [text]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setText(newText);
        onTextChange(newText);
    };

    const minWords = 50; // Could be from item.config eventually
    const maxWords = 500; // Could be from item.config eventually

    const isTooShort = wordCount < minWords && wordCount > 0;
    const isGoodLength = wordCount >= minWords && wordCount <= maxWords;
    const isTooLong = wordCount > maxWords;

    const getBorderClass = () => {
        if (theme === 'high-contrast') return 'border-yellow-400 focus:ring-yellow-400';
        if (isTooLong) return 'border-red-400 focus:ring-red-400';
        if (isGoodLength) return 'border-emerald-400 focus:ring-emerald-400';
        return 'border-slate-300 dark:border-slate-600 focus:ring-brand-primary';
    };

    const getBgClass = () => {
        if (theme === 'high-contrast') return 'bg-black text-yellow-400 placeholder-yellow-700';
        if (theme === 'dark') return 'bg-slate-800 text-white placeholder-slate-500';
        return 'bg-white text-slate-900 placeholder-slate-400';
    };

    return (
        <div className="w-full bg-white/5 p-1 rounded-xl">
            <div className="relative">
                <div className={`absolute top-0 right-0 p-2 text-xs font-mono font-bold rounded-bl-lg rounded-tr-lg border-b border-l z-10 
                    ${theme === 'high-contrast' ? 'bg-yellow-400 text-black border-black' :
                        isGoodLength ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            isTooLong ? 'bg-red-100 text-red-800 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {wordCount} palavras
                </div>

                <textarea
                    value={text}
                    onChange={handleChange}
                    className={`w-full min-h-[400px] p-6 rounded-xl text-lg font-serif leading-relaxed resize-none transition-all outline-none border-2 focus:ring-2 focus:ring-opacity-50 ${getBorderClass()} ${getBgClass()}`}
                    placeholder="Digite sua resposta aqui. Desenvolva seus argumentos com clareza..."
                    spellCheck={false} // Disable browser spellcheck to simulate exam conditions (optional)
                />
            </div>

            <div className="flex justify-between items-center mt-3 px-2">
                <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className={isTooShort ? 'text-amber-500 flex items-center gap-1' : ''}>
                        {isTooShort && <AlertCircle size={12} />} Mínimo: {minWords} palavras
                    </span>
                    <span className={isTooLong ? 'text-red-500 flex items-center gap-1' : ''}>
                        {isTooLong && <AlertCircle size={12} />} Máximo: {maxWords} palavras
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                    {isGoodLength && (
                        <span className="text-emerald-500 flex items-center gap-1 font-bold animate-in fade-in slide-in-from-bottom-1">
                            <CheckCircle size={12} /> Tamanho adequado
                        </span>
                    )}
                    <span>{charCount} caracteres</span>
                </div>
            </div>
        </div>
    );
};
