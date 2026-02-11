import React, { RefObject, useState } from 'react';
import { Brain, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DifficultyLevel, QualityStandard, DifficultyLevelConfig } from '../../../../types';
import BNCCCodeSuggester from '../BNCCCodeSuggester';
import { SubjectSelector } from './SubjectSelector';
import { AdaptiveConfigPanel } from './AdaptiveConfigPanel';

interface AIGenerationPanelProps {
    form: {
        subject: string;
        difficulty: DifficultyLevel;
    };
    setForm: (form: any) => void;
    aiQuantity: number;
    setAiQuantity: (qty: number) => void;
    aiContext: string;
    setAiContext: (ctx: string) => void;
    fileInputRef: RefObject<HTMLInputElement>;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGenerate: () => void;
    aiLoading: boolean;
    // Multi-level props
    useMultiLevel: boolean;
    setUseMultiLevel: (value: boolean) => void;
    topic: string;
    setTopic: (value: string) => void;
    bnccCodes: string[];
    setBnccCodes: (codes: string[]) => void;
    examType: 'LINEAR' | 'ADAPTIVE';
    setExamType: (type: 'LINEAR' | 'ADAPTIVE') => void;
    standards: QualityStandard[];
    setStandards: (standards: QualityStandard[]) => void;
    levelConfigs: DifficultyLevelConfig[];
    setLevelConfigs: (configs: DifficultyLevelConfig[]) => void;
    generationProgress: number;
    onClearForm?: () => void;
}

