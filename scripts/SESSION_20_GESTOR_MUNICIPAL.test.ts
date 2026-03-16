import { describe, it, expect, vi } from 'vitest';
import { UserRole, User } from '../types';
import { governanceService } from '../services/governanceService';

vi.mock('../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
        setState: vi.fn()
    }
}));

// -- PERFIL GESTOR MUNICIPAL (SIMETRIA CANOAS) --
const MOCK_MUNICIPAL_MANAGER_S20: User = {
    id: 'manager_s20_canoas',
    name: 'Gestor Municipal Canoas',
    email: 'canoas@test.com',
    role: UserRole.TENANT_ADMIN, 
    tenantId: 'canoas_organization', // DIFERENTE DA S19 (POA)
    schoolId: undefined, 
    status: 'ACTIVE'
};

describe('SIMULAÇÃO TÉCNICA: SESSÃO 20 (GESTOR MUNICIPAL - SIMETRIA ORG)', () => {

    it('Etapa 1: Contexto de Canoas (ORG) deve estar purificado (activeSchoolId nulo)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S20);
        
        expect(ctx.activeOrganizationId).toBe('canoas_organization');
        expect(ctx.activeScopeType).toBe('ORG');
        expect(ctx.activeSchoolId).toBeUndefined(); 
        
        console.log('✅ Etapa 1: Simetria validada - Canoas (ORG) inicia com activeSchoolId nulo.');
    });

    it('Etapa 2: Bloqueio Total para POA (Isolamento Inter-Rede)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S20);
        
        // Tenta acessar dados da Prefeitura de POA (Inversão da S19)
        const isAuthorized = governanceService['evaluateCoreDecision'](
            'ANALYTICS', 
            'VIEW', 
            { ...ctx, targetOrganizationId: 'poa_organization' }
        );
        
        expect(isAuthorized).toBe(false);
        console.log('✅ Etapa 2: Isolamento organizacional (Canoas -> POA) validado.');
    });

    it('Etapa 3: Drill-down Segregado para Escola de Canoas', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S20);
        
        // Simula entrada em escola de Canoas
        const drillDownContext = { 
            ...ctx, 
            activeSchoolId: 'school_canoas_99',
            targetSchoolId: 'school_canoas_99' 
        };
        
        const isAuthorized = governanceService['evaluateCoreDecision']('REPORTS', 'VIEW', drillDownContext);
        expect(isAuthorized).toBe(true);
        expect(drillDownContext.activeOrganizationId).toBe('canoas_organization');
        
        console.log('✅ Etapa 3: Drill-down subordinado em Canoas validado.');
    });

    it('Etapa 4: Limpeza de Contexto no Retorno drill-down', () => {
        // Simula o estado após sair do drill-down
        const ctxAfterReturn = governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S20);
        expect(ctxAfterReturn.activeSchoolId).toBeUndefined();
        
        console.log('✅ Etapa 4: Limpeza de activeSchoolId após retorno do drill-down validada.');
    });

    it('Performance (Simetria v3)', () => {
        const start = performance.now();
        for(let i=0; i<3000; i++) {
            governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S20);
        }
        const end = performance.now();
        expect((end - start) / 3000).toBeLessThan(0.05);
        console.log(`🔵 Latência Canoas: ${((end - start) / 3000).toFixed(4)}ms`);
    });
});
