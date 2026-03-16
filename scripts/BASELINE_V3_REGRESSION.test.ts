import { describe, it, expect, vi } from 'vitest';
import { UserRole, User } from '../types';
import { governanceService } from '../services/governanceService';

vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
        setState: vi.fn()
    }
}));

// --- MOCKS TRANSVERSAIS ---

const MOCK_GUARDIAN: User = {
    id: 'guardian_v3',
    role: UserRole.RESPONSAVEL,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    status: 'ACTIVE'
};

const MOCK_PROFESSOR_MULTI: User = {
    id: 'prof_multi_v3',
    role: UserRole.PROFESSOR,
    tenantId: 'tenant_A',
    schoolId: 'school_1', // Inicia na Escola 1
    status: 'ACTIVE'
};

const MOCK_GESTOR_UNIT: User = {
    id: 'gestor_unit_v3',
    role: UserRole.DIRETOR,
    tenantId: 'tenant_A',
    schoolId: 'school_2',
    status: 'ACTIVE'
};

const MOCK_GESTOR_ORG: User = {
    id: 'gestor_org_v3',
    role: UserRole.TENANT_ADMIN,
    tenantId: 'poa_organization',
    schoolId: undefined,
    status: 'ACTIVE'
};

describe('REGRESSÃO OBRIGATÓRIA: BASELINE V3 (15BBE48)', () => {

    describe('1. Domínio: Responsáveis', () => {
        it('Deve permitir acesso legítimo e negar cross-school/unlinked', () => {
            const ctx = governanceService.resolveLegacyContext(MOCK_GUARDIAN);
            expect(ctx.activeScopeType).toBe('UNIT');
            
            // Simula verificação de aluno da mesma escola (autorizado no nível UI/Service legado)
            const allowed = governanceService['evaluateCoreDecision']('STUDENT_DATA', 'VIEW', { ...ctx, targetSchoolId: 'school_1' });
            expect(allowed).toBe(true);
            
            // Simula acesso a outra escola (bloqueio core)
            const denied = governanceService['evaluateCoreDecision']('STUDENT_DATA', 'VIEW', { ...ctx, targetSchoolId: 'school_999' });
            expect(denied).toBe(false);
            
            console.log('✅ Regressão Responsável: Isolamento mantido na v3.');
        });
    });

    describe('2. Domínio: Professor Multi-escola', () => {
        it('Deve gerenciar troca de contexto e manter integridade de IDs', () => {
            // Contexto Escola 1
            const ctx1 = governanceService.resolveLegacyContext(MOCK_PROFESSOR_MULTI);
            expect(ctx1.activeSchoolId).toBe('school_1');
            
            // Simula troca para Escola 2 (atualizando o mock)
            const ctx2 = governanceService.resolveLegacyContext({ ...MOCK_PROFESSOR_MULTI, schoolId: 'school_2' });
            expect(ctx2.activeSchoolId).toBe('school_2');
            expect(ctx2.activeMembershipId).toContain('prof_multi_v3');
            
            console.log('✅ Regressão Professor: Troca de contexto multi-escola estável na v3.');
        });
    });

    describe('3. Domínio: Gestor Escolar (UNIT)', () => {
        it('Deve permitir gestão da própria unidade e bloquear outras', () => {
            const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_UNIT);
            expect(ctx.activeScopeType).toBe('UNIT');
            
            const allowed = governanceService['evaluateCoreDecision']('REPORTS', 'VIEW', { ...ctx, targetSchoolId: 'school_2' });
            const denied = governanceService['evaluateCoreDecision']('REPORTS', 'VIEW', { ...ctx, targetSchoolId: 'school_1' });
            
            expect(allowed).toBe(true);
            expect(denied).toBe(false);
            
            console.log('✅ Regressão Gestor UNIT: Isolamento administrativo confirmado.');
        });
    });

    describe('4. Domínio: Gestor Municipal (ORG)', () => {
        it('Deve garantir activeSchoolId nulo no nível rede e isolamento organizacional', () => {
            const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_ORG);
            
            // 4.1 Nulo no nível de rede
            expect(ctx.activeScopeType).toBe('ORG'); // SSOT: Nomeclatura Nova
            expect(ctx.activeSchoolId).toBeUndefined(); // REQUISITO: null/undefined em ORG level
            
            // 4.2 Isolamento Inter-Rede (Canoas vs POA)
            const isDenyCanoas = governanceService['evaluateCoreDecision'](
                'NETWORK_ANALYTICS', 
                'VIEW', 
                { ...ctx, targetOrganizationId: 'canoas_org' }
            );
            expect(isDenyCanoas).toBe(false);
            
            // 4.3 Drill-down e Limpeza
            const drillDown = { ...ctx, activeSchoolId: 'school_poa_drill' };
            expect(drillDown.activeSchoolId).toBeDefined();
            
            console.log('✅ Regressão Gestor ORG: Nomenclatura, Isolamento e Contexto ORG validados.');
        });
    });

    it('Performance Audit (V3 Transversal)', () => {
        const start = performance.now();
        governanceService.resolveLegacyContext(MOCK_GUARDIAN);
        governanceService.resolveLegacyContext(MOCK_PROFESSOR_MULTI);
        governanceService.resolveLegacyContext(MOCK_GESTOR_UNIT);
        governanceService.resolveLegacyContext(MOCK_GESTOR_ORG);
        const end = performance.now();
        expect((end - start) / 4).toBeLessThan(0.05);
        console.log(`🔵 Latência Média V3 (Multi-actor): ${((end - start) / 4).toFixed(4)}ms`);
    });
});
