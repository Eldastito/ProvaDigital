import React, { useState, useEffect } from 'react';
import { suggestBNCCCodes } from '../../../services/geminiService';
import { BNCCCodeSuggestion } from '../../../types';
import { useSafeAppStore } from '../../../store/useAppStore';

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
    const [suggestions, setSuggestions] = useState<BNCCCodeSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);

    // Buscar contexto do usuário logado
    const { currentUser, classes } = useSafeAppStore();

    // Detectar nível de ensino baseado nas turmas disponíveis
    const detectGradeLevel = (): string | undefined => {
        if (!classes || classes.length === 0) return undefined;

        // Pegar o series da primeira turma disponível
        const firstClass = classes[0];
        return firstClass.series; // Ex: "6º Ano", "1º Ano EM"
    };

    // Buscar sugestões quando subject ou topic mudarem
    useEffect(() => {
        if (subject && topic && topic.length > 3) {
            fetchSuggestions();
        }
    }, [subject, topic]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const gradeLevel = detectGradeLevel();
            const results = await suggestBNCCCodes(subject, topic, gradeLevel);
            setSuggestions(results);
        } catch (error) {
            console.error('Erro ao buscar sugestões BNCC:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

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
                <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                >
                    + Adicionar manualmente
                </button>
            </div>

            {/* Input manual */}
            {showManualInput && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="Ex: EF09MA09"
                        className="flex-1 border rounded-lg p-2 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && addManualCode()}
                    />
                    <button
                        type="button"
                        onClick={addManualCode}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                        Adicionar
                    </button>
                </div>
            )}

            {/* Sugestões da IA */}
            {loading ? (
                <div className="text-sm text-slate-500 italic">
                    🤖 Buscando sugestões...
                </div>
            ) : suggestions.length > 0 ? (
                <div className="space-y-2">
                    <div className="text-xs text-slate-600 font-medium">
                        💡 Sugestões da IA para "{topic}":
                    </div>
                    {suggestions.map((suggestion) => (
                        <label
                            key={suggestion.code}
                            className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedCodes.includes(suggestion.code)}
                                onChange={() => toggleCode(suggestion.code)}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-sm text-slate-900">
                                    {suggestion.code}
                                    <span className="ml-2 text-xs text-slate-500">
                                        ({suggestion.relevanceScore}% relevante)
                                    </span>
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                    {suggestion.description}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            ) : topic.length > 3 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-sm text-slate-600 mb-2">
                        ℹ️ Nenhuma sugestão encontrada para "{topic}"
                    </div>
                    <div className="text-xs text-slate-500">
                        Tente:
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Usar termos mais específicos</li>
                            <li>Verificar a disciplina selecionada</li>
                            <li>Adicionar manualmente usando o botão acima</li>
                        </ul>
                    </div>
                    <a
                        href="http://basenacionalcomum.mec.gov.br/implementacao/praticas/caderno-de-praticas/aprofundamentos/195-codigos-de-habilidades-bncc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                        🔍 Buscar códigos BNCC no site oficial
                    </a>
                </div>
            ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-slate-700 font-medium mb-1">
                        💡 Como obter sugestões de códigos BNCC:
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                        <p>1. Preencha a <strong>Disciplina</strong> acima</p>
                        <p>2. Digite um <strong>Tema</strong> (mínimo 4 caracteres)</p>
                        <p>3. A IA sugerirá códigos BNCC relevantes automaticamente</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-300">
                        <a
                            href="http://basenacionalcomum.mec.gov.br/implementacao/praticas/caderno-de-praticas/aprofundamentos/195-codigos-de-habilidades-bncc"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 underline"
                        >
                            🔍 Ou busque manualmente no site oficial da BNCC
                        </a>
                    </div>
                </div>
            )}

            {/* Códigos selecionados */}
            {selectedCodes.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-slate-600 font-medium mb-2">
                        Selecionados ({selectedCodes.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedCodes.map((code) => (
                            <span
                                key={code}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                                {code}
                                <button
                                    type="button"
                                    onClick={() => toggleCode(code)}
                                    className="hover:text-blue-900"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
