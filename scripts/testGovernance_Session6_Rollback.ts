import { governanceService } from '../services/governanceService';

async function runSession6Rollback() {
    console.log("--- 🛡️ AUTHORITY PILOT - SESSÃO 6 (TESTE DE ROLLBACK MULTI-ORG) ---");
    
    // 1. Ativar modo Pilot
    governanceService.setAuthorityPilot(true);
    console.log("[ROLLBACK TEST] Pilot Ativado.");

    const context = {
        roleId: 'alvorada_admin',
        activeOrganizationId: 'alvorada_organization',
        activeMembershipId: 'mem_alvorada_admin',
        activeScopeType: 'ORG' as const,
        organizationType: 'municipal_secretariat' as const,
        targetOrganizationId: 'alvorada_organization'
    };

    // 2. Verificar decisão pelo Core
    const coreDecision = await governanceService.can('ANALYTICS', 'VIEW', context, false, 'Rollback_Test');
    console.log(`[STEP 1] Decisao Core (Pilot ON): ${coreDecision ? '✅ ALLOW' : '⛔ DENY'}`);

    // 3. TRIGGER ROLLBACK (Kill Switch)
    console.log("\n[!!!] ACIONANDO KILL SWITCH (EMERGENCIA) [!!!]");
    governanceService.setAuthorityPilot(false);

    // 4. Verificar decisão pelo Legado (Simulado via fallback ou override)
    // No nosso motor, can() retornará a decisão do legado se pilot estiver OFF.
    const legacyDecision = await governanceService.can('ANALYTICS', 'VIEW', context, false, 'Rollback_Test');
    console.log(`[STEP 2] Decisao Legado (Pilot OFF): ${legacyDecision ? '✅ ALLOW' : '⛔ DENY'}`);

    const status = governanceService.getAuthorityPilotStatus();
    console.log(`\n--- Sumário de Rollback ---`);
    console.log(`Pilot Status Final: ${status.enabled ? 'ON' : 'OFF'}`);
    console.log(`Rollback Seguro: ${!status.enabled && legacyDecision === false ? '✅ SIM (Legado negou conforme esperado)' : '⚠️ REVISAR'}`);
    console.log(`--- FIM DA SESSÃO 6 ---\n`);
}

runSession6Rollback().catch(console.error);
