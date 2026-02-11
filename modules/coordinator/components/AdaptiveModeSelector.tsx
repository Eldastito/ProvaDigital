import React from 'react';
import { Brain, Cpu, Zap, Info } from 'lucide-react';
import { AdaptiveMode } from '../../../services/offlineAdaptiveEngine';

interface AdaptiveModeSelectorProps {
    selectedMode: AdaptiveMode;
    onModeChange: (mode: AdaptiveMode) => void;
    deviceCapability?: {
        supportsLocal: boolean;
        recommendedMode: AdaptiveMode;
        reason: string;
    };
}

export const AdaptiveModeSelector: React.FC<AdaptiveModeSelectorProps> = ({
    selectedMode,
    onModeChange,
    deviceCapability
}) => {
    const modes = [
        {
            id: 'LOCAL' as AdaptiveMode,
            name: 'Adaptação Local (TRI)',
            icon: <Brain size={20} className="text-purple-600" />,
            description: 'Algoritmo TRI roda no dispositivo do aluno',
            pros: ['Verdadeiramente adaptativo', 'Personalizado para cada aluno', 'Experiência idêntica ao online'],
            cons: ['Requer dispositivo potente', 'Maior consumo de bateria'],
            recommended: true,
            badge: 'Padrão'
        },
        {
            id: 'HYBRID' as AdaptiveMode,
            name: 'Modo Híbrido (Automático)',
            icon: <Cpu size={20} className="text-blue-600" />,
            description: 'Detecta capacidade e escolhe melhor modo',
            pros: ['Funciona em qualquer dispositivo', 'Otimizado automaticamente', 'Fallback inteligente'],
            cons: ['Pode usar modo pré-computado em dispositivos fracos'],
            recommended: false,
            badge: 'Plano B'
        },
        {
            id: 'PRECOMPUTED' as AdaptiveMode,
            name: 'Pré-Computado (Fixo)',
            icon: <Zap size={20} className="text-green-600" />,
            description: 'Sequência de questões gerada antecipadamente',
            pros: ['Funciona em qualquer dispositivo', 'Baixo consumo de recursos', 'Rápido'],
            cons: ['Não reage às respostas', 'Menos personalizado'],
            recommended: false,
            badge: 'Simples'
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                    🎯 Modo de Adaptação Offline
                </h3>
                {deviceCapability && (
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                        <Info size={12} />
                        {deviceCapability.reason}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3">
                {modes.map((mode) => {
                    const isSelected = selectedMode === mode.id;
                    const isRecommended = deviceCapability?.recommendedMode === mode.id;

                    return (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => onModeChange(mode.id)}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${isSelected
                                    ? 'border-brand-primary bg-brand-primary/5'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {mode.icon}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-slate-900">
                                            {mode.name}
                                        </span>
                                        {mode.recommended && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                                                {mode.badge}
                                            </span>
                                        )}
                                        {!mode.recommended && mode.badge && (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                                                {mode.badge}
                                            </span>
                                        )}
                                        {isRecommended && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                Recomendado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">
                                        {mode.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="font-medium text-green-700 mb-1">✓ Vantagens:</p>
                                            <ul className="space-y-0.5">
                                                {mode.pros.map((pro, idx) => (
                                                    <li key={idx} className="text-slate-600">• {pro}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-medium text-orange-700 mb-1">⚠ Limitações:</p>
                                            <ul className="space-y-0.5">
                                                {mode.cons.map((con, idx) => (
                                                    <li key={idx} className="text-slate-600">• {con}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900">
                        <p className="font-medium mb-1">Como funciona:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li><strong>Local:</strong> Algoritmo TRI roda no tablet/app do aluno</li>
                            <li><strong>Híbrido:</strong> Detecta capacidade e escolhe automaticamente</li>
                            <li><strong>Pré-Computado:</strong> Sequência fixa gerada ao baixar prova</li>
                        </ul>
                        <p className="mt-2 text-blue-700">
                            💡 <strong>Recomendação:</strong> Use "Local" como padrão e "Híbrido" como plano B para garantir compatibilidade.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
