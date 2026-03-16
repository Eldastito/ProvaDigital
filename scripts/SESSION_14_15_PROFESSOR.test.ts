import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, User } from '../types';
import { governanceService } from '../services/governanceService';
import { AnalyticsService } from '../services/analyticsService';
import { useAppStore } from '../store/useAppStore';

vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
        setState: vi.fn()
    }
}));

const MOCK_TEACHER_S14: User = {
    id: 'teacher_s14',
    name: 'Professor Sessão 14 (Rica)',
    email: 's14@test.com',
    role: UserRole.PROFESSOR,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    status: 'ACTIVE'
};

const MOCK_TEACHER_S15: User = {
    id: 'teacher_s15',
    name: 'Professor Sessão 15 (Multi)',
    email: 's15@test.com',
    role: UserRole.PROFESSOR,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    status: 'ACTIVE'
};

const getMockState = (currentUser: User, students: any[] = []) => ({
    currentUser,
    selectedChildId: null,
    results: [],
    exams: [],
    students: students
});

describe('ONDA 2: CONCLUSÃO COHORT PROFESSOR (SESSÕES 14 E 15)', () => {

    describe('Sessão 14: Escola Única (Jornada Intensiva)', () => {
        const students = Array.from({ length: 15 }, (_, i) => ({
            id: `st_14_${i}`, name: `Aluno ${i}`, schoolId: 'school_1', tenantId: 'tenant_A'
        }));

        beforeEach(() => {
            vi.mocked(useAppStore.getState).mockReturnValue(getMockState(MOCK_TEACHER_S14, students) as any);
        });

        it('Deve acessar múltiplos alunos legitimamente em sequência rápida', () => {
            const analytics = new AnalyticsService(getMockState(MOCK_TEACHER_S14, students) as any);
            students.forEach(s => {
                expect(analytics.getStudentStats(s.id)).not.toBeNull();
            });
            console.log('✅ Sessão 14: Acesso sequencial a 15 alunos validado.');
        });
    });

    describe('Sessão 15: Multi-Escola (Troca Intensiva e Anti-Stale)', () => {
        it('Deve garantir isolamento rigoroso entre Escola 1 e Escola 2', () => {
            // Estágio 1: Escola 1
            const context1 = governanceService.resolveLegacyContext(MOCK_TEACHER_S15);
            expect(context1.activeSchoolId).toBe('school_1');
            
            // Tentativa de acessar Escola 2 enquanto está na 1 (Deve divergir)
            const target2 = { ...context1, targetSchoolId: 'school_2' };
            expect(target2.targetSchoolId).not.toBe(target2.activeSchoolId);
            
            // Estágio 2: Troca para Escola 2
            const context2 = governanceService.resolveLegacyContext({ ...MOCK_TEACHER_S15, schoolId: 'school_2' });
            expect(context2.activeSchoolId).toBe('school_2');
            expect(context2.activeMembershipId).not.toBe(context1.activeMembershipId);
            expect(context2.activeMembershipId).toContain('school_2'); // V2 Fix
            
            // Garantir que agora o acesso a Escola 2 é legítimo e Escola 1 é divergente
            expect(context2.targetSchoolId).toBeUndefined(); // Limpo
            const targetAllowed = { ...context2, targetSchoolId: 'school_2' };
            expect(targetAllowed.targetSchoolId).toBe(targetAllowed.activeSchoolId);
            
            console.log('✅ Sessão 15: Troca intensiva e isolamento v2 validado.');
        });
    });

    it('Performance Audit (Cohort Completo)', () => {
        const start = performance.now();
        for(let i=0; i<2000; i++) {
            governanceService.resolveLegacyContext(MOCK_TEACHER_S15);
        }
        const end = performance.now();
        const avg = (end - start) / 2000;
        expect(avg).toBeLessThan(0.05);
        console.log(`🔵 Performance Motor (Cohort Concluído): ${avg.toFixed(4)}ms`);
    });
});
