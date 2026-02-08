import React, { useState } from 'react';
import { Settings, Type, ZoomIn, ZoomOut, Eye, EyeOff, Sun, Moon, Volume2, Move, X, Clock, FileText, Eraser, MousePointer2, PenTool, Highlighter, Palette, Video } from 'lucide-react';
import { AccessibilityConfig, FontType, ThemeType } from './types';

interface AccessibilityToolbarProps {
    config: AccessibilityConfig;
    onChange: (newConfig: AccessibilityConfig) => void;
}

export const AccessibilityToolbar = ({ config, onChange }: AccessibilityToolbarProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const update = (key: keyof AccessibilityConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const isHighContrast = config.theme === 'high-contrast';

    const getBtnBase = (active: boolean) => {
        if (isHighContrast) {
            return active
                ? 'bg-yellow-400 text-black border-yellow-400 font-black'
                : 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-900/20 font-bold';
        }
        return active
            ? 'bg-brand-primary text-white border-brand-primary font-bold shadow-md'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold';
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-4 bg-brand-primary text-white p-3 rounded-full shadow-xl hover:bg-brand-dark transition-all z-[40] group animate-in slide-in-from-bottom-4 opacity-90 hover:opacity-100"
                title="Abrir Opções de Acessibilidade"
                aria-label="Abrir configurações de acessibilidade"
            >
                <Settings size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
        );
    }

    return (
        <div
            role="dialog"
            aria-labelledby="a11y-title"
            className={`fixed bottom-24 right-4 w-80 rounded-2xl shadow-xl border p-6 z-[50] animate-in slide-in-from-bottom-4 fade-in transition-colors duration-300 ${config.theme === 'high-contrast'
                ? 'bg-black border-yellow-400 text-yellow-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'
                }`}>
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 id="a11y-title" className={`font-bold flex items-center gap-2 ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-800 dark:text-white'}`}>
                    <Settings size={18} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary'} />
                    Acessibilidade
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className={`hover:scale-110 transition-transform ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                    aria-label="Fechar configurações"
                    title="Fechar"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">

                {/* 1. Tamanho da Fonte */}
                <div className="space-y-2">
                    <label htmlFor="zoom-slider" className={`text-[11px] font-black uppercase flex items-center gap-2 tracking-wider ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                        <Type size={14} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary'} /> Tamanho do Texto
                    </label>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <button
                            onClick={() => update('fontSize', Math.max(80, config.fontSize - 10))}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded transition flex-1 flex justify-center"
                            aria-label="Diminuir texto"
                            title="Diminuir"
                        >
                            <ZoomOut size={18} />
                        </button>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200 w-12 text-center text-sm" aria-live="polite">
                            {config.fontSize}%
                        </span>
                        <button
                            onClick={() => update('fontSize', Math.min(200, config.fontSize + 10))}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded transition flex-1 flex justify-center"
                            aria-label="Aumentar texto"
                            title="Aumentar"
                        >
                            <ZoomIn size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={`text-[11px] font-black uppercase tracking-wider ${isHighContrast ? 'text-yellow-400' : 'text-slate-700 dark:text-slate-200'}`}>Tipografia</label>
                    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Seleção de Fonte">
                        {(['sans', 'serif', 'dyslexic'] as FontType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => update('fontType', type)}
                                className={`p-2 text-xs rounded border transition-all ${getBtnBase(config.fontType === type)} ${type === 'serif' ? 'font-serif' : ''} ${type === 'dyslexic' ? 'font-dyslexic' : ''}`}
                                style={type === 'dyslexic' ? { fontFamily: 'OpenDyslexic, sans-serif' } : {}}
                                aria-pressed={config.fontType === type}
                                aria-label={`Fonte ${type === 'sans' ? 'Sem Serifa' : type === 'serif' ? 'Com Serifa' : 'Especial para Dislexia'}`}
                            >
                                {type === 'sans' ? 'Padrão' : type === 'serif' ? 'Serifa' : 'Dislexia'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Contraste e Tema */}
                <div className="space-y-2">
                    <label className={`text-[11px] font-black uppercase flex items-center gap-2 tracking-wider ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                        <Sun size={14} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary'} /> Contraste & Tema
                    </label>
                    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Seleção de Tema">
                        <button
                            onClick={() => update('theme', 'light')}
                            aria-pressed={config.theme === 'light'}
                            aria-label="Tema Claro"
                            className={`p-2 text-xs rounded border flex items-center gap-2 transition-all ${config.theme === 'light'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-500 font-bold'
                                : (isHighContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50')
                                }`}
                        >
                            <Sun size={14} /> Claro
                        </button>
                        <button
                            onClick={() => update('theme', 'dark')}
                            aria-pressed={config.theme === 'dark'}
                            aria-label="Tema Escuro"
                            className={`p-2 text-xs rounded border flex items-center gap-2 transition-all ${config.theme === 'dark'
                                ? 'bg-slate-700 text-white border-slate-400 font-bold shadow-inner'
                                : (isHighContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200')
                                }`}
                        >
                            <Moon size={14} /> Escuro
                        </button>
                        <button
                            onClick={() => update('theme', 'sepia')}
                            aria-pressed={config.theme === 'sepia'}
                            aria-label="Tema Sépia"
                            className={`p-2 text-xs font-bold rounded border flex items-center gap-2 transition-all ${config.theme === 'sepia'
                                ? 'bg-[#f4e4bc] text-[#4f3e1e] border-[#d8c8a0]'
                                : (isHighContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-[#fff8e1] dark:bg-[#2d2a23] text-[#4f3e1e] dark:text-[#d8c8a0] border-slate-200 dark:border-[#4f3e1e] hover:bg-[#fff0c0]')
                                }`}
                        >
                            <Eye size={14} /> Sépia
                        </button>
                        <button
                            onClick={() => update('theme', 'high-contrast')}
                            aria-pressed={config.theme === 'high-contrast'}
                            aria-label="Alto Contraste Amarelo"
                            className={`p-2 text-xs rounded border flex items-center gap-2 font-black transition-all ${config.theme === 'high-contrast'
                                ? 'bg-yellow-400 text-black border-yellow-400 ring-2 ring-yellow-400 ring-offset-1 dark:ring-offset-slate-900 shadow-lg'
                                : 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-900/20'
                                }`}
                        >
                            <Sun size={14} /> Alto Contraste
                        </button>
                    </div>
                </div>

                {/* 4. Altura da Linha */}
                <div className="space-y-2">
                    <label htmlFor="line-height-range" className={`text-[11px] font-black uppercase flex items-center gap-2 tracking-wider ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                        <Move size={14} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary'} /> Altura da Linha
                    </label>
                    <input
                        id="line-height-range"
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.1"
                        aria-label="Ajustar altura da linha"
                        value={config.lineHeight}
                        onChange={(e) => update('lineHeight', parseFloat(e.target.value))}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isHighContrast ? 'bg-yellow-400 accent-black' : 'bg-slate-200 dark:bg-slate-700'}`}
                    />
                </div>

                {/* 5. Espaçamento entre Letras */}
                <div className="space-y-2">
                    <label htmlFor="letter-spacing-range" className={`text-[11px] font-black uppercase flex items-center gap-2 tracking-wider ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                        <Type size={14} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary'} /> Espaçamento entre Letras
                    </label>
                    <input
                        id="letter-spacing-range"
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        aria-label="Ajustar espaçamento entre letras"
                        value={config.letterSpacing}
                        onChange={(e) => update('letterSpacing', parseFloat(e.target.value))}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isHighContrast ? 'bg-yellow-400 accent-black' : 'bg-slate-200 dark:bg-slate-700'}`}
                    />
                </div>

                {/* 5. Ferramentas Neurodivergentes */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <EyeOff size={18} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary dark:text-blue-400'} />
                            <span className={`text-sm font-bold ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-800 dark:text-slate-100'}`}>Modo Foco (Zen)</span>
                        </div>
                        <button
                            onClick={() => update('focusMode', !config.focusMode)}
                            aria-pressed={config.focusMode}
                            aria-label="Ativar Modo Foco"
                            className={`w-12 h-6 rounded-full transition-colors relative ${config.focusMode ? 'bg-brand-primary' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.focusMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary dark:text-blue-400'} />
                            <span className={`text-sm font-bold ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-800 dark:text-slate-100'}`}>Exibir Cronômetro</span>
                        </div>
                        <button
                            onClick={() => update('hideTimer', !config.hideTimer)}
                            aria-pressed={!config.hideTimer}
                            aria-label="Mostrar cronômetro"
                            className={`w-12 h-6 rounded-full transition-colors relative ${!config.hideTimer ? 'bg-brand-primary' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${!config.hideTimer ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Volume2 size={18} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary dark:text-blue-400'} />
                            <span className={`text-sm font-bold ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-800 dark:text-slate-100'}`}>Leitor de Tela (TTS)</span>
                        </div>
                        <button
                            onClick={() => update('textToSpeech', !config.textToSpeech)}
                            aria-pressed={config.textToSpeech}
                            aria-label="Ativar Leitor de Tela"
                            className={`w-12 h-6 rounded-full transition-colors relative ${config.textToSpeech ? 'bg-brand-primary' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.textToSpeech ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Video size={18} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary dark:text-blue-400'} />
                            <span className={`text-sm font-bold ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-800 dark:text-slate-100'}`}>Tradutor Libras</span>
                        </div>
                        <button
                            onClick={() => update('showLibrasWindow', !config.showLibrasWindow)}
                            disabled={!config.librasVideoUrl}
                            aria-pressed={config.showLibrasWindow}
                            aria-label="Ativar Janela de Libras"
                            className={`w-12 h-6 rounded-full transition-colors relative ${config.showLibrasWindow ? 'bg-brand-primary' : (config.librasVideoUrl ? 'bg-slate-300' : 'bg-slate-100 opacity-50 cursor-not-allowed')}`}
                            title={!config.librasVideoUrl ? "Nenhuma tradução disponível para esta questão" : "Ativar Tradução em Libras"}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.showLibrasWindow ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* 6. Ferramentas de Estudo */}
                <div className={`pt-4 border-t space-y-4 ${config.theme === 'high-contrast' ? 'border-yellow-400' : 'border-slate-200 dark:border-slate-700'}`}>
                    <label className={`text-[11px] font-black uppercase flex items-center gap-2 tracking-wider ${config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                        <PenTool size={14} className={config.theme === 'high-contrast' ? 'text-yellow-400' : 'text-brand-primary'} /> Ferramentas de Desenho
                    </label>
                    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Ferramentas Pedagógicas">
                        {[
                            { id: 'pen', icon: PenTool, label: 'Caneta' },
                            { id: 'highlighter', icon: Highlighter, label: 'Marca-t' },
                            { id: 'eraser', icon: Eraser, label: 'Borracha' },
                            { id: 'scratchpad', icon: FileText, label: 'Bloco' }
                        ].map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => tool.id === 'scratchpad' ? update('showScratchpad', !config.showScratchpad) : update('penMode', config.penMode === tool.id ? 'none' : tool.id)}
                                className={`p-2 text-xs rounded border flex flex-col items-center gap-1 transition-all ${(tool.id === 'scratchpad' ? config.showScratchpad : config.penMode === tool.id)
                                    ? getBtnBase(true)
                                    : getBtnBase(false)
                                    }`}
                                title={tool.label}
                                aria-label={tool.label}
                                aria-pressed={tool.id === 'scratchpad' ? config.showScratchpad : config.penMode === tool.id}
                            >
                                <tool.icon size={16} />
                                <span className="text-[10px]">{tool.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Controles de Cor Dinâmicos */}
                    {(config.penMode === 'pen' || config.penMode === 'highlighter') && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Palette size={10} /> Cor {config.penMode === 'pen' ? 'da Caneta' : 'do Marca-texto'}
                            </label>
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg" role="group" aria-label="Seleção de Cor">
                                {(config.penMode === 'pen'
                                    ? [
                                        '#3b82f6', // azul
                                        '#ef4444', // vermelho
                                        '#10b981', // verde
                                        '#f59e0b', // laranja
                                        '#8b5cf6', // roxo
                                        '#ec4899', // rosa
                                        '#991b1b', // bordô
                                        '#475569', // cinza
                                        '#000000'  // preto
                                    ]
                                    : ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#cbd5e1']
                                ).map(color => (
                                    <button
                                        key={color}
                                        onClick={() => update(config.penMode === 'pen' ? 'penColor' : 'markerColor', color)}
                                        className={`w-7 h-7 rounded-full border-2 transition-transform ${(config.penMode === 'pen' ? config.penColor : config.markerColor) === color
                                            ? 'border-brand-primary scale-110 shadow-sm'
                                            : 'border-white dark:border-slate-700 hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        aria-label={`Cor ${color}`}
                                        aria-pressed={(config.penMode === 'pen' ? config.penColor : config.markerColor) === color}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Espessura do traço / Borracha */}
                    {config.penMode !== 'none' && (
                        <div className="space-y-1">
                            <label htmlFor="thickness-range" className="text-[10px] font-bold text-slate-400 uppercase">
                                Espessura {config.penMode === 'eraser' ? 'da Borracha' : 'do Traço'}
                            </label>
                            <input
                                id="thickness-range"
                                type="range"
                                min={config.penMode === 'eraser' ? 5 : 1}
                                max={config.penMode === 'eraser' ? 100 : 10}
                                aria-label="Ajustar espessura da ferramenta"
                                value={config.penMode === 'eraser' ? config.eraserSize : config.strokeSize}
                                onChange={(e) => update(config.penMode === 'eraser' ? 'eraserSize' : 'strokeSize', parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

