
import { governanceService, GovernanceContext } from '../services/governanceService';
import { UserRole, Resource, Action } from '../types';

console.log('--- 🧪 SIMULAÇÃO DE SHADOW MODE (RELATÓRIO INICIAL) ---');

const simulateAudit = (profileName: string, user: any, tests: { resource: Resource, action: Action, surface: string, legacy: boolean }[]) => {
    console.log(`\n>>> Perfil: ${profileName} [${user.role}]`);
    const context = governanceService.resolveLegacyContext(user);
    
    tests.forEach(t => {
        // can() no service agora aceita legacyDecision e surface
        governanceService.can(t.resource, t.action, context, t.legacy, t.surface);
    });
};

// 1. ADMIN DA PLATAFORMA (Expectativa: Alinhado)
simulateAudit('Admin Master', {
    id: 'admin_1',
    role: UserRole.MASTER_SAAS,
    tenantId: 'saas_default'
}, [
    { resource: 'SYSTEM_MGMT', action: 'VIEW', surface: 'Sidebar', legacy: true },
    { resource: 'FINANCIAL', action: 'EDIT', surface: 'ProtectedRoute', legacy: true }
]);

// 2. DIRETOR DE ESCOLA (Expectativa: Divergência por Escopo em Cross-School)
simulateAudit('Gestor Escolar', {
    id: 'gestor_1',
    role: UserRole.DIRETOR,
    tenantId: 'municipal_a',
    schoolId: 'school_primary'
}, [
    { resource: 'SCHOOL_DATA', action: 'VIEW', surface: 'Sidebar', legacy: true },
    // Simulação de acesso a outra escola (Divergência)
    { resource: 'SCHOOL_DATA', action: 'VIEW', surface: 'ProtectedRoute', legacy: true } 
]);

// 3. PROFESSOR (Expectativa: Alinhado em ferramentas básicas)
simulateAudit('Professor', {
    id: 'prof_1',
    role: UserRole.PROFESSOR,
    tenantId: 'municipal_a',
    schoolId: 'school_primary'
}, [
    { resource: 'ITEM_BANK', action: 'VIEW', surface: 'Sidebar', legacy: true },
    { resource: 'ITEM_BANK', action: 'CREATE', surface: 'Sidebar', legacy: true }
]);

// 4. TESTE DE DEDUPLICAÇÃO (Gate 2)
console.log('\n[DEDUPLICAÇÃO] Rodando mesma chamada 3x para verificar controle de volume...');
const repeatUser = { id: 'repeat', role: UserRole.PROFESSOR, tenantId: 'a' };
const repeatContext = governanceService.resolveLegacyContext(repeatUser as any);
// Fazendo chamadas repetidas que divergem (se divergissem, seriam logadas apenas uma vez)
governanceService.can('ANALYTICS' as any, 'VIEW', repeatContext, false, 'Sidebar'); 
governanceService.can('ANALYTICS' as any, 'VIEW', repeatContext, false, 'Sidebar');
governanceService.can('ANALYTICS' as any, 'VIEW', repeatContext, false, 'Sidebar');

console.log('\n--- Fim da Simulação ---');
console.log('Nota: Verifique os logs de [GOVERNANCE AUDIT] acima.');
