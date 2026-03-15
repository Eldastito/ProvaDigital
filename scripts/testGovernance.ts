
import { governanceService, GovernanceContext } from '../services/governanceService';
import { UserRole, Resource, Action } from '../types';

console.log('--- 🧪 ONDA 1 - STAGING CONTROLADO (SHADOW MODE) ---');
console.log('Baseline Commit: frozen');

const simulateJourney = (actor: string, user: any, tests: { resource: string, action: string, surface: string, legacy: boolean, targetSchool?: string, targetOrg?: string }[]) => {
    console.log(`\n>>> Ator: ${actor} [Role: ${user.role}]`);
    const context = governanceService.resolveLegacyContext(user);
    
    tests.forEach(t => {
        // Mock do Hotfix Legado
        let correctedLegacy = t.legacy;
        if (user.role === UserRole.PAIS && t.resource === 'STUDENT_DATA' && t.targetSchool !== user.schoolId) {
            correctedLegacy = false; // Hotfix aplicado: Bloqueia cross-school
        }

        const customContext: Partial<GovernanceContext> = {};
        if (t.targetSchool) customContext.targetSchoolId = t.targetSchool;
        if (t.targetOrg) customContext.targetOrganizationId = t.targetOrg;

        governanceService.can(t.resource, t.action, { ...context, ...customContext }, correctedLegacy, t.surface);
    });
};

// 1. GESTOR MUNICIPAL 1 (POA) -> CROSS-TENANT NEGATIVE
simulateJourney('Gestor POA', {
    id: 'poa_admin',
    role: UserRole.TENANT_ADMIN,
    tenantId: 'poa_municipality'
}, [
    { resource: 'SCHOOL_DATA', action: 'VIEW', surface: 'Sidebar', legacy: true, targetOrg: 'poa_municipality' },
    { resource: 'SCHOOL_DATA', action: 'VIEW', surface: 'ProtectedRoute', legacy: false, targetOrg: 'canoas_municipality' } // Tentando ver Canoas
]);

// 2. PROFESSOR MULTI-ESCOLA -> CONTEXT SWITCH
simulateJourney('Prof Multi (Escola A)', {
    id: 'prof_multi',
    role: UserRole.PROFESSOR,
    tenantId: 'poa_municipality',
    schoolId: 'school_a'
}, [
    { resource: 'ITEM_BANK', action: 'VIEW', surface: 'Sidebar', legacy: true, targetSchool: 'school_a' },
    { resource: 'TURMAS', action: 'VIEW', surface: 'ProtectedRoute', legacy: true, targetSchool: 'school_a' }
]);

simulateJourney('Prof Multi (Escola B)', {
    id: 'prof_multi',
    role: UserRole.PROFESSOR,
    tenantId: 'poa_municipality',
    schoolId: 'school_b'
}, [
    { resource: 'ITEM_BANK', action: 'VIEW', surface: 'Sidebar', legacy: true, targetSchool: 'school_b' },
    // Teste Cross-School (Professor Escola B tentando ver Escola A)
    { resource: 'TURMAS', action: 'VIEW', surface: 'ProtectedRoute', legacy: true, targetSchool: 'school_a' }
]);

// 3. PAI / RESPONSÁVEL -> GUARDIAN NEGATIVE TEST
simulateJourney('Responsável (Aluno A)', {
    id: 'guardian_a',
    role: UserRole.PAIS,
    tenantId: 'poa_municipality',
    schoolId: 'school_a'
}, [
    { resource: 'STUDENT_DATA' as any, action: 'VIEW', surface: 'Sidebar', legacy: true }, // Vendo Aluno A
    // Tenta ver Aluno B (Deveria ser CRITICAL se o legado permitir incorretamente)
    { resource: 'STUDENT_DATA' as any, action: 'VIEW', surface: 'ProtectedRoute', legacy: true, targetSchool: 'school_b' }
]);

// 4. LEGADO SEM MEMBERSHIP COMPLETO
simulateJourney('Legado Incompleto (Supervisor)', {
    id: 'legacy_only',
    role: UserRole.SUPERVISOR,
    tenantId: 'poa_municipality'
}, [
    { resource: 'SCHOOL_DATA', action: 'VIEW', surface: 'Sidebar', legacy: true }
]);

// 5. REDE PRIVADA
simulateJourney('Diretor Privado', {
    id: 'diretor_priv',
    role: UserRole.DIRETOR,
    tenantId: 'private_group_x',
    schoolId: 'elite_school'
}, [
    { resource: 'SCHOOL_DATA', action: 'VIEW', surface: 'Sidebar', legacy: true }
]);

console.log('\n--- Fim da Simulação Onda 1 ---');
