import { describe, it, expect } from 'vitest';
import { auditExamPedagogically } from './PredictivePedagogicalService';
import { Item, DifficultyLevel, QuestionType, ItemOrigin } from '../types';

describe('PredictivePedagogicalService', () => {
    it('should calculate a perfect score for a balanced and complete exam', () => {
        const items: Item[] = Array(5).fill(null).map((_, i) => ({
            id: `item-${i}`,
            tenantId: 't1',
            ownerId: 'u1',
            knowledgeArea: 'Geral',
            subject: 'Matemática',
            type: QuestionType.MULTIPLE_CHOICE,
            statement: 'Questão de teste',
            alternatives: [],
            difficulty: DifficultyLevel.MEDIUM,
            score: 1,
            origin: ItemOrigin.MANUAL,
            tags: [],
            bnccCode: 'EF06MA01', // Has BNCC
            usageCount: 0,
            correctAnswerJustification: 'Justificativa',
            createdAt: new Date().toISOString()
        }));

        const report = auditExamPedagogically(items);
        expect(report.score).toBeGreaterThanOrEqual(90);
        expect(report.metrics.bnccCoverage).toBe(100);
    });

    it('should lower score if BNCC is missing', () => {
        const items: Item[] = [{
            id: `item-1`,
            tenantId: 't1',
            ownerId: 'u1',
            knowledgeArea: 'Geral',
            subject: 'Matemática',
            type: QuestionType.MULTIPLE_CHOICE,
            statement: 'Questão de teste',
            alternatives: [],
            difficulty: DifficultyLevel.MEDIUM,
            score: 1,
            origin: ItemOrigin.MANUAL,
            tags: [],
            // Missing bnccCode
            usageCount: 0,
            correctAnswerJustification: 'Justificativa',
            createdAt: new Date().toISOString()
        }];

        const report = auditExamPedagogically(items);
        expect(report.score).toBeLessThan(80);
        expect(report.metrics.bnccCoverage).toBe(0);
        expect(report.insights.some(i => i.actionType === 'BNCC')).toBe(true);
    });

    it('should detect high difficulty imbalance', () => {
        const items: Item[] = Array(10).fill(null).map((_, i) => ({
            id: `item-${i}`,
            tenantId: 't1',
            ownerId: 'u1',
            knowledgeArea: 'Geral',
            subject: 'Matemática',
            type: QuestionType.MULTIPLE_CHOICE,
            statement: 'Questão de teste',
            alternatives: [],
            difficulty: i < 6 ? DifficultyLevel.HARD : DifficultyLevel.EASY,
            score: 1,
            origin: ItemOrigin.MANUAL,
            tags: [],
            bnccCode: 'EF06MA01',
            usageCount: 0,
            correctAnswerJustification: 'Justificativa',
            createdAt: new Date().toISOString()
        }));

        const report = auditExamPedagogically(items);
        expect(report.insights.some(i => i.title === 'Alta Complexidade')).toBe(true);
    });
});
