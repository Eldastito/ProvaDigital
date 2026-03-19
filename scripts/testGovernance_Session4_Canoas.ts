import { governanceService } from '../services/governanceService';

async function runSession4Canoas() {
    console.log("--- 🚀 AUTHORITY PILOT - SESSÃO 4 (SIMETRIA MUNICIPAL - CANOAS) ---");
    
    // Ativar o Kill Switch e Zerar Fallbacks
    governanceService.setAuthorityPilot(true);
    
    // NOVO ATOR: Gestor Municipal de Canoas
    const pilotContext = {
        roleId: 'canoas_admin',
        activeOrganizationId: 'canoas_organization',
        activeMembershipId: 'mem_canoas_admin_001',
        activeScopeType: 'ORG' as const,
        organizationType: 'municipal_secretariat' as const,
    };

    const scenarios = [
        {
            step: "Passo 1: Acesso Dashboard Municipal (Canoas)",
            resource: 'ANALYTICS',
            action: 'VIEW',
            targetOrgId: pilotContext.activeOrganizationId,
            expected: true
        },
        {
            step: "Passo 2: Ver Metadados Institucionais (Canoas)",
            resource: 'INSTITUTIONAL_METADATA',
            action: 'VIEW',
            targetOrgId: pilotContext.activeOrganizationId,
            expected: true
        },
        {
            step: "Passo 3: Drill-down para Escola Canoas 99 (Legítimo)",
            resource: 'ANALYTICS',
            action: 'VIEW',
            targetOrgId: pilotContext.activeOrganizationId,
            targetSchoolId: 'school_canoas_99',
            expected: true
        },
        {
            step: "Passo 4: Bloqueio de Outro Município (POA)",
            resource: 'ANALYTICS',
            action: 'VIEW',
            targetOrgId: 'poa_organization',
            expected: false
        },
        {
            step: "Passo 5: Bloqueio de Escola Externa (POA 1)",
            resource: 'ANALYTICS',
            action: 'VIEW',
            targetOrgId: pilotContext.activeOrganizationId,
            targetSchoolId: 'school_poa_1',
            expected: false
        },
        {
            step: "Passo 6: Retorno ao Nível Municipal (Limpando Contexto)",
            resource: 'ANALYTICS',
            action: 'VIEW',
            targetOrgId: pilotContext.activeOrganizationId,
            targetSchoolId: null, // Reset contextual
            expected: true
        }
    ];

    console.log(`\nIniciando Simetria para: ${pilotContext.roleId} em ${pilotContext.activeOrganizationId}\n`);

    const startTotal = performance.now();
    for (const sc of scenarios) {
        console.log(`[EXEC] ${sc.step}...`);
        console.log(`[CONTEXT LOG] [ActiveScope: ${pilotContext.activeScopeType}] [ActiveOrg: ${pilotContext.activeOrganizationId}] [TargetOrg: ${sc.targetOrgId}] [TargetSchool: ${sc.targetSchoolId || 'N/A'}]`);
        
        const start = performance.now();
        const result = await governanceService.can(
            sc.resource, 
            sc.action, 
            { ...pilotContext, targetOrganizationId: sc.targetOrgId, targetSchoolId: sc.targetSchoolId as string }, 
            false, 
            'Session_4_Canoas'
        );
        const end = performance.now();
        
        const success = result === sc.expected;
        console.log(`[RESULT] ${result ? '✅ ALLOW' : '⛔ DENY'} | Latência: ${(end - start).toFixed(4)}ms | Status: ${success ? 'OK' : 'FAIL'}`);
        console.log("-" .repeat(50));
    }
    const endTotal = performance.now();

    const status = governanceService.getAuthorityPilotStatus();
    console.log(`\n--- Sumário da Sessão 4 (Canoas) ---`);
    console.log(`Total Scenarios: ${scenarios.length}`);
    console.log(`Fallbacks: ${status.fallbackCount}`);
    console.log(`Tempo Total: ${(endTotal - startTotal).toFixed(2)}ms`);
    console.log(`--- FIM DA SESSÃO 4 ---\n`);
}

runSession4Canoas().catch(console.error);
