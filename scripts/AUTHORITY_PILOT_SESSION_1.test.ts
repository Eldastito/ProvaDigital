import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, User } from '../types';
import { governanceService } from '../services/governanceService';

vi.mock('../store/useAppStore', () => ({
    useAppStore: { getState: vi.fn(), setState: vi.fn() }
}));

// -- USUÁRIO PILOTO: Gestor Escolar (Escola POA 1) --
const PILOT_USER: User = {
    id: 'gestor_escola_poa1', name: 'Diretor Piloto Alpha', email: 'diretor@escolapoa1.br',
    role: UserRole.DIRETOR, tenantId: 'poa_organization', schoolId: 'school_poa_1', status: 'ACTIVE'
};

describe('AUTHORITY PILOT - SESSÃO 1 (1 Gestor Escolar / 1 Escola / UNIT)', () => {

    beforeEach(() => {
        governanceService.clearCache();
        governanceService.setAuthorityPilot(true); // Liga a flag
    });

    afterAll(() => {
        governanceService.setAuthorityPilot(false); // Kill switch pós-sessão
    });

    // === PRÉ-ATIVAÇÃO: Validar mapeamento do usuário piloto ===
    it('Pré-check: Usuário mapeado como school_manager / UNIT', () => {
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        expect(ctx.roleId).toBe('school_manager');
        expect(ctx.activeScopeType).toBe('UNIT');
        expect(ctx.activeSchoolId).toBe('school_poa_1');
        expect(ctx.activeOrganizationId).toBe('poa_organization');
        console.log('✅ Pré-check: Usuário piloto mapeado para school_manager / UNIT / school_poa_1.');
    });

    // === CASO 1: Core decide ANALYTICS VIEW ===
    it('Caso 1: Core decide ANALYTICS:VIEW (whitelisted)', () => {
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        // Legado diria FALSE, Core deve sobrescrever para TRUE
        const result = governanceService.can('ANALYTICS', 'VIEW', ctx, false, 'DASHBOARD');
        expect(result).toBe(true); // Core decide
        console.log('✅ Caso 1: Core decidiu ANALYTICS:VIEW = true.');
    });

    // === CASO 2: Core decide SCHOOL_AGGREGATE_DATA VIEW ===
    it('Caso 2: Core decide SCHOOL_AGGREGATE_DATA:VIEW (whitelisted)', () => {
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        const result = governanceService.can('SCHOOL_AGGREGATE_DATA', 'VIEW', ctx, false, 'DASHBOARD');
        expect(result).toBe(true);
        console.log('✅ Caso 2: Core decidiu SCHOOL_AGGREGATE_DATA:VIEW = true.');
    });

    // === CASO 3: Core decide INSTITUTIONAL_METADATA VIEW ===
    it('Caso 3: Core decide INSTITUTIONAL_METADATA:VIEW (whitelisted)', () => {
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        const result = governanceService.can('INSTITUTIONAL_METADATA', 'VIEW', ctx, false, 'DASHBOARD');
        expect(result).toBe(true);
        console.log('✅ Caso 3: Core decidiu INSTITUTIONAL_METADATA:VIEW = true.');
    });

    // === CASO 4: Legado decide NETWORK_ANALYTICS (denied nesta rodada) ===
    it('Caso 4: Legado decide NETWORK_ANALYTICS (denied list)', () => {
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        const result = governanceService.can('NETWORK_ANALYTICS', 'VIEW', ctx, true, 'DASHBOARD');
        expect(result).toBe(true); // Legado decide
        console.log('✅ Caso 4: NETWORK_ANALYTICS cai no legado (denied nesta rodada).');
    });

    // === CASO 5: Legado decide escrita (VIEW only) ===
    it('Caso 5: Legado decide ANALYTICS:WRITE (ação não whitelisted)', () => {
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        const result = governanceService.can('ANALYTICS', 'WRITE', ctx, false, 'DASHBOARD');
        expect(result).toBe(false); // Legado (WRITE não whitelisted)
        console.log('✅ Caso 5: Escrita cai no legado.');
    });

    // === CASO 6: Legado decide dado pedagógico individual ===
    it('Caso 6: Legado decide STUDENT_PEDAGOGICAL_DATA (denied)', () => {
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        const result = governanceService.can('STUDENT_PEDAGOGICAL_DATA', 'VIEW', ctx, false, 'DASHBOARD');
        expect(result).toBe(false); // Legado
        console.log('✅ Caso 6: Dado pedagógico individual cai no legado.');
    });

    // === CASO 7: Isolamento cross-school (outra escola) ===
    it('Caso 7: Isolamento cross-school mantido', () => {
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        const crossCtx = { ...ctx, targetSchoolId: 'school_canoas_99' };
        const result = governanceService.can('ANALYTICS', 'VIEW', crossCtx, true, 'DASHBOARD');
        // Core decide FALSE (isolamento cross-school), mas flag ativa
        // Na verdade, como activeScopeType = UNIT e targetSchoolId != activeSchoolId, Core nega
        expect(result).toBe(false);
        console.log('✅ Caso 7: Isolamento cross-school mantido pelo Core.');
    });

    // === CASO 8: Kill Switch funciona em tempo real ===
    it('Caso 8: Kill Switch desliga e legado reassume', () => {
        governanceService.setAuthorityPilot(false);
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        const result = governanceService.can('ANALYTICS', 'VIEW', ctx, true, 'DASHBOARD');
        expect(result).toBe(true); // Legado
        expect(governanceService.getAuthorityPilotStatus().enabled).toBe(false);
        console.log('✅ Caso 8: Kill Switch desligou, legado reassumiu.');
        governanceService.setAuthorityPilot(true); // Re-ativa para próximos testes
    });

    // === CASO 9: Status do piloto reporta corretamente ===
    it('Caso 9: Status do Authority Pilot reporta estado correto', () => {
        const status = governanceService.getAuthorityPilotStatus();
        expect(status.enabled).toBe(true);
        expect(status.flagName).toBe('authority_pilot_analytics_readonly');
        expect(status.fallbackCount).toBe(0);
        console.log('✅ Caso 9: Status reporta: enabled=true, fallbacks=0.');
    });

    // === PERFORMANCE ===
    it('Performance: Authority Pilot (UNIT scope)', () => {
        const ctx = governanceService.resolveLegacyContext(PILOT_USER);
        const start = performance.now();
        for (let i = 0; i < 3000; i++) {
            governanceService.can('ANALYTICS', 'VIEW', ctx, true, 'DASHBOARD');
        }
        const end = performance.now();
        const avg = (end - start) / 3000;
        expect(avg).toBeLessThan(0.05);
        console.log(`🔵 Latência Authority Pilot (UNIT): ${avg.toFixed(4)}ms`);
    });
});
