import React, { useState } from 'react';
import { Settings, Type, ZoomIn, ZoomOut, Eye, EyeOff, Sun, Moon, Volume2, Move, X } from 'lucide-react';
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
                className="fixed bottom-6 right-6 bg-brand-primary text-white p-4 rounded-full shadow-2xl hover:bg-brand-dark transition-all z-[9999] group animate-in slide-in-from-bottom-4"
                title="Opções de Acessibilidade"
            >
                <Settings size={28} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 z-[9999] animate-in slide-in-from-bottom-4 fade-in">
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
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Type size={14} /> Tamanho do Texto
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
                    <label className="text-xs font-bold text-slate-500 uppercase">Tipografia</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => update('fontType', 'sans')}
                            className={`p-2 text-xs rounded border ${config.fontType === 'sans' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-primary'}`}
                        >
                            Padrão
                        </button>
                        <button
                            onClick={() => update('fontType', 'serif')}
                            className={`p-2 text-xs font-serif rounded border ${config.fontType === 'serif' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-primary'}`}
                        >
                            Serifa
                        </button>
                        <button
                            onClick={() => update('fontType', 'dyslexic')}
                            className={`p-2 text-xs rounded border ${config.fontType === 'dyslexic' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-primary'}`}
                            style={{ fontFamily: 'OpenDyslexic, sans-serif' }}
                        >
                            Dislexia
                        </button>
                    </div>
                </div>

                {/* 3. Contraste e Tema */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Sun size={14} /> Contraste & Tema
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => update('theme', 'light')}
                            className={`p-2 text-xs rounded border flex items-center gap-2 ${config.theme === 'light' ? 'bg-emerald-100 text-emerald-800 border-emerald-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Sun size={14} /> Claro
                        </button>
                        <button
                            onClick={() => update('theme', 'dark')}
                            className={`p-2 text-xs rounded border flex items-center gap-2 ${config.theme === 'dark' ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
                        >
                            <Moon size={14} /> Escuro
                        </button>
                        <button
                            onClick={() => update('theme', 'sepia')}
                            className={`p-2 text-xs rounded border flex items-center gap-2 ${config.theme === 'sepia' ? 'bg-[#f4e4bc] text-[#4f3e1e] border-[#d8c8a0]' : 'bg-[#fff8e1] border-slate-200 hover:bg-[#fff0c0]'}`}
                        >
                            <Eye size={14} /> Sépia
                        </button>
                        <button
                            onClick={() => update('theme', 'high-contrast')}
                            className={`p-2 text-xs rounded border flex items-center gap-2 font-bold ${config.theme === 'high-contrast' ? 'bg-yellow-400 text-black border-black' : 'bg-black text-yellow-400 border-slate-200 hover:bg-slate-900'}`}
                        >
                            <Sun size={14} /> Alto Contraste
                        </button>
                    </div>
                </div>

                {/* 4. Espaçamento */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Move size={14} /> Espaçamento
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

                {/* 5. Ferramentas Neurodivergentes */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <EyeOff size={16} className="text-slate-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Modo Foco (Zen)</span>
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
                            <EyeOff size={16} className="text-slate-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ocultar Cronômetro</span>
                        </div>
                        <button
                            onClick={() => update('hideTimer', !config.hideTimer)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${config.hideTimer ? 'bg-brand-primary' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.hideTimer ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Volume2 size={16} className="text-slate-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Leitor de Tela (TTS)</span>
                        </div>
                        <button
                            onClick={() => update('textToSpeech', !config.textToSpeech)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${config.textToSpeech ? 'bg-brand-primary' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${config.textToSpeech ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
