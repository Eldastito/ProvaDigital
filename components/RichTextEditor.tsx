import React, { useState, useId } from 'react';
import { 
    Bold, Italic, Underline, Code, Sigma, 
    Eye, Edit2, AlignCenter, AlignLeft, AlignRight, 
    AlignJustify, Type, List, AlertCircle, FunctionSquare 
} from 'lucide-react';
import { RichTextRenderer } from './RichTextRenderer';

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    height?: string;
    miniMode?: boolean; // For alternatives
}

export const RichTextEditor = ({ value, onChange, placeholder, height = "h-40", miniMode = false }: RichTextEditorProps) => {
    const [isPreview, setIsPreview] = useState(false);
    const uniqueId = useId();
    const textareaId = `richtext-area-${uniqueId}`;

    const insertTag = (startTag: string, endTag: string = startTag) => {
        const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
        if (!textarea) {
            onChange(value + startTag + "texto" + endTag);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const insertedText = selection.length > 0 ? selection : (startTag.includes('```') ? "code" : "texto");
        const newText = before + startTag + insertedText + endTag + after;
        
        onChange(newText);
        
        setTimeout(() => {
            textarea.focus();
            const newCursorStart = start + startTag.length;
            const newCursorEnd = newCursorStart + insertedText.length;
            textarea.setSelectionRange(newCursorStart, newCursorEnd);
        }, 0);
    };

    const Button = ({ icon: Icon, onClick, title, label }: any) => (
        <button 
            onClick={onClick} 
            className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors flex items-center justify-center gap-1" 
            title={title}
            type="button"
        >
            {Icon && <Icon size={miniMode ? 14 : 16}/>}
            {label && <span className="text-xs font-bold">{label}</span>}
        </button>
    );

    return (
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-transparent transition-all">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 p-1 flex-wrap gap-1">
                <div className="flex items-center gap-0.5 flex-wrap">
                    {/* Basic Formatting */}
                    <Button icon={Bold} onClick={() => insertTag('**')} title="Negrito" />
                    <Button icon={Italic} onClick={() => insertTag('*')} title="Itálico" />
                    <Button icon={Underline} onClick={() => insertTag('__')} title="Sublinhado" />
                    <Button icon={AlertCircle} onClick={() => insertTag('[red]', '[/red]')} title="Destaque (Vermelho)" />
                    
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    
                    {/* Alignment - Hidden in miniMode to save space */}
                    {!miniMode && (
                        <>
                            <Button icon={AlignLeft} onClick={() => insertTag('')} title="Esquerda (Padrão)" />
                            <Button icon={AlignCenter} onClick={() => insertTag('[center]', '[/center]')} title="Centralizar" />
                            <Button icon={AlignRight} onClick={() => insertTag('[right]', '[/right]')} title="Direita" />
                            <Button icon={AlignJustify} onClick={() => insertTag('[justify]', '[/justify]')} title="Justificar" />
                            <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        </>
                    )}

                    {/* Fonts & Lists */}
                    {!miniMode && (
                        <>
                            <Button icon={Type} onClick={() => insertTag('[big]', '[/big]')} title="Aumentar Fonte" />
                            <Button icon={List} onClick={() => insertTag('\n- ')} title="Lista (Bullet)" />
                            <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        </>
                    )}
                    
                    {/* Math & Code */}
                    <Button label="fx" onClick={() => insertTag('$', '$')} title="Fórmula (Linha)" />
                    <Button icon={Sigma} onClick={() => insertTag('$$', '$$')} title="Fórmula (Bloco)" />
                    <Button icon={Code} onClick={() => insertTag('```\n', '\n```')} title="Bloco de Código" />
                </div>

                <button 
                    onClick={() => setIsPreview(!isPreview)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${isPreview ? 'bg-brand-primary text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                    type="button"
                >
                    {isPreview ? <><Edit2 size={12}/> Editar</> : <><Eye size={12}/> Visualizar</>}
                </button>
            </div>

            {/* Editor Area */}
            <div className={`relative ${miniMode ? 'h-auto' : height}`}>
                {isPreview ? (
                    <div className={`w-full h-full p-3 overflow-y-auto bg-white text-left ${miniMode ? 'min-h-[40px]' : ''}`}>
                         <RichTextRenderer content={value || `<span class="text-slate-400 italic">${placeholder || 'Vazio'}</span>`} />
                    </div>
                ) : (
                    <textarea
                        id={textareaId}
                        className={`w-full h-full p-3 outline-none resize-none font-mono text-sm text-slate-800 bg-white leading-relaxed ${miniMode ? 'min-h-[80px]' : ''}`}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || "Digite aqui..."}
                        spellCheck={false}
                    />
                )}
            </div>
        </div>
    );
};