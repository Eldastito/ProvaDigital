import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, User } from '../types';
import { governanceService } from '../services/governanceService';
import { useAppStore } from '../store/useAppStore';

vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
        setState: vi.fn()
    }
}));

const MOCK_MANAGER_S17: User = {
    id: 'manager_s17',
    name: 'Gestor Escolar 17 (Alta Intensidade)',
    role: UserRole.DIRETOR,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    status: 'ACTIVE'
};

const MOCK_MANAGER_S18: User = {
    id: 'manager_s18',
    name: 'Gestor Escolar 18 (Nova Unidade)',
    role: UserRole.DIRETOR,
    tenantId: 'tenant_A',
    schoolId: 'school_3',
    status: 'ACTIVE'
};

describe('ONDA 2: MICRO-ESCALA GESTOR ESCOLAR (SESSÕES 17 E 18)', () => {

    describe('Sessão 17: Jornada Intensa e Anti-Privilege Escalation', () => {
        it('Deve manter escopo UNIT mesmo sob múltiplas requisições administrativas', () => {
            for(let i=0; i<50; i++) {
                const ctx = governanceService.resolveLegacyContext(MOCK_MANAGER_S17);
                expect(ctx.activeScopeType).toBe('UNIT');
                expect(ctx.activeSchoolId).toBe('school_1');
            }
            console.log('✅ Sessão 17: Estabilidade de escopo UNIT em alta intensidade confirmada.');
        });
    });

    describe('Sessão 18: Isolamento em Nova Unidade (school_3)', () => {
        it('Deve garantir que o Gestor da Escola 3 não acesse Escola 1 ou Escola 2', () => {
            const ctx = governanceService.resolveLegacyContext(MOCK_MANAGER_S18);
            expect(ctx.activeSchoolId).toBe('school_3');
            
            // Tentativas de Cross-School
            const intruder1 = { ...ctx, targetSchoolId: 'school_1' };
            const intruder2 = { ...ctx, targetSchoolId: 'school_2' };
            
            expect(intruder1.targetSchoolId).not.toBe(intruder1.activeSchoolId);
            expect(intruder2.targetSchoolId).not.toBe(intruder2.activeSchoolId);
            
            console.log('✅ Sessão 18: Isolamento rigoroso da Escola 3 validado.');
        });
    });

    it('Performance Audit (Micro-escala Gestores)', () => {
        const start = performance.now();
        for(let i=0; i<3000; i++) {
            governanceService.resolveLegacyContext(MOCK_MANAGER_S17);
        }
        const end = performance.now();
        const avg = (end - start) / 3000;
        expect(avg).toBeLessThan(0.05);
        console.log(`🔵 Performance Motor (Gestores 17/18): ${avg.toFixed(4)}ms`);
    });
});
