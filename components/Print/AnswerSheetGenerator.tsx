import React from 'react';
import { Exam, QuestionType } from '../../types';

interface AnswerSheetGeneratorProps {
    exam: Exam;
    items: any[]; // Hydrated items
    studentName?: string;
}

export const AnswerSheetGenerator: React.FC<AnswerSheetGeneratorProps> = ({
    exam,
    items,
    studentName
}) => {
    // Filter only objective questions (MC and True/False)
    const objectiveQuestions = items.filter(
        item => item.type === QuestionType.MULTIPLE_CHOICE || item.type === QuestionType.TRUE_FALSE
    );

    if (objectiveQuestions.length === 0) {
        return null; // No answer sheet needed for essay-only exams
    }

    const getAlternatives = (item: any) => {
        if (item.type === QuestionType.TRUE_FALSE) {
            return ['V', 'F'];
        }
        // For multiple choice, return A, B, C, D, E based on alternatives count
        return item.alternatives.map((_: any, idx: number) =>
            String.fromCharCode(65 + idx)
        );
    };

    return (
        <div className="answer-sheet page-break-before">
            {/* Header */}
            <div className="answer-sheet-header">
                <h2 className="answer-sheet-title">FOLHA DE RESPOSTAS</h2>
                <div className="answer-sheet-subtitle">{exam.title}</div>
            </div>

            {/* Student Identification */}
            <div className="student-identification">
                <div className="id-row">
                    <span className="id-label">Nome do Aluno:</span>
                    <span className="id-field">{studentName || '_'.repeat(60)}</span>
                </div>
                <div className="id-row">
                    <span className="id-label">Turma:</span>
                    <span className="id-field">{'_'.repeat(20)}</span>
                    <span className="id-label ml-4">Data:</span>
                    <span className="id-field">___/___/______</span>
                </div>
            </div>

            {/* Instructions */}
            <div className="answer-instructions">
                <strong>INSTRUÇÕES PARA PREENCHIMENTO:</strong>
                <ul>
                    <li>Preencha completamente o círculo correspondente à alternativa escolhida.</li>
                    <li>Use caneta esferográfica azul ou preta.</li>
                    <li>Não amasse, dobre ou rasure esta folha.</li>
                    <li>Cada questão admite apenas UMA resposta correta.</li>
                </ul>
            </div>

            {/* Answer Grid */}
            <div className="answer-grid">
                {objectiveQuestions.map((item, idx) => {
                    const questionNumber = items.findIndex(i => i.id === item.id) + 1;
                    const alternatives = getAlternatives(item);

                    return (
                        <div key={item.id} className="answer-row">
                            <span className="question-num">{questionNumber.toString().padStart(2, '0')}</span>
                            <div className="answer-bubbles">
                                {alternatives.map(letter => (
                                    <div key={letter} className="bubble">
                                        {letter}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer with scoring area */}
            <div className="answer-sheet-footer">
                <div className="scoring-box">
                    <div className="scoring-row">
                        <span>Questões Corretas:</span>
                        <span className="score-field">_____</span>
                    </div>
                    <div className="scoring-row">
                        <span>Nota Final:</span>
                        <span className="score-field">_____</span>
                    </div>
                    <div className="scoring-row">
                        <span>Assinatura do Avaliador:</span>
                        <span className="signature-field">_________________________</span>
                    </div>
                </div>
            </div>

            {/* Security Code */}
            <div className="answer-sheet-code">
                Código: {exam.id.substring(0, 8).toUpperCase()}
            </div>
        </div>
    );
};
