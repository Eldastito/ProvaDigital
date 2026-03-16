import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, User } from '../types';
import { userService } from '../services/userService';
import { governanceService } from '../services/governanceService';
import { useAppStore } from '../store/useAppStore';

vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
        setState: vi.fn()
    }
}));

describe('MINI-REGRESSÃO OBRIGATÓRIA (FREEZE V2)', () => {

    it('Cenário 1: Responsável deve manter isolamento de alunos não vinculados', () => {
        const guardian: User = {
            id: 'g_reg',
            role: UserRole.PAIS,
            childrenIds: ['child_ok'],
            tenantId: 't1',
            schoolId: 's1',
            status: 'ACTIVE'
        };
        
        expect(userService.canGuardianAccessStudent(guardian, 'child_ok')).toBe(true);
        expect(userService.canGuardianAccessStudent(guardian, 'child_intruder')).toBe(false);
        console.log('✅ Regressão Responsável: Isolamento mantido.');
    });

    it('Cenário 2: Professor Multi-escola deve ter Membership IDs distintos por unidade', () => {
        const teacher: User = {
            id: 't_reg',
            role: UserRole.PROFESSOR,
            tenantId: 't1',
            schoolId: 'school_A',
            status: 'ACTIVE'
        };

        const contextA = governanceService.resolveLegacyContext(teacher);
        const contextB = governanceService.resolveLegacyContext({ ...teacher, schoolId: 'school_B' });

        expect(contextA.activeMembershipId).not.toBe(contextB.activeMembershipId);
        expect(contextA.activeMembershipId).toContain('school_A');
        expect(contextB.activeMembershipId).toContain('school_B');
        console.log('✅ Regressão Professor: Membership IDs distintos por escola confirmados.');
    });

});
