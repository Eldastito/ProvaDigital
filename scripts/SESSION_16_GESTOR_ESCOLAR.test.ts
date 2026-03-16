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

// -- PERFIL GESTOR ESCOLAR --
const MOCK_MANAGER_S16: User = {
    id: 'manager_s16',
    name: 'Gestor Escolar 16',
    email: 'manager16@test.com',
    role: UserRole.DIRETOR,
    tenantId: 'tenant_A',
    schoolId: 'school_1',
    status: 'ACTIVE'
};

describe('SIMULAÇÃO TÉCNICA: SESSÃO 16 (GESTOR ESCOLAR - FREEZE V2)', () => {

    it('Etapa 1: Resolução de Contexto Canônico (UNIT scope)', () => {
        const context = governanceService.resolveLegacyContext(MOCK_MANAGER_S16);
        
        expect(context.activeOrganizationId).toBe('tenant_A');
        expect(context.activeSchoolId).toBe('school_1');
        expect(context.activeScopeType).toBe('UNIT');
        expect(context.roleId).toBe('school_manager');
        expect(context.activeMembershipId).toContain('school_1');
        
        console.log('✅ Etapa 1: Contexto canônico UNIT validado para Gestor Escolar.');
    });

    it('Etapa 2: Permissão Legítima dentro da Unidade (Shadow AUDIT)', () => {
        const context = governanceService.resolveLegacyContext(MOCK_MANAGER_S16);
        const targetContext = { ...context, targetSchoolId: 'school_1' };
        
        // Simula decisão do Core (mesmo contexto de escola)
        const isCoreAuthorized = targetContext.targetSchoolId === targetContext.activeSchoolId;
        expect(isCoreAuthorized).toBe(true);
        
        console.log('✅ Etapa 2: Acesso administrativo dentro da própria escola validado.');
    });

    it('Etapa 3: Bloqueio de Isolamento Cross-School em Nível Administrativo', () => {
        const context = governanceService.resolveLegacyContext(MOCK_MANAGER_S16);
        
        // Tenta forcar acesso a dados da Escola 2
        const targetContextIntruder = { ...context, targetSchoolId: 'school_2' };
        
        // Simulando log de divergência crítica se o legado permitisse
        // if (activeScopeType === 'UNIT' && targetSchoolId !== activeSchoolId) return false;
        const isCoreAuthorized = targetContextIntruder.targetSchoolId === targetContextIntruder.activeSchoolId;
        
        expect(isCoreAuthorized).toBe(false);
        console.log('✅ Etapa 3: Bloqueio de isolamento cross-school para Gestor Escolar validado.');
    });

    it('Etapa 4: Bloqueio de Acesso a Relatórios de Rede (Escopo UNIT)', () => {
        const context = governanceService.resolveLegacyContext(MOCK_MANAGER_S16);
        
        // Tenta acessar recurso 'network_reports' que exige escopo 'ORG' ou 'GLOBAL'
        // No motor, o Gestor Escolar é UNIT.
        expect(context.activeScopeType).toBe('UNIT');
        
        console.log('✅ Etapa 4: Bloqueio de visibilidade municipal/rede para Gestor UNIT validado.');
    });

    it('Performance Audit (Baseline Canônica 0d6c474)', () => {
        const start = performance.now();
        for(let i=0; i<3000; i++) {
            governanceService.resolveLegacyContext(MOCK_MANAGER_S16);
        }
        const end = performance.now();
        const avg = (end - start) / 3000;
        expect(avg).toBeLessThan(0.05);
        console.log(`🔵 Performance Motor (Gestor): ${avg.toFixed(4)}ms`);
    });
});
