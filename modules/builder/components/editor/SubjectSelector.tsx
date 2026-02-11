import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { BRAZILIAN_SUBJECTS } from '../../constants';

interface SubjectSelectorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
    value,
    onChange,
    label = "Disciplina",
    className = ""
}) => {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customSubject, setCustomSubject] = useState('');

    // Verificar se o valor atual é uma disciplina customizada
    const isCustomSubject = value && !BRAZILIAN_SUBJECTS.includes(value);

    const handleSelectChange = (newValue: string) => {
        if (newValue === '__CUSTOM__') {
            setShowCustomInput(true);
            setCustomSubject('');
        } else {
            setShowCustomInput(false);
            onChange(newValue);
        }
    };

    const handleAddCustom = () => {
        if (customSubject.trim()) {
            onChange(customSubject.trim());
            setShowCustomInput(false);
            setCustomSubject('');
        }
    };

    const handleRemoveCustom = () => {
        onChange('');
        setShowCustomInput(false);
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>

            {isCustomSubject && !showCustomInput ? (
                // Mostrar disciplina customizada com opção de remover
                <div className="flex gap-2">
                    <div className="flex-1 border rounded-lg p-2 text-sm bg-blue-50 border-blue-200 flex items-center justify-between">
                        <span className="text-slate-700">{value}</span>
                        <span className="text-xs text-blue-600 font-medium">Customizada</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemoveCustom}
                        className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Remover disciplina customizada"
                    >
                        <X size={16} className="text-slate-600" />
                    </button>
                </div>
            ) : showCustomInput ? (
                // Input para adicionar nova disciplina
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Digite o nome da disciplina..."
                        className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={handleAddCustom}
                        disabled={!customSubject.trim()}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Adicionar
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowCustomInput(false)}
                        className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            ) : (
                // Select padrão com opção de adicionar
                <select
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    value={value}
                    onChange={e => handleSelectChange(e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {BRAZILIAN_SUBJECTS.map(subj => (
                        <option key={subj} value={subj}>{subj}</option>
                    ))}
                    <option value="__CUSTOM__" className="font-bold text-brand-primary">
                        + Adicionar nova disciplina
                    </option>
                </select>
            )}

            {!isCustomSubject && !showCustomInput && value && (
                <p className="text-xs text-slate-500 mt-1">
                    Não encontrou sua disciplina? Selecione "+ Adicionar nova disciplina"
                </p>
            )}
        </div>
    );
};
