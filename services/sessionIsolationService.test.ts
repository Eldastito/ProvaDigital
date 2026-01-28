import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionIsolationService } from './sessionIsolationService';

// --- Helper to create async IDBRequest mock ---
const createMockRequest = (result: any) => {
    const req: any = { result, onsuccess: null, onerror: null };
    setTimeout(() => {
        if (req.onsuccess) {
            req.onsuccess({ target: { result } });
        }
    }, 0);
    return req;
};

// --- Mock IndexedDB Implementation ---
const storeMap = new Map<string, any>();

const mockTransaction = {
    objectStore: (name: string) => ({
        put: (val: any) => {
            storeMap.set(val.id, val);
            return createMockRequest(val.id);
        },
        get: (key: string) => {
            const val = storeMap.get(key);
            return createMockRequest(val);
        },
        getAll: () => {
            const result = Array.from(storeMap.values());
            return createMockRequest(result);
        },
        delete: (key: string) => {
            storeMap.delete(key);
            return createMockRequest(undefined);
        }
    })
};

const mockDB = {
    transaction: () => mockTransaction,
    objectStoreNames: {
        contains: () => true // Assume stores exist to skip upgrade logic in openDatabase for simplicity
    },
    createObjectStore: () => { }
};

describe('SessionIsolationService', () => {
    let service: SessionIsolationService;

    beforeEach(() => {
        storeMap.clear();
        service = new SessionIsolationService();

        // Mock global indexedDB
        const mockOpenRequest = {
            result: mockDB,
            onerror: null,
            onsuccess: null,
            onupgradeneeded: null,
        } as any;

        global.indexedDB = {
            open: () => {
                setTimeout(() => {
                    if (mockOpenRequest.onsuccess) mockOpenRequest.onsuccess({ target: { result: mockDB } });
                }, 0);
                return mockOpenRequest;
            }
        } as any;
    });

    it('should start a new session', async () => {
        const session = await service.startSession('student1', 'João', 'exam1', 'event1');

        expect(session).toBeDefined();
        expect(session.id).toContain('session_student1_exam1');
        expect(session.studentName).toBe('João');
        expect(service.getCurrentSession()).toBe(session);

        // Check persistence
        expect(storeMap.has(session.id)).toBe(true);
    });

    it('should throw if session already active', async () => {
        await service.startSession('s1', 'J', 'e1', 'ev1');
        await expect(service.startSession('s2', 'M', 'e1', 'ev1'))
            .rejects.toThrow('Sessão já ativa');
    });

    it('should logout and clear RAM', async () => {
        await service.startSession('s1', 'J', 'e1', 'ev1');
        service.logout();
        expect(service.getCurrentSession()).toBeNull();
        // DB should still have the session
        expect(storeMap.size).toBe(1);
    });

    it('should save answers correctly', async () => {
        const session = await service.startSession('s1', 'J', 'e1', 'ev1');
        await service.saveAnswer(1, 'A');

        expect(session.encryptedAnswers).toHaveLength(1);
        expect(session.encryptedAnswers[0].answer).toBe('A');

        // Check DB persistence update
        const stored = storeMap.get(session.id);
        expect(stored.encryptedAnswers).toHaveLength(1);
    });

    it('should mark session as finished', async () => {
        const session = await service.startSession('s1', 'J', 'e1', 'ev1');
        await service.finishSession();

        expect(session.finishedAt).toBeDefined();
        expect(session.totalDuration).toBeDefined();

        // Check DB persistence
        const stored = storeMap.get(session.id);
        expect(stored.finishedAt).toBeDefined();
    });
});
