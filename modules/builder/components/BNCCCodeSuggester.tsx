import React, { useState } from 'react';
import { Plus, X, BookOpen } from 'lucide-react';
import { useSafeAppStore } from '../../../store/useAppStore';
import { BNCCSearchModal } from './BNCCSearchModal';

interface BNCCCodeSuggesterProps {
    subject: string;
    topic: string;
    selectedCodes: string[];
    onCodesChange: (codes: string[]) => void;
}

export default function BNCCCodeSuggester({
    subject,
    topic,
    selectedCodes,
    onCodesChange
}: BNCCCodeSuggesterProps) {
    const [showManualInput, setShowManualInput] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [manualCode, setManualCode] = useState('');

    const toggleCode = (code: string) => {
        if (selectedCodes.includes(code)) {
            onCodesChange(selectedCodes.filter(c => c !== code));
        } else {
            onCodesChange([...selectedCodes, code]);
        }
    };

    const addManualCode = () => {
        if (manualCode.trim() && !selectedCodes.includes(manualCode.trim())) {
            onCodesChange([...selectedCodes, manualCode.trim()]);
            setManualCode('');
            setShowManualInput(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                    🎯 Habilidades BNCC
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowSearchModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-medium hover:bg-brand-primary/90 transition-colors"
                    >
                        <Plus size={14} />
                        Buscar BNCC
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowManualInput(!showManualInput)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                    >
                        + Adicionar código
                    </button>
                </div>
            </div>

            {/* Manual Input */}
            {showManualInput && (
                <div className="flex gap-2 animate-in slide-in-from-top-1">
                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="Ex: EF09MA09"
                        className="flex-1 border rounded-lg p-2 text-sm uppercase"
                        onKeyPress={(e) => e.key === 'Enter' && addManualCode()}
                    />
                    <button
                        type="button"
                        onClick={addManualCode}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                        Adicionar
                    </button>
                </div>
            )}

            {/* Selected Codes List */}
            {selectedCodes.length > 0 ? (
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-600 font-medium mb-2">
                        Selecionados ({selectedCodes.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedCodes.map((code) => (
                            <span
                                key={code}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 text-xs font-medium"
                            >
                                {code}
                                <button
                                    type="button"
                                    onClick={() => toggleCode(code)}
                                    className="hover:text-red-500 transition-colors ml-1"
                                    title="Remover"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-xs text-slate-500 italic py-1">
                    Nenhuma habilidade selecionada. Use o botão "Buscar BNCC" acima.
                </div>
            )}

            {/* Modal for Manual Search */}
            <BNCCSearchModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                onSelect={(codes) => {
                    const newCodes = codes.filter(c => !selectedCodes.includes(c));
                    if (newCodes.length > 0) {
                        onCodesChange([...selectedCodes, ...newCodes]);
                    }
                }}
                currentSubject={subject}
                alreadySelected={selectedCodes}
            />
        </div>
    );
}
