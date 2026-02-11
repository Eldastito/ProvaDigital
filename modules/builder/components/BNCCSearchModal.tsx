import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Check } from 'lucide-react';
import { searchBNCCCodes, getAvailableSubjects, getAvailableYears, BNCCCode } from '../../../constants/bnccCodes';

interface BNCCSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (codes: string[]) => void;
    currentSubject?: string;
    alreadySelected?: string[];
}

export const BNCCSearchModal: React.FC<BNCCSearchModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentSubject,
    alreadySelected = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        subject: currentSubject || '',
        stage: '',
        year: ''
    });
    const [results, setResults] = useState<BNCCCode[]>([]);

    // Atualizar resultados quando busca ou filtros mudarem
    useEffect(() => {
        if (searchQuery.length >= 2 || filters.subject || filters.stage || filters.year) {
            const searchResults = searchBNCCCodes(searchQuery, filters);
            setResults(searchResults);
        } else {
            setResults([]);
        }
    }, [searchQuery, filters]);

    // Inicializar com códigos já selecionados
    useEffect(() => {
        if (isOpen) {
            setSelectedCodes(alreadySelected);
        }
    }, [isOpen, alreadySelected]);

    const toggleCode = (code: string) => {
        setSelectedCodes(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    const handleConfirm = () => {
        onSelect(selectedCodes);
        onClose();
    };

    const handleClear = () => {
        setSearchQuery('');
        setFilters({ subject: currentSubject || '', stage: '', year: '' });
        setSelectedCodes([]);
    };

    if (!isOpen) return null;

    const availableSubjects = getAvailableSubjects();
    const availableYears = getAvailableYears(filters.subject);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-slate-800">
                            🔍 Buscar Códigos BNCC
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-slate-600" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Busque por código, descrição ou palavra-chave..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                <Filter size={12} className="inline mr-1" />
                                Disciplina
                            </label>
                            <select
                                value={filters.subject}
                                onChange={(e) => setFilters({ ...filters, subject: e.target.value, year: '' })}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            >
                                <option value="">Todas</option>
                                {availableSubjects.map(subject => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Etapa</label>
                            <select
                                value={filters.stage}
                                onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            >
                                <option value="">Todas</option>
                                <option value="EF1">EF Anos Iniciais (1º-5º)</option>
                                <option value="EF2">EF Anos Finais (6º-9º)</option>
                                <option value="EM">Ensino Médio</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Ano</label>
                            <select
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                disabled={!filters.subject}
                            >
                                <option value="">Todos</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-6">
                    {searchQuery.length < 2 && !filters.subject && !filters.stage ? (
                        <div className="text-center py-12">
                            <Search size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm">
                                Digite pelo menos 2 caracteres ou selecione um filtro para buscar
                            </p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500 text-sm">
                                Nenhum código BNCC encontrado para "{searchQuery}"
                            </p>
                            <button
                                onClick={handleClear}
                                className="mt-4 text-sm text-brand-primary hover:underline"
                            >
                                Limpar busca
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="text-sm text-slate-600 mb-4">
                                {results.length} código{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                            </div>
                            {results.map((code) => {
                                const isSelected = selectedCodes.includes(code.code);
                                const isAlreadyAdded = alreadySelected.includes(code.code);

                                return (
                                    <label
                                        key={code.code}
                                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                                ? 'border-brand-primary bg-brand-primary/5'
                                                : isAlreadyAdded
                                                    ? 'border-green-300 bg-green-50'
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {isAlreadyAdded ? (
                                                    <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleCode(code.code)}
                                                        className="w-5 h-5 rounded border-slate-300"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-900">{code.code}</span>
                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                        {code.subject}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                        {code.year}
                                                    </span>
                                                    {isAlreadyAdded && (
                                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                                            Já adicionado
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed">
                                                    {code.description}
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            {selectedCodes.length} código{selectedCodes.length !== 1 ? 's' : ''} selecionado{selectedCodes.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={selectedCodes.length === 0}
                                className="px-6 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Adicionar {selectedCodes.length > 0 && `(${selectedCodes.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
