import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiveDemoResults } from './LiveDemoResults';

// Mock RichTextRenderer
vi.mock('../../RichTextRenderer', () => ({
    RichTextRenderer: ({ content }: { content: string }) => <div>{content}</div>
}));

describe('LiveDemoResults Integration Tests', () => {

    const mockExamStats = {
        total: 25,
        'q1': 80, // 80% correct
        'q2': 60, // 60% correct
        'q3': 90, // 90% correct
        questions: {
            'q1': {
                distribution: {
                    'a': 20, // correct
                    'b': 3,
                    'c': 2
                }
            },
            'q2': {
                distribution: {
                    'a': 5,
                    'b': 15, // correct
                    'c': 5
                }
            },
            'q3': {
                distribution: {
                    'a': 2,
                    'b': 1,
                    'c': 22 // correct
                }
            }
        }
    };

    const mockExamItems = [
        {
            id: 'q1',
            statement: 'Qual é a capital do Brasil?',
            alternatives: [
                { id: 'a', text: 'Brasília', isCorrect: true },
                { id: 'b', text: 'São Paulo', isCorrect: false },
                { id: 'c', text: 'Rio de Janeiro', isCorrect: false }
            ]
        },
        {
            id: 'q2',
            statement: 'Quanto é 2 + 2?',
            alternatives: [
                { id: 'a', text: '3', isCorrect: false },
                { id: 'b', text: '4', isCorrect: true },
                { id: 'c', text: '5', isCorrect: false }
            ]
        },
        {
            id: 'q3',
            statement: 'Qual é a cor do céu?',
            alternatives: [
                { id: 'a', text: 'Verde', isCorrect: false },
                { id: 'b', text: 'Vermelho', isCorrect: false },
                { id: 'c', text: 'Azul', isCorrect: true }
            ]
        }
    ];

    const mockTopPerformers = [
        { id: '1', name: 'João Silva', score: 3 },
        { id: '2', name: 'Maria Santos', score: 3 },
        { id: '3', name: 'Pedro Oliveira', score: 2 }
    ];

    const mockGenerateReport = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('UI Rendering - Overview', () => {
        it('should render overview with all statistics', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Check title
            expect(screen.getByText('Resultado da Turma')).toBeInTheDocument();

            // Check total exams stat
            expect(screen.getByText('Total de Provas')).toBeInTheDocument();
            expect(screen.getByText('25')).toBeInTheDocument();

            // Check question stats (first 3 questions)
            expect(screen.getByText('Acerto Questão 1')).toBeInTheDocument();
            expect(screen.getByText('80%')).toBeInTheDocument();

            expect(screen.getByText('Acerto Questão 2')).toBeInTheDocument();
            expect(screen.getByText('60%')).toBeInTheDocument();

            expect(screen.getByText('Acerto Questão 3')).toBeInTheDocument();
            expect(screen.getByText('90%')).toBeInTheDocument();
        });

        it('should render top performers podium', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Check podium title
            expect(screen.getByText('Destaques da Sessão')).toBeInTheDocument();

            // Check 1st place
            expect(screen.getByText('João')).toBeInTheDocument();
            const scores = screen.getAllByText('3/3');
            expect(scores.length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText('1º')).toBeInTheDocument();

            // Check 2nd place
            expect(screen.getByText('Maria')).toBeInTheDocument();
            expect(scores.length).toBeGreaterThanOrEqual(2);
            expect(screen.getByText('2º')).toBeInTheDocument();

            // Check 3rd place
            expect(screen.getByText('Pedro')).toBeInTheDocument();
            expect(screen.getByText('2/3')).toBeInTheDocument();
            expect(screen.getByText('3º')).toBeInTheDocument();
        });

        it('should render navigation buttons', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Check overview button
            expect(screen.getByText('Visão Geral')).toBeInTheDocument();

            // Check question buttons
            expect(screen.getByText('Q1')).toBeInTheDocument();
            expect(screen.getByText('Q2')).toBeInTheDocument();
            expect(screen.getByText('Q3')).toBeInTheDocument();

            // Check report button
            expect(screen.getByText('Baixar Relatório')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should switch to question view when clicking Q1', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Click Q1 button
            const q1Button = screen.getByText('Q1');
            fireEvent.click(q1Button);

            // Should show question 1 details
            expect(screen.getByText('Questão 1')).toBeInTheDocument();
            expect(screen.getByText('Qual é a capital do Brasil?')).toBeInTheDocument();

            // Should show alternatives distribution
            expect(screen.getByText(/Brasília/i)).toBeInTheDocument();
            expect(screen.getByText(/São Paulo/i)).toBeInTheDocument();
            expect(screen.getByText(/Rio de Janeiro/i)).toBeInTheDocument();
        });

        it('should switch back to overview when clicking Visão Geral', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Go to Q1
            fireEvent.click(screen.getByText('Q1'));
            expect(screen.getByText('Questão 1')).toBeInTheDocument();

            // Go back to overview
            fireEvent.click(screen.getByText('Visão Geral'));
            expect(screen.getByText('Resultado da Turma')).toBeInTheDocument();
            expect(screen.getByText('Destaques da Sessão')).toBeInTheDocument();
        });

        it('should navigate between different questions', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Go to Q2
            fireEvent.click(screen.getByText('Q2'));
            expect(screen.getByText('Questão 2')).toBeInTheDocument();
            expect(screen.getByText('Quanto é 2 + 2?')).toBeInTheDocument();

            // Go to Q3
            fireEvent.click(screen.getByText('Q3'));
            expect(screen.getByText('Questão 3')).toBeInTheDocument();
            expect(screen.getByText('Qual é a cor do céu?')).toBeInTheDocument();
        });

        it('should navigate to question by clicking stat card', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Click on the stat card for question 1
            const statCard = screen.getByText('Acerto Questão 1').closest('div');
            if (statCard) {
                fireEvent.click(statCard);
                expect(screen.getByText('Questão 1')).toBeInTheDocument();
            }
        });
    });

    describe('Question Distribution View', () => {
        it('should display distribution bars with percentages', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Go to Q1
            fireEvent.click(screen.getByText('Q1'));

            // Check percentages (total = 25 answers)
            // a: 20/25 = 80%
            expect(screen.getByText('80%')).toBeInTheDocument();
            // b: 3/25 = 12%
            expect(screen.getByText('12%')).toBeInTheDocument();
            // c: 2/25 = 8%
            expect(screen.getByText('8%')).toBeInTheDocument();
        });

        it('should highlight correct alternative in green', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Go to Q1
            fireEvent.click(screen.getByText('Q1'));

            // The correct answer (Brasília) should have emerald color class
            const correctAnswer = screen.getByText(/Brasília/i).closest('span');
            expect(correctAnswer).toHaveClass('text-emerald-400');
        });

        it('should show "Sem dados" when no distribution exists', () => {
            const emptyStats = {
                ...mockExamStats,
                questions: {
                    'q1': { distribution: {} }
                }
            };

            render(
                <LiveDemoResults
                    examStats={emptyStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Go to Q1
            fireEvent.click(screen.getByText('Q1'));

            expect(screen.getByText('Sem dados')).toBeInTheDocument();
        });
    });

    describe('Report Generation', () => {
        it('should call generateReport when clicking report button', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={mockTopPerformers}
                    generateReport={mockGenerateReport}
                />
            );

            // Click report button
            const reportButton = screen.getByText('Baixar Relatório');
            fireEvent.click(reportButton);

            expect(mockGenerateReport).toHaveBeenCalledTimes(1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty top performers list', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={[]}
                    generateReport={mockGenerateReport}
                />
            );

            // Should still render podium section but without performers
            expect(screen.getByText('Destaques da Sessão')).toBeInTheDocument();
            expect(screen.queryByText('1º')).not.toBeInTheDocument();
        });

        it('should handle partial top performers (only 1st place)', () => {
            render(
                <LiveDemoResults
                    examStats={mockExamStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={[mockTopPerformers[0]]}
                    generateReport={mockGenerateReport}
                />
            );

            // Should show 1st place
            expect(screen.getByText('1º')).toBeInTheDocument();
            expect(screen.getByText('João')).toBeInTheDocument();

            // Should not show 2nd and 3rd
            expect(screen.queryByText('2º')).not.toBeInTheDocument();
            expect(screen.queryByText('3º')).not.toBeInTheDocument();
        });

        it('should handle zero total exams', () => {
            const zeroStats = {
                ...mockExamStats,
                total: 0
            };

            render(
                <LiveDemoResults
                    examStats={zeroStats}
                    selectedExamItems={mockExamItems}
                    topPerformers={[]}
                    generateReport={mockGenerateReport}
                />
            );

            expect(screen.getByText('0')).toBeInTheDocument();
        });
    });
});
