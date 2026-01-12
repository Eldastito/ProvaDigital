import { describe, it, expect, vi } from 'vitest';
import { useAppStore } from './store/useAppStore';
import { supabase } from './services/supabaseClient';
import { ItemOrigin, QuestionType, DifficultyLevel, ItemLifecycleStatus } from './types';

const insertMock = vi.fn(() => Promise.resolve({ error: null }));
const updateMock = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));

vi.mock('./services/supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: insertMock,
            update: updateMock,
        })),
    }
}));

describe('Item Persistence Hardening', () => {
    it('should include accessibility and multimedia fields in addItem call', async () => {
        const store = useAppStore.getState();
        const testItem: any = {
            id: 'test-id',
            tenantId: 't1',
            ownerId: 'u1',
            subject: 'Math',
            statement: 'Test Statement',
            type: QuestionType.MULTIPLE_CHOICE,
            difficulty: DifficultyLevel.MEDIUM,
            alternatives: [],
            correctAnswerJustification: 'Justification',
            score: 1.0,
            origin: ItemOrigin.MANUAL,
            tags: [],
            isAccessible: true,
            accessibilityInstructions: 'Read slowly',
            multimedia: [{ type: 'IMAGE', url: 'http://img.png' }],
            lifecycleStatus: ItemLifecycleStatus.APPROVED,
            createdAt: new Date().toISOString()
        };

        await store.addItem(testItem);

        expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
            is_accessible: true,
            accessibility_instructions: 'Read slowly',
            multimedia: [{ type: 'IMAGE', url: 'http://img.png' }],
            lifecycle_status: 'APPROVED'
        }));
    });
});
