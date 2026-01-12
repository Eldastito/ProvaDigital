import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { OnlineExamRunner } from './OnlineExamRunner';
import { useAppStore } from '../../store/useAppStore';

// Mock the store
vi.mock('../../store/useAppStore', () => ({
    useAppStore: Object.assign(vi.fn(), {
        getState: vi.fn(),
    })
}));

const mockExam = {
    id: 'exam-1',
    title: 'Test Exam',
    durationMinutes: 1,
    items: [
        { itemId: 'item-1', score: 2 },
        { itemId: 'item-2', score: 3 }
    ]
};

const mockItems = [
    {
        id: 'item-1',
        statement: 'Question 1',
        alternatives: [
            { id: 'a1', text: 'Alt 1', isCorrect: true },
            { id: 'a2', text: 'Alt 2', isCorrect: false }
        ]
    },
    {
        id: 'item-2',
        statement: 'Question 2',
        alternatives: [
            { id: 'b1', text: 'Alt 1', isCorrect: false },
            { id: 'b2', text: 'Alt 2', isCorrect: true }
        ]
    }
];

describe('OnlineExamRunner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppStore as any).mockReturnValue({
            exams: [mockExam],
            items: mockItems
        });
    });

    it('renders the first question correctly', () => {
        render(
            <OnlineExamRunner
                examId="exam-1"
                studentId="std-1"
                onExit={() => { }}
                onComplete={() => { }}
            />
        );

        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Alt 1')).toBeInTheDocument();
    });

    it('updates timer every second', () => {
        vi.useFakeTimers();
        render(
            <OnlineExamRunner
                examId="exam-1"
                studentId="std-1"
                onExit={() => { }}
                onComplete={() => { }}
            />
        );

        expect(screen.getByText('1:00')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText('0:59')).toBeInTheDocument();
        vi.useRealTimers();
    });

    it('maps answers and calculates score on complete', () => {
        const onComplete = vi.fn();
        render(
            <OnlineExamRunner
                examId="exam-1"
                studentId="std-1"
                onExit={() => { }}
                onComplete={onComplete}
            />
        );

        // Select correct answer for Q1
        fireEvent.click(screen.getByText('Alt 1'));

        // Go to next
        fireEvent.click(screen.getByText('Próxima'));

        // Select incorrect answer for Q2
        fireEvent.click(screen.getByText('Alt 1'));

        // Finalize
        fireEvent.click(screen.getByText('Finalizar Prova'));

        expect(onComplete).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ itemId: 'item-1', isCorrect: true, scoreObtained: 2 }),
            expect.objectContaining({ itemId: 'item-2', isCorrect: false, scoreObtained: 0 })
        ]));
    });

    it('auto-completes when timer reaches zero', () => {
        vi.useFakeTimers();
        const onComplete = vi.fn();
        render(
            <OnlineExamRunner
                examId="exam-1"
                studentId="std-1"
                onExit={() => { }}
                onComplete={onComplete}
            />
        );

        act(() => {
            vi.advanceTimersByTime(60 * 1000);
        });

        expect(onComplete).toHaveBeenCalled();
        vi.useRealTimers();
    });
});
