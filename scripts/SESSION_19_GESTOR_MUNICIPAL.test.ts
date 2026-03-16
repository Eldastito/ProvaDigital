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

// -- PERFIL GESTOR MUNICIPAL --
const MOCK_MUNICIPAL_MANAGER_S19: User = {
    id: 'manager_s19',
    name: 'Gestor Municipal POA',
    email: 'poa@test.com',
    role: UserRole.TENANT_ADMIN, // Secretaria Municipal
    tenantId: 'poa_organization',
    schoolId: undefined, // Nível de Rede
    status: 'ACTIVE'
};

describe('SIMULAÇÃO TÉCNICA: SESSÃO 19 (GESTOR MUNICIPAL - ORG SCOPE)', () => {

    it('Etapa 1: Contexto de Rede (ORG level) deve ter activeSchoolId nulo', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S19);
        
        expect(ctx.activeOrganizationId).toBe('poa_organization');
        expect(ctx.activeScopeType).toBe('ORG');
        expect(ctx.activeSchoolId).toBeUndefined(); // REQUISITO: Nulo/Vazio no nível ORG
        expect(ctx.roleId).toBe('municipal_secretariat_admin');
        
        console.log('✅ Etapa 1: Contexto de Rede (ORG) validado com activeSchoolId nulo.');
    });

    it('Etapa 2: Bloqueio Total para Outra Prefeitura (Isolamento ORG)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S19);
        
        // Tenta acessar dados da Prefeitura de Canoas
        const isAuthorized = governanceService['evaluateCoreDecision'](
            'ANALYTICS', 
            'VIEW', 
            { ...ctx, targetOrganizationId: 'canoas_organization' }
        );
        
        expect(isAuthorized).toBe(false);
        console.log('✅ Etapa 2: Isolamento entre prefeituras (ORG) validado.');
    });

    it('Etapa 3: Drill-down Legítimo p/ Escola da Própria Rede', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S19);
        
        // Simula entrada em uma escola da própria rede
        const drillDownContext = { 
            ...ctx, 
            activeSchoolId: 'school_poa_1',
            targetSchoolId: 'school_poa_1' 
        };
        
        const isAuthorized = governanceService['evaluateCoreDecision']('ANALYTICS', 'VIEW', drillDownContext);
        expect(isAuthorized).toBe(true);
        expect(drillDownContext.activeOrganizationId).toBe('poa_organization');
        
        console.log('✅ Etapa 3: Drill-down legítimo para escola da rede validado.');
    });

    it('Etapa 4: Bloqueio de Visão Estadual/Federal (Escopo ORG)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S19);
        
        // Tenta acessar recurso de nível estadual
        // Para fins de simulação, assumimos que o motor já nega se o targetOrgId for diferente e o escopo for ORG
        const isAuthorized = governanceService['evaluateCoreDecision'](
            'SYSTEM_MGMT', 
            'VIEW', 
            { ...ctx, targetOrganizationId: 'state_secretariat_id' }
        );
        
        expect(isAuthorized).toBe(false);
        console.log('✅ Etapa 4: Bloqueio de visão hierárquica superior validado.');
    });

    it('Performance Audit (ORG Scope - Baseline 87b037a)', () => {
        const start = performance.now();
        for(let i=0; i<3000; i++) {
            governanceService.resolveLegacyContext(MOCK_MUNICIPAL_MANAGER_S19);
        }
        const end = performance.now();
        const avg = (end - start) / 3000;
        expect(avg).toBeLessThan(0.05);
        console.log(`🔵 Performance Motor (Gestor Municipal): ${avg.toFixed(4)}ms`);
    });
});
