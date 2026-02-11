import React from 'react';
import { QuestionType, DifficultyLevel } from '../../../../types';
import { translateQuestionType, translateDifficultyLevel } from '../../../../utils/translations';
import { SubjectSelector } from './SubjectSelector';

interface QuestionTypeSelectorProps {
    form: {
        subject: string;
        type: QuestionType;
        difficulty: DifficultyLevel;
    };
    setForm: (form: any) => void;
    handleTypeChange: (newType: QuestionType) => void;
}

export const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({ form, setForm, handleTypeChange }) => {
    return (
        <div className="grid grid-cols-3 gap-6">
            <SubjectSelector
                value={form.subject}
                onChange={(subject) => setForm({ ...form, subject })}
                label="Disciplina"
            />
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select className="w-full border rounded-lg p-2 text-sm" value={form.type} onChange={e => handleTypeChange(e.target.value as QuestionType)}>
                    <option value={QuestionType.MULTIPLE_CHOICE}>{translateQuestionType(QuestionType.MULTIPLE_CHOICE)}</option>
                    <option value={QuestionType.TRUE_FALSE}>{translateQuestionType(QuestionType.TRUE_FALSE)}</option>
                    <option value={QuestionType.ESSAY}>{translateQuestionType(QuestionType.ESSAY)}</option>
                    <option value={QuestionType.REDACTION}>{translateQuestionType(QuestionType.REDACTION)}</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dificuldade</label>
                <select className="w-full border rounded-lg p-2 text-sm" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as DifficultyLevel })}>
                    <option value={DifficultyLevel.EASY}>{translateDifficultyLevel(DifficultyLevel.EASY)}</option>
                    <option value={DifficultyLevel.MEDIUM}>{translateDifficultyLevel(DifficultyLevel.MEDIUM)}</option>
                    <option value={DifficultyLevel.HARD}>{translateDifficultyLevel(DifficultyLevel.HARD)}</option>
                </select>
            </div>
        </div>
    );
};
