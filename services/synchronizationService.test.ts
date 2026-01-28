import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SynchronizationService } from './synchronizationService';
import { supabase } from './supabaseClient';
import { getSessionService } from './sessionIsolationService';

// --- Mocks ---
vi.mock('./supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
    }
}));

vi.mock('./sessionIsolationService', () => ({
    getSessionService: vi.fn()
}));

describe('SynchronizationService', () => {
    let service: SynchronizationService;
    let mockSessionService: any;
    let mockSupabaseFrom: any;

    const mockPendingSessions = [
        {
            id: 'session_1',
            studentId: 'stud_1',
            examId: 'exam_1',
            startedAt: '2026-01-28T10:00:00Z',
            finishedAt: '2026-01-28T11:00:00Z',
            encryptedAnswers: [],
            telemetry: {},
            securityEvents: []
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Setup Mock Session Service
        mockSessionService = {
            getPendingSessions: vi.fn().mockResolvedValue([]),
            markAsUploaded: vi.fn().mockResolvedValue(undefined)
        };
        (getSessionService as any).mockReturnValue(mockSessionService);

        // Setup Mock Supabase
        mockSupabaseFrom = vi.fn().mockReturnValue({
            insert: vi.fn().mockResolvedValue({ error: null })
        });
        (supabase.from as any) = mockSupabaseFrom;

        service = new SynchronizationService();
    });

    afterEach(() => {
        service.stopAutoSync();
        vi.useRealTimers();
    });

    it('should start auto sync', () => {
        service.startAutoSync(1000);
        expect(service['syncInterval']).not.toBeNull();
    });

    it('should stop auto sync', () => {
        service.startAutoSync(1000);
        service.stopAutoSync();
        expect(service['syncInterval']).toBeNull();
    });

    it('should do nothing if no pending sessions', async () => {
        mockSessionService.getPendingSessions.mockResolvedValue([]);

        const result = await service.syncPendingSessions();

        expect(result.total).toBe(0);
        expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('should upload pending sessions successfully', async () => {
        mockSessionService.getPendingSessions.mockResolvedValue(mockPendingSessions);

        const result = await service.syncPendingSessions();

        expect(result.total).toBe(1);
        expect(result.success).toBe(1);
        expect(result.failed).toBe(0);

        // Verify Supabase interaction
        expect(mockSupabaseFrom).toHaveBeenCalledWith('exam_results');

        // Verify Session marking
        expect(mockSessionService.markAsUploaded).toHaveBeenCalledWith('session_1');
    });

    it('should handle supabase error correctly', async () => {
        mockSessionService.getPendingSessions.mockResolvedValue(mockPendingSessions);

        // Mock Supabase Error
        mockSupabaseFrom.mockReturnValue({
            insert: vi.fn().mockResolvedValue({ error: { message: 'DB Error' } })
        });

        const result = await service.syncPendingSessions();

        expect(result.total).toBe(1);
        expect(result.success).toBe(0);
        expect(result.failed).toBe(1);

        // Should NOT mark as uploaded
        expect(mockSessionService.markAsUploaded).not.toHaveBeenCalled();
    });

    it('should prevent concurrent syncs', async () => {
        // Trigger a long running sync
        mockSessionService.getPendingSessions.mockReturnValue(new Promise(() => { }));

        // First call
        service.syncPendingSessions();

        // Second call should return immediately
        const result2 = await service.syncPendingSessions();

        expect(result2.total).toBe(0);
    });
});
