
import React, { useState, useEffect } from 'react';

interface RichTextRendererProps {
    content: string;
    className?: string;
}

export const RichTextRenderer = ({ content, className = '' }: RichTextRendererProps) => {
    // Force re-render when KaTeX loads from CDN
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!(window as any).katex) {
            const interval = setInterval(() => {
                if ((window as any).katex) {
                    setTick(t => t + 1);
                    clearInterval(interval);
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, []);

    const parseContent = (text: string) => {
        if (!text) return '';

        const placeholders: string[] = [];
        const pushPlaceholder = (str: string) => {
            placeholders.push(str);
            return `%%%PLACEHOLDER_${placeholders.length - 1}%%%`;
        };

        let processed = text;

        // 1. Extract Code Blocks (``` ... ```)
        processed = processed.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
            const escaped = codeContent
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            return pushPlaceholder(
                `<div class="my-4 rounded-lg overflow-hidden border border-slate-700 shadow-sm block clear-both">
                    <div class="bg-slate-800 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">Código</div>
                    <pre class="bg-[#0f1d2e] text-slate-50 p-4 overflow-x-auto font-mono text-sm leading-relaxed whitespace-pre-wrap"><code>${escaped}</code></pre>
                </div>`
            );
        });

        // 2. Extract Inline Code (` ... `)
        processed = processed.replace(/`([^`\n]+)`/g, (match, codeContent) => {
             const escaped = codeContent
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
             return pushPlaceholder(`<code class="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded font-mono text-sm border border-slate-200 inline-block align-middle">${escaped}</code>`);
        });

        // 3. Extract Math Blocks ($$ ... $$)
        // FIX: Forçamos inline-block para que "encaixe" no texto, mesmo sendo modo display
        processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, texContent) => {
            let html = texContent;
            if ((window as any).katex) {
                try {
                    html = (window as any).katex.renderToString(texContent, {
                        throwOnError: false,
                        displayMode: true, // Mantém a fonte grande
                        output: 'html'
                    });
                    // Hack crítico: Removemos a classe que força display:block do Katex padrão
                    html = html.replace('katex-display', 'katex-display-inline inline-block align-middle mx-1');
                } catch (e) { console.error(e); }
            }
            return pushPlaceholder(`<span class="katex-wrapper inline-block align-middle">${html}</span>`);
        });

        // 4. Extract Math Inline ($ ... $)
        processed = processed.replace(/(\$)(?!\s)([^$\n]+?)(?<!\s)\$/g, (match, start, texContent) => {
             let html = texContent;
             if ((window as any).katex) {
                 try {
                     html = (window as any).katex.renderToString(texContent, {
                         throwOnError: false,
                         displayMode: false,
                         output: 'html'
                     });
                 } catch (e) { console.error(e); }
             }
             return pushPlaceholder(html);
        });

        // 5. Escape HTML of the rest (Security)
        processed = processed
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 6. Markdown & Custom Tags Formatting
        
        // Alinhamento (Estes PRECISAM ser blocos para alinhar, mas usamos div)
        processed = processed.replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div class="text-center w-full block my-2">$1</div>');
        processed = processed.replace(/\[right\]([\s\S]*?)\[\/right\]/g, '<div class="text-right w-full block my-2">$1</div>');
        processed = processed.replace(/\[justify\]([\s\S]*?)\[\/justify\]/g, '<div class="text-justify w-full block my-2">$1</div>');

        // Tamanho (Inline)
        processed = processed.replace(/\[big\]([\s\S]*?)\[\/big\]/g, '<span class="text-xl align-middle">$1</span>');
        processed = processed.replace(/\[small\]([\s\S]*?)\[\/small\]/g, '<span class="text-xs text-slate-500 align-middle">$1</span>');

        // Estilo Extra (Inline)
        processed = processed.replace(/\[red\]([\s\S]*?)\[\/red\]/g, '<span class="text-rose-600 font-bold">$1</span>');

        // Listas
        processed = processed.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');
        processed = processed.replace(/(<li.*<\/li>)/g, '<ul class="my-2 pl-4 block">$1</ul>');

        // Markdown Básico
        processed = processed
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>');
            // REMOVIDO: .replace(/\n/g, '<br/>'); -> Deixamos o CSS whitespace-pre-wrap lidar com isso

        // 7. Restore Placeholders
        placeholders.forEach((ph, i) => {
            const token = `%%%PLACEHOLDER_${i}%%%`;
            processed = processed.split(token).join(ph);
        });

        return processed;
    };

    return (
        <div 
            className={`rich-content text-slate-800 leading-relaxed text-base whitespace-pre-wrap break-words ${className}`}
            dangerouslySetInnerHTML={{ __html: parseContent(content) }}
            style={{ wordBreak: 'break-word' }} // Garante que textos longos não estouram
        />
    );
};
