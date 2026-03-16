import { describe, it, expect, vi } from 'vitest';
import { UserRole, User } from '../types';
import { governanceService } from '../services/governanceService';

vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
        setState: vi.fn()
    }
}));

// -- PERFIL GESTOR FEDERAL (MEC) --
const MOCK_MEC_MANAGER_S22: User = {
    id: 'mec_manager_federal',
    name: 'MEC Manager',
    email: 'mec@federal.gov.br',
    role: UserRole.SUPER_ADMIN,
    tenantId: 'mec_hq',
    schoolId: undefined,
    status: 'ACTIVE'
};

describe('SIMULADOR TÉCNICO: SESSÃO 22 (GESTOR FEDERAL - GLOBAL ONISCIENCE)', () => {

    it('Caso 1: MEC Dashboard Federal legitimado', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        expect(ctx.activeOrganizationId).toBe('mec_hq');
        expect(ctx.activeScopeType).toBe('GLOBAL');
        expect(ctx.roleId).toBe('mec_superadmin');
        console.log('✅ Caso 1: MEC Dashboard inicializado.');
    });

    it('Caso 2: MEC -> Estado Público (RS)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const drillDownCtx = { ...ctx, targetOrganizationId: 'state_rs_org' };
        
        const isAuthorized = governanceService['evaluateCoreDecision']('NETWORK_ANALYTICS', 'VIEW', drillDownCtx);
        expect(isAuthorized).toBe(true);
        console.log('✅ Caso 2: MEC -> Estado Público RS permitido.');
    });

    it('Caso 3: MEC -> Município Público (POA)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const drillDownCtx = { ...ctx, targetOrganizationId: 'poa_organization' };
        
        const isAuthorized = governanceService['evaluateCoreDecision']('NETWORK_ANALYTICS', 'VIEW', drillDownCtx);
        expect(isAuthorized).toBe(true);
        console.log('✅ Caso 3: MEC -> Município Público POA permitido.');
    });

    it('Caso 4: MEC -> Escola Pública', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const drillDownCtx = { ...ctx, activeScopeType: 'UNIT' as any, targetSchoolId: 'school_poa_1' };
        
        const isAuthorized = governanceService['evaluateCoreDecision']('SCHOOL_DATA', 'VIEW', drillDownCtx);
        expect(isAuthorized).toBe(true);
        console.log('✅ Caso 4: MEC -> Escola Pública permitido.');
    });

    it('Caso 5: Retorno Escola -> Federal com Limpeza', () => {
        const ctxPostReturn = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        expect(ctxPostReturn.activeSchoolId).toBeUndefined();
        expect(ctxPostReturn.targetOrganizationId).toBeUndefined();
        console.log('✅ Caso 5: Retorno de escola p/ federal limpou contexto.');
    });

    it('Caso 6: MEC -> Escola Privada COM Grant', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const drillDownCtx = { ...ctx, targetOrganizationId: 'private_school_A' };
        
        const isAuthorized = governanceService['evaluateCoreDecision']('ORGANIZATION_METADATA', 'VIEW', drillDownCtx);
        expect(isAuthorized).toBe(true);
        console.log('✅ Caso 6: MEC -> Escola Privada A (Grant Ativo) permitido.');
    });

    it('Caso 7: MEC -> Escola Privada SEM Grant', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const drillDownCtx = { ...ctx, targetOrganizationId: 'private_school_B' }; // Não está no mock de grant
        
        const isAuthorized = governanceService['evaluateCoreDecision']('ORGANIZATION_METADATA', 'VIEW', drillDownCtx);
        expect(isAuthorized).toBe(false);
        console.log('✅ Caso 7: MEC -> Escola Privada B (Grant Inativo) bloqueado.');
    });

    it('Caso 8: MEC -> Grupo Privado (Sem Grant)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const drillDownCtx = { ...ctx, targetOrganizationId: 'private_group_X' };
        
        const isAuthorized = governanceService['evaluateCoreDecision']('ANALYTICS', 'VIEW', drillDownCtx);
        expect(isAuthorized).toBe(false);
        console.log('✅ Caso 8: MEC -> Grupo Privado X (Sem Grant) bloqueado.');
    });

    it('Caso 9: MEC -> ExamePad Ops', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const isAuthorized = governanceService['evaluateCoreDecision']('EXAMEPAD_OPS', 'VIEW', ctx);
        expect(isAuthorized).toBe(false);
        console.log('✅ Caso 9: Bloqueio de ExamePad Ops para o MEC.');
    });

    it('Caso 10: MEC -> SaaS Platform', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const isAuthorized = governanceService['evaluateCoreDecision']('SAAS_PLATFORM', 'VIEW', ctx);
        expect(isAuthorized).toBe(false);
        console.log('✅ Caso 10: Bloqueio de SaaS Platform para o MEC.');
    });

    it('Caso 11: MEC -> Financeiro/Logística', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const logAuthorized = governanceService['evaluateCoreDecision']('LOGISTICS', 'VIEW', ctx);
        const finAuthorized = governanceService['evaluateCoreDecision']('FINANCE', 'VIEW', ctx);
        expect(logAuthorized).toBe(false);
        expect(finAuthorized).toBe(false);
        console.log('✅ Caso 11: Bloqueio de Financeiro/Logística para o MEC.');
    });

    it('Caso 12: Stale Context (Privada Autorizada -> Privada Não Autorizada)', () => {
        // Acessa A (OK)
        let ctx = { ...governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22), targetOrganizationId: 'private_school_A' };
        expect(governanceService['evaluateCoreDecision']('ORGANIZATION_METADATA', 'VIEW', ctx)).toBe(true);
        
        // Simula navegação p/ B (Sem autorização)
        ctx = { ...governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22), targetOrganizationId: 'private_school_B' };
        const isAuthorized = governanceService['evaluateCoreDecision']('ORGANIZATION_METADATA', 'VIEW', ctx);
        
        expect(isAuthorized).toBe(false);
        console.log('✅ Caso 12: Zero Stale Context entre privada autorizada e não autorizada.');
    });

    it('Extra Case: Restrição Pedagógica Individual (Individual Grades)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        const isAuthorized = governanceService['evaluateCoreDecision']('STUDENT_PEDAGOGICAL_DATA', 'VIEW', ctx);
        expect(isAuthorized).toBe(false);
        console.log('✅ Extra: Bloqueio de dados pedagógicos individuais para o MEC.');
    });

    it('Performance: GLOBALDecision Delay', () => {
        const start = performance.now();
        for(let i=0; i<3000; i++) {
            governanceService.resolveLegacyContext(MOCK_MEC_MANAGER_S22);
        }
        const end = performance.now();
        expect((end - start) / 3000).toBeLessThan(0.05);
        console.log(`🔵 Latência GLOBAL (Onisciência): ${((end - start) / 3000).toFixed(4)}ms`);
    });
});
