import React, { useState } from 'react';
import { Settings, Info, Zap, Award, Database, Sliders } from 'lucide-react';
import { DifficultyLevelConfig } from '../../../../types';
import { calculateDistribution } from '../../utils/adaptiveConfig';

interface AdaptiveConfigPanelProps {
    bankSize: number;
    questionsPerStudent: number;
    onConfigChange: (config: { bankSize: number; questionsPerStudent: number }) => void;
    setLevelConfigs?: (configs: DifficultyLevelConfig[]) => void;
}

type PresetType = 'quick' | 'standard' | 'gold' | 'complete' | 'custom';

interface Preset {
    id: PresetType;
    name: string;
    icon: React.ReactNode;
    bankSize: number;
    questionsPerStudent: number;
    description: string;
    recommended: string;
}

const PRESETS: Preset[] = [
    {
        id: 'quick',
        name: 'Diagnóstica Rápida',
        icon: <Zap size={20} className="text-yellow-600" />,
        bankSize: 20,
        questionsPerStudent: 10,
        description: 'Avaliação inicial rápida',
        recommended: 'Diagnóstico inicial, sondagem'
    },
    {
        id: 'standard',
        name: 'Padrão',
        icon: <Settings size={20} className="text-blue-600" />,
        bankSize: 30,
        questionsPerStudent: 15,
        description: 'Provas bimestrais regulares',
        recommended: 'Avaliações bimestrais, provas mensais'
    },
    {
        id: 'gold',
        name: 'Padrão Ouro',
        icon: <Award size={20} className="text-amber-500" />,
        bankSize: 60,
        questionsPerStudent: 25,
        description: 'Simulados SAEB/ENEM',
        recommended: 'Simulados, avaliações externas'
    },
    {
        id: 'complete',
        name: 'Banco Completo',
        icon: <Database size={20} className="text-purple-600" />,
        bankSize: 100,
        questionsPerStudent: 35,
        description: 'Avaliação anual robusta',
        recommended: 'Avaliações anuais, banco institucional'
    }
];

export const AdaptiveConfigPanel: React.FC<AdaptiveConfigPanelProps> = ({
    bankSize,
    questionsPerStudent,
    onConfigChange,
    setLevelConfigs
}) => {
    const [selectedPreset, setSelectedPreset] = useState<PresetType>('gold');
    const [showCustom, setShowCustom] = useState(false);

    const handlePresetSelect = (preset: Preset) => {
        setSelectedPreset(preset.id);
        setShowCustom(false);
        onConfigChange({
            bankSize: preset.bankSize,
            questionsPerStudent: preset.questionsPerStudent
        });

        if (setLevelConfigs) {
            const newDistribution = calculateDistribution(preset.bankSize);
            setLevelConfigs(newDistribution);
        }
    };

    const handleCustomChange = (field: 'bankSize' | 'questionsPerStudent', value: number) => {
        setSelectedPreset('custom');
        setShowCustom(true);

        const newBankSize = field === 'bankSize' ? value : bankSize;
        const newQuestionsPerStudent = field === 'questionsPerStudent' ? value : questionsPerStudent;

        onConfigChange({
            bankSize: newBankSize,
            questionsPerStudent: newQuestionsPerStudent
        });

        if (field === 'bankSize' && setLevelConfigs) {
            const newDistribution = calculateDistribution(value);
            setLevelConfigs(newDistribution);
        }
    };

    const currentPreset = PRESETS.find(p => p.id === selectedPreset);
    const percentageAnswered = Math.round((questionsPerStudent / bankSize) * 100);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Sliders size={20} className="text-brand-primary" />
                <h3 className="text-sm font-bold text-slate-800">
                    Configuração do Banco de Questões
                </h3>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-3">
                {PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className={`p-3 border-2 rounded-lg text-left transition-all ${isSelected
                                ? 'border-brand-primary bg-brand-primary/5'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-start gap-2 mb-2">
                                {preset.icon}
                                <div className="flex-1">
                                    <div className="font-bold text-sm text-slate-900">
                                        {preset.name}
                                        {preset.id === 'gold' && (
                                            <span className="ml-1 text-amber-500">⭐</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-0.5">
                                        {preset.description}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">
                                    {preset.bankSize} questões
                                </span>
                                <span className="text-slate-500">
                                    {preset.questionsPerStudent} por aluno
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Custom Controls */}
            <button
                type="button"
                onClick={() => setShowCustom(!showCustom)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
                {showCustom ? '▼' : '▶'} Personalizar Configuração
            </button>

            {showCustom && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tamanho do Banco: {bankSize} questões
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="200"
                            step="5"
                            value={bankSize}
                            onChange={(e) => handleCustomChange('bankSize', parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>10</span>
                            <span>200</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Questões por Aluno: {questionsPerStudent} questões
                        </label>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="1"
                            value={questionsPerStudent}
                            onChange={(e) => handleCustomChange('questionsPerStudent', parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>5</span>
                            <span>50</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900">
                        <p className="font-medium mb-1">Como funciona:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>
                                Cada aluno responderá <strong>{questionsPerStudent} questões</strong> (~{percentageAnswered}% do banco)
                            </li>
                            <li>
                                Questões selecionadas <strong>adaptativamente</strong> por TRI
                            </li>
                            <li>
                                Banco de <strong>{bankSize} questões</strong> garante variedade
                            </li>
                        </ul>
                        {currentPreset && currentPreset.id !== 'custom' && (
                            <p className="mt-2 text-blue-700">
                                💡 <strong>Recomendado para:</strong> {currentPreset.recommended}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
