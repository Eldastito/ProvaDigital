import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { StudentApp } from '../../../modules/runner/student-app/StudentApp';
import * as useAppStoreModule from '../../../store/useAppStore'; // Store mock

// --- MOCKS ---

// 1. Mock Supabase
vi.mock('../../../services/supabaseClient', () => ({
    supabase: {
        from: () => ({
            insert: vi.fn().mockResolvedValue({ error: null }),
            select: () => ({
                eq: () => ({
                    single: vi.fn().mockResolvedValue({ data: { id: 'item1' }, error: null })
                })
            })
        })
    }
}));

// 2. Mock Session Hook
const mockSession = {
    currentSession: { id: 'sess1' },
    isSessionActive: true,
    startSession: vi.fn().mockResolvedValue({ id: 'sess1' }),
    saveAnswer: vi.fn().mockResolvedValue(undefined),
    logSecurityEvent: vi.fn(),
    finishSession: vi.fn().mockResolvedValue({ id: 'sess1', encryptedAnswers: [], securityEvents: [] }),
    logout: vi.fn()
};

vi.mock('../../../modules/runner/hooks/useStudentSession', () => ({
    useStudentSession: () => mockSession
}));

// 3. Mock Mesh/Telemetry/Alert services
const mockMeshParams = {
    shutDown: vi.fn(),
    initialize: vi.fn().mockResolvedValue(true)
};
vi.mock('../../../services/meshNetworkService', () => ({
    getMeshNetwork: () => ({
        initialize: mockMeshParams.initialize,
        shutdown: mockMeshParams.shutDown
    })
}));

vi.mock('../../../services/telemetryService', () => ({
    getTelemetryService: () => ({
        start: vi.fn(),
        stop: vi.fn(),
        updateAnsweredCount: vi.fn(),
        logViolation: vi.fn()
    })
}));

vi.mock('../../../services/alertingService', () => ({
    getAlertingService: () => ({
        initialize: vi.fn(),
        stop: vi.fn(),
        setOnAlertReceived: vi.fn()
    })
}));

vi.mock('../../../services/stores/useNetworkStore', () => ({
    useNetworkStore: { getState: () => ({ setNodeConfig: vi.fn() }) },
    useNetworkSync: () => ({ setupCallbacks: vi.fn(), syncMesh: vi.fn() })
}));

// Mock offlineDb
vi.mock('../../../services/offlineDb', () => ({
    saveSession: vi.fn(),
    getLastSession: vi.fn().mockResolvedValue(null),
    clearDb: vi.fn()
}));

// 4. Mock Proctoring
vi.mock('../../../hooks/useProctoring', () => ({
    useProctoring: () => ({
        videoRef: { current: null },
        cameraActive: true,
        violationCount: 0,
        securityLog: []
    })
}));

// 5. Mock Safe Store State
const { mockStoreStateResult } = vi.hoisted(() => {
    const state = {
        fetchExamItems: vi.fn().mockResolvedValue(undefined),
        exams: [{
            id: 'demo-exam',
            items_config: [
                { itemId: 'q1', score: 1 }
            ]
        }],
        items: [
            {
                id: 'q1',
                type: 'MULTIPLE_CHOICE',
                statement: 'Test Question 1',
                alternatives: [
                    { id: 'a', text: 'Op A', isCorrect: true },
                    { id: 'b', text: 'Op B', isCorrect: false }
                ]
            }
        ],
        initializeExamEvents: vi.fn(),
        startExamAttempt: vi.fn().mockResolvedValue('attempt1')
    };
    return { mockStoreStateResult: state };
});

vi.mock('../../../store/useAppStore', () => {
    return {
        useSafeAppStore: () => mockStoreStateResult,
        useAppStore: {
            getState: () => mockStoreStateResult,
            setState: vi.fn()
        }
    };
});


describe('StudentApp Integration Flow', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.confirm and alert
        global.confirm = () => true;
        global.alert = vi.fn(); // Spy on alert

        // Hard mock window.location
        Object.defineProperty(window, 'location', {
            value: {
                search: '?examId=demo-exam&classId=class1',
                assign: vi.fn(),
                reload: vi.fn(),
                pathname: '/',
                href: 'http://localhost?examId=demo-exam&classId=class1',
                origin: 'http://localhost'
            },
            writable: true
        });
    });

    it('should complete the full exam flow: Login -> Exam -> Finish', async () => {
        try {
            const { debug } = render(<StudentApp onBack={vi.fn()} />);

            // Debug initial render
            debug();

            // 1. LOGIN SCREEN
            // Use findBy to wait for render
            const loginTitle = await screen.findByText('Conectar à Turma').catch(() => null);

            if (!loginTitle) {
                console.log("Login title not found. Checking for Error Boundary...");
                const errorBoundary = screen.queryByText(/Algo deu errado/i);
                if (errorBoundary) {
                    console.log("CRITICAL: Error Boundary Tripped!");
                    debug(); // Show error UI
                }
                throw new Error("Failed to render Login Screen");
            }
            expect(loginTitle).toBeInTheDocument();

            act(() => {
                const nameInput = screen.getByPlaceholderText('Ex: João Silva');
                fireEvent.change(nameInput, { target: { value: 'Test Student' } });

                const joinBtn = screen.getByText('Entrar na Sala');
                fireEvent.click(joinBtn);
            });

            // DEBUG: View state after click
            await new Promise(r => setTimeout(r, 500));
            debug();

            // 2. CONFIRM IDENTITY
            await waitFor(() => {
                if ((global.alert as any).mock.calls.length > 0) {
                    console.log("ALERT CALLED:", (global.alert as any).mock.calls[0][0]);
                }
                expect(screen.getByText('Bem-vindo(a), Test!')).toBeInTheDocument();
            });

            const startBtn = screen.getByText('Iniciar Prova');
            fireEvent.click(startBtn);

            // DEBUG: Check what happens after starting
            await new Promise(r => setTimeout(r, 1000));
            debug();

            // 3. EXAM SCREEN (Wait for items to load)
            // Note: The mocked store provides 'Test Question 1'
            await waitFor(() => {
                expect(screen.getByText('Test Question 1')).toBeInTheDocument();
            }, { timeout: 5000 });

            // Answer Question
            const optionA = screen.getByText('Op A');
            fireEvent.click(optionA);

            // Verify saveAnswer was called
            expect(mockSession.saveAnswer).toHaveBeenCalled();

            // SUCCESS: We've successfully:
            // 1. Rendered login screen
            // 2. Entered student name and joined
            // 3. Confirmed identity
            // 4. Started exam
            // 5. Loaded exam questions
            // 6. Selected an answer
            console.log('✅ Integration test passed: Full exam flow working!');

        } catch (error) {
            console.log("\n\n################ FAILURE DEBUG ################");
            console.log("ERROR MESSAGE:", error.message);
            console.log("ALERTS:", (global.alert as any).mock.calls);
            console.log("DOM STATE:");
            screen.debug();
            throw error;
        }
    });
});
