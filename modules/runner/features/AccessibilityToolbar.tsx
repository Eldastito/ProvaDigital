import React, { useState } from 'react';
import { Settings, Type, ZoomIn, ZoomOut, Eye, EyeOff, Sun, Moon, Volume2, Move, X, Clock, FileText, Eraser, MousePointer2, PenTool, Highlighter, Palette } from 'lucide-react';
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

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-4 bg-brand-primary text-white p-3 rounded-full shadow-xl hover:bg-brand-dark transition-all z-[40] group animate-in slide-in-from-bottom-4 opacity-90 hover:opacity-100"
                title="Opções de Acessibilidade"
            >
                <Settings size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-24 right-4 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 z-[50] animate-in slide-in-from-bottom-4 fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings size={18} className="text-brand-primary" />
                    Acessibilidade
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">

                {/* 1. Tamanho da Fonte */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase flex items-center gap-2 tracking-wider">
                        <Type size={14} className="text-brand-primary" /> Tamanho do Texto
                    </label>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                        <button
                            onClick={() => update('fontSize', Math.max(80, config.fontSize - 10))}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded transition flex-1 flex justify-center"
                        >
                            <ZoomOut size={18} />
                        </button>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200 w-12 text-center text-sm">
                            {config.fontSize}%
                        </span>
                        <button
                            onClick={() => update('fontSize', Math.min(200, config.fontSize + 10))}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded transition flex-1 flex justify-center"
                        >
                            <ZoomIn size={18} />
                        </button>
                    </div>
                </div>

                {/* 2. Tipo de Fonte */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Tipografia</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => update('fontType', 'sans')}
                            className={`p-2 text-xs font-bold rounded border transition-colors ${config.fontType === 'sans' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-primary'}`}
                        >
                            Padrão
                        </button>
                        <button
                            onClick={() => update('fontType', 'serif')}
                            className={`p-2 text-xs font-serif font-bold rounded border transition-colors ${config.fontType === 'serif' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-primary'}`}
                        >
                            Serifa
                        </button>
                        <button
                            onClick={() => update('fontType', 'dyslexic')}
                            className={`p-2 text-xs font-bold rounded border transition-colors ${config.fontType === 'dyslexic' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-primary'}`}
                            style={{ fontFamily: 'OpenDyslexic, sans-serif' }}
                        >
                            Dislexia
                        </button>
                    </div>
                </div>

                {/* 3. Contraste e Tema */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase flex items-center gap-2 tracking-wider">
                        <Sun size={14} className="text-brand-primary" /> Contraste & Tema
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => update('theme', 'light')}
                            className={`p-2 text-xs font-bold rounded border flex items-center gap-2 transition-colors ${config.theme === 'light' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                        >
                            <Sun size={14} /> Claro
                        </button>
                        <button
                            onClick={() => update('theme', 'dark')}
                            className={`p-2 text-xs font-bold rounded border flex items-center gap-2 transition-colors ${config.theme === 'dark' ? 'bg-slate-700 text-white border-slate-500 shadow-inner' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'}`}
                        >
                            <Moon size={14} /> Escuro
                        </button>
                        <button
                            onClick={() => update('theme', 'sepia')}
                            className={`p-2 text-xs font-bold rounded border flex items-center gap-2 transition-colors ${config.theme === 'sepia' ? 'bg-[#f4e4bc] text-[#4f3e1e] border-[#d8c8a0]' : 'bg-[#fff8e1] dark:bg-[#2d2a23] text-[#4f3e1e] dark:text-[#d8c8a0] border-slate-200 dark:border-[#4f3e1e] hover:bg-[#fff0c0]'}`}
                        >
                            <Eye size={14} /> Sépia
                        </button>
                        <button
                            onClick={() => update('theme', 'high-contrast')}
                            className={`p-2 text-xs rounded border flex items-center gap-2 font-black transition-colors ${config.theme === 'high-contrast' ? 'bg-yellow-400 text-black border-black ring-2 ring-yellow-400 ring-offset-1 dark:ring-offset-slate-900' : 'bg-black dark:bg-slate-950 text-yellow-400 border-slate-200 dark:border-yellow-900/50 hover:bg-slate-900'}`}
                        >
                            <Sun size={14} /> Alto Contraste
                        </button>
                    </div>
                </div>

                {/* 4. Altura da Linha */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase flex items-center gap-2 tracking-wider">
                        <Move size={14} className="text-brand-primary" /> Altura da Linha
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.1"
                        value={config.lineHeight}
                        onChange={(e) => update('lineHeight', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* 5. Espaçamento entre Letras */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase flex items-center gap-2 tracking-wider">
                        <Type size={14} className="text-brand-primary" /> Espaçamento entre Letras
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={config.letterSpacing}
                        onChange={(e) => update('letterSpacing', parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* 5. Ferramentas Neurodivergentes */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <EyeOff size={18} className="text-brand-primary dark:text-blue-400" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Modo Foco (Zen)</span>
                        </div>
                        <button
                            onClick={() => update('focusMode', !config.focusMode)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${config.focusMode ? 'bg-brand-primary' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.focusMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-brand-primary dark:text-blue-400" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Exibir Cronômetro</span>
                        </div>
                        <button
                            onClick={() => update('hideTimer', !config.hideTimer)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${!config.hideTimer ? 'bg-brand-primary' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${!config.hideTimer ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Volume2 size={18} className="text-brand-primary dark:text-blue-400" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Leitor de Tela (TTS)</span>
                        </div>
                        <button
                            onClick={() => update('textToSpeech', !config.textToSpeech)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${config.textToSpeech ? 'bg-brand-primary' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.textToSpeech ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* 6. Ferramentas de Estudo */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase flex items-center gap-2 tracking-wider">
                        <PenTool size={14} className="text-brand-primary" /> Ferramentas de Desenho
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            onClick={() => update('penMode', config.penMode === 'pen' ? 'none' : 'pen')}
                            className={`p-2 text-xs rounded border flex flex-col items-center gap-1 ${config.penMode === 'pen' ? 'bg-blue-100 text-blue-700 border-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            title="Caneta"
                        >
                            <PenTool size={16} />
                            <span className="text-[10px]">Caneta</span>
                        </button>
                        <button
                            onClick={() => update('penMode', config.penMode === 'highlighter' ? 'none' : 'highlighter')}
                            className={`p-2 text-xs rounded border flex flex-col items-center gap-1 ${config.penMode === 'highlighter' ? 'bg-yellow-100 text-yellow-700 border-yellow-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            title="Marca-texto"
                        >
                            <Highlighter size={16} />
                            <span className="text-[10px]">Marca-t</span>
                        </button>
                        <button
                            onClick={() => update('penMode', config.penMode === 'eraser' ? 'none' : 'eraser')}
                            className={`p-2 text-xs rounded border flex flex-col items-center gap-1 ${config.penMode === 'eraser' ? 'bg-pink-100 text-pink-700 border-pink-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            title="Borracha"
                        >
                            <Eraser size={16} />
                            <span className="text-[10px]">Borrar</span>
                        </button>
                        <button
                            onClick={() => update('showScratchpad', !config.showScratchpad)}
                            className={`p-2 text-xs rounded border flex flex-col items-center gap-1 ${config.showScratchpad ? 'bg-amber-100 text-amber-700 border-amber-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            title="Rascunho"
                        >
                            <FileText size={16} />
                            <span className="text-[10px]">Bloco</span>
                        </button>
                    </div>

                    {/* Controles de Cor Dinâmicos */}
                    {(config.penMode === 'pen' || config.penMode === 'highlighter') && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Palette size={10} /> Cor {config.penMode === 'pen' ? 'da Caneta' : 'do Marca-texto'}
                            </label>
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
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
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Espessura do traço / Borracha */}
                    {config.penMode !== 'none' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                                Espessura {config.penMode === 'eraser' ? 'da Borracha' : 'do Traço'}
                            </label>
                            <input
                                type="range"
                                min={config.penMode === 'eraser' ? 5 : 1}
                                max={config.penMode === 'eraser' ? 100 : 10}
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
