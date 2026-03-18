
import { governanceService, GovernanceContext } from '../services/governanceService';
import { UserRole } from '../types';

console.log('--- 🧪 AUTHORITY PILOT - SESSÃO 2 (REPETIBILIDADE UNIT) ---');
console.log('Baseline: GLOBAL v4 | Tag: onda-2-global-freeze-v4');

// Ativa a flag apenas para a duração deste teste (Operacional)
governanceService.setAuthorityPilot(true);

const simulateJourney = (actor: string, user: any, tests: { resource: string, action: string, surface: string, legacy: boolean, targetSchool?: string, targetOrg?: string }[]) => {
    console.log(`\n>>> Ator: ${actor} [Role: ${user.role}] [School: ${user.schoolId}]`);
    const context = governanceService.resolveLegacyContext(user);
    
    tests.forEach(t => {
        const customContext: Partial<GovernanceContext> = {};
        if (t.targetSchool) customContext.targetSchoolId = t.targetSchool;
        if (t.targetOrg) customContext.targetOrganizationId = t.targetOrg;

        const decision = governanceService.can(t.resource, t.action, { ...context, ...customContext }, t.legacy, t.surface);
        console.log(`Result [${t.resource}:${t.action}] (Target: ${t.targetSchool || 'self'}): ${decision ? '✅ ALLOW' : '❌ DENY'}`);
    });
};

// 1. GESTOR ESCOLAR CANOAS 99 (Unidade diferente da Sessão 1)
const gestorCanoas = {
    id: 'gestor_escola_canoas99',
    role: UserRole.DIRETOR,
    tenantId: 'canoas_organization',
    schoolId: 'school_canoas_99'
};

console.log('\n--- Cenários Whitelisted (Core Autoridade) ---');
simulateJourney('Gestor Canoas 99', gestorCanoas, [
    { resource: 'ANALYTICS', action: 'VIEW', surface: 'Dashboard', legacy: true },
    { resource: 'SCHOOL_AGGREGATE_DATA', action: 'VIEW', surface: 'Sidebar', legacy: true },
    { resource: 'INSTITUTIONAL_METADATA', action: 'VIEW', surface: 'Settings', legacy: true }
]);

console.log('\n--- Cenário Cross-School (Isolamento Core) ---');
simulateJourney('Gestor Canoas 99', gestorCanoas, [
    // Tentando ver escola POA 1 (Sessão 1)
    { resource: 'ANALYTICS', action: 'VIEW', surface: 'ProtectedRoute', legacy: true, targetSchool: 'school_poa_1' }
]);

console.log('\n--- Cenários Fora de Escopo (Legado Autoridade) ---');
simulateJourney('Gestor Canoas 99', gestorCanoas, [
    // Escrita não é whitelisted no Core (deve cair no legado)
    { resource: 'ANALYTICS', action: 'WRITE', surface: 'Dashboard', legacy: false },
    // Dado individual na denied list (deve cair no legado)
    { resource: 'STUDENT_PEDAGOGICAL_DATA', action: 'VIEW', surface: 'Report', legacy: false }
]);

console.log('\n--- Teste de Kill Switch ---');
governanceService.setAuthorityPilot(false);
console.log('Kill Switch: OFF');
simulateJourney('Gestor Canoas 99', gestorCanoas, [
    // Mesmo sendo whitelisted, o kill switch off deve fazer com que o Core NÃO decida (Shadow Mode)
    // Mas no Shadow Mode ele audita, e can() retorna o legado.
    { resource: 'ANALYTICS', action: 'VIEW', surface: 'Dashboard', legacy: true }
]);

console.log('\n--- Fim da Simulação Sessão 2 ---');
governanceService.setAuthorityPilot(false); // Reset final
