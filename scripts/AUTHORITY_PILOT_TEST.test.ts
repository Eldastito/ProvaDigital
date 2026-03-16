import { describe, it, expect, vi } from 'vitest';
import { UserRole, User } from '../types';
import { governanceService } from '../services/governanceService';

vi.mock('../store/useAppStore', () => ({
    useAppStore: { getState: vi.fn(), setState: vi.fn() }
}));

const MOCK_GESTOR_ESCOLAR: User = {
    id: 'gestor_escola_1', name: 'Diretor Alpha', email: 'd@school.com',
    role: UserRole.DIRETOR, tenantId: 'poa_organization', schoolId: 'school_poa_1', status: 'ACTIVE'
};

const MOCK_GESTOR_MUNICIPAL: User = {
    id: 'gestor_mun_poa', name: 'Sec Municipal POA', email: 'sec@poa.gov.br',
    role: UserRole.TENANT_ADMIN, tenantId: 'poa_organization', schoolId: undefined, status: 'ACTIVE'
};

describe('AUTHORITY PILOT: Feature Flag, Rollback & Auto-Disable', () => {

    beforeEach(() => {
        governanceService.setAuthorityPilot(false);
        governanceService.clearCache();
    });

    it('Flag OFF: Legado decide (Shadow Mode normal)', () => {
        const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_ESCOLAR);
        const result = governanceService.can('ANALYTICS', 'VIEW', ctx, true, 'DASHBOARD');
        expect(result).toBe(true); // Legado decide
        expect(governanceService.getAuthorityPilotStatus().enabled).toBe(false);
        console.log('✅ Flag OFF: Legado decide como esperado.');
    });

    it('Flag ON: Core decide para recurso whitelisted (ANALYTICS + VIEW + UNIT)', () => {
        governanceService.setAuthorityPilot(true);
        const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_ESCOLAR);
        const result = governanceService.can('ANALYTICS', 'VIEW', ctx, false, 'DASHBOARD');
        // Core decide TRUE (gestor tem permissão), mesmo que legado diria FALSE
        expect(result).toBe(true);
        console.log('✅ Flag ON: Core decidiu para ANALYTICS:VIEW.');
    });

    it('Flag ON: Legado decide para recurso FORA do whitelist', () => {
        governanceService.setAuthorityPilot(true);
        const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_ESCOLAR);
        const result = governanceService.can('EXAM_MGMT', 'VIEW', ctx, true, 'DASHBOARD');
        expect(result).toBe(true); // Legado decide (recurso fora do whitelist)
        console.log('✅ Flag ON: Legado decide para recurso fora do whitelist.');
    });

    it('Flag ON: Legado decide para ação FORA do whitelist (WRITE)', () => {
        governanceService.setAuthorityPilot(true);
        const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_ESCOLAR);
        const result = governanceService.can('ANALYTICS', 'WRITE', ctx, true, 'DASHBOARD');
        expect(result).toBe(true); // Legado decide (ação não whitelisted)
        console.log('✅ Flag ON: Legado decide para ação WRITE (não whitelisted).');
    });

    it('Flag ON: Legado decide para escopo GLOBAL (não whitelisted)', () => {
        governanceService.setAuthorityPilot(true);
        const mecUser: User = {
            id: 'mec_admin', name: 'MEC', email: 'mec@gov.br',
            role: UserRole.SUPER_ADMIN, tenantId: 'mec_hq', schoolId: undefined, status: 'ACTIVE'
        };
        const ctx = governanceService.resolveLegacyContext(mecUser);
        const result = governanceService.can('ANALYTICS', 'VIEW', ctx, true, 'DASHBOARD');
        expect(result).toBe(true); // Legado (GLOBAL não está no whitelist)
        console.log('✅ Flag ON: MEC/GLOBAL cai no legado (não whitelisted).');
    });

    it('Flag ON: Recurso denied explícito (STUDENT_PEDAGOGICAL_DATA)', () => {
        governanceService.setAuthorityPilot(true);
        const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_ESCOLAR);
        const result = governanceService.can('STUDENT_PEDAGOGICAL_DATA', 'VIEW', ctx, true, 'DASHBOARD');
        expect(result).toBe(true); // Legado (recurso na deny list)
        console.log('✅ Flag ON: Recurso denied cai no legado.');
    });

    it('Kill Switch: Desligar flag e legado reassume instantaneamente', () => {
        governanceService.setAuthorityPilot(true);
        expect(governanceService.getAuthorityPilotStatus().enabled).toBe(true);
        
        governanceService.setAuthorityPilot(false);
        expect(governanceService.getAuthorityPilotStatus().enabled).toBe(false);
        
        const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_ESCOLAR);
        const result = governanceService.can('ANALYTICS', 'VIEW', ctx, true, 'DASHBOARD');
        expect(result).toBe(true); // Legado decide
        console.log('✅ Kill Switch: Flag desligada, legado reassumiu.');
    });

    it('Gestor Municipal (ORG): Core decide no Authority Pilot', () => {
        governanceService.setAuthorityPilot(true);
        const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_MUNICIPAL);
        expect(ctx.activeScopeType).toBe('ORG');
        const result = governanceService.can('NETWORK_ANALYTICS', 'VIEW', ctx, false, 'DASHBOARD');
        expect(result).toBe(true); // Core
        console.log('✅ Gestor Municipal: Core decide no Authority Pilot.');
    });

    it('Performance: Authority Pilot decision latency', () => {
        governanceService.setAuthorityPilot(true);
        const ctx = governanceService.resolveLegacyContext(MOCK_GESTOR_ESCOLAR);
        const start = performance.now();
        for (let i = 0; i < 3000; i++) {
            governanceService.can('ANALYTICS', 'VIEW', ctx, true, 'DASHBOARD');
        }
        const end = performance.now();
        const avg = (end - start) / 3000;
        expect(avg).toBeLessThan(0.05);
        console.log(`🔵 Latência Authority Pilot: ${avg.toFixed(4)}ms`);
    });
});
