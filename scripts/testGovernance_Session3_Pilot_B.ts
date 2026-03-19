import { governanceService, GovernanceContext } from '../services/governanceService';

async function runPilotB() {
    console.log("--- 🚀 AUTHORITY PILOT - SESSÃO 3B (MUNICIPAL) ---");
    
    // 1. Ativar o Kill Switch e Zerar Fallbacks
    governanceService.setAuthorityPilot(true);
    
    const pilotContext = {
        roleId: 'poa_admin',
        activeOrganizationId: 'poa_organization',
        activeMembershipId: 'mem_poa_admin_001',
        activeScopeType: 'ORG' as const,
    };

    const scenarios = [
        {
            step: "Passo 1: Acesso Dashboard Municipal",
            resource: 'ANALYTICS',
            action: 'VIEW',
            targetOrgId: 'poa_organization',
            expected: true
        },
        {
            step: "Passo 2: Ver Metadados Institucionais (POA)",
            resource: 'INSTITUTIONAL_METADATA',
            action: 'VIEW',
            targetOrgId: 'poa_organization',
            expected: true
        },
        {
            step: "Passo 3: Drill-down para Escola POA 1 (Legítimo)",
            resource: 'ANALYTICS',
            action: 'VIEW',
            targetOrgId: 'poa_organization',
            targetSchoolId: 'school_poa_1',
            expected: true
        },
        {
            step: "Passo 4: Bloqueio de Outro Município (Canoas)",
            resource: 'ANALYTICS',
            action: 'VIEW',
            targetOrgId: 'canoas_organization',
            expected: false
        },
        {
            step: "Passo 5: Bloqueio de Escola Externa (Canoas 99)",
            resource: 'ANALYTICS',
            action: 'VIEW',
            targetOrgId: 'poa_organization', // Tentando via contexto POA
            targetSchoolId: 'school_canoas_99',
            expected: false
        },
        {
            step: "Passo 6: Tentativa de Escrita (Fora da Whitelist)",
            resource: 'ANALYTICS',
            action: 'WRITE',
            targetOrgId: 'poa_organization',
            expected: false // Legacy deve negar ou Core ignorar
        }
    ];

    console.log(`\nIniciando Piloto para: ${pilotContext.roleId} em ${pilotContext.activeOrganizationId}\n`);

    const startTotal = performance.now();
    for (const sc of scenarios) {
        console.log(`[EXEC] ${sc.step}...`);
        console.log(`[CONTEXT LOG] [ActiveScope: ${pilotContext.activeScopeType}] [ActiveOrg: ${pilotContext.activeOrganizationId}] [TargetOrg: ${sc.targetOrgId}] [TargetSchool: ${sc.targetSchoolId || 'N/A'}]`);
        
        const start = performance.now();
        const result = await governanceService.can(
            sc.resource, 
            sc.action, 
            { ...pilotContext, targetOrganizationId: sc.targetOrgId, targetSchoolId: sc.targetSchoolId }, 
            false, // Legacy simulado como DENY para segurança
            'Session_3B_Pilot'
        );
        const end = performance.now();
        
        const success = result === sc.expected;
        console.log(`[RESULT] ${result ? '✅ ALLOW' : '⛔ DENY'} | Latência: ${(end - start).toFixed(4)}ms | Status: ${success ? 'OK' : 'FAIL'}`);
        console.log("-" .repeat(50));
    }
    const endTotal = performance.now();

    const status = governanceService.getAuthorityPilotStatus();
    console.log(`\n--- Sumário da Sessão 3B ---`);
    console.log(`Total Scenarios: ${scenarios.length}`);
    console.log(`Fallbacks: ${status.fallbackCount}`);
    console.log(`Enabled: ${status.enabled}`);
    console.log(`Tempo Total: ${(endTotal - startTotal).toFixed(2)}ms`);
    console.log(`--- FIM DA SESSÃO 3B ---\n`);
}

runPilotB().catch(console.error);
