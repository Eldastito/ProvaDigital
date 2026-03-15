import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, User, AppState } from '../types';
import { userService } from '../services/userService';
import { AnalyticsService } from '../services/analyticsService';
import { useAppStore } from '../store/useAppStore';

// Mock do AppStore
vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
        setState: vi.fn()
    }
}));

// -- PERFIS PARA SESSÕES --

const MOCK_GUARDIAN_S2: User = {
    id: 'guardian_s2',
    name: 'Responsável Sessão 2',
    email: 's2@test.com',
    role: UserRole.PAIS,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    childrenIds: ['child_s2_A', 'child_s2_B'], // Mesma Escola
    status: 'ACTIVE'
};

const MOCK_GUARDIAN_S3: User = {
    id: 'guardian_s3',
    name: 'Responsável Sessão 3',
    email: 's3@test.com',
    role: UserRole.PAIS,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    childrenIds: ['child_s3_A', 'child_s3_B_school2'], // Escolas Diferentes
    status: 'ACTIVE'
};

const MOCK_GUARDIAN_S4: User = {
    id: 'guardian_s4',
    name: 'Responsável Sessão 4',
    email: 's4@test.com',
    role: UserRole.PAIS,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    childrenIds: ['child_s4_A', 'child_s4_B'], // Troca Intensa
    status: 'ACTIVE'
};

// -- HELPER PARA MOCK STATE --
const getMockState = (currentUser: User, children: any[]) => ({
    currentUser,
    selectedChildId: null,
    results: children.map((c, i) => ({
        id: `res_${i}`, studentId: c.id, examId: 'ex_1', totalScore: 8, gradedAt: '2024-03-15', answers: []
    })),
    students: children
});

describe('ONDA 2: MICRO-ESCALA (SESSÕES 2, 3 E 4)', () => {

    describe('Sessão 2: Múltiplos dependentes na mesma escola', () => {
        const children = [
            { id: 'child_s2_A', name: 'Filho A', schoolId: 'school_1', tenantId: 'tenant_A' },
            { id: 'child_s2_B', name: 'Filho B', schoolId: 'school_1', tenantId: 'tenant_A' }
        ];

        beforeEach(() => {
            vi.mocked(useAppStore.getState).mockReturnValue(getMockState(MOCK_GUARDIAN_S2, children) as any);
        });

        it('Deve permitir acesso a ambos os dependentes na mesma escola', () => {
            expect(userService.canGuardianAccessStudent(MOCK_GUARDIAN_S2, 'child_s2_A')).toBe(true);
            expect(userService.canGuardianAccessStudent(MOCK_GUARDIAN_S2, 'child_s2_B')).toBe(true);
            console.log('✅ Sessão 2: Acesso bi-direcional na mesma escola validado.');
        });
    });

    describe('Sessão 3: Dependentes em escolas diferentes', () => {
        const children = [
            { id: 'child_s3_A', name: 'Filho A', schoolId: 'school_1', tenantId: 'tenant_A' },
            { id: 'child_s3_B_school2', name: 'Filho B', schoolId: 'school_2', tenantId: 'tenant_A' }
        ];

        beforeEach(() => {
            vi.mocked(useAppStore.getState).mockReturnValue(getMockState(MOCK_GUARDIAN_S3, children) as any);
        });

        it('Deve garantir isolamento e permissão em contexto multi-escola', () => {
            expect(userService.canGuardianAccessStudent(MOCK_GUARDIAN_S3, 'child_s3_A')).toBe(true);
            expect(userService.canGuardianAccessStudent(MOCK_GUARDIAN_S3, 'child_s3_B_school2')).toBe(true);
            console.log('✅ Sessão 3: Escolas diferentes (multi-school) validado.');
        });
    });

    describe('Sessão 4: Troca rápida e tentativa inválida', () => {
        const children = [
            { id: 'child_s4_A', name: 'Filho A', schoolId: 'school_1', tenantId: 'tenant_A' },
            { id: 'child_s4_B', name: 'Filho B', schoolId: 'school_1', tenantId: 'tenant_A' }
        ];

        beforeEach(() => {
            vi.mocked(useAppStore.getState).mockReturnValue(getMockState(MOCK_GUARDIAN_S4, children) as any);
        });

        it('Deve monitorar coerência em trocas rápidas e bloquear invasão', () => {
            const analytics = new AnalyticsService(getMockState(MOCK_GUARDIAN_S4, children) as any);

            // Simula troca rápida
            const statsA = analytics.getStudentStats('child_s4_A');
            expect(statsA).not.toBeNull();
            
            const statsB = analytics.getStudentStats('child_s4_B');
            expect(statsB).not.toBeNull();

            // Tentativa de contexto "fantasma" ou forjado
            const statsIntruder = analytics.getStudentStats('intruder_999');
            expect(statsIntruder).toBeNull();
            
            console.log('✅ Sessão 4: Troca rápida + Bloqueio de contexto inválido validado.');
        });

        it('Performance Audit (Métrica A)', () => {
            const start = performance.now();
            for(let i=0; i<1000; i++) {
                userService.canGuardianAccessStudent(MOCK_GUARDIAN_S4, 'child_s4_A');
            }
            const end = performance.now();
            const avg = (end - start) / 1000;
            expect(avg).toBeLessThan(2);
            console.log(`🔵 Sessão 4 Performance: ${avg.toFixed(4)}ms`);
        });
    });
});
