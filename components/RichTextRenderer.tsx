
import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

interface RichTextRendererProps {
    content: string;
    className?: string;
    onLibrasDetected?: (url: string) => void;
}

export const RichTextRenderer = ({ content, className = '', onLibrasDetected }: RichTextRendererProps) => {
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

    // Detect Libras URLs and notify parent
    useEffect(() => {
        if (!content || !onLibrasDetected) return;
        const librasRegex = /\[libras\]([\s\S]*?)\[\/libras\]/gi;
        const match = librasRegex.exec(content);
        if (match && match[1]) {
            onLibrasDetected(match[1].trim());
        }
    }, [content, onLibrasDetected]);

    const parseContent = (text: string) => {
        if (!text) return '';

        const placeholders: string[] = [];
        const pushPlaceholder = (str: string) => {
            placeholders.push(str);
            return `%%%PLACEHOLDER_${placeholders.length - 1}%%%`;
        };

        let processed = text;

        // 0. Extract Libras Tags (NEW - Hide from UI as they are rendered in PiP)
        processed = processed.replace(/\[libras\]([\s\S]*?)\[\/libras\]/gi, '');

        // 0.1 Extract Multimedia Tags (NEW)
        // Image [img]url[/img]
        processed = processed.replace(/\[img\]([\s\S]*?)\[\/img\]/g, (match, url) => {
            return pushPlaceholder(
                `<div class="my-4 flex justify-center">
                    <img src="${url.trim()}" class="max-w-full rounded-lg shadow-md border border-slate-200" alt="Imagem da questão" onerror="this.style.display='none'" />
                </div>`
            );
        });

        // Video [video]url[/video] - Supports YouTube and direct MP4
        processed = processed.replace(/\[video\]([\s\S]*?)\[\/video\]/g, (match, url) => {
            const cleanUrl = url.trim();
            const isYouTube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');

            if (isYouTube) {
                let videoId = '';
                if (cleanUrl.includes('v=')) videoId = cleanUrl.split('v=')[1].split('&')[0];
                else if (cleanUrl.includes('youtu.be/')) videoId = cleanUrl.split('youtu.be/')[1].split('?')[0];

                return pushPlaceholder(
                    `<div class="my-4 aspect-video rounded-lg overflow-hidden border border-slate-200 shadow-md">
                        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                    </div>`
                );
            }

            return pushPlaceholder(
                `<div class="my-4 flex justify-center">
                    <video src="${cleanUrl}" controls class="max-w-full rounded-lg shadow-md"></video>
                </div>`
            );
        });

        // Audio [audio]url[/audio]
        processed = processed.replace(/\[audio\]([\s\S]*?)\[\/audio\]/g, (match, url) => {
            return pushPlaceholder(
                `<div class="my-4 flex justify-center w-full">
                    <audio src="${url.trim()}" controls class="w-full max-w-md"></audio>
                </div>`
            );
        });

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
            return pushPlaceholder(`<code class="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-mono text-sm border border-slate-200 dark:border-slate-700 inline-block align-middle">${escaped}</code>`);
        });

        // 3. Extract Math Blocks ($$ ... $$)
        processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, texContent) => {
            let html = texContent;
            if ((window as any).katex) {
                try {
                    html = (window as any).katex.renderToString(texContent, {
                        throwOnError: false,
                        displayMode: true,
                        output: 'html'
                    });
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

        // Alinhamento
        processed = processed.replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div class="text-center w-full block my-2">$1</div>');
        processed = processed.replace(/\[right\]([\s\S]*?)\[\/right\]/g, '<div class="text-right w-full block my-2">$1</div>');
        processed = processed.replace(/\[justify\]([\s\S]*?)\[\/justify\]/g, '<div class="text-justify w-full block my-2">$1</div>');

        // Tamanho
        processed = processed.replace(/\[big\]([\s\S]*?)\[\/big\]/g, '<span class="text-xl align-middle">$1</span>');
        processed = processed.replace(/\[small\]([\s\S]*?)\[\/small\]/g, '<span class="text-xs opacity-70 align-middle">$1</span>');

        // Estilo Extra
        processed = processed.replace(/\[red\]([\s\S]*?)\[\/red\]/g, '<span class="text-rose-600 font-bold">$1</span>');

        // Listas
        processed = processed.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');
        processed = processed.replace(/(<li.*<\/li>)/g, '<ul class="my-2 pl-4 block">$1</ul>');

        // Markdown Básico
        processed = processed
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<u>$1</u>');

        // 7. Restore Placeholders
        placeholders.forEach((ph, i) => {
            const token = `%%%PLACEHOLDER_${i}%%%`;
            processed = processed.split(token).join(ph);
        });

        return processed;
    };

    // 🔒 SECURITY: Sanitize HTML before rendering to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(parseContent(content), {
        // Allow safe HTML tags
        ALLOWED_TAGS: [
            'div', 'span', 'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
            'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'img', 'video', 'audio', 'iframe', 'a'
        ],
        // Allow safe attributes
        ALLOWED_ATTR: [
            'class', 'style', 'src', 'alt', 'width', 'height',
            'controls', 'frameborder', 'allowfullscreen', 'href', 'target',
            'onerror' // Needed for image fallback
        ],
        // Allow specific iframe sources (YouTube only)
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|youtube):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        // Keep safe CSS
        ALLOW_DATA_ATTR: false,
        // Return as string
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false
    });

    return (
        <div
            className={`rich-content text-slate-800 dark:text-inherit leading-relaxed text-base whitespace-pre-wrap break-words ${className}`}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            style={{ wordBreak: 'break-word' }}
        />
    );
};