export const AIGenerationPanel: React.FC<AIGenerationPanelProps> = ({
    form,
    setForm,
    aiQuantity,
    setAiQuantity,
    aiContext,
    setAiContext,
    fileInputRef,
    handleFileUpload,
    handleGenerate,
    aiLoading,
    // Multi-level props
    useMultiLevel,
    setUseMultiLevel,
    topic,
    setTopic,
    bnccCodes,
    setBnccCodes,
    examType,
    setExamType,
    standards,
    setStandards,
    levelConfigs,
    setLevelConfigs,
    generationProgress
}) => {
    // Remove local state declarations since they're now coming from props
    const totalQuestions = levelConfigs
        .filter(c => c.enabled)
        .reduce((sum, c) => sum + c.quantity, 0);

    const toggleStandard = (standard: QualityStandard) => {
        if (standards.includes(standard)) {
            setStandards(standards.filter(s => s !== standard));
        } else {
            setStandards([...standards, standard]);
        }
    };

    const updateLevelConfig = (index: number, field: 'enabled' | 'quantity', value: boolean | number) => {
        const newConfigs = [...levelConfigs];
        if (field === 'enabled') {
            newConfigs[index].enabled = value as boolean;
        } else {
            newConfigs[index].quantity = value as number;
        }
        setLevelConfigs(newConfigs);
    };

    const getLevelLabel = (level: string) => {
        return level.replace('_', ' ').toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 text-sm text-sky-900">
                <p className="font-semibold flex items-center gap-2">
                    <Brain size={16} /> IA SAEB/INEP + BNCC + TRI
                </p>
                Faça upload de materiais em <b>PDF, Word (DOCX), Excel ou TXT</b>. A IA seguirá os padrões do INEP/BNCC e estimará parâmetros TRI automaticamente.
            </div>

            {/* Toggle: Modo Simples vs Multi-Nível */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={useMultiLevel}
                        onChange={(e) => setUseMultiLevel(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">
                        🎯 Modo Avançado: Geração Multi-Nível com Validação Dupla
                    </span>
                </label>
            </div>

            {!useMultiLevel ? (
                /* MODO SIMPLES (Original) */
                <>
                    <div className="grid grid-cols-3 gap-6">
                        <SubjectSelector
                            value={form.subject}
                            onChange={(subject) => setForm({ ...form, subject })}
                            label="Disciplina Alvo"
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nível Desejado</label>
                            <select
                                className="w-full border rounded-lg p-2 text-sm"
                                value={form.difficulty}
                                onChange={e => setForm({ ...form, difficulty: e.target.value as DifficultyLevel })}
                            >
                                <option value="FACIL">Fácil</option>
                                <option value="MEDIO">Médio</option>
                                <option value="DIFICIL">Difícil</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. Questões</label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                className="w-full border rounded-lg p-2 text-sm"
                                value={aiQuantity}
                                onChange={e => setAiQuantity(parseInt(e.target.value) || 1)}
                            />
                        </div>
                    </div>
                </>
            ) : (
                /* MODO MULTI-NÍVEL (Novo) */
                <div className="space-y-6">
                    {/* Disciplina e Tema */}
                    <div className="grid grid-cols-2 gap-4">
                        <SubjectSelector
                            value={form.subject}
                            onChange={(subject) => setForm({ ...form, subject })}
                            label="📚 Disciplina"
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">📖 Tema</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2 text-sm"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="Ex: Equações de 2º Grau"
                            />
                        </div>
                    </div>

                    {/* BNCC Code Suggester */}
                    {form.subject && topic && (
                        <BNCCCodeSuggester
                            subject={form.subject}
                            topic={topic}
                            selectedCodes={bnccCodes}
                            onCodesChange={setBnccCodes}
                        />
                    )}

                    {/* Tipo de Avaliação */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">📊 Tipo de Avaliação</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={examType === 'LINEAR'}
                                    onChange={() => setExamType('LINEAR')}
                                />
                                <span className="text-sm">Prova Linear (questões fixas)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={examType === 'ADAPTIVE'}
                                    onChange={() => setExamType('ADAPTIVE')}
                                />
                                <span className="text-sm">Prova Adaptativa (TRI/CAT)</span>
                            </label>
                        </div>
                        {examType === 'ADAPTIVE' && (
                            <div className="mt-2 text-xs text-slate-600 bg-blue-50 p-2 rounded">
                                💡 Recomendado: Banco de {totalQuestions} questões para prova de {Math.floor(totalQuestions / 3)} questões
                            </div>
                        )}
                    </div>

                    {/* Distribuição de Dificuldade */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            🎚️ Distribuição de Dificuldade
                        </label>
                        <div className="space-y-2">
                            {levelConfigs.map((config, idx) => (
                                <div key={config.level} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        checked={config.enabled}
                                        onChange={(e) => updateLevelConfig(idx, 'enabled', e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="flex-1 text-sm font-medium">
                                        {getLevelLabel(config.level)}
                                    </span>
                                    <input
                                        type="number"
                                        value={config.quantity}
                                        onChange={(e) => updateLevelConfig(idx, 'quantity', parseInt(e.target.value) || 0)}
                                        disabled={!config.enabled}
                                        className="w-16 border rounded px-2 py-1 text-sm disabled:bg-slate-100"
                                        min="0"
                                    />
                                    <span className="text-xs text-slate-500 w-32">
                                        (TRI: {config.triRange[0]} a {config.triRange[1]})
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 text-sm font-medium text-blue-600 flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            Total: {totalQuestions} questões | {examType === 'ADAPTIVE' ? `Prova: ${Math.floor(totalQuestions / 3)} questões` : 'Prova Linear'}
                        </div>
                    </div>

                    {/* Padrões de Qualidade */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">📋 Padrões de Qualidade</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={standards.includes('INEP')}
                                    onChange={() => toggleStandard('INEP')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">INEP/SAEB (padrão brasileiro)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={standards.includes('BNCC')}
                                    onChange={() => toggleStandard('BNCC')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">BNCC (Base Nacional Comum Curricular)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={standards.includes('OCDE')}
                                    onChange={() => toggleStandard('OCDE')}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">OCDE/PISA (avaliação internacional)</span>
                            </label>
                        </div>
                        {standards.length === 0 && (
                            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} />
                                Selecione pelo menos um padrão de qualidade
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Contexto (comum para ambos os modos) */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    📄 Contexto Adicional (Opcional)
                </label>
                <textarea
                    className="w-full border rounded-lg p-3 text-sm h-32 font-mono mb-2"
                    value={aiContext}
                    onChange={e => setAiContext(e.target.value)}
                    placeholder="Cole aqui o texto ou faça upload de um arquivo para análise..."
                />
                <input
                    type="file"
                    accept=".txt,.csv,.md,.pdf,.docx,.xlsx"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-white bg-brand-primary hover:bg-sky-700 px-4 py-2 rounded-lg flex items-center gap-2 w-fit transition shadow-sm font-bold"
                >
                    <Upload size={16} /> Carregar PDF, Word ou Excel
                </button>
            </div>

            {/* Botão de Geração */}
            <button
                onClick={handleGenerate}
                disabled={aiLoading || (useMultiLevel && (totalQuestions === 0 || standards.length === 0))}
                className="w-full py-3 btn-gradient rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01]"
            >
                {aiLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        {useMultiLevel ? `Gerando ${totalQuestions} Questões...` : 'Processando Documento...'}
                    </>
                ) : (
                    <>
                        <Brain size={20} />
                        {useMultiLevel
                            ? `🧠 Gerar Banco de ${totalQuestions} Questões com Validação Dupla`
                            : '🧠 Gerar Itens Padrão INEP'
                        }
                    </>
                )}
            </button>

            {/* Barra de Progresso */}
            {aiLoading && generationProgress > 0 && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">
                            {generationProgress < 50 ? '📝 Gerando questões...' :
                                generationProgress < 60 ? '🔍 Validando qualidade...' :
                                    generationProgress < 80 ? '📋 Validando padrões...' :
                                        generationProgress < 90 ? '📄 Gerando documentação...' :
                                            '✅ Finalizando...'}
                        </span>
                        <span className="font-bold text-blue-600">{generationProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${generationProgress}%` }}
                        />
                    </div>
                    <div className="text-xs text-slate-500 text-center">
                        {useMultiLevel && (
                            <>
                                {generationProgress < 50 && `Gerando ${totalQuestions} questões em múltiplos níveis...`}
                                {generationProgress >= 50 && generationProgress < 60 && 'Analisando cobertura de habilidades e distribuição...'}
                                {generationProgress >= 60 && generationProgress < 80 && `Validando conformidade com ${standards.join('/')}...`}
                                {generationProgress >= 80 && generationProgress < 90 && 'Criando documentação para capa da prova...'}
                                {generationProgress >= 90 && 'Salvando questões no banco de dados...'}
                            </>
                        )}
                    </div>
                </div>
            )}

            {useMultiLevel && (
                <div className="text-xs text-slate-500 text-center">
                    ⚡ Validação automática em 2 fases: Qualidade Técnica + Padrões {standards.join('/')}
                </div>
            )}
        </div>
    );
};
