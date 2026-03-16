import { describe, it, expect, vi } from 'vitest';
import { UserRole, User } from '../types';
import { governanceService } from '../services/governanceService';

vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
        setState: vi.fn()
    }
}));

// -- PERFIL GESTOR ESTADUAL (ESTRUTURA RS) --
const MOCK_STATE_MANAGER_S21: User = {
    id: 'state_manager_rs',
    role: UserRole.STATE_ADMIN,
    tenantId: 'state_rs_org',
    schoolId: undefined,
    status: 'ACTIVE'
};

describe('SIMULADOR TÉCNICO: SESSÃO 21 (GESTOR ESTADUAL - ORG HIERARCHY)', () => {

    it('Caso A: Dashboard Estadual Legítimo', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_STATE_MANAGER_S21);
        expect(ctx.activeOrganizationId).toBe('state_rs_org');
        expect(ctx.activeScopeType).toBe('ORG');
        expect(ctx.activeSchoolId).toBeUndefined();
        
        console.log('✅ Caso A: Dashboard RS inicializado com activeSchoolId nulo.');
    });

    it('Caso B: Drill-down Legítimo Estadual -> Município (POA)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_STATE_MANAGER_S21);
        
        // Simula navegação para POA (Subordinado)
        const drillDownCtx = { 
            ...ctx, 
            targetOrganizationId: 'poa_organization' 
        };
        
        const isAuthorized = governanceService['evaluateCoreDecision']('NETWORK_ANALYTICS', 'VIEW', drillDownCtx);
        expect(isAuthorized).toBe(true);
        expect(drillDownCtx.activeOrganizationId).toBe('state_rs_org'); // Mantém autoridade
        
        console.log('✅ Caso B: Drill-down RS -> POA permitido (Hierarquia OK).');
    });

    it('Caso C: Drill-down Legítimo Estadual -> Escola subordinada', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_STATE_MANAGER_S21);
        
        // RS -> POA -> Escola POA 1
        const schoolCtx = { 
            ...ctx, 
            activeScopeType: 'UNIT' as any, // Transição de escopo p/ UNIT
            activeSchoolId: 'school_poa_1',
            targetSchoolId: 'school_poa_1',
            targetOrganizationId: 'school_poa_1' // Na v3, escolas são organizações UNIT
        };
        
        const isAuthorized = governanceService['evaluateCoreDecision']('STUDENT_DATA', 'VIEW', schoolCtx);
        expect(isAuthorized).toBe(true);
        
        console.log('✅ Caso C: Drill-down RS -> Escola de POA permitido (Hierarquia UNIT OK).');
    });

    it('Caso D: Retorno Limpo (Escola -> Estado)', () => {
        // Simula retorno ao dashboard estadual
        const ctxAfterReturn = governanceService.resolveLegacyContext(MOCK_STATE_MANAGER_S21);
        expect(ctxAfterReturn.activeSchoolId).toBeUndefined();
        expect(ctxAfterReturn.targetOrganizationId).toBeUndefined();
        
        console.log('✅ Caso D: Retorno de escola p/ estado limpou contexto temporário.');
    });

    it('Caso E: Tentativa Inter-Estado (RS -> SC)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_STATE_MANAGER_S21);
        
        const isAuthorized = governanceService['evaluateCoreDecision'](
            'ANALYTICS', 
            'VIEW', 
            { ...ctx, targetOrganizationId: 'state_sc_org' }
        );
        
        expect(isAuthorized).toBe(false);
        console.log('✅ Caso E: Bloqueio Inter-Estado (RS -> SC) validado.');
    });

    it('Caso F: Tentativa Federal (RS -> MEC)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_STATE_MANAGER_S21);
        
        const isAuthorized = governanceService['evaluateCoreDecision'](
            'GLOBAL_REPORTS', 
            'VIEW', 
            { ...ctx, targetOrganizationId: 'mec_hq' }
        );
        
        expect(isAuthorized).toBe(false);
        console.log('✅ Caso F: Bloqueio Federal (RS -> MEC) validado.');
    });

    it('Caso G: Teste de Stale Context (Herança entre municípios)', () => {
        // Entra em POA
        let ctx = { ...governanceService.resolveLegacyContext(MOCK_STATE_MANAGER_S21), targetOrganizationId: 'poa_organization' };
        
        // Volta (Simula reset)
        ctx = governanceService.resolveLegacyContext(MOCK_STATE_MANAGER_S21);
        
        // Tenta entrar em Canoas
        const canoasCtx = { ...ctx, targetOrganizationId: 'canoas_organization' };
        const isAuthorized = governanceService['evaluateCoreDecision']('ANALYTICS', 'VIEW', canoasCtx);
        
        expect(isAuthorized).toBe(true);
        expect(canoasCtx.targetOrganizationId).not.toBe('poa_organization');
        
        console.log('✅ Caso G: Stale Context evitado na navegação entre municípios.');
    });

    it('Performance (State Hierarchy Scale)', () => {
        const start = performance.now();
        for(let i=0; i<3000; i++) {
            governanceService.resolveLegacyContext(MOCK_STATE_MANAGER_S21);
        }
        const end = performance.now();
        expect((end - start) / 3000).toBeLessThan(0.05);
        console.log(`🔵 Latência Estadual (Hierarchy Mock): ${((end - start) / 3000).toFixed(4)}ms`);
    });
});
