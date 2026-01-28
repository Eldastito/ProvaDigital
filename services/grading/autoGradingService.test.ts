import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutoGradingService } from './autoGradingService';
import { QuestionType } from '../../types';

// --- Mocks ---
// Mock Supabase Items
const mockItems = {
    'item_obj_1': {
        id: 'item_obj_1',
        type: QuestionType.MULTIPLE_CHOICE,
        score: 1.0,
        alternatives: [
            { id: 'alt_1', isCorrect: true },
            { id: 'alt_2', isCorrect: false }
        ]
    },
    'item_essay_1': {
        id: 'item_essay_1',
        type: QuestionType.ESSAY,
        score: 2.0,
        correctAnswerJustification: `
            REQUIRED: keyword1, keyword2
            OPTIONAL: bonus1
            MINLINES: 2
        `
    }
};

vi.mock('../supabaseClient', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: (field, value) => ({
                    single: async () => ({
                        data: mockItems[value],
                        error: mockItems[value] ? null : { message: 'Not found' }
                    })
                })
            })
        })
    }
}));

describe('AutoGradingService', () => {

    describe('Objective Grading (Offline)', () => {
        const item = mockItems['item_obj_1'];

        it('should grade correct answer', async () => {
            const answer = { itemId: item.id, selectedAlternativeId: 'alt_1' } as any;
            const result = await AutoGradingService.gradeObjectiveOffline(item, answer);

            expect(result.isCorrect).toBe(true);
            expect(result.scoreObtained).toBe(1.0);
        });

        it('should grade incorrect answer', async () => {
            const answer = { itemId: item.id, selectedAlternativeId: 'alt_2' } as any;
            const result = await AutoGradingService.gradeObjectiveOffline(item, answer);

            expect(result.isCorrect).toBe(false);
            expect(result.scoreObtained).toBe(0);
        });
    });

    describe('Essay Grading (Offline Patterns)', () => {
        const item = mockItems['item_essay_1'];

        it('should grade perfect answer', async () => {
            const answer = {
                itemId: item.id,
                text: 'This answer contains keyword1 and keyword2.\nIt has multiple lines.'
            } as any;

            const result = await AutoGradingService.gradeEssayWithPatterns(item, answer);

            // 2 keywords = 70% of 2.0 = 1.4
            // 0 bonuses
            // expected ~1.4
            expect(result.scoreObtained).toBeCloseTo(1.4, 1);
            expect(result.isCorrect).toBe(true);
        });

        it('should apply penalty for short answer', async () => {
            const answer = {
                itemId: item.id,
                text: 'keyword1 keyword2 (one line)'
            } as any;

            const result = await AutoGradingService.gradeEssayWithPatterns(item, answer);

            // Base 1.4 (for keywords)
            // Penalty 20% of max (0.2 * 2.0 = 0.4)
            // 1.4 - 0.4 = 1.0
            expect(result.scoreObtained).toBeCloseTo(1.0, 1);
        });

        it('should apply bonus for optional keywords', async () => {
            const answer = {
                itemId: item.id,
                text: 'keyword1 keyword2 bonus1\nLine 2.'
            } as any;

            const result = await AutoGradingService.gradeEssayWithPatterns(item, answer);

            // Base 1.4
            // Bonus: 1/1 optional found = 100% of 30% max = 0.6
            // Total 2.0
            expect(result.scoreObtained).toBe(2.0);
        });

        it('should grade empty answer as zero', async () => {
            const answer = { itemId: item.id, text: '' } as any;
            const result = await AutoGradingService.gradeEssayWithPatterns(item, answer);
            expect(result.scoreObtained).toBe(0);
        });
    });

    describe('Full Exam Grading', () => {
        const examMock = {
            id: 'exam_1',
            maxScore: 10,
            items: [
                { itemId: 'item_obj_1' },
                { itemId: 'item_essay_1' } // Exists in mock
            ]
        } as any;

        it('should grade mixed exam correctly in offline mode', async () => {
            const answers = [
                { itemId: 'item_obj_1', selectedAlternativeId: 'alt_1' }, // Correct (1.0)
                { itemId: 'item_essay_1', text: 'keyword1 keyword2\nLine 2' } // Partial (1.4)
            ] as any[];

            const result = await AutoGradingService.gradeFullExam(
                examMock,
                answers,
                'offline',
                false
            );

            expect(result.totalScore).toBe(2.4);
            expect(result.answers).toHaveLength(2);
            expect(result.gradingMode).toBe('offline');
        });

        it('should handle missing answers', async () => {
            const answers = [
                { itemId: 'item_obj_1', selectedAlternativeId: 'alt_1' }
            ] as any[];

            const result = await AutoGradingService.gradeFullExam(
                examMock,
                answers,
                'offline'
            );

            expect(result.totalScore).toBe(1.0); // Only obj graded
            expect(result.answers).toHaveLength(2);
            const missing = result.answers.find(a => a.itemId === 'item_essay_1');
            expect(missing?.gradingMethod).toBe('NOT_ANSWERED');
        });
    });
});
