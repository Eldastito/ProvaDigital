import { governanceService, GovernanceContext } from '../services/governanceService';

async function runRegression() {
    console.log("--- 🕵️ AUTHORITY PILOT - REGRESSÃO UNIT ---");

    // Simular ativação da flag (normalmente via LD)
    (governanceService as any).authorityPilotConfig.enabled = true;

    const unitContexts: any[] = [
        {
            label: "Acesso à própria escola (UNIT Legítimo)",
            roleId: 'school_manager',
            activeOrganizationId: 'poa_organization',
            activeSchoolId: 'school_poa_1',
            activeMembershipId: 'mem_1',
            activeScopeType: 'UNIT',
            targetSchoolId: 'school_poa_1',
            resource: 'ANALYTICS',
            action: 'VIEW',
            expected: true
        },
        {
            label: "Bloqueio de escola externa (UNIT Cross-school)",
            roleId: 'school_manager',
            activeOrganizationId: 'poa_organization',
            activeSchoolId: 'school_poa_1',
            activeMembershipId: 'mem_1',
            activeScopeType: 'UNIT',
            targetSchoolId: 'school_canoas_99',
            resource: 'ANALYTICS',
            action: 'VIEW',
            expected: false
        },
        {
            label: "Acesso a metadados da própria escola",
            roleId: 'school_manager',
            activeOrganizationId: 'poa_organization',
            activeSchoolId: 'school_poa_1',
            activeMembershipId: 'mem_1',
            activeScopeType: 'UNIT',
            targetOrganizationId: 'poa_organization',
            targetSchoolId: 'school_poa_1',
            resource: 'INSTITUTIONAL_METADATA',
            action: 'VIEW',
            expected: true
        },
        {
            label: "Bloqueio de recurso fora da whitelist (WRITE)",
            roleId: 'school_manager',
            activeOrganizationId: 'poa_organization',
            activeSchoolId: 'school_poa_1',
            activeMembershipId: 'mem_1',
            activeScopeType: 'UNIT',
            targetSchoolId: 'school_poa_1',
            resource: 'ANALYTICS',
            action: 'WRITE',
            legacyOverride: false,
            expected: false
        }
    ];

    let passed = 0;
    for (const ctx of unitContexts) {
        const { label, expected, resource, action, legacyOverride, ...context } = ctx;
        // Se legacyOverride for fornecido, usamos ele. Caso contrário, usamos !expected para forçar o Core.
        const legacyDecision = legacyOverride !== undefined ? legacyOverride : !expected;
        const result = await governanceService.can(resource, action, context as any, legacyDecision, 'UNIT_REGRESSION');
        const success = result === expected;
        if (success) passed++;
        
        console.log(`${success ? '✅' : '❌'} ${label}: ${result ? 'ALLOW' : 'DENY'} (Esperado: ${expected ? 'ALLOW' : 'DENY'})`);
    }

    console.log(`\nResultado Final: ${passed}/${unitContexts.length} testes passados.`);
    
    if (passed === unitContexts.length) {
        console.log("🎉 REGRESSÃO UNIT OK!");
        process.exit(0);
    } else {
        console.log("⚠️ FALHA NA REGRESSÃO!");
        process.exit(1);
    }
}

runRegression().catch(err => {
    console.error(err);
    process.exit(1);
});
