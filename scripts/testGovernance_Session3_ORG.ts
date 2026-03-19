
import { governanceService, GovernanceContext } from '../services/governanceService';
import { UserRole } from '../types';

console.log('--- 🧪 AUTHORITY PILOT - SESSÃO 3A (TECNICAL SIMULATION ORG) ---');
console.log('Baseline: GLOBAL v4 | Tag: onda-2-global-freeze-v4');

// Ativa a flag apenas para a duração deste teste (Operacional)
governanceService.setAuthorityPilot(true);

const logContext = (ctx: GovernanceContext, targetOrg?: string, targetSchool?: string) => {
    console.log(`[CONTEXT LOG] [ActiveScope: ${ctx.activeScopeType}] [ActiveOrg: ${ctx.activeOrganizationId}] [ActiveSchool: ${ctx.activeSchoolId || 'null'}] [TargetOrg: ${targetOrg || 'null'}] [TargetSchool: ${targetSchool || 'null'}]`);
};

const simulateStep = (actor: string, user: any, t: { resource: string, action: string, surface: string, legacy: boolean, targetSchool?: string, targetOrg?: string }, currentContextOverride?: Partial<GovernanceContext>) => {
    const baseContext = governanceService.resolveLegacyContext(user);
    const context = { ...baseContext, ...currentContextOverride };
    
    const customContext: Partial<GovernanceContext> = {};
    if (t.targetSchool) customContext.targetSchoolId = t.targetSchool;
    if (t.targetOrg) customContext.targetOrganizationId = t.targetOrg;

    logContext({ ...context, ...customContext }, t.targetOrg, t.targetSchool);
    const decision = governanceService.can(t.resource, t.action, { ...context, ...customContext }, t.legacy, t.surface);
    console.log(`Result [${t.resource}:${t.action}] (Surface: ${t.surface}): ${decision ? '✅ ALLOW' : '❌ DENY'}`);
    return decision;
};

// 1. GESTOR MUNICIPAL POA
const poaAdmin = {
    id: 'poa_admin',
    role: UserRole.TENANT_ADMIN,
    tenantId: 'poa_organization',
    // No nível municipal, schoolId é indefinido
    schoolId: undefined 
};

console.log('\n--- Passo 1: Acesso Municipal (Nível ORG) ---');
simulateStep('Gestor POA', poaAdmin, { 
    resource: 'ANALYTICS', 
    action: 'VIEW', 
    surface: 'MunicipalDashboard', 
    legacy: true,
    targetOrg: 'poa_organization'
});

console.log('\n--- Passo 2: Metadados Institucionais (Nível ORG) ---');
simulateStep('Gestor POA', poaAdmin, { 
    resource: 'INSTITUTIONAL_METADATA', 
    action: 'VIEW', 
    surface: 'Settings', 
    legacy: true,
    targetOrg: 'poa_organization'
});

console.log('\n--- Passo 3: Drill-down para Escola Subordinada (Nível UNIT) ---');
// Simulando transição de contexto
const drillDownContext: Partial<GovernanceContext> = {
    activeSchoolId: 'school_poa_1',
    activeScopeType: 'UNIT'
};
simulateStep('Gestor POA', poaAdmin, { 
    resource: 'ANALYTICS', 
    action: 'VIEW', 
    surface: 'Dashboard', 
    legacy: true,
    targetSchool: 'school_poa_1'
}, drillDownContext);

console.log('\n--- Passo 4: Retorno ao Nível Municipal (Limpeza de Contexto) ---');
// Verificando se o contexto volta ao normal no nível ORG
simulateStep('Gestor POA', poaAdmin, { 
    resource: 'ANALYTICS', 
    action: 'VIEW', 
    surface: 'MunicipalDashboard', 
    legacy: true,
    targetOrg: 'poa_organization'
});

console.log('\n--- Passo 5: Isolamento Intermunicipal (Org) ---');
simulateStep('Gestor POA', poaAdmin, { 
    resource: 'ANALYTICS', 
    action: 'VIEW', 
    surface: 'MunicipalityPicker', 
    legacy: true,
    targetOrg: 'canoas_organization'
});

console.log('\n--- Passo 6: Isolamento Intermunicipal (Escola de outro município) ---');
simulateStep('Gestor POA', poaAdmin, { 
    resource: 'ANALYTICS', 
    action: 'VIEW', 
    surface: 'ProtectedRoute', 
    legacy: true,
    targetSchool: 'school_canoas_99'
});

console.log('\n--- Passo 7: Fora de Escopo Whitelist (Escrita) ---');
simulateStep('Gestor POA', poaAdmin, { 
    resource: 'ANALYTICS', 
    action: 'WRITE', 
    surface: 'MunicipalDashboard', 
    legacy: false
});

console.log('\n--- Passo 8: Fora de Escopo Denied List (Pedagógico Individual) ---');
simulateStep('Gestor POA', poaAdmin, { 
    resource: 'STUDENT_PEDAGOGICAL_DATA', 
    action: 'VIEW', 
    surface: 'StudentProfile', 
    legacy: false
});

console.log('\n--- Passo 9: Kill Switch ---');
governanceService.setAuthorityPilot(false);
console.log('Kill Switch: OFF');
simulateStep('Gestor POA', poaAdmin, { 
    resource: 'ANALYTICS', 
    action: 'VIEW', 
    surface: 'MunicipalDashboard', 
    legacy: true,
    targetOrg: 'poa_organization'
});

console.log('\n--- Fim da Simulação Sessão 3A ---');
governanceService.setAuthorityPilot(false);
